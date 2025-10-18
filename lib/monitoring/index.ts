/**
 * Query Performance Monitoring
 * 
 * Comprehensive query monitoring system with:
 * - Real-time performance tracking
 * - Slow query detection and logging
 * - Analytics and reporting
 * - Pattern detection
 * - Optimization recommendations
 */

// Core monitoring
export type {
  QueryMetrics,
  SlowQueryLog,
  PerformanceStats,
  PerformanceThresholds,
} from './query-monitor'

export {
  QueryMonitor,
  queryMonitor,
  createQueryMonitorMiddleware,
  createQueryMonitorExtension,
  DEFAULT_THRESHOLDS,
} from './query-monitor'

// Slow query logging
export type {
  LoggerConfig,
} from './slow-query-logger'

export {
  SlowQueryLogger,
  slowQueryLogger,
  logSlowQuery,
} from './slow-query-logger'

// Analytics
export type {
  QueryPattern,
  OptimizationRecommendation,
  PerformanceComparison,
  AnalyticsReport,
} from './query-analytics'

export {
  QueryAnalytics,
  queryAnalytics,
} from './query-analytics'
