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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const category = searchParams.get('category') || 'all'
    const period = searchParams.get('period') || '7d'
    const search = searchParams.get('search') || ''

    // Calculate pagination
    const skip = (page - 1) * limit

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

    // Get logs with user information
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
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
        },
        skip,
        take: limit
      }),
      prisma.auditLog.count({ where })
    ])

    // Format the response
    const formatted = logs.map(log => ({
      id: log.id,
      userId: log.userId,
      userName: log.user?.name || 'Unknown',
      userEmail: log.user?.email || 'Unknown',
      action: log.action,
      category: log.resource || 'SYSTEM',
      description: log.details || '',
      ipAddress: log.ipAddress || '',
      userAgent: log.userAgent || '',
      metadata: log.details ? (typeof log.details === 'string' ? JSON.parse(log.details) : log.details) : null,
      createdAt: log.createdAt.toISOString()
    }))

    return NextResponse.json({
      logs: formatted,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    })

  } catch (error) {
    console.error('Audit logs error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    )
  }
}
