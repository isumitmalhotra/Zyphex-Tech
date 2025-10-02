import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withPermissions } from '@/lib/auth/middleware';
import { Permission } from '@/lib/auth/permissions';

export const GET = withPermissions([Permission.VIEW_DASHBOARD])(async (_request) => {
  try {
    const totalProjects = await prisma.project.count();
    const activeProjects = await prisma.project.count({
      where: { status: { in: ['IN_PROGRESS', 'REVIEW'] } }
    });
    const completedProjects = await prisma.project.count({
      where: { status: 'COMPLETED' }
    });
    
    // Get recent projects
    const recentProjects = await prisma.project.findMany({
      include: {
        client: { select: { name: true, email: true } },
        users: { select: { id: true, name: true, email: true } }
      },
      orderBy: { updatedAt: 'desc' },
      take: 5
    });
    
    const overview = {
      totalProjects,
      activeProjects,
      completedProjects,
      totalTeamMembers: 0,
      totalTasks: 0,
      completedTasks: 0,
      overdueTasks: 0,
      taskCompletionRate: 0
    };

    return NextResponse.json({ 
      overview,
      recentProjects: recentProjects.map(project => ({
        ...project,
        taskStats: { total: 0, completed: 0 },
        team: { members: project.users.map(user => ({ user })) }
      })),
      upcomingDeadlines: [],
      teamPerformance: [],
      recentActivities: []
    });
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
});
