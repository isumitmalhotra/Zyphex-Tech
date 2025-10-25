import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET: Fetch all channels for current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For now, return mock channels until Channel model is added
    const mockChannels = [
      {
        id: 'general',
        name: 'general',
        description: 'General team discussions',
        type: 'PUBLIC',
        memberCount: 12,
        unreadCount: 3,
        lastMessage: {
          content: 'Welcome to the team!',
          createdAt: new Date().toISOString(),
          sender: { name: 'System' }
        }
      },
      {
        id: 'project-alpha',
        name: 'project-alpha',
        description: 'Project Alpha development',
        type: 'PUBLIC',
        memberCount: 5,
        unreadCount: 0,
        lastMessage: {
          content: 'Meeting at 3pm today',
          createdAt: new Date().toISOString(),
          sender: { name: 'John Doe' }
        }
      },
      {
        id: 'random',
        name: 'random',
        description: 'Random chat and fun',
        type: 'PUBLIC',
        memberCount: 15,
        unreadCount: 7,
        lastMessage: {
          content: 'Anyone up for lunch?',
          createdAt: new Date().toISOString(),
          sender: { name: 'Jane Smith' }
        }
      }
    ]

    return NextResponse.json({ channels: mockChannels })
  } catch (error) {
    console.error('Error fetching channels:', error)
    return NextResponse.json(
      { error: 'Failed to fetch channels' },
      { status: 500 }
    )
  }
}

// POST: Create new channel
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, type, memberIds } = body

    // Mock channel creation response
    const newChannel = {
      id: `channel-${Date.now()}`,
      name,
      description,
      type: type || 'PUBLIC',
      createdBy: session.user.id,
      createdAt: new Date().toISOString(),
      memberCount: (memberIds?.length || 0) + 1,
      members: memberIds || [],
    }

    return NextResponse.json({ channel: newChannel })
  } catch (error) {
    console.error('Error creating channel:', error)
    return NextResponse.json(
      { error: 'Failed to create channel' },
      { status: 500 }
    )
  }
}
