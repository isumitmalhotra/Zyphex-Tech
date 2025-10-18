/**
 * Database Connection Pool Monitoring
 * 
 * Tracks Prisma connection pool metrics, detects connection leaks,
 * and provides health check endpoints for production monitoring.
 * 
 * Features:
 * - Real-time connection pool metrics
 * - Connection leak detection
 * - Health check API endpoint
 * - Automatic alerts for pool exhaustion
 * - Historical metrics tracking
 * 
 * Usage:
 * import { ConnectionMonitor } from '@/lib/db/connection-monitor'
 * const health = await ConnectionMonitor.getHealthStatus()
 */

import { PrismaClient } from '@prisma/client'

/**
 * Connection pool metrics
 */
export interface PoolMetrics {
  activeConnections: number
  idleConnections: number
  totalConnections: number
  waitingRequests: number
  maxConnections: number
  utilizationPercent: number
  timestamp: Date
}

/**
 * Connection pool health status
 */
export interface PoolHealthStatus {
  status: 'healthy' | 'warning' | 'critical'
  metrics: PoolMetrics
  issues: string[]
  recommendations: string[]
}

/**
 * Connection leak info
 */
export interface ConnectionLeak {
  id: string
  createdAt: Date
  duration: number
  stackTrace?: string
}

/**
 * Connection monitor configuration
 */
const MONITOR_CONFIG = {
  // Maximum allowed connection pool utilization before warning
  warningThreshold: 0.7, // 70%
  
  // Critical threshold for connection pool
  criticalThreshold: 0.9, // 90%
  
  // Connection considered leaked if open longer than (ms)
  leakThreshold: 30000, // 30 seconds
  
  // How often to check for leaks (ms)
  leakCheckInterval: 60000, // 1 minute
  
  // Maximum number of historical metrics to keep
  maxHistorySize: 100
}

/**
 * Connection pool monitor class
 */
