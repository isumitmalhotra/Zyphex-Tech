import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, RateLimitType } from './rate-limiting'
import { validateSchema, formatValidationErrors } from '@/lib/validation/schemas'
import { z } from 'zod'

// Security headers configuration
const SECURITY_HEADERS = {
  // Prevent XSS attacks
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  
  // HTTPS enforcement
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  
  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions policy
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  
  // Content Security Policy (restrictive)
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval'", // Next.js requires unsafe-eval
    "style-src 'self' 'unsafe-inline'", // For styled-components/CSS-in-JS
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ')
}

// CORS configuration
const CORS_CONFIG = {
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-CSRF-Token'
  ],
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset'
  ],
  credentials: true,
  maxAge: 86400 // 24 hours
}

// Input sanitization helpers
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+=/gi, '') // Remove event handlers
}

export function sanitizeObject(obj: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {}
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value)
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value)
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeString(item) : item
      )
    } else {
      sanitized[key] = value
    }
  }
  
  return sanitized
}

// Security middleware class
export class SecurityMiddleware {
  private request: NextRequest
  
  constructor(request: NextRequest) {
    this.request = request
  }
  
  // Apply security headers
  private applySecurityHeaders(response: NextResponse): NextResponse {
    if (process.env.ENABLE_SECURITY_HEADERS === 'true') {
      Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
        response.headers.set(key, value)
      })
    }
    
    return response
  }
  
  // Apply CORS headers
  private applyCorsHeaders(response: NextResponse): NextResponse {
    const origin = this.request.headers.get('origin')
    
    if (origin && CORS_CONFIG.allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin)
    }
    
    response.headers.set('Access-Control-Allow-Methods', CORS_CONFIG.allowedMethods.join(', '))
    response.headers.set('Access-Control-Allow-Headers', CORS_CONFIG.allowedHeaders.join(', '))
    response.headers.set('Access-Control-Expose-Headers', CORS_CONFIG.exposedHeaders.join(', '))
    response.headers.set('Access-Control-Max-Age', CORS_CONFIG.maxAge.toString())
    
    if (CORS_CONFIG.credentials) {
      response.headers.set('Access-Control-Allow-Credentials', 'true')
    }
    
    return response
  }
  
  // Check rate limits
  async checkRateLimit(type: RateLimitType, customIdentifier?: string): Promise<NextResponse | null> {
    const result = await rateLimit(this.request, type, customIdentifier)
    
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
      
      return this.applySecurityHeaders(this.applyCorsHeaders(response))
    }
    
    return null
  }
  
  // Validate request body
  validateBody<T>(schema: z.ZodSchema<T>): {
    success: boolean
    data?: T
    errors?: Array<{ field: string; message: string; code: string }>
  } {
    try {
      const body = this.request.json ? this.request.json() : {}
      const result = validateSchema(schema, body)
      
      if (!result.success && result.errors) {
        return {
          success: false,
          errors: formatValidationErrors(result.errors)
        }
      }
      
      return {
        success: true,
        data: result.data
      }
    } catch (error) {
      return {
        success: false,
        errors: [{ field: 'body', message: 'Invalid JSON format', code: 'invalid_json' }]
      }
    }
  }
  
  // Create secure response
  createResponse(data: any, status: number = 200): NextResponse {
    const response = NextResponse.json(data, { status })
    return this.applySecurityHeaders(this.applyCorsHeaders(response))
  }
  
  // Create error response
  createErrorResponse(
    message: string, 
    status: number = 400, 
    details?: any
  ): NextResponse {
    const errorData: any = {
      error: true,
      message,
      timestamp: new Date().toISOString()
    }
    
    if (details) {
      errorData.details = details
    }
    
    const response = NextResponse.json(errorData, { status })
    return this.applySecurityHeaders(this.applyCorsHeaders(response))
  }
  
  // Handle preflight requests
  handlePreflight(): NextResponse {
    const response = new NextResponse(null, { status: 200 })
    return this.applySecurityHeaders(this.applyCorsHeaders(response))
  }
  
  // Get client IP address
  getClientIP(): string {
    const forwardedFor = this.request.headers.get('x-forwarded-for')
    const realIp = this.request.headers.get('x-real-ip')
    return forwardedFor?.split(',')[0] || realIp || this.request.ip || 'unknown'
  }
  
  // Check if request is from allowed origin
  isOriginAllowed(): boolean {
    const origin = this.request.headers.get('origin')
    if (!origin) return true // Same-origin requests don't have origin header
    
    return CORS_CONFIG.allowedOrigins.includes(origin)
  }
  
  // Validate request headers
  validateHeaders(requiredHeaders: string[]): {
    valid: boolean
    missing: string[]
  } {
    const missing = requiredHeaders.filter(header => 
      !this.request.headers.get(header)
    )
    
    return {
      valid: missing.length === 0,
      missing
    }
  }
}

