// Error Analytics Data Layer
// Handles error metrics collection, aggregation, and trend analysis

export interface ErrorMetric {
  id: string;
  timestamp: Date;
  errorType: string;
  route: string;
  userId?: string;
  userRole: 'admin' | 'user' | 'client' | 'guest';
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
  resolutionTime?: number; // milliseconds
  impactedUsers: number;
  sessionId: string;
  userAgent: string;
  performanceImpact: {
    loadTime: number;
    memoryUsage: number;
    cpuUsage: number;
  };
  errorContext: {
    url: string;
    referrer?: string;
    userActions: string[];
    stackTrace?: string;
  };
}

export interface ErrorTrend {
  timeframe: 'hour' | 'day' | 'week' | 'month';
  period: string; // ISO date string
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsByRoute: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  avgResolutionTime: number;
  totalImpactedUsers: number;
  performanceCorrelation: {
    avgLoadTime: number;
    avgMemoryUsage: number;
    avgCpuUsage: number;
  };
}

export interface PerformanceCorrelation {
  errorCount: number;
  avgResponseTime: number;
  throughputImpact: number; // percentage decrease
  userExperienceScore: number; // 1-10 scale
  systemHealthScore: number; // 1-10 scale
}

export interface ClientNotificationPreference {
  clientId: string;
  email: string;
  notificationTypes: {
    errorOccurred: boolean;
    errorResolved: boolean;
    maintenanceScheduled: boolean;
    performanceImpact: boolean;
  };
  severityThreshold: 'low' | 'medium' | 'high' | 'critical';
  deliveryMethods: ('email' | 'sms' | 'inApp' | 'webhook')[];
  quietHours?: {
    start: string; // HH:mm format
    end: string;
    timezone: string;
  };
}

export class ErrorAnalytics {
  private static instance: ErrorAnalytics;
  private metrics: ErrorMetric[] = [];
  private trends: Map<string, ErrorTrend> = new Map();
  private subscribers: ((metric: ErrorMetric) => void)[] = [];

  public static getInstance(): ErrorAnalytics {
    if (!ErrorAnalytics.instance) {
      ErrorAnalytics.instance = new ErrorAnalytics();
    }
    return ErrorAnalytics.instance;
  }

  // Record new error occurrence
  public recordError(error: Omit<ErrorMetric, 'id' | 'timestamp'>): ErrorMetric {
    const metric: ErrorMetric = {
      id: this.generateId(),
      timestamp: new Date(),
      ...error,
    };

    this.metrics.push(metric);
    this.updateTrends(metric);
    this.notifySubscribers(metric);
    
    // Send to external monitoring (Sentry, etc.)
    this.sendToExternalMonitoring(metric);
    
    return metric;
  }

  // Get error trends for specified timeframe
  public getTrends(
    timeframe: 'hour' | 'day' | 'week' | 'month',
    limit: number = 24
  ): ErrorTrend[] {
    const now = new Date();
    const trends: ErrorTrend[] = [];
    
    for (let i = 0; i < limit; i++) {
      const period = this.calculatePeriod(now, timeframe, i);
      const periodKey = `${timeframe}-${period}`;
      
      if (this.trends.has(periodKey)) {
        trends.push(this.trends.get(periodKey)!);
      } else {
        // Generate trend for period if not cached
        const trend = this.generateTrendForPeriod(timeframe, period);
        this.trends.set(periodKey, trend);
        trends.push(trend);
      }
    }
    
    return trends.reverse(); // Most recent first
  }

  // Get real-time dashboard data
  public getRealTimeDashboardData() {
    const now = new Date();
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const recentMetrics = this.metrics.filter(m => m.timestamp >= lastHour);
    const dailyMetrics = this.metrics.filter(m => m.timestamp >= last24Hours);
    
    return {
      realTime: {
        activeErrors: recentMetrics.filter(m => !m.resolved).length,
        errorsLastHour: recentMetrics.length,
        avgResolutionTime: this.calculateAvgResolutionTime(recentMetrics),
        criticalErrors: recentMetrics.filter(m => m.severity === 'critical').length,
      },
      trends: {
        hourly: this.getTrends('hour', 24),
        daily: this.getTrends('day', 7),
      },
      topIssues: this.getTopIssues(dailyMetrics),
      performanceImpact: this.calculatePerformanceImpact(dailyMetrics),
      userImpact: this.calculateUserImpact(dailyMetrics),
    };
  }

  // Get performance correlation data
  public getPerformanceCorrelation(timeframe: 'hour' | 'day' | 'week'): PerformanceCorrelation {
    const cutoff = this.getTimeframeCutoff(timeframe);
    const relevantMetrics = this.metrics.filter(m => m.timestamp >= cutoff);
    
    const totalErrors = relevantMetrics.length;
    const avgResponseTime = relevantMetrics.reduce((sum, m) => 
      sum + m.performanceImpact.loadTime, 0) / totalErrors || 0;
    
    // Calculate throughput impact (simplified)
    const baselineResponseTime = 200; // ms
    const throughputImpact = Math.max(0, 
      ((avgResponseTime - baselineResponseTime) / baselineResponseTime) * 100);
    
    return {
      errorCount: totalErrors,
      avgResponseTime,
      throughputImpact,
      userExperienceScore: this.calculateUXScore(relevantMetrics),
      systemHealthScore: this.calculateSystemHealthScore(relevantMetrics),
    };
  }

