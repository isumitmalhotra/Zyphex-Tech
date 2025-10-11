import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { TokenBlacklist, RefreshTokenManager } from '@/lib/auth/token-management'
import { getToken } from 'next-auth/jwt'

/**
 * Enhanced Logout API
 * Phase 2: Token Management Enhancement
 * 
 * Features:
 * - Adds JWT to blacklist
 * - Revokes all refresh tokens
 * - Supports logout from all devices
 * - Audit logging
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Parse request body for logout options
    const body = await request.json().catch(() => ({}))
    const { logoutFromAllDevices = true } = body

    // Get the current JWT token
    const token = await getToken({ 
      req: request as unknown as Parameters<typeof getToken>[0]['req'],
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (token) {
      // Add current token to blacklist
      const tokenString = JSON.stringify(token)
      const expiresAt = token.exp ? new Date(token.exp * 1000) : new Date(Date.now() + 3600000)
      
      await TokenBlacklist.add(
        tokenString, 
        session.user.id, 
        expiresAt,
        'user_logout'
      )
      
      console.log(`[Security] Token blacklisted for user ${session.user.email}`)
    }

    // Revoke refresh tokens
    let revokedCount = 0
    if (logoutFromAllDevices) {
      revokedCount = await RefreshTokenManager.revokeAll(session.user.id)
      console.log(`[Security] Revoked ${revokedCount} refresh tokens for user ${session.user.email}`)
    }

    return NextResponse.json({ 
      success: true,
      message: 'Logged out successfully',
      details: {
        tokenBlacklisted: !!token,
        refreshTokensRevoked: revokedCount,
        logoutFromAllDevices
      }
    })

  } catch (error) {
    console.error('[Security] Logout error:', error)
    return NextResponse.json(
      { 
        error: 'Logout failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Get logout status / check if user is logged out
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    return NextResponse.json({
      authenticated: !!session,
      user: session?.user ? {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role
      } : null
    })
  } catch (error) {
    console.error('[Security] Logout status check error:', error)
    return NextResponse.json(
      { error: 'Status check failed' },
      { status: 500 }
    )
  }
}
