/**
 * RBAC Middleware for API Route Protection
 * Provides permission-based access control for API endpoints
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Permission, hasPermission, ExtendedUser } from './permissions'

export interface AuthenticatedRequest extends NextRequest {
  user: ExtendedUser
}

/**
 * Middleware to require authentication and specific permissions
 */
export function requirePermissions(permissions: Permission[]) {
  return async function middleware(
    request: NextRequest,
    handler: (req: AuthenticatedRequest) => Promise<NextResponse>
  ) {
    try {
      // Get session
      const session = await getServerSession(authOptions)
      
      if (!session?.user) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }

      const user = session.user as ExtendedUser

      // Check if user has required permissions
      const missingPermissions = permissions.filter(
        permission => !hasPermission(user, permission)
      )

      if (missingPermissions.length > 0) {
        return NextResponse.json(
          { 
            error: 'Insufficient permissions',
            required: missingPermissions,
            message: `You need the following permissions: ${missingPermissions.join(', ')}`
          },
          { status: 403 }
        )
      }

      // Add user to request object
      const authenticatedRequest = request as AuthenticatedRequest
      authenticatedRequest.user = user

      // Call the actual handler
      return handler(authenticatedRequest)
    } catch (error) {
      console.error('Permission middleware error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

/**
 * Middleware to require authentication only (no specific permissions)
 */
export function requireAuth() {
  return async function middleware(
    request: NextRequest,
    handler: (req: AuthenticatedRequest) => Promise<NextResponse>
  ) {
    try {
      const session = await getServerSession(authOptions)
      
      if (!session?.user) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }

      const authenticatedRequest = request as AuthenticatedRequest
      authenticatedRequest.user = session.user as ExtendedUser

      return handler(authenticatedRequest)
    } catch (error) {
      console.error('Auth middleware error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

/**
 * Middleware to require admin access (ADMIN or SUPER_ADMIN role)
 */
export function requireAdmin() {
  return requirePermissions([Permission.MANAGE_SYSTEM])
}

/**
 * Helper function to wrap API handlers with permission checks
 */
export function withPermissions(permissions: Permission[]) {
  return function wrapper(
    handler: (req: AuthenticatedRequest) => Promise<NextResponse>
  ) {
    return async function wrappedHandler(request: NextRequest) {
      const middleware = requirePermissions(permissions)
      return middleware(request, handler)
    }
  }
}

/**
 * Helper function to wrap API handlers with authentication only
 */
export function withAuth() {
  return function wrapper(
    handler: (req: AuthenticatedRequest) => Promise<NextResponse>
  ) {
    return async function wrappedHandler(request: NextRequest) {
      const middleware = requireAuth()
      return middleware(request, handler)
    }
  }
}

/**
 * Audit logging helper for protected actions
 */
export async function logAction(
  user: ExtendedUser,
  action: string,
  entityType: string,
  entityId?: string,
  changes?: Record<string, unknown>,
  request?: NextRequest
) {
  try {
    // In a real implementation, you would save this to your audit log
    // For now, we'll just log to console
    const auditEntry = {
      userId: user.id,
      action,
      entityType,
      entityId,
      changes,
      ipAddress: request?.headers.get('x-forwarded-for') || 
                 request?.headers.get('x-real-ip') ||
                 'unknown',
      userAgent: request?.headers.get('user-agent') || 'unknown',
      timestamp: new Date().toISOString()
    }

    console.log('AUDIT LOG:', auditEntry)

    // TODO: Save to database audit log table
    // await prisma.auditLog.create({ data: auditEntry })
  } catch (error) {
    console.error('Failed to log audit entry:', error)
  }
}

/**
 * Rate limiting helper (basic implementation)
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function rateLimit(maxRequests: number = 100, windowMs: number = 60000) {
  return function rateLimitMiddleware(
    handler: (req: AuthenticatedRequest) => Promise<NextResponse>
  ) {
    return async function rateLimitedHandler(request: AuthenticatedRequest) {
      const key = `${request.user.id}:${request.nextUrl.pathname}`
      const now = Date.now()
      const windowStart = now - windowMs

      const current = rateLimitMap.get(key)
      
      if (!current || current.resetTime < windowStart) {
        rateLimitMap.set(key, { count: 1, resetTime: now })
      } else {
        current.count++
        if (current.count > maxRequests) {
          return NextResponse.json(
            { 
              error: 'Rate limit exceeded',
              message: `Too many requests. Limit: ${maxRequests} per ${windowMs}ms`
            },
            { status: 429 }
          )
        }
      }

      return handler(request)
    }
  }
}
