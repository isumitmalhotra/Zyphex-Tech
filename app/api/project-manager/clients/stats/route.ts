import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Uses server session/headers; treat as dynamic
export const dynamic = 'force-dynamic'

// GET /api/project-manager/clients/stats - Get overall client stats
export async function GET(_req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get total clients
    const totalClients = await prisma.client.count({
      where: { deletedAt: null },
    });

    // Get clients with active projects
    const activeClients = await prisma.client.count({
      where: {
        deletedAt: null,
        projects: {
          some: {
            deletedAt: null,
            status: {
              in: ['PLANNING', 'IN_PROGRESS'],
            },
          },
        },
      },
    });

    // Get all projects for revenue calculation
    const projects = await prisma.project.findMany({
      where: { deletedAt: null },
      select: {
        budget: true,
        budgetUsed: true,
        status: true,
      },
    });

    const totalRevenue = projects.reduce((sum, p) => sum + p.budgetUsed, 0);
    const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
    const activeProjects = projects.filter(
      (p) => p.status === 'IN_PROGRESS' || p.status === 'PLANNING'
    ).length;
    const completedProjects = projects.filter(
      (p) => p.status === 'COMPLETED'
    ).length;

    // Client health calculation (simplified)
    const clientHealthScore =
      totalClients > 0
        ? Math.round(
            ((activeClients / totalClients) * 50 +
              (completedProjects / (completedProjects + activeProjects || 1)) *
                50) *
              100
          ) / 100
        : 0;

    return NextResponse.json({
      totalClients,
      activeClients,
      totalRevenue,
      totalBudget,
      activeProjects,
      completedProjects,
      clientHealthScore,
      averageRevenuePerClient:
        totalClients > 0 ? totalRevenue / totalClients : 0,
    });
  } catch (error) {
    console.error('Error fetching client stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
