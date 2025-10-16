/**
 * Unified Messaging API - Channels Endpoint
 * 
 * GET  /api/messaging/channels - List all accessible channels
 * POST /api/messaging/channels - Create a new channel or DM
 */

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getVisibleChannels, canAccessChannel } from "@/lib/messaging/access-control"

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

/**
 * GET /api/messaging/channels
 * Returns all channels the user has access to based on their role
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

    // Get current user with project relationships
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

    // Get all channels with members and project info
    const allChannels = await prisma.channel.findMany({
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
        },
        messages: {
          take: 1,
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
      orderBy: { updatedAt: 'desc' }
    })

    // Filter channels based on role-based access control
    const visibleChannels = getVisibleChannels(currentUser, allChannels)

    // Get unread message counts for each channel
    const channelsWithUnread = await Promise.all(
      visibleChannels.map(async (channel) => {
        // Count unread messages in this channel
        const unreadCount = await prisma.message.count({
          where: {
            channelId: channel.id,
            senderId: { not: currentUser.id },
            reads: {
              none: {
                userId: currentUser.id
              }
            }
          }
        })

        return {
          id: channel.id,
          name: channel.name,
          description: channel.description,
          type: channel.type,
          isPrivate: channel.isPrivate,
          isPinned: channel.isPinned,
          projectId: channel.projectId,
          project: channel.project,
          members: channel.members,
          memberCount: channel.members?.length || 0,
          createdBy: (channel as any).createdBy,
          lastMessage: (channel as any).messages?.[0] || null,
          unreadCount,
          createdAt: channel.createdAt,
          updatedAt: channel.updatedAt
        }
      })
    )

    return NextResponse.json({
      channels: channelsWithUnread,
      totalCount: channelsWithUnread.length
    })

  } catch (error) {
    console.error("Error fetching channels:", error)
    return NextResponse.json(
      { error: "Failed to fetch channels" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/messaging/channels
 * Create a new channel or direct message conversation
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
    const { name, description, type, isPrivate, memberIds, projectId } = body

    // Validation
    if (!name || !type) {
      return NextResponse.json(
        { error: "Name and type are required" },
        { status: 400 }
      )
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!currentUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Check if user has permission to create this type of channel
    const canCreate = canCreateChannel(currentUser.role, type)
    if (!canCreate) {
      return NextResponse.json(
        { error: "Insufficient permissions to create this channel type" },
        { status: 403 }
      )
    }

    // For DIRECT channels, check if conversation already exists
    if (type === "DIRECT" && memberIds && memberIds.length === 1) {
      const otherUserId = memberIds[0]
      
      // Find existing DM channel
      const existingDM = await prisma.channel.findFirst({
        where: {
          type: "DIRECT",
          AND: [
            { members: { some: { id: session.user.id } } },
            { members: { some: { id: otherUserId } } }
          ]
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

      if (existingDM) {
        return NextResponse.json({
          channel: existingDM,
          existing: true
        })
      }
    }

    // Create the channel
    const channel = await prisma.channel.create({
      data: {
        name,
        description,
        type,
        isPrivate: isPrivate || false,
        projectId,
        createdById: session.user.id,
        members: {
          connect: [
            { id: session.user.id },
            ...(memberIds || []).map((id: string) => ({ id }))
          ]
        }
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
        project: {
          select: {
            id: true,
            name: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Create a welcome message for the channel
    if (type !== "DIRECT") {
      await prisma.message.create({
        data: {
          content: `Channel created by ${currentUser.name || 'Unknown'}`,
          channelId: channel.id,
          senderId: session.user.id,
          messageType: "SYSTEM"
        }
      })
    }

    return NextResponse.json({
      channel,
      existing: false
    }, { status: 201 })

  } catch (error) {
    console.error("Error creating channel:", error)
    return NextResponse.json(
      { error: "Failed to create channel" },
      { status: 500 }
    )
  }
}

/**
 * Helper function to check if user can create a specific channel type
 */
function canCreateChannel(userRole: string, channelType: string): boolean {
  switch (userRole) {
    case "SUPER_ADMIN":
    case "ADMIN":
      // Admins can create any type of channel
      return true

    case "PROJECT_MANAGER":
      // PMs can create TEAM, PROJECT, and DIRECT channels
      return ["TEAM", "PROJECT", "DIRECT"].includes(channelType)

    case "TEAM_MEMBER":
    case "CLIENT":
    case "USER":
      // Regular users can only create DIRECT channels
      return channelType === "DIRECT"

    default:
      return false
  }
}
