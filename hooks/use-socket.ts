/**
 * Socket.io Hook
 * Manages Socket.io connection and provides socket instance
 */

"use client"

import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { io, Socket } from 'socket.io-client'

export function useSocket() {
  const { data: session, status } = useSession()
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    // Only connect when authenticated
    if (status !== 'authenticated' || !session?.user?.id) {
      return
    }

    // TODO: Enable Socket.io when server is configured
    // Temporarily disabled to prevent 503 errors
    const ENABLE_SOCKET_IO = false;
    
    if (!ENABLE_SOCKET_IO) {
      console.log('Socket.io disabled - real-time features unavailable');
      return;
    }

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin
    
    // Create authentication token
    const socketToken = btoa(JSON.stringify({
      userId: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
      iat: Math.floor(Date.now() / 1000)
    }))

    // Initialize socket connection
    const socketInstance = io(socketUrl, {
      path: '/api/socket/io',
      auth: {
        token: socketToken
      },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      timeout: 20000
    })

    socketRef.current = socketInstance

    // Connection event handlers
    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id)
      setIsConnected(true)
    })

    socketInstance.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)
      setIsConnected(false)
    })

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      setIsConnected(false)
    })

    // Cleanup on unmount
    return () => {
      if (socketInstance) {
        socketInstance.disconnect()
      }
    }
  }, [session, status])

  return {
    socket: socketRef.current,
    isConnected
  }
}
