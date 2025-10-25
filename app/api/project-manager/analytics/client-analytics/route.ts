import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

// Uses server session/headers; force dynamic rendering for this route
export const dynamic = 'force-dynamic'
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const dateFilter = startDate && endDate ? {
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    } : {};

    // Projects per client
    const clients = await prisma.client.findMany({
      where: {
        deletedAt: null,
        ...dateFilter
      },
      select: {
        id: true,
        name: true,
        company: true,
        projects: {
          where: {
            deletedAt: null
          },
          select: {
            id: true,
            budget: true,
            budgetUsed: true,
            status: true
          }
        }
      }
    });

    const clientAnalytics = clients.map(client => {
      const totalProjects = client.projects.length;
      const activeProjects = client.projects.filter(p => 
        ['PLANNING', 'IN_PROGRESS', 'ON_HOLD'].includes(p.status)
      ).length;
      const completedProjects = client.projects.filter(p => p.status === 'COMPLETED').length;
      
      const totalRevenue = client.projects.reduce((sum, p) => sum + (p.budgetUsed || 0), 0);
      
      // Mock satisfaction score (enhance with actual feedback data)
      const satisfactionScore = completedProjects > 0 
        ? Math.round(75 + Math.random() * 20) // 75-95 range
        : 0;

      return {
        clientName: client.name || client.company || 'Unknown',
        totalProjects,
        activeProjects,
        completedProjects,
        totalRevenue,
        satisfactionScore
      };
    });

    // Sort by revenue
    clientAnalytics.sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Top clients (top 10)
    const topClients = clientAnalytics.slice(0, 10);

    // Repeat client rate
    const clientsWithMultipleProjects = clients.filter(c => c.projects.length > 1).length;
    const repeatClientRate = clients.length > 0
      ? Math.round((clientsWithMultipleProjects / clients.length) * 100)
      : 0;

    // Revenue distribution
    const revenueDistribution = topClients.map(c => ({
      name: c.clientName,
      revenue: c.totalRevenue
    }));

    return NextResponse.json({
      clientAnalytics: topClients,
      summary: {
        totalClients: clients.length,
        repeatClientRate,
        averageProjectsPerClient: clients.length > 0
          ? Math.round(clients.reduce((sum, c) => sum + c.projects.length, 0) / clients.length)
          : 0,
        totalRevenue: clientAnalytics.reduce((sum, c) => sum + c.totalRevenue, 0)
      },
      revenueDistribution
    });
  } catch (error) {
    console.error("Error fetching client analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch client analytics data" },
      { status: 500 }
    );
  }
}
