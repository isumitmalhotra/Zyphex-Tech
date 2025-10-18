/**
 * Slow Query Logger
 * 
 * Persistent logging system for slow queries with file and database storage.
 * Provides query history, trend analysis, and alerting capabilities.
 */

import fs from 'fs/promises'
import path from 'path'
import { SlowQueryLog, QueryMetrics } from './query-monitor'

/**
 * Log destination configuration
 */
export interface LoggerConfig {
  // File logging
  enableFileLogging: boolean
  logDirectory: string
  maxLogFiles: number
  maxLogSizeBytes: number
  
  // Console logging
  enableConsoleLogging: boolean
  consoleLogLevel: 'warning' | 'critical' | 'all'
  
  // Database logging (future enhancement)
  enableDatabaseLogging: boolean
  
  // Rotation
  rotateDaily: boolean
}

/**
 * Default logger configuration
 */
const DEFAULT_CONFIG: LoggerConfig = {
  enableFileLogging: true,
  logDirectory: path.join(process.cwd(), 'logs', 'slow-queries'),
  maxLogFiles: 30, // Keep 30 days of logs
  maxLogSizeBytes: 10 * 1024 * 1024, // 10MB per file
  
  enableConsoleLogging: true,
  consoleLogLevel: 'critical',
  
  enableDatabaseLogging: false,
  
  rotateDaily: true,
}

/**
 * Slow Query Logger class
 */
