/**
 * Query Performance Analyzer
 * 
 * Advanced analysis tools for identifying performance issues and optimization opportunities.
 * Detects N+1 queries, missing indexes, inefficient patterns, and provides recommendations.
 */

import { queryMonitor, QueryExecution } from './query-monitor'
import { performanceLogger, LogLevel } from './performance-logger'

/**
 * Performance issue types
 */
export enum IssueType {
  SLOW_QUERY = 'slow_query',
  N_PLUS_ONE = 'n_plus_one',
  MISSING_INDEX = 'missing_index',
  INEFFICIENT_PATTERN = 'inefficient_pattern',
  HIGH_ERROR_RATE = 'high_error_rate',
  POOR_CACHE_HIT_RATE = 'poor_cache_hit_rate',
}

/**
 * Performance issue severity
 */
export enum IssueSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Performance issue
 */
export interface PerformanceIssue {
  id: string
  type: IssueType
  severity: IssueSeverity
  title: string
  description: string
  affectedQueries: QueryExecution[]
  impact: {
    queryCount: number
    totalDuration: number
    avgDuration: number
  }
  recommendations: string[]
  detectedAt: Date
}

/**
 * Query pattern analysis
 */
export interface QueryPatternAnalysis {
  pattern: string
  model: string
  action: string
  occurrences: number
  totalDuration: number
  avgDuration: number
  minDuration: number
  maxDuration: number
  p95Duration: number
  cacheHitRate: number
  errorRate: number
  recommendation?: string
}

/**
 * Model performance stats
 */
export interface ModelPerformance {
  model: string
  queryCount: number
  totalDuration: number
  avgDuration: number
  slowestQuery: QueryExecution | null
  fastestQuery: QueryExecution | null
  actions: Map<string, {
    count: number
    avgDuration: number
  }>
}

/**
 * Performance analyzer configuration
 */
export interface AnalyzerConfig {
  /** N+1 detection threshold (queries in time window) */
  n1Threshold: number
  /** Time window for N+1 detection (ms) */
  n1TimeWindow: number
  /** Slow query threshold (ms) */
  slowQueryThreshold: number
  /** Poor cache hit rate threshold (%) */
  poorCacheHitRateThreshold: number
  /** High error rate threshold (%) */
  highErrorRateThreshold: number
  /** Enable automatic issue detection */
  autoDetect: boolean
  /** Analysis interval (ms) */
  analysisInterval: number
}

const DEFAULT_ANALYZER_CONFIG: AnalyzerConfig = {
  n1Threshold: 10,
  n1TimeWindow: 1000,
  slowQueryThreshold: 100,
  poorCacheHitRateThreshold: 30,
  highErrorRateThreshold: 5,
  autoDetect: true,
  analysisInterval: 60000, // 1 minute
}

/**
 * Query Performance Analyzer
 */
export class QueryPerformanceAnalyzer {
  private static instance: QueryPerformanceAnalyzer
  private config: AnalyzerConfig
  private detectedIssues: PerformanceIssue[] = []
  private analysisTimer: NodeJS.Timeout | null = null

  private constructor(config?: Partial<AnalyzerConfig>) {
    this.config = { ...DEFAULT_ANALYZER_CONFIG, ...config }
    
    if (this.config.autoDetect) {
      this.startAutoAnalysis()
    }
  }

  /**
   * Get singleton instance
   */
  public static getInstance(config?: Partial<AnalyzerConfig>): QueryPerformanceAnalyzer {
    if (!QueryPerformanceAnalyzer.instance) {
      QueryPerformanceAnalyzer.instance = new QueryPerformanceAnalyzer(config)
    }
    return QueryPerformanceAnalyzer.instance
  }

  /**
   * Start automatic analysis
   */
  private startAutoAnalysis(): void {
    if (this.analysisTimer) return

    this.analysisTimer = setInterval(() => {
      this.runAnalysis()
    }, this.config.analysisInterval)

    console.log(`[Performance Analyzer] Auto-analysis started (interval: ${this.config.analysisInterval}ms)`)
  }

  /**
   * Stop automatic analysis
   */
  public stopAutoAnalysis(): void {
    if (this.analysisTimer) {
      clearInterval(this.analysisTimer)
      this.analysisTimer = null
      console.log('[Performance Analyzer] Auto-analysis stopped')
    }
  }

