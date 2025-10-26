import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const statusFilter = searchParams.get('status') || 'all'
    const sortBy = searchParams.get('sortBy') || 'progress'

    // Build where clause
    const whereClause: Record<string, unknown> = {
      status: 'IN_PROGRESS',
      deletedAt: null
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' }},
        { description: { contains: search, mode: 'insensitive' }},
        { client: { name: { contains: search, mode: 'insensitive' }}}
      ]
    }

    if (statusFilter !== 'all') {
      whereClause.healthStatus = statusFilter
    }

    // Fetch active projects with all necessary relations
    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        tasks: {
          where: { deletedAt: null },
          select: {
            id: true,
            status: true,
            priority: true,
            dueDate: true
          }
        },
        teamMembers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          }
        },
        _count: {
          select: {
            tasks: true,
            documents: true,
            milestones: true
          }
        }
      },
      orderBy: sortBy === 'name' 
        ? { name: 'asc' }
        : sortBy === 'progress'
        ? { updatedAt: 'desc' }
        : { startDate: 'desc' }
    })

    // Format projects with calculated stats
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const projectsWithStats = projects.map((project: any) => {
      const tasks = project.tasks
      const totalTasks = tasks.length
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const completedTasks = tasks.filter((t: any) => t.status === 'DONE').length
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const inProgressTasks = tasks.filter((t: any) => t.status === 'IN_PROGRESS').length
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const todoTasks = tasks.filter((t: any) => t.status === 'TODO').length
      const blockedTasks = 0 // BLOCKED doesn't exist in schema
      
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      
      // Calculate overdue tasks
      const now = new Date()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const overdueTasks = tasks.filter((t: any) =>
        t.dueDate && new Date(t.dueDate) < now && 
        t.status !== 'DONE'
      ).length

      // Determine health status based on progress and overdue tasks
      let healthStatus = 'on-track'
      if (overdueTasks > 3 || blockedTasks > 2) {
        healthStatus = 'at-risk'
      } else if (overdueTasks > 5 || progress < 30) {
        healthStatus = 'delayed'
      }

      // Calculate days since start
      const daysSinceStart = project.startDate 
        ? Math.floor((now.getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0

      // Calculate budget metrics
      const budgetUsed = project.budgetUsed || 0
      const budgetTotal = project.budget || 0
      const budgetPercentage = budgetTotal > 0 ? Math.round((budgetUsed / budgetTotal) * 100) : 0

      return {
        id: project.id,
        name: project.name,
        client: {
          name: project.client?.name || 'Unknown Client',
          email: project.client?.email,
          image: null // Client model doesn't have image field
        },
        status: healthStatus,
        progress,
        phase: project.status || 'IN_PROGRESS', // Using project.status instead of phase
        manager: {
          name: project.manager?.name || 'Unassigned',
          email: project.manager?.email,
          image: project.manager?.image
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        team: project.teamMembers.map((tm: any) => ({
          id: tm.user.id,
          name: tm.user.name,
          email: tm.user.email,
          image: tm.user.image,
          role: tm.role
        })),
        timeline: {
          start: project.startDate,
          end: project.endDate,
          daysSinceStart
        },
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          inProgress: inProgressTasks,
          todo: todoTasks,
          blocked: blockedTasks,
          overdue: overdueTasks
        },
        budget: {
          total: budgetTotal,
          used: budgetUsed,
          percentage: budgetPercentage,
          remaining: budgetTotal - budgetUsed
        },
        metrics: {
          documents: project._count.documents,
          milestones: project._count.milestones,
          teamSize: project.teamMembers.length
        },
        priority: project.priority || 'MEDIUM',
        description: project.description,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt
      }
    })

    // Calculate overall statistics
    const stats = {
      total: projectsWithStats.length,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onTrack: projectsWithStats.filter((p: any) => p.status === 'on-track').length,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      atRisk: projectsWithStats.filter((p: any) => p.status === 'at-risk').length,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delayed: projectsWithStats.filter((p: any) => p.status === 'delayed').length,
      avgProgress: Math.round(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        projectsWithStats.reduce((sum: number, p: any) => sum + p.progress, 0) / projectsWithStats.length
      ) || 0,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      totalBudget: projectsWithStats.reduce((sum: number, p: any) => sum + p.budget.total, 0),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      totalSpent: projectsWithStats.reduce((sum: number, p: any) => sum + p.budget.used, 0),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      totalTeamMembers: new Set(projectsWithStats.flatMap((p: any) => p.team.map((t: any) => t.id))).size
    }

    return NextResponse.json({
      projects: projectsWithStats,
      stats
    })

  } catch (error) {
    console.error('Error fetching active projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}
