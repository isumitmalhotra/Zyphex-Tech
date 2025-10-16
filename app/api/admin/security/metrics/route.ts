import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request })
    
    if (!token || token.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get security metrics
    const now = new Date()
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // User statistics
    const userStats = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        id: true
      }
    })

    // Recent registrations
    const recentRegistrations = await prisma.user.count({
      where: {
        createdAt: {
          gte: last24Hours
        }
      }
    })

    // Users by verification status
    const emailVerificationStats = await prisma.user.groupBy({
      by: ['emailVerified'],
      _count: {
        id: true
      }
    })

    // Active sessions (not expired)
    const activeSessions = await prisma.session.count({
      where: {
        expires: {
          gte: now
        }
      }
    })

    // OAuth accounts
    const oauthStats = await prisma.account.groupBy({
      by: ['provider'],
      _count: {
        id: true
      }
    })

    const securityMetrics = {
      userStats: userStats.reduce((acc, stat) => {
        acc[stat.role] = stat._count.id
        return acc
      }, {} as Record<string, number>),
      
      recentActivity: {
        newRegistrations24h: recentRegistrations,
        activeSessions7d: activeSessions
      },
      
      emailVerification: {
        verified: emailVerificationStats.find(s => s.emailVerified !== null)?._count.id || 0,
        unverified: emailVerificationStats.find(s => s.emailVerified === null)?._count.id || 0
      },
      
      oauthProviders: oauthStats.reduce((acc, stat) => {
        acc[stat.provider] = stat._count.id
        return acc
      }, {} as Record<string, number>),
      
      securityFeatures: {
        passwordComplexity: true,
        rateLimiting: true,
        inputValidation: true,
        securityHeaders: true,
        auditLogging: true,
        emailVerification: true,
        oauthIntegration: true
      },
      
      timestamp: now.toISOString()
    }

    return NextResponse.json(securityMetrics)

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch security metrics' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}