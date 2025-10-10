/**
 * useMessaging Hook
 * Custom hook for messaging functionality with Socket.io integration
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Channel, Message, UserWithUnread, GroupedUsers, SearchResults } from '@/components/messaging/types'
import { toast } from 'sonner'
import { useSocket } from '@/hooks/use-socket'

export function useMessaging() {
  const { data: session } = useSession()
  const { socket, isConnected } = useSocket()
  
  const [channels, setChannels] = useState<Channel[]>([])
  const [users, setUsers] = useState<GroupedUsers>({
    admins: [],
    projectManagers: [],
    teamMembers: [],
    clients: []
  })
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  
  const typingTimeoutRef = useRef<NodeJS.Timeout>()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch channels
  const fetchChannels = useCallback(async () => {
    try {
      const response = await fetch('/api/messaging/channels')
      if (response.ok) {
        const data = await response.json()
        setChannels(data.channels || [])
      } else {
        toast.error('Failed to load channels')
      }
    } catch (error) {
      console.error('Error fetching channels:', error)
      toast.error('Failed to load channels')
    }
  }, [])

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/messaging/users?grouped=true')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.grouped)
      } else {
        toast.error('Failed to load users')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to load users')
    }
  }, [])

  // Fetch channel messages
  const fetchChannelMessages = useCallback(async (channelId: string) => {
    try {
      const response = await fetch(`/api/messaging/channels/${channelId}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
        setSelectedChannel(data.channel)
      } else {
        toast.error('Failed to load messages')
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
      toast.error('Failed to load messages')
    }
  }, [])

  // Send message
  const sendMessage = useCallback(async (content: string, channelId?: string, receiverId?: string) => {
    if (!content.trim()) return

    try {
      setSending(true)
      const response = await fetch('/api/messaging/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          channelId,
          receiverId
        })
      })

      if (response.ok) {
        const data = await response.json()
        // Message will be added via Socket.io event
        return data.message
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to send message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }, [])

  // Create or open DM
  const openDirectMessage = useCallback(async (userId: string, userName: string) => {
    try {
      const response = await fetch('/api/messaging/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `DM with ${userName}`,
          type: 'DIRECT',
          memberIds: [userId]
        })
      })

      if (response.ok) {
        const data = await response.json()
        await fetchChannelMessages(data.channel.id)
        await fetchChannels() // Refresh channel list
        return data.channel
      } else {
        toast.error('Failed to create conversation')
      }
    } catch (error) {
      console.error('Error creating DM:', error)
      toast.error('Failed to create conversation')
    }
  }, [fetchChannelMessages, fetchChannels])

  // Search
  const search = useCallback(async (query: string) => {
    if (!query.trim() || query.trim().length < 2) {
      setSearchResults(null)
      return
    }

    try {
      const response = await fetch(`/api/messaging/search?q=${encodeURIComponent(query)}`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.results)
      } else {
        toast.error('Search failed')
      }
    } catch (error) {
      console.error('Error searching:', error)
      toast.error('Search failed')
    }
  }, [])

  // Mark message as read
  const markAsRead = useCallback(async (messageId: string) => {
    try {
      await fetch(`/api/messaging/messages/${messageId}`, {
        method: 'PUT'
      })
    } catch (error) {
      console.error('Error marking message as read:', error)
    }
  }, [])

  // Typing indicators
  const startTyping = useCallback((channelId: string) => {
    if (socket && isConnected) {
      socket.emit('typing_start', { channelId })
    }
  }, [socket, isConnected])

  const stopTyping = useCallback((channelId: string) => {
    if (socket && isConnected) {
      socket.emit('typing_stop', { channelId })
    }
  }, [socket, isConnected])

  const handleTyping = useCallback((content: string, channelId: string) => {
    if (content.trim()) {
      startTyping(channelId)
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      
      // Stop typing after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(channelId)
      }, 3000)
    } else {
      stopTyping(channelId)
    }
  }, [startTyping, stopTyping])

  // Socket.io event handlers
  useEffect(() => {
    if (!socket || !isConnected) return

    // Join channel rooms
    if (selectedChannel) {
      socket.emit('join_channel', selectedChannel.id)
    }

    // New message event
    const handleNewMessage = (data: any) => {
      console.log('📨 Received new_message event:', data)
      console.log('📍 Current channel:', selectedChannel?.id)
      console.log('📍 Message channel:', data.channelId)
      
      // Transform data to match Message interface
      const newMessage: Message = {
        id: data.id,
        content: data.content,
        sender: data.sender,
        receiver: data.receiver || null,
        channelId: data.channelId,
        parentId: data.parentId || null,
        parent: data.parent || null,
        messageType: data.messageType || 'TEXT',
        isRead: false,
        createdAt: data.createdAt || data.timestamp || new Date().toISOString()
      }
      
      if (data.channelId === selectedChannel?.id) {
        console.log('✅ Adding message to current channel')
        setMessages(prev => {
          // Prevent duplicates
          const exists = prev.some(m => m.id === newMessage.id)
          if (exists) {
            console.log('⚠️ Message already exists, skipping')
            return prev
          }
          return [...prev, newMessage]
        })
        scrollToBottom()
      } else {
        console.log('⚠️ Message not for current channel')
      }
      
      // Update channel list
      fetchChannels()
    }

    // Typing events
    const handleUserTyping = (data: { userId: string; userName: string; channelId?: string }) => {
      if (data.channelId === selectedChannel?.id && data.userId !== session?.user?.id) {
        setTypingUsers(prev => {
          if (!prev.includes(data.userId)) {
            return [...prev, data.userId]
          }
          return prev
        })
      }
    }

    const handleUserStopTyping = (data: { userId: string; channelId?: string }) => {
      if (data.channelId === selectedChannel?.id) {
        setTypingUsers(prev => prev.filter(id => id !== data.userId))
      }
    }

    // Notification event
    const handleNotification = (data: any) => {
      if (data.channelId !== selectedChannel?.id) {
        toast.info(data.title, {
          description: data.message
        })
      }
      fetchChannels() // Update unread counts
    }

    socket.on('new_message', handleNewMessage)
    socket.on('user_typing', handleUserTyping)
    socket.on('user_stopped_typing', handleUserStopTyping)
    socket.on('notification', handleNotification)

    return () => {
      socket.off('new_message', handleNewMessage)
      socket.off('user_typing', handleUserTyping)
      socket.off('user_stopped_typing', handleUserStopTyping)
      socket.off('notification', handleNotification)
      
      if (selectedChannel) {
        socket.emit('leave_channel', selectedChannel.id)
      }
    }
  }, [socket, isConnected, selectedChannel, session, fetchChannels])

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Create channel
  const createChannel = useCallback(async (data: {
    name: string
    type: string
    description?: string
    isPrivate: boolean
  }) => {
    try {
      const response = await fetch('/api/messaging/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        await fetchChannels()
        toast.success('Channel created successfully')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create channel')
      }
    } catch (error) {
      console.error('Error creating channel:', error)
      toast.error('Failed to create channel')
    }
  }, [fetchChannels])

  // Delete channel
  const deleteChannel = useCallback(async (channelId: string) => {
    try {
      const response = await fetch(`/api/messaging/channels/${channelId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        if (selectedChannel?.id === channelId) {
          setSelectedChannel(null)
          setMessages([])
        }
        await fetchChannels()
        toast.success('Channel deleted successfully')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete channel')
      }
    } catch (error) {
      console.error('Error deleting channel:', error)
      toast.error('Failed to delete channel')
    }
  }, [selectedChannel, fetchChannels])

  // Pin/Unpin channel
  const togglePinChannel = useCallback(async (channelId: string) => {
    try {
      const response = await fetch(`/api/messaging/channels/${channelId}/pin`, {
        method: 'POST'
      })

      if (response.ok) {
        await fetchChannels()
        toast.success('Channel updated')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update channel')
      }
    } catch (error) {
      console.error('Error toggling pin:', error)
      toast.error('Failed to update channel')
    }
  }, [fetchChannels])

  // Add members to channel
  const addChannelMembers = useCallback(async (channelId: string, memberIds: string[]) => {
    try {
      const response = await fetch(`/api/messaging/channels/${channelId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberIds })
      })

      if (response.ok) {
        await fetchChannels()
        if (selectedChannel?.id === channelId) {
          await fetchChannelMessages(channelId)
        }
        toast.success('Members added successfully')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to add members')
      }
    } catch (error) {
      console.error('Error adding members:', error)
      toast.error('Failed to add members')
    }
  }, [fetchChannels, selectedChannel, fetchChannelMessages])

  // Remove members from channel
  const removeChannelMembers = useCallback(async (channelId: string, memberIds: string[]) => {
    try {
      const response = await fetch(`/api/messaging/channels/${channelId}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberIds })
      })

      if (response.ok) {
        await fetchChannels()
        if (selectedChannel?.id === channelId) {
          await fetchChannelMessages(channelId)
        }
        toast.success('Members removed successfully')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to remove members')
      }
    } catch (error) {
      console.error('Error removing members:', error)
      toast.error('Failed to remove members')
    }
  }, [fetchChannels, selectedChannel, fetchChannelMessages])

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchChannels(), fetchUsers()])
      setLoading(false)
    }
    loadData()
  }, [fetchChannels, fetchUsers])

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  return {
    // State
    channels,
    users,
    selectedChannel,
    messages,
    loading,
    sending,
    typingUsers,
    searchResults,
    searchQuery,
    isConnected,
    messagesEndRef,

    // Actions
    setSelectedChannel,
    setSearchQuery,
    fetchChannelMessages,
    sendMessage,
    openDirectMessage,
    search,
    markAsRead,
    handleTyping,
    scrollToBottom,
    
    // Channel Management
    createChannel,
    deleteChannel,
    togglePinChannel,
    addChannelMembers,
    removeChannelMembers,
    
    // Refresh
    refreshChannels: fetchChannels,
    refreshUsers: fetchUsers
  }
}
