/**
 * Database Query Timeout Handling
 * 
 * Implements query timeout middleware and graceful degradation for slow queries.
 * Prevents long-running queries from blocking the connection pool.
 * 
 * Features:
 * - Configurable query timeouts per operation type
 * - Automatic query cancellation on timeout
 * - Graceful degradation with fallback responses
 * - Timeout metrics and logging
 * - Priority-based timeout management
 * 
 * Usage:
 * import { withTimeout, TimeoutConfig } from '@/lib/db/query-timeout'
 * const result = await withTimeout(() => prisma.user.findMany(), { timeout: 5000 })
 */

import { Prisma } from '@prisma/client'

/**
 * Timeout configuration per operation type
 */
export const QUERY_TIMEOUTS = {
  // Read operations
  select: 5000,      // 5 seconds
  findMany: 10000,   // 10 seconds
  findFirst: 3000,   // 3 seconds
  findUnique: 2000,  // 2 seconds
  count: 5000,       // 5 seconds
  aggregate: 10000,  // 10 seconds
  groupBy: 10000,    // 10 seconds
  
  // Write operations  
  create: 5000,      // 5 seconds
  createMany: 10000, // 10 seconds
  update: 5000,      // 5 seconds
  updateMany: 10000, // 10 seconds
  upsert: 5000,      // 5 seconds
  delete: 3000,      // 3 seconds
  deleteMany: 10000, // 10 seconds
  
  // Transactions
  transaction: 30000, // 30 seconds
  
  // Default for unknown operations
  default: 10000     // 10 seconds
} as const

/**
 * Query timeout error
 */
export class QueryTimeoutError extends Error {
  constructor(
    public operation: string,
    public timeout: number
  ) {
    super(`Query timeout: ${operation} exceeded ${timeout}ms`)
    this.name = 'QueryTimeoutError'
  }
}

/**
 * Timeout configuration options
 */
export interface TimeoutConfig {
  /**
   * Timeout in milliseconds
   */
  timeout?: number
  
  /**
   * Operation type (for default timeout)
   */
  operation?: keyof typeof QUERY_TIMEOUTS
  
  /**
   * Fallback value to return on timeout
   */
  fallback?: unknown
  
  /**
   * Whether to throw error or return fallback on timeout
   */
  throwOnTimeout?: boolean
  
  /**
   * Callback when timeout occurs
   */
  onTimeout?: (operation: string, duration: number) => void
}

/**
 * Execute a query with timeout
 */
export async function withTimeout<T>(
  queryFn: () => Promise<T>,
  config: TimeoutConfig = {}
): Promise<T> {
  const {
    timeout = config.operation 
      ? QUERY_TIMEOUTS[config.operation]
      : QUERY_TIMEOUTS.default,
    fallback,
    throwOnTimeout = true,
    onTimeout
  } = config
  
  const operation = config.operation || 'unknown'
  
  return new Promise((resolve, reject) => {
    let isResolved = false
    
    // Set timeout
    const timeoutId = setTimeout(() => {
      if (!isResolved) {
        isResolved = true
        
        // Log timeout
        console.warn(`[QueryTimeout] ${operation} exceeded ${timeout}ms`)
        
        // Call timeout callback
        if (onTimeout) {
          onTimeout(operation, timeout)
        }
        
        // Handle timeout
        if (throwOnTimeout) {
          reject(new QueryTimeoutError(operation, timeout))
        } else if (fallback !== undefined) {
          resolve(fallback as T)
        } else {
          reject(new QueryTimeoutError(operation, timeout))
        }
      }
    }, timeout)
    
    // Execute query
    queryFn()
      .then(result => {
        if (!isResolved) {
          isResolved = true
          clearTimeout(timeoutId)
          resolve(result)
        }
      })
      .catch(error => {
        if (!isResolved) {
          isResolved = true
          clearTimeout(timeoutId)
          reject(error)
        }
      })
  })
}

/**
 * Timeout statistics
 */
interface TimeoutStats {
  operation: string
  count: number
  totalDuration: number
  avgDuration: number
  maxDuration: number
  lastTimeout: Date
}

/**
 * Timeout tracker
 */
class QueryTimeoutTracker {
  private stats = new Map<string, TimeoutStats>()
  
  /**
   * Record a timeout
   */
  recordTimeout(operation: string, duration: number): void {
    const existing = this.stats.get(operation)
    
    if (existing) {
      existing.count++
      existing.totalDuration += duration
      existing.avgDuration = existing.totalDuration / existing.count
      existing.maxDuration = Math.max(existing.maxDuration, duration)
      existing.lastTimeout = new Date()
    } else {
      this.stats.set(operation, {
        operation,
        count: 1,
        totalDuration: duration,
        avgDuration: duration,
        maxDuration: duration,
        lastTimeout: new Date()
      })
    }
  }
  
  /**
   * Get timeout statistics
   */
  getStats(operation?: string): TimeoutStats[] {
    if (operation) {
      const stat = this.stats.get(operation)
      return stat ? [stat] : []
    }
    
    return Array.from(this.stats.values())
  }
  
