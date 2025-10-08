import NodeCache from 'node-cache';

// In-memory cache as fallback when Redis is not available
const memoryCache = new NodeCache({
  stdTTL: 300, // 5 minutes default TTL
  checkperiod: 60, // Check for expired keys every minute
  useClones: false, // Don't clone objects (better performance)
});

export interface CacheAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<boolean>;
  delete(key: string): Promise<boolean>;
  deletePattern(pattern: string): Promise<boolean>;
  clear(): Promise<boolean>;
  isHealthy(): Promise<boolean>;
}

export class MemoryCacheAdapter implements CacheAdapter {
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = memoryCache.get<T>(key);
      return value || null;
    } catch (error) {
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl: number = 300): Promise<boolean> {
    try {
      return memoryCache.set(key, value, ttl);
    } catch (error) {
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      return memoryCache.del(key) > 0;
    } catch (error) {
      return false;
    }
  }

  async deletePattern(pattern: string): Promise<boolean> {
    try {
      // Convert Redis pattern to JavaScript regex
      const regexPattern = pattern
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.');
      
      const regex = new RegExp(`^${regexPattern}$`);
      const keys = memoryCache.keys().filter(key => regex.test(key));
      
      if (keys.length > 0) {
        memoryCache.del(keys);
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  async clear(): Promise<boolean> {
    try {
      memoryCache.flushAll();
      return true;
    } catch (error) {
      return false;
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      // Simple health check - try to set and get a test value
      const testKey = '__health_check__';
      const testValue = Date.now();
      
      await this.set(testKey, testValue, 1);
      const result = await this.get<number>(testKey);
      await this.delete(testKey);
      
      return result === testValue;
    } catch {
      return false;
    }
  }
}

// Singleton instance
export const memoryCacheAdapter = new MemoryCacheAdapter();

// Cache statistics
export function getCacheStats() {
  return {
    keys: memoryCache.getStats().keys,
    hits: memoryCache.getStats().hits,
    misses: memoryCache.getStats().misses,
    ksize: memoryCache.getStats().ksize,
    vsize: memoryCache.getStats().vsize,
  };
}

// Clear all cached data
export function clearMemoryCache(): void {
  memoryCache.flushAll();
}

// Set cache configuration
export function configureCacheMemory(options: {
  stdTTL?: number;
  maxKeys?: number;
}): void {
  if (options.stdTTL) {
    memoryCache.options.stdTTL = options.stdTTL;
  }
  
  if (options.maxKeys) {
    memoryCache.options.maxKeys = options.maxKeys;
  }
}