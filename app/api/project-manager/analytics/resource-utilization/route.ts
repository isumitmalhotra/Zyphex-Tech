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

    // Get team members with their tasks
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
            estimatedHours: true
          }
        }
      },
      take: 20
    });

    // Calculate workload per team member
    const workloadData = teamMembers.map(member => {
      const totalTasks = member.assignedTasks.length;
      const completedTasks = member.assignedTasks.filter((t: { status: string }) => t.status === 'DONE').length;
      const inProgressTasks = member.assignedTasks.filter((t: { status: string }) => t.status === 'IN_PROGRESS').length;
      const totalEstimatedHours = member.assignedTasks.reduce((sum: number, t: { estimatedHours: number | null }) => sum + (t.estimatedHours || 0), 0);
      
      return {
        name: member.name || member.email,
        totalTasks,
        completedTasks,
        inProgressTasks,
        estimatedHours: totalEstimatedHours,
        utilization: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      };
    });

    // Resource allocation by status
    const allTasks = await prisma.task.findMany({
      where: {
        deletedAt: null,
        ...dateFilter
      },
      select: {
        status: true
      }
    });

    const tasksByStatus: Record<string, number> = {};
    allTasks.forEach(task => {
      tasksByStatus[task.status] = (tasksByStatus[task.status] || 0) + 1;
    });

    const resourceAllocation = Object.entries(tasksByStatus).map(([status, count]) => ({
      status,
      count
    }));

    // Capacity calculation (assuming 40 hours per week per person)
    const totalCapacity = teamMembers.length * 160; // 40 hours * 4 weeks
    const totalUtilized = workloadData.reduce((sum, w) => sum + w.estimatedHours, 0);
    const capacityUtilization = totalCapacity > 0 
      ? Math.round((totalUtilized / totalCapacity) * 100) 
      : 0;

    return NextResponse.json({
      teamWorkload: workloadData,
      resourceAllocation,
      capacity: {
        total: totalCapacity,
        utilized: totalUtilized,
        utilization: capacityUtilization,
        available: totalCapacity - totalUtilized
      }
    });
  } catch (error) {
    console.error("Error fetching resource utilization:", error);
    return NextResponse.json(
      { error: "Failed to fetch resource utilization data" },
      { status: 500 }
    );
  }
}
