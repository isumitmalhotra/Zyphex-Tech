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
          where: {
            clientId: { not: "" }
          },
          select: {
            id: true,
            name: true,
            status: true,
            manager: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            users: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            }
          }
        }
      }
    })

    if (!user || user.role !== 'CLIENT') {
      return NextResponse.json({ error: "Access denied - Client access required" }, { status: 403 })
    }

    // Get client's project IDs from their assigned projects
    const clientProjectIds = user.projects.map((p: any) => p.id)

    if (!clientProjectIds.length) {
      return NextResponse.json({ error: "No projects assigned" }, { status: 404 })
    }

    // Get channels the client has access to:
    // 1. Project channels for their assigned projects only
    // 2. Direct message channels they're part of with their project team members
    const channels = await prisma.channel.findMany({
      where: {
        OR: [
          // Project channels for client's projects
          {
            type: 'PROJECT',
            projectId: { in: clientProjectIds }
          },
          // Direct message channels client is a member of
          {
            type: 'DIRECT',
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
        project: channels.filter(c => c.type === 'PROJECT').length,
        direct: channels.filter(c => c.type === 'DIRECT').length,
        unreadTotal: channelsWithUnread.reduce((sum, channel) => sum + channel.unreadCount, 0)
      },
      clientInfo: {
        projects: user.projects.map((project: any) => ({
          id: project.id,
          name: project.name,
          status: project.status,
          manager: project.manager,
          teamMembers: project.users.filter((u: any) => u.role !== 'CLIENT')
        }))
      }
    })

  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}