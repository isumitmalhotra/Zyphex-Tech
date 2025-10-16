/**
 * Unified Messaging API - Search Endpoint
 * 
 * GET /api/messaging/search - Global search for messages, channels, and users
 */

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getVisibleChannels, getVisibleUsers } from "@/lib/messaging/access-control"

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

/**
 * GET /api/messaging/search
 * Search across messages, channels, and users
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
    const type = searchParams.get("type") // 'messages', 'channels', 'users', or 'all'
    const limit = parseInt(searchParams.get("limit") || "20")

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: "Search query must be at least 2 characters" },
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

    const results: any = {
      messages: [],
      channels: [],
      users: []
    }

    // Search messages
    if (type === 'messages' || type === 'all' || !type) {
      // Get all accessible channels first
      const allChannels = await prisma.channel.findMany({
        include: { members: true }
      })
      const accessibleChannels = getVisibleChannels(currentUser, allChannels)
      const channelIds = accessibleChannels.map(c => c.id)

      const messages = await prisma.message.findMany({
        where: {
          channelId: { in: channelIds },
          content: {
            contains: query,
            mode: 'insensitive'
          }
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
          channel: {
            select: {
              id: true,
              name: true,
              type: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      })

      results.messages = messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        sender: msg.sender,
        channel: msg.channel,
        createdAt: msg.createdAt,
        type: 'message'
      }))
    }

    // Search channels
    if (type === 'channels' || type === 'all' || !type) {
      const allChannels = await prisma.channel.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } }
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
          project: {
            select: {
              id: true,
              name: true
            }
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: {
              content: true,
              createdAt: true
            }
          }
        },
        take: limit
      })

      const accessibleChannels = getVisibleChannels(currentUser, allChannels)

      results.channels = accessibleChannels.map(channel => ({
        id: channel.id,
        name: channel.name,
        description: channel.description,
        channelType: channel.type,
        isPrivate: channel.isPrivate,
        memberCount: channel.members?.length || 0,
        project: channel.project,
        lastMessage: channel.messages?.[0] || null,
        type: 'channel'
      }))
    }

    // Search users
    if (type === 'users' || type === 'all' || !type) {
      const allUsers = await prisma.user.findMany({
        where: {
          deletedAt: null,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } }
          ]
        },
        include: {
          projects: { select: { id: true, name: true } },
          managedProjects: { select: { id: true, name: true } }
        },
        take: limit
      })

      const accessibleUsers = getVisibleUsers(currentUser, allUsers)

      results.users = accessibleUsers.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        projects: user.projects,
        type: 'user'
      }))
    }

    const totalResults = 
      results.messages.length +
      results.channels.length +
      results.users.length

    return NextResponse.json({
      query,
      results,
      totalResults,
      counts: {
        messages: results.messages.length,
        channels: results.channels.length,
        users: results.users.length
      }
    })

  } catch (error) {
    console.error("Error searching:", error)
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    )
  }
}
