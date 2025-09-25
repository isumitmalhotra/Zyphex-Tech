import { cacheManager } from './index'

// Performance metrics interface
interface CacheMetrics {
  hits: number
  misses: number
  totalRequests: number
  averageResponseTime: number
  errorCount: number
  lastError?: string
  lastErrorTime?: Date
}

interface PerformanceAlert {
  id: string
  type: 'high_miss_rate' | 'slow_response' | 'cache_error' | 'high_memory'
  message: string
  severity: 'low' | 'medium' | 'high'
  timestamp: Date
  resolved: boolean
}

// In-memory metrics storage (in production, use Redis or database)
class MetricsCollector {
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    totalRequests: 0,
    averageResponseTime: 0,
    errorCount: 0
  }
  
  private responseTimes: number[] = []
  private alerts: PerformanceAlert[] = []
  private readonly maxResponseTimeHistory = 100
  private readonly alertThresholds = {
    maxMissRate: 0.3, // 30% miss rate triggers alert
    maxResponseTime: 1000, // 1 second response time
    maxErrorRate: 0.05 // 5% error rate
  }

  // Record cache hit
  recordHit(responseTime: number): void {
    this.metrics.hits++
    this.metrics.totalRequests++
    this.recordResponseTimeInternal(responseTime)
    this.checkAlerts()
  }

  // Record cache miss
  recordMiss(responseTime: number): void {
    this.metrics.misses++
    this.metrics.totalRequests++
    this.recordResponseTimeInternal(responseTime)
    this.checkAlerts()
  }

  // Record error
  recordError(error: string): void {
    this.metrics.errorCount++
    this.metrics.lastError = error
    this.metrics.lastErrorTime = new Date()
    this.checkAlerts()
  }

  // Record response time (public method)
  recordResponseTime(time: number): void {
    this.responseTimes.push(time)
    
    // Keep only recent response times
    if (this.responseTimes.length > this.maxResponseTimeHistory) {
      this.responseTimes.shift()
    }
    
    // Calculate average
    this.metrics.averageResponseTime = 
      this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length
  }

  // Record response time (private method for internal use)
  private recordResponseTimeInternal(time: number): void {
    this.responseTimes.push(time)
    
    // Keep only recent response times
    if (this.responseTimes.length > this.maxResponseTimeHistory) {
      this.responseTimes.shift()
    }
    
    // Calculate average
    this.metrics.averageResponseTime = 
      this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length
  }

  // Get current metrics
  getMetrics(): CacheMetrics & {
    hitRate: number
    missRate: number
    errorRate: number
    currentResponseTimes: number[]
  } {
    const hitRate = this.metrics.totalRequests > 0 
      ? this.metrics.hits / this.metrics.totalRequests 
      : 0
    
    const missRate = this.metrics.totalRequests > 0 
      ? this.metrics.misses / this.metrics.totalRequests 
      : 0
    
    const errorRate = this.metrics.totalRequests > 0 
      ? this.metrics.errorCount / this.metrics.totalRequests 
      : 0

    return {
      ...this.metrics,
      hitRate,
      missRate,
      errorRate,
      currentResponseTimes: [...this.responseTimes]
    }
  }

  // Get alerts
  getAlerts(): PerformanceAlert[] {
    return this.alerts.filter(alert => !alert.resolved)
  }

  // Get all alerts (including resolved)
  getAllAlerts(): PerformanceAlert[] {
    return this.alerts
  }

  // Resolve alert
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.resolved = true
    }
  }

  // Check for performance issues and create alerts
  private checkAlerts(): void {
    const metrics = this.getMetrics()
    
    // High miss rate alert
    if (metrics.totalRequests > 10 && metrics.missRate > this.alertThresholds.maxMissRate) {
      this.createAlert(
        'high_miss_rate',
        `High cache miss rate: ${(metrics.missRate * 100).toFixed(1)}%`,
        'medium'
      )
    }
    
    // Slow response time alert
    if (metrics.averageResponseTime > this.alertThresholds.maxResponseTime) {
      this.createAlert(
        'slow_response',
        `Slow cache response time: ${metrics.averageResponseTime.toFixed(0)}ms`,
        'high'
      )
    }
    
    // High error rate alert
    if (metrics.totalRequests > 5 && metrics.errorRate > this.alertThresholds.maxErrorRate) {
      this.createAlert(
        'cache_error',
        `High cache error rate: ${(metrics.errorRate * 100).toFixed(1)}%`,
        'high'
      )
    }
  }

  // Create new alert (avoid duplicates)
  private createAlert(
    type: PerformanceAlert['type'], 
    message: string, 
    severity: PerformanceAlert['severity']
  ): void {
    // Check if similar alert already exists and is unresolved
    const existingAlert = this.alerts.find(
      alert => alert.type === type && !alert.resolved
    )
    
    if (!existingAlert) {
      const alert: PerformanceAlert = {
        id: `${type}_${Date.now()}`,
        type,
        message,
        severity,
        timestamp: new Date(),
        resolved: false
      }
      
      this.alerts.push(alert)
      
      // Keep only recent alerts (max 50)
      if (this.alerts.length > 50) {
        this.alerts = this.alerts.slice(-50)
      }
      
      console.warn(`Cache Performance Alert [${severity.toUpperCase()}]:`, message)
    }
  }

  // Reset metrics (for testing or maintenance)
  resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      totalRequests: 0,
      averageResponseTime: 0,
      errorCount: 0
    }
    this.responseTimes = []
  }

  // Clear resolved alerts
  clearResolvedAlerts(): void {
    this.alerts = this.alerts.filter(alert => !alert.resolved)
  }
}

// Singleton metrics collector
export const metricsCollector = new MetricsCollector()

// Enhanced cache wrapper with metrics
export class CacheWithMetrics {
  async get<T>(key: string): Promise<T | null> {
    const startTime = Date.now()
    
    try {
      const result = await cacheManager.get<T>(key)
      const responseTime = Date.now() - startTime
      
      if (result !== null) {
        metricsCollector.recordHit(responseTime)
      } else {
        metricsCollector.recordMiss(responseTime)
      }
      
      return result
    } catch (error) {
      const responseTime = Date.now() - startTime
      metricsCollector.recordError(error instanceof Error ? error.message : 'Unknown error')
      metricsCollector.recordMiss(responseTime)
      throw error
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    const startTime = Date.now()
    
    try {
      const result = await cacheManager.set(key, value, ttl)
      const responseTime = Date.now() - startTime
      
      // Don't count set operations in hit/miss, but track response time
      metricsCollector.recordResponseTime(responseTime)
      
      return result
    } catch (error) {
      metricsCollector.recordError(error instanceof Error ? error.message : 'Unknown error')
      throw error
    }
  }

  async delete(key: string): Promise<boolean> {
    return cacheManager.delete(key)
  }

  async deletePattern(pattern: string): Promise<boolean> {
    return cacheManager.deletePattern(pattern)
  }

  async clear(): Promise<boolean> {
    return cacheManager.clear()
  }

  // Get metrics and alerts
  getMetrics() {
    return metricsCollector.getMetrics()
  }

  getAlerts() {
    return metricsCollector.getAlerts()
  }

  getAllAlerts() {
    return metricsCollector.getAllAlerts()
  }

  resolveAlert(alertId: string) {
    return metricsCollector.resolveAlert(alertId)
  }

  resetMetrics() {
    return metricsCollector.resetMetrics()
  }
}

// Export the enhanced cache with metrics
export const monitoredCache = new CacheWithMetrics()

// Export types
export type { CacheMetrics, PerformanceAlert }