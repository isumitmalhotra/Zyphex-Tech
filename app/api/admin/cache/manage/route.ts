/**
 * Cache Management API
 * 
 * Admin endpoints for cache management operations:
 * - Clear all caches
 * - Get cache statistics
 * - Log performance report
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getMultiLevelCache } from '@/lib/cache/multi-level-cache'
import { cacheMonitor } from '@/lib/cache/cache-monitor'

/**
 * GET /api/admin/cache/manage
 * Get cache statistics
 */
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
    
    // Get cache stats
    const cache = getMultiLevelCache()
    const stats = cache.getStats()
    
    return NextResponse.json({
      success: true,
      data: {
        stats: {
          l1Hits: stats.l1Hits,
          l2Hits: stats.l2Hits,
          l3Hits: stats.l3Hits,
          totalMisses: stats.totalMisses,
          totalOperations: stats.totalOperations,
          l1HitRate: (stats.l1HitRate * 100).toFixed(2) + '%',
          l2HitRate: (stats.l2HitRate * 100).toFixed(2) + '%',
          combinedHitRate: (stats.combinedHitRate * 100).toFixed(2) + '%',
          promotions: stats.promotions,
          demotions: stats.demotions,
          cascadeWrites: stats.cascadeWrites,
          cascadeDeletes: stats.cascadeDeletes,
          errors: stats.errors,
          averageL1AccessTime: stats.averageL1AccessTime.toFixed(2) + 'ms',
          averageL2AccessTime: stats.averageL2AccessTime.toFixed(2) + 'ms',
        },
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('[Cache Manage API] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch cache stats',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/cache/manage
 * Perform cache management operations
 * 
 * Actions:
 * - clear: Clear all cache levels
 * - log-report: Log performance report to console
 */
export async function POST(req: NextRequest) {
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
    
    // Parse request body
    const body = await req.json()
    const { action } = body
    
    const cache = getMultiLevelCache()
    
    switch (action) {
      case 'clear':
        // Clear all cache levels
        await cache.clearAll()
        
        return NextResponse.json({
          success: true,
          message: 'All cache levels cleared successfully',
          action: 'clear',
          timestamp: new Date().toISOString(),
        })
      
      case 'log-report':
        // Log performance report
        cacheMonitor.logReport()
        
        return NextResponse.json({
          success: true,
          message: 'Performance report logged to console',
          action: 'log-report',
          timestamp: new Date().toISOString(),
        })
      
      case 'log-stats':
        // Log cache stats
        cache.logStats()
        
        return NextResponse.json({
          success: true,
          message: 'Cache statistics logged to console',
          action: 'log-stats',
          timestamp: new Date().toISOString(),
        })
      
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Valid actions: clear, log-report, log-stats` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('[Cache Manage API] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to perform cache operation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
