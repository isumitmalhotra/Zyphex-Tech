import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    const userId = searchParams.get("userId") || "";
    const projectId = searchParams.get("projectId") || "";
    const status = searchParams.get("status") || "";
    const billable = searchParams.get("billable") || "";
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";

    // Build where clause for filtering
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (userId && userId !== "all") {
      where.userId = userId;
    }

    if (projectId && projectId !== "all") {
      where.projectId = projectId;
    }

    if (status && status !== "all") {
      where.status = status;
    }

    if (billable && billable !== "all") {
      where.billable = billable === "true";
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Fetch time entries with relations
    const timeEntries = await prisma.timeEntry.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });

    // Calculate statistics
    const totalHours = timeEntries.reduce((sum, entry) => sum + entry.hours, 0);
    const billableHours = timeEntries
      .filter((e) => e.billable)
      .reduce((sum, entry) => sum + entry.hours, 0);
    const totalAmount = timeEntries.reduce((sum, entry) => sum + entry.amount, 0);

    const statistics = {
      total: timeEntries.length,
      totalHours: Math.round(totalHours * 100) / 100,
      billableHours: Math.round(billableHours * 100) / 100,
      nonBillableHours: Math.round((totalHours - billableHours) * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      draft: timeEntries.filter((e) => e.status === "DRAFT").length,
      submitted: timeEntries.filter((e) => e.status === "SUBMITTED").length,
      approved: timeEntries.filter((e) => e.status === "APPROVED").length,
      rejected: timeEntries.filter((e) => e.status === "REJECTED").length,
      averageRate: totalHours > 0 ? Math.round((totalAmount / totalHours) * 100) / 100 : 0,
    };

    return NextResponse.json({
      timeEntries,
      statistics,
    });
  } catch (error) {
    console.error("Error fetching time entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch time entries" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["PROJECT_MANAGER", "SUPER_ADMIN", "TEAM_MEMBER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      taskId,
      projectId,
      hours,
      date,
      description,
      billable,
      rate,
      status,
    } = body;

    // Validate required fields
    if (!hours || !date || !rate) {
      return NextResponse.json(
        { error: "Hours, date, and rate are required" },
        { status: 400 }
      );
    }

    // Calculate amount
    const amount = hours * rate;

    // Create time entry
    const timeEntry = await prisma.timeEntry.create({
      data: {
        userId: session.user.id,
        taskId: taskId || null,
        projectId: projectId || null,
        hours: parseFloat(hours),
        duration: parseFloat(hours), // Set duration same as hours for compatibility
        date: new Date(date),
        description: description || null,
        billable: billable !== undefined ? billable : true,
        rate: parseFloat(rate),
        amount: parseFloat(amount.toFixed(2)),
        status: status || "DRAFT",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json({ timeEntry });
  } catch (error) {
    console.error("Error creating time entry:", error);
    return NextResponse.json(
      { error: "Failed to create time entry" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["PROJECT_MANAGER", "SUPER_ADMIN", "TEAM_MEMBER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const entryId = searchParams.get("id");

    if (!entryId) {
      return NextResponse.json(
        { error: "Time entry ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};

    // Only update provided fields
    if (body.hours !== undefined) {
      updateData.hours = parseFloat(body.hours);
      updateData.duration = parseFloat(body.hours);
      // Recalculate amount if hours changed
      const existingEntry = await prisma.timeEntry.findUnique({
        where: { id: entryId },
        select: { rate: true },
      });
      if (existingEntry) {
        updateData.amount = parseFloat((body.hours * existingEntry.rate).toFixed(2));
      }
    }
    if (body.date !== undefined) updateData.date = new Date(body.date);
    if (body.description !== undefined) updateData.description = body.description;
    if (body.billable !== undefined) updateData.billable = body.billable;
    if (body.rate !== undefined) {
      updateData.rate = parseFloat(body.rate);
      // Recalculate amount if rate changed
      const existingEntry = await prisma.timeEntry.findUnique({
        where: { id: entryId },
        select: { hours: true },
      });
      if (existingEntry) {
        updateData.amount = parseFloat((existingEntry.hours * body.rate).toFixed(2));
      }
    }
    if (body.status !== undefined) updateData.status = body.status;
    if (body.taskId !== undefined) updateData.taskId = body.taskId;
    if (body.projectId !== undefined) updateData.projectId = body.projectId;

    const timeEntry = await prisma.timeEntry.update({
      where: { id: entryId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json({ timeEntry });
  } catch (error) {
    console.error("Error updating time entry:", error);
    return NextResponse.json(
      { error: "Failed to update time entry" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["PROJECT_MANAGER", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const entryId = searchParams.get("id");

    if (!entryId) {
      return NextResponse.json(
        { error: "Time entry ID is required" },
        { status: 400 }
      );
    }

    // Delete the time entry
    await prisma.timeEntry.delete({
      where: { id: entryId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting time entry:", error);
    return NextResponse.json(
      { error: "Failed to delete time entry" },
      { status: 500 }
    );
  }
}