class ConnectionPoolMonitor {
  private prisma: PrismaClient
  private metricsHistory: PoolMetrics[] = []
  private activeQueries: Map<string, { startTime: Date; query: string }> = new Map()
  private leakCheckTimer?: NodeJS.Timeout
  
  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }
  
  /**
   * Get current pool metrics
   * Note: Prisma doesn't expose internal pool metrics directly,
   * so we'll track queries and provide estimates
   */
  async getMetrics(): Promise<PoolMetrics> {
    const activeConnections = this.activeQueries.size
    
    // Get configured connection limit from DATABASE_URL
    const maxConnections = this.getMaxConnectionsFromEnv()
    
    const metrics: PoolMetrics = {
      activeConnections,
      idleConnections: Math.max(0, maxConnections - activeConnections),
      totalConnections: maxConnections,
      waitingRequests: 0, // Can't easily track this with Prisma
      maxConnections,
      utilizationPercent: (activeConnections / maxConnections) * 100,
      timestamp: new Date()
    }
    
    // Add to history
    this.metricsHistory.push(metrics)
    if (this.metricsHistory.length > MONITOR_CONFIG.maxHistorySize) {
      this.metricsHistory.shift()
    }
    
    return metrics
  }
  
  /**
   * Get max connections from DATABASE_URL or default
   */
  private getMaxConnectionsFromEnv(): number {
    const dbUrl = process.env.DATABASE_URL || ''
    const match = dbUrl.match(/connection_limit=(\d+)/)
    return match ? parseInt(match[1]) : 10 // Default to 10 if not specified
  }
  
  /**
   * Get health status
   */
  async getHealthStatus(): Promise<PoolHealthStatus> {
    const metrics = await this.getMetrics()
    const issues: string[] = []
    const recommendations: string[] = []
    
    let status: 'healthy' | 'warning' | 'critical' = 'healthy'
    
    // Check utilization
    if (metrics.utilizationPercent >= MONITOR_CONFIG.criticalThreshold * 100) {
      status = 'critical'
      issues.push(`Connection pool at ${metrics.utilizationPercent.toFixed(1)}% capacity (CRITICAL)`)
      recommendations.push('Increase database connection pool limit')
      recommendations.push('Review slow queries and optimize')
      recommendations.push('Consider implementing connection pooling with PgBouncer')
    } else if (metrics.utilizationPercent >= MONITOR_CONFIG.warningThreshold * 100) {
      status = status === 'healthy' ? 'warning' : status
      issues.push(`Connection pool at ${metrics.utilizationPercent.toFixed(1)}% capacity (WARNING)`)
      recommendations.push('Monitor connection usage trends')
      recommendations.push('Review query performance')
    }
    
    // Check for connection leaks
    const leaks = this.detectLeaks()
    if (leaks.length > 0) {
      status = 'critical'
      issues.push(`Detected ${leaks.length} potential connection leak(s)`)
      recommendations.push('Review long-running queries')
      recommendations.push('Ensure all Prisma queries have proper error handling')
      recommendations.push('Check for missing await statements')
    }
    
    // Check if no idle connections
    if (metrics.idleConnections === 0 && metrics.activeConnections > 0) {
      status = status === 'healthy' ? 'warning' : status
      issues.push('No idle connections available')
      recommendations.push('Consider scaling connection pool')
    }
    
    return {
      status,
      metrics,
      issues,
      recommendations
    }
  }
  
  /**
   * Track a query start
   */
  trackQueryStart(queryId: string, query: string): void {
    this.activeQueries.set(queryId, {
      startTime: new Date(),
      query
    })
  }
  
  /**
   * Track a query end
   */
  trackQueryEnd(queryId: string): void {
    this.activeQueries.delete(queryId)
  }
  
  /**
   * Detect potential connection leaks
   */
  detectLeaks(): ConnectionLeak[] {
    const now = Date.now()
    const leaks: ConnectionLeak[] = []
    
    for (const [id, info] of this.activeQueries) {
      const duration = now - info.startTime.getTime()
      
      if (duration > MONITOR_CONFIG.leakThreshold) {
        leaks.push({
          id,
          createdAt: info.startTime,
          duration
        })
      }
    }
    
    return leaks
  }
  
  /**
   * Get metrics history
   */
  getMetricsHistory(): PoolMetrics[] {
    return [...this.metricsHistory]
  }
  
  /**
   * Get average utilization over time
   */
  getAverageUtilization(minutes = 5): number {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000)
    const recentMetrics = this.metricsHistory.filter(
      m => m.timestamp >= cutoff
    )
    
    if (recentMetrics.length === 0) return 0
    
    const sum = recentMetrics.reduce((acc, m) => acc + m.utilizationPercent, 0)
    return sum / recentMetrics.length
  }
  
  /**
   * Start automatic leak detection
   */
  startLeakDetection(): void {
    if (this.leakCheckTimer) {
      clearInterval(this.leakCheckTimer)
    }
    
    this.leakCheckTimer = setInterval(() => {
      const leaks = this.detectLeaks()
      if (leaks.length > 0) {
        console.warn(`[ConnectionMonitor] Detected ${leaks.length} potential connection leak(s):`)
        leaks.forEach(leak => {
          console.warn(`  - Query ID: ${leak.id}, Duration: ${(leak.duration / 1000).toFixed(1)}s`)
        })
      }
    }, MONITOR_CONFIG.leakCheckInterval)
  }
  
  /**
   * Stop automatic leak detection
   */
  stopLeakDetection(): void {
    if (this.leakCheckTimer) {
      clearInterval(this.leakCheckTimer)
      this.leakCheckTimer = undefined
    }
  }
  
  /**
   * Get a simple health check boolean
   */
  async isHealthy(): Promise<boolean> {
    const health = await this.getHealthStatus()
    return health.status === 'healthy'
  }
  
  /**
   * Test database connectivity
   */
  async testConnection(): Promise<{ connected: boolean; latency: number; error?: string }> {
    try {
      const startTime = Date.now()
      await this.prisma.$queryRaw`SELECT 1`
      const latency = Date.now() - startTime
      
      return {
        connected: true,
        latency
      }
    } catch (error) {
      return {
        connected: false,
        latency: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
  
  /**
   * Get detailed health report
   */
  async getDetailedReport(): Promise<{
    connection: { connected: boolean; latency: number; error?: string }
    pool: PoolHealthStatus
    history: {
      avgUtilization5min: number
      avgUtilization15min: number
      peakUtilization: number
    }
  }> {
    const [connection, pool] = await Promise.all([
      this.testConnection(),
      this.getHealthStatus()
    ])
    
    const avgUtilization5min = this.getAverageUtilization(5)
    const avgUtilization15min = this.getAverageUtilization(15)
    const peakUtilization = Math.max(
      ...this.metricsHistory.map(m => m.utilizationPercent),
      0
    )
    
    return {
      connection,
      pool,
      history: {
        avgUtilization5min,
        avgUtilization15min,
        peakUtilization
      }
    }
  }
}

// Create singleton instance
let connectionMonitor: ConnectionPoolMonitor | null = null

/**
 * Initialize the connection monitor
 */
export function initConnectionMonitor(prisma: PrismaClient): ConnectionPoolMonitor {
  if (!connectionMonitor) {
    connectionMonitor = new ConnectionPoolMonitor(prisma)
    connectionMonitor.startLeakDetection()
  }
  return connectionMonitor
}

/**
 * Get the connection monitor instance
 */
export function getConnectionMonitor(): ConnectionPoolMonitor | null {
  return connectionMonitor
}

/**
 * Middleware to track query execution
 */
export function trackQuery<T>(
  queryFn: () => Promise<T>,
  queryName: string
): Promise<T> {
  const monitor = getConnectionMonitor()
  if (!monitor) {
    return queryFn()
  }
  
  const queryId = `${queryName}-${Date.now()}-${Math.random()}`
  
  monitor.trackQueryStart(queryId, queryName)
  
  return queryFn()
    .then(result => {
      monitor.trackQueryEnd(queryId)
      return result
    })
    .catch(error => {
      monitor.trackQueryEnd(queryId)
      throw error
    })
}

// Export the class and singleton
export { ConnectionPoolMonitor }
export const ConnectionMonitor = {
  init: initConnectionMonitor,
  get: getConnectionMonitor,
  track: trackQuery
}

export default ConnectionMonitor
