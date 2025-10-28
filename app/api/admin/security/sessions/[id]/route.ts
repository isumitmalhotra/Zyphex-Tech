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

    // Delete the session
    await prisma.session.delete({
      where: {
        id: params.id
      }
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'SESSION_TERMINATED',
        resource: 'SECURITY',
        details: `Session ${params.id} was terminated by admin`,
        ipAddress: request.headers.get('x-forwarded-for') || 'Unknown',
        userAgent: request.headers.get('user-agent') || 'Unknown'
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Terminate session error:', error)
    return NextResponse.json(
      { error: 'Failed to terminate session' },
      { status: 500 }
    )
  }
}
