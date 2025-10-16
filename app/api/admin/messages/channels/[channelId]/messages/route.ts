import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { channelId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { channelId } = params;

    // Verify user has access to this channel
    const channel = await (prisma as any).channel.findFirst({
      where: {
        id: channelId,
        OR: [
          { members: { some: { id: user.id } } },
          { type: "TEAM" }, // Team channels are visible to all team members
          { isPrivate: false }, // Public channels are visible to all
          // Admins can see all channels
          ...(user.role === "ADMIN" || user.role === "SUPER_ADMIN" ? [{}] : []),
        ],
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
      },
    });

    if (!channel) {
      return NextResponse.json(
        {
          error: "Channel not found or access denied",
        },
        { status: 404 }
      );
    }

    // Get query parameters for pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const before = searchParams.get("before"); // Message ID for pagination
    const search = searchParams.get("search");

    // Build where conditions for messages
    const whereConditions: any = {
      channelId: channelId,
      parentId: null, // Only get top-level messages (not replies)
    };

    if (before) {
      whereConditions.id = { lt: before };
    }

    if (search) {
      whereConditions.content = {
        contains: search,
        mode: "insensitive",
      };
    }

    // Get messages with replies
    const messages = await (prisma as any).message.findMany({
      where: whereConditions,
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
        replies: {
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
          orderBy: { createdAt: "asc" },
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: (page - 1) * limit,
    });

    // Transform messages
    const transformedMessages = messages.map((message: any) => ({
      id: message.id,
      content: message.content,
      sender: {
        id: message.sender.id,
        name: message.sender.name,
        email: message.sender.email,
        image: message.sender.image,
        role: message.sender.role,
      },
      channelId: message.channelId,
      parentId: message.parentId,
      messageType: message.messageType,
      isEdited: message.updatedAt > message.createdAt,
      createdAt: message.createdAt.toISOString(),
      updatedAt: message.updatedAt.toISOString(),
      replies:
        message.replies?.map((reply: any) => ({
          id: reply.id,
          content: reply.content,
          sender: {
            id: reply.sender.id,
            name: reply.sender.name,
            email: reply.sender.email,
            image: reply.sender.image,
            role: reply.sender.role,
          },
          createdAt: reply.createdAt.toISOString(),
          isEdited: reply.updatedAt > reply.createdAt,
        })) || [],
      reactions:
        message.reactions?.map((reaction: any) => ({
          id: reaction.id,
          emoji: reaction.emoji,
          user: {
            id: reaction.user.id,
            name: reaction.user.name,
            image: reaction.user.image,
          },
        })) || [],
      replyCount: message._count?.replies || 0,
    }));

    // Mark messages as read for this user
    if (transformedMessages.length > 0) {
      await (prisma as any).messageRead.createMany({
        data: transformedMessages.map((msg: any) => ({
          messageId: msg.id,
          userId: user.id,
          readAt: new Date(),
        })),
        skipDuplicates: true,
      });
    }

    // Get total count for pagination
    const totalCount = await (prisma as any).message.count({
      where: {
        channelId: channelId,
        parentId: null,
      },
    });

    return NextResponse.json({
      messages: transformedMessages.reverse(), // Reverse to show oldest first
      channel: {
        id: channel.id,
        name: channel.name,
        description: channel.description,
        type: channel.type,
        members: channel.members.map((member: any) => ({
          id: member.id,
          name: member.name,
          email: member.email,
          image: member.image,
          role: member.role,
        })),
      },
      pagination: {
        page,
        limit,
        total: totalCount,
        hasMore: page * limit < totalCount,
      },
    });
  } catch (error) {
    console.error("Error fetching channel messages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
