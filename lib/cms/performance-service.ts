/**
 * CMS Performance Monitoring Service
 * 
 * Provides comprehensive performance tracking and monitoring:
 * - API response time tracking
 * - Resource usage monitoring (memory, CPU, database connections)
 * - Page load time metrics
 * - Database query performance
 * - Cache hit/miss rates
 * - Performance alerts and thresholds
 * - Performance analytics and trends
 */

import { prisma } from '@/lib/prisma';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface PerformanceMetric {
  id: string;
  metricType: MetricType;
  metricName: string;
  value: number;
  unit: string;
  context?: Record<string, unknown>;
  recordedBy: string;
  recordedAt: Date;
  tags?: string[];
}

export type MetricType = 
  | 'api_response_time'
  | 'page_load_time'
  | 'database_query_time'
  | 'cache_hit_rate'
  | 'memory_usage'
  | 'cpu_usage'
  | 'error_rate'
  | 'throughput'
  | 'custom';

export interface RecordMetricInput {
  metricType: MetricType;
  metricName: string;
  value: number;
  unit: string;
  context?: Record<string, unknown>;
  recordedBy: string;
  tags?: string[];
}

export interface PerformanceAlert {
  id: string;
  alertType: AlertType;
  severity: AlertSeverity;
  message: string;
  metricType: MetricType;
  threshold: number;
  currentValue: number;
  triggeredAt: Date;
  resolvedAt?: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  context?: Record<string, unknown>;
}

export type AlertType = 'threshold_exceeded' | 'anomaly_detected' | 'degradation' | 'outage';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface CreateAlertInput {
  alertType: AlertType;
  severity: AlertSeverity;
  message: string;
  metricType: MetricType;
  threshold: number;
  currentValue: number;
  context?: Record<string, unknown>;
}

export interface PerformanceStats {
  metricType: MetricType;
  count: number;
  average: number;
  min: number;
  max: number;
  median: number;
  p95: number;
  p99: number;
  trend: 'improving' | 'stable' | 'degrading';
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'critical';
  uptime: number;
  metrics: {
    apiResponseTime: PerformanceStats;
    errorRate: PerformanceStats;
    cacheHitRate: PerformanceStats;
  };
  activeAlerts: number;
  lastChecked: Date;
}

// ============================================================================
// Metric Recording
// ============================================================================

/**
 * Record a performance metric
 */
export async function recordMetric(input: RecordMetricInput): Promise<PerformanceMetric> {
  const metric = await prisma.cmsPerformanceMetric.create({
    data: {
      metricType: input.metricType,
      metricName: input.metricName,
      value: input.value,
      unit: input.unit,
      context: input.context || {},
      recordedBy: input.recordedBy,
      tags: input.tags || [],
    },
  });

  // Check if metric exceeds thresholds
  await checkThresholds(metric);

  return mapToPerformanceMetric(metric);
}

/**
 * Record multiple metrics in batch
 */
export async function recordMetricsBatch(
  metrics: RecordMetricInput[]
): Promise<PerformanceMetric[]> {
  await prisma.cmsPerformanceMetric.createMany({
    data: metrics.map(m => ({
      metricType: m.metricType,
      metricName: m.metricName,
      value: m.value,
      unit: m.unit,
      context: m.context || {},
      recordedBy: m.recordedBy,
      tags: m.tags || [],
    })),
  });

  // Return the created metrics
  const result = await prisma.cmsPerformanceMetric.findMany({
    orderBy: { recordedAt: 'desc' },
    take: metrics.length,
  });

  return result.map(mapToPerformanceMetric);
}

/**
 * Get metrics with filters
 */
