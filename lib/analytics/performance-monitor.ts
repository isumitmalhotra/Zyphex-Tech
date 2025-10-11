// Performance Monitoring Integration
// Correlates error events with system performance metrics

import { ErrorMetric, errorAnalytics } from './error-analytics';

export interface PerformanceMetric {
  timestamp: Date;
  route: string;
  responseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  networkLatency: number;
  databaseQueryTime: number;
  cacheHitRate: number;
  throughput: number; // requests per second
  concurrentUsers: number;
}

export interface PerformanceAlert {
  id: string;
  timestamp: Date;
  type: 'high_response_time' | 'memory_leak' | 'cpu_spike' | 'low_throughput' | 'database_slow';
  severity: 'warning' | 'critical';
  metric: keyof PerformanceMetric;
  currentValue: number;
  thresholdValue: number;
  route?: string;
  description: string;
  suggestedActions: string[];
}

export interface PerformanceTrend {
  timeframe: 'hour' | 'day' | 'week';
  period: string;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  averageMemoryUsage: number;
  averageCpuUsage: number;
  totalThroughput: number;
  errorRate: number;
  availabilityPercentage: number;
}

export interface ErrorPerformanceCorrelation {
  errorId: string;
  performanceImpact: {
    responseTimeDelta: number; // ms increase
    memoryUsageDelta: number; // MB increase
    cpuUsageDelta: number; // % increase
    throughputDelta: number; // % decrease
  };
  recoveryTime: number; // ms until performance normalized
  cascadingEffects: {
    affectedRoutes: string[];
    totalImpactDuration: number;
    userSessionsAffected: number;
  };
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private alerts: PerformanceAlert[] = [];
  private trends: Map<string, PerformanceTrend> = new Map();
  private correlations: ErrorPerformanceCorrelation[] = [];
  private thresholds = {
    responseTime: { warning: 1000, critical: 3000 }, // ms
    memoryUsage: { warning: 80, critical: 95 }, // % of available
    cpuUsage: { warning: 70, critical: 90 }, // %
    throughput: { warning: 100, critical: 50 }, // requests/sec minimum
    errorRate: { warning: 0.01, critical: 0.05 }, // 1% and 5%
  };

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
      PerformanceMonitor.instance.initialize();
    }
    return PerformanceMonitor.instance;
  }

  private initialize(): void {
    // Subscribe to error events to track performance correlation
    errorAnalytics.subscribe((error) => {
      this.analyzeErrorPerformanceImpact(error);
    });

    // Start performance monitoring
    this.startPerformanceCollection();
    
    // Start alert monitoring
    this.startAlertMonitoring();
  }

  // Record performance metric
  public recordPerformanceMetric(metric: Omit<PerformanceMetric, 'timestamp'>): PerformanceMetric {
    const performanceMetric: PerformanceMetric = {
      timestamp: new Date(),
      ...metric,
    };

    this.metrics.push(performanceMetric);
    this.updatePerformanceTrends(performanceMetric);
    this.checkPerformanceThresholds(performanceMetric);

    // Keep only last 24 hours of metrics to prevent memory issues
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.metrics = this.metrics.filter(m => m.timestamp >= cutoff);

    return performanceMetric;
  }

  // Analyze error's impact on performance
  private analyzeErrorPerformanceImpact(error: ErrorMetric): void {
    const errorTime = error.timestamp;
    const timeWindow = 5 * 60 * 1000; // 5 minutes before and after error
    
    const beforeMetrics = this.metrics.filter(m => 
      m.timestamp >= new Date(errorTime.getTime() - timeWindow) &&
      m.timestamp < errorTime &&
      m.route === error.route
    );
    
    const afterMetrics = this.metrics.filter(m => 
      m.timestamp >= errorTime &&
      m.timestamp <= new Date(errorTime.getTime() + timeWindow) &&
      m.route === error.route
    );

    if (beforeMetrics.length === 0 || afterMetrics.length === 0) {
      return; // Not enough data for correlation
    }

    const beforeAvg = this.calculateAverageMetrics(beforeMetrics);
    const afterAvg = this.calculateAverageMetrics(afterMetrics);

    const correlation: ErrorPerformanceCorrelation = {
      errorId: error.id,
      performanceImpact: {
        responseTimeDelta: (afterAvg.responseTime || 0) - (beforeAvg.responseTime || 0),
        memoryUsageDelta: (afterAvg.memoryUsage || 0) - (beforeAvg.memoryUsage || 0),
        cpuUsageDelta: (afterAvg.cpuUsage || 0) - (beforeAvg.cpuUsage || 0),
        throughputDelta: beforeAvg.throughput ? (((beforeAvg.throughput - (afterAvg.throughput || 0)) / beforeAvg.throughput) * 100) : 0,
      },
      recoveryTime: this.calculateRecoveryTime(error, beforeAvg),
      cascadingEffects: this.analyzeCascadingEffects(error, errorTime, timeWindow),
    };

    this.correlations.push(correlation);

    // Alert if significant performance impact
    if (this.isSignificantPerformanceImpact(correlation)) {
      this.createPerformanceAlert(error, correlation);
    }
  }

  // Get performance data for specific route
  public getRoutePerformance(route: string, timeframe: 'hour' | 'day' | 'week' = 'hour'): {
    metrics: PerformanceMetric[];
    averages: Partial<PerformanceMetric>;
    trends: PerformanceTrend[];
    alerts: PerformanceAlert[];
  } {
    const cutoff = this.getTimeframeCutoff(timeframe);
    const routeMetrics = this.metrics.filter(m => 
      m.route === route && m.timestamp >= cutoff
    );

    return {
      metrics: routeMetrics,
      averages: this.calculateAverageMetrics(routeMetrics),
      trends: this.getPerformanceTrends(timeframe).filter(t => 
        // Filter trends for this route if route-specific data is available
        this.metrics.some(m => m.route === route && this.isInPeriod(m.timestamp, t.period, timeframe))
      ),
      alerts: this.alerts.filter(a => a.route === route),
    };
  }

  // Get system-wide performance overview
  public getSystemPerformanceOverview(): {
    currentMetrics: {
      avgResponseTime: number;
      avgMemoryUsage: number;
      avgCpuUsage: number;
      totalThroughput: number;
      errorRate: number;
      activeAlerts: number;
    };
    trends: PerformanceTrend[];
    recentAlerts: PerformanceAlert[];
    topBottlenecks: Array<{
      route: string;
      avgResponseTime: number;
      errorCount: number;
      performanceScore: number;
    }>;
  } {
    const lastHour = new Date(Date.now() - 60 * 60 * 1000);
    const recentMetrics = this.metrics.filter(m => m.timestamp >= lastHour);
    const recentErrors = errorAnalytics.getRealTimeDashboardData();

    const avgMetrics = this.calculateAverageMetrics(recentMetrics);
    const totalRequests = recentMetrics.reduce((sum, m) => sum + m.throughput, 0);
    const errorRate = totalRequests > 0 ? recentErrors.realTime.errorsLastHour / totalRequests : 0;

    return {
      currentMetrics: {
        avgResponseTime: avgMetrics.responseTime || 0,
        avgMemoryUsage: avgMetrics.memoryUsage || 0,
        avgCpuUsage: avgMetrics.cpuUsage || 0,
        totalThroughput: avgMetrics.throughput || 0,
        errorRate,
        activeAlerts: this.alerts.filter(a => 
          a.timestamp >= new Date(Date.now() - 60 * 60 * 1000)
        ).length,
      },
      trends: this.getPerformanceTrends('hour'),
      recentAlerts: this.alerts
        .filter(a => a.timestamp >= new Date(Date.now() - 24 * 60 * 60 * 1000))
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 10),
      topBottlenecks: this.identifyTopBottlenecks(),
    };
  }

  // Get error-performance correlations
  public getErrorPerformanceCorrelations(limit = 20): ErrorPerformanceCorrelation[] {
    return this.correlations
      .sort((a, b) => {
        // Sort by performance impact severity
        const aImpact = Math.abs(a.performanceImpact.responseTimeDelta) + 
                       Math.abs(a.performanceImpact.throughputDelta);
        const bImpact = Math.abs(b.performanceImpact.responseTimeDelta) + 
                       Math.abs(b.performanceImpact.throughputDelta);
        return bImpact - aImpact;
      })
      .slice(0, limit);
  }

  // Get performance trends
  public getPerformanceTrends(
    timeframe: 'hour' | 'day' | 'week',
    limit = 24
  ): PerformanceTrend[] {
    const trends: PerformanceTrend[] = [];
    const now = new Date();

    for (let i = 0; i < limit; i++) {
      const period = this.calculatePeriod(now, timeframe, i);
      const periodKey = `${timeframe}-${period}`;

      if (this.trends.has(periodKey)) {
        trends.push(this.trends.get(periodKey)!);
      } else {
        const trend = this.generateTrendForPeriod(timeframe, period);
        this.trends.set(periodKey, trend);
        trends.push(trend);
      }
    }

    return trends.reverse(); // Most recent first
  }

  // Performance alert management
  public getActiveAlerts(): PerformanceAlert[] {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return this.alerts.filter(a => a.timestamp >= oneHourAgo);
  }

  public acknowledgeAlert(alertId: string): void {
    const alertIndex = this.alerts.findIndex(a => a.id === alertId);
    if (alertIndex !== -1) {
      this.alerts.splice(alertIndex, 1);
    }
  }

  // Configure performance thresholds
  public updateThresholds(newThresholds: Partial<typeof PerformanceMonitor.prototype.thresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }

  public getThresholds(): typeof PerformanceMonitor.prototype.thresholds {
    return { ...this.thresholds };
  }

  // Private helper methods
  private startPerformanceCollection(): void {
    // Simulate performance metric collection
    // In a real implementation, this would integrate with APM tools like New Relic, DataDog, etc.
    setInterval(() => {
      const routes = ['/dashboard', '/api/auth', '/admin', '/client/projects'];
      
      routes.forEach(route => {
        this.recordPerformanceMetric({
          route,
          responseTime: Math.random() * 1000 + 100,
          memoryUsage: Math.random() * 100 + 20,
          cpuUsage: Math.random() * 80 + 10,
          networkLatency: Math.random() * 50 + 10,
          databaseQueryTime: Math.random() * 200 + 20,
          cacheHitRate: Math.random() * 100,
          throughput: Math.random() * 200 + 50,
          concurrentUsers: Math.floor(Math.random() * 100) + 10,
        });
      });
    }, 10000); // Collect every 10 seconds
  }

  private startAlertMonitoring(): void {
    setInterval(() => {
      this.checkSystemHealth();
    }, 30000); // Check every 30 seconds
  }

  private checkPerformanceThresholds(metric: PerformanceMetric): void {
    // Response time check
    if (metric.responseTime > this.thresholds.responseTime.critical) {
      this.createAlert({
        type: 'high_response_time',
        severity: 'critical',
        metric: 'responseTime',
        currentValue: metric.responseTime,
        thresholdValue: this.thresholds.responseTime.critical,
        route: metric.route,
        description: `Critical response time spike detected on ${metric.route}`,
        suggestedActions: [
          'Check server resources',
          'Review database queries',
          'Analyze recent deployments',
          'Consider scaling resources',
        ],
      });
    } else if (metric.responseTime > this.thresholds.responseTime.warning) {
      this.createAlert({
        type: 'high_response_time',
        severity: 'warning',
        metric: 'responseTime',
        currentValue: metric.responseTime,
        thresholdValue: this.thresholds.responseTime.warning,
        route: metric.route,
        description: `Response time warning on ${metric.route}`,
        suggestedActions: [
          'Monitor trend',
          'Check recent changes',
          'Review performance logs',
        ],
      });
    }

    // Memory usage check
    if (metric.memoryUsage > this.thresholds.memoryUsage.critical) {
      this.createAlert({
        type: 'memory_leak',
        severity: 'critical',
        metric: 'memoryUsage',
        currentValue: metric.memoryUsage,
        thresholdValue: this.thresholds.memoryUsage.critical,
        route: metric.route,
        description: `Critical memory usage detected`,
        suggestedActions: [
          'Investigate memory leaks',
          'Restart affected services',
          'Scale memory resources',
          'Review recent code changes',
        ],
      });
    }

    // CPU usage check
    if (metric.cpuUsage > this.thresholds.cpuUsage.critical) {
      this.createAlert({
        type: 'cpu_spike',
        severity: 'critical',
        metric: 'cpuUsage',
        currentValue: metric.cpuUsage,
        thresholdValue: this.thresholds.cpuUsage.critical,
        route: metric.route,
        description: `Critical CPU usage spike detected`,
        suggestedActions: [
          'Identify CPU-intensive processes',
          'Scale CPU resources',
          'Optimize code performance',
          'Consider load balancing',
        ],
      });
    }
  }

  private checkSystemHealth(): void {
    const recentMetrics = this.metrics.filter(m => 
      m.timestamp >= new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
    );

    if (recentMetrics.length === 0) return;

    const avgThroughput = recentMetrics.reduce((sum, m) => sum + m.throughput, 0) / recentMetrics.length;
    
    if (avgThroughput < this.thresholds.throughput.critical) {
      this.createAlert({
        type: 'low_throughput',
        severity: 'critical',
        metric: 'throughput',
        currentValue: avgThroughput,
        thresholdValue: this.thresholds.throughput.critical,
        description: `System throughput critically low`,
        suggestedActions: [
          'Check system resources',
          'Investigate bottlenecks',
          'Scale infrastructure',
          'Review error logs',
        ],
      });
    }
  }

  private createAlert(alertData: Omit<PerformanceAlert, 'id' | 'timestamp'>): void {
    const alert: PerformanceAlert = {
      id: `perf_alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...alertData,
    };

    this.alerts.push(alert);

    // Prevent alert spam - remove duplicate alerts from last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const duplicateAlert = this.alerts.find(a => 
      a !== alert &&
      a.timestamp >= fiveMinutesAgo &&
      a.type === alert.type &&
      a.route === alert.route
    );

    if (duplicateAlert) {
      const duplicateIndex = this.alerts.indexOf(duplicateAlert);
      this.alerts.splice(duplicateIndex, 1);
    }

    console.log(`Performance Alert: ${alert.severity.toUpperCase()} - ${alert.description}`);
  }

  private calculateAverageMetrics(metrics: PerformanceMetric[]): Partial<PerformanceMetric> {
    if (metrics.length === 0) return {};

    return {
      responseTime: metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length,
      memoryUsage: metrics.reduce((sum, m) => sum + m.memoryUsage, 0) / metrics.length,
      cpuUsage: metrics.reduce((sum, m) => sum + m.cpuUsage, 0) / metrics.length,
      networkLatency: metrics.reduce((sum, m) => sum + m.networkLatency, 0) / metrics.length,
      databaseQueryTime: metrics.reduce((sum, m) => sum + m.databaseQueryTime, 0) / metrics.length,
      cacheHitRate: metrics.reduce((sum, m) => sum + m.cacheHitRate, 0) / metrics.length,
      throughput: metrics.reduce((sum, m) => sum + m.throughput, 0) / metrics.length,
      concurrentUsers: metrics.reduce((sum, m) => sum + m.concurrentUsers, 0) / metrics.length,
    };
  }

  private calculateRecoveryTime(error: ErrorMetric, baselineMetrics: Partial<PerformanceMetric>): number {
    const errorTime = error.timestamp;
    const recoveryWindow = 30 * 60 * 1000; // 30 minutes max recovery time
    
    const metricsAfterError = this.metrics.filter(m => 
      m.timestamp >= errorTime &&
      m.timestamp <= new Date(errorTime.getTime() + recoveryWindow) &&
      m.route === error.route
    ).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    for (const metric of metricsAfterError) {
      const isRecovered = 
        (baselineMetrics.responseTime ? metric.responseTime <= baselineMetrics.responseTime * 1.1 : true) &&
        (baselineMetrics.cpuUsage ? metric.cpuUsage <= baselineMetrics.cpuUsage * 1.1 : true) &&
        (baselineMetrics.memoryUsage ? metric.memoryUsage <= baselineMetrics.memoryUsage * 1.1 : true);

      if (isRecovered) {
        return metric.timestamp.getTime() - errorTime.getTime();
      }
    }

    return recoveryWindow; // Max recovery time if not recovered
  }

  private analyzeCascadingEffects(error: ErrorMetric, errorTime: Date, timeWindow: number): ErrorPerformanceCorrelation['cascadingEffects'] {
    const affectedMetrics = this.metrics.filter(m => 
      m.timestamp >= errorTime &&
      m.timestamp <= new Date(errorTime.getTime() + timeWindow) &&
      m.route !== error.route // Other routes affected
    );

    const uniqueRoutes = [...new Set(affectedMetrics.map(m => m.route))];
    const impactDuration = affectedMetrics.length > 0 
      ? Math.max(...affectedMetrics.map(m => m.timestamp.getTime())) - errorTime.getTime()
      : 0;

    return {
      affectedRoutes: uniqueRoutes,
      totalImpactDuration: impactDuration,
      userSessionsAffected: affectedMetrics.reduce((sum, m) => sum + m.concurrentUsers, 0),
    };
  }

  private isSignificantPerformanceImpact(correlation: ErrorPerformanceCorrelation): boolean {
    const { performanceImpact } = correlation;
    
    return (
      performanceImpact.responseTimeDelta > 500 || // >500ms increase
      performanceImpact.memoryUsageDelta > 10 || // >10MB increase
      performanceImpact.cpuUsageDelta > 20 || // >20% increase
      performanceImpact.throughputDelta > 25 // >25% decrease
    );
  }

  private createPerformanceAlert(error: ErrorMetric, correlation: ErrorPerformanceCorrelation): void {
    this.createAlert({
      type: 'high_response_time', // Simplified - could be more specific
      severity: 'warning',
      metric: 'responseTime',
      currentValue: correlation.performanceImpact.responseTimeDelta,
      thresholdValue: 500,
      route: error.route,
      description: `Performance degradation detected following error: ${error.errorType}`,
      suggestedActions: [
        'Investigate error root cause',
        'Monitor performance recovery',
        'Consider error prevention measures',
        'Review system capacity',
      ],
    });
  }

  private updatePerformanceTrends(metric: PerformanceMetric): void {
    const timeframes: ('hour' | 'day' | 'week')[] = ['hour', 'day', 'week'];
    
    timeframes.forEach(timeframe => {
      const period = this.calculatePeriod(metric.timestamp, timeframe, 0);
      const periodKey = `${timeframe}-${period}`;
      
      let trend = this.trends.get(periodKey);
      if (!trend) {
        trend = this.initializeTrend(timeframe, period);
        this.trends.set(periodKey, trend);
      }
      
      // Update trend with new metric (simplified aggregation)
      const currentCount = this.getMetricCountForPeriod(timeframe, period);
      trend.averageResponseTime = this.updateAverage(trend.averageResponseTime, metric.responseTime, currentCount);
      trend.averageMemoryUsage = this.updateAverage(trend.averageMemoryUsage, metric.memoryUsage, currentCount);
      trend.averageCpuUsage = this.updateAverage(trend.averageCpuUsage, metric.cpuUsage, currentCount);
      trend.totalThroughput += metric.throughput;
    });
  }

  private generateTrendForPeriod(timeframe: 'hour' | 'day' | 'week', period: string): PerformanceTrend {
    const relevantMetrics = this.getMetricsForPeriod(timeframe, period);
    const avgMetrics = this.calculateAverageMetrics(relevantMetrics);
    
    return {
      timeframe,
      period,
      averageResponseTime: avgMetrics.responseTime || 0,
      p95ResponseTime: this.calculatePercentile(relevantMetrics, 'responseTime', 95),
      p99ResponseTime: this.calculatePercentile(relevantMetrics, 'responseTime', 99),
      averageMemoryUsage: avgMetrics.memoryUsage || 0,
      averageCpuUsage: avgMetrics.cpuUsage || 0,
      totalThroughput: relevantMetrics.reduce((sum, m) => sum + m.throughput, 0),
      errorRate: 0, // Would be calculated from error analytics
      availabilityPercentage: 99.9, // Simplified calculation
    };
  }

  private identifyTopBottlenecks(): Array<{
    route: string;
    avgResponseTime: number;
    errorCount: number;
    performanceScore: number;
  }> {
    const routeGroups = new Map<string, PerformanceMetric[]>();
    const lastHour = new Date(Date.now() - 60 * 60 * 1000);
    const recentMetrics = this.metrics.filter(m => m.timestamp >= lastHour);
    
    recentMetrics.forEach(metric => {
      if (!routeGroups.has(metric.route)) {
        routeGroups.set(metric.route, []);
      }
      routeGroups.get(metric.route)!.push(metric);
    });

    return Array.from(routeGroups.entries())
      .map(([route, metrics]) => {
        const avgResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length;
        const errorCount = 0; // Would get from error analytics
        const performanceScore = Math.max(0, 100 - (avgResponseTime / 10) - (errorCount * 5));
        
        return {
          route,
          avgResponseTime,
          errorCount,
          performanceScore,
        };
      })
      .sort((a, b) => a.performanceScore - b.performanceScore)
      .slice(0, 5);
  }

  // Additional helper methods...
  private getTimeframeCutoff(timeframe: 'hour' | 'day' | 'week'): Date {
    const now = new Date();
    switch (timeframe) {
      case 'hour':
        return new Date(now.getTime() - 60 * 60 * 1000);
      case 'day':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  }

  private calculatePeriod(date: Date, timeframe: string, offset: number): string {
    const targetDate = new Date(date);
    
    switch (timeframe) {
      case 'hour':
        targetDate.setHours(targetDate.getHours() - offset);
        return targetDate.toISOString().substr(0, 13);
      case 'day':
        targetDate.setDate(targetDate.getDate() - offset);
        return targetDate.toISOString().substr(0, 10);
      case 'week':
        targetDate.setDate(targetDate.getDate() - (offset * 7));
        return this.getWeekString(targetDate);
      default:
        return date.toISOString();
    }
  }

  private getWeekString(date: Date): string {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    return `${date.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
  }

  private isInPeriod(timestamp: Date, period: string, timeframe: string): boolean {
    const metricPeriod = this.calculatePeriod(timestamp, timeframe, 0);
    return metricPeriod === period;
  }

  private initializeTrend(timeframe: 'hour' | 'day' | 'week', period: string): PerformanceTrend {
    return {
      timeframe,
      period,
      averageResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      averageMemoryUsage: 0,
      averageCpuUsage: 0,
      totalThroughput: 0,
      errorRate: 0,
      availabilityPercentage: 100,
    };
  }

  private updateAverage(currentAvg: number, newValue: number, count: number): number {
    return ((currentAvg * (count - 1)) + newValue) / count;
  }

  private getMetricCountForPeriod(timeframe: string, period: string): number {
    return this.metrics.filter(m => 
      this.calculatePeriod(m.timestamp, timeframe, 0) === period
    ).length;
  }

  private getMetricsForPeriod(timeframe: string, period: string): PerformanceMetric[] {
    return this.metrics.filter(m => 
      this.calculatePeriod(m.timestamp, timeframe, 0) === period
    );
  }

  private calculatePercentile(metrics: PerformanceMetric[], field: keyof PerformanceMetric, percentile: number): number {
    if (metrics.length === 0) return 0;
    
    const values = metrics.map(m => Number(m[field])).sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * values.length) - 1;
    return values[Math.max(0, index)];
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();