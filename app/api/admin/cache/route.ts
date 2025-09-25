import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { cacheManager } from '@/lib/cache'
import { getCacheStats } from '@/lib/cache/memory'

// GET /api/admin/cache/status - Get cache status and health
export async function GET() {
  try {
    const session = await getServerSession()
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get cache status
    const status = await cacheManager.getStatus()
    
    // Get memory cache statistics
    const memoryStats = getCacheStats()
    
    // Calculate cache health metrics
    const healthMetrics = {
      redisConnected: status.primary.type === 'redis' && status.primary.healthy,
      memoryFallbackHealthy: status.fallback.healthy,
      totalKeys: memoryStats.keys,
      hitRate: memoryStats.hits / (memoryStats.hits + memoryStats.misses) || 0,
      memoryUsage: {
        keys: memoryStats.ksize,
        values: memoryStats.vsize,
      }
    }

    return NextResponse.json({
      status,
      memoryStats,
      healthMetrics,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching cache status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/cache/clear - Clear cache
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, pattern } = body

    switch (action) {
      case 'clear-all':
        await cacheManager.clear()
        return NextResponse.json({ message: 'All cache cleared successfully' })
        
      case 'clear-pattern':
        if (!pattern) {
          return NextResponse.json({ error: 'Pattern required for pattern clear' }, { status: 400 })
        }
        await cacheManager.deletePattern(pattern)
        return NextResponse.json({ message: `Cache cleared for pattern: ${pattern}` })
        
      case 'clear-content-types':
        await cacheManager.deletePattern('content_types*')
        return NextResponse.json({ message: 'Content types cache cleared' })
        
      case 'clear-dynamic-content':
        await cacheManager.deletePattern('dynamic_content*')
        return NextResponse.json({ message: 'Dynamic content cache cleared' })
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error clearing cache:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}