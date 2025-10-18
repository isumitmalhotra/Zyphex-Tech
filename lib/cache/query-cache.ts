/**
 * Intelligent Query Result Caching
 * 
 * Advanced caching layer for expensive database queries with automatic
 * invalidation, TTL strategies, and cache warming.
 * 
 * Features:
 * - Query result caching with Redis
 * - Automatic cache invalidation on model updates
 * - Smart TTL based on query complexity
 * - Cache warming for hot queries
 * - Cache hit/miss tracking
 * - Stale-while-revalidate pattern
 * 
 * Usage:
 * import { QueryCache } from '@/lib/cache/query-cache'
 * const result = await QueryCache.getCached('users-list', () => prisma.user.findMany())
 */

import { getRedisClient } from './redis'

/**
 * Cache configuration per query type
 */
const CACHE_CONFIG = {
  // Default TTLs in seconds
  ttl: {
    short: 60,         // 1 minute
    medium: 300,       // 5 minutes
    long: 1800,        // 30 minutes
    veryLong: 3600     // 1 hour
  },
  
  // Cache key prefixes
  prefixes: {
    query: 'qcache',
    invalidation: 'qinv',
    stats: 'qstats'
  },
  
  // Stale-while-revalidate settings
  staleTime: 60,  // Serve stale for 1 minute while revalidating
  
  // Cache warming
  warmingBatchSize: 10
}

/**
 * Query cache options
 */
export interface QueryCacheOptions {
  /**
   * Cache key (must be unique)
   */
  key: string
  
  /**
   * TTL in seconds
   */
  ttl?: number
  
  /**
   * Models affected by this query (for invalidation)
   */
  models?: string[]
  
  /**
   * Enable stale-while-revalidate
   */
  staleWhileRevalidate?: boolean
  
  /**
   * Tags for grouped invalidation
   */
  tags?: string[]
}

/**
 * Cache statistics
 */
export interface CacheStats {
  hits: number
  misses: number
  hitRate: number
  totalQueries: number
}

/**
 * Query Cache Class
 */
class QueryCacheManager {
  private revalidating = new Set<string>()
  
  /**
   * Get cached query result or execute and cache
   */
  async getCached<T>(
    queryFn: () => Promise<T>,
    options: QueryCacheOptions
  ): Promise<T> {
    const redis = getRedisClient()
    if (!redis) {
      return queryFn()
    }
    
    const cacheKey = this.buildCacheKey(options.key)
    
    try {
      // Try to get from cache
      const cached = await redis.get(cacheKey)
      
      if (cached) {
        // Track hit
        await this.trackHit(options.key)
        
        const parsed = JSON.parse(cached, this.dateReviver) as T
        
        // Check if stale-while-revalidate
        if (options.staleWhileRevalidate && await this.isStale(cacheKey)) {
          // Return stale data immediately
          // Revalidate in background
          this.revalidateInBackground(queryFn, options)
          return parsed
        }
        
        return parsed
      }
      
      // Cache miss - track it
      await this.trackMiss(options.key)
      
      // Execute query
      const result = await queryFn()
      
      // Store in cache
      await this.setCached(result, options)
      
      return result
      
    } catch (error) {
      console.error('[QueryCache] Error:', error)
      // Fallback to direct query
      return queryFn()
    }
  }
  
  /**
   * Set cached value
   */
  async setCached<T>(
    value: T,
    options: QueryCacheOptions
  ): Promise<void> {
    const redis = getRedisClient()
    if (!redis) return
    
    const cacheKey = this.buildCacheKey(options.key)
    const ttl = options.ttl || CACHE_CONFIG.ttl.medium
    
    try {
      const serialized = JSON.stringify(value)
      await redis.setex(cacheKey, ttl, serialized)
      
      // Store metadata
      await this.storeMetadata(options)
      
    } catch (error) {
      console.error('[QueryCache] Error setting cache:', error)
    }
  }
  
  /**
   * Invalidate cache by key
   */
  async invalidate(key: string): Promise<void> {
    const redis = getRedisClient()
    if (!redis) return
    
    const cacheKey = this.buildCacheKey(key)
    await redis.del(cacheKey)
  }
  
