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

    // Get stats for security dashboard
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    // Count active sessions (sessions that haven't expired)
    const activeSessions = await prisma.session.count({
      where: {
        expires: {
          gt: now
        }
      }
    })

    // Count failed login attempts today (from audit logs)
    const failedLoginsToday = await prisma.auditLog.count({
      where: {
        action: 'LOGIN_FAILED',
        createdAt: {
          gte: oneDayAgo
        }
      }
    })

    // Count blocked IPs (check if blockedIP model exists, otherwise return 0)
    let blockedIPs = 0
    try {
      // @ts-expect-error - blockedIP model may not exist
      if (prisma.blockedIP) {
        // @ts-expect-error - blockedIP model may not exist
        blockedIPs = await prisma.blockedIP.count({
          where: {
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: now } }
            ]
          }
        })
      }
    } catch {
      blockedIPs = 0
    }

    // Count suspicious activity (multiple failed logins, unusual access patterns)
    const suspiciousActivity = await prisma.auditLog.count({
      where: {
        resource: 'SECURITY',
        action: {
          in: ['SUSPICIOUS_ACTIVITY', 'MULTIPLE_FAILED_LOGINS', 'UNUSUAL_ACCESS']
        },
        createdAt: {
          gte: oneDayAgo
        }
      }
    })

    return NextResponse.json({
      activeSessions,
      failedLoginsToday,
      blockedIPs,
      suspiciousActivity
    })

  } catch (error) {
    console.error('Security stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch security stats' },
      { status: 500 }
    )
  }
}
