import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'completedDate'

    // Build where clause
    const whereClause: Record<string, unknown> = {
      status: 'COMPLETED',
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Fetch completed projects with relations
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
            image: true,
          },
        },
        tasks: {
          select: {
            id: true,
            status: true,
            priority: true,
          },
        },
        teamMembers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        _count: {
          select: {
            tasks: true,
            teamMembers: true,
            documents: true,
            timeEntries: true,
          },
        },
      },
      orderBy:
        sortBy === 'completedDate'
          ? { endDate: 'desc' }
          : sortBy === 'budget'
          ? { budget: 'desc' }
          : { name: 'asc' },
    })

    // Format projects for response
    const formattedProjects = projects.map((project) => {
      const totalTasks = project.tasks.length
      const completedTasks = project.tasks.filter((t) => t.status === 'DONE').length
      const teamMembers = project.teamMembers.map((tm) => ({
        name: tm.user.name || 'Unknown',
        role: tm.role,
        avatar: tm.user.name?.split(' ').map((n: string) => n[0]).join('') || '??',
      }))

      // Calculate project metrics
      const projectDuration = project.startDate && project.endDate
        ? Math.ceil((new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0

      const budgetUtilization = project.budget > 0
        ? Math.round((project.budgetUsed / project.budget) * 100)
        : 0

      // Determine completion quality
      let completionQuality = 'excellent'
      if (budgetUtilization > 100) completionQuality = 'over-budget'
      else if (budgetUtilization > 90) completionQuality = 'on-budget'
      else if (budgetUtilization < 70) completionQuality = 'under-budget'

      return {
        id: project.id,
        name: project.name,
        client: project.client?.name || 'Unknown Client',
        status: 'completed',
        progress: 100,
        phase: 'Completed',
        completedDate: project.endDate?.toISOString().split('T')[0] || 'N/A',
        startDate: project.startDate?.toISOString().split('T')[0] || 'N/A',
        duration: `${projectDuration} days`,
        budget: project.budget,
        spent: project.budgetUsed,
        budgetUtilization,
        team: teamMembers,
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          inProgress: 0,
          todo: 0,
        },
        completionQuality,
        priority: project.priority,
        documentsCount: project._count.documents,
        timeEntriesCount: project._count.timeEntries,
        rating: 0, // TODO: Implement project rating system
        lastUpdate: project.updatedAt?.toISOString() || new Date().toISOString(),
      }
    })

    // Calculate statistics
    const totalCompleted = formattedProjects.length
    const excellentProjects = formattedProjects.filter(p => p.completionQuality === 'excellent' || p.completionQuality === 'under-budget').length
    const overBudget = formattedProjects.filter(p => p.completionQuality === 'over-budget').length
    const totalBudget = formattedProjects.reduce((sum, p) => sum + p.budget, 0)
    const totalSpent = formattedProjects.reduce((sum, p) => sum + p.spent, 0)

    return NextResponse.json({
      projects: formattedProjects,
      statistics: {
        totalCompleted,
        excellentProjects,
        overBudget,
        totalBudget,
        totalSpent,
        averageBudgetUtilization: totalCompleted > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0,
      },
    })
  } catch (error) {
    console.error('Error fetching completed projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch completed projects' },
      { status: 500 }
    )
  }
}
