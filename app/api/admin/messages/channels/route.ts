import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema for channel creation
const createChannelSchema = z.object({
  name: z
    .string()
    .min(1, "Channel name is required")
    .max(50, "Channel name too long"),
  description: z.string().max(255, "Description too long").optional(),
  type: z.enum(["TEAM", "PROJECT", "DIRECT"]),
  isPrivate: z.boolean().default(false),
  projectId: z.string().uuid().optional(),
  memberIds: z.array(z.string().uuid()).optional(),
});

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

    // Get all channels for admin view
    const channels = await (prisma as any).channel.findMany({
      include: {
        members: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
              },
            },
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    // Transform channels data
    const transformedChannels = channels.map((channel: any) => ({
      id: channel.id,
      name: channel.name,
      description: channel.description,
      type: channel.type,
      projectId: channel.projectId,
      isPrivate: channel.isPrivate,
      members: channel.members.length, // Transform to member count
      memberList: channel.members.map((member: any) => ({
        id: member.id,
        name: member.name,
        email: member.email,
        image: member.image,
        role: member.role,
      })),
      unreadCount: 0, // We'll calculate this per user if needed
      lastMessage: channel.messages[0]
        ? {
            id: channel.messages[0].id,
            content: channel.messages[0].content,
            sender: channel.messages[0].sender,
            createdAt: channel.messages[0].createdAt.toISOString(),
          }
        : null,
      lastActivity: channel.messages[0]
        ? new Date(channel.messages[0].createdAt).toLocaleString()
        : new Date(channel.createdAt).toLocaleString(),
      createdAt: channel.createdAt.toISOString(),
      messageCount: channel._count.messages,
    }));

    return NextResponse.json({
      channels: transformedChannels,
      stats: {
        total: channels.length,
        team: channels.filter((c: any) => c.type === "TEAM").length,
        project: channels.filter((c: any) => c.type === "PROJECT").length,
        direct: channels.filter((c: any) => c.type === "DIRECT").length,
        private: channels.filter((c: any) => c.isPrivate).length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    // Parse and validate request body
    const rawBody = await request.json();
    const validationResult = createChannelSchema.safeParse(rawBody);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const { name, description, type, isPrivate, projectId, memberIds } =
      validationResult.data;

    // Validate project exists if projectId is provided
    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        return NextResponse.json(
          {
            error: "Project not found",
          },
          { status: 404 }
        );
      }
    }

    // Check if channel name already exists for this type/project
    const existingChannel = await (prisma as any).channel.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
        type,
        projectId: projectId || null,
      },
    });

    if (existingChannel) {
      return NextResponse.json(
        {
          error: "Channel with this name already exists",
        },
        { status: 409 }
      );
    }

    // Create the channel
    const newChannel = await (prisma as any).channel.create({
      data: {
        name,
        description: description || null,
        type,
        isPrivate,
        projectId: projectId || null,
        createdById: user.id,
        members: {
          connect: [
            { id: user.id }, // Creator is automatically a member
            ...(memberIds || []).map((id) => ({ id })),
          ],
        },
      },
      include: {
        members: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Create initial system message
    await (prisma as any).message.create({
      data: {
        content: `Channel "${name}" created by ${user.name}`,
        messageType: "SYSTEM",
        channelId: newChannel.id,
        senderId: user.id,
      } as any,
    });

    // Log the channel creation activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "CREATE",
        entityType: "CHANNEL",
        entityId: newChannel.id,
        changes: JSON.stringify({
          channelType: type,
          projectId: projectId,
          isPrivate: isPrivate,
          memberCount: newChannel.members.length,
        }),
      },
    });

    const transformedChannel = {
      id: newChannel.id,
      name: newChannel.name,
      description: newChannel.description,
      type: newChannel.type,
      projectId: newChannel.projectId,
      isPrivate: newChannel.isPrivate,
      members: newChannel.members,
      unreadCount: 0,
      lastMessage: null,
      createdAt: newChannel.createdAt.toISOString(),
    };

    return NextResponse.json(
      {
        message: "Channel created successfully",
        channel: transformedChannel,
      },
      { status: 201 }
    );
  } catch (error: any) {
    // Handle Prisma-specific errors
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Channel name already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
