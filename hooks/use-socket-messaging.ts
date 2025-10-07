'use client'

import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { io, Socket } from 'socket.io-client'

interface MessageData {
  id: string
  content: string
  senderId: string
  channelId?: string
  receiverId?: string
  messageType: 'DIRECT' | 'BROADCAST' | 'NOTIFICATION' | 'SYSTEM' | 'REPLY'
  createdAt: string
  sender: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  channel?: {
    id: string
    name: string
    type: string
  }
  parent?: {
    id: string
    content: string
    sender: { name: string }
  }
}

interface TypingIndicator {
  userId: string
  userName: string
  timestamp: string
}

interface MessageEvents {
  onNewMessage?: (message: MessageData) => void
  onMessageRead?: (data: { messageId: string; userId: string; userName: string }) => void
  onTypingStart?: (data: TypingIndicator) => void
  onTypingStop?: (data: TypingIndicator) => void
  onUserJoinedChannel?: (data: { userId: string; userName: string; channelId: string }) => void
  onUserLeftChannel?: (data: { userId: string; userName: string; channelId: string }) => void
  onError?: (error: { message: string }) => void
}

export function useSocketMessaging(events?: MessageEvents) {
  const { data: session } = useSession()
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectedUsers, setConnectedUsers] = useState<string[]>([])
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()

  // Connect to Socket.io server
  const connect = () => {
    if (socketRef.current?.connected) return

    if (!session?.user?.id) {
      console.log('No session found, skipping socket connection')
      return
    }

    try {
      // Create authentication token
      const authToken = btoa(JSON.stringify({
        userId: session.user.id,
        email: session.user.email,
        name: session.user.name
      }))

      socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin, {
        path: '/api/socket/io',
        addTrailingSlash: false,
        auth: {
          token: authToken
        },
        transports: ['websocket', 'polling'],
        upgrade: true,
        rememberUpgrade: true,
        timeout: 20000,
        forceNew: false,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        autoConnect: true
      })

      const socket = socketRef.current

      // Connection events
      socket.on('connect', () => {
        console.log('🔌 Connected to messaging server')
        setIsConnected(true)
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
        }
      })

      socket.on('disconnect', (reason) => {
        console.log('❌ Disconnected from messaging server:', reason)
        setIsConnected(false)
        
        // Only auto-reconnect for transport errors, not server disconnects
        if (reason === 'transport close' || reason === 'transport error') {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('🔄 Attempting to reconnect...')
            if (socketRef.current && !socketRef.current.connected) {
              socketRef.current.connect()
            }
          }, 2000)
        }
      })

      socket.on('connect_error', (error) => {
        console.error('Connection error:', error)
        setIsConnected(false)
        events?.onError?.({ message: 'Failed to connect to messaging server' })
        
        // Don't spam reconnection attempts
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
        }
      })

      // Messaging events
      socket.on('new_message', (data: { message: MessageData }) => {
        console.log('📨 New message received:', data.message)
        events?.onNewMessage?.(data.message)
      })

      socket.on('message_read', (data: { messageId: string; userId: string; userName: string }) => {
        console.log('✅ Message read:', data)
        events?.onMessageRead?.(data)
      })

      socket.on('user_typing', (data: TypingIndicator) => {
        events?.onTypingStart?.(data)
      })

      socket.on('user_stopped_typing', (data: TypingIndicator) => {
        events?.onTypingStop?.(data)
      })

      socket.on('user_joined_channel', (data: { userId: string; userName: string; channelId: string }) => {
        console.log('👋 User joined channel:', data)
        events?.onUserJoinedChannel?.(data)
      })

      socket.on('user_left_channel', (data: { userId: string; userName: string; channelId: string }) => {
        console.log('👋 User left channel:', data)
        events?.onUserLeftChannel?.(data)
      })

      socket.on('error', (error: { message: string }) => {
        console.error('Socket error:', error)
        events?.onError?.(error)
      })

      socket.on('message_sent', (data: { message: MessageData }) => {
        console.log('✅ Message sent confirmation:', data.message)
        // This confirms the message was sent successfully
      })

    } catch (error) {
      console.error('Failed to create socket connection:', error)
      events?.onError?.({ message: 'Failed to initialize messaging connection' })
    }
  }

  // Disconnect from Socket.io server
  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }
    setIsConnected(false)
  }

  // Join a channel for real-time updates
  const joinChannel = (channelId: string) => {
    if (!socketRef.current?.connected) {
      console.warn('Socket not connected, cannot join channel')
      return
    }
    
    console.log('🚪 Joining channel:', channelId)
    socketRef.current.emit('join_channel', channelId)
  }

  // Leave a channel
  const leaveChannel = (channelId: string) => {
    if (!socketRef.current?.connected) return
    
    console.log('🚪 Leaving channel:', channelId)
    socketRef.current.emit('leave_channel', channelId)
  }

  // Send a message
  const sendMessage = (data: {
    channelId?: string
    receiverId?: string
    content: string
    messageType?: 'DIRECT' | 'BROADCAST' | 'NOTIFICATION' | 'SYSTEM' | 'REPLY'
    replyToId?: string
  }) => {
    if (!socketRef.current?.connected) {
      console.warn('Socket not connected, cannot send message')
      events?.onError?.({ message: 'Not connected to messaging server' })
      return
    }

    console.log('📤 Sending message:', data)
    socketRef.current.emit('send_message', data)
  }

  // Send typing indicator
  const startTyping = (channelId?: string, receiverId?: string) => {
    if (!socketRef.current?.connected) return
    
    socketRef.current.emit('typing_start', { channelId, receiverId })
  }

  const stopTyping = (channelId?: string, receiverId?: string) => {
    if (!socketRef.current?.connected) return
    
    socketRef.current.emit('typing_stop', { channelId, receiverId })
  }

  // Mark message as read
  const markMessageAsRead = (messageId: string) => {
    if (!socketRef.current?.connected) return
    
    socketRef.current.emit('mark_message_read', { messageId })
  }

  // Add reaction to message
  const addReaction = (messageId: string, emoji: string) => {
    if (!socketRef.current?.connected) return
    
    socketRef.current.emit('add_reaction', { messageId, emoji })
  }

  // Auto-connect when session is available
  useEffect(() => {
    if (session?.user?.id) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [session?.user?.id])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [])

  return {
    isConnected,
    connect,
    disconnect,
    joinChannel,
    leaveChannel,
    sendMessage,
    startTyping,
    stopTyping,
    markMessageAsRead,
    addReaction,
    connectedUsers
  }
}

export default useSocketMessaging