/**
 * Rate Limiting Middleware
 * 
 * Express/Next.js middleware for automatic rate limiting.
 * Integrates with Phase 1 response formatters.
 * 
 * @module lib/api/rate-limit/middleware
 */

import { NextRequest, NextResponse } from 'next/server';
import { createResponseFormatter } from '../response-formatter';
import { RateLimiter } from './limiter';
import { createRateLimitStore } from './store';
import { getRateLimitConfig, getRateLimitKey, shouldSkipRateLimit, type UserRole } from './config';
import type { RateLimitConfig } from './config';

// Global rate limiter instance (singleton)
let globalRateLimiter: RateLimiter | null = null;

/**
 * Get or create global rate limiter instance
 */
function getRateLimiter(): RateLimiter {
  if (!globalRateLimiter) {
    const store = createRateLimitStore();
    globalRateLimiter = new RateLimiter(store);
  }
  return globalRateLimiter;
}

/**
 * Rate limit options for middleware
 */
export interface RateLimitOptions {
  /**
   * Custom rate limit configuration
   * Overrides default config for the route
   */
  config?: RateLimitConfig;

  /**
   * Key generator function
   * Default: uses IP address
   */
  keyGenerator?: (request: NextRequest) => string | Promise<string>;

  /**
   * User role extractor
   * Used to apply role-based multipliers
   */
  getUserRole?: (request: NextRequest) => UserRole | Promise<UserRole | undefined>;

  /**
   * Skip function
   * Return true to skip rate limiting for specific requests
   */
  skip?: (request: NextRequest) => boolean | Promise<boolean>;

  /**
   * Custom handler for rate limit exceeded
   */
  onRateLimitExceeded?: (request: NextRequest, retryAfter: number) => NextResponse | Promise<NextResponse>;
}

/**
 * Route handler type
 */
export type RouteHandler = (
  request: NextRequest,
  context?: { params: Record<string, string> }
) => Promise<NextResponse> | NextResponse;

/**
 * Extract IP address from request
 */
function getClientIdentifier(request: NextRequest): string {
  // Check common headers for IP
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to a default for development
  return 'unknown-ip';
}

/**
 * Apply rate limiting to a route handler
 * 
 * @param options - Rate limit options
 * @returns Middleware wrapper function
 * 
 * @example
 * ```typescript
 * import { withRateLimit } from '@/lib/api/rate-limit/middleware';
 * 
 * export const POST = withRateLimit({
 *   config: {
 *     windowMs: 60 * 1000, // 1 minute
 *     max: 10, // 10 requests per minute
 *   },
 * })(async (request) => {
 *   // Your handler code
 *   return NextResponse.json({ success: true });
 * });
 * ```
 */
export function withRateLimit(options: RateLimitOptions = {}) {
  return function (handler: RouteHandler) {
    return async function (
      request: NextRequest,
      context?: { params: Record<string, string> }
    ): Promise<NextResponse> {
      const formatter = createResponseFormatter(request);
      const limiter = getRateLimiter();
      const url = new URL(request.url);
      const path = url.pathname;

      try {
        // Check if rate limiting should be skipped
        if (options.skip && (await options.skip(request))) {
          return await handler(request, context);
        }

        if (shouldSkipRateLimit(path) && !options.config) {
          return await handler(request, context);
        }

        // Get rate limit configuration
        const userRole = options.getUserRole ? await options.getUserRole(request) : undefined;
        const config = options.config || getRateLimitConfig(path, userRole);

        // Generate rate limit key
        const identifier = options.keyGenerator
          ? await options.keyGenerator(request)
          : getClientIdentifier(request);
        
        const key = getRateLimitKey(identifier, path, userRole ? 'user' : 'ip');

        // Check rate limit
        const result = await limiter.check(key, config);

        // Add rate limit headers to response
        const addRateLimitHeaders = (response: NextResponse): NextResponse => {
          response.headers.set('X-RateLimit-Limit', result.limit.toString());
          response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
          response.headers.set('X-RateLimit-Reset', result.reset.toString());
          
          if (!result.allowed) {
            response.headers.set('Retry-After', result.retryAfter.toString());
          }
          
          return response;
        };

        // If rate limit exceeded
        if (!result.allowed) {
          if (options.onRateLimitExceeded) {
            const response = await options.onRateLimitExceeded(request, result.retryAfter);
            return addRateLimitHeaders(response);
          }

          // Create rate limit response
          const baseResponse = formatter.rateLimit(result.retryAfter);
          
          // Convert to NextResponse and add rate limit headers
          const response = new NextResponse(baseResponse.body, {
            status: baseResponse.status,
            statusText: baseResponse.statusText,
            headers: baseResponse.headers,
          });
          
          response.headers.set('X-RateLimit-Limit', result.limit.toString());
          response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
          response.headers.set('X-RateLimit-Reset', result.reset.toString());
          response.headers.set('Retry-After', result.retryAfter.toString());
          
          return response;
        }

        // Call handler and add headers
        const response = await handler(request, context);
        return addRateLimitHeaders(response);
      } catch (error) {
        console.error('Rate limit middleware error:', error);
        // On error, allow request to proceed (fail open)
        return await handler(request, context);
      }
    };
  };
}

/**
 * Create a rate limit middleware with specific configuration
 * 
 * @example
 * ```typescript
 * // Create a strict rate limiter for auth endpoints
 * const authRateLimit = createRateLimitMiddleware({
 *   windowMs: 15 * 60 * 1000, // 15 minutes
 *   max: 5, // 5 attempts
 * });
 * 
 * export const POST = authRateLimit(async (request) => {
 *   // Login handler
 * });
 * ```
 */
export function createRateLimitMiddleware(config: RateLimitConfig) {
  return withRateLimit({ config });
}

/**
 * Reset rate limit for a specific key
 * Useful for testing or administrative overrides
 */
export async function resetRateLimit(identifier: string, path: string): Promise<void> {
  const limiter = getRateLimiter();
  const key = getRateLimitKey(identifier, path);
  await limiter.reset(key);
}

/**
 * Clear all rate limits
 * Useful for testing
 */
export async function clearAllRateLimits(): Promise<void> {
  const limiter = getRateLimiter();
  await limiter.clearAll();
}
