/**
 * Database Query Optimization Utilities
 * Helpers for optimizing Prisma queries and preventing N+1 issues
 */

import { Prisma } from '@prisma/client'
import { cache } from '@/lib/cache'

/**
 * Pagination helper with cursor-based pagination
 */
export interface PaginationOptions {
  page?: number
  limit?: number
  cursor?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResult<T> {
  data: T[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
    cursor?: string
  }
}

/**
 * Create pagination parameters for Prisma
 */
export function createPaginationParams(options: PaginationOptions) {
  const { page = 1, limit = 20, cursor, sortBy = 'createdAt', sortOrder = 'desc' } = options

  const skip = cursor ? 1 : (page - 1) * limit
  const take = limit

  return {
    skip,
    take,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { [sortBy]: sortOrder },
  }
}

/**
 * Add pagination metadata to results
 */
export function addPaginationMetadata<T>(
  data: T[],
  total: number,
  options: PaginationOptions
): PaginatedResult<T> {
  const { page = 1, limit = 20 } = options
  const totalPages = Math.ceil(total / limit)

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      cursor: data.length > 0 ? (data[data.length - 1] as any).id : undefined,
    },
  }
}

/**
 * Cached database query wrapper
 */
export async function cachedQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300, // 5 minutes default
  tags: string[] = [] // Tags for cache invalidation (implement separately if needed)
): Promise<T> {
  // Try to get from cache first
  const cached = await cache.get<T>(key)
  if (cached !== null) {
    return cached
  }

  // If not in cache, fetch the data
  const value = await fetcher()

  // Store in cache
  await cache.set(key, value, ttl)

  return value
}

/**
 * Batch loader to prevent N+1 queries
 */
export class DataLoader<K, V> {
  private cache = new Map<K, Promise<V>>()
  private batchLoadFn: (keys: K[]) => Promise<V[]>
  private batch: K[] = []
  private batchPromise: Promise<void> | null = null

  constructor(batchLoadFn: (keys: K[]) => Promise<V[]>) {
    this.batchLoadFn = batchLoadFn
  }

  async load(key: K): Promise<V> {
    const cached = this.cache.get(key)
    if (cached) return cached

    const promise = new Promise<V>((resolve, reject) => {
      this.batch.push(key)

      if (!this.batchPromise) {
        this.batchPromise = Promise.resolve().then(() => {
          const currentBatch = this.batch
          this.batch = []
          this.batchPromise = null

          return this.batchLoadFn(currentBatch).then(
            (values) => {
              currentBatch.forEach((k, index) => {
                const cachedPromise = this.cache.get(k)
                if (cachedPromise) {
                  ;(cachedPromise as any).resolve(values[index])
                }
              })
            },
            (error) => {
              currentBatch.forEach((k) => {
                const cachedPromise = this.cache.get(k)
                if (cachedPromise) {
                  ;(cachedPromise as any).reject(error)
                }
              })
            }
          )
        })
      }

      ;(promise as any).resolve = resolve
      ;(promise as any).reject = reject
    })

    this.cache.set(key, promise)
    return promise
  }

  clear(): void {
    this.cache.clear()
    this.batch = []
    this.batchPromise = null
  }
}

/**
 * Query performance monitoring
 */
export class QueryMonitor {
  private static queries: Array<{
    query: string
    duration: number
    timestamp: Date
  }> = []

  static async track<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now()
    try {
      const result = await fn()
      const duration = Date.now() - start

      this.queries.push({
        query: name,
        duration,
        timestamp: new Date(),
      })

      // Keep only last 100 queries
      if (this.queries.length > 100) {
        this.queries.shift()
      }

      // Warn on slow queries (> 1 second)
      if (duration > 1000) {
        console.warn(`Slow query detected: ${name} took ${duration}ms`)
      }

      return result
    } catch (error) {
      const duration = Date.now() - start
      console.error(`Query error: ${name} failed after ${duration}ms`, error)
      throw error
    }
  }

  static getStats() {
    if (this.queries.length === 0) {
      return {
        totalQueries: 0,
        averageDuration: 0,
        slowestQuery: null,
        fastestQuery: null,
      }
    }

    const durations = this.queries.map((q) => q.duration)
    const averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length

    const slowest = this.queries.reduce((prev, current) =>
      prev.duration > current.duration ? prev : current
    )

    const fastest = this.queries.reduce((prev, current) =>
      prev.duration < current.duration ? prev : current
    )

    return {
      totalQueries: this.queries.length,
      averageDuration: Math.round(averageDuration),
      slowestQuery: {
        name: slowest.query,
        duration: slowest.duration,
      },
      fastestQuery: {
        name: fastest.query,
        duration: fastest.duration,
      },
      recentQueries: this.queries.slice(-10).map((q) => ({
        query: q.query,
        duration: q.duration,
        timestamp: q.timestamp,
      })),
    }
  }

  static clear() {
    this.queries = []
  }
}

/**
 * Common query optimizations
 */
export const queryOptimizations = {
  /**
   * Select only needed fields
   */
  selectFields: <T extends Record<string, boolean>>(fields: T) => ({
    select: fields,
  }),

  /**
   * Include relations efficiently
   */
  includeRelations: <T extends Record<string, boolean | object>>(relations: T) => ({
    include: relations,
  }),

  /**
   * Common user fields (avoid selecting sensitive data)
   */
  safeUserSelect: {
    id: true,
    name: true,
    email: true,
    image: true,
    role: true,
    createdAt: true,
  },

  /**
   * Efficient project query with relations
   */
  projectWithDetails: {
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      timeEntries: {
        select: {
          id: true,
          hours: true,
          billableRate: true,
        },
        take: 10, // Limit to recent entries
        orderBy: { startTime: 'desc' as const },
      },
      invoices: {
        select: {
          id: true,
          invoiceNumber: true,
          totalAmount: true,
          status: true,
        },
        take: 5, // Limit to recent invoices
        orderBy: { createdAt: 'desc' as const },
      },
    },
  },
}

/**
 * Database connection pool monitoring
 */
export function getConnectionPoolStats() {
  // This would integrate with Prisma metrics if available
  return {
    activeConnections: 0,
    idleConnections: 0,
    waitingRequests: 0,
  }
}

/**
 * Usage Examples:
 * 
 * 1. Pagination:
 *    const params = createPaginationParams({ page: 1, limit: 20 })
 *    const projects = await prisma.project.findMany(params)
 *    const total = await prisma.project.count()
 *    const result = addPaginationMetadata(projects, total, { page: 1, limit: 20 })
 * 
 * 2. Cached query:
 *    const projects = await cachedQuery(
 *      'projects:all',
 *      () => prisma.project.findMany(),
 *      300,
 *      ['projects']
 *    )
 * 
 * 3. Performance monitoring:
 *    const result = await QueryMonitor.track('fetchProjects', async () => {
 *      return await prisma.project.findMany()
 *    })
 * 
 * 4. Data loader (prevent N+1):
 *    const userLoader = new DataLoader(async (ids: string[]) => {
 *      return prisma.user.findMany({ where: { id: { in: ids } } })
 *    })
 *    const user = await userLoader.load('user-id')
 */
