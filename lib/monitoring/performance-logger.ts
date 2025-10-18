/**
 * Query Performance Logger
 * 
 * Advanced logging system for database query performance.
 * Provides structured logging, file output, and integration with monitoring tools.
 */

import fs from 'fs'
import path from 'path'
import { QueryExecution, QueryMetrics } from './query-monitor'

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

/**
 * Log entry structure
 */
export interface LogEntry {
  level: LogLevel
  timestamp: Date
  message: string
  context?: Record<string, unknown>
  query?: QueryExecution
  metrics?: QueryMetrics
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  /** Enable file logging */
  enableFileLogging: boolean
  /** Log file directory */
  logDir: string
  /** Log file name pattern (supports date formatting) */
  logFilePattern: string
  /** Maximum log file size in bytes */
  maxFileSize: number
  /** Maximum number of log files to keep */
  maxFiles: number
  /** Enable console logging */
  enableConsoleLogging: boolean
  /** Minimum log level for console */
  consoleLogLevel: LogLevel
  /** Minimum log level for file */
  fileLogLevel: LogLevel
  /** Enable JSON formatting */
  jsonFormat: boolean
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: LoggerConfig = {
  enableFileLogging: true,
  logDir: './logs/query-performance',
  logFilePattern: 'query-perf-{date}.log',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 7, // Keep 7 days of logs
  enableConsoleLogging: true,
  consoleLogLevel: LogLevel.WARN,
  fileLogLevel: LogLevel.INFO,
  jsonFormat: false,
}

/**
 * Query Performance Logger
 */
export class QueryPerformanceLogger {
  private static instance: QueryPerformanceLogger
  private config: LoggerConfig
  private currentLogFile: string | null = null
  private currentFileSize: number = 0

  private constructor(config?: Partial<LoggerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.ensureLogDirectory()
  }

  /**
   * Get singleton instance
   */
  public static getInstance(config?: Partial<LoggerConfig>): QueryPerformanceLogger {
    if (!QueryPerformanceLogger.instance) {
      QueryPerformanceLogger.instance = new QueryPerformanceLogger(config)
    }
    return QueryPerformanceLogger.instance
  }

  /**
   * Ensure log directory exists
   */
  private ensureLogDirectory(): void {
    if (this.config.enableFileLogging) {
      if (!fs.existsSync(this.config.logDir)) {
        fs.mkdirSync(this.config.logDir, { recursive: true })
      }
    }
  }

  /**
   * Get current log file path
   */
  private getLogFilePath(): string {
    const date = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const fileName = this.config.logFilePattern.replace('{date}', date)
    return path.join(this.config.logDir, fileName)
  }

  /**
   * Rotate log files if needed
   */
  private async rotateLogsIfNeeded(): Promise<void> {
    const logFilePath = this.getLogFilePath()

    // Check if we need to rotate based on file size
    if (this.currentLogFile === logFilePath && fs.existsSync(logFilePath)) {
      const stats = fs.statSync(logFilePath)
      this.currentFileSize = stats.size

      if (this.currentFileSize >= this.config.maxFileSize) {
        // Rotate by adding timestamp
        const timestamp = Date.now()
        const rotatedPath = logFilePath.replace('.log', `.${timestamp}.log`)
        fs.renameSync(logFilePath, rotatedPath)
        this.currentFileSize = 0
      }
    } else {
      this.currentLogFile = logFilePath
      this.currentFileSize = fs.existsSync(logFilePath)
        ? fs.statSync(logFilePath).size
        : 0
    }

    // Clean up old log files
    this.cleanupOldLogs()
  }

  /**
   * Clean up old log files
   */
  private cleanupOldLogs(): void {
    try {
      const files = fs.readdirSync(this.config.logDir)
      const logFiles = files
        .filter((f) => f.endsWith('.log'))
        .map((f) => ({
          name: f,
          path: path.join(this.config.logDir, f),
          mtime: fs.statSync(path.join(this.config.logDir, f)).mtime.getTime(),
        }))
        .sort((a, b) => b.mtime - a.mtime)

      // Keep only maxFiles most recent logs
      if (logFiles.length > this.config.maxFiles) {
        const filesToDelete = logFiles.slice(this.config.maxFiles)
        for (const file of filesToDelete) {
          fs.unlinkSync(file.path)
        }
      }
    } catch (error) {
      console.error('[Query Logger] Error cleaning up old logs:', error)
    }
  }

