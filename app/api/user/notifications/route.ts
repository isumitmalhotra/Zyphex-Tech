import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import logger from "@/lib/logger"

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

    // Fetch notifications from database with persistent read state
    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    // Count unread notifications
    const unreadCount = await prisma.notification.count({
      where: { 
        userId: user.id, 
        read: false 
      }
    })

    // If no notifications exist, generate initial notifications from existing data
    if (notifications.length === 0) {
      await generateInitialNotifications(user.id)
      
      // Fetch again after generation
      const newNotifications = await prisma.notification.findMany({
        where: { userId: user.id },
        include: {
          project: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      })

      const newUnreadCount = await prisma.notification.count({
        where: { 
          userId: user.id, 
          read: false 
        }
      })

      return NextResponse.json({
        notifications: newNotifications,
        unreadCount: newUnreadCount,
        success: true
      })
    }

    return NextResponse.json({
      notifications,
      unreadCount,
      success: true
    })

  } catch (error) {
    logger.error('Error fetching notifications:', { error, userId: session?.user?.email })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Helper function to generate initial notifications from existing data
async function generateInitialNotifications(userId: string) {
  const [
      recentTasks,
      unreadMessages,
      recentInvoices,
      recentDocuments,
      projectUpdates
    ] = await Promise.all([
      // Recent task assignments/updates
      prisma.task.findMany({
        where: {
          assigneeId: userId,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        },
        include: {
          project: { select: { id: true, name: true } },
          creator: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),

      // Unread messages
      prisma.message.findMany({
        where: {
          receiverId: userId,
          readAt: null,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        },
        include: {
          sender: { select: { name: true } },
          project: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),

      // Recent invoices
      prisma.invoice.findMany({
        where: {
          project: {
            users: { some: { id: userId } }
          },
          createdAt: {
            gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) // Last 14 days
          }
        },
        include: {
          project: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 3
      }),

      // Recent documents
      prisma.document.findMany({
        where: {
          project: {
            users: { some: { id: userId } }
          },
          userId: { not: userId }, // Documents uploaded by others
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        },
        include: {
          user: { select: { name: true } },
          project: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),

      // Recent project updates
      prisma.project.findMany({
        where: {
          users: { some: { id: userId } },
          updatedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: 5
      })
    ])

  // Create notifications in database
  const notificationsToCreate = []

  // Task notifications
  for (const task of recentTasks) {
    notificationsToCreate.push({
      userId,
      title: "New Task Assigned",
      message: `You have been assigned "${task.title}" in ${task.project.name}`,
      type: "TASK",
      relatedType: "task",
      relatedId: task.id,
      projectId: task.projectId,
      actionUrl: `/user/projects/${task.projectId}`,
      createdAt: task.createdAt
    })
  }

  // Message notifications
  for (const message of unreadMessages) {
    notificationsToCreate.push({
      userId,
      title: "New Message",
      message: `New message from ${message.sender.name || 'Team member'}${message.project ? ` about ${message.project.name}` : ''}`,
      type: "MESSAGE",
      relatedType: "message",
      relatedId: message.id,
      projectId: message.projectId,
      actionUrl: `/user/messages`,
      createdAt: message.createdAt
    })
  }

  // Invoice notifications
  for (const invoice of recentInvoices) {
    notificationsToCreate.push({
      userId,
      title: "Invoice Generated",
      message: `Invoice #${invoice.invoiceNumber} has been generated for ${invoice.project?.name || 'your project'}`,
      type: "BILLING",
      relatedType: "invoice",
      relatedId: invoice.id,
      projectId: invoice.projectId,
      actionUrl: `/user/invoices/${invoice.id}`,
      createdAt: invoice.createdAt,
      read: true // Invoices are considered seen when generated
    })
  }

  // Document notifications
  for (const document of recentDocuments) {
    notificationsToCreate.push({
      userId,
      title: "Document Uploaded",
      message: `${document.user.name || 'Team member'} uploaded "${document.filename}"${document.project ? ` to ${document.project.name}` : ''}`,
      type: "DOCUMENT",
      relatedType: "document",
      relatedId: document.id,
      projectId: document.projectId,
      actionUrl: `/user/documents`,
      createdAt: document.createdAt
    })
  }

  // Project update notifications
  for (const project of projectUpdates) {
    notificationsToCreate.push({
      userId,
      title: "Project Updated",
      message: `${project.name} has been updated - Status: ${project.status}`,
      type: "PROJECT_UPDATE",
      relatedType: "project",
      relatedId: project.id,
      projectId: project.id,
      actionUrl: `/user/projects/${project.id}`,
      createdAt: project.updatedAt
    })
  }

  // Create all notifications
  if (notificationsToCreate.length > 0) {
    await prisma.notification.createMany({
      data: notificationsToCreate,
      skipDuplicates: true
    })
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

    const { notificationId } = await request.json()

    if (!notificationId) {
      return NextResponse.json({ error: "Notification ID is required" }, { status: 400 })
    }

    // Update notification read status in database
    const notification = await prisma.notification.update({
      where: { 
        id: notificationId,
        userId: user.id // Ensure user owns this notification
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
    logger.error('Error updating notification:', { error })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - Create new notification (for testing or manual creation)
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

// DELETE - Mark all as read or delete notifications
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
      // Delete specific notification
      await prisma.notification.delete({
        where: { 
          id: notificationId,
          userId: user.id
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