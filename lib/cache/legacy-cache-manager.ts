/**
 * Legacy Cache Manager
 * Provides backwards compatibility for old cache API
 */

import { getRedisClient } from './redis'
import { getMemoryCache } from './memory-cache'

interface CacheAdapter {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, ttl?: number): Promise<boolean>
  delete(key: string): Promise<boolean>
  deletePattern(pattern: string): Promise<boolean>
  clear(): Promise<boolean>
  isHealthy(): Promise<boolean>
}

const memoryCacheAdapter: CacheAdapter = {
  async get<T>(key: string): Promise<T | null> {
    const memCache = getMemoryCache()
    return memCache.get<T>(key)
  },

  async set<T>(key: string, value: T, ttl: number = 300): Promise<boolean> {
    const memCache = getMemoryCache()
    return memCache.set(key, value, ttl)
  },

  async delete(key: string): Promise<boolean> {
    const memCache = getMemoryCache()
    return memCache.delete(key)
  },

  async deletePattern(_pattern: string): Promise<boolean> {
    const memCache = getMemoryCache()
    // Pattern matching not fully supported, clear all as fallback
    memCache.clear()
    return true
  },

  async clear(): Promise<boolean> {
    const memCache = getMemoryCache()
    memCache.clear()
    return true
  },

  async isHealthy(): Promise<boolean> {
    return true
  }
}

// Cache manager that uses Redis with memory fallback
class CacheManager {
  private primaryCache: CacheAdapter | null = null
  private fallbackCache: CacheAdapter = memoryCacheAdapter

  async getCache(): Promise<CacheAdapter> {
    // Try to use Redis first
    const redis = getRedisClient()
    if (redis && await this.isRedisHealthy()) {
      return this.getRedisAdapter()
    }
    
    // Fallback to memory cache
    return this.fallbackCache
  }

  private async isRedisHealthy(): Promise<boolean> {
    try {
      const redis = getRedisClient()
      if (!redis) return false
      
      await redis.ping()
      return true
    } catch {
      return false
    }
  }

  private getRedisAdapter(): CacheAdapter {
    const redis = getRedisClient()
    if (!redis) throw new Error('Redis client not available')

    return {
      async get<T>(key: string): Promise<T | null> {
        try {
          const result = await redis.get(key)
          return result ? JSON.parse(result) : null
        } catch {
          return null
        }
      },

      async set<T>(key: string, value: T, ttl: number = 300): Promise<boolean> {
        try {
          await redis.setex(key, ttl, JSON.stringify(value))
          return true
        } catch {
          return false
        }
      },

      async delete(key: string): Promise<boolean> {
        try {
          await redis.del(key)
          return true
        } catch {
          return false
        }
      },

      async deletePattern(pattern: string): Promise<boolean> {
        try {
          const keys = await redis.keys(pattern)
          if (keys.length > 0) {
            await redis.del(...keys)
          }
          return true
        } catch {
          return false
        }
      },

      async clear(): Promise<boolean> {
        try {
          await redis.flushdb()
          return true
        } catch {
          return false
        }
      },

      async isHealthy(): Promise<boolean> {
        try {
          await redis.ping()
          return true
        } catch {
          return false
        }
      }
    }
  }

  // High-level cache operations
  async get<T>(key: string): Promise<T | null> {
    const cache = await this.getCache()
    return cache.get<T>(key)
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    const cache = await this.getCache()
    return cache.set(key, value, ttl)
  }

  async delete(key: string): Promise<boolean> {
    // Try to delete from both caches
    const cache = await this.getCache()
    const primaryResult = await cache.delete(key)
    
    // Also delete from fallback if we're using Redis
    if (cache !== this.fallbackCache) {
      await this.fallbackCache.delete(key)
    }
    
    return primaryResult
  }

  async deletePattern(pattern: string): Promise<boolean> {
    const cache = await this.getCache()
    const primaryResult = await cache.deletePattern(pattern)
    
    // Also delete from fallback if we're using Redis
    if (cache !== this.fallbackCache) {
      await this.fallbackCache.deletePattern(pattern)
    }
    
    return primaryResult
  }

  async clear(): Promise<boolean> {
    const cache = await this.getCache()
    const primaryResult = await cache.clear()
    
    // Also clear fallback
    await this.fallbackCache.clear()
    
    return primaryResult
  }

  async getStatus(): Promise<{
    primary: { type: 'redis' | 'memory'; healthy: boolean }
    fallback: { type: 'memory'; healthy: boolean }
  }> {
    const redisHealthy = await this.isRedisHealthy()
    const memoryHealthy = await this.fallbackCache.isHealthy()
    
    return {
      primary: {
        type: redisHealthy ? 'redis' : 'memory',
        healthy: redisHealthy || memoryHealthy
      },
      fallback: {
        type: 'memory',
        healthy: memoryHealthy
      }
    }
  }
}

// Singleton instance
export const cacheManager = new CacheManager()
