import redis from '../redis'

/**
 * Production-grade cache service with comprehensive features
 * 
 * Features:
 * - Get/Set/Delete operations with TTL support
 * - Batch operations for efficiency
 * - Cache invalidation patterns
 * - Hit/Miss rate tracking
 * - Automatic JSON serialization/deserialization
 * - Error handling and fallback
 * - Memory usage monitoring
 */

/**
 * Default TTL values (in seconds)
 */
export const DEFAULT_TTL = {
  SHORT: 60,           // 1 minute
  MEDIUM: 300,         // 5 minutes
  STANDARD: 900,       // 15 minutes
  LONG: 3600,          // 1 hour
  VERY_LONG: 86400,    // 24 hours
  WEEK: 604800,        // 7 days
}

/**
 * Cache statistics for monitoring
 */
interface CacheStats {
  hits: number
  misses: number
  sets: number
  deletes: number
  errors: number
  totalOperations: number
  hitRate: number
}

// Global cache statistics
let cacheStats: CacheStats = {
  hits: 0,
  misses: 0,
  sets: 0,
  deletes: 0,
  errors: 0,
  totalOperations: 0,
  hitRate: 0,
}

/**
 * Cache service class with all caching operations
 */
class CacheService {
  /**
   * Get a value from cache
   * Returns null if key doesn't exist or on error
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key)
      cacheStats.totalOperations++
      
      if (value === null) {
        cacheStats.misses++
        this.updateHitRate()
        return null
      }
      
      cacheStats.hits++
      this.updateHitRate()
      
      // Try to parse as JSON, return as-is if parsing fails
      try {
        return JSON.parse(value) as T
      } catch {
        return value as unknown as T
      }
    } catch (error) {
      console.error(`[Cache] Error getting key ${key}:`, error)
      cacheStats.errors++
      return null
    }
  }

  /**
   * Get multiple values from cache
   * More efficient than multiple get() calls
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    if (keys.length === 0) return []
    
    try {
      const values = await redis.mget(...keys)
      cacheStats.totalOperations += keys.length
      
      return values.map((value) => {
        if (value === null) {
          cacheStats.misses++
          return null
        }
        
        cacheStats.hits++
        
        try {
          return JSON.parse(value) as T
        } catch {
          return value as unknown as T
        }
      })
    } catch (error) {
      console.error('[Cache] Error in mget:', error)
      cacheStats.errors++
      return keys.map(() => null)
    } finally {
      this.updateHitRate()
    }
  }

  /**
   * Set a value in cache with optional TTL
   * @param key Cache key
   * @param value Value to cache (will be JSON stringified)
   * @param ttl Time to live in seconds (default: 15 minutes)
   */
  async set(key: string, value: unknown, ttl: number = DEFAULT_TTL.STANDARD): Promise<boolean> {
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value)
      
      if (ttl > 0) {
        await redis.setex(key, ttl, serialized)
      } else {
        await redis.set(key, serialized)
      }
      
