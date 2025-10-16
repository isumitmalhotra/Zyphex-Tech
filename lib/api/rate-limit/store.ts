/**
 * Rate Limit Storage Interface
 * 
 * Abstract storage layer for rate limiting.
 * Supports both in-memory (development) and Redis (production).
 * 
 * @module lib/api/rate-limit/store
 */

/**
 * Rate limit record stored for each key
 */
export interface RateLimitRecord {
  /**
   * Number of requests made in current window
   */
  count: number;

  /**
   * Timestamp when the window resets (Unix timestamp in ms)
   */
  resetTime: number;

  /**
   * When this record was first created (Unix timestamp in ms)
   */
  firstRequestTime: number;
}

/**
 * Rate limit storage interface
 */
export interface RateLimitStore {
  /**
   * Get rate limit record for a key
   */
  get(key: string): Promise<RateLimitRecord | null>;

  /**
   * Set rate limit record for a key
   */
  set(key: string, record: RateLimitRecord, ttlMs: number): Promise<void>;

  /**
   * Increment count for a key
   * Returns the new count
   */
  increment(key: string): Promise<number>;

  /**
   * Delete rate limit record for a key
   */
  delete(key: string): Promise<void>;

  /**
   * Clear all rate limit records (useful for testing)
   */
  clear(): Promise<void>;
}

/**
 * In-Memory Rate Limit Store
 * 
 * Simple in-memory implementation for development and testing.
 * Uses Map for storage with automatic cleanup of expired records.
 */
export class MemoryRateLimitStore implements RateLimitStore {
  private store: Map<string, RateLimitRecord>;
  private cleanupInterval: NodeJS.Timeout | null;

  constructor() {
    this.store = new Map();
    this.cleanupInterval = null;
    this.startCleanup();
  }

  /**
   * Start periodic cleanup of expired records
   */
  private startCleanup(): void {
    // Clean up expired records every minute
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, record] of this.store.entries()) {
        if (record.resetTime < now) {
          this.store.delete(key);
        }
      }
    }, 60 * 1000);

    // Don't prevent Node.js from exiting
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Stop cleanup interval (useful for testing)
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  async get(key: string): Promise<RateLimitRecord | null> {
    const record = this.store.get(key);
    
    // Return null if expired
    if (record && record.resetTime < Date.now()) {
      this.store.delete(key);
      return null;
    }

    return record || null;
  }

  async set(key: string, record: RateLimitRecord, _ttlMs: number): Promise<void> {
    this.store.set(key, record);
  }

  async increment(key: string): Promise<number> {
    const record = await this.get(key);
    
    if (!record) {
      throw new Error('Record not found. Create record before incrementing.');
    }

    record.count += 1;
    await this.set(key, record, record.resetTime - Date.now());
    
    return record.count;
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }

  /**
   * Get current store size (useful for debugging)
   */
  size(): number {
    return this.store.size;
  }
}

/**
 * Redis client interface (minimal)
 */
interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: { EX?: number }): Promise<void>;
  del(key: string): Promise<void>;
  flushDb(): Promise<void>;
}

/**
 * Redis Rate Limit Store (Placeholder)
 * 
 * Production-ready Redis implementation.
 * Requires redis client to be configured.
 * 
 * @example
 * ```typescript
 * import { createClient } from 'redis';
 * 
 * const redisClient = createClient({ url: process.env.REDIS_URL });
 * await redisClient.connect();
 * 
 * const store = new RedisRateLimitStore(redisClient);
 * ```
 */
export class RedisRateLimitStore implements RateLimitStore {
  private client: RedisClient;

  constructor(redisClient: RedisClient) {
    this.client = redisClient;
  }

  async get(key: string): Promise<RateLimitRecord | null> {
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  async set(key: string, record: RateLimitRecord, ttlMs: number): Promise<void> {
    const ttlSeconds = Math.ceil(ttlMs / 1000);
    await this.client.set(key, JSON.stringify(record), {
      EX: ttlSeconds,
    });
  }

  async increment(key: string): Promise<number> {
    const record = await this.get(key);
    
    if (!record) {
      throw new Error('Record not found. Create record before incrementing.');
    }

    record.count += 1;
    await this.set(key, record, record.resetTime - Date.now());
    
    return record.count;
  }

  async delete(key: string): Promise<void> {
    await this.client.del(key);
  }

  async clear(): Promise<void> {
    // Note: This clears ALL keys in Redis, use with caution
    await this.client.flushDb();
  }
}

/**
 * Create default rate limit store
 * Uses in-memory store by default, can be configured to use Redis
 */
export function createRateLimitStore(): RateLimitStore {
  // For now, always use in-memory store
  // In production, you could check for REDIS_URL and use Redis instead
  return new MemoryRateLimitStore();
}