// Security middleware factory
export function createSecurityMiddleware(request: NextRequest) {
  return new SecurityMiddleware(request)
}

// Common security checks for API routes
export async function secureApiRoute(
  request: NextRequest,
  rateLimitType: RateLimitType,
  validationSchema?: z.ZodSchema<any>
): Promise<{
  security: SecurityMiddleware
  data?: any
  error?: NextResponse
}> {
  const security = createSecurityMiddleware(request)
  
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return {
      security,
      error: security.handlePreflight()
    }
  }
  
  // Check origin
  if (!security.isOriginAllowed()) {
    return {
      security,
      error: security.createErrorResponse('Origin not allowed', 403)
    }
  }
  
  // Check rate limits
  const rateLimitError = await security.checkRateLimit(rateLimitType)
  if (rateLimitError) {
    return {
      security,
      error: rateLimitError
    }
  }
  
  // Validate request body if schema provided
  if (validationSchema && (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH')) {
    const validation = security.validateBody(validationSchema)
    if (!validation.success) {
      return {
        security,
        error: security.createErrorResponse('Validation failed', 400, validation.errors)
      }
    }
    
    return {
      security,
      data: validation.data
    }
  }
  
  return { security }
}

// IP-based security checks
export class IPSecurity {
  private static blockedIPs = new Set<string>()
  private static suspiciousActivity = new Map<string, { count: number; lastActivity: number }>()
  
  static blockIP(ip: string): void {
    this.blockedIPs.add(ip)
  }
  
  static unblockIP(ip: string): void {
    this.blockedIPs.delete(ip)
  }
  
  static isBlocked(ip: string): boolean {
    return this.blockedIPs.has(ip)
  }
  
  static recordSuspiciousActivity(ip: string): void {
    const now = Date.now()
    const record = this.suspiciousActivity.get(ip) || { count: 0, lastActivity: 0 }
    
    // Reset count if last activity was more than 1 hour ago
    if (now - record.lastActivity > 60 * 60 * 1000) {
      record.count = 0
    }
    
    record.count++
    record.lastActivity = now
    
    this.suspiciousActivity.set(ip, record)
    
    // Auto-block after 10 suspicious activities in 1 hour
    if (record.count >= 10) {
      this.blockIP(ip)
    }
  }
  
  static getSuspiciousActivityCount(ip: string): number {
    const record = this.suspiciousActivity.get(ip)
    if (!record) return 0
    
    const now = Date.now()
    if (now - record.lastActivity > 60 * 60 * 1000) {
      return 0
    }
    
    return record.count
  }
}

// CSRF protection
export function generateCSRFToken(): string {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64')
}

export function validateCSRFToken(token: string, sessionToken: string): boolean {
  // In production, implement proper CSRF token validation
  // This is a simplified version
  return token === sessionToken
}

// Export common security functions
export const securityUtils = {
  sanitizeString,
  sanitizeObject,
  createSecurityMiddleware,
  secureApiRoute,
  generateCSRFToken,
  validateCSRFToken,
  IPSecurity
}