export async function getMetrics(filters: {
  metricType?: MetricType;
  metricName?: string;
  startDate?: Date;
  endDate?: Date;
  tags?: string[];
  limit?: number;
} = {}): Promise<PerformanceMetric[]> {
  const where: Record<string, unknown> = {};

  if (filters.metricType) {
    where.metricType = filters.metricType;
  }

  if (filters.metricName) {
    where.metricName = filters.metricName;
  }

  if (filters.startDate || filters.endDate) {
    where.recordedAt = {} as Record<string, unknown>;
    if (filters.startDate) {
      (where.recordedAt as Record<string, unknown>).gte = filters.startDate;
    }
    if (filters.endDate) {
      (where.recordedAt as Record<string, unknown>).lte = filters.endDate;
    }
  }

  if (filters.tags && filters.tags.length > 0) {
    where.tags = {
      hasSome: filters.tags,
    };
  }

  const metrics = await prisma.cmsPerformanceMetric.findMany({
    where,
    orderBy: { recordedAt: 'desc' },
    take: filters.limit || 1000,
  });

  return metrics.map(mapToPerformanceMetric);
}

/**
 * Delete old metrics (cleanup)
 */
export async function cleanupOldMetrics(olderThanDays: number = 30): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  const result = await prisma.cmsPerformanceMetric.deleteMany({
    where: {
      recordedAt: {
        lt: cutoffDate,
      },
    },
  });

  return result.count;
}

// ============================================================================
// Performance Statistics
// ============================================================================

/**
 * Get performance statistics for a metric type
 */
export async function getPerformanceStats(
  metricType: MetricType,
  timeRange?: {
    startDate?: Date;
    endDate?: Date;
  }
): Promise<PerformanceStats> {
  const where: Record<string, unknown> = { metricType };

  if (timeRange?.startDate || timeRange?.endDate) {
    where.recordedAt = {} as Record<string, unknown>;
    if (timeRange.startDate) {
      (where.recordedAt as Record<string, unknown>).gte = timeRange.startDate;
    }
    if (timeRange.endDate) {
      (where.recordedAt as Record<string, unknown>).lte = timeRange.endDate;
    }
  }

  const metrics = await prisma.cmsPerformanceMetric.findMany({
    where,
    select: { value: true },
    orderBy: { value: 'asc' },
  });

  if (metrics.length === 0) {
    return {
      metricType,
      count: 0,
      average: 0,
      min: 0,
      max: 0,
      median: 0,
      p95: 0,
      p99: 0,
      trend: 'stable',
    };
  }

  const values = metrics.map(m => m.value);
  const count = values.length;
  const average = values.reduce((sum, v) => sum + v, 0) / count;
  const min = values[0];
  const max = values[count - 1];
  const median = values[Math.floor(count / 2)];
  const p95 = values[Math.floor(count * 0.95)];
  const p99 = values[Math.floor(count * 0.99)];

  // Calculate trend (compare last 10% vs first 10%)
  const recentCount = Math.floor(count * 0.1) || 1;
  const recentAvg = values.slice(-recentCount).reduce((sum, v) => sum + v, 0) / recentCount;
  const oldAvg = values.slice(0, recentCount).reduce((sum, v) => sum + v, 0) / recentCount;
  
  let trend: 'improving' | 'stable' | 'degrading' = 'stable';
  const change = ((recentAvg - oldAvg) / oldAvg) * 100;
  
  if (change < -5) trend = 'improving'; // Lower is better for response times
  else if (change > 5) trend = 'degrading';

  return {
    metricType,
    count,
    average,
    min,
    max,
    median,
    p95,
    p99,
    trend,
  };
}

/**
 * Get overall system health
 */
export async function getSystemHealth(): Promise<SystemHealth> {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const [apiStats, errorRateStats, cacheStats, activeAlerts] = await Promise.all([
    getPerformanceStats('api_response_time', { startDate: oneHourAgo }),
    getPerformanceStats('error_rate', { startDate: oneHourAgo }),
    getPerformanceStats('cache_hit_rate', { startDate: oneHourAgo }),
    prisma.cmsPerformanceAlert.count({
      where: {
        resolvedAt: null,
      },
    }),
  ]);

  // Determine overall health status
  let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
  
  if (activeAlerts > 0) {
    const criticalAlerts = await prisma.cmsPerformanceAlert.count({
      where: {
        resolvedAt: null,
        severity: 'critical',
      },
    });
    
    if (criticalAlerts > 0) status = 'critical';
    else status = 'degraded';
  }

  // Calculate uptime (placeholder - in real app, track from process start)
  const uptime = process.uptime();

  return {
    status,
    uptime,
    metrics: {
      apiResponseTime: apiStats,
      errorRate: errorRateStats,
      cacheHitRate: cacheStats,
    },
    activeAlerts,
    lastChecked: now,
  };
}

