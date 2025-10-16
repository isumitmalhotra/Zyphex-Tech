/**
 * Unified Messaging API - Users Endpoint
 * 
 * GET /api/messaging/users - Get all users the current user can message
 */

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getVisibleUsers, getGroupedUsers } from "@/lib/messaging/access-control"

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

/**
 * GET /api/messaging/users
 * Returns all users that the current user can see and message
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
    const grouped = searchParams.get("grouped") === "true"
    const search = searchParams.get("search")

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

    // Get all users with project relationships
    const allUsers = await prisma.user.findMany({
      where: {
        deletedAt: null,
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
          ]
        })
      },
      include: {
        projects: { select: { id: true, name: true } },
        managedProjects: { select: { id: true, name: true } }
      },
      orderBy: { name: 'asc' }
    })

    // Get visible users based on role
    const visibleUsers = getVisibleUsers(currentUser, allUsers)

    // Get unread message counts for each user
    const usersWithUnread = await Promise.all(
      visibleUsers.map(async (user) => {
        // Find DM channel with this user
        const dmChannel = await prisma.channel.findFirst({
          where: {
            type: "DIRECT",
            AND: [
              { members: { some: { id: currentUser.id } } },
              { members: { some: { id: user.id } } }
            ]
          },
          select: { id: true }
        })

        let unreadCount = 0
        if (dmChannel) {
          // Count unread messages from this user
          unreadCount = await prisma.message.count({
            where: {
              channelId: dmChannel.id,
              senderId: user.id,
              reads: {
                none: {
                  userId: currentUser.id
                }
              }
            }
          })
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          projects: user.projects,
          managedProjects: user.managedProjects,
          unreadCount,
          dmChannelId: dmChannel?.id || null
        }
      })
    )

    if (grouped) {
      // Return grouped by role
      const grouped = getGroupedUsers(currentUser, visibleUsers)
      
      return NextResponse.json({
        grouped: {
          admins: usersWithUnread.filter(u => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN'),
          projectManagers: usersWithUnread.filter(u => u.role === 'PROJECT_MANAGER'),
          teamMembers: usersWithUnread.filter(u => u.role === 'TEAM_MEMBER'),
          clients: usersWithUnread.filter(u => u.role === 'CLIENT' || u.role === 'USER')
        },
        totalCount: usersWithUnread.length
      })
    }

    return NextResponse.json({
      users: usersWithUnread,
      totalCount: usersWithUnread.length
    })

  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    )
  }
}
