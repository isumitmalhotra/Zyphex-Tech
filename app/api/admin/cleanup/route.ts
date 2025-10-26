import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { cleanupPerformanceData } from '@/scripts/cleanup-performance-data'

/**
 * Performance Data Cleanup Endpoint
 * POST /api/admin/cleanup
 * 
 * Triggers automated cleanup of old performance data
 * Only accessible by SUPER_ADMIN users
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get optional configuration from request
    const body = await request.json().catch(() => ({}))
    const config = body.config || undefined

    // Run cleanup
    const results = await cleanupPerformanceData(config)

    return NextResponse.json({
      success: true,
      message: 'Cleanup completed successfully',
      results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error running cleanup:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to run cleanup',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Get cleanup status and statistics
 * GET /api/admin/cleanup
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get current data statistics
    const { prisma } = await import('@/lib/prisma')

    const [
      performanceCount,
      apiCount,
      errorCount,
      queryLogCount,
      healthCheckCount,
    ] = await Promise.all([
      prisma.performanceMetric.count(),
      prisma.apiMetric.count(),
      prisma.errorLog.count(),
      prisma.databaseQueryLog.count(),
      prisma.healthCheck.count(),
    ])

    // Get oldest records
    const [
      oldestPerformance,
      oldestApi,
      oldestError,
      oldestQueryLog,
      oldestHealthCheck,
    ] = await Promise.all([
      prisma.performanceMetric.findFirst({
        orderBy: { timestamp: 'asc' },
        select: { timestamp: true },
      }),
      prisma.apiMetric.findFirst({
        orderBy: { timestamp: 'asc' },
        select: { timestamp: true },
      }),
      prisma.errorLog.findFirst({
        orderBy: { timestamp: 'asc' },
        select: { timestamp: true },
      }),
      prisma.databaseQueryLog.findFirst({
        orderBy: { timestamp: 'asc' },
        select: { timestamp: true },
      }),
      prisma.healthCheck.findFirst({
        orderBy: { timestamp: 'asc' },
        select: { timestamp: true },
      }),
    ])

    return NextResponse.json({
      success: true,
      statistics: {
        performanceMetrics: {
          count: performanceCount,
          oldest: oldestPerformance?.timestamp,
        },
        apiMetrics: {
          count: apiCount,
          oldest: oldestApi?.timestamp,
        },
        errorLogs: {
          count: errorCount,
          oldest: oldestError?.timestamp,
        },
        queryLogs: {
          count: queryLogCount,
          oldest: oldestQueryLog?.timestamp,
        },
        healthChecks: {
          count: healthCheckCount,
          oldest: oldestHealthCheck?.timestamp,
        },
        total: performanceCount + apiCount + errorCount + queryLogCount + healthCheckCount,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error getting cleanup statistics:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get statistics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
