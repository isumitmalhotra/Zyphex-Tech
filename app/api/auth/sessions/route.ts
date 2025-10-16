import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { RefreshTokenManager } from '@/lib/auth/token-management'

/**
 * Session Management API
 * Phase 2: Token Management Enhancement
 * 
 * Allows users to:
 * - View all active sessions
 * - Revoke specific sessions
 * - Logout from all devices
 */

/**
 * GET /api/auth/sessions
 * Get all active sessions for the current user
 */
// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get all active sessions
    const sessions = await RefreshTokenManager.getActiveSessions(session.user.id)

    // Format response
    const formattedSessions = sessions.map(s => ({
      id: s.id,
      deviceInfo: s.deviceInfo,
      createdAt: s.createdAt.toISOString(),
      lastUsedAt: s.lastUsedAt?.toISOString() || null,
      expiresAt: s.expiresAt.toISOString(),
      expiresIn: Math.floor((s.expiresAt.getTime() - Date.now()) / 1000), // seconds
      isExpired: s.expiresAt < new Date()
    }))

    return NextResponse.json({
      success: true,
      sessions: formattedSessions,
      totalCount: formattedSessions.length
    })

  } catch (error) {
    console.error('[Security] Get sessions error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve sessions' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/auth/sessions
 * Revoke specific session or all sessions
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const { sessionId, revokeAll = false } = body

    if (revokeAll) {
      // Revoke all sessions for user
      const count = await RefreshTokenManager.revokeAll(session.user.id)
      
      console.log(`[Security] User ${session.user.email} revoked all ${count} sessions`)
      
      return NextResponse.json({
        success: true,
        message: 'All sessions revoked',
        revokedCount: count
      })
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      )
    }

    // Revoke specific session
    const revoked = await RefreshTokenManager.revokeSession(sessionId, session.user.id)

    if (!revoked) {
      return NextResponse.json(
        { error: 'Session not found or already revoked' },
        { status: 404 }
      )
    }

    console.log(`[Security] User ${session.user.email} revoked session ${sessionId}`)

    return NextResponse.json({
      success: true,
      message: 'Session revoked successfully'
    })

  } catch (error) {
    console.error('[Security] Revoke session error:', error)
    return NextResponse.json(
      { error: 'Failed to revoke session' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/auth/sessions/cleanup
 * Admin endpoint: Cleanup expired sessions
 */
export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only admins can run cleanup
    if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Run cleanup
    const refreshTokensCleanedCount = await RefreshTokenManager.cleanup()
    const { TokenBlacklist } = await import('@/lib/auth/token-management')
    const blacklistCleanedCount = await TokenBlacklist.cleanup()

    console.log(`[Security] Admin ${session.user.email} ran cleanup: ${refreshTokensCleanedCount} refresh tokens, ${blacklistCleanedCount} blacklisted tokens`)

    return NextResponse.json({
      success: true,
      message: 'Cleanup completed successfully',
      cleaned: {
        refreshTokens: refreshTokensCleanedCount,
        blacklistedTokens: blacklistCleanedCount,
        total: refreshTokensCleanedCount + blacklistCleanedCount
      }
    })

  } catch (error) {
    console.error('[Security] Cleanup error:', error)
    return NextResponse.json(
      { error: 'Cleanup failed' },
      { status: 500 }
    )
  }
}
