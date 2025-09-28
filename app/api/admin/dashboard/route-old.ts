import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Get basic counts
    const totalProjects = await prisma.project.count({
      where: { deletedAt: null }
    });

    const activeProjects = await prisma.project.count({
      where: { 
        status: { in: ['IN_PROGRESS', 'REVIEW'] },
        deletedAt: null 
      }
    });

    const completedProjects = await prisma.project.count({
      where: { 
        status: 'COMPLETED',
        deletedAt: null 
      }
    });

    const totalClients = await prisma.client.count({
      where: { deletedAt: null }
    });

    const activeClients = await prisma.client.count({
      where: {
        deletedAt: null,
        projects: {
          some: {
            status: { in: ['IN_PROGRESS', 'REVIEW'] },
            deletedAt: null
          }
        }
      }
    });

    // Revenue calculations
    const totalRevenue = await prisma.invoice.aggregate({
      where: { status: 'PAID' },
      _sum: { total: true }
    });

    const monthlyRevenue = await prisma.invoice.aggregate({
      where: {
        status: 'PAID',
        paidAt: { gte: startOfThisMonth }
      },
      _sum: { total: true }
    });

    const lastMonthRevenue = await prisma.invoice.aggregate({
      where: {
        status: 'PAID',
        paidAt: {
          gte: startOfLastMonth,
          lt: startOfThisMonth
        }
      },
      _sum: { total: true }
    });

    // Calculate revenue change
    const currentRevenue = monthlyRevenue._sum.total || 0;
    const lastRevenue = lastMonthRevenue._sum.total || 0;
    const revenueChange = lastRevenue > 0 
      ? ((Number(currentRevenue) - Number(lastRevenue)) / Number(lastRevenue) * 100)
      : currentRevenue > 0 ? 100 : 0;

    // Team statistics
    const totalTeamMembers = await prisma.user.count({
      where: {
        role: { in: ['DEVELOPER', 'MANAGER'] },
        deletedAt: null
      }
    });

    const activeTeamMembers = await prisma.user.count({
      where: {
        role: { in: ['DEVELOPER', 'MANAGER'] },
        deletedAt: null,
        teamMemberships: {
          some: { isActive: true }
        }
      }
    });

    // Recent projects
    const recentProjects = await prisma.project.findMany({
      where: { deletedAt: null },
      include: {
        client: {
          select: { id: true, name: true }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 10
    });

    // Recent activities
    const recentActivities = await prisma.activityLog.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    // Calculate completion rate
    const completionRate = totalProjects > 0 
      ? ((completedProjects / totalProjects) * 100)
      : 0;

    // Calculate team utilization
    const teamUtilization = totalTeamMembers > 0 
      ? ((activeTeamMembers / totalTeamMembers) * 100)
      : 0;

    return NextResponse.json({
      overview: {
        totalRevenue: Number(totalRevenue._sum.total || 0),
        monthlyRevenue: Number(currentRevenue),
        revenueChange: Number(revenueChange.toFixed(1)),
        totalProjects,
        activeProjects,
        completedProjects,
        completionRate: Number(completionRate.toFixed(1)),
        totalClients,
        activeClients,
        totalTeamMembers,
        activeTeamMembers,
        teamUtilization: Number(teamUtilization.toFixed(1))
      },
      recentProjects: recentProjects.map(project => ({
        id: project.id,
        name: project.name,
        status: project.status,
        priority: project.priority,
        client: project.client,
        startDate: project.startDate,
        endDate: project.endDate,
        completionRate: project.completionRate,
        budget: project.budget ? Number(project.budget) : null,
        budgetUsed: project.budgetUsed ? Number(project.budgetUsed) : null,
        updatedAt: project.updatedAt
      })),
      recentActivities: recentActivities.map(activity => ({
        id: activity.id,
        action: activity.action,
        entityType: activity.entityType,
        entityId: activity.entityId,
        user: activity.user,
        createdAt: activity.createdAt,
        changes: activity.changes ? JSON.parse(activity.changes) : null
      }))
    });

  } catch (error) {
    console.error('Error fetching admin dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