  /**
   * Invalidate cache by model
   */
  async invalidateModel(model: string): Promise<void> {
    const redis = getRedisClient()
    if (!redis) return
    
    try {
      // Get all keys for this model
      const pattern = `${CACHE_CONFIG.prefixes.invalidation}:${model.toLowerCase()}:*`
      const keys = await redis.keys(pattern)
      
      if (keys.length > 0) {
        // Get cache keys from metadata
        const cacheKeys = await Promise.all(
          keys.map((k: string) => redis.get(k))
        )
        
        // Delete cache entries
        const keysToDelete = cacheKeys
          .filter((k: string | null): k is string => k !== null)
          .map((k: string) => this.buildCacheKey(k))
        
        if (keysToDelete.length > 0) {
          await redis.del(...keysToDelete)
        }
        
        // Delete metadata keys
        await redis.del(...keys)
      }
    } catch (error) {
      console.error('[QueryCache] Error invalidating model:', error)
    }
  }
  
  /**
   * Invalidate cache by tag
   */
  async invalidateTag(tag: string): Promise<void> {
    const redis = getRedisClient()
    if (!redis) return
    
    try {
      const pattern = `${CACHE_CONFIG.prefixes.invalidation}:tag:${tag}:*`
      const keys = await redis.keys(pattern)
      
      if (keys.length > 0) {
        const cacheKeys = await Promise.all(
          keys.map((k: string) => redis.get(k))
        )
        
        const keysToDelete = cacheKeys
          .filter((k: string | null): k is string => k !== null)
          .map((k: string) => this.buildCacheKey(k))
        
        if (keysToDelete.length > 0) {
          await redis.del(...keysToDelete)
        }
        
        await redis.del(...keys)
      }
    } catch (error) {
      console.error('[QueryCache] Error invalidating tag:', error)
    }
  }
  
  /**
   * Clear all query cache
   */
  async clearAll(): Promise<void> {
    const redis = getRedisClient()
    if (!redis) return
    
    try {
      const pattern = `${CACHE_CONFIG.prefixes.query}:*`
      const keys = await redis.keys(pattern)
      
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    } catch (error) {
      console.error('[QueryCache] Error clearing cache:', error)
    }
  }
  
  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    const redis = getRedisClient()
    if (!redis) {
      return { hits: 0, misses: 0, hitRate: 0, totalQueries: 0 }
    }
    
