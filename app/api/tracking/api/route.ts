import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * API Tracking Endpoint
 * POST /api/tracking/api
 * 
 * Records API performance metrics to the database
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    const {
      method,
      endpoint,
      path,
      statusCode,
      responseTime,
      requestSize,
      responseSize,
      userId,
      userAgent,
      ipAddress,
      timestamp,
    } = data

    // Validate required fields
    if (!method || !endpoint || !statusCode || responseTime === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create API metric record
    await prisma.apiMetric.create({
      data: {
        method,
        endpoint,
        path: path || endpoint,
        statusCode: parseInt(statusCode),
        responseTime: parseFloat(responseTime),
        requestSize: requestSize ? parseInt(requestSize) : null,
        responseSize: responseSize ? parseInt(responseSize) : null,
        userId: userId || null,
        userAgent: userAgent || null,
        ipAddress: ipAddress || null,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error recording API metric:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to record metric' },
      { status: 500 }
    )
  }
}
