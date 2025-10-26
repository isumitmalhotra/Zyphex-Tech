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
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const projectId = searchParams.get('projectId')
    const search = searchParams.get('search')

    // Build where conditions
    const whereConditions: Record<string, unknown> = {
      assigneeId: user.id,
      deletedAt: null
    }

    if (status && status !== 'ALL') {
      whereConditions.status = status
    }

    if (priority && priority !== 'ALL') {
      whereConditions.priority = priority
    }

    if (projectId) {
      whereConditions.projectId = projectId
    }

    if (search) {
      whereConditions.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Fetch tasks assigned to the team member
    const tasks = await prisma.task.findMany({
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
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            timeEntries: true
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    // Calculate statistics
    const stats = {
      total: tasks.length,
      todo: tasks.filter(t => t.status === 'TODO').length,
      inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
      review: tasks.filter(t => t.status === 'REVIEW').length,
      testing: tasks.filter(t => t.status === 'TESTING').length,
      done: tasks.filter(t => t.status === 'DONE').length,
      cancelled: tasks.filter(t => t.status === 'CANCELLED').length,
      highPriority: tasks.filter(t => t.priority === 'HIGH' || t.priority === 'URGENT').length,
      overdue: tasks.filter(t => {
        if (!t.dueDate || t.status === 'DONE') return false
        return new Date(t.dueDate) < new Date()
      }).length,
      completedThisWeek: tasks.filter(t => {
        if (t.status !== 'DONE' || !t.completedAt) return false
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return new Date(t.completedAt) >= weekAgo
      }).length
    }

    // Calculate total hours
    const totalEstimated = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0)
    const totalActual = tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0)

    return NextResponse.json({
      tasks,
      stats,
      hours: {
        estimated: totalEstimated,
        actual: totalActual,
        remaining: Math.max(0, totalEstimated - totalActual)
      },
      success: true
    })

  } catch (error) {
    console.error('Error fetching team member tasks:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT - Update task status or other fields
export async function PUT(request: NextRequest) {
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

    const { id, status, actualHours, notes } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      )
    }

    // Verify the task is assigned to this user
    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        assigneeId: user.id,
        deletedAt: null
      }
    })

    if (!existingTask) {
      return NextResponse.json(
        { error: "Task not found or not assigned to you" },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      updatedAt: new Date()
    }

    if (status) {
      updateData.status = status
      if (status === 'DONE') {
        updateData.completedAt = new Date()
      }
    }

    if (actualHours !== undefined) {
      updateData.actualHours = actualHours
    }

    // Update the task
    const task = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE',
        entityType: 'TASK',
        entityId: task.id,
        changes: JSON.stringify({
          status,
          actualHours,
          notes
        })
      }
    })

    return NextResponse.json({
      success: true,
      task
    })

  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