export class SlowQueryLogger {
  private config: LoggerConfig
  private currentLogFile: string | null = null
  private writeQueue: SlowQueryLog[] = []
  private isWriting = false
  
  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.initializeLogDirectory()
  }
  
  /**
   * Initialize log directory
   */
  private async initializeLogDirectory(): Promise<void> {
    if (!this.config.enableFileLogging) return
    
    try {
      await fs.mkdir(this.config.logDirectory, { recursive: true })
    } catch (error) {
      console.error('[Slow Query Logger] Failed to create log directory:', error)
    }
  }
  
  /**
   * Log a slow query
   */
  async log(query: SlowQueryLog): Promise<void> {
    // Console logging
    if (this.config.enableConsoleLogging) {
      this.logToConsole(query)
    }
    
    // File logging
    if (this.config.enableFileLogging) {
      this.writeQueue.push(query)
      await this.processWriteQueue()
    }
    
    // Database logging (future enhancement)
    if (this.config.enableDatabaseLogging) {
      await this.logToDatabase(query)
    }
  }
  
  /**
   * Log to console
   */
  private logToConsole(query: SlowQueryLog): void {
    const shouldLog =
      this.config.consoleLogLevel === 'all' ||
      (this.config.consoleLogLevel === 'critical' && query.severity === 'critical') ||
      (this.config.consoleLogLevel === 'warning' && query.severity !== 'normal')
    
    if (!shouldLog) return
    
    const emoji = query.severity === 'critical' ? '🔴' : '⚠️'
    const message = [
      `${emoji} [SLOW QUERY] ${query.model}.${query.action}`,
      `Time: ${query.executionTime}ms`,
      `Severity: ${query.severity.toUpperCase()}`,
      `Timestamp: ${query.timestamp.toISOString()}`,
    ].join(' | ')
    
    if (query.severity === 'critical') {
      console.error(message)
    } else {
      console.warn(message)
    }
    
    // Log additional details if available
    if (query.sql) {
      console.log('  SQL:', query.sql)
    }
    if (query.params) {
      console.log('  Params:', JSON.stringify(query.params, null, 2))
    }
  }
  
  /**
   * Process write queue (batch writes for efficiency)
   */
  private async processWriteQueue(): Promise<void> {
    if (this.isWriting || this.writeQueue.length === 0) return
    
    this.isWriting = true
    
    try {
      const logFile = this.getLogFilePath()
      const entries = [...this.writeQueue]
      this.writeQueue = []
      
      // Format log entries as NDJSON (newline-delimited JSON)
      const logData = entries.map(entry => JSON.stringify(entry)).join('\n') + '\n'
      
      // Append to log file
      await fs.appendFile(logFile, logData, 'utf-8')
      
      // Check file size and rotate if needed
      await this.rotateLogsIfNeeded(logFile)
    } catch (error) {
      console.error('[Slow Query Logger] Failed to write logs:', error)
      // Put entries back in queue on failure
      this.writeQueue.unshift(...this.writeQueue)
    } finally {
      this.isWriting = false
    }
  }
  
  /**
   * Get current log file path
   */
  private getLogFilePath(): string {
    if (this.config.rotateDaily) {
      const date = new Date().toISOString().split('T')[0] // YYYY-MM-DD
      return path.join(this.config.logDirectory, `slow-queries-${date}.ndjson`)
    }
    
    return path.join(this.config.logDirectory, 'slow-queries.ndjson')
  }
  
  /**
   * Rotate logs if file size exceeds limit
   */
  private async rotateLogsIfNeeded(logFile: string): Promise<void> {
    try {
      const stats = await fs.stat(logFile)
      
      if (stats.size > this.config.maxLogSizeBytes) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const archivePath = logFile.replace('.ndjson', `-${timestamp}.ndjson`)
        
        await fs.rename(logFile, archivePath)
        console.log(`[Slow Query Logger] Rotated log file: ${archivePath}`)
        
        // Clean up old log files
        await this.cleanupOldLogs()
      }
    } catch (error) {
      // File might not exist yet, which is fine
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error('[Slow Query Logger] Failed to rotate logs:', error)
      }
    }
  }
  
  /**
   * Clean up old log files
   */
  private async cleanupOldLogs(): Promise<void> {
    try {
      const files = await fs.readdir(this.config.logDirectory)
      const logFiles = files
        .filter(f => f.startsWith('slow-queries-') && f.endsWith('.ndjson'))
        .map(f => path.join(this.config.logDirectory, f))
      
      if (logFiles.length <= this.config.maxLogFiles) return
      
      // Sort by modification time
      const fileStats = await Promise.all(
        logFiles.map(async f => ({
          path: f,
          mtime: (await fs.stat(f)).mtime,
        }))
      )
      
      fileStats.sort((a, b) => a.mtime.getTime() - b.mtime.getTime())
      
      // Delete oldest files
      const filesToDelete = fileStats.slice(0, fileStats.length - this.config.maxLogFiles)
      
      for (const file of filesToDelete) {
        await fs.unlink(file.path)
        console.log(`[Slow Query Logger] Deleted old log file: ${file.path}`)
      }
    } catch (error) {
      console.error('[Slow Query Logger] Failed to cleanup old logs:', error)
    }
  }
  
  /**
   * Log to database (future enhancement)
   */
  private async logToDatabase(_query: SlowQueryLog): Promise<void> {
    // TODO: Implement database logging
    // This would store slow queries in a dedicated table for long-term analysis
    // For now, we'll skip this to avoid circular dependencies with Prisma
  }
  
  /**
   * Read log file
   */
  async readLogs(date?: string): Promise<SlowQueryLog[]> {
    try {
      const logFile = date
        ? path.join(this.config.logDirectory, `slow-queries-${date}.ndjson`)
        : this.getLogFilePath()
      
      const content = await fs.readFile(logFile, 'utf-8')
      
      return content
        .trim()
        .split('\n')
        .filter(line => line.length > 0)
        .map(line => JSON.parse(line))
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [] // File doesn't exist yet
      }
      throw error
    }
  }
  
  /**
   * Get log files list
   */
  async getLogFiles(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.config.logDirectory)
      return files
        .filter(f => f.startsWith('slow-queries-') && f.endsWith('.ndjson'))
        .sort()
        .reverse() // Most recent first
    } catch (_error) {
      return []
    }
  }
  
  /**
   * Get logs for a date range
   */
  async getLogsInRange(startDate: Date, endDate: Date): Promise<SlowQueryLog[]> {
    const allLogs: SlowQueryLog[] = []
    
    // Get all log files
    const logFiles = await this.getLogFiles()
    
    for (const file of logFiles) {
      const logs = await this.readLogs(file.replace('slow-queries-', '').replace('.ndjson', ''))
      
      // Filter by date range
      const filteredLogs = logs.filter(log => {
        const timestamp = new Date(log.timestamp)
        return timestamp >= startDate && timestamp <= endDate
      })
      
      allLogs.push(...filteredLogs)
    }
    
    return allLogs.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  }
  
  /**
   * Get summary statistics from logs
   */
  async getLogSummary(date?: string): Promise<{
    totalSlowQueries: number
    criticalQueries: number
    warningQueries: number
    slowestQuery: SlowQueryLog | null
    byModel: Record<string, number>
    byAction: Record<string, number>
  }> {
    const logs = await this.readLogs(date)
    
    const byModel: Record<string, number> = {}
    const byAction: Record<string, number> = {}
    let slowestQuery: SlowQueryLog | null = null
    
    for (const log of logs) {
      byModel[log.model] = (byModel[log.model] || 0) + 1
      byAction[log.action] = (byAction[log.action] || 0) + 1
      
      if (!slowestQuery || log.executionTime > slowestQuery.executionTime) {
        slowestQuery = log
      }
    }
    
    return {
      totalSlowQueries: logs.length,
      criticalQueries: logs.filter(l => l.severity === 'critical').length,
      warningQueries: logs.filter(l => l.severity === 'warning').length,
      slowestQuery,
      byModel,
      byAction,
    }
  }
  
  /**
   * Flush write queue
   */
  async flush(): Promise<void> {
    await this.processWriteQueue()
  }
}

/**
 * Global slow query logger instance
 */
export const slowQueryLogger = new SlowQueryLogger()

/**
 * Helper function to log slow queries
 */
export async function logSlowQuery(query: QueryMetrics): Promise<void> {
  if (!query.isSlow) return
  
  const slowLog: SlowQueryLog = {
    ...query,
    environment: process.env.NODE_ENV || 'development',
  }
  
  await slowQueryLogger.log(slowLog)
}
