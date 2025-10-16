import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { User, Account } from '@prisma/client'

type UserWithAccounts = User & {
  accounts: Account[]
}

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Get recent OAuth users (created in last 24 hours)
    const recentOAuthUsers: UserWithAccounts[] = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        },
        password: null, // OAuth users don't have passwords
        emailVerified: {
          not: null // OAuth users should have verified emails
        }
      },
      include: {
        accounts: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    })

    // Get total OAuth users count
    const totalOAuthUsers = await prisma.user.count({
      where: {
        password: null,
        emailVerified: {
          not: null
        }
      }
    })

    // Get provider statistics
    const providerStats = await prisma.account.groupBy({
      by: ['provider'],
      _count: {
        provider: true
      },
      orderBy: {
        _count: {
          provider: 'desc'
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        recentOAuthUsers: recentOAuthUsers.map(user => ({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
          providers: user.accounts.map((acc: Account) => ({
            provider: acc.provider,
            type: acc.type
          }))
        })),
        statistics: {
          totalOAuthUsers,
          recentSignUpsLast24h: recentOAuthUsers.length,
          providerBreakdown: providerStats.map(stat => ({
            provider: stat.provider,
            userCount: stat._count.provider
          }))
        }
      },
      message: 'OAuth user creation statistics retrieved successfully'
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch OAuth user statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}