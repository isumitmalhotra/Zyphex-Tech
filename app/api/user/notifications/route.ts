import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

    // Generate real notifications from existing data
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
          assigneeId: user.id,
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
          receiverId: user.id,
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
            users: { some: { id: user.id } }
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
            users: { some: { id: user.id } }
          },
          userId: { not: user.id }, // Documents uploaded by others
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
          users: { some: { id: user.id } },
          updatedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: 5
      })
    ])

    // Build notifications from real data
    const notifications: Array<{
      id: string
      title: string
      message: string
      type: string
      read: boolean
      createdAt: Date
      projectId?: string | null
      relatedId: string
    }> = []

    // Task notifications
    recentTasks.forEach(task => {
      notifications.push({
        id: `task-${task.id}`,
        title: "New Task Assigned",
        message: `You have been assigned "${task.title}" in ${task.project.name}`,
        type: "task",
        read: false,
        createdAt: task.createdAt,
        projectId: task.projectId,
        relatedId: task.id
      })
    })

    // Message notifications
    unreadMessages.forEach(message => {
      notifications.push({
        id: `message-${message.id}`,
        title: "New Message",
        message: `New message from ${message.sender.name || 'Team member'}${message.project ? ` about ${message.project.name}` : ''}`,
        type: "message",
        read: false,
        createdAt: message.createdAt,
        projectId: message.projectId,
        relatedId: message.id
      })
    })

    // Invoice notifications
    recentInvoices.forEach(invoice => {
      notifications.push({
        id: `invoice-${invoice.id}`,
        title: "Invoice Generated",
        message: `Invoice #${invoice.invoiceNumber} has been generated for ${invoice.project?.name || 'your project'}`,
        type: "billing",
        read: true, // Assume invoices are seen when generated
        createdAt: invoice.createdAt,
        projectId: invoice.projectId,
        relatedId: invoice.id
      })
    })

    // Document notifications
    recentDocuments.forEach(document => {
      notifications.push({
        id: `document-${document.id}`,
        title: "Document Uploaded",
        message: `${document.user.name || 'Team member'} uploaded "${document.filename}"${document.project ? ` to ${document.project.name}` : ''}`,
        type: "document",
        read: false,
        createdAt: document.createdAt,
        projectId: document.projectId,
        relatedId: document.id
      })
    })

    // Project update notifications
    projectUpdates.forEach(project => {
      notifications.push({
        id: `project-${project.id}`,
        title: "Project Updated",
        message: `${project.name} has been updated - Status: ${project.status}`,
        type: "project_update",
        read: false,
        createdAt: project.updatedAt,
        projectId: project.id,
        relatedId: project.id
      })
    })

    // Sort by date and limit
    const sortedNotifications = notifications
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20)

    const unreadCount = sortedNotifications.filter(n => !n.read).length

    return NextResponse.json({
      notifications: sortedNotifications,
      unreadCount,
      success: true
    })

  } catch (error) {
    console.error("Error fetching notifications:", error)
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

    const { notificationId } = await request.json()

    if (!notificationId) {
      return NextResponse.json({ error: "Notification ID is required" }, { status: 400 })
    }

    // Handle notification read status update
    // Since we don't have a Notification model, we'll handle specific types
    const [type, relatedId] = notificationId.split('-')
    
    if (type === 'message' && relatedId) {
      // Mark message as read
      await prisma.message.update({
        where: { id: relatedId },
        data: { readAt: new Date() }
      })
    }
    
    // For other notification types, we'll just return success
    // In a real implementation, you'd have a Notification model to update
    
    return NextResponse.json({
      success: true,
      message: "Notification updated successfully"
    })

  } catch (error) {
    console.error("Error updating notification:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}