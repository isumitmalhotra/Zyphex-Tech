import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_request: Request) {
  try {
    // System Overview Statistics
    const totalUsers = await prisma.user.count();
    const totalClients = await prisma.client.count();
    const totalProjects = await prisma.project.count();
    const totalRevenue = await prisma.invoice.aggregate({
      where: { status: 'PAID' },
      _sum: { amount: true }
    });

    // User Statistics by Role
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: { id: true }
    });

    // Project Statistics by Status
    const projectsByStatus = await prisma.project.groupBy({
      by: ['status'],
      _count: { id: true }
    });

    // Recent Activity Across All Users
    const recentActivities = await prisma.auditLog.findMany({
      include: {
        user: { select: { name: true, email: true, role: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    // System Performance Metrics (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const monthlyStats = {
      newUsers: await prisma.user.count({
        where: { createdAt: { gte: thirtyDaysAgo } }
      }),
      newProjects: await prisma.project.count({
        where: { createdAt: { gte: thirtyDaysAgo } }
      }),
      newClients: await prisma.client.count({
        where: { createdAt: { gte: thirtyDaysAgo } }
      }),
      completedProjects: await prisma.project.count({
        where: {
          status: 'COMPLETED',
          updatedAt: { gte: thirtyDaysAgo }
        }
      })
    };

    // Revenue Analytics
    const monthlyRevenue = await prisma.invoice.aggregate({
      where: {
        status: 'PAID',
        paidAt: { gte: thirtyDaysAgo }
      },
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

    // Team Performance Overview
    const teamPerformance = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'PROJECT_MANAGER', 'TEAM_MEMBER'] }
      },
      include: {
        timeEntries: {
          where: { date: { gte: thirtyDaysAgo } },
          select: { duration: true }
        },
        assignedTasks: {
          where: { createdAt: { gte: thirtyDaysAgo } },
          select: { status: true }
        }
      },
      take: 20
    });

    // Security & Audit Overview
    const securityMetrics = {
      failedLogins: await prisma.auditLog.count({
        where: {
          action: 'LOGIN_FAILED',
          createdAt: { gte: thirtyDaysAgo }
        }
      }),
      adminActions: await prisma.auditLog.count({
        where: {
          action: { startsWith: 'ADMIN_' },
          createdAt: { gte: thirtyDaysAgo }
        }
      }),
      permissionChanges: await prisma.auditLog.count({
        where: {
          action: { contains: 'PERMISSION' },
          createdAt: { gte: thirtyDaysAgo }
        }
      })
    };

    // Recent User Registrations
    const recentUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        emailVerified: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // High Priority Issues/Tasks
    const urgentTasks = await prisma.task.findMany({
      where: {
        priority: 'HIGH',
        status: { not: 'DONE' }
      },
      include: {
        project: { select: { name: true, id: true } },
        assignee: { select: { name: true, email: true } }
      },
      orderBy: { dueDate: 'asc' },
      take: 10
    });

    // System Health Indicators
    const systemHealth = {
      activeProjects: await prisma.project.count({
        where: { status: { in: ['IN_PROGRESS', 'REVIEW'] } }
      }),
      overdueTasks: await prisma.task.count({
        where: {
          status: { not: 'DONE' },
          dueDate: { lt: new Date() }
        }
      }),
      overdueInvoices: await prisma.invoice.count({
        where: { status: 'OVERDUE' }
      }),
      inactiveUsers: await prisma.user.count({
        where: {
          timeEntries: {
            none: {
              date: { gte: thirtyDaysAgo }
            }
          }
        }
      })
    };

    // Permission Usage Analytics
    const permissionUsage = await prisma.auditLog.groupBy({
      by: ['action'],
      where: { createdAt: { gte: thirtyDaysAgo } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10
    });

    // Client Satisfaction Metrics (if implemented)
    const clientMetrics = {
      totalClients,
      activeClients: await prisma.client.count({
        where: {
          projects: {
            some: {
              status: { in: ['PLANNING', 'IN_PROGRESS', 'REVIEW'] }
            }
          }
        }
      }),
      newClientsThisMonth: monthlyStats.newClients
    };

    // Calculate team performance with safe handling
    const teamPerformanceWithStats = teamPerformance.map((user: {
      id: string;
      name: string | null;
      email: string;
      role: string;
      timeEntries: Array<{ duration: number | null }>;
      assignedTasks: Array<{ status: string }>;
    }) => {
      const totalHours = user.timeEntries.reduce((total: number, entry: { duration: number | null }) => 
        total + (entry.duration || 0), 0);
      const completedTasks = user.assignedTasks.filter((task: { status: string }) => 
        task.status === 'DONE').length;
      
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        totalHours: Math.round(totalHours * 100) / 100,
        totalTasks: user.assignedTasks.length,
        completedTasks,
        efficiency: user.assignedTasks.length > 0 ? 
          Math.round((completedTasks / user.assignedTasks.length) * 100) : 0
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        systemOverview: {
          totalUsers,
          totalClients,
          totalProjects,
          totalRevenue: totalRevenue._sum.amount || 0,
          monthlyRevenue: monthlyRevenue._sum.amount || 0,
          pendingRevenue: pendingRevenue._sum.amount || 0,
          overdueRevenue: overdueRevenue._sum.amount || 0
        },
        monthlyStats,
        usersByRole,
        projectsByStatus,
        teamPerformance: teamPerformanceWithStats,
        securityMetrics,
        systemHealth,
        clientMetrics,
        permissionUsage,
        recentActivities,
        recentUsers,
        urgentTasks
      }
    });

  } catch (error) {
    console.error('Super Admin dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}