import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: { channelId: string } }
) {
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
            name: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { channelId } = params

    // Verify user has access to this channel
    const userProjectIds = user.projects.map(p => p.id)

    const channel = await prisma.channel.findFirst({
      where: {
        id: channelId,
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
        }
      }
    })

    if (!channel) {
      return NextResponse.json({ 
        error: "Channel not found or access denied" 
      }, { status: 404 })
    }

    // Get query parameters for pagination
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const before = searchParams.get('before') // Message ID for pagination
    const search = searchParams.get('search')

    // Build where conditions for messages
    const whereConditions: any = {
      channelId: channelId,
      parentId: null // Only get top-level messages (not replies)
    }

    if (before) {
      whereConditions.id = { lt: before }
    }

    if (search) {
      whereConditions.content = {
        contains: search,
        mode: 'insensitive'
      }
    }

    // Get messages with replies
    const messages = await prisma.message.findMany({
      where: whereConditions,
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
        replies: {
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
          },
          orderBy: { createdAt: 'asc' }
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          }
        },
        _count: {
          select: {
            replies: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: (page - 1) * limit
    })

    // Transform messages
    const transformedMessages = messages.map(message => ({
      id: message.id,
      content: message.content,
      sender: message.sender,
      channelId: message.channelId,
      parentId: message.parentId,
      messageType: message.messageType,
      isEdited: message.updatedAt > message.createdAt,
      createdAt: message.createdAt.toISOString(),
      updatedAt: message.updatedAt.toISOString(),
      replies: message.replies.map(reply => ({
        id: reply.id,
        content: reply.content,
        sender: reply.sender,
        createdAt: reply.createdAt.toISOString(),
        isEdited: reply.updatedAt > reply.createdAt
      })),
      reactions: message.reactions.map(reaction => ({
        id: reaction.id,
        emoji: reaction.emoji,
        user: reaction.user
      })),
      replyCount: message._count.replies
    }))

    // Mark messages as read for this user
    if (transformedMessages.length > 0) {
      await prisma.messageRead.createMany({
        data: transformedMessages.map(msg => ({
          messageId: msg.id,
          userId: user.id,
          readAt: new Date()
        })),
        skipDuplicates: true
      })
    }

    // Get total count for pagination
    const totalCount = await prisma.message.count({
      where: {
        channelId: channelId,
        parentId: null
      }
    })

    return NextResponse.json({
      messages: transformedMessages.reverse(), // Reverse to show oldest first
      channel: {
        id: channel.id,
        name: channel.name,
        description: channel.description,
        type: channel.type,
        project: channel.project,
        members: channel.members
      },
      pagination: {
        page,
        limit,
        total: totalCount,
        hasMore: page * limit < totalCount
      }
    })

  } catch (error) {
    console.error("Error fetching team member channel messages:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}