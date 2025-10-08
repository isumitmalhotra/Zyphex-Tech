import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withPermissions } from '@/lib/auth/middleware';
import { Permission } from '@/lib/auth/permissions';

export const GET = withPermissions([Permission.VIEW_DASHBOARD])(async (request) => {
  try {
    const userId = request.user.id;

    // Task Statistics for the user
    const totalTasks = await prisma.task.count({
      where: { assigneeId: userId }
    });

    const completedTasks = await prisma.task.count({
      where: {
        assigneeId: userId,
        status: 'DONE'
      }
    });

    const pendingTasks = await prisma.task.count({
      where: {
        assigneeId: userId,
        status: { in: ['TODO', 'IN_PROGRESS'] }
      }
    });

    const overdueTasks = await prisma.task.count({
      where: {
        assigneeId: userId,
        status: { not: 'DONE' },
        dueDate: { lt: new Date() }
      }
    });

    // Time Tracking Statistics (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        userId,
        date: { gte: thirtyDaysAgo }
      },
      include: {
        task: {
          include: {
            project: {
              select: { name: true, id: true }
            }
          }
        }
      }
    });

    const totalHoursWorked = timeEntries.reduce((total: number, entry: { hours?: string | number }) => {
      return total + (parseFloat(entry.hours?.toString() || '0'));
    }, 0);

    const averageHoursPerDay = totalHoursWorked / 30;

    // Project Statistics (projects user is involved in)
    const userProjects = await prisma.project.findMany({
      where: {
        OR: [
          { users: { some: { id: userId } } },
          { teamMembers: { some: { userId } } },
          { tasks: { some: { assigneeId: userId } } }
        ]
      },
      include: {
        client: { select: { name: true } },
        tasks: {
          where: { assigneeId: userId },
          select: { id: true, status: true, priority: true }
        }
      }
    });

    // Recent Tasks
    const recentTasks = await prisma.task.findMany({
      where: { assigneeId: userId },
      include: {
        project: {
          select: { name: true, id: true }
        },
        creator: {
          select: { name: true, email: true }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 10
    });

    // Upcoming Deadlines
    const upcomingDeadlines = await prisma.task.findMany({
      where: {
        assigneeId: userId,
        status: { not: 'DONE' },
        dueDate: { gte: new Date() }
      },
      include: {
        project: {
          select: { name: true, id: true }
        }
      },
      orderBy: { dueDate: 'asc' },
      take: 5
    });

    // Time tracking by project (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const weeklyTimeEntries = await prisma.timeEntry.findMany({
      where: {
        userId,
        date: { gte: sevenDaysAgo }
      },
      include: {
        task: {
          include: {
            project: {
              select: { name: true, id: true }
            }
          }
        }
      }
    });

    // Group time by project
    const timeByProject = weeklyTimeEntries.reduce((acc: Record<string, number>, entry: any) => {
      const projectName = entry.task.project.name;
      if (!acc[projectName]) {
        acc[projectName] = 0;
      }
      acc[projectName] += parseFloat(entry.hours || '0');
      return acc;
    }, {});

    // Recent Messages (if implemented)
    const recentMessages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      include: {
        sender: { select: { name: true, email: true } },
        receiver: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Recent Documents
    const recentDocuments = await prisma.document.findMany({
      where: {
        OR: [
          { userId: userId },
          {
            project: {
              OR: [
                { users: { some: { id: userId } } },
                { teamMembers: { some: { userId } } },
                { tasks: { some: { assigneeId: userId } } }
              ]
            }
          }
        ]
      },
      include: {
        project: { select: { name: true, id: true } },
        user: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalTasks,
          completedTasks,
          pendingTasks,
          overdueTasks,
          taskCompletionRate,
          totalHoursWorked: Math.round(totalHoursWorked * 100) / 100,
          averageHoursPerDay: Math.round(averageHoursPerDay * 100) / 100,
          activeProjects: userProjects.length
        },
        recentTasks,
        upcomingDeadlines,
        userProjects: userProjects.map((project: any) => ({
          ...project,
          taskStats: {
            total: project.tasks.length,
            completed: project.tasks.filter((t: any) => t.status === 'DONE').length,
            inProgress: project.tasks.filter((t: any) => t.status === 'IN_PROGRESS').length,
            todo: project.tasks.filter((t: any) => t.status === 'TODO').length
          }
        })),
        timeByProject,
        recentMessages,
        recentDocuments,
        weeklyActivity: {
          totalHours: weeklyTimeEntries.reduce((total: number, entry: any) => total + parseFloat(entry.hours || '0'), 0),
          totalEntries: weeklyTimeEntries.length,
          averagePerDay: weeklyTimeEntries.length / 7
        }
      }
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
});