import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user || (user.role !== 'TEAM_MEMBER' && user.role !== 'PROJECT_MANAGER')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build where conditions
    const whereConditions: Record<string, unknown> = {
      userId: user.id
    }

    if (projectId) {
      whereConditions.projectId = projectId
    }

    if (status && status !== 'ALL') {
      whereConditions.status = status
    }

    if (startDate || endDate) {
      whereConditions.date = {}
      if (startDate) {
        (whereConditions.date as Record<string, unknown>).gte = new Date(startDate)
      }
      if (endDate) {
        (whereConditions.date as Record<string, unknown>).lte = new Date(endDate)
      }
    }

    // Fetch time entries
    const timeEntries = await prisma.timeEntry.findMany({
      where: whereConditions,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true,
            client: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        task: {
          select: {
            id: true,
            title: true,
            status: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    })

    // Calculate statistics
    const totalHours = timeEntries.reduce((sum, entry) => sum + entry.hours, 0)
    const billableHours = timeEntries
      .filter(entry => entry.billable)
      .reduce((sum, entry) => sum + entry.hours, 0)
    
    const stats = {
      total: timeEntries.length,
      totalHours,
      billableHours,
      nonBillableHours: totalHours - billableHours,
      statusBreakdown: {
        draft: timeEntries.filter(e => e.status === 'DRAFT').length,
        submitted: timeEntries.filter(e => e.status === 'SUBMITTED').length,
        approved: timeEntries.filter(e => e.status === 'APPROVED').length,
        rejected: timeEntries.filter(e => e.status === 'REJECTED').length
      },
      totalRevenue: 0, // Calculate based on approved billable hours if hourlyRate available
      thisWeek: timeEntries.filter(entry => {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return new Date(entry.date) >= weekAgo
      }).reduce((sum, entry) => sum + entry.hours, 0),
      byProject: timeEntries.reduce((acc, entry) => {
        const projectName = entry.project?.name || 'Unknown'
        if (!acc[projectName]) {
          acc[projectName] = { hours: 0, entries: 0 }
        }
        acc[projectName].hours += entry.hours
        acc[projectName].entries += 1
        return acc
      }, {} as Record<string, { hours: number; entries: number }>)
    }

    return NextResponse.json({
      timeEntries,
      stats,
      success: true
    })

  } catch (error) {
    console.error('Error fetching time entries:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - Create new time entry
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user || (user.role !== 'TEAM_MEMBER' && user.role !== 'PROJECT_MANAGER')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const {
      projectId,
      taskId,
      date,
      hours,
      description,
      billable
    } = await request.json()

    if (!projectId || !date || !hours || hours <= 0) {
      return NextResponse.json(
        { error: "Project, date, and valid hours are required" },
        { status: 400 }
      )
    }

    // Verify project access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { users: { some: { id: user.id } } },
          { teamMembers: { some: { userId: user.id, isActive: true } } }
        ]
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or access denied" },
        { status: 403 }
      )
    }

    // Get user's hourly rate (from TeamMember or User)
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        userId: user.id,
        projectId: projectId,
        isActive: true
      },
      select: {
        hourlyRate: true
      }
    })

    const rate = teamMember?.hourlyRate || user.hourlyRate || project.hourlyRate || 0
    const amount = hours * rate

    // Create time entry
    const timeEntry = await prisma.timeEntry.create({
      data: {
        userId: user.id,
        projectId,
        taskId: taskId || null,
        date: new Date(date),
        hours,
        description: description || '',
        billable: billable !== undefined ? billable : true,
        rate,
        amount,
        status: 'DRAFT'
      },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        },
        task: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        entityType: 'TIME_ENTRY',
        entityId: timeEntry.id,
        changes: JSON.stringify({
          projectId,
          hours,
          date,
          billable
        })
      }
    })

    return NextResponse.json({
      success: true,
      timeEntry
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating time entry:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT - Update time entry
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { id, ...updateData } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: "Time entry ID is required" },
        { status: 400 }
      )
    }

    // Verify entry exists and belongs to user (and is not approved)
    const existingEntry = await prisma.timeEntry.findFirst({
      where: {
        id,
        userId: user.id,
        status: { not: 'APPROVED' }
      }
    })

    if (!existingEntry) {
      return NextResponse.json(
        { error: "Time entry not found or cannot be edited" },
        { status: 404 }
      )
    }

    // Recalculate rate and amount if hours changed
    let rate = existingEntry.rate
    let amount = existingEntry.amount

    if (updateData.hours && updateData.hours !== existingEntry.hours) {
      // Get fresh rate information
      const teamMember = await prisma.teamMember.findFirst({
        where: {
          userId: user.id,
          projectId: existingEntry.projectId || undefined,
          isActive: true
        },
        select: {
          hourlyRate: true
        }
      })

      if (existingEntry.projectId) {
        const project = await prisma.project.findUnique({
          where: { id: existingEntry.projectId },
          select: { hourlyRate: true }
        })
        rate = teamMember?.hourlyRate || user.hourlyRate || project?.hourlyRate || 0
      } else {
        rate = teamMember?.hourlyRate || user.hourlyRate || 0
      }

      amount = updateData.hours * rate
    }

    // Update time entry
    const timeEntry = await prisma.timeEntry.update({
      where: { id },
      data: {
        ...updateData,
        rate,
        amount,
        updatedAt: new Date()
      },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      timeEntry
    })

  } catch (error) {
    console.error('Error updating time entry:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE - Delete time entry
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: "Time entry ID is required" },
        { status: 400 }
      )
    }

    // Verify the time entry belongs to this user and is not approved
    const existingEntry = await prisma.timeEntry.findFirst({
      where: {
        id,
        userId: user.id,
        status: { not: 'APPROVED' }
      }
    })

    if (!existingEntry) {
      return NextResponse.json(
        { error: "Time entry not found or cannot be deleted" },
        { status: 404 }
      )
    }

    // Delete the entry
    await prisma.timeEntry.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: "Time entry deleted successfully"
    })

  } catch (error) {
    console.error('Error deleting time entry:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