  /**
   * Run full performance analysis
   */
  public async runAnalysis(): Promise<PerformanceIssue[]> {
    console.log('[Performance Analyzer] Running performance analysis...')
    
    const issues: PerformanceIssue[] = []

    // Detect N+1 queries
    const n1Issues = await this.detectN1Queries()
    issues.push(...n1Issues)

    // Detect slow queries
    const slowQueryIssues = await this.detectSlowQueries()
    issues.push(...slowQueryIssues)

    // Detect poor cache performance
    const cacheIssues = await this.detectCacheIssues()
    issues.push(...cacheIssues)

    // Detect high error rates
    const errorIssues = await this.detectErrorIssues()
    issues.push(...errorIssues)

    // Store detected issues
    this.detectedIssues = issues

    // Log findings
    if (issues.length > 0) {
      await performanceLogger.log(
        LogLevel.WARN,
        `Performance analysis complete: ${issues.length} issues detected`,
        {
          critical: issues.filter((i) => i.severity === IssueSeverity.CRITICAL).length,
          high: issues.filter((i) => i.severity === IssueSeverity.HIGH).length,
          medium: issues.filter((i) => i.severity === IssueSeverity.MEDIUM).length,
          low: issues.filter((i) => i.severity === IssueSeverity.LOW).length,
        }
      )
    }

    return issues
  }

  /**
   * Detect N+1 query patterns
   */
  private async detectN1Queries(): Promise<PerformanceIssue[]> {
    const n1Patterns = queryMonitor.detectN1Queries(this.config.n1TimeWindow)
    const issues: PerformanceIssue[] = []

    for (const pattern of n1Patterns) {
      if (pattern.count >= this.config.n1Threshold) {
        const severity = pattern.count >= 50 
          ? IssueSeverity.CRITICAL 
          : pattern.count >= 20 
          ? IssueSeverity.HIGH 
          : IssueSeverity.MEDIUM

        const issue: PerformanceIssue = {
          id: `n1-${Date.now()}-${pattern.pattern}`,
          type: IssueType.N_PLUS_ONE,
          severity,
          title: `N+1 Query Pattern Detected: ${pattern.pattern}`,
          description: `Query pattern "${pattern.pattern}" executed ${pattern.count} times in ${this.config.n1TimeWindow}ms window, taking ${pattern.duration}ms total.`,
          affectedQueries: queryMonitor.getQueries().filter(
            (q) => `${q.model}.${q.action}` === pattern.pattern
          ).slice(0, 10),
          impact: {
            queryCount: pattern.count,
            totalDuration: pattern.duration,
            avgDuration: pattern.duration / pattern.count,
          },
          recommendations: [
            'Use Prisma "include" to fetch related data in a single query',
            'Implement eager loading for associations',
            'Consider adding a dataloader pattern for this relationship',
            'Review the calling code for loops that trigger individual queries',
          ],
          detectedAt: new Date(),
        }

        issues.push(issue)
        await performanceLogger.logN1Detection(pattern.pattern, pattern.count, pattern.duration)
      }
    }

    return issues
  }

  /**
   * Detect slow queries
   */
  private async detectSlowQueries(): Promise<PerformanceIssue[]> {
    const slowQueries = queryMonitor.getSlowQueries(100)
    if (slowQueries.length === 0) return []

    // Group by pattern
    const patterns = new Map<string, QueryExecution[]>()
    for (const query of slowQueries) {
      const pattern = `${query.model}.${query.action}`
      if (!patterns.has(pattern)) {
        patterns.set(pattern, [])
      }
      patterns.get(pattern)!.push(query)
    }

    const issues: PerformanceIssue[] = []

    for (const [pattern, queries] of patterns.entries()) {
      const totalDuration = queries.reduce((sum, q) => sum + q.duration, 0)
      const avgDuration = totalDuration / queries.length
      const maxDuration = Math.max(...queries.map((q) => q.duration))

      const severity = maxDuration >= 5000
        ? IssueSeverity.CRITICAL
        : avgDuration >= 1000
        ? IssueSeverity.HIGH
        : avgDuration >= 500
        ? IssueSeverity.MEDIUM
        : IssueSeverity.LOW

      const issue: PerformanceIssue = {
        id: `slow-${Date.now()}-${pattern}`,
        type: IssueType.SLOW_QUERY,
        severity,
        title: `Slow Query Pattern: ${pattern}`,
        description: `Query pattern "${pattern}" has ${queries.length} slow execution(s) with average duration of ${avgDuration.toFixed(2)}ms.`,
        affectedQueries: queries.slice(0, 10),
        impact: {
          queryCount: queries.length,
          totalDuration,
          avgDuration,
        },
        recommendations: [
          'Add database indexes on frequently queried columns',
          'Review query "where" clauses for optimization opportunities',
          'Consider adding pagination for large result sets',
          'Use "select" to fetch only needed fields',
          'Implement caching for frequently accessed data',
        ],
        detectedAt: new Date(),
      }

      issues.push(issue)
    }

    return issues
  }

