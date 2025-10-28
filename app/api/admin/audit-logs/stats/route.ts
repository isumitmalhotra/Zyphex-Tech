import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    // Get total logs count
    const totalLogs = await prisma.auditLog.count()

    // Get logs created today
    const logsToday = await prisma.auditLog.count({
      where: {
        createdAt: {
          gte: oneDayAgo
        }
      }
    })

    // Get unique users count (users who created logs)
    const uniqueUsers = await prisma.auditLog.groupBy({
      by: ['userId'],
      where: {
        createdAt: {
          gte: oneDayAgo
        }
      }
    })

    // Get categories count
    const categories = await prisma.auditLog.groupBy({
      by: ['resource'],
      where: {
        resource: {
          not: null
        }
      }
    })

    return NextResponse.json({
      totalLogs,
      logsToday,
      uniqueUsers: uniqueUsers.length,
      categoriesCount: categories.length
    })

  } catch (error) {
    console.error('Audit logs stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit logs stats' },
      { status: 500 }
    )
  }
}
