import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { monitoredCache, metricsCollector } from '@/lib/cache/metrics'

/**
 * GET /api/admin/cache/metrics
 * Get cache performance metrics and alerts
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is admin or super admin
    const user = session.user as { role?: string }
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions. Admin access required.' },
        { status: 403 }
      )
    }

    // Get current metrics
    const metrics = monitoredCache.getMetrics()
    
    // Get active alerts
    const alerts = monitoredCache.getAlerts()
    
    // Get all alerts (including resolved)
    const allAlerts = monitoredCache.getAllAlerts()

    return NextResponse.json({
      success: true,
      metrics,
      alerts,
      allAlerts,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to fetch cache metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/cache/metrics
 * Manage alerts and reset metrics
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is admin or super admin
    const user = session.user as { role?: string }
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions. Admin access required.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action, alertId } = body

    let message = ''
    let success = false

    switch (action) {
      case 'resolve-alert':
        if (!alertId) {
          return NextResponse.json(
            { error: 'Alert ID is required for resolve-alert action' },
            { status: 400 }
          )
        }
        monitoredCache.resolveAlert(alertId)
        success = true
        message = `Alert ${alertId} resolved successfully`
        break

      case 'reset-metrics':
        monitoredCache.resetMetrics()
        success = true
        message = 'Cache metrics reset successfully'
        break

      case 'clear-resolved-alerts':
        metricsCollector.clearResolvedAlerts()
        success = true
        message = 'Resolved alerts cleared successfully'
        break

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success,
      message,
      action,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to manage metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
