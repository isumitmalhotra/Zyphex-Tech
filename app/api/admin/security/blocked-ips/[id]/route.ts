import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the blocked IP before deleting
    const blockedIP = await prisma.blockedIP.findUnique({
      where: { id: params.id }
    })

    if (!blockedIP) {
      return NextResponse.json(
        { error: 'Blocked IP not found' },
        { status: 404 }
      )
    }

    // Delete the blocked IP
    await prisma.blockedIP.delete({
      where: { id: params.id }
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'IP_UNBLOCKED',
        category: 'SECURITY',
        description: `IP address ${blockedIP.ipAddress} was unblocked`,
        ipAddress: request.headers.get('x-forwarded-for') || 'Unknown',
        userAgent: request.headers.get('user-agent') || 'Unknown',
        metadata: { unblockedIP: blockedIP.ipAddress }
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Unblock IP error:', error)
    return NextResponse.json(
      { error: 'Failed to unblock IP' },
      { status: 500 }
    )
  }
}
