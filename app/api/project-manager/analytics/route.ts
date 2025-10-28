import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic'

// GET - Fetch project analytics with aggregate queries
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check authorization
    const userRole = session.user.role;
    if (!["PROJECT_MANAGER", "SUPER_ADMIN"].includes(userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Date range defaults
    const dateRange = {
      start: startDate ? new Date(startDate) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
      end: endDate ? new Date(endDate) : new Date(),
    };

    // Build where clauses
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const projectWhere: any = {
      deletedAt: null,
    };

    if (projectId) {
      projectWhere.id = projectId;
    }

    // 1. Project Overview Statistics
    const projects = await prisma.project.findMany({
      where: projectWhere,
      include: {
        _count: {
          select: {
            tasks: true,
            teams: true,
            documents: true,
            milestones: true,
          },
        },
      },
    });

    const totalProjects = projects.length;
    const activeProjects = projects.filter((p) => p.status === "IN_PROGRESS").length;
    const completedProjects = projects.filter((p) => p.status === "COMPLETED").length;
    const onHoldProjects = projects.filter((p) => p.status === "ON_HOLD").length;
    const cancelledProjects = projects.filter((p) => p.status === "CANCELLED").length;

    // 2. Task Statistics
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const taskWhere: any = {
      deletedAt: null,
    };

    if (projectId) {
      taskWhere.projectId = projectId;
    }

    const tasks = await prisma.task.findMany({
      where: taskWhere,
      select: {
        id: true,
        status: true,
        priority: true,
        estimatedHours: true,
        dueDate: true,
        completedAt: true,
        projectId: true,
      },
    });

    const totalTasks = tasks.length;
    const todoTasks = tasks.filter((t) => t.status === "TODO").length;
    const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS").length;
    const reviewTasks = tasks.filter((t) => t.status === "REVIEW").length;
    const doneTasks = tasks.filter((t) => t.status === "DONE").length;
    const highPriorityTasks = tasks.filter((t) => t.priority === "HIGH" || t.priority === "URGENT").length;
    
    const now = new Date();
    const overdueTasks = tasks.filter(
      (t) => t.status !== "DONE" && t.dueDate && t.dueDate < now
    ).length;

    const completionRate = totalTasks > 0 ? (doneTasks / totalTasks) * 100 : 0;

    // 3. Time Entry Statistics
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const timeEntryWhere: any = {
      date: {
        gte: dateRange.start,
        lte: dateRange.end,
      },
    };

    if (projectId) {
      timeEntryWhere.projectId = projectId;
    }

    const timeEntries = await prisma.timeEntry.findMany({
      where: timeEntryWhere,
      select: {
        hours: true,
        billable: true,
        amount: true,
        status: true,
        projectId: true,
        userId: true,
        date: true,
      },
    });

    const totalHours = timeEntries.reduce((sum, entry) => sum + entry.hours, 0);
    const billableHours = timeEntries.filter((e) => e.billable).reduce((sum, entry) => sum + entry.hours, 0);
    const nonBillableHours = totalHours - billableHours;
    const totalRevenue = timeEntries
      .filter((e) => e.billable && e.amount)
      .reduce((sum, entry) => sum + (entry.amount || 0), 0);
    const approvedHours = timeEntries
      .filter((e) => e.status === "APPROVED")
      .reduce((sum, entry) => sum + entry.hours, 0);
    const pendingHours = timeEntries
      .filter((e) => e.status === "SUBMITTED")
      .reduce((sum, entry) => sum + entry.hours, 0);

    // 4. Budget Statistics
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const expenseWhere: any = {
      date: {
        gte: dateRange.start,
        lte: dateRange.end,
      },
    };

    if (projectId) {
      expenseWhere.projectId = projectId;
    }

    const expenses = await prisma.expense.findMany({
      where: expenseWhere,
      select: {
        amount: true,
        billable: true,
        reimbursed: true,
        category: true,
        projectId: true,
      },
    });

    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const billableExpenses = expenses.filter((e) => e.billable).reduce((sum, expense) => sum + expense.amount, 0);
    const reimbursedExpenses = expenses.filter((e) => e.reimbursed).reduce((sum, expense) => sum + expense.amount, 0);

    // Project budget utilization
    const projectBudgets = projects.map((p) => ({
      projectId: p.id,
      projectName: p.name,
      budget: p.budget || 0,
      budgetUsed: p.budgetUsed || 0,
      remaining: (p.budget || 0) - (p.budgetUsed || 0),
      utilization: p.budget && p.budget > 0 ? ((p.budgetUsed || 0) / p.budget) * 100 : 0,
    }));

    const totalBudget = projectBudgets.reduce((sum, p) => sum + p.budget, 0);
    const totalBudgetUsed = projectBudgets.reduce((sum, p) => sum + p.budgetUsed, 0);
    const totalBudgetRemaining = totalBudget - totalBudgetUsed;
    const avgBudgetUtilization = totalBudget > 0 ? (totalBudgetUsed / totalBudget) * 100 : 0;

    // 5. Team Performance Statistics
    const teamMembers = await prisma.user.findMany({
      where: {
        role: {
          in: ["TEAM_MEMBER", "PROJECT_MANAGER"],
        },
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        role: true,
      },
    });

    // Calculate per-member statistics
    const teamPerformance = await Promise.all(
      teamMembers.map(async (member) => {
        const memberTimeEntries = timeEntries.filter((e) => e.userId === member.id);
        const memberHours = memberTimeEntries.reduce((sum, entry) => sum + entry.hours, 0);
        const memberRevenue = memberTimeEntries
          .filter((e) => e.billable && e.amount)
          .reduce((sum, entry) => sum + (entry.amount || 0), 0);

        return {
          userId: member.id,
          userName: member.name || "Unknown",
          role: member.role,
          tasksCompleted: 0, // Placeholder - would need to query tasks with assigneeId
          hoursLogged: Math.round(memberHours * 10) / 10,
          revenueGenerated: Math.round(memberRevenue * 100) / 100,
        };
      })
    );

    // 6. Milestone Progress
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const milestoneWhere: any = {};
    
    if (projectId) {
      milestoneWhere.projectId = projectId;
    }

    const milestones = await prisma.projectMilestone.findMany({
      where: milestoneWhere,
      select: {
        status: true,
        targetDate: true,
        actualDate: true,
        isKey: true,
      },
    });

    const totalMilestones = milestones.length;
    const completedMilestones = milestones.filter((m) => m.status === "COMPLETED").length;
    const delayedMilestones = milestones.filter((m) => m.status === "DELAYED").length;
    const onTimeMilestones = milestones.filter((m) => {
      if (m.status !== "COMPLETED" || !m.actualDate) return false;
      return m.actualDate <= m.targetDate;
    }).length;

    const milestoneCompletionRate = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;
    const milestoneOnTimeRate = completedMilestones > 0 ? (onTimeMilestones / completedMilestones) * 100 : 0;

    // 7. Velocity & Productivity Trends (Last 8 weeks)
    const weeks = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const weekTasks = tasks.filter((t) => {
        if (!t.completedAt) return false;
        return t.completedAt >= weekStart && t.completedAt <= weekEnd;
      });

      const weekTimeEntries = timeEntries.filter((e) => {
        return e.date >= weekStart && e.date <= weekEnd;
      });

      weeks.push({
        week: `Week ${8 - i}`,
        startDate: weekStart.toISOString().split("T")[0],
        tasksCompleted: weekTasks.length,
        hoursLogged: Math.round(weekTimeEntries.reduce((sum, e) => sum + e.hours, 0) * 10) / 10,
        revenue: Math.round(
          weekTimeEntries
            .filter((e) => e.billable && e.amount)
            .reduce((sum, e) => sum + (e.amount || 0), 0) * 100
        ) / 100,
      });
    }

    // 8. Project Health Score (0-100)
    const healthFactors = [];

    // Budget health (25%)
    const budgetHealth = avgBudgetUtilization <= 90 ? 25 : avgBudgetUtilization <= 100 ? 15 : 0;
    healthFactors.push(budgetHealth);

    // Task completion health (25%)
    const taskHealth = completionRate >= 80 ? 25 : completionRate >= 60 ? 15 : completionRate >= 40 ? 10 : 5;
    healthFactors.push(taskHealth);

    // Milestone health (25%)
    const milestoneHealth = milestoneOnTimeRate >= 80 ? 25 : milestoneOnTimeRate >= 60 ? 15 : 10;
    healthFactors.push(milestoneHealth);

    // Time tracking health (25%)
    const timeTrackingCompliance = approvedHours / (totalHours || 1);
    const timeHealth = timeTrackingCompliance >= 0.8 ? 25 : timeTrackingCompliance >= 0.6 ? 15 : 10;
    healthFactors.push(timeHealth);

    const overallHealthScore = healthFactors.reduce((sum, score) => sum + score, 0);

    return NextResponse.json({
      dateRange: {
        start: dateRange.start.toISOString(),
        end: dateRange.end.toISOString(),
      },
      projects: {
        total: totalProjects,
        active: activeProjects,
        completed: completedProjects,
        onHold: onHoldProjects,
        cancelled: cancelledProjects,
      },
      tasks: {
        total: totalTasks,
        todo: todoTasks,
        inProgress: inProgressTasks,
        review: reviewTasks,
        done: doneTasks,
        highPriority: highPriorityTasks,
        overdue: overdueTasks,
        completionRate: Math.round(completionRate * 10) / 10,
      },
      timeTracking: {
        totalHours: Math.round(totalHours * 10) / 10,
        billableHours: Math.round(billableHours * 10) / 10,
        nonBillableHours: Math.round(nonBillableHours * 10) / 10,
        approvedHours: Math.round(approvedHours * 10) / 10,
        pendingHours: Math.round(pendingHours * 10) / 10,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        billabilityRate: totalHours > 0 ? Math.round((billableHours / totalHours) * 1000) / 10 : 0,
      },
      budget: {
        totalBudget: Math.round(totalBudget * 100) / 100,
        totalBudgetUsed: Math.round(totalBudgetUsed * 100) / 100,
        totalBudgetRemaining: Math.round(totalBudgetRemaining * 100) / 100,
        avgBudgetUtilization: Math.round(avgBudgetUtilization * 10) / 10,
        totalExpenses: Math.round(totalExpenses * 100) / 100,
        billableExpenses: Math.round(billableExpenses * 100) / 100,
        reimbursedExpenses: Math.round(reimbursedExpenses * 100) / 100,
        projectBudgets,
      },
      milestones: {
        total: totalMilestones,
        completed: completedMilestones,
        delayed: delayedMilestones,
        onTime: onTimeMilestones,
        completionRate: Math.round(milestoneCompletionRate * 10) / 10,
        onTimeRate: Math.round(milestoneOnTimeRate * 10) / 10,
      },
      team: {
        totalMembers: teamMembers.length,
        performance: teamPerformance,
      },
      velocity: {
        weekly: weeks,
        avgTasksPerWeek: Math.round((weeks.reduce((sum, w) => sum + w.tasksCompleted, 0) / weeks.length) * 10) / 10,
        avgHoursPerWeek: Math.round((weeks.reduce((sum, w) => sum + w.hoursLogged, 0) / weeks.length) * 10) / 10,
        avgRevenuePerWeek: Math.round((weeks.reduce((sum, w) => sum + w.revenue, 0) / weeks.length) * 100) / 100,
      },
      health: {
        score: overallHealthScore,
        status: overallHealthScore >= 80 ? "excellent" : overallHealthScore >= 60 ? "good" : overallHealthScore >= 40 ? "fair" : "poor",
        factors: {
          budget: budgetHealth,
          tasks: taskHealth,
          milestones: milestoneHealth,
          timeTracking: timeHealth,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
