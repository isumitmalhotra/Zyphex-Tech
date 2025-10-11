import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

const prisma = new PrismaClient()

/**
 * Token Blacklist Manager
 * Handles token invalidation on logout and forced revocation
 */
export class TokenBlacklist {
  /**
   * Add token to blacklist
   * Used during logout or forced token revocation
   */
  static async add(token: string, userId: string, expiresAt: Date, reason: string = 'logout'): Promise<void> {
    try {
      await prisma.tokenBlacklist.create({
        data: {
          token,
          userId,
          expiresAt,
          reason
        }
      })
    } catch (error) {
      console.error('Failed to blacklist token:', error)
      throw new Error('Token blacklisting failed')
    }
  }

  /**
   * Check if token is blacklisted
   * Should be called on every protected route
   */
  static async isBlacklisted(token: string): Promise<boolean> {
    try {
      const blacklisted = await prisma.tokenBlacklist.findUnique({
        where: { token }
      })
      
      return !!blacklisted
    } catch (error) {
      console.error('Failed to check token blacklist:', error)
      // Fail open to avoid blocking legitimate requests
      return false
    }
  }

  /**
   * Clean expired tokens from blacklist
   * Should be run periodically via cron job
   */
  static async cleanup(): Promise<number> {
    try {
      const result = await prisma.tokenBlacklist.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      })
      
      console.log(`Cleaned up ${result.count} expired blacklisted tokens`)
      return result.count
    } catch (error) {
      console.error('Failed to cleanup blacklisted tokens:', error)
      return 0
    }
  }

  /**
   * Revoke all tokens for a specific user
   * Used for security incidents or account compromise
   */
  static async revokeAllForUser(userId: string, reason: string = 'security_incident'): Promise<number> {
    try {
      // Get all active refresh tokens for user
      const tokens = await prisma.refreshToken.findMany({
        where: { userId }
      })

      // Add each to blacklist
      let count = 0
      for (const token of tokens) {
        await this.add(token.token, userId, token.expiresAt, reason)
        count++
      }

      // Delete refresh tokens
      await prisma.refreshToken.deleteMany({
        where: { userId }
      })

      console.log(`Revoked ${count} tokens for user ${userId}`)
      return count
    } catch (error) {
      console.error('Failed to revoke user tokens:', error)
      return 0
    }
  }
}

/**
 * Refresh Token Manager
 * Implements secure token rotation with automatic cleanup
 */
export class RefreshTokenManager {
  private static readonly REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000 // 7 days
  private static readonly MAX_TOKENS_PER_USER = 5 // Limit active sessions

  /**
   * Generate new refresh token
   * Creates cryptographically secure random token
   */
  static async generate(userId: string, deviceInfo?: string): Promise<string> {
    try {
      // Check existing token count
      const existingCount = await prisma.refreshToken.count({
        where: { userId }
      })

      // If user has too many tokens, delete oldest
      if (existingCount >= this.MAX_TOKENS_PER_USER) {
        const oldest = await prisma.refreshToken.findFirst({
          where: { userId },
          orderBy: { createdAt: 'asc' }
        })

        if (oldest) {
          await prisma.refreshToken.delete({
            where: { id: oldest.id }
          })
        }
      }

      // Generate secure random token
      const token = crypto.randomBytes(64).toString('hex')
      const expiresAt = new Date(Date.now() + this.REFRESH_TOKEN_EXPIRY)

      await prisma.refreshToken.create({
        data: {
          token,
          userId,
          expiresAt,
          deviceInfo: deviceInfo || 'Unknown Device'
        }
      })

      return token
    } catch (error) {
      console.error('Failed to generate refresh token:', error)
      throw new Error('Refresh token generation failed')
    }
  }

  /**
   * Rotate refresh token (invalidate old, create new)
   * Implements secure token rotation pattern
   */
  static async rotate(oldToken: string, userId: string, deviceInfo?: string): Promise<string | null> {
    try {
      // Verify old token exists and is valid
      const existingToken = await prisma.refreshToken.findUnique({
        where: { token: oldToken }
      })

      if (!existingToken) {
        console.warn(`Refresh token not found: ${oldToken.substring(0, 10)}...`)
        return null
      }

      if (existingToken.userId !== userId) {
        console.error(`User ID mismatch for refresh token`)
        // Security incident: token theft detected
        await TokenBlacklist.revokeAllForUser(userId, 'token_theft_detected')
        return null
      }

      if (existingToken.expiresAt < new Date()) {
        console.warn(`Refresh token expired`)
        await prisma.refreshToken.delete({
          where: { token: oldToken }
        })
        return null
      }

      // Delete old token
      await prisma.refreshToken.delete({
        where: { token: oldToken }
      })

      // Generate new token with same device info
      return await this.generate(userId, deviceInfo || existingToken.deviceInfo)
    } catch (error) {
      console.error('Failed to rotate refresh token:', error)
      return null
    }
  }

  /**
   * Verify refresh token is valid
   */
  static async verify(token: string, userId: string): Promise<boolean> {
    try {
      const refreshToken = await prisma.refreshToken.findUnique({
        where: { token }
      })

      if (!refreshToken) {
        return false
      }

      if (refreshToken.userId !== userId) {
        // Potential security breach
        console.error(`User ID mismatch during token verification`)
        await TokenBlacklist.revokeAllForUser(userId, 'token_verification_failed')
        return false
      }

      if (refreshToken.expiresAt < new Date()) {
        // Token expired, clean it up
        await prisma.refreshToken.delete({
          where: { token }
        })
        return false
      }

      // Update last used timestamp
      await prisma.refreshToken.update({
        where: { token },
        data: { lastUsedAt: new Date() }
      })

      return true
    } catch (error) {
      console.error('Failed to verify refresh token:', error)
      return false
    }
  }

