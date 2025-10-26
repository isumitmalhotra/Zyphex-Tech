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
    const search = searchParams.get('search')

    // Build where conditions - find projects where user is a team member
    const whereConditions: Record<string, unknown> = {
      deletedAt: null,
      OR: [
        // User is assigned via TeamMember relation
        {
          team: {
            some: {
              userId: user.id,
              isActive: true
            }
          }
        },
        // User is assigned via Project.users relation
        {
          users: {
            some: {
              id: user.id
            }
          }
        }
      ]
    }

    if (status && status !== 'ALL') {
      whereConditions.status = status
    }

    if (search) {
      whereConditions.AND = [
        { OR: whereConditions.OR },
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } }
          ]
        }
      ]
      delete whereConditions.OR
    }

    // Fetch projects where user is a team member
    const projects = await prisma.project.findMany({
      where: whereConditions,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        manager: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
            assigneeId: true,
            estimatedHours: true,
            actualHours: true
          }
        },
        teamMembers: {
          where: {
            isActive: true
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            tasks: true,
            documents: true
          }
        }
      },
      orderBy: [
        { status: 'asc' },
        { startDate: 'desc' }
      ]
    })

    // Calculate statistics
    const stats = {
      total: projects.length,
      active: projects.filter(p => p.status === 'IN_PROGRESS').length,
      planning: projects.filter(p => p.status === 'PLANNING').length,
      onHold: projects.filter(p => p.status === 'ON_HOLD').length,
      completed: projects.filter(p => p.status === 'COMPLETED').length,
      myTasks: projects.reduce((sum, p) => sum + p.tasks.length, 0),
      myTasksCompleted: projects.reduce((sum, p) => {
        return sum + p.tasks.filter(t => t.status === 'DONE').length
      }, 0)
    }

    // Calculate task completion percentage for each project
    const projectsWithProgress = projects.map(project => {
      const myTasks = project.tasks
      const completedTasks = myTasks.filter(t => t.status === 'DONE').length
      const progress = myTasks.length > 0 
        ? Math.round((completedTasks / myTasks.length) * 100)
        : 0

      return {
        ...project,
        progress,
        myTaskCount: myTasks.length,
        myCompletedTasks: completedTasks
      }
    })

    return NextResponse.json({
      projects: projectsWithProgress,
      stats,
      success: true
    })

  } catch (error) {
    console.error('Error fetching team member projects:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
