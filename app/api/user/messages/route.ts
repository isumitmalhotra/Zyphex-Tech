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

    // Mock messages data for testing (in real app you'd have a Message model)
    const messages = [
      {
        id: '1',
        subject: 'Project Update: E-commerce Platform',
        content: 'Hi! I wanted to update you on the progress of your e-commerce platform project.',
        senderId: 'team-member-1',
        recipientId: user.id,
        projectId: '1',
        createdAt: '2024-09-24T10:30:00Z',
        read: false,
        from: {
          name: 'John Smith',
          email: 'john@zyphextech.com'
        }
      },
      {
        id: '2',
        subject: 'Invoice Ready for Review',
        content: 'Your invoice for the second phase of development is ready for review.',
        senderId: 'billing-team',
        recipientId: user.id,
        createdAt: '2024-09-23T14:20:00Z',
        read: false,
        from: {
          name: 'Sarah Johnson',
          email: 'billing@zyphextech.com'
        }
      },
      {
        id: '3',
        subject: 'Welcome to Zyphex Tech!',
        content: 'Welcome to Zyphex Tech! We are excited to work with you.',
        senderId: 'support-team',
        recipientId: user.id,
        createdAt: '2024-09-20T09:00:00Z',
        read: true,
        from: {
          name: 'Support Team',
          email: 'support@zyphextech.com'
        }
      }
    ]

    const unreadCount = messages.filter(m => !m.read).length

    return NextResponse.json({
      messages,
      unreadCount,
      stats: {
        total: messages.length,
        unread: unreadCount,
        read: messages.length - unreadCount
      }
    })

  } catch (error) {
    console.error("Error fetching messages:", error)
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

    const { content, recipientId, projectId } = await request.json()

    if (!content?.trim()) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // TODO: Implement actual message creation when Message model is ready
    // For now, return success response
    const newMessage = {
      id: Date.now().toString(),
      content,
      senderId: user.id,
      recipientId,
      projectId,
      createdAt: new Date().toISOString(),
      read: false
    }

    return NextResponse.json({
      message: newMessage,
      success: true
    }, { status: 201 })

  } catch (error) {
    console.error("Error sending message:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}