import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Helper function to calculate project progress based on status
function calculateProjectProgress(status: string): number {
  switch (status) {
    case 'PLANNING': return 10
    case 'IN_PROGRESS': return 50
    case 'REVIEW': return 80
    case 'COMPLETED': return 100
    case 'ON_HOLD': return 25
    default: return 0
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30' // Default to 30 days
    const periodDays = parseInt(period)
    
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - periodDays)

    // Fetch user with their projects
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        projects: {
          include: {
            client: true,
          },
          orderBy: {
            updatedAt: 'desc'
          }
        },
        _count: {
          select: {
            projects: {
              where: {
                status: {
                  in: ['PLANNING', 'IN_PROGRESS', 'REVIEW']
                }
              }
            }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Calculate project statistics
    const activeProjects = user.projects.filter(p => 
      ['PLANNING', 'IN_PROGRESS', 'REVIEW'].includes(p.status)
    ).length

    const completedProjects = user.projects.filter(p => 
      p.status === 'COMPLETED'
    ).length

    // Fetch additional real data for dashboard with time filtering
    const [
      tasks,
      messages,
      invoices,
      documents,
      recentActivity,
      timeEntries
    ] = await Promise.all([
      // Get user's tasks
      prisma.task.findMany({
        where: {
          OR: [
            { assigneeId: user.id },
            { createdBy: user.id },
            { project: { users: { some: { id: user.id } } } }
          ],
          updatedAt: {
            gte: startDate
          }
        },
        include: {
          project: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),

      // Get unread messages count
      prisma.message.findMany({
        where: {
          receiverId: user.id,
          readAt: null,
          createdAt: {
            gte: startDate
          }
        }
      }),

      // Get recent invoices
      prisma.invoice.findMany({
        where: {
          project: {
            users: {
              some: { id: user.id }
            }
          },
          createdAt: {
            gte: startDate
          }
        },
        include: {
          payments: {
            select: {
              amount: true,
              processedAt: true,
              status: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),

      // Get recent documents
      prisma.document.findMany({
        where: {
          OR: [
            { userId: user.id },
            { project: { users: { some: { id: user.id } } } }
          ],
          createdAt: {
            gte: startDate
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),

      // Get real activity data (recent tasks, messages, etc.)
      prisma.task.findMany({
        where: {
          OR: [
            { assigneeId: user.id },
            { createdBy: user.id }
          ],
          updatedAt: {
            gte: startDate
          }
        },
        include: {
          project: { select: { name: true } }
        },
        orderBy: { updatedAt: 'desc' },
        take: 5
      }),

      // Get time entries for productivity tracking
      prisma.timeEntry.findMany({
        where: {
          userId: user.id,
          createdAt: {
            gte: startDate
          }
        },
        include: {
          task: {
            select: {
              title: true,
              project: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      })
    ])

    // Calculate comprehensive task statistics
    const taskStats = {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'DONE').length,
      inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
      todo: tasks.filter(t => t.status === 'TODO').length,
      overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE').length,
      highPriority: tasks.filter(t => t.priority === 'HIGH').length
    }

    // Calculate invoice statistics
    const invoiceStats = {
      total: invoices.length,
      totalAmount: invoices.reduce((sum, inv) => sum + inv.amount, 0),
      paidAmount: invoices.reduce((sum, inv) => {
        const paid = inv.payments.reduce((paidSum: number, payment: any) => paidSum + payment.amount, 0)
        return sum + paid
      }, 0),
      pendingAmount: 0, // Will calculate below
      overdue: invoices.filter(inv => inv.dueDate && new Date(inv.dueDate) < new Date() && inv.status === 'OVERDUE').length
    }
    invoiceStats.pendingAmount = invoiceStats.totalAmount - invoiceStats.paidAmount

    // Calculate time tracking statistics
    const timeStats = {
      totalHours: timeEntries.reduce((sum, entry) => sum + entry.hours, 0),
      totalEntries: timeEntries.length,
      avgHoursPerDay: timeEntries.length > 0 
        ? Math.round((timeEntries.reduce((sum, entry) => sum + entry.hours, 0) / periodDays) * 100) / 100
        : 0
    }

    // Build activity feed from real data
    const activityFeed = recentActivity.map(task => ({
      type: 'task',
      title: `Task "${task.title}" ${task.status.toLowerCase()}`,
      time: task.updatedAt,
      project: task.project?.name,
      icon: task.status === 'DONE' ? 'CheckCircle' : 
            task.status === 'IN_PROGRESS' ? 'Clock' : 'Circle',
      color: task.status === 'DONE' ? 'text-green-400' : 
             task.status === 'IN_PROGRESS' ? 'text-blue-400' : 'text-gray-400'
    }))

    // Upcoming deadlines
    const upcomingDeadlines = [
      ...tasks
        .filter(t => t.dueDate && new Date(t.dueDate) > new Date())
        .map(t => ({
          type: 'task',
          title: t.title,
          dueDate: t.dueDate!,
          project: t.project?.name
        })),
      ...user.projects
        .filter(p => p.endDate && new Date(p.endDate) > new Date())
        .map(p => ({
          type: 'project',
          title: p.name,
          dueDate: p.endDate!,
          project: null
        }))
    ].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5)

    // Real dashboard data with standardized response format
    const dashboardData = {
      user: {
        id: user.id,
        name: user.name || 'User',
        email: user.email,
        image: user.image,
        role: user.role
      },
      stats: {
        activeProjects: activeProjects,
        completedProjects: completedProjects,
        messages: messages.length,
        nextMeeting: null // TODO: Implement meetings functionality
      },
      projects: user.projects.slice(0, 10).map(project => ({
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        client: project.client?.name || 'No Client',
        startDate: project.startDate,
        endDate: project.endDate,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
        progress: calculateProjectProgress(project.status),
        priority: project.priority || 'MEDIUM'
      })),
      recentActivity: activityFeed.length > 0 ? activityFeed : [
        {
          type: 'info',
          title: 'Welcome to your dashboard!',
          time: new Date().toISOString(),
          icon: 'CheckCircle',
          color: 'text-green-400'
        }
      ],
      overview: {
        projects: {
          total: user.projects.length,
          active: activeProjects,
          completed: completedProjects,
          onHold: user.projects.filter(p => p.status === 'ON_HOLD').length
        },
        tasks: taskStats,
        invoices: invoiceStats,
        messages: {
          total: messages.length,
          unread: messages.length
        },
        documents: {
          total: documents.length,
          totalSize: documents.reduce((sum, doc) => sum + doc.fileSize, 0)
        },
        timeTracking: timeStats
      },
      recentData: {
        projects: user.projects.slice(0, 3).map(project => ({
          id: project.id,
          name: project.name,
          description: project.description,
          status: project.status,
          client: project.client.name,
          startDate: project.startDate,
          endDate: project.endDate,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
          progress: project.status === 'COMPLETED' ? 100 :
                   project.status === 'REVIEW' ? 90 :
                   project.status === 'IN_PROGRESS' ? 60 :
                   project.status === 'PLANNING' ? 25 : 0
        })),
        tasks: tasks.slice(0, 5).map(task => ({
          id: task.id,
          title: task.title,
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate,
          project: task.project?.name,
          progress: task.progress
        })),
        messages: messages.slice(0, 3).map(msg => ({
          id: msg.id,
          content: msg.content.substring(0, 100) + (msg.content.length > 100 ? '...' : ''),
          createdAt: msg.createdAt
        })),
        documents: documents.slice(0, 3).map(doc => ({
          id: doc.id,
          filename: doc.filename,
          category: doc.category,
          createdAt: doc.createdAt,
          fileSize: doc.fileSize
        })),
        invoices: invoices.slice(0, 3).map(inv => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          amount: inv.amount,
          status: inv.status,
          dueDate: inv.dueDate,
          paidAmount: inv.payments.reduce((sum: number, payment: any) => sum + payment.amount, 0)
        })),
        activity: activityFeed.length > 0 ? activityFeed : [
          {
            type: 'info',
            title: 'Welcome to your dashboard!',
            time: new Date(),
            icon: 'CheckCircle',
            color: 'text-green-400'
          }
        ]
      },
      upcomingDeadlines,
      period: {
        days: periodDays,
        startDate,
        endDate: new Date()
      }
    }

    return NextResponse.json(dashboardData)
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}