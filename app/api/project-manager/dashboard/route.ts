import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withPermissions } from '@/lib/auth/middleware';
import { Permission } from '@/lib/auth/permissions';

export const GET = withPermissions([Permission.VIEW_DASHBOARD])(async (request) => {
  try {
    const userId = request.user.id;

    // Get projects managed by this project manager
    const managedProjects = await prisma.project.findMany({
      where: {
        OR: [
          { managerId: userId },
          { users: { some: { id: userId } } }
        ]
      },
      include: {
        client: { select: { name: true, email: true } },
        users: { 
          select: { 
            id: true, 
            name: true, 
            email: true,
            role: true 
          } 
        },
        tasks: {
          select: {
            id: true,
            status: true,
            priority: true,
            assigneeId: true,
            dueDate: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Calculate project statistics
    const totalProjects = managedProjects.length;
    const activeProjects = managedProjects.filter(p => 
      ['PLANNING', 'IN_PROGRESS', 'REVIEW'].includes(p.status)
    ).length;
    const completedProjects = managedProjects.filter(p => 
      p.status === 'COMPLETED'
    ).length;

    // Calculate task statistics across all managed projects
    const allTasks = managedProjects.flatMap(p => (p as any).tasks || []);
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter((t: any) => t.status === 'DONE').length;
    const overdueTasks = allTasks.filter((t: any) => 
      t.status !== 'DONE' && t.dueDate && new Date(t.dueDate) < new Date()
    ).length;

    // Calculate team member count
    const allTeamMembers = new Set();
    managedProjects.forEach(project => {
      ((project as any).users || []).forEach((user: any) => allTeamMembers.add(user.id));
    });
    const totalTeamMembers = allTeamMembers.size;

    // Get upcoming deadlines
    const upcomingDeadlines = await prisma.task.findMany({
      where: {
        project: {
          OR: [
            { managerId: userId },
            { users: { some: { id: userId } } }
          ]
        },
        status: { not: 'DONE' },
        dueDate: { 
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
        }
      },
      include: {
        project: { select: { name: true } },
        assignee: { select: { name: true, email: true } }
      },
      orderBy: { dueDate: 'asc' },
      take: 10
    });

    // Get team performance metrics
    const teamPerformance = await Promise.all(
      Array.from(allTeamMembers).map(async (memberId) => {
        const member = managedProjects
          .flatMap(p => (p as any).users || [])
          .find((u: any) => u.id === memberId);
        
        if (!member) return null;

        const memberTasks = await prisma.task.count({
          where: {
            assigneeId: memberId as string,
            project: {
              OR: [
                { managerId: userId },
                { users: { some: { id: userId } } }
              ]
            }
          }
        });

        const completedMemberTasks = await prisma.task.count({
          where: {
            assigneeId: memberId as string,
            status: 'DONE',
            project: {
              OR: [
                { managerId: userId },
                { users: { some: { id: userId } } }
              ]
            }
          }
        });

        return {
          user: member,
          totalTasks: memberTasks,
          completedTasks: completedMemberTasks,
          completionRate: memberTasks > 0 ? Math.round((completedMemberTasks / memberTasks) * 100) : 0
        };
      })
    );

    // Get recent activities
    const recentActivities = await prisma.activityLog.findMany({
      where: {
        OR: [
          { userId },
          {
            entityType: 'PROJECT',
            entityId: { in: managedProjects.map(p => p.id) }
          }
        ]
      },
      include: {
        user: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    const overview = {
      totalProjects,
      activeProjects,
      completedProjects,
      totalTeamMembers,
      totalTasks,
      completedTasks,
      overdueTasks,
      taskCompletionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    };

    return NextResponse.json({ 
      success: true,
      data: {
        overview,
        recentProjects: managedProjects.slice(0, 5).map(project => ({
          ...project,
          taskStats: {
            total: (project as any).tasks?.length || 0,
            completed: (project as any).tasks?.filter((t: any) => t.status === 'DONE').length || 0,
            inProgress: (project as any).tasks?.filter((t: any) => t.status === 'IN_PROGRESS').length || 0,
            todo: (project as any).tasks?.filter((t: any) => t.status === 'TODO').length || 0
          },
          team: { 
            members: (project as any).users?.map((user: any) => ({ user })) || []
          }
        })),
        upcomingDeadlines,
        teamPerformance: teamPerformance.filter(Boolean),
        recentActivities
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
});
