import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow PROJECT_MANAGER and SUPER_ADMIN
    if (!["PROJECT_MANAGER", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";

    // Default to current week if no dates provided
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Fetch team members (TEAM_MEMBER and PROJECT_MANAGER roles)
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
        email: true,
        image: true,
        role: true,
        hourlyRate: true,
      },
    });

    // Fetch tasks for team members in date range
    const tasks = await prisma.task.findMany({
      where: {
        assigneeId: {
          in: teamMembers.map((m) => m.id),
        },
        deletedAt: null,
        OR: [
          {
            startDate: {
              gte: start,
              lte: end,
            },
          },
          {
            dueDate: {
              gte: start,
              lte: end,
            },
          },
          {
            AND: [
              {
                startDate: {
                  lte: start,
                },
              },
              {
                dueDate: {
                  gte: end,
                },
              },
            ],
          },
        ],
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Fetch time entries for team members in date range
    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        userId: {
          in: teamMembers.map((m) => m.id),
        },
        date: {
          gte: start,
          lte: end,
        },
      },
      select: {
        id: true,
        userId: true,
        hours: true,
        date: true,
        billable: true,
        projectId: true,
      },
    });

    // Calculate workload for each team member
    const workloadData = teamMembers.map((member) => {
      const memberTasks = tasks.filter((t) => t.assigneeId === member.id);
      const memberTimeEntries = timeEntries.filter((e) => e.userId === member.id);

      const totalHours = memberTimeEntries.reduce((sum, e) => sum + e.hours, 0);
      const billableHours = memberTimeEntries
        .filter((e) => e.billable)
        .reduce((sum, e) => sum + e.hours, 0);
      
      const activeTasks = memberTasks.filter(
        (t) => t.status === "IN_PROGRESS" || t.status === "TODO"
      ).length;
      const completedTasks = memberTasks.filter((t) => t.status === "DONE").length;

      // Calculate estimated remaining hours from tasks
      const estimatedHours = memberTasks
        .filter((t) => t.status !== "DONE")
        .reduce((sum, t) => sum + (t.estimatedHours || 0), 0);

      // Assume 40 hours per week capacity (8 hours per day * 5 days)
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const weeksInPeriod = daysDiff / 7;
      const capacity = Math.round(40 * weeksInPeriod);
      const utilization = capacity > 0 ? Math.round((totalHours / capacity) * 100) : 0;

      return {
        userId: member.id,
        userName: member.name || "Unknown",
        email: member.email,
        role: member.role,
        activeTasks,
        completedTasks,
        totalTasks: memberTasks.length,
        totalHours: Math.round(totalHours * 100) / 100,
        billableHours: Math.round(billableHours * 100) / 100,
        nonBillableHours: Math.round((totalHours - billableHours) * 100) / 100,
        estimatedHours: Math.round(estimatedHours * 100) / 100,
        capacity,
        utilization,
        availability: capacity - totalHours,
      };
    });

    // Calculate team-wide statistics
    const statistics = {
      totalMembers: teamMembers.length,
      totalTasks: tasks.length,
      activeTasks: tasks.filter(
        (t) => t.status === "IN_PROGRESS" || t.status === "TODO"
      ).length,
      completedTasks: tasks.filter((t) => t.status === "DONE").length,
      totalHours: workloadData.reduce((sum, w) => sum + w.totalHours, 0),
      billableHours: workloadData.reduce((sum, w) => sum + w.billableHours, 0),
      totalCapacity: workloadData.reduce((sum, w) => sum + w.capacity, 0),
      averageUtilization: Math.round(
        workloadData.reduce((sum, w) => sum + w.utilization, 0) / teamMembers.length
      ),
      overallocatedMembers: workloadData.filter((w) => w.utilization > 100).length,
      underallocatedMembers: workloadData.filter((w) => w.utilization < 70).length,
    };

    // Group tasks by project
    const projectWorkload = tasks.reduce((acc, task) => {
      const projectId = task.projectId;
      const projectName = task.project?.name || "Unknown Project";
      
      if (!acc[projectId]) {
        acc[projectId] = {
          projectId,
          projectName,
          totalTasks: 0,
          activeTasks: 0,
          completedTasks: 0,
          estimatedHours: 0,
        };
      }

      acc[projectId].totalTasks++;
      if (task.status === "IN_PROGRESS" || task.status === "TODO") {
        acc[projectId].activeTasks++;
      }
      if (task.status === "DONE") {
        acc[projectId].completedTasks++;
      }
      acc[projectId].estimatedHours += task.estimatedHours || 0;

      return acc;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }, {} as Record<string, any>);

    return NextResponse.json({
      workloadData,
      projectWorkload: Object.values(projectWorkload),
      statistics,
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching workload data:", error);
    return NextResponse.json(
      { error: "Failed to fetch workload data" },
      { status: 500 }
    );
  }
}
