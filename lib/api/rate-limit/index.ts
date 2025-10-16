/**
 * Rate Limiting Module
 * 
 * Public exports for rate limiting functionality.
 * 
 * @module lib/api/rate-limit
 */

// Core
export {
  RateLimiter,
  createRateLimiter,
  type RateLimitResult,
} from './limiter';

// Storage
export {
  MemoryRateLimitStore,
  RedisRateLimitStore,
  createRateLimitStore,
  type RateLimitStore,
  type RateLimitRecord,
} from './store';

// Configuration
export {
  DEFAULT_RATE_LIMITS,
  ROLE_MULTIPLIERS,
  ROUTE_RATE_LIMITS,
  getRateLimitConfig,
  getRateLimitKey,
  shouldSkipRateLimit,
  type RateLimitConfig,
  type UserRole,
} from './config';

// Middleware
export {
  withRateLimit,
  createRateLimitMiddleware,
  resetRateLimit,
  clearAllRateLimits,
  type RateLimitOptions,
  type RouteHandler,
} from './middleware';
