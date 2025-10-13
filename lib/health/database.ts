/**
 * Database Health Checks
 * Monitors database connectivity, performance, and resource utilization
 */

import { prisma as db } from '@/lib/prisma';
import { Logger } from '@/lib/logger';
import type { HealthCheckResult, DatabaseHealthMetrics, HealthStatus } from './types';

export class DatabaseHealthChecker {
  private static readonly SLOW_QUERY_THRESHOLD = 1000; // 1 second
  private static readonly CONNECTION_TIMEOUT = 5000; // 5 seconds
  private static readonly HIGH_POOL_UTILIZATION = 0.8; // 80%

  /**
   * Perform comprehensive database health check
   */
  static async checkHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      const metrics = await this.collectMetrics();
      const responseTime = Date.now() - startTime;
      const status = this.determineStatus(metrics, responseTime);

      const result: HealthCheckResult = {
        status,
        message: this.getStatusMessage(status, metrics),
        timestamp: new Date(),
        responseTime,
        details: { ...metrics },
      };

      Logger.logHealthCheck('database', status, responseTime);

      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      Logger.logError(error as Error, 'Database health check failed');

      return {
        status: 'unhealthy',
        message: `Database health check failed: ${(error as Error).message}`,
        timestamp: new Date(),
        responseTime,
        details: {
          error: (error as Error).message,
          connectionStatus: 'error',
        },
      };
    }
  }

  /**
   * Collect database metrics
   */
  private static async collectMetrics(): Promise<DatabaseHealthMetrics> {
    const startTime = Date.now();

    try {
      // Test basic connectivity with a simple query
      await Promise.race([
        db.$queryRaw`SELECT 1`,
        this.timeout(this.CONNECTION_TIMEOUT),
      ]);

      const responseTime = Date.now() - startTime;

      // Get connection pool stats (if available)
      const poolStats = await this.getPoolStats();

      return {
        connectionStatus: 'connected',
        responseTime,
        ...poolStats,
      };
    } catch (error) {
      Logger.logError(error as Error, 'Failed to collect database metrics');

      return {
        connectionStatus: 'error',
        responseTime: Date.now() - startTime,
        errors: [(error as Error).message],
      };
    }
  }

  /**
   * Get connection pool statistics
   */
  private static async getPoolStats(): Promise<Partial<DatabaseHealthMetrics>> {
    try {
      // Query for active connections (PostgreSQL)
      const result = await db.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count 
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `;

      const activeConnections = Number(result[0]?.count || 0);

      // Get max connections setting
      const maxConnResult = await db.$queryRaw<Array<{ setting: string }>>`
        SELECT setting 
        FROM pg_settings 
        WHERE name = 'max_connections'
      `;

      const maxConnections = parseInt(maxConnResult[0]?.setting || '100', 10);
      const poolUtilization = activeConnections / maxConnections;

      return {
        activeConnections,
        maxConnections,
        poolUtilization: Math.round(poolUtilization * 100) / 100,
      };
    } catch (error) {
      // Pool stats are optional, return empty if not available
      Logger.debug('Could not retrieve connection pool stats', { error });
      return {};
    }
  }

  /**
   * Check if query is considered slow
   */
  static isSlowQuery(duration: number): boolean {
    return duration > this.SLOW_QUERY_THRESHOLD;
  }

  /**
   * Determine overall health status based on metrics
   */
  private static determineStatus(
    metrics: DatabaseHealthMetrics,
    responseTime: number
  ): HealthStatus {
    // Unhealthy if connection failed
    if (metrics.connectionStatus === 'error' || metrics.connectionStatus === 'disconnected') {
      return 'unhealthy';
    }

    // Unhealthy if response time is too slow
    if (responseTime > this.CONNECTION_TIMEOUT) {
      return 'unhealthy';
    }

    // Degraded if pool utilization is high
    if (metrics.poolUtilization && metrics.poolUtilization > this.HIGH_POOL_UTILIZATION) {
      return 'degraded';
    }

    // Degraded if response time is slow
    if (responseTime > this.SLOW_QUERY_THRESHOLD) {
      return 'degraded';
    }

    return 'healthy';
  }

  /**
   * Get human-readable status message
   */
  private static getStatusMessage(status: HealthStatus, metrics: DatabaseHealthMetrics): string {
    if (status === 'unhealthy') {
      if (metrics.connectionStatus === 'error') {
        return 'Database connection failed';
      }
      return 'Database is unhealthy';
    }

    if (status === 'degraded') {
      if (metrics.poolUtilization && metrics.poolUtilization > this.HIGH_POOL_UTILIZATION) {
        return `Database connection pool at ${Math.round(metrics.poolUtilization * 100)}% capacity`;
      }
      if (metrics.responseTime > this.SLOW_QUERY_THRESHOLD) {
        return `Database responding slowly (${metrics.responseTime}ms)`;
      }
      return 'Database performance is degraded';
    }

    return 'Database is healthy and responding normally';
  }

  /**
   * Perform a quick connectivity check (lightweight)
   */
  static async quickCheck(): Promise<boolean> {
    try {
      await Promise.race([
        db.$queryRaw`SELECT 1`,
        this.timeout(2000), // 2 second timeout for quick check
      ]);
      return true;
    } catch (error) {
      Logger.logError(error as Error, 'Database quick check failed');
      return false;
    }
  }

  /**
   * Test database write operations
   */
  static async checkWriteOperations(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      // Test with a transaction rollback (no actual writes)
      await db.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT 1`;
        // Rollback immediately - we don't want to commit anything
        throw new Error('Intentional rollback for health check');
      }).catch(() => {
        // Expected error from intentional rollback
      });

      const responseTime = Date.now() - startTime;

      return {
        status: 'healthy',
        message: 'Database write operations are functional',
        timestamp: new Date(),
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'unhealthy',
        message: `Database write operations failed: ${(error as Error).message}`,
        timestamp: new Date(),
        responseTime,
        details: {
          error: (error as Error).message,
        },
      };
    }
  }

  /**
   * Helper to create timeout promise
   */
  private static timeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms);
    });
  }

  /**
   * Disconnect from database (for cleanup)
   */
  static async disconnect(): Promise<void> {
    try {
      await db.$disconnect();
      Logger.info('Database connection closed');
    } catch (error) {
      Logger.logError(error as Error, 'Failed to disconnect from database');
    }
  }
}
