import { NextRequest, NextResponse } from 'next/server'
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
    const { clientId, title, date, duration, type, notes } = body

    if (!clientId || !title || !date) {
      return NextResponse.json({ error: 'Client ID, title, and date required' }, { status: 400 })
    }

    // Store meeting as a special message type with metadata in attachments field
    const meetingData = {
      type: 'meeting',
      title,
      date,
      duration,
      meetingType: type,
      notes,
      status: 'scheduled'
    }

    const message = await prisma.message.create({
      data: {
        senderId: session.user.id,
        receiverId: clientId,
        content: `Meeting scheduled: ${title}`,
        subject: `Meeting: ${title}`,
        messageType: 'SYSTEM',
        attachments: JSON.stringify([meetingData])
      }
    })

    return NextResponse.json({
      id: message.id,
      success: true,
      meeting: meetingData
    }, { status: 201 })
  } catch (error) {
    console.error('Error scheduling meeting:', error)
    return NextResponse.json({ error: 'Failed to schedule meeting' }, { status: 500 })
  }
}
