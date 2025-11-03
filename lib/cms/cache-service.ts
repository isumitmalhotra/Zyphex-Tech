/**
 * CMS Caching Service
 * 
 * Provides comprehensive caching layer for improved performance:
 * - In-memory caching (Node.js Map)
 * - Redis caching (optional)
 * - Cache invalidation strategies
 * - TTL (Time-To-Live) management
 * - Cache warming
 * - Cache statistics
 */

// ============================================================================
// Type Definitions
// ============================================================================

export interface CacheOptions {
  ttl?: number; // Time-to-live in seconds (default: 300)
  tags?: string[]; // Cache tags for group invalidation
}

export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  tags: string[];
  createdAt: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  size: number;
  hitRate: number;
}

export type CacheKey = string;

// ============================================================================
// In-Memory Cache Implementation
// ============================================================================

class InMemoryCache {
  private cache: Map<CacheKey, CacheEntry<unknown>>;
  private stats: CacheStats;
  private readonly maxSize: number;

  constructor(maxSize = 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      size: 0,
      hitRate: 0,
    };

    // Start cleanup interval (every minute)
    this.startCleanup();
  }

  /**
   * Get value from cache
   */
  async get<T>(key: CacheKey): Promise<T | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.deletes++;
      this.updateStats();
      return null;
    }

    this.stats.hits++;
    this.updateHitRate();
    return entry.value as T;
  }

  /**
   * Set value in cache
   */
  async set<T>(key: CacheKey, value: T, options: CacheOptions = {}): Promise<void> {
    const ttl = options.ttl || 300; // Default 5 minutes
    const tags = options.tags || [];

    // Enforce max size (LRU-like behavior)
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    const entry: CacheEntry<T> = {
      value,
      expiresAt: Date.now() + ttl * 1000,
      tags,
      createdAt: Date.now(),
    };

    this.cache.set(key, entry as CacheEntry<unknown>);
    this.stats.sets++;
    this.updateStats();
  }

  /**
   * Delete value from cache
   */
  async delete(key: CacheKey): Promise<void> {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
      this.updateStats();
    }
  }

  /**
   * Delete all entries with specific tag
   */
  async deleteByTag(tag: string): Promise<number> {
    let count = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.includes(tag)) {
        this.cache.delete(key);
        count++;
      }
    }

    this.stats.deletes += count;
    this.updateStats();
    return count;
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    const size = this.cache.size;
    this.cache.clear();
    this.stats.deletes += size;
    this.updateStats();
  }

  /**
   * Check if key exists
   */
  async has(key: CacheKey): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      size: this.cache.size,
      hitRate: 0,
    };
  }

  /**
   * Update statistics
   */
  private updateStats(): void {
    this.stats.size = this.cache.size;
  }

  /**
   * Update hit rate
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  /**
   * Start cleanup interval to remove expired entries
   */
  private startCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      let removed = 0;

      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.expiresAt) {
          this.cache.delete(key);
          removed++;
        }
      }

      if (removed > 0) {
        this.stats.deletes += removed;
        this.updateStats();
      }
    }, 60000); // Every minute
  }
}

// ============================================================================
// Redis Cache Implementation (Optional)
// ============================================================================

class RedisCache {
  private client: unknown | null = null;
  private connected = false;

  constructor() {
    // Initialize Redis client if available
    this.initializeRedis();
  }

  private async initializeRedis(): Promise<void> {
    try {
      // Only initialize if REDIS_URL is configured
      const redisUrl = process.env.REDIS_URL;
      if (!redisUrl) {
        console.log('[Cache] Redis not configured, using in-memory cache');
        return;
      }

      // Note: Redis is an optional dependency
      // Install with: npm install redis
      // For now, Redis support is disabled until dependency is installed
      console.log('[Cache] Redis support disabled - install redis package to enable');
      this.connected = false;
      
      // Uncomment when redis is installed:
      // const { createClient } = await import('redis');
      // this.client = createClient({ url: redisUrl });
      // await this.client.connect();
      // this.connected = true;
      // console.log('[Cache] Redis connected successfully');
    } catch (error) {
      console.warn('[Cache] Redis initialization failed:', error);
      this.connected = false;
    }
  }

  async get<T>(key: CacheKey): Promise<T | null> {
    if (!this.connected || !this.client) return null;

    try {
      // @ts-expect-error - Redis client types
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('[Cache] Redis get error:', error);
      return null;
    }
  }

  async set<T>(key: CacheKey, value: T, options: CacheOptions = {}): Promise<void> {
    if (!this.connected || !this.client) return;

    try {
      const ttl = options.ttl || 300;
      const stringValue = JSON.stringify(value);

      // @ts-expect-error - Redis client types
      await this.client.setEx(key, ttl, stringValue);

      // Store tags for invalidation
      if (options.tags && options.tags.length > 0) {
        for (const tag of options.tags) {
          // @ts-expect-error - Redis client types
          await this.client.sAdd(`tag:${tag}`, key);
          // @ts-expect-error - Redis client types
          await this.client.expire(`tag:${tag}`, ttl);
        }
      }
    } catch (error) {
      console.error('[Cache] Redis set error:', error);
    }
  }

