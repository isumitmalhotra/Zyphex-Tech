import { NextRequest, NextResponse } from 'next/server'
import { RefreshTokenManager, generateAccessToken } from '@/lib/auth/token-management'
import { prisma } from '@/lib/prisma'

/**
 * Token Refresh API
 * Phase 2: Token Management Enhancement
 * 
 * Features:
 * - Rotates refresh tokens (invalidate old, create new)
 * - Generates new short-lived access token (15 min)
 * - Detects token theft attempts
 * - Device tracking
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { refreshToken, userId } = body

    // Validation
    if (!refreshToken || typeof refreshToken !== 'string') {
      return NextResponse.json(
        { 
          error: 'Missing or invalid refresh token',
          code: 'INVALID_REQUEST'
        },
        { status: 400 }
      )
    }

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { 
          error: 'Missing or invalid user ID',
          code: 'INVALID_REQUEST'
        },
        { status: 400 }
      )
    }

    // Verify refresh token is valid
    const isValid = await RefreshTokenManager.verify(refreshToken, userId)
    
    if (!isValid) {
      console.warn(`[Security] Invalid refresh token attempt for user ${userId}`)
      return NextResponse.json(
        { 
          error: 'Invalid or expired refresh token',
          code: 'INVALID_TOKEN'
        },
        { status: 401 }
      )
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true,
        email: true,
        role: true,
        deletedAt: true
      }
    })

    if (!user) {
      console.error(`[Security] User not found during token refresh: ${userId}`)
      return NextResponse.json(
        { 
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        },
        { status: 404 }
      )
    }

    // Check if user is soft-deleted
    if (user.deletedAt) {
      console.warn(`[Security] Deleted user attempted token refresh: ${userId}`)
      await RefreshTokenManager.revokeAll(userId)
      return NextResponse.json(
        { 
          error: 'Account no longer active',
          code: 'ACCOUNT_DELETED'
        },
        { status: 403 }
      )
    }

    // Extract device info from request
    const userAgent = request.headers.get('user-agent') || 'Unknown Device'
    const deviceInfo = userAgent.substring(0, 200) // Limit length

    // Rotate refresh token (delete old, create new)
    const newRefreshToken = await RefreshTokenManager.rotate(
      refreshToken, 
      userId,
      deviceInfo
    )

    if (!newRefreshToken) {
      console.error(`[Security] Token rotation failed for user ${userId}`)
      return NextResponse.json(
        { 
          error: 'Token rotation failed',
          code: 'ROTATION_FAILED'
        },
        { status: 500 }
      )
    }

    // Generate new access token (15 minutes)
    const accessToken = generateAccessToken(userId, user.role, user.email)

    console.log(`[Security] Token refreshed successfully for user ${user.email}`)

    return NextResponse.json({
      success: true,
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: 900, // 15 minutes in seconds
      tokenType: 'Bearer',
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    })

  } catch (error) {
    console.error('[Security] Token refresh error:', error)
    
    // Don't expose internal error details
    return NextResponse.json(
      { 
        error: 'Token refresh failed',
        code: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : 'Unknown error')
          : 'An error occurred'
      },
      { status: 500 }
    )
  }
}

/**
 * Get token info (introspection)
 * For debugging and monitoring
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    
    // Get user ID from query params
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      )
    }

    // Verify the refresh token
    const isValid = await RefreshTokenManager.verify(token, userId)
    
    if (!isValid) {
      return NextResponse.json({
        valid: false,
        message: 'Token is invalid or expired'
      })
    }

    // Get token details
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token },
      select: {
        id: true,
        userId: true,
        deviceInfo: true,
        expiresAt: true,
        lastUsedAt: true,
        createdAt: true
      }
    })

    if (!tokenRecord) {
      return NextResponse.json({
        valid: false,
        message: 'Token not found'
      })
    }

    return NextResponse.json({
      valid: true,
      token: {
        id: tokenRecord.id,
        userId: tokenRecord.userId,
        deviceInfo: tokenRecord.deviceInfo,
        expiresAt: tokenRecord.expiresAt,
        lastUsedAt: tokenRecord.lastUsedAt,
        createdAt: tokenRecord.createdAt,
        expiresIn: Math.floor((tokenRecord.expiresAt.getTime() - Date.now()) / 1000)
      }
    })

  } catch (error) {
    console.error('[Security] Token introspection error:', error)
    return NextResponse.json(
      { error: 'Token introspection failed' },
      { status: 500 }
    )
  }
}
