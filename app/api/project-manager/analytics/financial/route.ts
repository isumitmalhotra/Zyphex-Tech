import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
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

    // Revenue by project
    const projects = await prisma.project.findMany({
      where: {
        deletedAt: null,
        ...dateFilter
      },
      select: {
        id: true,
        name: true,
        budget: true,
        budgetUsed: true,
        hourlyRate: true
      },
      orderBy: {
        budget: 'desc'
      },
      take: 10
    });

    const revenueByProject = projects.map(p => ({
      projectName: p.name,
      budget: p.budget || 0,
      used: p.budgetUsed || 0,
      remaining: (p.budget || 0) - (p.budgetUsed || 0),
      profitMargin: p.budget && p.budget > 0
        ? Math.round(((p.budget - (p.budgetUsed || 0)) / p.budget) * 100)
        : 0
    }));

    // Total financial summary
    const allProjects = await prisma.project.findMany({
      where: {
        deletedAt: null,
        ...dateFilter
      },
      select: {
        budget: true,
        budgetUsed: true
      }
    });

    const totalBudget = allProjects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const totalUsed = allProjects.reduce((sum, p) => sum + (p.budgetUsed || 0), 0);
    const totalRevenue = totalUsed; // Assuming used budget represents revenue
    const totalProfit = totalBudget - totalUsed;

    // Budget compliance (projects within budget)
    const projectsWithinBudget = allProjects.filter(p => 
      (p.budgetUsed || 0) <= (p.budget || 0)
    ).length;

    const budgetComplianceRate = allProjects.length > 0
      ? Math.round((projectsWithinBudget / allProjects.length) * 100)
      : 100;

    // Cost breakdown by category (mock data - enhance based on your expense tracking)
    const costBreakdown = [
      { category: 'Labor', amount: totalUsed * 0.6 },
      { category: 'Materials', amount: totalUsed * 0.2 },
      { category: 'Software', amount: totalUsed * 0.1 },
      { category: 'Overhead', amount: totalUsed * 0.1 }
    ];

    return NextResponse.json({
      revenueByProject,
      financialSummary: {
        totalBudget,
        totalRevenue,
        totalUsed,
        totalProfit,
        profitMargin: totalBudget > 0 
          ? Math.round((totalProfit / totalBudget) * 100) 
          : 0,
        budgetComplianceRate
      },
      costBreakdown
    });
  } catch (error) {
    console.error("Error fetching financial analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch financial analytics data" },
      { status: 500 }
    );
  }
}
