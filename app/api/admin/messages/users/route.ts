import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get all users for admin messaging view
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    // Transform to include status (online/offline based on recent activity)
    const usersWithStatus = users.map((user) => ({
      id: user.id,
      name: user.name || "Unknown User",
      email: user.email,
      role: user.role,
      avatar: user.image,
      status: getUserStatus(user.updatedAt), // Use updatedAt as a proxy for activity
      lastSeen: user.updatedAt
        ? new Date(user.updatedAt).toISOString()
        : undefined,
    }));

    return NextResponse.json({
      users: usersWithStatus,
      success: true,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal server error",
        success: false,
      },
      { status: 500 }
    );
  }
}

function getUserStatus(
  lastLogin: Date | null
): "online" | "away" | "busy" | "offline" {
  if (!lastLogin) return "offline";

  const now = new Date();
  const lastLoginTime = new Date(lastLogin);
  const diffInMinutes = (now.getTime() - lastLoginTime.getTime()) / (1000 * 60);

  if (diffInMinutes < 5) return "online";
  if (diffInMinutes < 30) return "away";
  if (diffInMinutes < 120) return "busy";
  return "offline";
}
