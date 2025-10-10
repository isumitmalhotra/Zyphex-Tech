import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET - Fetch all messages (admin can see all)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if user is admin
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    // Fetch all messages where admin is the receiver (messages sent TO admin)
    const messages = await prisma.message.findMany({
      where: {
        receiverId: user.id
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
        parent: {
          select: {
            id: true,
            subject: true
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
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    })

    // Calculate unread count
    const unreadCount = messages.filter(m => !m.readAt).length

    return NextResponse.json({
      messages,
      unreadCount,
      success: true
    })

  } catch (error) {
    console.error('Error fetching admin messages:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - Send a message/reply
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if user is admin
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { content, recipientId, subject, parentId, projectId } = await request.json()

    if (!content || !recipientId) {
      return NextResponse.json(
        { error: "Content and recipient are required" },
        { status: 400 }
      )
    }

    // Verify recipient exists and get their role for routing
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { 
        id: true, 
        role: true 
      }
    })

    if (!recipient) {
      return NextResponse.json({ error: "Recipient not found" }, { status: 404 })
    }

    // Determine messages route based on recipient's role
    let messagesRoute = '/user/messages'
    switch (recipient.role) {
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

    // Create the message
    const message = await prisma.message.create({
      data: {
        senderId: user.id,
        receiverId: recipientId,
        subject: subject || "Message from Admin",
        content,
        parentId,
        projectId,
        messageType: parentId ? 'DIRECT' : 'DIRECT'
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
            image: true,
            role: true
          }
        }
      }
    })

    // Create a notification for the recipient with role-based routing
    await prisma.notification.create({
      data: {
        userId: recipientId,
        title: "New Message from Admin",
        message: `You have received a new message: ${subject || "Message from Admin"}`,
        type: "MESSAGE",
        relatedType: "message",
        relatedId: message.id,
        actionUrl: `${messagesRoute}?id=${message.id}`,
        projectId
      }
    }).catch(() => {
      // Ignore if notification creation fails
    })

    return NextResponse.json({
      success: true,
      message
    })

  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
