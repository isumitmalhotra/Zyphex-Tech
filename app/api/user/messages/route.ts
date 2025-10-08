import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Validation schema for message creation
const createMessageSchema = z.object({
  content: z.string().min(1, "Message content is required").max(2000, "Message too long"),
  recipientId: z.string().uuid("Invalid recipient ID").optional(),
  projectId: z.string().uuid("Invalid project ID").optional(),
  subject: z.string().max(255, "Subject too long").optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional()
})

export async function GET(request: NextRequest) {
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

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const search = searchParams.get('search')

    // Build where conditions
    const whereConditions: any = {
      OR: [
        { senderId: user.id },
        { receiverId: user.id }
      ]
    }

    if (projectId) {
      whereConditions.projectId = projectId
    }

    if (unreadOnly) {
      whereConditions.readAt = null
      whereConditions.receiverId = user.id // Only unread received messages
    }

    if (search) {
      whereConditions.AND = [
        { OR: whereConditions.OR },
        {
          OR: [
            { content: { contains: search, mode: 'insensitive' } },
            { subject: { contains: search, mode: 'insensitive' } }
          ]
        }
      ]
      delete whereConditions.OR
    }

    // Get real messages from database
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
            subject: true,
            content: true
          }
        },
        replies: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            sender: {
              select: {
                name: true,
                email: true
              }
            }
          },
          orderBy: { createdAt: 'asc' },
          take: 3
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculate message statistics
    const receivedMessages = messages.filter(m => m.receiverId === user.id)
    const sentMessages = messages.filter(m => m.senderId === user.id)
    const unreadCount = receivedMessages.filter(m => !m.readAt).length
    const threadCount = messages.filter(m => !m.parentId).length

    // Group messages by conversation threads
    const messageThreads = messages.reduce((threads: any[], message) => {
      if (!message.parentId) {
        const thread = {
          ...message,
          replyCount: message.replies.length,
          lastReply: message.replies.length > 0 
            ? message.replies[message.replies.length - 1]
            : null
        }
        threads.push(thread)
      }
      return threads
    }, [])

    return NextResponse.json({
      messages,
      threads: messageThreads,
      stats: {
        total: messages.length,
        received: receivedMessages.length,
        sent: sentMessages.length,
        unread: unreadCount,
        read: receivedMessages.length - unreadCount,
        threads: threadCount,
        unreadRate: receivedMessages.length > 0 
          ? Math.round((unreadCount / receivedMessages.length) * 100)
          : 0
      }
    })

  } catch (error) {
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

    // Parse and validate request body
    const rawBody = await request.json()
    const validationResult = createMessageSchema.safeParse(rawBody)
    
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: "Validation failed", 
        details: validationResult.error.format() 
      }, { status: 400 })
    }

    const { content, recipientId, projectId, subject, priority } = validationResult.data

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Validate recipient exists (if specified)
    if (recipientId) {
      const recipient = await prisma.user.findUnique({
        where: { id: recipientId }
      })
      
      if (!recipient) {
        return NextResponse.json({ 
          error: "Recipient not found" 
        }, { status: 404 })
      }
    }

    // Validate project exists and user has access (if specified)
    if (projectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          OR: [
            { users: { some: { id: user.id } } },
            { managerId: user.id }
          ]
        }
      })
      
      if (!project) {
        return NextResponse.json({ 
          error: "Project not found or access denied" 
        }, { status: 403 })
      }
    }

    // Create the message in database
    const newMessage = await prisma.message.create({
      data: {
        content,
        senderId: user.id,
        receiverId: recipientId || null,
        projectId: projectId || null,
        subject: subject || null,
        messageType: recipientId ? 'DIRECT' : 'BROADCAST',
        priority: priority || 'MEDIUM'
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
        }
      }
    })

    // Log the message creation activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        entityType: 'MESSAGE',
        entityId: newMessage.id,
        changes: JSON.stringify({ 
          messageType: newMessage.messageType,
          projectId: projectId,
          recipientId: recipientId
        })
      }
    })

    return NextResponse.json({
      message: "Message sent successfully",
      data: newMessage
    }, { status: 201 })

  } catch (error: any) {
    
    // Handle Prisma-specific errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "Duplicate message detected" },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}