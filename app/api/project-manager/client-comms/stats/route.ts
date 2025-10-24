import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Count emails sent this month (messages with subject)
    const emailsSent = await prisma.message.count({
      where: {
        senderId: session.user.id,
        subject: { not: null },
        createdAt: { gte: firstDayOfMonth }
      }
    })

    // Count messages sent this month (messages without subject)
    const messagesSent = await prisma.message.count({
      where: {
        senderId: session.user.id,
        subject: null,
        createdAt: { gte: firstDayOfMonth }
      }
    })

    // Get calls count (we'll create a CallLog model, for now return 0)
    const calls = 0 // TODO: Implement when CallLog model is created

    // Get meetings count (we'll create a Meeting model, for now return 0)
    const meetings = 0 // TODO: Implement when Meeting model is created

    return NextResponse.json({
      emailsSent,
      messagesSent,
      calls,
      meetings
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
