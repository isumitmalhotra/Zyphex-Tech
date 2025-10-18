/**
 * Query Analytics Service
 * 
 * Advanced analytics for query performance data including:
 * - Pattern detection and trend analysis
 * - Optimization recommendations
 * - Performance regression detection
 * - Query comparison and benchmarking
 */

import { QueryMetrics, PerformanceStats, queryMonitor } from './query-monitor'
import { slowQueryLogger } from './slow-query-logger'

/**
 * Query pattern analysis result
 */
export interface QueryPattern {
  queryHash: string
  model: string
  action: string
  occurrences: number
  averageExecutionTime: number
  minExecutionTime: number
  maxExecutionTime: number
  slowQueryRate: number // Percentage of slow queries
  trend: 'improving' | 'degrading' | 'stable'
}

/**
 * Optimization recommendation
 */
export interface OptimizationRecommendation {
  severity: 'low' | 'medium' | 'high' | 'critical'
  model: string
  action: string
  issue: string
  recommendation: string
  estimatedImpact: string
  examples: QueryMetrics[]
}

/**
 * Performance comparison
 */
export interface PerformanceComparison {
  metric: string
  current: number
  previous: number
  change: number
  changePercentage: number
  trend: 'improving' | 'degrading' | 'stable'
}

/**
 * Analytics report
 */
export interface AnalyticsReport {
  timestamp: Date
  timeRange: {
    start: Date
    end: Date
  }
  
  // Summary
  summary: PerformanceStats
  
  // Patterns
  topPatterns: QueryPattern[]
  problematicPatterns: QueryPattern[]
  
  // Recommendations
  recommendations: OptimizationRecommendation[]
  
  // Trends
  trends: {
    queryCount: PerformanceComparison
    averageTime: PerformanceComparison
    slowQueryRate: PerformanceComparison
  }
  
  // Highlights
  highlights: {
    fastestQueries: QueryMetrics[]
    slowestQueries: QueryMetrics[]
    mostFrequentQueries: QueryPattern[]
    recentImprovements: QueryPattern[]
    recentRegressions: QueryPattern[]
  }
}

/**
 * Query Analytics Service
 */
export class QueryAnalytics {
  /**
   * Analyze query patterns
   */
  analyzePatterns(metrics: QueryMetrics[]): QueryPattern[] {
    const patternMap = new Map<string, {
      metrics: QueryMetrics[]
      hash: string
      model: string
      action: string
    }>()
    
    // Group by query hash
    for (const metric of metrics) {
      if (!patternMap.has(metric.queryHash)) {
        patternMap.set(metric.queryHash, {
          metrics: [],
          hash: metric.queryHash,
          model: metric.model,
          action: metric.action,
        })
      }
      patternMap.get(metric.queryHash)!.metrics.push(metric)
    }
    
    // Analyze each pattern
    const patterns: QueryPattern[] = []
    
    for (const [hash, data] of patternMap) {
      const times = data.metrics.map(m => m.executionTime).sort((a, b) => a - b)
      const slowCount = data.metrics.filter(m => m.isSlow).length
      
      // Calculate trend (compare first half vs second half)
      const midpoint = Math.floor(data.metrics.length / 2)
      const firstHalfAvg = data.metrics
        .slice(0, midpoint)
        .reduce((sum, m) => sum + m.executionTime, 0) / midpoint || 0
      const secondHalfAvg = data.metrics
        .slice(midpoint)
        .reduce((sum, m) => sum + m.executionTime, 0) / (data.metrics.length - midpoint) || 0
      
      let trend: 'improving' | 'degrading' | 'stable' = 'stable'
      const changePercent = firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0
      
      if (changePercent < -10) trend = 'improving'
      else if (changePercent > 10) trend = 'degrading'
      
      patterns.push({
        queryHash: hash,
        model: data.model,
        action: data.action,
        occurrences: data.metrics.length,
        averageExecutionTime: times.reduce((a, b) => a + b, 0) / times.length,
        minExecutionTime: times[0] || 0,
        maxExecutionTime: times[times.length - 1] || 0,
        slowQueryRate: (slowCount / data.metrics.length) * 100,
        trend,
      })
    }
    
    return patterns.sort((a, b) => b.occurrences - a.occurrences)
  }
  
  /**
   * Generate optimization recommendations
   */
  generateRecommendations(
    patterns: QueryPattern[],
    metrics: QueryMetrics[]
  ): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = []
    
