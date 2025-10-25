/**
 * Socket.io Server Initialization
 * Works with both Next.js dev server (npm run dev) and custom server
 */

import { Server as HTTPServer } from 'http'
import { Server as SocketIOServer, Socket } from 'socket.io'

// Type definitions for global augmentation
interface _SocketWithUser extends Socket {
  userId?: string
  userEmail?: string
  userName?: string
}

interface _GlobalWithSocketIO {
  httpServer?: HTTPServer
  socketio?: SocketIOServer
}

let io: SocketIOServer | null = null

export async function initializeSocketIO() {
  // Prevent double initialization
  if (io) {
    console.log('Socket.io already initialized')
    return io
  }

  try {
    // Check if we're running with custom server.js (has global.httpServer)
    const globalWithSocketIO = global as unknown as _GlobalWithSocketIO
    const httpServer = globalWithSocketIO.httpServer
    
    if (!httpServer) {
      console.log('⚠️  No HTTP server found - Socket.io will be initialized when custom server starts')
      console.log('    For WebSocket support, use: npm run dev:custom')
      return null
    }

    // Initialize Socket.io
    io = new SocketIOServer(httpServer, {
      path: '/api/socket/io',
      addTrailingSlash: false,
      transports: ['websocket', 'polling'],
      allowEIO3: true,
      cors: {
        origin: [
          process.env.NEXTAUTH_URL || 'http://localhost:3000',
          'https://zyphextech.com',
          'https://www.zyphextech.com',
          'http://localhost:3000'
        ],
        methods: ['GET', 'POST'],
        credentials: true
      },
      pingTimeout: 60000,
      pingInterval: 25000
    })

    // Store globally for API routes to access
    globalWithSocketIO.socketio = io

    // Authentication middleware
    io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token
        
        if (!token) {
          return next(new Error('Authentication token required'))
        }

        // Decode the base64 token
        let decoded: { userId: string; email?: string; userEmail?: string; name?: string; userName?: string }
        try {
          const decodedString = Buffer.from(token, 'base64').toString()
          decoded = JSON.parse(decodedString)
        } catch (_error) {
          return next(new Error('Invalid token format'))
        }
        
        // Store user info on socket
        const socketWithUser = socket as _SocketWithUser
        socketWithUser.userId = decoded.userId
        socketWithUser.userEmail = decoded.email || decoded.userEmail
        socketWithUser.userName = decoded.name || decoded.userName
        
        next()
      } catch (_error) {
        next(new Error('Authentication failed'))
      }
    })

    // Connection handling
    io.on('connection', (socket) => {
      const socketWithUser = socket as _SocketWithUser
      const userId = socketWithUser.userId
      const userName = socketWithUser.userName
      
      console.log(`👤 User connected: ${userName} (${userId})`)
      
      // Join user to their personal room
      socket.join(`user_${userId}`)

      // Handle joining channel rooms
      socket.on('join_channel', (channelId) => {
        socket.join(`channel_${channelId}`)
        socket.to(`channel_${channelId}`).emit('user_joined_channel', {
          userId,
          userName,
          channelId,
          timestamp: new Date().toISOString()
        })
        console.log(`📢 ${userName} joined channel: ${channelId}`)
      })

      // Handle leaving channel rooms
      socket.on('leave_channel', (channelId) => {
        socket.leave(`channel_${channelId}`)
        socket.to(`channel_${channelId}`).emit('user_left_channel', {
          userId,
          userName,
          channelId,
          timestamp: new Date().toISOString()
        })
        console.log(`📢 ${userName} left channel: ${channelId}`)
      })

      // Handle new messages
      socket.on('send_message', async (data) => {
        try {
          const { channelId, content, receiverId } = data

          const messageData = {
            id: Date.now().toString(),
            senderId: userId,
            senderName: userName,
            content,
            timestamp: new Date().toISOString(),
            channelId: channelId || null
          }

          if (channelId) {
            // Channel message - broadcast to all channel members
            io?.to(`channel_${channelId}`).emit('new_message', messageData)
            console.log(`💬 Message sent to channel ${channelId} by ${userName}`)
          } else if (receiverId) {
            // Direct message
            io?.to(`user_${receiverId}`).emit('new_message', messageData)
            socket.emit('message_sent', messageData)
            console.log(`💬 DM sent from ${userName} to user ${receiverId}`)
          }
        } catch (_error) {
          socket.emit('error', { message: 'Failed to send message' })
        }
      })

      // Handle typing indicators
      socket.on('typing_start', (data) => {
        const { channelId, receiverId } = data
        
        const typingData = {
          userId,
          userName,
          channelId,
          timestamp: new Date().toISOString()
        }

        if (channelId) {
          socket.to(`channel_${channelId}`).emit('user_typing', typingData)
        } else if (receiverId) {
          io?.to(`user_${receiverId}`).emit('user_typing', typingData)
        }
      })

      socket.on('typing_stop', (data) => {
        const { channelId, receiverId } = data
        
        const typingData = {
          userId,
          userName,
          channelId,
          timestamp: new Date().toISOString()
        }

        if (channelId) {
          socket.to(`channel_${channelId}`).emit('user_stopped_typing', typingData)
        } else if (receiverId) {
          io?.to(`user_${receiverId}`).emit('user_stopped_typing', typingData)
        }
      })

      // Handle disconnect
      socket.on('disconnect', (reason) => {
        console.log(`👋 User disconnected: ${userName} (${reason})`)
      })

      // Send welcome message
      socket.emit('connected', {
        message: 'Connected to real-time messaging',
        userId,
        userName
      })
    })

    console.log('✅ Socket.io server configured and listening')
    return io
  } catch (error) {
    console.error('❌ Failed to initialize Socket.io:', error)
    throw error
  }
}

export function getIO(): SocketIOServer | null {
  const globalWithSocketIO = global as unknown as _GlobalWithSocketIO
  return io || globalWithSocketIO.socketio || null
}
