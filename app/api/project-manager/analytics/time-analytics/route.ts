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
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    } : {};

    // Time entries by project
    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        ...dateFilter
      },
      select: {
        id: true,
        hours: true,
        billable: true,
        date: true,
        task: {
          select: {
            project: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    // Time by project
    const projectTimeMap: Record<string, { name: string; billable: number; nonBillable: number }> = {};
    
    timeEntries.forEach(entry => {
      const projectId = entry.task?.project?.id;
      const projectName = entry.task?.project?.name || 'Unassigned';
      
      if (!projectTimeMap[projectId || 'unassigned']) {
        projectTimeMap[projectId || 'unassigned'] = {
          name: projectName,
          billable: 0,
          nonBillable: 0
        };
      }
      
      if (entry.billable) {
        projectTimeMap[projectId || 'unassigned'].billable += entry.hours || 0;
      } else {
        projectTimeMap[projectId || 'unassigned'].nonBillable += entry.hours || 0;
      }
    });

    const timeByProject = Object.values(projectTimeMap).slice(0, 10);

    // Billable vs non-billable summary
    const totalBillable = timeEntries
      .filter(e => e.billable)
      .reduce((sum, e) => sum + (e.hours || 0), 0);
      
    const totalNonBillable = timeEntries
      .filter(e => !e.billable)
      .reduce((sum, e) => sum + (e.hours || 0), 0);

    // Weekly trend (last 8 weeks)
    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

    const recentEntries = await prisma.timeEntry.findMany({
      where: {
        date: { gte: eightWeeksAgo }
      },
      select: {
        hours: true,
        date: true
      }
    });

    const weeklyData: Record<string, number> = {};
    recentEntries.forEach((entry: { date: Date; hours: number }) => {
      const weekStart = new Date(entry.date);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week
      const weekKey = weekStart.toISOString().substring(0, 10);
      weeklyData[weekKey] = (weeklyData[weekKey] || 0) + (entry.hours || 0);
    });

    const weeklyTrend = Object.entries(weeklyData)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([week, hours]) => ({ week, hours }));

    // Estimated vs actual time
    const tasks = await prisma.task.findMany({
      where: {
        deletedAt: null,
        status: 'DONE'
        // Note: Tasks don't have a date field, so we can't apply date filter here
      },
      select: {
        id: true,
        estimatedHours: true,
        timeEntries: {
          select: {
            hours: true
          },
          where: dateFilter // Apply date filter to time entries instead
        }
      },
      take: 20
    });

    const estimatedVsActual = tasks.map(task => {
      const actualHours = task.timeEntries.reduce((sum, e) => sum + (e.hours || 0), 0);
      return {
        estimated: task.estimatedHours || 0,
        actual: actualHours,
        variance: (task.estimatedHours || 0) - actualHours
      };
    });

    return NextResponse.json({
      timeByProject,
      billableVsNonBillable: {
        billable: totalBillable,
        nonBillable: totalNonBillable,
        total: totalBillable + totalNonBillable,
        billablePercentage: totalBillable + totalNonBillable > 0 
          ? Math.round((totalBillable / (totalBillable + totalNonBillable)) * 100)
          : 0
      },
      weeklyTrend,
      estimatedVsActual
    });
  } catch (error) {
    console.error("Error fetching time analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch time analytics data" },
      { status: 500 }
    );
  }
}
