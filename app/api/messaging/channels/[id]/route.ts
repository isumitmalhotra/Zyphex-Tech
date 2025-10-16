/**
 * Unified Messaging API - Channel Details & Messages
 * 
 * GET    /api/messaging/channels/[id] - Get channel details and messages
 * PUT    /api/messaging/channels/[id] - Update channel
 * DELETE /api/messaging/channels/[id] - Archive channel
 */

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { canAccessChannel } from "@/lib/messaging/access-control"

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * GET /api/messaging/channels/[id]
 * Get channel details with messages (paginated)
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id: channelId } = params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "50")
    const before = searchParams.get("before") // Cursor for pagination

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        projects: { select: { id: true } },
        managedProjects: { select: { id: true } }
      }
    })

    if (!currentUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Get channel with members
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        members: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true
          }
        },
        project: {
          select: {
            id: true,
            name: true,
            status: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    })

    if (!channel) {
      return NextResponse.json(
        { error: "Channel not found" },
        { status: 404 }
      )
    }

    // Check access
    if (!canAccessChannel(currentUser, channel)) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      )
    }

    // Get messages with pagination
    const messages = await prisma.message.findMany({
      where: {
        channelId,
        ...(before && {
          createdAt: { lt: new Date(before) }
        })
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true
          }
        },
        reads: {
          where: { userId: session.user.id },
          select: { readAt: true }
        },
        reactions: {
          select: {
            id: true,
            emoji: true,
            userId: true,
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        parent: {
          select: {
            id: true,
            content: true,
            sender: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        replies: {
          take: 3,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            content: true,
            createdAt: true,
            sender: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    // Reverse to show oldest first
    messages.reverse()

    // Mark messages as read
    const unreadMessageIds = messages
      .filter(m => m.reads.length === 0 && m.senderId !== session.user.id)
      .map(m => m.id)

    if (unreadMessageIds.length > 0) {
      await prisma.messageRead.createMany({
        data: unreadMessageIds.map(messageId => ({
          messageId,
          userId: session.user.id
        })),
        skipDuplicates: true
      })
    }

    return NextResponse.json({
      channel: {
        id: channel.id,
        name: channel.name,
        description: channel.description,
        type: channel.type,
        isPrivate: channel.isPrivate,
        projectId: channel.projectId,
        project: channel.project,
        members: channel.members,
        memberCount: channel.members.length,
        createdBy: channel.createdBy,
        createdAt: channel.createdAt,
        updatedAt: channel.updatedAt
      },
      messages: messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        sender: msg.sender,
        messageType: msg.messageType,
        priority: msg.priority,
        parentId: msg.parentId,
        parent: msg.parent,
        replies: msg.replies,
        replyCount: msg.replies.length,
        reactions: msg.reactions,
        isRead: msg.reads.length > 0,
        createdAt: msg.createdAt,
        updatedAt: msg.updatedAt
      })),
      hasMore: messages.length === limit
    })

  } catch (error) {
    console.error("Error fetching channel messages:", error)
    return NextResponse.json(
      { error: "Failed to fetch channel messages" },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/messaging/channels/[id]
 * Update channel details (name, description, members)
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id: channelId } = params
    const body = await request.json()
    const { name, description, memberIds } = body

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!currentUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Get channel
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      include: { members: true }
    })

    if (!channel) {
      return NextResponse.json(
        { error: "Channel not found" },
        { status: 404 }
      )
    }

    // Check permissions - only creator or admins can update
    if (
      channel.createdById !== session.user.id &&
      currentUser.role !== "ADMIN" &&
      currentUser.role !== "SUPER_ADMIN"
    ) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    // Update channel
    const updatedChannel = await prisma.channel.update({
      where: { id: channelId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(memberIds && {
          members: {
            set: memberIds.map((id: string) => ({ id }))
          }
        })
      },
      include: {
        members: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true
          }
        },
        project: true
      }
    })

    return NextResponse.json({
      channel: updatedChannel
    })

  } catch (error) {
    console.error("Error updating channel:", error)
    return NextResponse.json(
      { error: "Failed to update channel" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/messaging/channels/[id]
 * Archive a channel (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id: channelId } = params

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!currentUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Get channel
    const channel = await prisma.channel.findUnique({
      where: { id: channelId }
    })

    if (!channel) {
      return NextResponse.json(
        { error: "Channel not found" },
        { status: 404 }
      )
    }

    // Check permissions - only creator or admins can delete
    if (
      channel.createdById !== session.user.id &&
      currentUser.role !== "ADMIN" &&
      currentUser.role !== "SUPER_ADMIN"
    ) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    // For now, just delete - in production you might want to archive
    await prisma.channel.delete({
      where: { id: channelId }
    })

    return NextResponse.json({
      success: true,
      message: "Channel deleted successfully"
    })

  } catch (error) {
    console.error("Error deleting channel:", error)
    return NextResponse.json(
      { error: "Failed to delete channel" },
      { status: 500 }
    )
  }
}
