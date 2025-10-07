import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        projects: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      }
    })

    if (!user || (user.role !== 'TEAM_MEMBER' && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Get channels the team member has access to
    // 1. Team channels (if not private)
    // 2. Project channels for projects they're assigned to
    // 3. Direct message channels they're part of

    const userProjectIds = user.projects.map(p => p.id)

    const channels = await prisma.channel.findMany({
      where: {
        OR: [
          // Team channels (public)
          { 
            type: 'TEAM',
            isPrivate: false
          },
          // Project channels for assigned projects
          {
            type: 'PROJECT',
            projectId: { in: userProjectIds }
          },
          // Direct message channels user is a member of
          {
            type: 'DIRECT',
            members: { some: { id: user.id } }
          },
          // Private channels user is explicitly a member of
          {
            isPrivate: true,
            members: { some: { id: user.id } }
          }
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
            name: true,
            status: true
          }
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true
              }
            }
          }
        },
        _count: {
          select: {
            messages: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // Calculate unread count for each channel
    const channelsWithUnread = await Promise.all(
      channels.map(async (channel) => {
        // Get unread messages count
        const unreadCount = await prisma.message.count({
          where: {
            channelId: channel.id,
            senderId: { not: user.id }, // Not sent by current user
            reads: {
              none: {
                userId: user.id
              }
            }
          }
        })

        return {
          id: channel.id,
          name: channel.name,
          description: channel.description,
          type: channel.type,
          projectId: channel.projectId,
          project: channel.project,
          isPrivate: channel.isPrivate,
          members: channel.members,
          unreadCount,
          lastMessage: channel.messages[0] ? {
            id: channel.messages[0].id,
            content: channel.messages[0].content,
            sender: channel.messages[0].sender,
            createdAt: channel.messages[0].createdAt.toISOString()
          } : null,
          createdAt: channel.createdAt.toISOString(),
          messageCount: channel._count.messages
        }
      })
    )

    return NextResponse.json({
      channels: channelsWithUnread,
      stats: {
        total: channels.length,
        team: channels.filter(c => c.type === 'TEAM').length,
        project: channels.filter(c => c.type === 'PROJECT').length,
        direct: channels.filter(c => c.type === 'DIRECT').length,
        unreadTotal: channelsWithUnread.reduce((sum, channel) => sum + channel.unreadCount, 0)
      }
    })

  } catch (error) {
    console.error("Error fetching team member channels:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}