import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Simple counts without complex filtering
    const totalProjects = await prisma.project.count();
    const activeProjects = await prisma.project.count({
      where: { status: { in: ['IN_PROGRESS', 'REVIEW'] } }
    });
    const completedProjects = await prisma.project.count({
      where: { status: 'COMPLETED' }
    });
    const totalClients = await prisma.client.count();

    // Simple revenue calculation
    const totalRevenue = await prisma.invoice.aggregate({
      where: { status: 'PAID' },
      _sum: { total: true }
    });

    // Team stats
    const totalTeamMembers = await prisma.user.count({
      where: { role: { in: ['DEVELOPER', 'MANAGER'] } }
    });

    // Recent projects with basic fields only
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

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalProjects,
          activeProjects,
          completedProjects,
          totalClients,
          totalRevenue: Number(totalRevenue._sum.total || 0),
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
        recentActivities: [] // Simplified for now
      }
    });

  } catch (error) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}