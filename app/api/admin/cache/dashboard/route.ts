/**
 * Cache Performance Dashboard API
 * 
 * Real-time cache metrics and health monitoring endpoint for administrators.
 * Provides comprehensive cache performance data, recommendations, and alerts.
 * 
 * Endpoints:
 * - GET /api/admin/cache/dashboard - Get full dashboard data
 * - GET /api/admin/cache/health - Get health status only
 * - GET /api/admin/cache/metrics - Get metrics only
 * - GET /api/admin/cache/recommendations - Get optimization recommendations
 * - POST /api/admin/cache/clear - Clear all caches (admin only)
 * - POST /api/admin/cache/warm - Warm cache (admin only)
 * 
 * Usage:
 * ```typescript
 * // Get dashboard data
 * const response = await fetch('/api/admin/cache/dashboard')
 * const data = await response.json()
 * 
 * console.log('Cache Health:', data.health.status)
 * console.log('Hit Rate:', data.metrics.combined.hitRate)
 * console.log('Recommendations:', data.recommendations)
 * ```
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { cacheMonitor, CacheHealth } from '@/lib/cache/cache-monitor'
import { getMultiLevelCache } from '@/lib/cache/multi-level-cache'

// This route relies on server-side context (sessions/headers) and must be dynamic
export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/cache/dashboard
 * 
 * Get complete cache dashboard data including:
 * - Real-time metrics (L1, L2, combined hit rates)
 * - Performance data (latency, throughput)
 * - Memory usage
 * - Health status
 * - Optimization recommendations
 * - Historical trends
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
    
    // Get comprehensive metrics
    const metrics = cacheMonitor.getMetrics()
    const recommendations = cacheMonitor.getOptimizationRecommendations()
    const trends = cacheMonitor.getTrends(60) // Last 60 minutes
    
    // Get cache instance stats for additional details
    const cache = getMultiLevelCache()
    const cacheStats = cache.getStats()
    
    // Calculate health score (0-100)
    const healthScore = calculateHealthScore(metrics, cacheStats)
    
    // Build dashboard response
    const dashboard = {
      timestamp: new Date().toISOString(),
      overview: {
        status: metrics.health.status,
        healthScore,
        uptime: Math.floor(metrics.health.uptime / 1000 / 60), // minutes
        issuesCount: metrics.health.issues.length,
        recommendationsCount: recommendations.length,
      },
      metrics: {
        l1: {
          hitRate: (metrics.l1.hitRate * 100).toFixed(2) + '%',
          hits: metrics.l1.hits.toLocaleString(),
          misses: metrics.l1.misses.toLocaleString(),
          avgAccessTime: metrics.l1.averageAccessTime.toFixed(2) + 'ms',
          errorCount: metrics.l1.errorCount,
        },
        l2: {
          hitRate: (metrics.l2.hitRate * 100).toFixed(2) + '%',
          hits: metrics.l2.hits.toLocaleString(),
          misses: metrics.l2.misses.toLocaleString(),
          avgAccessTime: metrics.l2.averageAccessTime.toFixed(2) + 'ms',
          errorCount: metrics.l2.errorCount,
        },
        combined: {
          hitRate: (metrics.combined.hitRate * 100).toFixed(2) + '%',
          totalHits: metrics.combined.totalHits.toLocaleString(),
          totalMisses: metrics.combined.totalMisses.toLocaleString(),
          totalOperations: metrics.combined.totalOperations.toLocaleString(),
        },
        performance: {
          avgLatency: metrics.performance.averageLatencyMs.toFixed(2) + 'ms',
          p50Latency: metrics.performance.p50LatencyMs.toFixed(2) + 'ms',
          p95Latency: metrics.performance.p95LatencyMs.toFixed(2) + 'ms',
          p99Latency: metrics.performance.p99LatencyMs.toFixed(2) + 'ms',
          throughput: metrics.performance.operationsPerSecond.toFixed(2) + ' ops/sec',
        },
        memory: {
          itemCount: metrics.memory.itemCount.toLocaleString(),
          maxSize: metrics.memory.maxSize.toLocaleString(),
          utilization: metrics.memory.utilizationPercent.toFixed(2) + '%',
          evictions: metrics.memory.evictions.toLocaleString(),
          estimatedSize: metrics.memory.estimatedMemoryMB.toFixed(2) + ' MB',
        },
      },
      health: {
        status: metrics.health.status,
        l1Status: metrics.health.l1Status,
        l2Status: metrics.health.l2Status,
        issues: metrics.health.issues,
        recommendations: metrics.health.recommendations,
        uptime: metrics.health.uptime,
      },
      optimization: {
        recommendations: recommendations.map((rec) => ({
          priority: rec.priority,
          category: rec.category,
          issue: rec.issue,
          recommendation: rec.recommendation,
          estimatedImpact: rec.estimatedImpact,
        })),
        highPriority: recommendations.filter((r) => r.priority === 'HIGH').length,
        mediumPriority: recommendations.filter((r) => r.priority === 'MEDIUM').length,
        lowPriority: recommendations.filter((r) => r.priority === 'LOW').length,
      },
      trends: {
        hitRate: {
          trend: trends.hitRateTrend,
          dataPoints: trends.dataPoints.length,
        },
        latency: {
          trend: trends.latencyTrend,
          dataPoints: trends.dataPoints.length,
        },
        throughput: {
          trend: trends.throughputTrend,
          dataPoints: trends.dataPoints.length,
        },
        historicalData: trends.dataPoints.slice(-20).map((point) => ({
          timestamp: point.timestamp.toISOString(),
          hitRate: (point.hitRate * 100).toFixed(2) + '%',
          latency: point.latency.toFixed(2) + 'ms',
          throughput: point.throughput.toFixed(2) + ' ops/sec',
          memoryUsage: point.memoryUsage.toFixed(2) + '%',
          errorCount: point.errorCount,
        })),
      },
      cacheDetails: {
        promotions: cacheStats.promotions,
        demotions: cacheStats.demotions,
        cascadeWrites: cacheStats.cascadeWrites,
        cascadeDeletes: cacheStats.cascadeDeletes,
        totalErrors: cacheStats.errors,
      },
    }
    
    return NextResponse.json({
      success: true,
      data: dashboard,
    })
  } catch (error) {
    console.error('[Cache Dashboard API] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch cache dashboard',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Calculate overall health score (0-100)
 */
