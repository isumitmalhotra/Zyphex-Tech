/**
 * Query Performance Monitoring System
 * 
 * Prisma middleware for tracking query execution times, identifying slow queries,
 * and collecting comprehensive performance metrics.
 * 
 * Features:
 * - Real-time query execution tracking
 * - Automatic slow query detection
 * - Performance metrics aggregation
 * - Query pattern analysis
 * - Cache correlation tracking
 */

import { Prisma } from '@prisma/client'

/**
 * Query execution metrics
 */
export interface QueryMetrics {
  // Query identification
  model: string
  action: string
  queryHash: string // Hash of query structure for grouping

  // Performance metrics
  executionTime: number // milliseconds
  timestamp: Date
  
  // Query details
  params?: unknown
  sql?: string
  
  // Context
  userId?: string
  endpoint?: string
  
  // Categorization
  isSlow: boolean
  severity: 'normal' | 'warning' | 'critical'
}

/**
 * Slow query log entry
 */
export interface SlowQueryLog extends QueryMetrics {
  stackTrace?: string
  requestId?: string
  environment: string
}

/**
 * Aggregated performance statistics
 */
export interface PerformanceStats {
  // Time range
  startTime: Date
  endTime: Date
  duration: number // milliseconds
  
  // Query counts
  totalQueries: number
  slowQueries: number
  failedQueries: number
  
  // Performance metrics
  averageExecutionTime: number
  medianExecutionTime: number
  p95ExecutionTime: number
  p99ExecutionTime: number
  maxExecutionTime: number
  minExecutionTime: number
  
  // By model
  byModel: Record<string, {
    count: number
    averageTime: number
    slowCount: number
  }>
  
  // By action
  byAction: Record<string, {
    count: number
    averageTime: number
    slowCount: number
  }>
  
  // Top slow queries
  slowestQueries: QueryMetrics[]
}

/**
 * Performance thresholds configuration
 */
export interface PerformanceThresholds {
  // Query execution time thresholds (ms)
  warning: number // Log as warning
  critical: number // Log as critical and alert
  
  // Model-specific thresholds
  modelThresholds?: Record<string, {
    warning: number
    critical: number
  }>
  
  // Action-specific thresholds
  actionThresholds?: Record<string, {
    warning: number
    critical: number
  }>
}

/**
 * Default performance thresholds
 */
export const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  warning: 1000, // 1 second
  critical: 3000, // 3 seconds
  
  modelThresholds: {
    User: { warning: 500, critical: 1500 },
    Task: { warning: 500, critical: 1500 },
    Project: { warning: 800, critical: 2000 },
    Message: { warning: 300, critical: 1000 },
  },
  
  actionThresholds: {
    findMany: { warning: 800, critical: 2000 },
    findUnique: { warning: 200, critical: 500 },
    findFirst: { warning: 300, critical: 800 },
    create: { warning: 400, critical: 1000 },
    update: { warning: 400, critical: 1000 },
    delete: { warning: 300, critical: 800 },
    count: { warning: 500, critical: 1500 },
    aggregate: { warning: 1000, critical: 3000 },
  },
}

/**
 * Query monitoring state
 */
class QueryMonitor {
  private metrics: QueryMetrics[] = []
  private slowQueries: SlowQueryLog[] = []
  private thresholds: PerformanceThresholds
  private maxMetricsSize = 10000 // Keep last 10k queries in memory
  private maxSlowQueriesSize = 1000 // Keep last 1k slow queries
  
  // Statistics
  private stats = {
    totalQueries: 0,
    slowQueries: 0,
    failedQueries: 0,
    startTime: new Date(),
  }
  
  constructor(thresholds: PerformanceThresholds = DEFAULT_THRESHOLDS) {
    this.thresholds = thresholds
  }
  
  /**
   * Track a query execution
   */
  trackQuery(metrics: QueryMetrics): void {
    // Add to metrics array
    this.metrics.push(metrics)
    
    // Trim if exceeds max size
    if (this.metrics.length > this.maxMetricsSize) {
      this.metrics = this.metrics.slice(-this.maxMetricsSize)
    }
    
    // Update stats
    this.stats.totalQueries++
    
    // Check if slow query
    if (metrics.isSlow) {
      this.stats.slowQueries++
      
      // Add to slow queries log
      const slowQueryLog: SlowQueryLog = {
        ...metrics,
        environment: process.env.NODE_ENV || 'development',
      }
      
      this.slowQueries.push(slowQueryLog)
      
      // Trim slow queries if exceeds max size
      if (this.slowQueries.length > this.maxSlowQueriesSize) {
        this.slowQueries = this.slowQueries.slice(-this.maxSlowQueriesSize)
      }
    }
  }
  
  /**
   * Track a failed query
   */
  trackFailure(): void {
    this.stats.failedQueries++
  }
  
