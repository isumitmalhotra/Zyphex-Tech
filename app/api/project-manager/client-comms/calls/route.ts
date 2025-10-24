import { NextRequest, NextResponse} from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { clientId, type, duration, notes } = body

    if (!clientId || !type) {
      return NextResponse.json({ error: 'Client ID and type required' }, { status: 400 })
    }

    // Store call as a special message type with metadata in attachments field
    const callData = {
      type: 'call',
      callType: type,
      duration: duration || 0,
      notes: notes || '',
      timestamp: new Date().toISOString()
    }

    const message = await prisma.message.create({
      data: {
        senderId: session.user.id,
        receiverId: clientId,
        content: `Call logged: ${type} call${duration ? ` (${duration} minutes)` : ''}`,
        subject: `Call: ${type}`,
        messageType: 'SYSTEM',
        attachments: JSON.stringify([callData])
      }
    })

    return NextResponse.json({
      id: message.id,
      success: true,
      call: callData
    }, { status: 201 })
  } catch (error) {
    console.error('Error logging call:', error)
    return NextResponse.json({ error: 'Failed to log call' }, { status: 500 })
  }
}