// ============================================================================
// Alerts
// ============================================================================

/**
 * Create a performance alert
 */
export async function createAlert(input: CreateAlertInput): Promise<PerformanceAlert> {
  const alert = await prisma.cmsPerformanceAlert.create({
    data: {
      alertType: input.alertType,
      severity: input.severity,
      message: input.message,
      metricType: input.metricType,
      threshold: input.threshold,
      currentValue: input.currentValue,
      context: input.context || {},
      acknowledged: false,
    },
  });

  return mapToPerformanceAlert(alert);
}

/**
 * Check metric against thresholds and create alerts
 */
async function checkThresholds(metric: Record<string, unknown>): Promise<void> {
  const metricType = metric.metricType as MetricType;
  const value = metric.value as number;

  // Define thresholds (in real app, these would be configurable)
  const thresholds: Record<MetricType, { warning: number; critical: number }> = {
    api_response_time: { warning: 1000, critical: 3000 }, // ms
    page_load_time: { warning: 2000, critical: 5000 }, // ms
    database_query_time: { warning: 500, critical: 2000 }, // ms
    cache_hit_rate: { warning: 70, critical: 50 }, // % (lower is bad)
    memory_usage: { warning: 80, critical: 95 }, // %
    cpu_usage: { warning: 80, critical: 95 }, // %
    error_rate: { warning: 5, critical: 10 }, // %
    throughput: { warning: 100, critical: 50 }, // requests/sec (lower is bad)
    custom: { warning: 100, critical: 200 },
  };

  const threshold = thresholds[metricType];
  if (!threshold) return;

  // For metrics where lower is better
  const isLowerBetter = ['api_response_time', 'page_load_time', 'database_query_time', 'error_rate'].includes(metricType);
  
  // For metrics where higher is better
  const isHigherBetter = ['cache_hit_rate', 'throughput'].includes(metricType);

  let severity: AlertSeverity | null = null;

  if (isLowerBetter) {
    if (value >= threshold.critical) severity = 'critical';
    else if (value >= threshold.warning) severity = 'high';
  } else if (isHigherBetter) {
    if (value <= threshold.critical) severity = 'critical';
    else if (value <= threshold.warning) severity = 'high';
  } else {
    // For usage metrics (higher is worse)
    if (value >= threshold.critical) severity = 'critical';
    else if (value >= threshold.warning) severity = 'high';
  }

  if (severity) {
    await createAlert({
      alertType: 'threshold_exceeded',
      severity,
      message: `${metricType} ${isLowerBetter || !isHigherBetter ? 'exceeded' : 'below'} threshold: ${value} ${metric.unit}`,
      metricType,
      threshold: severity === 'critical' ? threshold.critical : threshold.warning,
      currentValue: value,
      context: {
        metricId: metric.id,
        metricName: metric.metricName,
      },
    });
  }
}

/**
 * Get active alerts
 */
export async function getActiveAlerts(filters: {
  severity?: AlertSeverity;
  metricType?: MetricType;
} = {}): Promise<PerformanceAlert[]> {
  const where: Record<string, unknown> = {
    resolvedAt: null,
  };

  if (filters.severity) {
    where.severity = filters.severity;
  }

  if (filters.metricType) {
    where.metricType = filters.metricType;
  }

  const alerts = await prisma.cmsPerformanceAlert.findMany({
    where,
    orderBy: { triggeredAt: 'desc' },
  });

  return alerts.map(mapToPerformanceAlert);
}

/**
 * Acknowledge an alert
 */
