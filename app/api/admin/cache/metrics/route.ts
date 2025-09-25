import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { monitoredCache } from '@/lib/cache/metrics'

// GET /api/admin/cache/metrics - Get cache performance metrics
export async function GET() {
  try {
    const session = await getServerSession()
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const metrics = monitoredCache.getMetrics()
    const alerts = monitoredCache.getAlerts()
    const allAlerts = monitoredCache.getAllAlerts()

    return NextResponse.json({
      metrics,
      alerts,
      allAlerts,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching cache metrics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/cache/metrics - Manage alerts and metrics
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, alertId } = body

    switch (action) {
      case 'resolve-alert':
        if (!alertId) {
          return NextResponse.json({ error: 'Alert ID required' }, { status: 400 })
        }
        monitoredCache.resolveAlert(alertId)
        return NextResponse.json({ message: 'Alert resolved successfully' })
        
      case 'reset-metrics':
        monitoredCache.resetMetrics()
        return NextResponse.json({ message: 'Metrics reset successfully' })
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error managing cache metrics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}