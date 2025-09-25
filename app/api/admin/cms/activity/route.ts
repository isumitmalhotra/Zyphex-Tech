// Activity Log API
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { APIResponse, PaginatedResponse } from '@/types/cms'

interface ActivityLogQuery {
  where?: Record<string, unknown>
  skip?: number
  take?: number
  orderBy?: Record<string, string>
}

interface ActivityLogRecord {
  id: string
  action: string
  entityType: string
  entityId: string
  userId: string
  details?: string
  createdAt: Date
}

async function checkPermissions() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return { authorized: false, user: null }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, role: true }
  })

  if (!user || user.role !== 'ADMIN') {
    return { authorized: false, user: null }
  }

  return { authorized: true, user }
}

function createAPIResponse<T>(
  success: boolean,
  data?: T,
  error?: string,
  message?: string
): APIResponse<T> {
  return {
    success,
    data,
    error,
    message,
    timestamp: new Date().toISOString()
  }
}

function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / pageSize)
  
  return {
    data,
    total,
    page,
    pageSize,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  }
}

// GET /api/admin/cms/activity - Get activity logs
export async function GET(request: NextRequest) {
  try {
    const { authorized } = await checkPermissions()
    if (!authorized) {
      return NextResponse.json(
        createAPIResponse(false, null, 'Unauthorized'),
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '50'), 100)
    const skip = (page - 1) * pageSize
    const entityType = searchParams.get('entityType')
    const action = searchParams.get('action')
    const userId = searchParams.get('userId')

    const where: Record<string, unknown> = {}

    if (entityType) {
      where.entityType = entityType
    }

    if (action) {
      where.action = action
    }

    if (userId) {
      where.userId = userId
    }

    // Check if ActivityLog model exists (it might not be in schema yet)
    try {
      const prismaWithActivity = prisma as unknown as {
        activityLog?: {
          findMany: (args: ActivityLogQuery) => Promise<ActivityLogRecord[]>
          count: (args: { where?: Record<string, unknown> }) => Promise<number>
        }
      }

      const [activities, total] = await Promise.all([
        prismaWithActivity.activityLog?.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { createdAt: 'desc' }
        }) || [],
        prismaWithActivity.activityLog?.count({ where }) || 0
      ])

      const paginatedResponse = createPaginatedResponse(activities, total, page, pageSize)
      
      return NextResponse.json(createAPIResponse(true, paginatedResponse))
    } catch {
      // If ActivityLog model doesn't exist, return empty results
      const emptyResponse = createPaginatedResponse([], 0, page, pageSize)
      return NextResponse.json(createAPIResponse(true, emptyResponse))
    }
  } catch (error) {
    console.error('Error fetching activity logs:', error)
    return NextResponse.json(
      createAPIResponse(false, null, 'Failed to fetch activity logs'),
      { status: 500 }
    )
  }
}