function calculateHealthScore(
  metrics: ReturnType<typeof cacheMonitor.getMetrics>,
  cacheStats: ReturnType<ReturnType<typeof getMultiLevelCache>['getStats']>
): number {
  let score = 100
  
  // Deduct for low hit rates
  if (metrics.combined.hitRate < 0.5) {
    score -= 30
  } else if (metrics.combined.hitRate < 0.7) {
    score -= 15
  } else if (metrics.combined.hitRate < 0.8) {
    score -= 5
  }
  
  // Deduct for high latency
  if (metrics.performance.averageLatencyMs > 20) {
    score -= 20
  } else if (metrics.performance.averageLatencyMs > 10) {
    score -= 10
  }
  
  // Deduct for high memory usage
  if (metrics.memory.utilizationPercent > 90) {
    score -= 20
  } else if (metrics.memory.utilizationPercent > 75) {
    score -= 10
  }
  
  // Deduct for errors
  const errorRate = cacheStats.errors / Math.max(cacheStats.totalOperations, 1)
  if (errorRate > 0.05) {
    score -= 15
  } else if (errorRate > 0.01) {
    score -= 5
  }
  
  // Deduct for health issues
  if (metrics.health.status === CacheHealth.CRITICAL) {
    score -= 40
  } else if (metrics.health.status === CacheHealth.DEGRADED) {
    score -= 20
  } else if (metrics.health.status === CacheHealth.DOWN) {
    score -= 50
  }
  
  // Ensure score is between 0-100
  return Math.max(0, Math.min(100, score))
}
