import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Performance Tracking Middleware
 * 
 * This middleware tracks API performance metrics for all requests.
 * It measures response times and logs them to the database.
 * 
 * Note: This is disabled by default to avoid performance overhead.
 * Enable by setting ENABLE_PERFORMANCE_TRACKING=true in .env
 */

// Track which paths should be monitored
const MONITORED_PATHS = [
  '/api/projects',
  '/api/tasks',
  '/api/users',
  '/api/clients',
  '/api/leads',
  '/api/deals',
  '/api/analytics',
  '/api/super-admin',
  '/api/project-manager',
  '/api/team-member',
]

// Skip tracking for these paths (to avoid recursive tracking)
const SKIP_PATHS = [
  '/api/tracking',
  '/api/health',
  '/api/auth',
]

export async function trackApiPerformance(request: NextRequest, response: NextResponse) {
  // Only track if enabled
  if (process.env.ENABLE_PERFORMANCE_TRACKING !== 'true') {
    return
  }

  const path = request.nextUrl.pathname

  // Skip if not an API route or in skip list
  if (!path.startsWith('/api/') || SKIP_PATHS.some(skip => path.startsWith(skip))) {
    return
  }

  // Only track monitored paths or track all if wildcard
  const shouldTrack = process.env.TRACK_ALL_APIS === 'true' || 
    MONITORED_PATHS.some(monitored => path.startsWith(monitored))

  if (!shouldTrack) {
    return
  }

  try {
    // Get request metadata
    const startTime = Date.now()
    const method = request.method
    const endpoint = path
    const statusCode = response.status

    // Calculate response time
    const responseTime = Date.now() - startTime

    // Get request size (estimate)
    const requestSize = request.headers.get('content-length')
      ? parseInt(request.headers.get('content-length')!)
      : 0

    // Get user info if authenticated
    const userId = request.headers.get('x-user-id') // Set by auth middleware if available

    // Log to database asynchronously (don't block response)
    // Use a separate API endpoint to avoid blocking
    fetch(`${request.nextUrl.origin}/api/tracking/api`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method,
        endpoint,
        path: request.url,
        statusCode,
        responseTime,
        requestSize,
        userId,
        userAgent: request.headers.get('user-agent'),
        ipAddress: getClientIp(request),
        timestamp: new Date().toISOString(),
      }),
    }).catch(err => {
      // Silently fail - don't break the application
      console.error('Failed to track API metric:', err)
    })
  } catch (error) {
    // Silently fail - performance tracking should never break the app
    console.error('Performance tracking error:', error)
  }
}

/**
 * Get client IP address (anonymized for privacy)
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'
  
  // Anonymize IP for privacy (remove last octet)
  if (ip && ip !== 'unknown') {
    const parts = ip.split('.')
    if (parts.length === 4) {
      parts[3] = '0'
      return parts.join('.')
    }
  }
  
  return 'unknown'
}

/**
 * Track page performance from client-side
 * This is called via the tracking API endpoint
 */
export interface PagePerformanceData {
  page: string
  loadTime: number
  ttfb?: number
  fcp?: number
  lcp?: number
  cls?: number
  tti?: number
  fid?: number
  tbt?: number
  requests?: number
  size?: number
  userAgent?: string
}

/**
 * Track error from client-side or server-side
 */
export interface ErrorData {
  errorType: string
  message: string
  stack?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  page?: string
  endpoint?: string
  userId?: string
  metadata?: Record<string, unknown>
}