  /**
   * Detect cache performance issues
   */
  private async detectCacheIssues(): Promise<PerformanceIssue[]> {
    const metrics = queryMonitor.getMetrics()
    const issues: PerformanceIssue[] = []

    if (metrics.cacheHitRate < this.config.poorCacheHitRateThreshold) {
      const issue: PerformanceIssue = {
        id: `cache-${Date.now()}`,
        type: IssueType.POOR_CACHE_HIT_RATE,
        severity: metrics.cacheHitRate < 10 ? IssueSeverity.HIGH : IssueSeverity.MEDIUM,
        title: 'Poor Cache Hit Rate',
        description: `Cache hit rate is ${metrics.cacheHitRate.toFixed(1)}%, which is below the ${this.config.poorCacheHitRateThreshold}% threshold.`,
        affectedQueries: queryMonitor.getQueries(20),
        impact: {
          queryCount: metrics.totalQueries,
          totalDuration: metrics.totalQueries * metrics.averageDuration,
          avgDuration: metrics.averageDuration,
        },
        recommendations: [
          'Review and optimize cache TTL settings',
          'Implement cache warming for frequently accessed data',
          'Consider adding more aggressive caching strategies',
          'Use cache-aside pattern for read-heavy operations',
          'Analyze query patterns to identify cacheable data',
        ],
        detectedAt: new Date(),
      }

      issues.push(issue)
    }

    return issues
  }

  /**
   * Detect high error rates
   */
  private async detectErrorIssues(): Promise<PerformanceIssue[]> {
    const metrics = queryMonitor.getMetrics()
    const issues: PerformanceIssue[] = []

    if (metrics.errorRate > this.config.highErrorRateThreshold) {
      const failedQueries = queryMonitor.getQueries().filter((q) => q.error)

      const issue: PerformanceIssue = {
        id: `error-${Date.now()}`,
        type: IssueType.HIGH_ERROR_RATE,
        severity: metrics.errorRate > 20 ? IssueSeverity.CRITICAL : IssueSeverity.HIGH,
        title: 'High Query Error Rate',
        description: `Query error rate is ${metrics.errorRate.toFixed(1)}% (${metrics.failedQueries} failures out of ${metrics.totalQueries} queries).`,
        affectedQueries: failedQueries.slice(0, 20),
        impact: {
          queryCount: metrics.failedQueries,
          totalDuration: 0,
          avgDuration: 0,
        },
        recommendations: [
          'Review error logs for common failure patterns',
          'Check database connection pool settings',
          'Implement retry logic for transient failures',
          'Add input validation to prevent invalid queries',
          'Monitor database health and connectivity',
        ],
        detectedAt: new Date(),
      }

      issues.push(issue)
    }

    return issues
  }

