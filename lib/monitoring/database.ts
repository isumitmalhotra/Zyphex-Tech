import { PrismaClient } from '@prisma/client';
import { Logger } from '@/lib/logger';
import { PerformanceMonitor } from '@/lib/monitoring/performance';

// Define event types
interface QueryEvent {
  timestamp: Date;
  query: string;
  params: string;
  duration: number;
  target: string;
}

interface LogEvent {
  timestamp: Date;
  message: string;
  target: string;
}

/**
 * Extended Prisma Client with performance monitoring and logging
 */
export class MonitoredPrismaClient extends PrismaClient {
  constructor() {
    super({
      log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'event' },
        { level: 'warn', emit: 'event' },
      ],
    });

    // Listen to query events
    this.$on('query' as never, (e: QueryEvent) => {
      const duration = Number(e.duration);
      const query = e.query;
      const params = e.params;

      // Log slow queries
      if (duration > 1000) {
        Logger.warn('Slow database query detected', {
          query,
          params,
          duration,
          target: e.target,
        });
      }

      // Log all queries in debug mode
      if (process.env.LOG_LEVEL === 'debug') {
        Logger.debug('Database query', {
          query,
          params,
          duration,
        });
      }

      // Track performance
      Logger.logPerformance('Database Query', duration, 1000, {
        query,
        target: e.target,
      });
    });

    // Listen to error events
    this.$on('error' as never, (e: LogEvent) => {
      Logger.error('Database error', {
        message: e.message,
        target: e.target,
      });
    });

    // Listen to warn events
    this.$on('warn' as never, (e: LogEvent) => {
      Logger.warn('Database warning', {
        message: e.message,
        target: e.target,
      });
    });
  }
}

/**
 * Database operation wrapper with performance tracking
 */
export class DatabaseMonitor {
  /**
   * Track a database operation
   */
  static async track<T>(
    operation: string,
    model: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    let success = true;
    let error: Error | null = null;

    try {
      // Execute the operation with performance monitoring
      const result = await PerformanceMonitor.trackDatabaseQuery(
        `${operation}: ${model}`,
        fn
      );

      return result;
    } catch (err) {
      success = false;
      error = err as Error;
      throw err;
    } finally {
      const duration = Date.now() - startTime;

      // Log the operation
      Logger.logDatabaseOperation(
        operation,
        model,
        duration,
        success,
        error ? { error: error.message } : undefined
      );
    }
  }

  /**
   * Track a batch operation
   */
  static async trackBatch<T>(
    operation: string,
    model: string,
    count: number,
    fn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    let success = true;

    try {
      const result = await fn();
      return result;
    } catch (err) {
      success = false;
      throw err;
    } finally {
      const duration = Date.now() - startTime;
      const avgDuration = duration / count;

      Logger.logDatabaseOperation(
        `${operation} (batch)`,
        model,
        duration,
        success,
        {
          count,
          avgDuration,
          operationsPerSecond: Math.round((count / duration) * 1000),
        }
      );
    }
  }

  /**
   * Track connection pool metrics
   */
  static async trackConnectionPool(db: PrismaClient) {
    try {
      // Query the database to get connection info
      const result = await db.$queryRaw<
        { current_connections: number; max_connections: number }[]
      >`
        SELECT 
          (SELECT count(*) FROM pg_stat_activity) as current_connections,
          (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections
      `;

      if (result && result.length > 0) {
        const { current_connections, max_connections } = result[0];
        const usagePercent = (current_connections / max_connections) * 100;

        Logger.logPerformance(
          'Database Connections',
          current_connections,
          max_connections * 0.8, // Warn at 80%
          {
            current_connections,
            max_connections,
            usagePercent: Math.round(usagePercent),
          }
        );

        // Alert if connections are high
        if (usagePercent > 80) {
          Logger.warn('High database connection usage', {
            current_connections,
            max_connections,
            usagePercent: Math.round(usagePercent),
          });
        }
      }
    } catch (error) {
      Logger.error('Failed to track connection pool', {
        error: (error as Error).message,
      });
    }
  }
}

/**
 * Query performance analyzer
 */
export class QueryAnalyzer {
  private static queryStats = new Map<string, {
    count: number;
    totalDuration: number;
    maxDuration: number;
    minDuration: number;
    failures: number;
  }>();

  /**
   * Record a query execution
   */
  static record(
    queryName: string,
    duration: number,
    success: boolean
  ) {
    const stats = this.queryStats.get(queryName) || {
      count: 0,
      totalDuration: 0,
      maxDuration: 0,
      minDuration: Infinity,
      failures: 0,
    };

    stats.count++;
    stats.totalDuration += duration;
    stats.maxDuration = Math.max(stats.maxDuration, duration);
    stats.minDuration = Math.min(stats.minDuration, duration);
    if (!success) {
      stats.failures++;
    }

    this.queryStats.set(queryName, stats);
  }

  /**
   * Get statistics for a query
   */
  static getStats(queryName: string) {
    const stats = this.queryStats.get(queryName);
    if (!stats) return null;

    return {
      count: stats.count,
      avgDuration: Math.round(stats.totalDuration / stats.count),
      maxDuration: stats.maxDuration,
      minDuration: stats.minDuration === Infinity ? 0 : stats.minDuration,
      failures: stats.failures,
      successRate: Math.round(((stats.count - stats.failures) / stats.count) * 100),
    };
  }

  /**
   * Get all query statistics
   */
  static getAllStats() {
    const allStats: Record<string, ReturnType<typeof QueryAnalyzer.getStats>> = {};
    
    for (const [queryName] of this.queryStats) {
      allStats[queryName] = this.getStats(queryName);
    }

    return allStats;
  }

  /**
   * Log statistics report
   */
  static logReport() {
    const stats = this.getAllStats();
    
    Logger.info('Query Performance Report', {
      totalQueries: Object.keys(stats).length,
      queries: stats,
    });

    // Identify slow queries
    const slowQueries = Object.entries(stats)
      .filter(([_, s]) => s && s.avgDuration > 1000)
      .sort((a, b) => (b[1]?.avgDuration || 0) - (a[1]?.avgDuration || 0));

    if (slowQueries.length > 0) {
      Logger.warn('Slow queries detected', {
        count: slowQueries.length,
        queries: slowQueries,
      });
    }
  }

  /**
   * Clear statistics
   */
  static clear() {
    this.queryStats.clear();
  }
}

// Log query report every hour in production
if (process.env.NODE_ENV === 'production' && typeof setInterval !== 'undefined') {
  setInterval(() => {
    QueryAnalyzer.logReport();
  }, 3600000); // 1 hour
}
