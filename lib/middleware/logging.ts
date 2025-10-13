import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Logger } from '@/lib/logger';

/**
 * Request/Response logging middleware
 * Tracks API calls, performance, and errors
 */
export function loggingMiddleware(request: NextRequest) {
  const startTime = Date.now();
  const { pathname, searchParams } = request.nextUrl;
  const method = request.method;

  // Skip logging for static assets and Next.js internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.') && !pathname.startsWith('/api/') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Create a response handler
  const response = NextResponse.next();

  // Log the request (async, non-blocking)
  Promise.resolve().then(() => {
    const duration = Date.now() - startTime;
    const statusCode = response.status || 200;

    // Prepare metadata
    const meta: Record<string, unknown> = {
      method,
      pathname,
      statusCode,
      duration,
      userAgent: request.headers.get('user-agent') || 'unknown',
      ip: request.headers.get('x-forwarded-for') || 
          request.headers.get('x-real-ip') || 
          'unknown',
    };

    // Add query params if present (sanitize sensitive data)
    if (searchParams.toString()) {
      const sanitizedParams: Record<string, string> = {};
      searchParams.forEach((value, key) => {
        // Don't log sensitive query parameters
        if (!['token', 'password', 'secret', 'key', 'apiKey'].includes(key.toLowerCase())) {
          sanitizedParams[key] = value;
        } else {
          sanitizedParams[key] = '[REDACTED]';
        }
      });
      meta.queryParams = sanitizedParams;
    }

    // Log based on status code
    if (statusCode >= 500) {
      Logger.error(`Request failed: ${method} ${pathname}`, meta);
    } else if (statusCode >= 400) {
      Logger.warn(`Client error: ${method} ${pathname}`, meta);
    } else if (duration > 3000) {
      Logger.warn(`Slow request: ${method} ${pathname}`, meta);
    } else {
      Logger.http(`${method} ${pathname}`, meta);
    }

    // Log performance metrics
    if (duration > 1000) {
      Logger.logPerformance(
        `${method} ${pathname}`,
        duration,
        1000,
        { statusCode }
      );
    }
  }).catch((error) => {
    // Silently fail logging - don't break the request
    console.error('Logging middleware error:', error);
  });

  return response;
}

/**
 * API route wrapper for detailed logging
 * Use this to wrap your API route handlers
 */
export function withLogging<T>(
  handler: (request: NextRequest) => Promise<NextResponse<T>>,
  options?: {
    logRequest?: boolean;
    logResponse?: boolean;
    redactFields?: string[];
  }
) {
  return async (request: NextRequest): Promise<NextResponse<T>> => {
    const startTime = Date.now();
    const { pathname } = request.nextUrl;
    const method = request.method;

    // Log request if enabled
    if (options?.logRequest !== false) {
      Logger.debug(`Incoming request: ${method} ${pathname}`, {
        method,
        pathname,
        headers: Object.fromEntries(request.headers),
      });
    }

    try {
      // Execute the handler
      const response = await handler(request);
      const duration = Date.now() - startTime;

      // Log successful request
      Logger.logAPIRequest(
        method,
        pathname,
        response.status,
        duration
      );

      // Log response if enabled
      if (options?.logResponse) {
        Logger.debug(`Response: ${method} ${pathname}`, {
          status: response.status,
          duration,
        });
      }

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Log error
      Logger.logError(
        error as Error,
        `API Route: ${method} ${pathname}`,
        {
          method,
          pathname,
          duration,
        }
      );

      // Re-throw to let error handlers deal with it
      throw error;
    }
  };
}

/**
 * Rate limiting tracker for monitoring
 */
export class RateLimitTracker {
  private static requests = new Map<string, number[]>();

  /**
   * Track a request and check if rate limited
   */
  static track(identifier: string, windowMs: number, maxRequests: number): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get existing requests for this identifier
    const requests = this.requests.get(identifier) || [];

    // Filter out old requests
    const recentRequests = requests.filter(time => time > windowStart);

    // Check if rate limited
    if (recentRequests.length >= maxRequests) {
      Logger.logSecurityEvent(
        'Rate limit exceeded',
        'medium',
        {
          identifier,
          requests: recentRequests.length,
          maxRequests,
          windowMs,
        }
      );
      return false;
    }

    // Add current request
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);

    return true;
  }

  /**
   * Clear old entries periodically
   */
  static cleanup(windowMs: number) {
    const now = Date.now();
    const windowStart = now - windowMs;

    for (const [identifier, requests] of this.requests.entries()) {
      const recentRequests = requests.filter(time => time > windowStart);
      
      if (recentRequests.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, recentRequests);
      }
    }
  }
}

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    RateLimitTracker.cleanup(900000); // 15 minutes
  }, 300000); // 5 minutes
}
