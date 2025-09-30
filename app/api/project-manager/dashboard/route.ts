import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface ProjectWithTasks {
  id: string;
  name: string;
  tasks: Array<{ status: string }>;
}

interface TeamPerformanceData {
  userId: string;
  _sum: { duration: number | null };
  _count: { id: number };
}

interface UserData {
  id: string;
  name: string | null;
  email: string;
}
import { withPermissions } from '@/lib/auth/middleware';
import { Permission } from '@/lib/auth/permissions';

export const GET = withPermissions([Permission.VIEW_DASHBOARD, Permission.VIEW_PROJECTS])(async (request) => {
  try {
    const userId = request.user.id;

    // Project Statistics
    const totalProjects = await prisma.project.count({
      where: {
        OR: [
          { managerId: userId },
          { team: { members: { some: { userId } } } }
        ]
      }
    });

    const activeProjects = await prisma.project.count({
      where: {
        AND: [
          { status: { in: ['IN_PROGRESS', 'REVIEW'] } },
          {
            OR: [
              { managerId: userId },
              { team: { members: { some: { userId } } } }
            ]
          }
        ]
      }
    });

    const completedProjects = await prisma.project.count({
      where: {
        AND: [
          { status: 'COMPLETED' },
          {
            OR: [
              { managerId: userId },
              { team: { members: { some: { userId } } } }
            ]
          }
        ]
      }
    });

    // Team Statistics
    const totalTeamMembers = await prisma.user.count({
      where: {
        teamMemberships: {
          some: {
            team: {
              projects: {
                some: {
                  OR: [
                    { managerId: userId },
                    { team: { members: { some: { userId } } } }
                  ]
                }
              }
            }
          }
        }
      }
    });

    // Task Statistics
    const totalTasks = await prisma.task.count({
      where: {
        project: {
          OR: [
            { managerId: userId },
            { team: { members: { some: { userId } } } }
          ]
        }
      }
    });

    const completedTasks = await prisma.task.count({
      where: {
        AND: [
          { status: 'DONE' },
          {
            project: {
              OR: [
                { managerId: userId },
                { team: { members: { some: { userId } } } }
              ]
            }
          }
        ]
      }
    });

    const overdueTasks = await prisma.task.count({
      where: {
        AND: [
          { status: { not: 'DONE' } },
          { dueDate: { lt: new Date() } },
          {
            project: {
              OR: [
                { managerId: userId },
                { team: { members: { some: { userId } } } }
              ]
            }
          }
        ]
      }
    });

    // Recent Projects
    const recentProjects = await prisma.project.findMany({
      where: {
        OR: [
          { managerId: userId },
          { team: { members: { some: { userId } } } }
        ]
      },
      include: {
        client: {
          select: { name: true, email: true }
        },
        team: {
          include: {
            members: {
              include: {
                user: {
                  select: { id: true, name: true, email: true }
                }
              }
            }
          }
        },
        tasks: {
          select: {
            id: true,
            status: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 5
    });

    // Upcoming Deadlines
    const upcomingDeadlines = await prisma.task.findMany({
      where: {
        AND: [
          { status: { not: 'DONE' } },
          { dueDate: { gte: new Date() } },
          {
            project: {
              OR: [
                { managerId: userId },
                { team: { members: { some: { userId } } } }
              ]
            }
          }
        ]
      },
      include: {
        project: {
          select: { name: true, id: true }
        },
        assignee: {
          select: { name: true, email: true }
        }
      },
      orderBy: { dueDate: 'asc' },
      take: 10
    });

    // Team Performance
    const teamPerformance = await prisma.timeEntry.groupBy({
      by: ['userId'],
      where: {
        task: {
          project: {
            OR: [
              { managerId: userId },
              { team: { members: { some: { userId } } } }
            ]
          }
        },
        startTime: {
          gte: new Date(new Date().setDate(new Date().getDate() - 30))
        }
      },
      _sum: {
        duration: true
      },
      _count: {
        id: true
      }
    });

    // Get user details for team performance
    const userIds = teamPerformance.map((tp: TeamPerformanceData) => tp.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true }
    });

    const teamPerformanceWithUsers = teamPerformance.map((tp: TeamPerformanceData) => ({
      ...tp,
      user: users.find((u: UserData) => u.id === tp.userId)
    }));

    // Recent Activities
    const recentActivities = await prisma.activityLog.findMany({
      where: {
        OR: [
          { userId },
          {
            projectId: {
              in: recentProjects.map((p: ProjectWithTasks) => p.id)
            }
          }
        ]
      },
      include: {
        user: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalProjects,
          activeProjects,
          completedProjects,
          totalTeamMembers,
          totalTasks,
          completedTasks,
          overdueTasks,
          taskCompletionRate
        },
        recentProjects: recentProjects.map((project: ProjectWithTasks) => ({
          ...project,
          taskStats: {
            total: project.tasks.length,
            completed: project.tasks.filter((t: { status: string }) => t.status === 'DONE').length
          }
        })),
        upcomingDeadlines,
        teamPerformance: teamPerformanceWithUsers,
        recentActivities
      }
    });

  } catch (error) {
    console.error('Project Manager dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
});