    for (const pattern of patterns) {
      const examples = metrics.filter(m => m.queryHash === pattern.queryHash).slice(0, 3)
      
      // High slow query rate
      if (pattern.slowQueryRate > 50) {
        recommendations.push({
          severity: pattern.slowQueryRate > 80 ? 'critical' : 'high',
          model: pattern.model,
          action: pattern.action,
          issue: `${pattern.slowQueryRate.toFixed(1)}% of ${pattern.model}.${pattern.action} queries are slow`,
          recommendation: this.getRecommendationForPattern(pattern),
          estimatedImpact: `Reducing execution time could improve ${pattern.occurrences} queries`,
          examples,
        })
      }
      
      // High average execution time
      if (pattern.averageExecutionTime > 2000) {
        recommendations.push({
          severity: pattern.averageExecutionTime > 5000 ? 'critical' : 'high',
          model: pattern.model,
          action: pattern.action,
          issue: `Average execution time of ${pattern.averageExecutionTime.toFixed(0)}ms is too high`,
          recommendation: this.getRecommendationForPattern(pattern),
          estimatedImpact: `Could reduce response time by ${(pattern.averageExecutionTime - 500).toFixed(0)}ms`,
          examples,
        })
      }
      
      // Degrading performance
      if (pattern.trend === 'degrading' && pattern.occurrences > 10) {
        recommendations.push({
          severity: 'medium',
          model: pattern.model,
          action: pattern.action,
          issue: `Performance is degrading for ${pattern.model}.${pattern.action}`,
          recommendation: 'Investigate recent changes or data growth causing performance regression',
          estimatedImpact: 'Prevent further degradation',
          examples,
        })
      }
    }
    
