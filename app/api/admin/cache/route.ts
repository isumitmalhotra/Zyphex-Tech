import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { cacheManager } from '@/lib/cache'
import { getCacheStats } from '@/lib/cache/memory'
import { cacheKeys } from '@/lib/cache/redis'

/**
 * GET /api/admin/cache
 * Get cache status and statistics
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

    // Get cache status
    const status = await cacheManager.getStatus()
    
    // Get memory cache statistics
    const memoryStats = getCacheStats()

    // Calculate health metrics
    const redisConnected = status.primary.type === 'redis' && status.primary.healthy
    const memoryFallbackHealthy = status.fallback.healthy
    const totalKeys = memoryStats.keys
    const totalRequests = memoryStats.hits + memoryStats.misses
    const hitRate = totalRequests > 0 ? memoryStats.hits / totalRequests : 0

    const healthMetrics = {
      redisConnected,
      memoryFallbackHealthy,
      totalKeys,
      hitRate,
      memoryUsage: {
        keys: memoryStats.ksize,
        values: memoryStats.vsize
      }
    }

    return NextResponse.json({
      success: true,
      status,
      memoryStats,
      healthMetrics,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to fetch cache status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/cache
 * Clear cache based on action type
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
    const { action, pattern } = body

    let message = ''
    let success = false

    switch (action) {
      case 'clear-all':
        success = await cacheManager.clear()
        message = success 
          ? 'All cache cleared successfully' 
          : 'Failed to clear cache'
        break

      case 'clear-content-types':
        success = await cacheManager.deletePattern(cacheKeys.contentTypes())
        success = await cacheManager.deletePattern('content_type:*') || success
        message = success 
          ? 'Content types cache cleared successfully' 
          : 'Failed to clear content types cache'
        break

      case 'clear-dynamic-content':
        success = await cacheManager.deletePattern('dynamic_content*')
        message = success 
          ? 'Dynamic content cache cleared successfully' 
          : 'Failed to clear dynamic content cache'
        break

      case 'clear-pattern':
        if (!pattern) {
          return NextResponse.json(
            { error: 'Pattern is required for clear-pattern action' },
            { status: 400 }
          )
        }
        success = await cacheManager.deletePattern(pattern)
        message = success 
          ? `Cache pattern "${pattern}" cleared successfully` 
          : `Failed to clear cache pattern "${pattern}"`
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
        error: 'Failed to clear cache',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
