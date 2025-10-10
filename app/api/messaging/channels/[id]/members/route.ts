/**
 * API Route: Manage Channel Members
 * POST /api/messaging/channels/[id]/members - Add members to channel
 * DELETE /api/messaging/channels/[id]/members - Remove members from channel
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
    const body = await req.json()
    const { memberIds } = body

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return NextResponse.json(
        { error: 'Member IDs are required' },
        { status: 400 }
      )
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get channel
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        members: { select: { id: true } }
      }
    })

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    // Check permissions - only creator or admins can add members
    const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(currentUser.role)
    const isCreator = channel.createdById === session.user.id
    
    if (!isAdmin && !isCreator) {
      return NextResponse.json(
        { error: 'Only channel creator or admins can add members' },
        { status: 403 }
      )
    }

    // Add members to channel
    const updatedChannel = await prisma.channel.update({
      where: { id: channelId },
      data: {
        members: {
          connect: memberIds.map((id: string) => ({ id }))
        }
      },
      include: {
        members: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true
          }
        },
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Create system message
    const addedMembers = await prisma.user.findMany({
      where: { id: { in: memberIds } },
      select: { name: true }
    })

    await prisma.message.create({
      data: {
        content: `${currentUser.name} added ${addedMembers.map(m => m.name).join(', ')} to the channel`,
        channelId: channel.id,
        senderId: session.user.id,
        messageType: 'SYSTEM'
      }
    })

    return NextResponse.json({
      success: true,
      channel: updatedChannel
    })
  } catch (error) {
    console.error('Error adding members:', error)
    return NextResponse.json(
      { error: 'Failed to add members' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const channelId = params.id
    const body = await req.json()
    const { memberIds } = body

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return NextResponse.json(
        { error: 'Member IDs are required' },
        { status: 400 }
      )
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get channel
    const channel = await prisma.channel.findUnique({
      where: { id: channelId }
    })

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    // Check permissions - only creator or admins can remove members
    const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(currentUser.role)
    const isCreator = channel.createdById === session.user.id
    
    if (!isAdmin && !isCreator) {
      return NextResponse.json(
        { error: 'Only channel creator or admins can remove members' },
        { status: 403 }
      )
    }

    // Remove members from channel
    const updatedChannel = await prisma.channel.update({
      where: { id: channelId },
      data: {
        members: {
          disconnect: memberIds.map((id: string) => ({ id }))
        }
      },
      include: {
        members: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true
          }
        },
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Create system message
    const removedMembers = await prisma.user.findMany({
      where: { id: { in: memberIds } },
      select: { name: true }
    })

    await prisma.message.create({
      data: {
        content: `${currentUser.name} removed ${removedMembers.map(m => m.name).join(', ')} from the channel`,
        channelId: channel.id,
        senderId: session.user.id,
        messageType: 'SYSTEM'
      }
    })

    return NextResponse.json({
      success: true,
      channel: updatedChannel
    })
  } catch (error) {
    console.error('Error removing members:', error)
    return NextResponse.json(
      { error: 'Failed to remove members' },
      { status: 500 }
    )
  }
}