  /**
   * Analyze query patterns
   */
  public analyzeQueryPatterns(): QueryPatternAnalysis[] {
    const queries = queryMonitor.getQueries()
    const patterns = new Map<string, QueryExecution[]>()

    // Group queries by pattern
    for (const query of queries) {
      const pattern = `${query.model}.${query.action}`
      if (!patterns.has(pattern)) {
        patterns.set(pattern, [])
      }
      patterns.get(pattern)!.push(query)
    }

    // Analyze each pattern
    const analyses: QueryPatternAnalysis[] = []

    for (const [pattern, patternQueries] of patterns.entries()) {
      const durations = patternQueries.map((q) => q.duration).sort((a, b) => a - b)
      const totalDuration = durations.reduce((sum, d) => sum + d, 0)
      const cachedCount = patternQueries.filter((q) => q.cached).length
      const errorCount = patternQueries.filter((q) => q.error).length

      const analysis: QueryPatternAnalysis = {
        pattern,
        model: patternQueries[0].model,
        action: patternQueries[0].action,
        occurrences: patternQueries.length,
        totalDuration,
        avgDuration: totalDuration / patternQueries.length,
        minDuration: durations[0] || 0,
        maxDuration: durations[durations.length - 1] || 0,
        p95Duration: this.calculatePercentile(durations, 95),
        cacheHitRate: (cachedCount / patternQueries.length) * 100,
        errorRate: (errorCount / patternQueries.length) * 100,
      }

      // Add recommendations
      if (analysis.avgDuration > 100) {
        analysis.recommendation = 'Consider adding indexes or implementing caching'
      } else if (analysis.cacheHitRate < 30 && analysis.occurrences > 10) {
        analysis.recommendation = 'Implement caching for this frequently accessed pattern'
      } else if (analysis.errorRate > 5) {
        analysis.recommendation = 'High error rate - review query logic and database state'
      }

      analyses.push(analysis)
    }

    // Sort by total impact (duration * occurrences)
    return analyses.sort((a, b) => b.totalDuration - a.totalDuration)
  }

  /**
   * Analyze performance by model
   */
  public analyzeModelPerformance(): ModelPerformance[] {
    const queries = queryMonitor.getQueries()
    const models = new Map<string, QueryExecution[]>()

    // Group by model
    for (const query of queries) {
      if (!models.has(query.model)) {
        models.set(query.model, [])
      }
      models.get(query.model)!.push(query)
    }

    const performances: ModelPerformance[] = []

    for (const [model, modelQueries] of models.entries()) {
      const totalDuration = modelQueries.reduce((sum, q) => sum + q.duration, 0)
      const sortedByDuration = [...modelQueries].sort((a, b) => b.duration - a.duration)

      // Group by action
      const actions = new Map<string, QueryExecution[]>()
      for (const query of modelQueries) {
        if (!actions.has(query.action)) {
          actions.set(query.action, [])
        }
        actions.get(query.action)!.push(query)
      }

      const actionStats = new Map<string, { count: number; avgDuration: number }>()
      for (const [action, actionQueries] of actions.entries()) {
        const actionDuration = actionQueries.reduce((sum, q) => sum + q.duration, 0)
        actionStats.set(action, {
          count: actionQueries.length,
          avgDuration: actionDuration / actionQueries.length,
        })
      }

      performances.push({
        model,
        queryCount: modelQueries.length,
        totalDuration,
        avgDuration: totalDuration / modelQueries.length,
        slowestQuery: sortedByDuration[0] || null,
        fastestQuery: sortedByDuration[sortedByDuration.length - 1] || null,
        actions: actionStats,
      })
    }

    return performances.sort((a, b) => b.totalDuration - a.totalDuration)
  }

  /**
   * Calculate percentile
   */
  private calculatePercentile(sortedValues: number[], percentile: number): number {
    if (sortedValues.length === 0) return 0
    const index = Math.ceil((percentile / 100) * sortedValues.length) - 1
    return sortedValues[Math.max(0, index)]
  }

  /**
   * Get detected issues
   */
  public getIssues(severity?: IssueSeverity): PerformanceIssue[] {
    if (severity) {
      return this.detectedIssues.filter((i) => i.severity === severity)
    }
    return [...this.detectedIssues]
  }

  /**
   * Clear detected issues
   */
  public clearIssues(): void {
    this.detectedIssues = []
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<AnalyzerConfig>): void {
    this.config = { ...this.config, ...config }
    
    if (config.autoDetect !== undefined) {
      if (config.autoDetect) {
        this.startAutoAnalysis()
      } else {
        this.stopAutoAnalysis()
      }
    }
  }

  /**
   * Get configuration
   */
  public getConfig(): AnalyzerConfig {
    return { ...this.config }
  }
}

// Export singleton instance
export const performanceAnalyzer = QueryPerformanceAnalyzer.getInstance()
