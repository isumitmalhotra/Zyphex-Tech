import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Error Tracking Endpoint
 * POST /api/tracking/error
 * 
 * Records application errors to the database
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    const {
      errorType,
      message,
      stack,
      severity,
      page,
      endpoint,
      userId,
      metadata,
    } = data

    // Validate required fields
    if (!errorType || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create error log record
    await prisma.errorLog.create({
      data: {
        errorType,
        message,
        stack: stack || null,
        severity: severity || 'medium',
        page: page || null,
        endpoint: endpoint || null,
        userId: userId || null,
        metadata: metadata || null,
        resolved: false,
        timestamp: new Date(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error recording error log:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to record error' },
      { status: 500 }
    )
  }
}
