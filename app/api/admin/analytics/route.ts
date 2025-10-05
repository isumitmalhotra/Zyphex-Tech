import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withPermissions } from '@/lib/auth/middleware';
import { Permission } from '@/lib/auth/permissions';

export const GET = withPermissions([Permission.VIEW_ANALYTICS])(async (_request) => {
  try {
    // Financial Analytics
    const totalRevenue = await prisma.invoice.aggregate({
      where: { status: 'PAID' },
      _sum: { amount: true }
    });

    const pendingRevenue = await prisma.invoice.aggregate({
      where: { status: 'SENT' },
      _sum: { amount: true }
    });

    const overdueRevenue = await prisma.invoice.aggregate({
      where: { status: 'OVERDUE' },
      _sum: { amount: true }
    });

    // Monthly revenue trend (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthlyRevenue = await prisma.invoice.findMany({
      where: {
        status: 'PAID',
        paidAt: { gte: twelveMonthsAgo }
      },
      select: {
        amount: true,
        paidAt: true
      }
    });

    // Group by month
    const revenueByMonth = monthlyRevenue.reduce((acc: Record<string, number>, invoice) => {
      if (invoice.paidAt) {
        const monthKey = invoice.paidAt.toISOString().substring(0, 7); // YYYY-MM
        acc[monthKey] = (acc[monthKey] || 0) + invoice.amount;
      }
      return acc;
    }, {});

    // Project Analytics
    const projectStats = await prisma.project.groupBy({
      by: ['status'],
      _count: { _all: true }
    });

    const projectStatusBreakdown = projectStats.reduce((acc: Record<string, number>, stat) => {
      acc[stat.status] = stat._count._all;
      return acc;
    }, {});

    // Client Analytics
    const topClients = await prisma.client.findMany({
      include: {
        projects: true,
        _count: { select: { projects: true } }
      },
      orderBy: {
        projects: { _count: 'desc' }
      },
      take: 10
    });

    // Team Performance Analytics
    const teamPerformance = await prisma.user.findMany({
      where: {
        role: { in: ['TEAM_MEMBER', 'PROJECT_MANAGER'] }
      },
      include: {
        assignedTasks: {
          select: {
            id: true,
            status: true,
            completedAt: true
          }
        },
        timeEntries: {
          where: {
            date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
          },
          select: {
            hours: true
          }
        }
      }
    });

    const teamStats = teamPerformance.map(member => {
      const totalTasks = member.assignedTasks.length;
      const completedTasks = member.assignedTasks.filter(t => t.status === 'DONE').length;
      const totalHours = member.timeEntries.reduce((sum, entry) => 
        sum + parseFloat(entry.hours?.toString() || '0'), 0
      );

      return {
        user: {
          id: member.id,
          name: member.name,
          email: member.email,
          role: member.role
        },
        metrics: {
          totalTasks,
          completedTasks,
          completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
          totalHours: Math.round(totalHours * 100) / 100,
          averageHoursPerDay: Math.round((totalHours / 30) * 100) / 100
        }
      };
    });

    // Resource Utilization
    const totalTeamMembers = await prisma.user.count({
      where: { role: { in: ['TEAM_MEMBER', 'PROJECT_MANAGER'] } }
    });

    const activeTeamMembers = await prisma.user.count({
      where: {
        role: { in: ['TEAM_MEMBER', 'PROJECT_MANAGER'] },
        assignedTasks: {
          some: {
            status: { in: ['TODO', 'IN_PROGRESS'] }
          }
        }
      }
    });

    // Time tracking analytics (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const timeTrackingData = await prisma.timeEntry.findMany({
      where: {
        date: { gte: thirtyDaysAgo }
      },
      include: {
        user: { select: { name: true, role: true } },
        task: {
          include: {
            project: { select: { name: true } }
          }
        }
      }
    });

    const timeByProject = timeTrackingData.reduce((acc: Record<string, number>, entry) => {
      const projectName = entry.task?.project?.name;
      if (projectName) {
        acc[projectName] = (acc[projectName] || 0) + parseFloat(entry.hours?.toString() || '0');
      }
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: {
        financial: {
          totalRevenue: Number(totalRevenue._sum?.amount || 0),
          pendingRevenue: Number(pendingRevenue._sum?.amount || 0),
          overdueRevenue: Number(overdueRevenue._sum?.amount || 0),
          revenueByMonth,
          totalInvoices: await prisma.invoice.count(),
          paidInvoices: await prisma.invoice.count({ where: { status: 'PAID' } }),
          pendingInvoices: await prisma.invoice.count({ where: { status: 'SENT' } }),
          overdueInvoices: await prisma.invoice.count({ where: { status: 'OVERDUE' } })
        },
        projects: {
          total: await prisma.project.count(),
          statusBreakdown: projectStatusBreakdown,
          averageBudget: await prisma.project.aggregate({
            _avg: { budget: true }
          }).then(result => Number(result._avg?.budget || 0))
        },
        clients: {
          total: await prisma.client.count(),
          topClients: topClients.map(client => ({
            id: client.id,
            name: client.name,
            email: client.email,
            projectCount: client._count.projects,
            totalValue: client.projects.reduce((sum, project) => 
              sum + Number(project.budget || 0), 0
            )
          }))
        },
        team: {
          totalMembers: totalTeamMembers,
          activeMembers: activeTeamMembers,
          utilizationRate: totalTeamMembers > 0 
            ? Math.round((activeTeamMembers / totalTeamMembers) * 100) 
            : 0,
          performance: teamStats,
          timeByProject
        },
        tasks: {
          total: await prisma.task.count(),
          completed: await prisma.task.count({ where: { status: 'DONE' } }),
          inProgress: await prisma.task.count({ where: { status: 'IN_PROGRESS' } }),
          todo: await prisma.task.count({ where: { status: 'TODO' } }),
          overdue: await prisma.task.count({
            where: {
              status: { not: 'DONE' },
              dueDate: { lt: new Date() }
            }
          })
        }
      }
    });

  } catch (error) {
    console.error('Analytics API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});