  /**
   * Determine query severity based on thresholds
   */
  getSeverity(model: string, action: string, executionTime: number): {
    isSlow: boolean
    severity: 'normal' | 'warning' | 'critical'
  } {
    // Check model-specific threshold
    const modelThreshold = this.thresholds.modelThresholds?.[model]
    if (modelThreshold) {
      if (executionTime >= modelThreshold.critical) {
        return { isSlow: true, severity: 'critical' }
      }
      if (executionTime >= modelThreshold.warning) {
        return { isSlow: true, severity: 'warning' }
      }
    }
    
    // Check action-specific threshold
    const actionThreshold = this.thresholds.actionThresholds?.[action]
    if (actionThreshold) {
      if (executionTime >= actionThreshold.critical) {
        return { isSlow: true, severity: 'critical' }
      }
      if (executionTime >= actionThreshold.warning) {
        return { isSlow: true, severity: 'warning' }
      }
    }
    
    // Check global threshold
    if (executionTime >= this.thresholds.critical) {
      return { isSlow: true, severity: 'critical' }
    }
    if (executionTime >= this.thresholds.warning) {
      return { isSlow: true, severity: 'warning' }
    }
    
    return { isSlow: false, severity: 'normal' }
  }
  
  /**
   * Get recent query metrics
   */
  getMetrics(limit = 100): QueryMetrics[] {
    return this.metrics.slice(-limit)
  }
  
  /**
   * Get slow queries
   */
  getSlowQueries(limit = 100): SlowQueryLog[] {
    return this.slowQueries.slice(-limit)
  }
  
  /**
   * Get performance statistics
   */
  getStats(timeRange?: { start: Date; end: Date }): PerformanceStats {
    let metricsToAnalyze = this.metrics
    
    // Filter by time range if provided
    if (timeRange) {
      metricsToAnalyze = this.metrics.filter(
        m => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      )
    }
    
    if (metricsToAnalyze.length === 0) {
      return this.getEmptyStats(timeRange)
    }
    
    // Calculate execution times
    const executionTimes = metricsToAnalyze.map(m => m.executionTime).sort((a, b) => a - b)
    const totalTime = executionTimes.reduce((sum, t) => sum + t, 0)
    
    // Calculate percentiles
    const p95Index = Math.floor(executionTimes.length * 0.95)
    const p99Index = Math.floor(executionTimes.length * 0.99)
    const medianIndex = Math.floor(executionTimes.length * 0.5)
    
    // Group by model
    const byModel: Record<string, { count: number; totalTime: number; slowCount: number }> = {}
    const byAction: Record<string, { count: number; totalTime: number; slowCount: number }> = {}
    
    for (const metric of metricsToAnalyze) {
      // By model
      if (!byModel[metric.model]) {
        byModel[metric.model] = { count: 0, totalTime: 0, slowCount: 0 }
      }
      byModel[metric.model].count++
      byModel[metric.model].totalTime += metric.executionTime
      if (metric.isSlow) byModel[metric.model].slowCount++
      
      // By action
      if (!byAction[metric.action]) {
        byAction[metric.action] = { count: 0, totalTime: 0, slowCount: 0 }
      }
      byAction[metric.action].count++
      byAction[metric.action].totalTime += metric.executionTime
      if (metric.isSlow) byAction[metric.action].slowCount++
    }
    
    // Get slowest queries
    const slowestQueries = [...metricsToAnalyze]
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, 10)
    
    const startTime = timeRange?.start || this.stats.startTime
    const endTime = timeRange?.end || new Date()
    
    return {
      startTime,
      endTime,
      duration: endTime.getTime() - startTime.getTime(),
      
      totalQueries: metricsToAnalyze.length,
      slowQueries: metricsToAnalyze.filter(m => m.isSlow).length,
      failedQueries: this.stats.failedQueries,
      
      averageExecutionTime: totalTime / metricsToAnalyze.length,
      medianExecutionTime: executionTimes[medianIndex] || 0,
      p95ExecutionTime: executionTimes[p95Index] || 0,
      p99ExecutionTime: executionTimes[p99Index] || 0,
      maxExecutionTime: executionTimes[executionTimes.length - 1] || 0,
      minExecutionTime: executionTimes[0] || 0,
      
      byModel: Object.fromEntries(
        Object.entries(byModel).map(([model, data]) => [
          model,
          {
            count: data.count,
            averageTime: data.totalTime / data.count,
            slowCount: data.slowCount,
          },
        ])
      ),
      
      byAction: Object.fromEntries(
        Object.entries(byAction).map(([action, data]) => [
          action,
          {
            count: data.count,
            averageTime: data.totalTime / data.count,
            slowCount: data.slowCount,
          },
        ])
      ),
      
      slowestQueries,
    }
  }
  
  /**
   * Get empty stats structure
   */
  private getEmptyStats(timeRange?: { start: Date; end: Date }): PerformanceStats {
    const startTime = timeRange?.start || this.stats.startTime
    const endTime = timeRange?.end || new Date()
    
    return {
      startTime,
      endTime,
      duration: endTime.getTime() - startTime.getTime(),
      totalQueries: 0,
      slowQueries: 0,
      failedQueries: 0,
      averageExecutionTime: 0,
      medianExecutionTime: 0,
      p95ExecutionTime: 0,
      p99ExecutionTime: 0,
      maxExecutionTime: 0,
      minExecutionTime: 0,
      byModel: {},
      byAction: {},
      slowestQueries: [],
    }
  }
  
  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics = []
    this.slowQueries = []
    this.stats = {
      totalQueries: 0,
      slowQueries: 0,
      failedQueries: 0,
      startTime: new Date(),
    }
  }
  
  /**
   * Update thresholds
   */
  updateThresholds(thresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds }
  }
}

