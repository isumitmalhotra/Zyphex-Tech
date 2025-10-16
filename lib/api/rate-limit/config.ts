/**
 * Rate Limiting Configuration
 * 
 * Centralized configuration for rate limiting across the API.
 * Supports per-route, per-role, and global limits.
 * 
 * @module lib/api/rate-limit/config
 */

/**
 * Rate limit configuration for a specific endpoint or category
 */
export interface RateLimitConfig {
  /**
   * Time window in milliseconds
   */
  windowMs: number;

  /**
   * Maximum number of requests per window
   */
  max: number;

  /**
   * Optional message to return when rate limit is exceeded
   */
  message?: string;

  /**
   * Whether to skip rate limiting for this route
   */
  skip?: boolean;
}

/**
 * User role type
 */
export type UserRole = 'ADMIN' | 'MANAGER' | 'MEMBER' | 'GUEST';

/**
 * Default rate limits by category
 */
export const DEFAULT_RATE_LIMITS = {
  /**
   * Global catch-all rate limit
   * Applied to all routes unless overridden
   */
  global: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requests per 15 minutes
    message: 'Too many requests, please try again later',
  },

  /**
   * Authentication endpoints
   * Stricter limits to prevent brute force attacks
   */
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 attempts per 15 minutes
    message: 'Too many authentication attempts, please try again later',
  },

  /**
   * Standard API endpoints
   * Moderate limits for normal API usage
   */
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes
    message: 'API rate limit exceeded, please slow down',
  },

  /**
   * Heavy operations (file uploads, bulk operations)
   * More restrictive limits
   */
  heavy: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // 50 requests per hour
    message: 'Too many resource-intensive requests, please try again later',
  },

  /**
   * Webhook endpoints
   * High limits for webhook callbacks
   */
  webhook: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 300, // 300 requests per minute
    message: 'Webhook rate limit exceeded',
  },

  /**
   * Public endpoints (health checks, status)
   * Very high limits
   */
  public: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    skip: false,
  },
} as const;

/**
 * Role-based rate limit multipliers
 * Applied on top of base limits
 */
export const ROLE_MULTIPLIERS: Record<UserRole, number> = {
  ADMIN: 10, // 10x normal limit
  MANAGER: 5, // 5x normal limit
  MEMBER: 1, // Normal limit
  GUEST: 0.5, // Half normal limit
};

/**
 * Per-route rate limit configurations
 * Override default limits for specific routes
 */
export const ROUTE_RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Authentication routes
  '/api/auth/login': DEFAULT_RATE_LIMITS.auth,
  '/api/auth/register': DEFAULT_RATE_LIMITS.auth,
  '/api/auth/forgot-password': {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 password reset requests per hour
    message: 'Too many password reset requests, please try again later',
  },
  '/api/auth/verify-email': DEFAULT_RATE_LIMITS.auth,

  // API routes (standard limits)
  '/api/users': DEFAULT_RATE_LIMITS.api,
  '/api/teams': DEFAULT_RATE_LIMITS.api,
  '/api/projects': DEFAULT_RATE_LIMITS.api,
  '/api/messages': DEFAULT_RATE_LIMITS.api,

  // Heavy operations
  '/api/upload': DEFAULT_RATE_LIMITS.heavy,
  '/api/export': DEFAULT_RATE_LIMITS.heavy,
  '/api/import': DEFAULT_RATE_LIMITS.heavy,
  '/api/bulk': DEFAULT_RATE_LIMITS.heavy,

  // Public endpoints
  '/api/health': {
    windowMs: 1 * 60 * 1000,
    max: 1000,
    skip: false,
  },
  '/api/status': {
    windowMs: 1 * 60 * 1000,
    max: 1000,
    skip: false,
  },
};

/**
 * Get rate limit configuration for a route
 * 
 * @param path - The route path
 * @param userRole - Optional user role for multiplier
 * @returns Rate limit configuration
 */
export function getRateLimitConfig(
  path: string,
  userRole?: UserRole
): RateLimitConfig {
  // Check for exact route match
  let config = ROUTE_RATE_LIMITS[path];

  // Check for pattern match (e.g., /api/users/:id)
  if (!config) {
    for (const [routePattern, routeConfig] of Object.entries(ROUTE_RATE_LIMITS)) {
      if (matchRoute(path, routePattern)) {
        config = routeConfig;
        break;
      }
    }
  }

  // Fall back to default based on path prefix
  if (!config) {
    if (path.startsWith('/api/auth')) {
      config = DEFAULT_RATE_LIMITS.auth;
    } else if (path.startsWith('/api/upload') || path.startsWith('/api/export')) {
      config = DEFAULT_RATE_LIMITS.heavy;
    } else if (path.startsWith('/api/webhook')) {
      config = DEFAULT_RATE_LIMITS.webhook;
    } else if (path.startsWith('/api')) {
      config = DEFAULT_RATE_LIMITS.api;
    } else {
      config = DEFAULT_RATE_LIMITS.global;
    }
  }

  // Apply role multiplier if user role provided
  if (userRole && userRole !== 'MEMBER') {
    const multiplier = ROLE_MULTIPLIERS[userRole];
    return {
      ...config,
      max: Math.floor(config.max * multiplier),
    };
  }

  return config;
}

/**
 * Simple route pattern matching
 * Supports :param style dynamic segments
 */
function matchRoute(path: string, pattern: string): boolean {
  // Convert pattern to regex
  const regexPattern = pattern
    .replace(/:[^/]+/g, '[^/]+') // Replace :param with regex
    .replace(/\//g, '\\/'); // Escape slashes

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(path);
}

/**
 * Check if rate limiting should be skipped for a route
 */
export function shouldSkipRateLimit(path: string): boolean {
  const config = getRateLimitConfig(path);
  return config.skip === true;
}

/**
 * Get rate limit key for a request
 * Combines IP and optional user ID for granular rate limiting
 */
export function getRateLimitKey(
  identifier: string,
  path: string,
  scope: 'ip' | 'user' | 'global' = 'ip'
): string {
  const normalizedPath = path.split('?')[0]; // Remove query string
  return `ratelimit:${scope}:${normalizedPath}:${identifier}`;
}
