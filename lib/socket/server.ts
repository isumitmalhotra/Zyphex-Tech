import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

interface AuthenticatedSocket extends Socket {
  userId: string;
  userRole: string;
  userEmail: string;
  userName: string;
}

export class SocketManager {
  private io: Server;
  private userSockets: Map<string, string> = new Map();
  private projectUsers: Map<string, Set<string>> = new Map();

  constructor(server: any) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
        methods: ['GET', 'POST'],
        credentials: true
      },
      path: '/api/socket/io',
      addTrailingSlash: false,
    });

    this.setupAuthentication();
    this.setupEventHandlers();
  }

  private setupAuthentication() {
    this.io.use(async (socket: any, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // Decode the base64 token
        let decoded: any;
        try {
          const decodedString = atob(token);
          decoded = JSON.parse(decodedString);
        } catch (error) {
          return next(new Error('Invalid token format'));
        }
        
        // Fetch user details from database to verify
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, email: true, role: true, name: true }
        });

        if (!user) {
          return next(new Error('User not found'));
        }

        socket.userId = user.id;
        socket.userRole = user.role;
        socket.userEmail = user.email;
        socket.userName = user.name;
        
        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      const authSocket = socket as AuthenticatedSocket;
      
      // Store user socket mapping
      this.userSockets.set(authSocket.userId, authSocket.id);

      // Join user to their personal room for direct notifications
      authSocket.join(`user_${authSocket.userId}`);

      // Handle joining channel rooms for messaging
      authSocket.on('join_channel', async (channelId: string) => {
        try {
          // Verify user has access to this channel
          const hasAccess = await this.verifyChannelAccess(authSocket.userId, channelId);
          if (!hasAccess) {
            authSocket.emit('error', { message: 'Access denied to channel' });
            return;
          }

          authSocket.join(`channel_${channelId}`);
          
          // Notify other channel members
          authSocket.to(`channel_${channelId}`).emit('user_joined_channel', {
            userId: authSocket.userId,
            userName: authSocket.userName,
            channelId,
            timestamp: new Date().toISOString()
          });

        } catch (error) {
          authSocket.emit('error', { message: 'Failed to join channel' });
        }
      });

      // Handle leaving channel rooms
      authSocket.on('leave_channel', (channelId: string) => {
        authSocket.leave(`channel_${channelId}`);
        
        // Notify other channel members
        authSocket.to(`channel_${channelId}`).emit('user_left_channel', {
          userId: authSocket.userId,
          userName: authSocket.userName,
          channelId,
          timestamp: new Date().toISOString()
        });

      });

      // Handle new messages
      authSocket.on('send_message', async (data: any) => {
        try {
          const { channelId, content, messageType, replyToId } = data;

          // Verify user has access to send messages in this channel
          if (channelId) {
            const hasAccess = await this.verifyChannelAccess(authSocket.userId, channelId);
            if (!hasAccess) {
              authSocket.emit('error', { message: 'Access denied to send message in channel' });
              return;
            }
          }

          // Create message in database
          const message = await prisma.message.create({
            data: {
              senderId: authSocket.userId,
              channelId: channelId || null,
              content,
              messageType: messageType || 'DIRECT',
              parentId: replyToId || null
            },
            include: {
              sender: {
                select: { id: true, name: true, email: true, image: true }
              },
              channel: {
                select: { id: true, name: true, type: true }
              },
              parent: {
                select: { id: true, content: true, sender: { select: { name: true } } }
              }
            }
          });

          // Broadcast to channel members or direct recipient
          const eventData = {
            message,
            timestamp: new Date().toISOString()
          };

          if (channelId) {
            // Channel message - broadcast to all channel members
            this.io.to(`channel_${channelId}`).emit('new_message', eventData);
          } else {
            // Direct message - send to specific user
            const { receiverId } = data;
            if (receiverId) {
              this.notifyUser(receiverId, 'new_message', eventData);
              // Also send confirmation to sender
              authSocket.emit('message_sent', eventData);
            }
          }

        } catch (error) {
          authSocket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Handle message reactions
      authSocket.on('add_reaction', async (data: any) => {
        try {
          const { messageId, emoji } = data;

          // Create reaction in database
          const reaction = await prisma.messageReaction.create({
            data: {
              messageId,
              userId: authSocket.userId,
              emoji
            },
            include: {
              user: {
                select: { id: true, name: true, image: true }
              },
              message: {
                select: { channelId: true }
              }
            }
          });

          // Broadcast reaction to channel or direct message participants
          const eventData = {
            reaction,
            timestamp: new Date().toISOString()
          };

          if (reaction.message.channelId) {
            this.io.to(`channel_${reaction.message.channelId}`).emit('message_reaction_added', eventData);
          }

        } catch (error) {
          authSocket.emit('error', { message: 'Failed to add reaction' });
        }
      });

      // Handle typing indicators
      authSocket.on('typing_start', (data: any) => {
        const { channelId, receiverId } = data;
        
        const typingData = {
          userId: authSocket.userId,
          userName: authSocket.userName,
          timestamp: new Date().toISOString()
        };

        if (channelId) {
          authSocket.to(`channel_${channelId}`).emit('user_typing', typingData);
        } else if (receiverId) {
          this.notifyUser(receiverId, 'user_typing', typingData);
        }
      });

      authSocket.on('typing_stop', (data: any) => {
        const { channelId, receiverId } = data;
        
        const typingData = {
          userId: authSocket.userId,
          userName: authSocket.userName,
          timestamp: new Date().toISOString()
        };

        if (channelId) {
          authSocket.to(`channel_${channelId}`).emit('user_stopped_typing', typingData);
        } else if (receiverId) {
          this.notifyUser(receiverId, 'user_stopped_typing', typingData);
        }
      });

      // Handle message read status
      authSocket.on('mark_message_read', async (data: any) => {
        try {
          const { messageId } = data;

          // Create or update read status
          await prisma.messageRead.upsert({
            where: {
              messageId_userId: {
                messageId,
                userId: authSocket.userId
              }
            },
            update: {
              readAt: new Date()
            },
            create: {
              messageId,
              userId: authSocket.userId,
              readAt: new Date()
            }
          });

          // Get the message to find the channel
          const message = await prisma.message.findUnique({
            where: { id: messageId },
            select: { channelId: true, senderId: true }
          });

          if (message) {
            const readData = {
              messageId,
              userId: authSocket.userId,
              userName: authSocket.userName,
              timestamp: new Date().toISOString()
            };

            // Notify the message sender
            this.notifyUser(message.senderId, 'message_read', readData);

            // If it's a channel message, broadcast to channel (for read receipts)
            if (message.channelId) {
              this.io.to(`channel_${message.channelId}`).emit('message_read', readData);
            }
          }

        } catch (error) {
          authSocket.emit('error', { message: 'Failed to mark message as read' });
        }
      });

      // Handle joining project rooms
      authSocket.on('join_project', async (projectId: string) => {
        try {
          // Verify user has access to this project
          const hasAccess = await this.verifyProjectAccess(authSocket.userId, projectId);
          if (!hasAccess) {
            authSocket.emit('error', { message: 'Access denied to project' });
            return;
          }

          authSocket.join(`project_${projectId}`);
          
          // Track project users
          if (!this.projectUsers.has(projectId)) {
            this.projectUsers.set(projectId, new Set());
          }
          this.projectUsers.get(projectId)!.add(authSocket.userId);

          // Notify other project members
          authSocket.to(`project_${projectId}`).emit('user_joined_project', {
            userId: authSocket.userId,
            userName: authSocket.userName,
            timestamp: new Date().toISOString()
          });

        } catch (error) {
          authSocket.emit('error', { message: 'Failed to join project' });
        }
      });

      // Handle leaving project rooms
      authSocket.on('leave_project', (projectId: string) => {
        authSocket.leave(`project_${projectId}`);
        
        // Remove from project users tracking
        this.projectUsers.get(projectId)?.delete(authSocket.userId);
        
        // Notify other project members
        authSocket.to(`project_${projectId}`).emit('user_left_project', {
          userId: authSocket.userId,
          userName: authSocket.userName,
          timestamp: new Date().toISOString()
        });

      });

      // Handle disconnect
      authSocket.on('disconnect', () => {
        
        // Remove from user socket mapping
        this.userSockets.delete(authSocket.userId);
        
        // Remove from all project tracking
        for (const [projectId, users] of this.projectUsers.entries()) {
          users.delete(authSocket.userId);
        }
      });
    });
  }

  // Verify if user has access to a project
  private async verifyProjectAccess(userId: string, projectId: string): Promise<boolean> {
    try {
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          OR: [
            { managerId: userId },
            { users: { some: { id: userId } } }
          ]
        }
      });
      return !!project;
    } catch (error) {
      return false;
    }
  }

  // Verify if user has access to a channel
  private async verifyChannelAccess(userId: string, channelId: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      if (!user) return false;

      // Admin and Super Admin have access to all channels
      if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
        return true;
      }

      const channel = await prisma.channel.findFirst({
        where: {
          id: channelId,
          OR: [
            // User is a member of the channel
            { members: { some: { id: userId } } },
            // Channel is public and user is team member or project manager
            { 
              isPrivate: false,
              OR: [
                // Team channel - accessible to all team members/project managers
                { type: 'TEAM', AND: [{ NOT: { type: 'PROJECT' } }] },
                // Project channel - user is assigned to the project
                {
                  type: 'PROJECT',
                  project: {
                    OR: [
                      { managerId: userId },
                      { users: { some: { id: userId } } }
                    ]
                  }
                }
              ]
            }
          ]
        },
        include: {
          project: {
            select: {
              managerId: true,
              users: { select: { id: true } }
            }
          }
        }
      });

      return !!channel;
    } catch (error) {
      return false;
    }
  }

  // Log activity for audit trail
  private async logActivity(userId: string, action: string, entityType: string, entityId: string, changes: any) {
    try {
      await prisma.activityLog.create({
        data: {
          userId,
          action,
          entityType,
          entityId,
          changes: JSON.stringify(changes),
          createdAt: new Date()
        }
      });
    } catch (error) {
      // Error logging activity
    }
  }

  // Public methods for external use

  // Emit notifications to specific users
  public notifyUser(userId: string, event: string, data: any) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    } else {
      // User not connected, notification queued
    }
  }

  // Broadcast project updates to all project members
  public broadcastToProject(projectId: string, event: string, data: any) {
    this.io.to(`project_${projectId}`).emit(event, data);
  }

  // Broadcast to channel members
  public broadcastToChannel(channelId: string, event: string, data: any) {
    this.io.to(`channel_${channelId}`).emit(event, data);
  }

  // Send notification to all users with specific roles
  public broadcastToRole(role: string, event: string, data: any) {
    this.io.emit('role_notification', { role, event, data });
  }

  // Get connected users for a project
  public getProjectUsers(projectId: string): string[] {
    return Array.from(this.projectUsers.get(projectId) || []);
  }

  // Check if user is online
  public isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  // Get total connected users count
  public getConnectedUsersCount(): number {
    return this.userSockets.size;
  }

  // Expose io instance for direct access if needed
  public getIO(): Server {
    return this.io;
  }
}

// Export singleton instance
let socketManager: SocketManager | null = null;

export function initializeSocketManager(server: any): SocketManager {
  if (!socketManager) {
    socketManager = new SocketManager(server);
  }
  return socketManager;
}

export function getSocketManager(): SocketManager | null {
  return socketManager;
}