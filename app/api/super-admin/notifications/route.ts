import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Mark as dynamic route
export const dynamic = 'force-dynamic'
export const revalidate = 0

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

    // Fetch admin notifications - including all system-wide notifications
    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { userId: user.id }, // Personal notifications
          { type: 'SYSTEM' }, // System-wide notifications
        ]
      },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100 // Show more for admins
    })

    // Also fetch notifications about new messages from users
    const userMessages = await prisma.message.findMany({
      where: {
        receiverId: user.id,
        readAt: null,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        project: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    // Create notifications for unread messages if they don't exist
    const messageNotifications = []
    for (const message of userMessages) {
      // Check if notification already exists for this message
      const existingNotif = notifications.find(
        n => n.relatedType === 'message' && n.relatedId === message.id
      )
      
      if (!existingNotif) {
        messageNotifications.push({
          id: `msg-${message.id}`,
          userId: user.id,
          title: "New Message",
          message: `New message from ${message.sender.name || message.sender.email}${message.subject ? `: ${message.subject}` : ''}`,
          type: "MESSAGE",
          read: false,
          readAt: null,
          relatedType: "message",
          relatedId: message.id,
          projectId: message.projectId,
          actionUrl: `/super-admin/messages?id=${message.id}`,
          createdAt: message.createdAt,
          updatedAt: message.updatedAt,
          project: message.project
        })
      }
    }

    // Combine database notifications with message notifications
    const allNotifications = [...notifications, ...messageNotifications]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // Count unread notifications
    const unreadCount = allNotifications.filter(n => !n.read).length

    return NextResponse.json({
      notifications: allNotifications,
      unreadCount,
      success: true
    })

  } catch (error) {
    console.error('Error fetching admin notifications:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
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

    const { notificationId } = await request.json()

    if (!notificationId) {
      return NextResponse.json({ error: "Notification ID is required" }, { status: 400 })
    }

    // Handle temporary message notifications
    if (notificationId.startsWith('msg-')) {
      const messageId = notificationId.replace('msg-', '')
      
      // Mark the message as read
      await prisma.message.updateMany({
        where: { 
          id: messageId,
          receiverId: user.id
        },
        data: { readAt: new Date() }
      })

      return NextResponse.json({
        success: true,
        message: "Message marked as read"
      })
    }

    // Update notification read status in database
    const notification = await prisma.notification.update({
      where: { 
        id: notificationId
      },
      data: { 
        read: true, 
        readAt: new Date() 
      }
    })

    // Also mark related message as read if it's a message notification
    if (notification.relatedType === 'message' && notification.relatedId) {
      await prisma.message.updateMany({
        where: { 
          id: notification.relatedId,
          receiverId: user.id
        },
        data: { readAt: new Date() }
      }).catch(() => {
        // Ignore if message doesn't exist or already read
      })
    }
    
    return NextResponse.json({
      success: true,
      notification
    })

  } catch (error) {
    console.error('Error updating notification:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

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

    const { title, message, type, projectId, actionUrl, relatedType, relatedId } = await request.json()

    if (!title || !message) {
      return NextResponse.json({ error: "Title and message are required" }, { status: 400 })
    }

    const notification = await prisma.notification.create({
      data: {
        userId: user.id,
        title,
        message,
        type: type || "INFO",
        projectId,
        actionUrl,
        relatedType,
        relatedId
      }
    })

    return NextResponse.json({
      success: true,
      notification
    })

  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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

    const { action, notificationId } = await request.json()

    if (action === 'markAllRead') {
      // Mark all notifications as read
      await prisma.notification.updateMany({
        where: { 
          userId: user.id,
          read: false
        },
        data: { 
          read: true, 
          readAt: new Date() 
        }
      })

      // Also mark all messages as read
      await prisma.message.updateMany({
        where: {
          receiverId: user.id,
          readAt: null
        },
        data: {
          readAt: new Date()
        }
      })

      return NextResponse.json({
        success: true,
        message: "All notifications marked as read"
      })
    } else if (action === 'deleteRead') {
      // Delete all read notifications
      await prisma.notification.deleteMany({
        where: { 
          userId: user.id,
          read: true
        }
      })

      return NextResponse.json({
        success: true,
        message: "Read notifications deleted"
      })
    } else if (notificationId) {
      // Handle temporary message notifications
      if (notificationId.startsWith('msg-')) {
        return NextResponse.json({
          success: true,
          message: "Temporary notification dismissed"
        })
      }

      // Delete specific notification
      await prisma.notification.delete({
        where: { 
          id: notificationId
        }
      })

      return NextResponse.json({
        success: true,
        message: "Notification deleted"
      })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })

  } catch (error) {
    console.error('Error deleting notification:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
