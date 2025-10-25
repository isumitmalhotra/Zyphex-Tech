import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET: Fetch messages for a channel
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const channelId = searchParams.get('channelId')
    const _limit = parseInt(searchParams.get('limit') || '50')
    const _before = searchParams.get('before') // For pagination

    if (!channelId) {
      return NextResponse.json({ error: 'Channel ID required' }, { status: 400 })
    }

    // Mock messages data
    const mockMessages = [
      {
        id: 'msg-1',
        content: 'Hey team! Welcome to the channel 👋',
        channelId,
        senderId: 'user-1',
        sender: {
          id: 'user-1',
          name: 'Alice Johnson',
          avatar: null,
          status: 'ONLINE'
        },
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        updatedAt: null,
        reactions: [
          { emoji: '👍', count: 3, users: ['user-2', 'user-3', 'user-4'] }
        ],
        attachments: [],
        mentions: [],
        isEdited: false,
        isDeleted: false
      },
      {
        id: 'msg-2',
        content: 'Thanks for adding me! Excited to collaborate',
        channelId,
        senderId: 'user-2',
        sender: {
          id: 'user-2',
          name: 'Bob Smith',
          avatar: null,
          status: 'ONLINE'
        },
        createdAt: new Date(Date.now() - 3000000).toISOString(),
        updatedAt: null,
        reactions: [],
        attachments: [],
        mentions: ['user-1'],
        isEdited: false,
        isDeleted: false
      },
      {
        id: 'msg-3',
        content: '@Alice Johnson Can you share the project requirements?',
        channelId,
        senderId: 'user-3',
        sender: {
          id: 'user-3',
          name: 'Carol Davis',
          avatar: null,
          status: 'AWAY'
        },
        createdAt: new Date(Date.now() - 1800000).toISOString(),
        updatedAt: null,
        reactions: [],
        attachments: [
          {
            id: 'att-1',
            name: 'requirements.pdf',
            size: 245000,
            type: 'application/pdf',
            url: '/uploads/requirements.pdf'
          }
        ],
        mentions: ['user-1'],
        isEdited: false,
        isDeleted: false
      }
    ]

    return NextResponse.json({ 
      messages: mockMessages,
      hasMore: false 
    })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

// POST: Send new message
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { channelId, content, mentions, attachments } = body

    if (!channelId || !content) {
      return NextResponse.json(
        { error: 'Channel ID and content required' },
        { status: 400 }
      )
    }

    // Mock message creation
    const newMessage = {
      id: `msg-${Date.now()}`,
      content,
      channelId,
      senderId: session.user.id,
      sender: {
        id: session.user.id,
        name: session.user.name || 'Anonymous',
        avatar: session.user.image || null,
        status: 'ONLINE'
      },
      createdAt: new Date().toISOString(),
      updatedAt: null,
      reactions: [],
      attachments: attachments || [],
      mentions: mentions || [],
      isEdited: false,
      isDeleted: false
    }

    return NextResponse.json({ message: newMessage })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}

// PATCH: Edit message
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { messageId, content } = body

    if (!messageId || !content) {
      return NextResponse.json(
        { error: 'Message ID and content required' },
        { status: 400 }
      )
    }

    // Mock message update
    const updatedMessage = {
      id: messageId,
      content,
      updatedAt: new Date().toISOString(),
      isEdited: true
    }

    return NextResponse.json({ message: updatedMessage })
  } catch (error) {
    console.error('Error editing message:', error)
    return NextResponse.json(
      { error: 'Failed to edit message' },
      { status: 500 }
    )
  }
}

// DELETE: Delete message
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const messageId = searchParams.get('id')

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID required' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting message:', error)
    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500 }
    )
  }
}