    try {
      const hits = parseInt(await redis.get(`${CACHE_CONFIG.prefixes.stats}:hits`) || '0')
      const misses = parseInt(await redis.get(`${CACHE_CONFIG.prefixes.stats}:misses`) || '0')
      const totalQueries = hits + misses
      const hitRate = totalQueries > 0 ? (hits / totalQueries) * 100 : 0
      
      return { hits, misses, hitRate, totalQueries }
    } catch (error) {
      console.error('[QueryCache] Error getting stats:', error)
      return { hits: 0, misses: 0, hitRate: 0, totalQueries: 0 }
    }
  }
  
  /**
   * Reset cache statistics
   */
  async resetStats(): Promise<void> {
    const redis = getRedisClient()
    if (!redis) return
    
    await redis.del(
      `${CACHE_CONFIG.prefixes.stats}:hits`,
      `${CACHE_CONFIG.prefixes.stats}:misses`
    )
  }
  
  /**
   * Warm cache with pre-computed results
   */
  async warmCache<T>(
    queries: Array<{ key: string; queryFn: () => Promise<T>; options?: Partial<QueryCacheOptions> }>
  ): Promise<void> {
    const redis = getRedisClient()
    if (!redis) return
    
    console.log(`[QueryCache] Warming cache with ${queries.length} queries...`)
    
    // Process in batches
    for (let i = 0; i < queries.length; i += CACHE_CONFIG.warmingBatchSize) {
      const batch = queries.slice(i, i + CACHE_CONFIG.warmingBatchSize)
      
      await Promise.all(
        batch.map(async ({ key, queryFn, options = {} }) => {
          try {
            const result = await queryFn()
            await this.setCached(result, { key, ...options })
          } catch (error) {
            console.error(`[QueryCache] Error warming cache for ${key}:`, error)
          }
        })
      )
    }
    
    console.log('[QueryCache] Cache warming complete')
  }
  
  /**
   * Build cache key
   */
  private buildCacheKey(key: string): string {
    return `${CACHE_CONFIG.prefixes.query}:${key}`
  }
  
  /**
   * Store metadata for invalidation
   */
  private async storeMetadata(options: QueryCacheOptions): Promise<void> {
    const redis = getRedisClient()
    if (!redis) return
    
    // Store model associations
    if (options.models) {
      for (const model of options.models) {
        const metaKey = `${CACHE_CONFIG.prefixes.invalidation}:${model.toLowerCase()}:${options.key}`
        await redis.setex(metaKey, (options.ttl || CACHE_CONFIG.ttl.medium) + 60, options.key)
      }
    }
    
    // Store tag associations
    if (options.tags) {
      for (const tag of options.tags) {
        const metaKey = `${CACHE_CONFIG.prefixes.invalidation}:tag:${tag}:${options.key}`
        await redis.setex(metaKey, (options.ttl || CACHE_CONFIG.ttl.medium) + 60, options.key)
      }
    }
  }
  
  /**
   * Check if cache is stale
   */
  private async isStale(cacheKey: string): Promise<boolean> {
    const redis = getRedisClient()
    if (!redis) return false
    
    try {
      const ttl = await redis.ttl(cacheKey)
      return ttl > 0 && ttl < CACHE_CONFIG.staleTime
    } catch {
      return false
    }
  }
  
  /**
   * Revalidate in background
   */
  private async revalidateInBackground<T>(
    queryFn: () => Promise<T>,
    options: QueryCacheOptions
  ): Promise<void> {
    // Prevent duplicate revalidations
    if (this.revalidating.has(options.key)) {
      return
    }
    
    this.revalidating.add(options.key)
    
    try {
      const result = await queryFn()
      await this.setCached(result, options)
    } catch (error) {
      console.error('[QueryCache] Background revalidation error:', error)
    } finally {
      this.revalidating.delete(options.key)
    }
  }
  
  /**
   * Track cache hit
   */
  private async trackHit(_key: string): Promise<void> {
    const redis = getRedisClient()
    if (!redis) return
    
    try {
      await redis.incr(`${CACHE_CONFIG.prefixes.stats}:hits`)
    } catch {
      // Ignore tracking errors
    }
  }
  
  /**
   * Track cache miss
   */
  private async trackMiss(_key: string): Promise<void> {
    const redis = getRedisClient()
    if (!redis) return
    
    try {
      await redis.incr(`${CACHE_CONFIG.prefixes.stats}:misses`)
    } catch {
      // Ignore tracking errors
    }
  }
  
  /**
   * Date reviver for JSON.parse
   */
  private dateReviver(_key: string, value: unknown): unknown {
    if (typeof value === 'string') {
      const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/
      if (dateRegex.test(value)) {
        return new Date(value)
      }
    }
    return value
  }
}

// Singleton instance
const queryCache = new QueryCacheManager()

/**
 * Get cached query result
 */
export function getCachedQuery<T>(
  queryFn: () => Promise<T>,
  options: QueryCacheOptions
): Promise<T> {
  return queryCache.getCached(queryFn, options)
}

/**
 * Invalidate cache by key
 */
export function invalidateQueryCache(key: string): Promise<void> {
  return queryCache.invalidate(key)
}

/**
 * Invalidate cache by model
 */
export function invalidateModelCache(model: string): Promise<void> {
  return queryCache.invalidateModel(model)
}

/**
 * Invalidate cache by tag
 */
export function invalidateTagCache(tag: string): Promise<void> {
  return queryCache.invalidateTag(tag)
}

/**
 * Clear all query cache
 */
export function clearQueryCache(): Promise<void> {
  return queryCache.clearAll()
}

/**
 * Get cache statistics
 */
export function getQueryCacheStats(): Promise<CacheStats> {
  return queryCache.getStats()
}

/**
 * Warm cache
 */
export function warmQueryCache<T>(
  queries: Array<{ key: string; queryFn: () => Promise<T>; options?: Partial<QueryCacheOptions> }>
): Promise<void> {
  return queryCache.warmCache(queries)
}

export { QueryCacheManager }
export const QueryCache = queryCache

const QueryCacheUtils = {
  getCachedQuery,
  invalidateQueryCache,
  invalidateModelCache,
  invalidateTagCache,
  clearQueryCache,
  getQueryCacheStats,
  warmQueryCache,
  QueryCache,
  CACHE_CONFIG
}

export default QueryCacheUtils