export async function acknowledgeAlert(
  alertId: string,
  acknowledgedBy: string
): Promise<PerformanceAlert> {
  const alert = await prisma.cmsPerformanceAlert.update({
    where: { id: alertId },
    data: {
      acknowledged: true,
      acknowledgedBy,
    },
  });

  return mapToPerformanceAlert(alert);
}

/**
 * Resolve an alert
 */
export async function resolveAlert(alertId: string): Promise<PerformanceAlert> {
  const alert = await prisma.cmsPerformanceAlert.update({
    where: { id: alertId },
    data: {
      resolvedAt: new Date(),
    },
  });

  return mapToPerformanceAlert(alert);
}

/**
 * Delete old resolved alerts
 */
export async function cleanupOldAlerts(olderThanDays: number = 30): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  const result = await prisma.cmsPerformanceAlert.deleteMany({
    where: {
      resolvedAt: {
        not: null,
        lt: cutoffDate,
      },
    },
  });

  return result.count;
}

// ============================================================================
// Performance Tracking Utilities
// ============================================================================

/**
 * Performance tracker for measuring operation duration
 */
export class PerformanceTracker {
  private startTime: number;
  private metricType: MetricType;
  private metricName: string;
  private recordedBy: string;
  private context: Record<string, unknown>;
  private tags: string[];

  constructor(
    metricType: MetricType,
    metricName: string,
    recordedBy: string,
    options?: {
      context?: Record<string, unknown>;
      tags?: string[];
    }
  ) {
    this.startTime = Date.now();
    this.metricType = metricType;
    this.metricName = metricName;
    this.recordedBy = recordedBy;
    this.context = options?.context || {};
    this.tags = options?.tags || [];
  }

  /**
   * End tracking and record the metric
   */
  async end(): Promise<PerformanceMetric> {
    const duration = Date.now() - this.startTime;

    return recordMetric({
      metricType: this.metricType,
      metricName: this.metricName,
      value: duration,
      unit: 'ms',
      recordedBy: this.recordedBy,
      context: {
        ...this.context,
        duration,
      },
      tags: this.tags,
    });
  }

  /**
   * Get current duration without recording
   */
  getDuration(): number {
    return Date.now() - this.startTime;
  }
}

/**
 * Decorator for tracking function performance
 */
export function trackPerformance(
  metricType: MetricType,
  metricName: string,
  recordedBy: string = 'system'
) {
  return function (
    _target: unknown,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const tracker = new PerformanceTracker(metricType, metricName, recordedBy);
      
      try {
        const result = await originalMethod.apply(this, args);
        await tracker.end();
        return result;
      } catch (error) {
        await tracker.end();
        throw error;
      }
    };

    return descriptor;
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function mapToPerformanceMetric(metric: Record<string, unknown>): PerformanceMetric {
  return {
    id: metric.id as unknown as string,
    metricType: metric.metricType as MetricType,
    metricName: metric.metricName as unknown as string,
    value: metric.value as unknown as number,
    unit: metric.unit as unknown as string,
    context: metric.context as Record<string, unknown> | undefined,
    recordedBy: metric.recordedBy as unknown as string,
    recordedAt: metric.recordedAt as unknown as Date,
    tags: metric.tags as unknown as string[] | undefined,
  };
}

function mapToPerformanceAlert(alert: Record<string, unknown>): PerformanceAlert {
  return {
    id: alert.id as unknown as string,
    alertType: alert.alertType as AlertType,
    severity: alert.severity as AlertSeverity,
    message: alert.message as unknown as string,
    metricType: alert.metricType as MetricType,
    threshold: alert.threshold as unknown as number,
    currentValue: alert.currentValue as unknown as number,
    triggeredAt: alert.triggeredAt as unknown as Date,
    resolvedAt: (alert.resolvedAt as unknown as Date | null) || undefined,
    acknowledged: alert.acknowledged as unknown as boolean,
    acknowledgedBy: (alert.acknowledgedBy as unknown as string | null) || undefined,
    context: alert.context as Record<string, unknown> | undefined,
  };
}
