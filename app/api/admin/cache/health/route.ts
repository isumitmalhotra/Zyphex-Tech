/**
 * Cache Health Status API
 * 
 * Quick health check endpoint for cache system monitoring.
 * Returns simplified health status without full metrics.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { cacheMonitor } from '@/lib/cache/cache-monitor'

export async function GET(_req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Check admin privileges
    const userRole = (session.user as { role?: string }).role
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }
    
    // Get health status
    const health = await cacheMonitor.getHealthStatus()
    
    return NextResponse.json({
      success: true,
      data: {
        status: health.status,
        l1Status: health.l1Status,
        l2Status: health.l2Status,
        uptime: Math.floor(health.uptime / 1000 / 60) + ' minutes',
        issues: health.issues,
        recommendations: health.recommendations,
        timestamp: health.timestamp.toISOString(),
      },
    })
  } catch (error) {
    console.error('[Cache Health API] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch cache health',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
