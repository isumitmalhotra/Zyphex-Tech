/**
 * System Resource Monitoring
 * Monitors CPU, memory, and disk usage for the application server
 */

import { Logger } from '@/lib/logger';
import type { HealthCheckResult, HealthStatus } from './types';
import os from 'os';

export class SystemResourceMonitor {
  private static readonly MEMORY_WARNING_THRESHOLD = 0.8; // 80%
  private static readonly MEMORY_CRITICAL_THRESHOLD = 0.9; // 90%
  private static readonly CPU_WARNING_THRESHOLD = 0.7; // 70%
  private static readonly CPU_CRITICAL_THRESHOLD = 0.9; // 90%

  /**
   * Check overall system health
   */
  static async checkHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      const metrics = await this.collectMetrics();
      const status = this.determineStatus(metrics);

      const result: HealthCheckResult = {
        status,
        message: this.getStatusMessage(status, metrics),
        timestamp: new Date(),
        responseTime: Date.now() - startTime,
        details: metrics,
      };

      Logger.logHealthCheck('system', status, Date.now() - startTime);

      return result;
    } catch (error) {
      Logger.logError(error as Error, 'System health check failed');

      return {
        status: 'unhealthy',
        message: `System health check failed: ${(error as Error).message}`,
        timestamp: new Date(),
        responseTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Collect system metrics
   */
  static async collectMetrics() {
    const memory = this.getMemoryMetrics();
    const cpu = await this.getCPUMetrics();
    const uptime = process.uptime();
    const nodeVersion = process.version;
    const platform = process.platform;
    const arch = process.arch;

    return {
      memory,
      cpu,
      uptime,
      nodeVersion,
      platform,
      arch,
      processId: process.pid,
    };
  }

  /**
   * Get memory metrics
   */
  static getMemoryMetrics() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsagePercent = (usedMemory / totalMemory) * 100;

    // Process-specific memory
    const processMemory = process.memoryUsage();

    return {
      total: this.formatBytes(totalMemory),
      used: this.formatBytes(usedMemory),
      free: this.formatBytes(freeMemory),
      usagePercent: Math.round(memoryUsagePercent * 100) / 100,
      process: {
        heapUsed: this.formatBytes(processMemory.heapUsed),
        heapTotal: this.formatBytes(processMemory.heapTotal),
        external: this.formatBytes(processMemory.external),
        rss: this.formatBytes(processMemory.rss),
      },
    };
  }

  /**
   * Get CPU metrics
   */
  static async getCPUMetrics() {
    const cpus = os.cpus();
    const loadAverage = os.loadavg();

    // Calculate average CPU usage
    const cpuUsage = cpus.reduce((acc, cpu) => {
      const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
      const idle = cpu.times.idle;
      const usage = 100 - (idle / total) * 100;
      return acc + usage;
    }, 0) / cpus.length;

    return {
      cores: cpus.length,
      model: cpus[0]?.model || 'Unknown',
      speed: cpus[0]?.speed || 0,
      usage: Math.round(cpuUsage * 100) / 100,
      loadAverage: {
        '1min': Math.round(loadAverage[0] * 100) / 100,
        '5min': Math.round(loadAverage[1] * 100) / 100,
        '15min': Math.round(loadAverage[2] * 100) / 100,
      },
    };
  }

  /**
   * Get disk metrics (Node.js doesn't have built-in disk monitoring)
   * This would require OS-specific commands or libraries
   */
  static async getDiskMetrics() {
    // This is a placeholder - would need to use child_process to run OS commands
    // or use a library like 'node-disk-info'
    return {
      available: false,
      message: 'Disk monitoring not implemented (requires OS-specific commands)',
    };
  }

  /**
   * Determine health status based on metrics
   */
  private static determineStatus(metrics: Awaited<ReturnType<typeof this.collectMetrics>>): HealthStatus {
    const { memory, cpu } = metrics;

    // Check memory usage
    const memoryPercent = memory.usagePercent / 100;
    if (memoryPercent >= this.MEMORY_CRITICAL_THRESHOLD) {
      return 'unhealthy';
    }

    // Check CPU load average (normalized by number of cores)
    const normalizedLoad = cpu.loadAverage['1min'] / cpu.cores;
    if (normalizedLoad >= this.CPU_CRITICAL_THRESHOLD) {
      return 'unhealthy';
    }

    // Check for degraded performance
    if (
      memoryPercent >= this.MEMORY_WARNING_THRESHOLD ||
      normalizedLoad >= this.CPU_WARNING_THRESHOLD
    ) {
      return 'degraded';
    }

    return 'healthy';
  }

  /**
   * Get human-readable status message
   */
  private static getStatusMessage(
    status: HealthStatus,
    metrics: Awaited<ReturnType<typeof this.collectMetrics>>
  ): string {
    const { memory, cpu } = metrics;

    if (status === 'unhealthy') {
      const issues: string[] = [];

      if (memory.usagePercent >= this.MEMORY_CRITICAL_THRESHOLD * 100) {
        issues.push(`Memory at ${memory.usagePercent}%`);
      }

      const normalizedLoad = cpu.loadAverage['1min'] / cpu.cores;
      if (normalizedLoad >= this.CPU_CRITICAL_THRESHOLD) {
        issues.push(`CPU load at ${Math.round(normalizedLoad * 100)}%`);
      }

      return `System resources critical: ${issues.join(', ')}`;
    }

    if (status === 'degraded') {
      const issues: string[] = [];

      if (memory.usagePercent >= this.MEMORY_WARNING_THRESHOLD * 100) {
        issues.push(`Memory at ${memory.usagePercent}%`);
      }

      const normalizedLoad = cpu.loadAverage['1min'] / cpu.cores;
      if (normalizedLoad >= this.CPU_WARNING_THRESHOLD) {
        issues.push(`CPU load elevated`);
      }

      return `System resources under pressure: ${issues.join(', ')}`;
    }

    return 'System resources are healthy';
  }

  /**
   * Format bytes to human-readable string
   */
  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
  }

  /**
   * Get process uptime in human-readable format
   */
  static getUptimeString(): string {
    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);

    return parts.join(' ');
  }

  /**
   * Log current system metrics
   */
  static async logMetrics(): Promise<void> {
    const metrics = await this.collectMetrics();
    
    Logger.info('System metrics', {
      memory: `${metrics.memory.usagePercent}%`,
      cpuUsage: `${metrics.cpu.usage}%`,
      loadAverage: metrics.cpu.loadAverage['1min'],
      uptime: this.getUptimeString(),
    });
  }
}
