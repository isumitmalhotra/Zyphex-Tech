import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory rate limiter (for development)
// In production, use Redis or similar distributed cache
class InMemoryRateLimiter {
  private store = new Map<string, { count: number; resetTime: number }>()
  
  async check(key: string, maxRequests: number, windowMs: number): Promise<{
    success: boolean
    remaining: number
    resetTime: number
  }> {
    const now = Date.now()
    const record = this.store.get(key)
    
    // Clean expired entries
    if (record && now > record.resetTime) {
      this.store.delete(key)
    }
    
    const currentRecord = this.store.get(key)
    
    if (!currentRecord) {
      // First request in window
      this.store.set(key, { count: 1, resetTime: now + windowMs })
      return { success: true, remaining: maxRequests - 1, resetTime: now + windowMs }
    }
    
    if (currentRecord.count >= maxRequests) {
      // Rate limit exceeded
      return { 
        success: false, 
        remaining: 0, 
        resetTime: currentRecord.resetTime 
      }
    }
    
    // Increment counter
    currentRecord.count++
    this.store.set(key, currentRecord)
    
    return { 
      success: true, 
      remaining: maxRequests - currentRecord.count, 
      resetTime: currentRecord.resetTime 
    }
  }
  
  async increment(key: string): Promise<void> {
    const record = this.store.get(key)
    if (record) {
      record.count++
      this.store.set(key, record)
    }
  }
}

const rateLimiter = new InMemoryRateLimiter()

// Rate limit configurations (increased for better UX)
export const RATE_LIMITS = {
  login: { max: 10, window: 15 * 60 * 1000 }, // 10 attempts per 15 minutes (increased from 5)
  api: { max: 300, window: 15 * 60 * 1000 }, // 300 requests per 15 minutes (increased from 100)
  registration: { max: 5, window: 60 * 60 * 1000 }, // 5 registrations per hour (increased from 3)
  'password-reset': { max: 5, window: 60 * 60 * 1000 }, // 5 password resets per hour (increased from 3)
  'project-creation': { max: 20, window: 60 * 60 * 1000 }, // 20 projects per hour (increased from 10)
  'file-upload': { max: 50, window: 60 * 60 * 1000 }, // 50 file uploads per hour (increased from 20)
  'message-send': { max: 100, window: 60 * 60 * 1000 } // 100 messages per hour (increased from 50)
} as const

export type RateLimitType = keyof typeof RATE_LIMITS

// Get client identifier for rate limiting
function getClientIdentifier(request: NextRequest): string {
  // Priority order: User ID > IP Address > User Agent hash
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwardedFor?.split(',')[0] || realIp || request.ip || 'unknown'
  
  // In production, you might want to include user ID from session
  return ip
}

// Main rate limiting function
export async function rateLimit(
  request: NextRequest,
  type: RateLimitType,
  customIdentifier?: string
): Promise<{
  success: boolean
  remaining: number
  resetTime: number
  headers: Record<string, string>
}> {
  const limit = RATE_LIMITS[type]
  const identifier = customIdentifier || getClientIdentifier(request)
  const key = `rate_limit:${type}:${identifier}`
  
  const result = await rateLimiter.check(key, limit.max, limit.window)
  
  // Standard rate limit headers
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': limit.max.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
    'X-RateLimit-Window': limit.window.toString()
  }
  
  if (!result.success) {
    headers['Retry-After'] = Math.ceil((result.resetTime - Date.now()) / 1000).toString()
  }
  
  return {
    success: result.success,
    remaining: result.remaining,
    resetTime: result.resetTime,
    headers
  }
}

// Rate limiting middleware wrapper
export function createRateLimitMiddleware(type: RateLimitType) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    const result = await rateLimit(request, type)
    
    if (!result.success) {
      const response = NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `Too many ${type} requests. Please try again later.`,
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
        },
        { status: 429 }
      )
      
      // Add rate limit headers
      Object.entries(result.headers).forEach(([key, value]) => {
        response.headers.set(key, value)
      })
      
      return response
    }
    
    return null // Continue processing
  }
}

// Utility function to apply rate limiting to API routes
export async function applyRateLimit(
  request: NextRequest,
  type: RateLimitType,
  customIdentifier?: string
): Promise<NextResponse | null> {
  const result = await rateLimit(request, type, customIdentifier)
  
  if (!result.success) {
    const response = NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message: `Too many ${type} requests. Please try again later.`,
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
        type
      },
      { status: 429 }
    )
    
    // Add rate limit headers
    Object.entries(result.headers).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
    
    return response
  }
  
  return null
}

// Rate limit check for specific user
export async function checkUserRateLimit(
  userId: string,
  type: RateLimitType
): Promise<{
  canProceed: boolean
  remaining: number
  resetTime: number
}> {
  const limit = RATE_LIMITS[type]
  const key = `rate_limit:${type}:user:${userId}`
  
  const result = await rateLimiter.check(key, limit.max, limit.window)
  
  return {
    canProceed: result.success,
    remaining: result.remaining,
    resetTime: result.resetTime
  }
}

// Increment rate limit counter (for successful operations)
export async function incrementRateLimit(
  request: NextRequest,
  type: RateLimitType,
  customIdentifier?: string
): Promise<void> {
  const identifier = customIdentifier || getClientIdentifier(request)
  const key = `rate_limit:${type}:${identifier}`
  
  await rateLimiter.increment(key)
}

// Rate limit status for monitoring
export interface RateLimitStatus {
  type: RateLimitType
  limit: number
  remaining: number
  resetTime: number
  windowMs: number
}

export async function getRateLimitStatus(
  request: NextRequest,
  type: RateLimitType,
  customIdentifier?: string
): Promise<RateLimitStatus> {
  const result = await rateLimit(request, type, customIdentifier)
  const limit = RATE_LIMITS[type]
  
  return {
    type,
    limit: limit.max,
    remaining: result.remaining,
    resetTime: result.resetTime,
    windowMs: limit.window
  }
}

// Clean up expired rate limit entries (call periodically)
export function cleanupRateLimitStore(): void {
  // This would be more sophisticated with Redis
  // For in-memory store, cleanup happens automatically in check() method
}

// Rate limiting for specific actions
export const rateLimitActions = {
  login: (request: NextRequest) => applyRateLimit(request, 'login'),
  register: (request: NextRequest) => applyRateLimit(request, 'registration'),
  api: (request: NextRequest) => applyRateLimit(request, 'api'),
  passwordReset: (request: NextRequest) => applyRateLimit(request, 'password-reset'),
  projectCreation: (request: NextRequest) => applyRateLimit(request, 'project-creation'),
  fileUpload: (request: NextRequest) => applyRateLimit(request, 'file-upload'),
  messageSend: (request: NextRequest) => applyRateLimit(request, 'message-send')
}

// Export middleware creators for easy use
export const loginRateLimit = createRateLimitMiddleware('login')
export const apiRateLimit = createRateLimitMiddleware('api')
export const registrationRateLimit = createRateLimitMiddleware('registration')