      cacheStats.sets++
      cacheStats.totalOperations++
      return true
    } catch (error) {
      console.error(`[Cache] Error setting key ${key}:`, error)
      cacheStats.errors++
      return false
    }
  }

  /**
   * Set multiple key-value pairs
   * More efficient than multiple set() calls
   */
  async mset(entries: Array<{ key: string; value: unknown; ttl?: number }>): Promise<boolean> {
    if (entries.length === 0) return true
    
    try {
      const pipeline = redis.pipeline()
      
      for (const { key, value, ttl } of entries) {
        const serialized = typeof value === 'string' ? value : JSON.stringify(value)
        
        if (ttl && ttl > 0) {
          pipeline.setex(key, ttl, serialized)
        } else {
          pipeline.set(key, serialized)
        }
      }
      
      await pipeline.exec()
      
      cacheStats.sets += entries.length
      cacheStats.totalOperations += entries.length
      return true
    } catch (error) {
      console.error('[Cache] Error in mset:', error)
      cacheStats.errors++
      return false
    }
  }

  /**
   * Delete a key from cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      const result = await redis.del(key)
      cacheStats.deletes++
      cacheStats.totalOperations++
      return result > 0
    } catch (error) {
      console.error(`[Cache] Error deleting key ${key}:`, error)
      cacheStats.errors++
      return false
    }
  }

  /**
   * Delete multiple keys
   * More efficient than multiple delete() calls
   */
  async mdelete(keys: string[]): Promise<number> {
    if (keys.length === 0) return 0
    
    try {
      const result = await redis.del(...keys)
      cacheStats.deletes += keys.length
      cacheStats.totalOperations += keys.length
      return result
    } catch (error) {
      console.error('[Cache] Error in mdelete:', error)
      cacheStats.errors++
      return 0
    }
  }

  /**
   * Check if a key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(key)
      cacheStats.totalOperations++
      return result === 1
    } catch (error) {
      console.error(`[Cache] Error checking existence of key ${key}:`, error)
      cacheStats.errors++
      return false
    }
  }

  /**
   * Get remaining TTL for a key (in seconds)
   * Returns -1 if key has no expiry, -2 if key doesn't exist
   */
  async ttl(key: string): Promise<number> {
    try {
      return await redis.ttl(key)
    } catch (error) {
      console.error(`[Cache] Error getting TTL for key ${key}:`, error)
      return -2
    }
  }

  /**
   * Update TTL for an existing key
   */
  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      const result = await redis.expire(key, ttl)
      return result === 1
    } catch (error) {
      console.error(`[Cache] Error setting expiry for key ${key}:`, error)
      return false
    }
  }

  /**
   * Invalidate cache by pattern (e.g., "user:*:123")
   * WARNING: Uses KEYS command which can be slow on large datasets
   * Consider using Redis SCAN in production for large key sets
   */
  async invalidatePattern(pattern: string): Promise<number> {
    try {
      const keys = await redis.keys(pattern)
      
      if (keys.length === 0) {
        return 0
      }
      
      return await this.mdelete(keys)
    } catch (error) {
      console.error(`[Cache] Error invalidating pattern ${pattern}:`, error)
      cacheStats.errors++
      return 0
    }
  }

  /**
   * Scan keys matching a pattern (production-safe alternative to KEYS)
   * Returns keys in batches to avoid blocking
   */
  async scanPattern(pattern: string, count: number = 100): Promise<string[]> {
    const keys: string[] = []
    let cursor = '0'
    
    try {
      do {
        const [newCursor, matchedKeys] = await redis.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          count
        )
        cursor = newCursor
        keys.push(...matchedKeys)
      } while (cursor !== '0')
      
      return keys
    } catch (error) {
      console.error(`[Cache] Error scanning pattern ${pattern}:`, error)
      cacheStats.errors++
      return keys
    }
  }

  /**
   * Increment a counter in cache
   * Useful for rate limiting, statistics, etc.
   */
  async increment(key: string, amount: number = 1): Promise<number> {
    try {
      const result = await redis.incrby(key, amount)
      cacheStats.totalOperations++
      return result
    } catch (error) {
      console.error(`[Cache] Error incrementing key ${key}:`, error)
      cacheStats.errors++
      return 0
    }
  }

  /**
   * Decrement a counter in cache
   */
  async decrement(key: string, amount: number = 1): Promise<number> {
    try {
      const result = await redis.decrby(key, amount)
      cacheStats.totalOperations++
      return result
    } catch (error) {
      console.error(`[Cache] Error decrementing key ${key}:`, error)
      cacheStats.errors++
      return 0
    }
  }

  /**
   * Set a value only if it doesn't exist (NX - Not eXists)
   * Useful for distributed locks
   */
  async setnx(key: string, value: unknown, ttl?: number): Promise<boolean> {
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value)
      
      if (ttl) {
        const result = await redis.set(key, serialized, 'EX', ttl, 'NX')
        return result === 'OK'
      } else {
        const result = await redis.setnx(key, serialized)
        return result === 1
      }
    } catch (error) {
      console.error(`[Cache] Error in setnx for key ${key}:`, error)
      cacheStats.errors++
      return false
    }
  }

  /**
   * Get and update statistics
   */
  private updateHitRate(): void {
    const total = cacheStats.hits + cacheStats.misses
    cacheStats.hitRate = total > 0 ? (cacheStats.hits / total) * 100 : 0
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...cacheStats }
  }

  /**
   * Reset cache statistics (for testing)
   */
  resetStats(): void {
    cacheStats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      totalOperations: 0,
      hitRate: 0,
    }
  }

  /**
   * Log cache statistics
   */
  logStats(): void {
    console.log('📊 Cache Statistics:', JSON.stringify(cacheStats, null, 2))
  }

  /**
   * Flush all cache data (use with caution!)
   */
  async flush(): Promise<boolean> {
    if (process.env.NODE_ENV === 'production') {
      console.error('[Cache] Cannot flush cache in production')
      return false
    }
    
    try {
      await redis.flushdb()
      console.log('[Cache] Cache flushed')
      return true
    } catch (error) {
      console.error('[Cache] Error flushing cache:', error)
      cacheStats.errors++
      return false
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService()

// Export class for testing
export { CacheService }
