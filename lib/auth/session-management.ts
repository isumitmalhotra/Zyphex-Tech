import { NextRequest } from 'next/server'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { logAuthEvent } from './audit-logging'

interface RefreshTokenData {
  userId: string
  sessionId: string
  expiresAt: Date
}

interface SessionData {
  id: string
  userId: string
  expiresAt: Date
  lastActivity: Date
  ipAddress?: string
  userAgent?: string
}

export async function createSession(userId: string, request: NextRequest): Promise<SessionData> {
  const sessionId = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  
  const session: SessionData = {
    id: sessionId,
    userId,
    expiresAt,
    lastActivity: new Date(),
    ipAddress: request.ip,
    userAgent: request.headers.get('user-agent') || undefined
  }

  await logAuthEvent({
    userId,
    action: 'SESSION_CREATED',
    resource: 'session',
    resourceId: sessionId,
    ipAddress: session.ipAddress,
    userAgent: session.userAgent
  })

  return session
}

export async function validateSession(_sessionId: string): Promise<SessionData | null> {
  // In a real implementation, this would query the database
  return null
}

export async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const decoded = jwt.verify(refreshToken, process.env.NEXTAUTH_SECRET!) as JwtPayload & RefreshTokenData
    // Generate new access token
    return jwt.sign(
      { userId: decoded.userId, sessionId: decoded.sessionId },
      process.env.NEXTAUTH_SECRET!,
      { expiresIn: '15m' }
    )
  } catch {
    return null
  }
}

export async function revokeSession(sessionId: string, userId: string): Promise<void> {
  await logAuthEvent({
    userId,
    action: 'SESSION_REVOKED',
    resource: 'session',
    resourceId: sessionId
  })
}
