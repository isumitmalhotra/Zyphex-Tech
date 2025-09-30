import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withPermissions } from '@/lib/auth/middleware';
import { Permission } from '@/lib/auth/permissions';

export const GET = withPermissions([Permission.VIEW_DASHBOARD, Permission.VIEW_PROJECTS])(async (request) => {
  try {
    const userId = request.user.id;

    // Find client record for this user
    const client = await prisma.client.findFirst({
      where: { userId }
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client profile not found' },
        { status: 404 }
      );
    }

    // Project Statistics
    const totalProjects = await prisma.project.count({
      where: { clientId: client.id }
    });

    const activeProjects = await prisma.project.count({
      where: {
        clientId: client.id,
        status: { in: ['PLANNING', 'IN_PROGRESS', 'REVIEW'] }
      }
    });

    const completedProjects = await prisma.project.count({
      where: {
        clientId: client.id,
        status: 'COMPLETED'
      }
    });

    const cancelledProjects = await prisma.project.count({
      where: {
        clientId: client.id,
        status: 'CANCELLED'
      }
    });

    // Financial Statistics
    const totalInvestment = await prisma.project.aggregate({
      where: { clientId: client.id },
      _sum: { budget: true }
    });

    const paidInvoices = await prisma.invoice.aggregate({
      where: {
        project: { clientId: client.id },
        status: 'PAID'
      },
      _sum: { amount: true }
    });

    const pendingInvoices = await prisma.invoice.aggregate({
      where: {
        project: { clientId: client.id },
        status: 'SENT'
      },
      _sum: { amount: true }
    });

    const overdueInvoices = await prisma.invoice.aggregate({
      where: {
        project: { clientId: client.id },
        status: 'OVERDUE'
      },
      _sum: { amount: true }
    });

    // Recent Projects with details
    const recentProjects = await prisma.project.findMany({
      where: { clientId: client.id },
      include: {
        team: {
          include: {
            members: {
              include: {
                user: {
                  select: { name: true, email: true }
                }
              }
            }
          }
        },
        tasks: {
          select: {
            id: true,
            status: true,
            priority: true
          }
        },
        documents: {
          select: {
            id: true,
            title: true,
            fileName: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 3
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 5
    });

    // Upcoming Milestones/Deliverables
    const upcomingMilestones = await prisma.task.findMany({
      where: {
        project: { clientId: client.id },
        status: { not: 'DONE' },
        priority: 'HIGH',
        dueDate: { gte: new Date() }
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

    // Recent Messages/Communications
    const recentMessages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      include: {
        sender: { select: { name: true, email: true, role: true } },
        receiver: { select: { name: true, email: true, role: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Recent Documents shared with client
    const recentDocuments = await prisma.document.findMany({
      where: {
        project: { clientId: client.id },
        isPublic: true // Assuming public documents are client-viewable
      },
      include: {
        project: { select: { name: true, id: true } },
        uploadedBy: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Invoices Summary
    const recentInvoices = await prisma.invoice.findMany({
      where: {
        project: { clientId: client.id }
      },
      include: {
        project: { select: { name: true, id: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Contact History
    const contactHistory = await prisma.contactLog.findMany({
      where: { clientId: client.id },
      include: {
        user: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Project progress calculation
    const projectsWithProgress = recentProjects.map((project: unknown) => {
      const totalTasks = project.tasks.length;
      const completedTasks = project.tasks.filter((t: unknown) => t.status === 'DONE').length;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      return {
        ...project,
        progress,
        taskStats: {
          total: totalTasks,
          completed: completedTasks,
          inProgress: project.tasks.filter((t: unknown) => t.status === 'IN_PROGRESS').length,
          todo: project.tasks.filter((t: unknown) => t.status === 'TODO').length
        }
      };
    });

    const projectCompletionRate = totalProjects > 0 ? 
      Math.round((completedProjects / totalProjects) * 100) : 0;

    return NextResponse.json({
      success: true,
      data: {
        client: {
          id: client.id,
          name: client.name,
          email: client.email,
          company: client.company,
          phone: client.phone
        },
        overview: {
          totalProjects,
          activeProjects,
          completedProjects,
          cancelledProjects,
          projectCompletionRate,
          totalInvestment: totalInvestment._sum.budget || 0,
          paidAmount: paidInvoices._sum.amount || 0,
          pendingAmount: pendingInvoices._sum.amount || 0,
          overdueAmount: overdueInvoices._sum.amount || 0
        },
        recentProjects: projectsWithProgress,
        upcomingMilestones,
        recentMessages,
        recentDocuments,
        recentInvoices,
        contactHistory
      }
    });

  } catch (error) {
    console.error('Client dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
});