  /**
   * Revoke all refresh tokens for user
   * Used during logout or security incidents
   */
  static async revokeAll(userId: string): Promise<number> {
    try {
      const result = await prisma.refreshToken.deleteMany({
        where: { userId }
      })
      
      console.log(`Revoked ${result.count} refresh tokens for user ${userId}`)
      return result.count
    } catch (error) {
      console.error('Failed to revoke refresh tokens:', error)
      return 0
    }
  }

  /**
   * Clean expired refresh tokens
   * Should be run periodically via cron job
   */
  static async cleanup(): Promise<number> {
    try {
      const result = await prisma.refreshToken.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      })
      
      console.log(`Cleaned up ${result.count} expired refresh tokens`)
      return result.count
    } catch (error) {
      console.error('Failed to cleanup refresh tokens:', error)
      return 0
    }
  }

  /**
   * Get all active sessions for user
   * Used for session management UI
   */
  static async getActiveSessions(userId: string): Promise<Array<{
    id: string
    deviceInfo: string
    createdAt: Date
    lastUsedAt: Date | null
    expiresAt: Date
  }>> {
    try {
      const tokens = await prisma.refreshToken.findMany({
        where: { 
          userId,
          expiresAt: { gt: new Date() }
        },
        select: {
          id: true,
          deviceInfo: true,
          createdAt: true,
          lastUsedAt: true,
          expiresAt: true
        },
        orderBy: { lastUsedAt: 'desc' }
      })

      return tokens
    } catch (error) {
      console.error('Failed to get active sessions:', error)
      return []
    }
  }

  /**
   * Revoke specific session
   */
  static async revokeSession(sessionId: string, userId: string): Promise<boolean> {
    try {
      const token = await prisma.refreshToken.findFirst({
        where: { 
          id: sessionId,
          userId 
        }
      })

      if (!token) {
        return false
      }

      // Add to blacklist before deletion
      await TokenBlacklist.add(token.token, userId, token.expiresAt, 'user_revoked')

      // Delete token
      await prisma.refreshToken.delete({
        where: { id: sessionId }
      })

      return true
    } catch (error) {
      console.error('Failed to revoke session:', error)
      return false
    }
  }
}

/**
 * Generate short-lived access token
 * 15-minute expiry for enhanced security
 */
export function generateAccessToken(userId: string, role: string, email: string): string {
  if (!process.env.NEXTAUTH_SECRET) {
    throw new Error('NEXTAUTH_SECRET not configured')
  }

  return jwt.sign(
    { 
      sub: userId, 
      role,
      email,
      type: 'access',
      iat: Math.floor(Date.now() / 1000)
    },
    process.env.NEXTAUTH_SECRET,
    { 
      expiresIn: '15m', // Short-lived for security
      issuer: 'zyphex-tech',
      audience: 'zyphex-tech-api'
    }
  )
}

/**
 * Token introspection
 * Validates token and returns decoded payload if valid
 */
export async function introspectToken(token: string): Promise<{
  active: boolean
  userId?: string
  role?: string
  email?: string
  exp?: number
  iat?: number
}> {
  try {
    // Check if blacklisted
    const isBlacklisted = await TokenBlacklist.isBlacklisted(token)
    if (isBlacklisted) {
      return { active: false }
    }

    if (!process.env.NEXTAUTH_SECRET) {
      return { active: false }
    }

    // Verify JWT
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET, {
      issuer: 'zyphex-tech',
      audience: 'zyphex-tech-api'
    }) as any
    
    return {
      active: true,
      userId: decoded.sub,
      role: decoded.role,
      email: decoded.email,
      exp: decoded.exp,
      iat: decoded.iat
    }
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.log('Token expired')
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.log('Invalid token')
    } else {
      console.error('Token introspection error:', error)
    }
    return { active: false }
  }
}

/**
 * Verify token and check blacklist
 * Middleware helper function
 */
export async function verifyToken(token: string): Promise<{
  valid: boolean
  payload?: any
  error?: string
}> {
  try {
    // Check blacklist first
    const isBlacklisted = await TokenBlacklist.isBlacklisted(token)
    if (isBlacklisted) {
      return { 
        valid: false, 
        error: 'Token has been revoked' 
      }
    }

    if (!process.env.NEXTAUTH_SECRET) {
      return { 
        valid: false, 
        error: 'Server configuration error' 
      }
    }

    // Verify JWT
    const payload = jwt.verify(token, process.env.NEXTAUTH_SECRET, {
      issuer: 'zyphex-tech',
      audience: 'zyphex-tech-api'
    })

    return { 
      valid: true, 
      payload 
    }
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return { 
        valid: false, 
        error: 'Token expired' 
      }
    } else if (error instanceof jwt.JsonWebTokenError) {
      return { 
        valid: false, 
        error: 'Invalid token' 
      }
    }
    
    return { 
      valid: false, 
      error: 'Token verification failed' 
    }
  }
}
