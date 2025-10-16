/**
 * Unified Messaging API - Messages Endpoint
 * 
 * GET  /api/messaging/messages - Search/filter messages
 * POST /api/messaging/messages - Send a new message
 */

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { canAccessChannel, canMessageUser } from "@/lib/messaging/access-control"
import { getSocketManager } from "@/lib/socket/server"

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

/**
 * GET /api/messaging/messages
 * Search or filter messages
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const channelId = searchParams.get("channelId")
    const limit = parseInt(searchParams.get("limit") || "50")

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

    // Build search criteria
    const where: any = {}

    if (channelId) {
      // Verify access to channel
      const channel = await prisma.channel.findUnique({
        where: { id: channelId },
        include: { members: true }
      })

      if (!channel || !canAccessChannel(currentUser, channel)) {
        return NextResponse.json(
          { error: "Access denied" },
          { status: 403 }
        )
      }

      where.channelId = channelId
    }

    if (query) {
      where.content = {
        contains: query,
        mode: 'insensitive'
      }
    }

    // Get messages
    const messages = await prisma.message.findMany({
      where,
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
        channel: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        reads: {
          where: { userId: session.user.id },
          select: { readAt: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    return NextResponse.json({
      messages: messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        sender: msg.sender,
        channel: msg.channel,
        messageType: msg.messageType,
        isRead: msg.reads.length > 0,
        createdAt: msg.createdAt
      })),
      count: messages.length
    })

  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/messaging/messages
 * Send a new message to a channel or user
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { 
      content, 
      channelId, 
      receiverId, 
      parentId,
      messageType = "DIRECT"
    } = body

    // Validation
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      )
    }

    if (!channelId && !receiverId) {
      return NextResponse.json(
        { error: "Either channelId or receiverId is required" },
        { status: 400 }
      )
    }

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

    let targetChannelId = channelId

    // If sending to a user, find or create DM channel
    if (receiverId && !channelId) {
      const receiver = await prisma.user.findUnique({
        where: { id: receiverId },
        include: {
          projects: { select: { id: true } },
          managedProjects: { select: { id: true } }
        }
      })

      if (!receiver) {
        return NextResponse.json(
          { error: "Receiver not found" },
          { status: 404 }
        )
      }

      // Check if user can message this person
      if (!canMessageUser(currentUser, receiver)) {
        return NextResponse.json(
          { error: "You cannot message this user" },
          { status: 403 }
        )
      }

      // Find existing DM channel
      let dmChannel = await prisma.channel.findFirst({
        where: {
          type: "DIRECT",
          AND: [
            { members: { some: { id: session.user.id } } },
            { members: { some: { id: receiverId } } }
          ]
        }
      })

      // Create DM channel if it doesn't exist
      if (!dmChannel) {
        const receiverName = receiver.name || receiver.email
        dmChannel = await prisma.channel.create({
          data: {
            name: `DM: ${currentUser.name} & ${receiverName}`,
            type: "DIRECT",
            isPrivate: true,
            createdById: session.user.id,
            members: {
              connect: [
                { id: session.user.id },
                { id: receiverId }
              ]
            }
          }
        })
      }

      targetChannelId = dmChannel.id
    }

    // Verify access to channel
    if (targetChannelId) {
      const channel = await prisma.channel.findUnique({
        where: { id: targetChannelId },
        include: { 
          members: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              role: true
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

      if (!canAccessChannel(currentUser, channel)) {
        return NextResponse.json(
          { error: "Access denied" },
          { status: 403 }
        )
      }
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        senderId: session.user.id,
        channelId: targetChannelId,
        receiverId,
        parentId,
        messageType
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
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        channel: {
          select: {
            id: true,
            name: true,
            type: true,
            members: {
              select: {
                id: true,
                role: true
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
        }
      }
    })

    // Update channel timestamp
    if (targetChannelId) {
      await prisma.channel.update({
        where: { id: targetChannelId },
        data: { updatedAt: new Date() }
      })
    }

    // Broadcast via Socket.io using global instance from server.js
    const io = (global as any).socketio
    if (io && message.channel) {
      console.log('🔥 Broadcasting message to channel:', message.channelId)
      
      // Broadcast new message to all members in the channel
      io.to(`channel_${message.channelId}`).emit('new_message', {
        id: message.id,
        content: message.content,
        sender: message.sender,
        receiver: message.receiver,
        channelId: message.channelId,
        parentId: message.parentId,
        parent: message.parent,
        messageType: message.messageType,
        createdAt: message.createdAt,
        timestamp: new Date().toISOString()
      })

      // Send personal notifications to channel members
      if (message.channel.members) {
        message.channel.members.forEach(member => {
          if (member.id !== session.user.id) {
            console.log('📬 Sending notification to user:', member.id)
            io.to(`user_${member.id}`).emit('notification', {
              type: 'MESSAGE',
              title: 'New Message',
              message: `${message.sender.name} sent a message in ${message.channel?.name}`,
              channelId: message.channelId,
              messageId: message.id,
              timestamp: new Date().toISOString()
            })
          }
        })
      }
    } else {
      console.warn('⚠️ Socket.io not available or no channel')
    }

    // Create database notifications for offline users with role-based routing
    if (message.channel?.members) {
      const offlineMembers = message.channel.members.filter(
        m => m.id !== session.user.id
      )

      if (offlineMembers.length > 0) {
        // Get role-based routes for each member
        const notificationsData = offlineMembers.map(member => {
          let messagesRoute = '/user/messages'
          switch (member.role) {
            case 'SUPER_ADMIN':
              messagesRoute = '/super-admin/messages'
              break
            case 'ADMIN':
              messagesRoute = '/admin/messages'
              break
            case 'PROJECT_MANAGER':
              messagesRoute = '/project-manager/messages'
              break
            case 'TEAM_MEMBER':
              messagesRoute = '/team-member/messages'
              break
            case 'CLIENT':
              messagesRoute = '/client/messages'
              break
            default:
              messagesRoute = '/user/messages'
          }

          return {
            userId: member.id,
            title: 'New Message',
            message: `${message.sender.name} sent a message in ${message.channel?.name}`,
            type: 'MESSAGE' as const,
            relatedType: 'message' as const,
            relatedId: message.id,
            actionUrl: `${messagesRoute}?channel=${message.channelId}`
          }
        })

        await prisma.notification.createMany({
          data: notificationsData
        })
      }
    }

    return NextResponse.json({
      message: {
        id: message.id,
        content: message.content,
        sender: message.sender,
        receiver: message.receiver,
        channelId: message.channelId,
        parentId: message.parentId,
        parent: message.parent,
        messageType: message.messageType,
        createdAt: message.createdAt
      }
    }, { status: 201 })

  } catch (error) {
    console.error("Error sending message:", error)
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    )
  }
}