  async delete(key: CacheKey): Promise<void> {
    if (!this.connected || !this.client) return;

    try {
      // @ts-expect-error - Redis client types
      await this.client.del(key);
    } catch (error) {
      console.error('[Cache] Redis delete error:', error);
    }
  }

  async deleteByTag(tag: string): Promise<number> {
    if (!this.connected || !this.client) return 0;

    try {
      // @ts-expect-error - Redis client types
      const keys = await this.client.sMembers(`tag:${tag}`);
      
      if (keys.length > 0) {
        // @ts-expect-error - Redis client types
        await this.client.del(keys);
        // @ts-expect-error - Redis client types
        await this.client.del(`tag:${tag}`);
      }

      return keys.length;
    } catch (error) {
      console.error('[Cache] Redis deleteByTag error:', error);
      return 0;
    }
  }

  async clear(): Promise<void> {
    if (!this.connected || !this.client) return;

    try {
      // @ts-expect-error - Redis client types
      await this.client.flushDb();
    } catch (error) {
      console.error('[Cache] Redis clear error:', error);
    }
  }

  async has(key: CacheKey): Promise<boolean> {
    if (!this.connected || !this.client) return false;

    try {
      // @ts-expect-error - Redis client types
      const exists = await this.client.exists(key);
      return exists === 1;
    } catch (error) {
      console.error('[Cache] Redis has error:', error);
      return false;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }
}

// ============================================================================
// Unified Cache Manager
// ============================================================================

class CacheManager {
  private inMemoryCache: InMemoryCache;
  private redisCache: RedisCache;

  constructor() {
    this.inMemoryCache = new InMemoryCache(1000);
    this.redisCache = new RedisCache();
  }

  /**
   * Get value from cache (tries Redis first, then in-memory)
   */
  async get<T>(key: CacheKey): Promise<T | null> {
    // Try Redis first
    if (this.redisCache.isConnected()) {
      const value = await this.redisCache.get<T>(key);
      if (value !== null) {
        return value;
      }
    }

    // Fallback to in-memory
    return this.inMemoryCache.get<T>(key);
  }

  /**
   * Set value in cache (both Redis and in-memory)
   */
  async set<T>(key: CacheKey, value: T, options: CacheOptions = {}): Promise<void> {
    // Set in both caches
    await Promise.all([
      this.redisCache.set(key, value, options),
      this.inMemoryCache.set(key, value, options),
    ]);
  }

  /**
   * Delete value from cache
   */
  async delete(key: CacheKey): Promise<void> {
    await Promise.all([
      this.redisCache.delete(key),
      this.inMemoryCache.delete(key),
    ]);
  }

  /**
   * Delete all entries with specific tag
   */
  async deleteByTag(tag: string): Promise<number> {
    const [redisCount, memoryCount] = await Promise.all([
      this.redisCache.deleteByTag(tag),
      this.inMemoryCache.deleteByTag(tag),
    ]);
    return Math.max(redisCount, memoryCount);
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    await Promise.all([
      this.redisCache.clear(),
      this.inMemoryCache.clear(),
    ]);
  }

  /**
   * Check if key exists
   */
  async has(key: CacheKey): Promise<boolean> {
    if (this.redisCache.isConnected()) {
      return this.redisCache.has(key);
    }
    return this.inMemoryCache.has(key);
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return this.inMemoryCache.getStats();
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.inMemoryCache.resetStats();
  }

  /**
   * Check if Redis is connected
   */
  isRedisConnected(): boolean {
    return this.redisCache.isConnected();
  }
}

// ============================================================================
// Cache Helper Functions
// ============================================================================

/**
 * Generate cache key from parts
 */
export function generateCacheKey(...parts: (string | number)[]): CacheKey {
  return `cms:${parts.join(':')}`;
}

/**
 * Wrap function with caching
 */
export async function withCache<T>(
  key: CacheKey,
  fn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  // Check cache first
  const cached = await cacheManager.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Execute function
  const result = await fn();

  // Store in cache
  await cacheManager.set(key, result, options);

  return result;
}

/**
 * Invalidate cache by pattern (tag-based)
 */
export async function invalidateCache(...tags: string[]): Promise<void> {
  for (const tag of tags) {
    await cacheManager.deleteByTag(tag);
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

const cacheManager = new CacheManager();

export default cacheManager;

// Export specific methods
export const {
  get: getCache,
  set: setCache,
  delete: deleteCache,
  deleteByTag: deleteCacheByTag,
  clear: clearCache,
  has: hasCache,
  getStats: getCacheStats,
  resetStats: resetCacheStats,
} = cacheManager;