  /**
   * Format log entry
   */
  private formatLogEntry(entry: LogEntry): string {
    if (this.config.jsonFormat) {
      return JSON.stringify({
        level: entry.level,
        timestamp: entry.timestamp.toISOString(),
        message: entry.message,
        ...entry.context,
        query: entry.query,
        metrics: entry.metrics,
      })
    }

    const timestamp = entry.timestamp.toISOString()
    const level = entry.level.toUpperCase().padEnd(5)
    let formatted = `[${timestamp}] [${level}] ${entry.message}`

    if (entry.context) {
      formatted += `\n  Context: ${JSON.stringify(entry.context, null, 2)}`
    }

    if (entry.query) {
      formatted += `\n  Query: ${entry.query.model}.${entry.query.action}`
      formatted += `\n  Duration: ${entry.query.duration}ms`
      formatted += `\n  Params: ${entry.query.params}`
      if (entry.query.error) {
        formatted += `\n  Error: ${entry.query.error}`
      }
    }

    return formatted
  }

  /**
   * Check if log level should be logged
   */
  private shouldLog(level: LogLevel, target: 'console' | 'file'): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR]
    const minLevel = target === 'console' 
      ? this.config.consoleLogLevel 
      : this.config.fileLogLevel
    
    const currentIndex = levels.indexOf(level)
    const minIndex = levels.indexOf(minLevel)
    
    return currentIndex >= minIndex
  }

  /**
   * Write log entry
   */
  private async writeLog(entry: LogEntry): Promise<void> {
    // Console logging
    if (this.config.enableConsoleLogging && this.shouldLog(entry.level, 'console')) {
      const formatted = this.formatLogEntry(entry)
      
      switch (entry.level) {
        case LogLevel.ERROR:
          console.error(formatted)
          break
        case LogLevel.WARN:
          console.warn(formatted)
          break
        case LogLevel.INFO:
          console.info(formatted)
          break
        case LogLevel.DEBUG:
          console.debug(formatted)
          break
      }
    }

    // File logging
    if (this.config.enableFileLogging && this.shouldLog(entry.level, 'file')) {
      await this.rotateLogsIfNeeded()
      const formatted = this.formatLogEntry(entry) + '\n'
      const logFilePath = this.getLogFilePath()
      
      try {
        fs.appendFileSync(logFilePath, formatted)
        this.currentFileSize += Buffer.byteLength(formatted)
      } catch (error) {
        console.error('[Query Logger] Error writing to log file:', error)
      }
    }
  }

  /**
   * Log slow query
   */
  public async logSlowQuery(query: QueryExecution, threshold: number): Promise<void> {
    const entry: LogEntry = {
      level: query.duration >= threshold * 10 ? LogLevel.ERROR : LogLevel.WARN,
      timestamp: query.timestamp,
      message: `Slow query detected: ${query.model}.${query.action} took ${query.duration}ms (threshold: ${threshold}ms)`,
      query,
      context: {
        threshold,
        exceedsBy: query.duration - threshold,
        cached: query.cached,
      },
    }

    await this.writeLog(entry)
  }

  /**
   * Log query error
   */
  public async logQueryError(query: QueryExecution): Promise<void> {
    const entry: LogEntry = {
      level: LogLevel.ERROR,
      timestamp: query.timestamp,
      message: `Query failed: ${query.model}.${query.action}`,
      query,
      context: {
        error: query.error,
      },
    }

    await this.writeLog(entry)
  }

  /**
   * Log performance metrics
   */
  public async logMetrics(metrics: QueryMetrics): Promise<void> {
    const entry: LogEntry = {
      level: LogLevel.INFO,
      timestamp: new Date(),
      message: 'Query performance metrics snapshot',
      metrics,
      context: {
        summary: {
          totalQueries: metrics.totalQueries,
          slowQueries: metrics.slowQueries,
          avgDuration: `${metrics.averageDuration.toFixed(2)}ms`,
          p95Duration: `${metrics.p95Duration.toFixed(2)}ms`,
          cacheHitRate: `${metrics.cacheHitRate.toFixed(1)}%`,
        },
      },
    }

    await this.writeLog(entry)
  }

  /**
   * Log N+1 query detection
   */
  public async logN1Detection(
    pattern: string,
    count: number,
    duration: number
  ): Promise<void> {
    const entry: LogEntry = {
      level: LogLevel.WARN,
      timestamp: new Date(),
      message: `Potential N+1 query detected: ${pattern}`,
      context: {
        pattern,
        occurrences: count,
        totalDuration: `${duration}ms`,
        avgDuration: `${(duration / count).toFixed(2)}ms`,
        recommendation: 'Consider using Prisma include/select to fetch related data in a single query',
      },
    }

    await this.writeLog(entry)
  }

  /**
   * Log general message
   */
  public async log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>
  ): Promise<void> {
    const entry: LogEntry = {
      level,
      timestamp: new Date(),
      message,
      context,
    }

    await this.writeLog(entry)
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config }
    this.ensureLogDirectory()
  }

  /**
   * Get configuration
   */
  public getConfig(): LoggerConfig {
    return { ...this.config }
  }
}

// Export singleton instance
export const performanceLogger = QueryPerformanceLogger.getInstance()
