import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MilestoneStatus } from "@prisma/client";

// GET - Fetch milestones with filters
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
    const status = searchParams.get("status");
    const isKey = searchParams.get("isKey");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (projectId) {
      where.projectId = projectId;
    }

    if (status) {
      where.status = status as MilestoneStatus;
    }

    if (isKey === "true") {
      where.isKey = true;
    }

    if (startDate || endDate) {
      where.targetDate = {};
      if (startDate) {
        where.targetDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.targetDate.lte = new Date(endDate);
      }
    }

    // Fetch milestones
    const milestones = await prisma.projectMilestone.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true,
            client: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: [{ targetDate: "asc" }, { order: "asc" }],
    });

    // Calculate statistics
    const totalMilestones = milestones.length;
    const pending = milestones.filter((m) => m.status === "PENDING").length;
    const inProgress = milestones.filter((m) => m.status === "IN_PROGRESS").length;
    const completed = milestones.filter((m) => m.status === "COMPLETED").length;
    const delayed = milestones.filter((m) => m.status === "DELAYED").length;
    const cancelled = milestones.filter((m) => m.status === "CANCELLED").length;
    const keyMilestones = milestones.filter((m) => m.isKey).length;

    // Calculate upcoming milestones (next 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const upcomingMilestones = milestones.filter(
      (m) =>
        m.status !== "COMPLETED" &&
        m.status !== "CANCELLED" &&
        m.targetDate <= thirtyDaysFromNow &&
        m.targetDate >= new Date()
    ).length;

    // Calculate overdue milestones
    const overdueMilestones = milestones.filter(
      (m) =>
        (m.status === "PENDING" || m.status === "IN_PROGRESS" || m.status === "DELAYED") &&
        m.targetDate < new Date()
    ).length;

    // Calculate completion rate
    const completionRate = totalMilestones > 0 ? (completed / totalMilestones) * 100 : 0;

    // Calculate average delay (for completed milestones that were late)
    const completedMilestones = milestones.filter((m) => m.status === "COMPLETED" && m.actualDate);
    const delayedCompletions = completedMilestones.filter((m) => {
      if (!m.actualDate) return false;
      return m.actualDate > m.targetDate;
    });
    const averageDelayDays =
      delayedCompletions.length > 0
        ? delayedCompletions.reduce((sum, m) => {
            if (!m.actualDate) return sum;
            const delay = Math.floor((m.actualDate.getTime() - m.targetDate.getTime()) / (1000 * 60 * 60 * 24));
            return sum + delay;
          }, 0) / delayedCompletions.length
        : 0;

    return NextResponse.json({
      milestones,
      statistics: {
        total: totalMilestones,
        pending,
        inProgress,
        completed,
        delayed,
        cancelled,
        keyMilestones,
        upcomingMilestones,
        overdueMilestones,
        completionRate: Math.round(completionRate * 10) / 10,
        averageDelayDays: Math.round(averageDelayDays * 10) / 10,
      },
    });
  } catch (error) {
    console.error("Error fetching milestones:", error);
    return NextResponse.json({ error: "Failed to fetch milestones" }, { status: 500 });
  }
}

// POST - Create milestone
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { projectId, title, description, targetDate, order, isKey, deliverables, status } = body;

    // Validation
    if (!projectId || !title || !targetDate) {
      return NextResponse.json({ error: "Missing required fields: projectId, title, targetDate" }, { status: 400 });
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Create milestone
    const milestone = await prisma.projectMilestone.create({
      data: {
        projectId,
        title,
        description: description || null,
        targetDate: new Date(targetDate),
        order: order || 0,
        isKey: isKey || false,
        deliverables: deliverables || null,
        status: status || "PENDING",
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json({ milestone, message: "Milestone created successfully" }, { status: 201 });
  } catch (error) {
    console.error("Error creating milestone:", error);
    return NextResponse.json({ error: "Failed to create milestone" }, { status: 500 });
  }
}

// PUT - Update milestone
export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const { id, title, description, targetDate, actualDate, status, order, isKey, deliverables } = body;

    // Validation
    if (!id) {
      return NextResponse.json({ error: "Missing required field: id" }, { status: 400 });
    }

    // Verify milestone exists
    const existingMilestone = await prisma.projectMilestone.findUnique({
      where: { id },
    });

    if (!existingMilestone) {
      return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
    }

    // Build update data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (targetDate !== undefined) updateData.targetDate = new Date(targetDate);
    if (actualDate !== undefined) updateData.actualDate = actualDate ? new Date(actualDate) : null;
    if (status !== undefined) updateData.status = status as MilestoneStatus;
    if (order !== undefined) updateData.order = order;
    if (isKey !== undefined) updateData.isKey = isKey;
    if (deliverables !== undefined) updateData.deliverables = deliverables;

    // Update milestone
    const milestone = await prisma.projectMilestone.update({
      where: { id },
      data: updateData,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json({ milestone, message: "Milestone updated successfully" });
  } catch (error) {
    console.error("Error updating milestone:", error);
    return NextResponse.json({ error: "Failed to update milestone" }, { status: 500 });
  }
}

// DELETE - Delete milestone
export async function DELETE(request: NextRequest) {
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
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing required parameter: id" }, { status: 400 });
    }

    // Verify milestone exists
    const milestone = await prisma.projectMilestone.findUnique({
      where: { id },
    });

    if (!milestone) {
      return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
    }

    // Delete milestone
    await prisma.projectMilestone.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Milestone deleted successfully" });
  } catch (error) {
    console.error("Error deleting milestone:", error);
    return NextResponse.json({ error: "Failed to delete milestone" }, { status: 500 });
  }
}
