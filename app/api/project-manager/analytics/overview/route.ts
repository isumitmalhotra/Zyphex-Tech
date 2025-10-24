import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get total projects count by status
    const totalProjects = await prisma.project.count({
      where: { deletedAt: null }
    });

    const activeProjects = await prisma.project.count({
      where: { 
        deletedAt: null,
        status: { in: ['PLANNING', 'IN_PROGRESS', 'ON_HOLD'] }
      }
    });

    const completedProjects = await prisma.project.count({
      where: { 
        deletedAt: null,
        status: 'COMPLETED'
      }
    });

    // Calculate overdue projects
    const now = new Date();
    const overdueProjects = await prisma.project.count({
      where: {
        deletedAt: null,
        status: { in: ['PLANNING', 'IN_PROGRESS'] },
        endDate: { lt: now }
      }
    });

    // Calculate team productivity score
    const totalTasks = await prisma.task.count({
      where: { deletedAt: null }
    });

    const completedTasks = await prisma.task.count({
      where: { 
        deletedAt: null,
        status: 'DONE'
      }
    });

    const productivityScore = totalTasks > 0 
      ? Math.round((completedTasks / totalTasks) * 100) 
      : 0;

    // Calculate budget utilization
    const projects = await prisma.project.findMany({
      where: { deletedAt: null },
      select: {
        budget: true,
        budgetUsed: true
      }
    });

    const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const totalBudgetUsed = projects.reduce((sum, p) => sum + (p.budgetUsed || 0), 0);
    const budgetUtilization = totalBudget > 0 
      ? Math.round((totalBudgetUsed / totalBudget) * 100) 
      : 0;

    // Calculate overall project health score
    const onTimeProjects = activeProjects - overdueProjects;
    const healthScore = activeProjects > 0
      ? Math.round(((onTimeProjects / activeProjects) * 0.4 + (productivityScore / 100) * 0.4 + (1 - budgetUtilization / 100) * 0.2) * 100)
      : 100;

    return NextResponse.json({
      overview: {
        totalProjects,
        activeProjects,
        completedProjects,
        overdueProjects,
        productivityScore,
        budgetUtilization,
        healthScore
      }
    });
  } catch (error) {
    console.error("Error fetching analytics overview:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics overview" },
      { status: 500 }
    );
  }
}
