import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get active sessions with user information
    const now = new Date()

    const sessions = await prisma.session.findMany({
      where: {
        expires: {
          gt: now
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      },
      orderBy: {
        expires: 'desc'
      }
    })

    // Transform sessions to include available info (Session model has limited fields)
    const activeSessions = sessions.map(session => ({
      id: session.id,
      userId: session.userId,
      userName: session.user?.name || 'Unknown',
      userEmail: session.user?.email || 'Unknown',
      ipAddress: 'N/A', // Session model doesn't store IP
      userAgent: 'N/A', // Session model doesn't store user agent
      location: 'N/A', // Session model doesn't store location
      lastActive: session.expires.toISOString(),
      createdAt: session.expires.toISOString() // Session model doesn't have createdAt
    }))

    return NextResponse.json(activeSessions)

  } catch (error) {
    console.error('Active sessions error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch active sessions' },
      { status: 500 }
    )
  }
}