  // Subscribe to real-time error events
  public subscribe(callback: (metric: ErrorMetric) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  // Mark error as resolved
  public resolveError(errorId: string, resolutionTime: number): void {
    const metric = this.metrics.find(m => m.id === errorId);
    if (metric) {
      metric.resolved = true;
      metric.resolutionTime = resolutionTime;
      this.notifySubscribers(metric);
    }
  }

  // Private helper methods
  private generateId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private updateTrends(metric: ErrorMetric): void {
    const timeframes: ('hour' | 'day' | 'week' | 'month')[] = ['hour', 'day', 'week', 'month'];
    
    timeframes.forEach(timeframe => {
      const period = this.calculatePeriod(metric.timestamp, timeframe, 0);
      const periodKey = `${timeframe}-${period}`;
      
      let trend = this.trends.get(periodKey);
      if (!trend) {
        trend = this.initializeTrend(timeframe, period);
        this.trends.set(periodKey, trend);
      }
      
      // Update trend with new metric
      trend.totalErrors++;
      trend.errorsByType[metric.errorType] = (trend.errorsByType[metric.errorType] || 0) + 1;
      trend.errorsByRoute[metric.route] = (trend.errorsByRoute[metric.route] || 0) + 1;
      trend.errorsBySeverity[metric.severity] = (trend.errorsBySeverity[metric.severity] || 0) + 1;
      trend.totalImpactedUsers += metric.impactedUsers;
      
      // Update performance correlation
      trend.performanceCorrelation.avgLoadTime = this.updateAverage(
        trend.performanceCorrelation.avgLoadTime,
        metric.performanceImpact.loadTime,
        trend.totalErrors
      );
    });
  }

  private calculatePeriod(date: Date, timeframe: string, offset: number): string {
    const targetDate = new Date(date);
    
    switch (timeframe) {
      case 'hour':
        targetDate.setHours(targetDate.getHours() - offset);
        return targetDate.toISOString().substr(0, 13); // YYYY-MM-DDTHH
      case 'day':
        targetDate.setDate(targetDate.getDate() - offset);
        return targetDate.toISOString().substr(0, 10); // YYYY-MM-DD
      case 'week':
        targetDate.setDate(targetDate.getDate() - (offset * 7));
        return this.getWeekString(targetDate);
      case 'month':
        targetDate.setMonth(targetDate.getMonth() - offset);
        return targetDate.toISOString().substr(0, 7); // YYYY-MM
      default:
        return date.toISOString();
    }
  }

  private generateTrendForPeriod(timeframe: string, period: string): ErrorTrend {
    const relevantMetrics = this.getMetricsForPeriod(timeframe, period);
    
    return {
      timeframe: timeframe as 'hour' | 'day' | 'week' | 'month',
      period,
      totalErrors: relevantMetrics.length,
      errorsByType: this.groupBy(relevantMetrics, 'errorType'),
      errorsByRoute: this.groupBy(relevantMetrics, 'route'),
      errorsBySeverity: this.groupBy(relevantMetrics, 'severity'),
      avgResolutionTime: this.calculateAvgResolutionTime(relevantMetrics),
      totalImpactedUsers: relevantMetrics.reduce((sum, m) => sum + m.impactedUsers, 0),
      performanceCorrelation: {
        avgLoadTime: relevantMetrics.reduce((sum, m) => sum + m.performanceImpact.loadTime, 0) / relevantMetrics.length || 0,
        avgMemoryUsage: relevantMetrics.reduce((sum, m) => sum + m.performanceImpact.memoryUsage, 0) / relevantMetrics.length || 0,
        avgCpuUsage: relevantMetrics.reduce((sum, m) => sum + m.performanceImpact.cpuUsage, 0) / relevantMetrics.length || 0,
      },
    };
  }

  private notifySubscribers(metric: ErrorMetric): void {
    this.subscribers.forEach(callback => {
      try {
        callback(metric);
      } catch (error) {
        console.error('Error notifying subscriber:', error);
      }
    });
  }

  private sendToExternalMonitoring(metric: ErrorMetric): void {
    // Integration with Sentry, DataDog, etc.
    try {
      if (typeof window !== 'undefined') {
        const windowWithSentry = window as { Sentry?: { addBreadcrumb: (data: unknown) => void } };
        if (windowWithSentry.Sentry) {
          windowWithSentry.Sentry.addBreadcrumb({
            message: 'Error Analytics Recorded',
            category: 'error.analytics',
            data: {
              errorType: metric.errorType,
              route: metric.route,
              severity: metric.severity,
              impactedUsers: metric.impactedUsers,
            },
          });
        }
      }
    } catch (error) {
      console.warn('Failed to send to external monitoring:', error);
    }
  }

  private getTopIssues(metrics: ErrorMetric[]) {
    const issueGroups = new Map<string, ErrorMetric[]>();
    
    metrics.forEach(metric => {
      const key = `${metric.errorType}-${metric.route}`;
      if (!issueGroups.has(key)) {
        issueGroups.set(key, []);
      }
      issueGroups.get(key)!.push(metric);
    });
    
    return Array.from(issueGroups.entries())
      .map(([key, group]) => ({
        id: key,
        errorType: group[0].errorType,
        route: group[0].route,
        count: group.length,
        severity: this.getHighestSeverity(group),
        totalImpactedUsers: group.reduce((sum, m) => sum + m.impactedUsers, 0),
        avgResolutionTime: this.calculateAvgResolutionTime(group),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private calculatePerformanceImpact(_metrics: ErrorMetric[]): PerformanceCorrelation {
    return this.getPerformanceCorrelation('day');
  }

  private calculateUserImpact(metrics: ErrorMetric[]) {
    const uniqueUsers = new Set(metrics.map(m => m.userId).filter(Boolean));
    const totalSessions = new Set(metrics.map(m => m.sessionId));
    
    return {
      uniqueUsersAffected: uniqueUsers.size,
      totalSessionsAffected: totalSessions.size,
      averageErrorsPerUser: metrics.length / Math.max(1, uniqueUsers.size),
      criticalErrorsAffectingUsers: metrics.filter(m => 
        m.severity === 'critical' && m.impactedUsers > 0
      ).length,
    };
  }

  // Additional helper methods...
  private calculateAvgResolutionTime(metrics: ErrorMetric[]): number {
    const resolvedMetrics = metrics.filter(m => m.resolved && m.resolutionTime);
    return resolvedMetrics.length > 0 
      ? resolvedMetrics.reduce((sum, m) => sum + (m.resolutionTime || 0), 0) / resolvedMetrics.length
      : 0;
  }

  private calculateUXScore(metrics: ErrorMetric[]): number {
    // Simplified UX score calculation (1-10 scale)
    const criticalCount = metrics.filter(m => m.severity === 'critical').length;
    const highCount = metrics.filter(m => m.severity === 'high').length;
    const totalUsers = new Set(metrics.map(m => m.userId)).size;
    
    const impactScore = (criticalCount * 3 + highCount * 2) / Math.max(1, totalUsers);
    return Math.max(1, 10 - impactScore);
  }

  private calculateSystemHealthScore(metrics: ErrorMetric[]): number {
    // Simplified system health score (1-10 scale)
    const errorRate = metrics.length;
    const performanceImpact = metrics.reduce((sum, m) => 
      sum + m.performanceImpact.loadTime, 0) / Math.max(1, metrics.length);
    
    const healthScore = 10 - Math.min(9, (errorRate * 0.1) + (performanceImpact / 1000));
    return Math.max(1, healthScore);
  }

  private getTimeframeCutoff(timeframe: 'hour' | 'day' | 'week'): Date {
    const now = new Date();
    switch (timeframe) {
      case 'hour':
        return new Date(now.getTime() - 60 * 60 * 1000);
      case 'day':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
  }

  private initializeTrend(timeframe: string, period: string): ErrorTrend {
    return {
      timeframe: timeframe as 'hour' | 'day' | 'week' | 'month',
      period,
      totalErrors: 0,
      errorsByType: {},
      errorsByRoute: {},
      errorsBySeverity: {},
      avgResolutionTime: 0,
      totalImpactedUsers: 0,
      performanceCorrelation: {
        avgLoadTime: 0,
        avgMemoryUsage: 0,
        avgCpuUsage: 0,
      },
    };
  }

  private updateAverage(currentAvg: number, newValue: number, count: number): number {
    return ((currentAvg * (count - 1)) + newValue) / count;
  }

  private groupBy(items: ErrorMetric[], key: keyof ErrorMetric): Record<string, number> {
    return items.reduce((groups, item) => {
      const value = String(item[key]);
      groups[value] = (groups[value] || 0) + 1;
      return groups;
    }, {} as Record<string, number>);
  }

  private getWeekString(date: Date): string {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    return `${date.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
  }

  private getMetricsForPeriod(timeframe: string, period: string): ErrorMetric[] {
    return this.metrics.filter(metric => {
      const metricPeriod = this.calculatePeriod(metric.timestamp, timeframe, 0);
      return metricPeriod === period;
    });
  }

  private getHighestSeverity(metrics: ErrorMetric[]): string {
    const severityOrder = ['critical', 'high', 'medium', 'low'];
    for (const severity of severityOrder) {
      if (metrics.some(m => m.severity === severity)) {
        return severity;
      }
    }
    return 'low';
  }
}

// Export singleton instance
export const errorAnalytics = ErrorAnalytics.getInstance();