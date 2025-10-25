import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

// Uses server-side session/headers; make this route dynamic
export const dynamic = 'force-dynamic'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const clientId = searchParams.get('clientId')
    const filterType = searchParams.get('filterType') || 'all'
    const filterDate = searchParams.get('filterDate')

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID required' }, { status: 400 })
    }

    // Build filter conditions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereConditions: any = {
      OR: [
        { senderId: session.user.id, receiverId: clientId },
        { senderId: clientId, receiverId: session.user.id }
      ]
    }

    // Filter by type
    if (filterType !== 'all') {
      whereConditions.messageType = filterType.toUpperCase()
    }

    // Filter by date
    if (filterDate) {
      const date = new Date(filterDate)
      const nextDay = new Date(date)
      nextDay.setDate(nextDay.getDate() + 1)
      
      whereConditions.createdAt = {
        gte: date,
        lt: nextDay
      }
    }

    // Fetch messages
    const messages = await prisma.message.findMany({
      where: whereConditions,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Format messages
    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      senderId: msg.senderId,
      senderName: msg.sender.name || 'Unknown',
      senderAvatar: msg.sender.image,
      content: msg.content,
      timestamp: msg.createdAt.toISOString(),
      type: msg.subject ? 'email' : 'message',
      read: !!msg.readAt,
      readAt: msg.readAt?.toISOString(),
      attachments: msg.attachments ? JSON.parse(msg.attachments) : []
    }))

    return NextResponse.json(formattedMessages)
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { clientId, content, subject, attachments = [] } = body

    if (!clientId || !content) {
      return NextResponse.json({ error: 'Client ID and content required' }, { status: 400 })
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        senderId: session.user.id,
        receiverId: clientId,
        content,
        subject: subject || null,
        messageType: 'DIRECT',
        attachments: attachments.length > 0 ? JSON.stringify(attachments) : null
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    })

    // Format response
    const formattedMessage = {
      id: message.id,
      senderId: message.senderId,
      senderName: message.sender.name || 'Unknown',
      senderAvatar: message.sender.image,
      content: message.content,
      timestamp: message.createdAt.toISOString(),
      type: message.subject ? 'email' : 'message',
      read: !!message.readAt,
      attachments: message.attachments ? JSON.parse(message.attachments) : []
    }

    return NextResponse.json(formattedMessage, { status: 201 })
  } catch (error) {
    console.error('Error creating message:', error)
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 })
  }
}