/**
 * Global query monitor instance
 */
export const queryMonitor = new QueryMonitor()

/**
 * Create Prisma extension for query monitoring
 */
export function createQueryMonitorExtension() {
  return Prisma.defineExtension({
    name: 'queryMonitor',
    query: {
      $allModels: {
        async $allOperations({ args, query, model, operation }) {
          const startTime = Date.now()
          
          try {
            // Execute the query
            const result = await query(args)
            
            // Calculate execution time
            const executionTime = Date.now() - startTime
            
            // Determine severity
            const { isSlow, severity } = queryMonitor.getSeverity(
              model || 'Unknown',
              operation,
              executionTime
            )
            
            // Create metrics
            const metrics: QueryMetrics = {
              model: model || 'Unknown',
              action: operation,
              queryHash: generateQueryHash({ model, action: operation, args }),
              executionTime,
              timestamp: new Date(),
              params: sanitizeParams(args),
              isSlow,
              severity,
            }
            
            // Track the query
            queryMonitor.trackQuery(metrics)
            
            // Log slow queries
            if (isSlow) {
              console.warn(
                `[Query Monitor] Slow ${severity} query detected:`,
                `${model}.${operation}`,
                `${executionTime}ms`
              )
            }
            
            return result
          } catch (error) {
            // Track failure
            queryMonitor.trackFailure()
            
            // Calculate execution time even for failed queries
            const executionTime = Date.now() - startTime
            
            console.error(
              `[Query Monitor] Query failed:`,
              `${model}.${operation}`,
              `${executionTime}ms`,
              error
            )
            
            throw error
          }
        },
      },
    },
  })
}

/**
 * Create Prisma middleware for query monitoring (legacy support)
 */
export function createQueryMonitorMiddleware(): Prisma.Middleware {
  return async (params, next) => {
    const startTime = Date.now()
    
    try {
      // Execute the query
      const result = await next(params)
      
      // Calculate execution time
      const executionTime = Date.now() - startTime
      
      // Determine severity
      const { isSlow, severity} = queryMonitor.getSeverity(
        params.model || 'Unknown',
        params.action,
        executionTime
      )
      
      // Create metrics
      const metrics: QueryMetrics = {
        model: params.model || 'Unknown',
        action: params.action,
        queryHash: generateQueryHash(params),
        executionTime,
        timestamp: new Date(),
        params: sanitizeParams(params.args),
        isSlow,
        severity,
      }
      
      // Track the query
      queryMonitor.trackQuery(metrics)
      
      // Log slow queries
      if (isSlow) {
        console.warn(
          `[Query Monitor] Slow ${severity} query detected:`,
          `${params.model}.${params.action}`,
          `${executionTime}ms`
        )
      }
      
      return result
    } catch (error) {
      // Track failure
      queryMonitor.trackFailure()
      
      // Calculate execution time even for failed queries
      const executionTime = Date.now() - startTime
      
      console.error(
        `[Query Monitor] Query failed:`,
        `${params.model}.${params.action}`,
        `${executionTime}ms`,
        error
      )
      
      throw error
    }
  }
}

/**
 * Generate a hash for query structure (for grouping similar queries)
 */
function generateQueryHash(params: Prisma.MiddlewareParams): string {
  const structure = {
    model: params.model,
    action: params.action,
    // Don't include actual values, just the query structure
    hasWhere: !!params.args?.where,
    hasInclude: !!params.args?.include,
    hasSelect: !!params.args?.select,
    hasOrderBy: !!params.args?.orderBy,
  }
  
  return JSON.stringify(structure)
}

/**
 * Sanitize query params (remove sensitive data)
 */
function sanitizeParams(params: unknown): unknown {
  if (!params || typeof params !== 'object') {
    return params
  }
  
  const sanitized = { ...params } as Record<string, unknown>
  
  // Remove sensitive fields
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'privateKey']
  
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]'
    }
  }
  
  return sanitized
}

/**
 * Export query monitoring utilities
 */
export {
  QueryMonitor,
  createQueryMonitorMiddleware as default,
}
