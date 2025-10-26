import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Health Check Tracking Endpoint
 * POST /api/tracking/health
 * 
 * Records system health check results to the database
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    const {
      component,
      status,
      responseTime,
      uptime,
      message,
      metadata,
    } = data

    // Validate required fields
    if (!component || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create health check record
    await prisma.healthCheck.create({
      data: {
        component,
        status,
        responseTime: responseTime ? parseFloat(responseTime) : 0,
        uptime: uptime ? parseFloat(uptime) : null,
        message: message || null,
        metadata: metadata || null,
        timestamp: new Date(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error recording health check:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to record health check' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/tracking/health
 * 
 * Quick health check endpoint (doesn't log to database)
 */
export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`
    
    return NextResponse.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'healthy',
        api: 'healthy',
      }
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    )
  }
}
