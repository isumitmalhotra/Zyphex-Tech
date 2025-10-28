import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // BlockedIP model doesn't exist in schema - return empty array
    // This feature would need the model added to prisma/schema.prisma
    return NextResponse.json([])

  } catch (error) {
    console.error('Blocked IPs error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch blocked IPs' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { ipAddress, reason } = body

    if (!ipAddress) {
      return NextResponse.json(
        { error: 'IP address is required' },
        { status: 400 }
      )
    }

    // BlockedIP model doesn't exist - log the action instead
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'IP_BLOCKED',
        resource: 'SECURITY',
        details: JSON.stringify({ 
          ipAddress, 
          reason: reason || 'Blocked by administrator' 
        }),
        ipAddress: request.headers.get('x-forwarded-for') || 'Unknown',
        userAgent: request.headers.get('user-agent') || 'Unknown'
      }
    })

    return NextResponse.json({ 
      success: true,
      message: 'IP block logged (BlockedIP model not implemented)'
    })

  } catch (error) {
    console.error('Block IP error:', error)
    return NextResponse.json(
      { error: 'Failed to block IP' },
      { status: 500 }
    )
  }
}
