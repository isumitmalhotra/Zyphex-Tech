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

    // Team member productivity
    const teamMembers = await prisma.user.findMany({
      where: {
        deletedAt: null,
        role: { in: ['USER', 'PROJECT_MANAGER', 'TEAM_MEMBER'] }
      },
      select: {
        id: true,
        name: true,
        email: true,
        assignedTasks: {
          where: {
            deletedAt: null,
            ...dateFilter
          },
          select: {
            id: true,
            status: true,
            estimatedHours: true,
            createdAt: true,
            updatedAt: true
          }
        }
      },
      take: 15
    });

    const teamPerformance = teamMembers.map(member => {
      const totalTasks = member.assignedTasks.length;
      const completedTasks = member.assignedTasks.filter((t: { status: string }) => t.status === 'DONE');
      const completedCount = completedTasks.length;
      
      // Calculate average completion time
      const completionTimes = completedTasks.map((t: { createdAt: Date; updatedAt: Date }) => {
        const created = new Date(t.createdAt).getTime();
        const updated = new Date(t.updatedAt).getTime();
        return (updated - created) / (1000 * 60 * 60); // Convert to hours
      });
      
      const avgCompletionTime = completionTimes.length > 0
        ? completionTimes.reduce((sum: number, time: number) => sum + time, 0) / completionTimes.length
        : 0;

      const productivity = totalTasks > 0 
        ? Math.round((completedCount / totalTasks) * 100) 
        : 0;

      return {
        name: member.name || member.email,
        totalTasks,
        completedTasks: completedCount,
        productivity,
        avgCompletionTime: Math.round(avgCompletionTime)
      };
    });

    // Performance trends over time (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const historicalTasks = await prisma.task.findMany({
      where: {
        deletedAt: null,
        status: 'DONE',
        updatedAt: { gte: sixMonthsAgo }
      },
      select: {
        updatedAt: true
      }
    });

    const monthlyPerformance: Record<string, number> = {};
    historicalTasks.forEach(task => {
      const monthKey = task.updatedAt.toISOString().substring(0, 7);
      monthlyPerformance[monthKey] = (monthlyPerformance[monthKey] || 0) + 1;
    });

    const performanceTrend = Object.entries(monthlyPerformance)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, tasksCompleted]) => ({ month, tasksCompleted }));

    return NextResponse.json({
      teamPerformance,
      performanceTrend
    });
  } catch (error) {
    console.error("Error fetching team performance:", error);
    return NextResponse.json(
      { error: "Failed to fetch team performance data" },
      { status: 500 }
    );
  }
}
