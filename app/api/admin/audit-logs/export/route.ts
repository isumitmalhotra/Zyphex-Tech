import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

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
    const category = searchParams.get('category') || 'all'
    const period = searchParams.get('period') || '7d'
    const search = searchParams.get('search') || ''

    // Calculate date range
    const now = new Date()
    let startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // Default 7 days

    switch (period) {
      case '1d':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case 'all':
        startDate = new Date(0)
        break
    }

    // Build where clause
    const where: Prisma.AuditLogWhereInput = {
      createdAt: {
        gte: startDate
      }
    }

    if (category !== 'all') {
      where.resource = category.toUpperCase()
    }

    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { details: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } }
      ]
    }

    // Get all logs for export
    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Convert to CSV
    const csvHeader = 'ID,User,Email,Action,Category,Description,IP Address,Timestamp\n'
    const csvRows = logs.map((log) => {
      const row = [
        log.id,
        log.user?.name || 'Unknown',
        log.user?.email || 'Unknown',
        log.action,
        log.resource || 'SYSTEM',
        `"${(log.details || '').replace(/"/g, '""')}"`, // Escape quotes in description
        log.ipAddress || '',
        log.createdAt.toISOString()
      ]
      return row.join(',')
    })

    const csv = csvHeader + csvRows.join('\n')

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })

  } catch (error) {
    console.error('Export audit logs error:', error)
    return NextResponse.json(
      { error: 'Failed to export audit logs' },
      { status: 500 }
    )
  }
}