    // Sort by severity
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    return recommendations.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
  }
  
  /**
   * Get specific recommendation for a pattern
   */
  private getRecommendationForPattern(pattern: QueryPattern): string {
    const recommendations: string[] = []
    
    // Action-specific recommendations
    if (pattern.action === 'findMany') {
      recommendations.push('Add pagination with take/skip')
      recommendations.push('Add appropriate indexes on filter fields')
      recommendations.push('Consider using cursor-based pagination for large datasets')
      recommendations.push('Review included relations and use select instead if possible')
    } else if (pattern.action === 'count') {
      recommendations.push('Add indexes on where clause fields')
      recommendations.push('Consider caching count results')
      recommendations.push('Use approximate counts for large datasets')
    } else if (pattern.action.startsWith('create') || pattern.action.startsWith('update')) {
      recommendations.push('Review triggers and hooks that may slow writes')
      recommendations.push('Consider batch operations for multiple records')
      recommendations.push('Check if relations are being loaded unnecessarily')
    } else if (pattern.action.includes('aggregate')) {
      recommendations.push('Ensure aggregated fields have indexes')
      recommendations.push('Consider pre-calculating aggregates')
      recommendations.push('Use materialized views for complex aggregations')
    }
    
    // Model-specific recommendations
    if (pattern.model === 'Task' || pattern.model === 'Message') {
      recommendations.push(`Consider archiving old ${pattern.model} records`)
      recommendations.push(`Add composite indexes for common ${pattern.model} queries`)
    }
    
    // General recommendations
    recommendations.push('Enable query caching with Redis')
    recommendations.push('Review and optimize database schema')
    
    return recommendations.join('; ')
  }
  
  /**
   * Compare performance between time periods
   */
  comparePerformance(
    current: PerformanceStats,
    previous: PerformanceStats
  ): PerformanceComparison[] {
    const comparisons: PerformanceComparison[] = []
    
    const metrics = [
      { key: 'totalQueries', label: 'Total Queries' },
      { key: 'averageExecutionTime', label: 'Average Execution Time (ms)' },
      { key: 'p95ExecutionTime', label: 'P95 Execution Time (ms)' },
      { key: 'p99ExecutionTime', label: 'P99 Execution Time (ms)' },
      { key: 'slowQueries', label: 'Slow Queries' },
    ]
    
    for (const metric of metrics) {
      const currentValue = current[metric.key as keyof PerformanceStats] as number
      const previousValue = previous[metric.key as keyof PerformanceStats] as number
      
      if (previousValue === 0) continue
      
      const change = currentValue - previousValue
      const changePercentage = (change / previousValue) * 100
      
      let trend: 'improving' | 'degrading' | 'stable' = 'stable'
      
      // For query times, lower is better
      if (metric.key.includes('Time')) {
        if (changePercentage < -10) trend = 'improving'
        else if (changePercentage > 10) trend = 'degrading'
      } else {
        // For counts, depends on context
        if (metric.key === 'slowQueries') {
          if (changePercentage < -10) trend = 'improving'
          else if (changePercentage > 10) trend = 'degrading'
        }
      }
      
      comparisons.push({
        metric: metric.label,
        current: currentValue,
        previous: previousValue,
        change,
        changePercentage,
        trend,
      })
    }
    
    return comparisons
  }
  
  /**
   * Generate comprehensive analytics report
   */
  async generateReport(timeRange?: { start: Date; end: Date }): Promise<AnalyticsReport> {
    // Get current performance stats
    const currentStats = queryMonitor.getStats(timeRange)
    const currentMetrics = queryMonitor.getMetrics(10000) // Last 10k queries
    
    // Get previous period stats for comparison
    const duration = timeRange
      ? timeRange.end.getTime() - timeRange.start.getTime()
      : 24 * 60 * 60 * 1000 // 24 hours
    
    const previousRange = timeRange
      ? {
          start: new Date(timeRange.start.getTime() - duration),
          end: timeRange.start,
        }
      : {
          start: new Date(Date.now() - 2 * duration),
          end: new Date(Date.now() - duration),
        }
    
    const previousStats = queryMonitor.getStats(previousRange)
    
    // Analyze patterns
    const allPatterns = this.analyzePatterns(currentMetrics)
    const topPatterns = allPatterns.slice(0, 10)
    const problematicPatterns = allPatterns
      .filter(p => p.slowQueryRate > 30 || p.averageExecutionTime > 1000)
      .slice(0, 10)
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(allPatterns, currentMetrics)
    
    // Compare performance
    const performanceComparisons = this.comparePerformance(currentStats, previousStats)
    
    // Get highlights
    const fastestQueries = [...currentMetrics]
      .sort((a, b) => a.executionTime - b.executionTime)
      .slice(0, 5)
    
    const mostFrequentQueries = topPatterns.slice(0, 5)
    
    const recentImprovements = allPatterns
      .filter(p => p.trend === 'improving')
      .sort((a, b) => b.occurrences - a.occurrences)
      .slice(0, 5)
    
    const recentRegressions = allPatterns
      .filter(p => p.trend === 'degrading')
      .sort((a, b) => b.occurrences - a.occurrences)
      .slice(0, 5)
    
    return {
      timestamp: new Date(),
      timeRange: timeRange || {
        start: new Date(Date.now() - duration),
        end: new Date(),
      },
      
      summary: currentStats,
      
      topPatterns,
      problematicPatterns,
      
      recommendations: recommendations.slice(0, 10),
      
      trends: {
        queryCount: performanceComparisons.find(c => c.metric === 'Total Queries')!,
        averageTime: performanceComparisons.find(c => c.metric === 'Average Execution Time (ms)')!,
        slowQueryRate: {
          metric: 'Slow Query Rate',
          current: (currentStats.slowQueries / currentStats.totalQueries) * 100,
          previous: (previousStats.slowQueries / previousStats.totalQueries) * 100,
          change: 0,
          changePercentage: 0,
          trend: 'stable',
        },
      },
      
      highlights: {
        fastestQueries,
        slowestQueries: currentStats.slowestQueries,
        mostFrequentQueries,
        recentImprovements,
        recentRegressions,
      },
    }
  }
  
  /**
   * Get slow query insights from logs
   */
  async getSlowQueryInsights(days = 7): Promise<{
    totalSlowQueries: number
    dailyBreakdown: Array<{ date: string; count: number }>
    topSlowModels: Array<{ model: string; count: number; avgTime: number }>
    topSlowActions: Array<{ action: string; count: number; avgTime: number }>
  }> {
    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000)
    
    const logs = await slowQueryLogger.getLogsInRange(startDate, endDate)
    
    // Daily breakdown
    const dailyMap = new Map<string, number>()
    for (const log of logs) {
      const date = new Date(log.timestamp).toISOString().split('T')[0]
      dailyMap.set(date, (dailyMap.get(date) || 0) + 1)
    }
    
    const dailyBreakdown = Array.from(dailyMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
    
    // By model
    const modelMap = new Map<string, { count: number; totalTime: number }>()
    for (const log of logs) {
      if (!modelMap.has(log.model)) {
        modelMap.set(log.model, { count: 0, totalTime: 0 })
      }
      const data = modelMap.get(log.model)!
      data.count++
      data.totalTime += log.executionTime
    }
    
    const topSlowModels = Array.from(modelMap.entries())
      .map(([model, data]) => ({
        model,
        count: data.count,
        avgTime: data.totalTime / data.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
    
    // By action
    const actionMap = new Map<string, { count: number; totalTime: number }>()
    for (const log of logs) {
      if (!actionMap.has(log.action)) {
        actionMap.set(log.action, { count: 0, totalTime: 0 })
      }
      const data = actionMap.get(log.action)!
      data.count++
      data.totalTime += log.executionTime
    }
    
    const topSlowActions = Array.from(actionMap.entries())
      .map(([action, data]) => ({
        action,
        count: data.count,
        avgTime: data.totalTime / data.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
    
    return {
      totalSlowQueries: logs.length,
      dailyBreakdown,
      topSlowModels,
      topSlowActions,
    }
  }
}

/**
 * Global analytics instance
 */
export const queryAnalytics = new QueryAnalytics()
