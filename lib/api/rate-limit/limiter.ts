/**
 * Rate Limiter Core
 * 
 * Token bucket based rate limiting implementation.
 * Supports sliding window counters for accurate rate limiting.
 * 
 * @module lib/api/rate-limit/limiter
 */

import type { RateLimitStore } from './store';
import type { RateLimitConfig } from './config';

/**
 * Rate limit check result
 */
export interface RateLimitResult {
  /**
   * Whether the request is allowed
   */
  allowed: boolean;

  /**
   * Maximum requests allowed in the window
   */
  limit: number;

  /**
   * Remaining requests in current window
   */
  remaining: number;

  /**
   * When the rate limit resets (Unix timestamp in seconds)
   */
  reset: number;

  /**
   * Seconds until rate limit resets
   */
  retryAfter: number;
}

/**
 * Rate Limiter
 * 
 * Implements sliding window rate limiting using a storage backend.
 * Thread-safe and supports both in-memory and Redis storage.
 */
export class RateLimiter {
  private store: RateLimitStore;

  constructor(store: RateLimitStore) {
    this.store = store;
  }

  /**
   * Check if a request is allowed under rate limits
   * 
   * @param key - Unique identifier for the rate limit (e.g., IP:route)
   * @param config - Rate limit configuration
   * @returns Rate limit result
   */
  async check(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    const now = Date.now();
    const { windowMs, max } = config;

    // Get existing record
    let record = await this.store.get(key);

    // Create new record if none exists or if window has expired
    if (!record || record.resetTime <= now) {
      record = {
        count: 1,
        resetTime: now + windowMs,
        firstRequestTime: now,
      };
      await this.store.set(key, record, windowMs);

      return {
        allowed: true,
        limit: max,
        remaining: max - 1,
        reset: Math.floor(record.resetTime / 1000),
        retryAfter: 0,
      };
    }

    // Check if limit exceeded
    if (record.count >= max) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);

      return {
        allowed: false,
        limit: max,
        remaining: 0,
        reset: Math.floor(record.resetTime / 1000),
        retryAfter,
      };
    }

    // Increment count
    record.count += 1;
    await this.store.set(key, record, record.resetTime - now);

    return {
      allowed: true,
      limit: max,
      remaining: max - record.count,
      reset: Math.floor(record.resetTime / 1000),
      retryAfter: 0,
    };
  }

  /**
   * Reset rate limit for a key
   * Useful for testing or manual overrides
   */
  async reset(key: string): Promise<void> {
    await this.store.delete(key);
  }

  /**
   * Get current rate limit status without incrementing
   */
  async getStatus(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    const now = Date.now();
    const { max } = config;

    const record = await this.store.get(key);

    if (!record || record.resetTime <= now) {
      return {
        allowed: true,
        limit: max,
        remaining: max,
        reset: Math.floor((now + config.windowMs) / 1000),
        retryAfter: 0,
      };
    }

    const remaining = Math.max(0, max - record.count);
    const retryAfter = record.count >= max
      ? Math.ceil((record.resetTime - now) / 1000)
      : 0;

    return {
      allowed: record.count < max,
      limit: max,
      remaining,
      reset: Math.floor(record.resetTime / 1000),
      retryAfter,
    };
  }

  /**
   * Clear all rate limits
   * Useful for testing
   */
  async clearAll(): Promise<void> {
    await this.store.clear();
  }
}

/**
 * Create a rate limiter instance
 */
export function createRateLimiter(store: RateLimitStore): RateLimiter {
  return new RateLimiter(store);
}
