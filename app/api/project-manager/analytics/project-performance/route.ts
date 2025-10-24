import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface ProjectWithDates {
  id: string;
  status: string;
  endDate: Date | null;
  updatedAt: Date;
}

interface BudgetProject {
  id: string;
  name: string;
  budget: number | null;
  budgetUsed: number | null;
}

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

    // Projects by status
    const projectsByStatus = await prisma.project.groupBy({
      by: ['status'],
      where: {
        deletedAt: null,
        ...dateFilter
      },
      _count: {
        id: true
      }
    });

    // On-time vs delayed projects
    const now = new Date();
    const projects: ProjectWithDates[] = await prisma.project.findMany({
      where: {
        deletedAt: null,
        ...dateFilter
      },
      select: {
        id: true,
        status: true,
        endDate: true,
        updatedAt: true
      }
    });

    const onTime = projects.filter((p: ProjectWithDates) => 
      p.status === 'COMPLETED' && p.endDate && p.updatedAt <= p.endDate
    ).length;

    const delayed = projects.filter((p: ProjectWithDates) => 
      (p.status === 'COMPLETED' && p.endDate && p.updatedAt > p.endDate) ||
      (p.status !== 'COMPLETED' && p.endDate && now > p.endDate)
    ).length;

    // Budget variance by project
    const budgetVariance: BudgetProject[] = await prisma.project.findMany({
      where: {
        deletedAt: null,
        ...dateFilter
      },
      select: {
        id: true,
        name: true,
        budget: true,
        budgetUsed: true
      },
      take: 10,
      orderBy: {
        budgetUsed: 'desc'
      }
    });

    const budgetData = budgetVariance.map((p: BudgetProject) => ({
      projectName: p.name,
      budget: p.budget || 0,
      used: p.budgetUsed || 0,
      variance: (p.budget || 0) - (p.budgetUsed || 0)
    }));

    // Monthly completion trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const completionTrend = await prisma.project.findMany({
      where: {
        deletedAt: null,
        status: 'COMPLETED',
        updatedAt: { gte: sixMonthsAgo }
      },
      select: {
        updatedAt: true
      }
    });

    const monthlyData: Record<string, number> = {};
    completionTrend.forEach((p: { updatedAt: Date }) => {
      const monthKey = p.updatedAt.toISOString().substring(0, 7); // YYYY-MM
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
    });

    const completionByMonth = Object.entries(monthlyData)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, count]) => ({ month, count }));

    return NextResponse.json({
      projectsByStatus: projectsByStatus.map((p: { status: string; _count: { id: number } }) => ({
        status: p.status,
        count: p._count.id
      })),
      onTimeVsDelayed: {
        onTime,
        delayed,
        total: projects.length
      },
      budgetVariance: budgetData,
      completionTrend: completionByMonth
    });
  } catch (error) {
    console.error("Error fetching project performance:", error);
    return NextResponse.json(
      { error: "Failed to fetch project performance data" },
      { status: 500 }
    );
  }
}
