import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all users who are clients (excluding the current user)
    const clients = await prisma.user.findMany({
      where: {
        id: { not: session.user.id },
        role: { in: ['CLIENT', 'USER'] }
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        projects: {
          select: {
            id: true,
            name: true,
          },
          take: 1
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Get unread message counts for each client
    const clientsWithUnread = await Promise.all(
      clients.map(async (client) => {
        const unreadCount = await prisma.message.count({
          where: {
            senderId: client.id,
            receiverId: session.user.id,
            readAt: null
          }
        })

        // Get last message
        const lastMessage = await prisma.message.findFirst({
          where: {
            OR: [
              { senderId: client.id, receiverId: session.user.id },
              { senderId: session.user.id, receiverId: client.id }
            ]
          },
          orderBy: {
            createdAt: 'desc'
          },
          select: {
            content: true,
            createdAt: true
          }
        })

        return {
          id: client.id,
          name: client.name || 'Unknown',
          email: client.email || '',
          company: 'Zyphex Client', // Default company name
          avatar: client.image || '',
          status: 'active',
          projectId: client.projects[0]?.id,
          unreadCount,
          lastMessage: lastMessage?.content,
          lastMessageTime: lastMessage?.createdAt.toISOString(),
          isTyping: false
        }
      })
    )

    return NextResponse.json(clientsWithUnread)
  } catch (error) {
    console.error('Error fetching clients:', error)
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
  }
}
