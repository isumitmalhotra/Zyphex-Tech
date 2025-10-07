import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { sendEmail } from "@/lib/email"
import { getSocketManager } from "@/lib/socket/server"

// Validation schema for message creation
const createMessageSchema = z.object({
  content: z.string().min(1, "Message content is required").max(5000, "Message too long"),
  channelId: z.string().uuid("Invalid channel ID"),
  parentId: z.string().uuid("Invalid parent message ID").optional(),
  attachments: z.array(z.object({
    url: z.string().url(),
    name: z.string(),
    type: z.string(),
    size: z.number()
  })).optional()
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        projects: {
          where: { 
            // Get projects where user is the client
            clientId: { not: "" }
          },
          select: {
            id: true,
            name: true,
            description: true,
            status: true
          }
        }
      }
    })

    if (!user || user.role !== 'CLIENT') {
      return NextResponse.json({ error: "Access denied - Client access required" }, { status: 403 })
    }

    // Parse and validate request body
    const rawBody = await request.json()
    const validationResult = createMessageSchema.safeParse(rawBody)
    
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: "Validation failed", 
        details: validationResult.error.format() 
      }, { status: 400 })
    }

    const { content, channelId, parentId, attachments } = validationResult.data

    // Verify channel exists and client has access
    const clientProjectIds = (user as any).projects?.map((p: any) => p.id) || []

    const channel = await prisma.channel.findFirst({
      where: {
        id: channelId,
        OR: [
          // Project channels for client's projects
          {
            type: 'PROJECT',
            projectId: { in: clientProjectIds }
          },
          // Direct message channels client is a member of
          {
            type: 'DIRECT',
            members: { some: { id: user.id } }
          }
        ]
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

    if (!channel) {
      return NextResponse.json({ 
        error: "Channel not found or access denied" 
      }, { status: 404 })
    }

    // Verify parent message exists if parentId is provided
    if (parentId) {
      const parentMessage = await prisma.message.findFirst({
        where: {
          id: parentId,
          channelId: channelId
        }
      })
      
      if (!parentMessage) {
        return NextResponse.json({ 
          error: "Parent message not found" 
        }, { status: 404 })
      }
    }

    // Create the message
    const newMessage = await prisma.message.create({
      data: {
        content,
        senderId: user.id,
        channelId: channelId,
        parentId: parentId || null,
        messageType: parentId ? 'REPLY' : 'DIRECT',
        attachments: attachments ? JSON.stringify(attachments) : null
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true
          }
        },
        channel: {
          include: {
            members: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            }
          }
        },
        parent: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    // Update channel's updatedAt timestamp
    await prisma.channel.update({
      where: { id: channelId },
      data: { updatedAt: new Date() }
    })

    // Broadcast the new message via Socket.io
    const socketManager = getSocketManager()
    if (socketManager) {
      const messageData = {
        id: newMessage.id,
        content: newMessage.content,
        senderId: newMessage.senderId,
        channelId: newMessage.channelId,
        messageType: newMessage.messageType,
        createdAt: newMessage.createdAt.toISOString(),
        sender: {
          id: newMessage.sender.id,
          name: newMessage.sender.name,
          email: newMessage.sender.email,
          avatar: newMessage.sender.image
        },
        channel: newMessage.channel ? {
          id: newMessage.channel.id,
          name: newMessage.channel.name,
          type: newMessage.channel.type
        } : null,
        parent: newMessage.parent ? {
          id: newMessage.parent.id,
          content: newMessage.parent.content,
          sender: { name: newMessage.parent.sender.name }
        } : undefined
      }

      // Broadcast to all channel members
      const io = socketManager.getIO()
      io.to(`channel_${channelId}`).emit('new_message', {
        message: messageData,
        timestamp: new Date().toISOString()
      })

      console.log(`📨 Broadcasted message to channel ${channelId}`)
    }

    // Send email notifications to ZyphexTech team members in the channel (except sender)
    const zyphexTeamMembers = channel.members.filter(member => 
      member.id !== user.id && 
      member.email &&
      ['ADMIN', 'SUPER_ADMIN', 'PROJECT_MANAGER', 'TEAM_MEMBER'].includes(member.role)
    )

    // Send notifications asynchronously
    if (zyphexTeamMembers.length > 0) {
      // Don't await this - send in background
      Promise.all(
        zyphexTeamMembers.map(async (member) => {
          try {
            await sendEmail({
              to: member.email,
              subject: `New client message in ${channel.name}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h2 style="color: #333; margin: 0;">New Client Message in ${channel.name}</h2>
                    ${channel.project ? `<p style="color: #666; margin: 5px 0 0 0;">Project: ${channel.project.name}</p>` : ''}
                    <p style="color: #666; margin: 5px 0 0 0;">From: ${user.name} (Client)</p>
                  </div>
                  
                  <div style="background: white; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px; margin-bottom: 20px;">
                    <div style="display: flex; align-items: center; margin-bottom: 10px;">
                      <strong style="color: #333;">${newMessage.sender.name}</strong>
                      <span style="color: #007bff; margin-left: 8px; font-size: 12px; background: #e7f3ff; padding: 2px 6px; border-radius: 4px;">CLIENT</span>
                    </div>
                    <div style="color: #333; line-height: 1.5;">
                      ${content}
                    </div>
                    ${parentId ? `<div style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-left: 3px solid #007bff; font-size: 14px; color: #666;">Replying to a previous message</div>` : ''}
                  </div>
                  
                  <div style="text-align: center;">
                    <a href="${process.env.NEXTAUTH_URL}/admin/messages" 
                       style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                      View in ZyphexTech
                    </a>
                  </div>
                  
                  <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef; text-align: center; color: #666; font-size: 12px;">
                    <p>You're receiving this because you're a team member assigned to this client's project.</p>
                    <p><strong>Important:</strong> This message is from a client. Please respond promptly and professionally.</p>
                    <p>© ${new Date().getFullYear()} ZyphexTech. All rights reserved.</p>
                  </div>
                </div>
              `
            })
          } catch (emailError) {
            console.error(`Failed to send email notification to ${member.email}:`, emailError)
          }
        })
      ).catch(error => {
        console.error("Error sending email notifications:", error)
      })
    }

    // Log the message creation activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        entityType: 'MESSAGE',
        entityId: newMessage.id,
        changes: JSON.stringify({ 
          channelId: channelId,
          channelType: channel.type,
          projectId: channel.projectId,
          messageType: newMessage.messageType,
          isReply: !!parentId,
          hasAttachments: !!attachments?.length,
          isClientMessage: true
        })
      }
    })

    // Transform response data
    const transformedMessage = {
      id: newMessage.id,
      content: newMessage.content,
      sender: newMessage.sender,
      channelId: newMessage.channelId,
      parentId: newMessage.parentId,
      messageType: newMessage.messageType,
      attachments: attachments || [],
      reactions: [],
      isEdited: false,
      createdAt: newMessage.createdAt.toISOString(),
      updatedAt: newMessage.updatedAt.toISOString(),
      replies: []
    }

    return NextResponse.json({
      message: "Message sent successfully",
      data: transformedMessage
    }, { status: 201 })

  } catch (error: any) {
    console.error("Error sending client message:", error)
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}