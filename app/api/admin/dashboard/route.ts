import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { withPermissions } from '@/lib/auth/middleware';
import { Permission } from '@/lib/auth/permissions';

export const GET = withPermissions([Permission.VIEW_DASHBOARD])(async (_request) => {
  try {

    // Simple counts
    const totalProjects = await prisma.project.count();
    const activeProjects = await prisma.project.count({
      where: { status: { in: ['IN_PROGRESS', 'REVIEW'] } }
    });
    const completedProjects = await prisma.project.count({
      where: { status: 'COMPLETED' }
    });
    const totalClients = await prisma.client.count();

    // Revenue calculation using amount instead of total
    const totalRevenue = await prisma.invoice.aggregate({
      where: { status: 'PAID' },
      _sum: { amount: true }
    });

    // Team stats using available Role enum values
    const totalTeamMembers = await prisma.user.count({
      where: { role: { in: [Role.TEAM_MEMBER, Role.PROJECT_MANAGER] } }
    });

    // Recent projects with available fields only
    const recentProjects = await prisma.project.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        status: true,
        budget: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        client: {
          select: { name: true, email: true }
        }
      }
    });

    // Recent activities
    const recentActivities = await prisma.activityLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalProjects,
          activeProjects,
          completedProjects,
          totalClients,
          totalRevenue: Number(totalRevenue._sum?.amount || 0),
          totalTeamMembers,
          projectCompletionRate: totalProjects > 0 
            ? Math.round((completedProjects / totalProjects) * 100) 
            : 0,
          revenueChange: 0 // Simplified for now
        },
        recentProjects: recentProjects.map(project => ({
          id: project.id,
          name: project.name,
          status: project.status,
          client: project.client,
          budget: project.budget ? Number(project.budget) : null,
          startDate: project.startDate?.toISOString(),
          endDate: project.endDate?.toISOString(),
          createdAt: project.createdAt.toISOString(),
        })),
        recentActivities: recentActivities.map(activity => ({
          id: activity.id,
          action: activity.action,
          entityType: activity.entityType,
          entityId: activity.entityId,
          user: activity.user,
          createdAt: activity.createdAt.toISOString()
        }))
      }
    });

  } catch (error) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
})