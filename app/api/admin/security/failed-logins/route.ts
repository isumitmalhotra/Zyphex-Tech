import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') || '24h'

    // Calculate time range
    const now = new Date()
    let startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000) // Default 24 hours

    switch (period) {
      case '1h':
        startDate = new Date(now.getTime() - 60 * 60 * 1000)
        break
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
    }

    // Get failed login attempts from audit logs
    const failedLogins = await prisma.auditLog.findMany({
      where: {
        action: 'LOGIN_FAILED',
        createdAt: {
          gte: startDate
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100
    })

    // Transform to expected format
    const formattedLogins = failedLogins.map(log => {
      let metadata = null
      try {
        metadata = log.details ? JSON.parse(log.details) : null
      } catch {
        metadata = null
      }
      
      return {
        id: log.id,
        email: metadata?.email || 'Unknown',
        ipAddress: log.ipAddress || 'Unknown',
        userAgent: log.userAgent || 'Unknown',
        reason: log.details || 'Unknown',
        attemptedAt: log.createdAt.toISOString()
      }
    })

    return NextResponse.json(formattedLogins)

  } catch (error) {
    console.error('Failed logins error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch failed logins' },
      { status: 500 }
    )
  }
}
