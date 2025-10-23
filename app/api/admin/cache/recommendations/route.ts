/**
 * Cache Optimization Recommendations API
 * 
 * Get AI-powered optimization recommendations for cache performance.
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
    
    // Get recommendations
    const recommendations = cacheMonitor.getOptimizationRecommendations()
    
    // Group by priority
    const grouped = {
      high: recommendations.filter((r) => r.priority === 'HIGH'),
      medium: recommendations.filter((r) => r.priority === 'MEDIUM'),
      low: recommendations.filter((r) => r.priority === 'LOW'),
    }
    
    // Calculate potential impact score
    const impactScore = recommendations.reduce((score, rec) => {
      if (rec.priority === 'HIGH') return score + 10
      if (rec.priority === 'MEDIUM') return score + 5
      return score + 2
    }, 0)
    
    return NextResponse.json({
      success: true,
      data: {
        summary: {
          total: recommendations.length,
          highPriority: grouped.high.length,
          mediumPriority: grouped.medium.length,
          lowPriority: grouped.low.length,
          impactScore,
        },
        recommendations: {
          all: recommendations,
          byPriority: grouped,
          byCategory: {
            hitRate: recommendations.filter((r) => r.category === 'HIT_RATE'),
            memory: recommendations.filter((r) => r.category === 'MEMORY'),
            latency: recommendations.filter((r) => r.category === 'LATENCY'),
            ttl: recommendations.filter((r) => r.category === 'TTL'),
            connection: recommendations.filter((r) => r.category === 'CONNECTION'),
          },
        },
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('[Cache Recommendations API] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch recommendations',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
