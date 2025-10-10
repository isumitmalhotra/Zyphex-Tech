/**
 * API Route: Toggle Pin Channel
 * POST /api/messaging/channels/[id]/pin
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const channelId = params.id

    // Get current channel
    const channel = await prisma.channel.findUnique({
      where: { id: channelId }
    })

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    // Toggle pin status
    const updatedChannel = await prisma.channel.update({
      where: { id: channelId },
      data: {
        isPinned: !channel.isPinned
      }
    })

    return NextResponse.json({
      success: true,
      channel: updatedChannel
    })
  } catch (error) {
    console.error('Error toggling pin:', error)
    return NextResponse.json(
      { error: 'Failed to update channel' },
      { status: 500 }
    )
  }
}
