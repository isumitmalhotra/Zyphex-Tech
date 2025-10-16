/**
 * Unified Messaging API - Mark Message as Read
 * 
 * PUT /api/messaging/messages/[id] - Mark message as read
 */

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * PUT /api/messaging/messages/[id]
 * Mark a message as read
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id: messageId } = params

    // Check if message exists
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        channel: true
      }
    })

    if (!message) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      )
    }

    // Create or update read status
    await prisma.messageRead.upsert({
      where: {
        messageId_userId: {
          messageId,
          userId: session.user.id
        }
      },
      update: {
        readAt: new Date()
      },
      create: {
        messageId,
        userId: session.user.id,
        readAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: "Message marked as read"
    })

  } catch (error) {
    console.error("Error marking message as read:", error)
    return NextResponse.json(
      { error: "Failed to mark message as read" },
      { status: 500 }
    )
  }
}
