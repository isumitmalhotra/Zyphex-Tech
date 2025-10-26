import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Performance Tracking Endpoint
 * POST /api/tracking/performance
 * 
 * Records page performance metrics to the database
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    const {
      page,
      metricType,
      value,
      metadata,
      userAgent,
      ipAddress,
    } = data

    // Validate required fields
    if (!page || !metricType || value === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create performance metric record
    await prisma.performanceMetric.create({
      data: {
        metricType,
        page,
        endpoint: null,
        value: parseFloat(value),
        metadata: metadata || null,
        userAgent: userAgent || request.headers.get('user-agent') || null,
        ipAddress: ipAddress || getClientIp(request),
        timestamp: new Date(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error recording performance metric:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to record metric' },
      { status: 500 }
    )
  }
}

/**
 * Get client IP address (anonymized for privacy)
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'
  
  // Anonymize IP for privacy (remove last octet)
  if (ip && ip !== 'unknown') {
    const parts = ip.split('.')
    if (parts.length === 4) {
      parts[3] = '0'
      return parts.join('.')
    }
  }
  
  return 'unknown'
}