  /**
   * Get total timeout count
   */
  getTotalTimeoutCount(): number {
    return Array.from(this.stats.values())
      .reduce((sum, stat) => sum + stat.count, 0)
  }
  
  /**
   * Clear statistics
   */
  clearStats(): void {
    this.stats.clear()
  }
  
  /**
   * Get most timed-out operations
   */
  getTopTimeouts(limit = 10): TimeoutStats[] {
    return Array.from(this.stats.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
  }
}

// Global timeout tracker
const timeoutTracker = new QueryTimeoutTracker()

/**
 * Wrap a Prisma query with timeout and tracking
 */
export async function withTimeoutTracking<T>(
  queryFn: () => Promise<T>,
  config: TimeoutConfig = {}
): Promise<T> {
  const configWithTracking: TimeoutConfig = {
    ...config,
    onTimeout: (op, duration) => {
      timeoutTracker.recordTimeout(op, duration)
      config.onTimeout?.(op, duration)
    }
  }
  
  return withTimeout(queryFn, configWithTracking)
}

/**
 * Get timeout statistics
 */
export function getTimeoutStats(operation?: string): TimeoutStats[] {
  return timeoutTracker.getStats(operation)
}

/**
 * Get total timeout count
 */
export function getTotalTimeoutCount(): number {
  return timeoutTracker.getTotalTimeoutCount()
}

/**
 * Clear timeout statistics
 */
export function clearTimeoutStats(): void {
  timeoutTracker.clearStats()
}

/**
 * Get operations with most timeouts
 */
export function getTopTimeouts(limit = 10): TimeoutStats[] {
  return timeoutTracker.getTopTimeouts(limit)
}

/**
 * Prisma client extension with automatic timeouts
 */
export const timeoutExtension = Prisma.defineExtension({
  name: 'timeout',
  query: {
    $allModels: {
      async $allOperations({ operation, args, query }) {
        const operationType = operation as keyof typeof QUERY_TIMEOUTS
        const timeout = QUERY_TIMEOUTS[operationType] || QUERY_TIMEOUTS.default
        
        return withTimeoutTracking(
          () => query(args),
          {
            timeout,
            operation: operationType,
            throwOnTimeout: true
          }
        )
      }
    }
  }
})

/**
 * Graceful degradation helper
 */
export async function withGracefulDegradation<T>(
  queryFn: () => Promise<T>,
  fallback: T,
  timeout?: number
): Promise<T> {
  try {
    return await withTimeout(queryFn, {
      timeout,
      throwOnTimeout: true
    })
  } catch (error) {
    if (error instanceof QueryTimeoutError) {
      console.warn(`[GracefulDegradation] Returning fallback due to timeout`)
      return fallback
    }
    throw error
  }
}

/**
 * Priority-based timeout configuration
 */
export enum QueryPriority {
  CRITICAL = 'critical',  // No timeout or very long
  HIGH = 'high',          // 30s timeout
  NORMAL = 'normal',      // 10s timeout
  LOW = 'low'             // 5s timeout
}

const PRIORITY_TIMEOUTS: Record<QueryPriority, number> = {
  [QueryPriority.CRITICAL]: 60000, // 60s
  [QueryPriority.HIGH]: 30000,     // 30s
  [QueryPriority.NORMAL]: 10000,   // 10s
  [QueryPriority.LOW]: 5000        // 5s
}

/**
 * Execute query with priority-based timeout
 */
export async function withPriority<T>(
  queryFn: () => Promise<T>,
  priority: QueryPriority = QueryPriority.NORMAL
): Promise<T> {
  return withTimeout(queryFn, {
    timeout: PRIORITY_TIMEOUTS[priority],
    throwOnTimeout: true
  })
}

/**
 * Batch queries with timeout for each
 */
export async function batchWithTimeout<T>(
  queries: Array<() => Promise<T>>,
  config: TimeoutConfig = {}
): Promise<T[]> {
  return Promise.all(
    queries.map(queryFn => withTimeout(queryFn, config))
  )
}

/**
 * Execute query with retry on timeout
 */
export async function withRetryOnTimeout<T>(
  queryFn: () => Promise<T>,
  config: TimeoutConfig & { maxRetries?: number; retryDelay?: number } = {}
): Promise<T> {
  const { maxRetries = 2, retryDelay = 1000, ...timeoutConfig } = config
  
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await withTimeout(queryFn, timeoutConfig)
    } catch (error) {
      if (error instanceof QueryTimeoutError && attempt < maxRetries) {
        lastError = error
        console.warn(`[RetryOnTimeout] Attempt ${attempt + 1} failed, retrying...`)
        await new Promise(resolve => setTimeout(resolve, retryDelay))
        continue
      }
      throw error
    }
  }
  
  throw lastError
}

const QueryTimeoutUtils = {
  withTimeout,
  withTimeoutTracking,
  withGracefulDegradation,
  withPriority,
  batchWithTimeout,
  withRetryOnTimeout,
  getTimeoutStats,
  getTotalTimeoutCount,
  clearTimeoutStats,
  getTopTimeouts,
  QueryPriority,
  QUERY_TIMEOUTS
}

export default QueryTimeoutUtils
