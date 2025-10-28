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
    const search = searchParams.get("search") || "";
    const availability = searchParams.get("availability") || "";

    // Build where clause for filtering
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      role: {
        in: ["TEAM_MEMBER", "PROJECT_MANAGER"],
      },
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (availability && availability !== "ALL") {
      where.availability = availability;
    }

    // Fetch team members with related data
    const members = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        skills: true,
        hourlyRate: true,
        availability: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            assignedTasks: true,
            projects: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Calculate tasks completed for each member
    const membersWithStats = await Promise.all(
      members.map(async (member) => {
        const tasksCompleted = await prisma.task.count({
          where: {
            assigneeId: member.id,
            status: "DONE",
            deletedAt: null,
          },
        });

        return {
          ...member,
          projectsCount: member._count.projects,
          tasksCompleted,
        };
      })
    );

    // Calculate statistics
    const statistics = {
      total: membersWithStats.length,
      available: membersWithStats.filter((m) => m.availability === "AVAILABLE").length,
      busy: membersWithStats.filter((m) => m.availability === "BUSY").length,
      onVacation: membersWithStats.filter((m) => m.availability === "VACATION").length,
      teamMembers: membersWithStats.filter((m) => m.role === "TEAM_MEMBER").length,
      projectManagers: membersWithStats.filter((m) => m.role === "PROJECT_MANAGER").length,
      totalProjects: membersWithStats.reduce((sum, m) => sum + m.projectsCount, 0),
      totalTasksCompleted: membersWithStats.reduce((sum, m) => sum + m.tasksCompleted, 0),
    };

    return NextResponse.json({
      members: membersWithStats,
      statistics,
    });
  } catch (error) {
    console.error("Error fetching team members:", error);
    return NextResponse.json(
      { error: "Failed to fetch team members" },
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

    if (!["PROJECT_MANAGER", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("id");

    if (!memberId) {
      return NextResponse.json(
        { error: "Member ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};

    // Only update provided fields
    if (body.availability !== undefined) updateData.availability = body.availability;
    if (body.skills !== undefined) updateData.skills = body.skills;
    if (body.hourlyRate !== undefined) updateData.hourlyRate = body.hourlyRate;

    const member = await prisma.user.update({
      where: { id: memberId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        skills: true,
        hourlyRate: true,
        availability: true,
      },
    });

    return NextResponse.json({ member });
  } catch (error) {
    console.error("Error updating team member:", error);
    return NextResponse.json(
      { error: "Failed to update team member" },
      { status: 500 }
    );
  }
}
