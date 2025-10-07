'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useSocketMessaging } from '@/hooks/use-socket-messaging'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { MessageCircle, Send, Users, Wifi, WifiOff } from 'lucide-react'

interface Message {
  id: string
  senderId: string
  senderName: string
  content: string
  timestamp: string
  channelId?: string
}

interface DashboardMessagingProps {
  userRole: 'ADMIN' | 'TEAM_MEMBER' | 'PROJECT_MANAGER' | 'CLIENT' | 'SUPER_ADMIN'
  userId: string
  compact?: boolean
}

export function DashboardMessaging({ userRole, userId, compact = false }: DashboardMessagingProps) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [selectedChannel, setSelectedChannel] = useState<string>('')
  const [channels, setChannels] = useState<{ id: string; name: string; type: string }[]>([])
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Socket.io messaging hook
  const {
    isConnected,
    connectedUsers,
    connect,
    disconnect,
    sendMessage,
    joinChannel,
    leaveChannel,
    startTyping,
    stopTyping
  } = useSocketMessaging({
    onNewMessage: (messageData) => {
      const message: Message = {
        id: messageData.id || Date.now().toString(),
        senderId: messageData.senderId || messageData.sender?.id || '',
        senderName: messageData.sender?.name || 'Unknown',
        content: messageData.content || '',
        timestamp: messageData.createdAt || new Date().toISOString(),
        channelId: messageData.channelId || ''
      }
      setMessages(prev => [...prev, message])
    },
    onTypingStart: (data) => {
      if (data.userId !== userId) {
        setTypingUsers(prev => [...prev.filter(id => id !== data.userId), data.userId])
      }
    },
    onTypingStop: (data) => {
      setTypingUsers(prev => prev.filter(id => id !== data.userId))
    },
    onUserJoinedChannel: (data) => {
      console.log(`${data.userName} joined channel ${data.channelId}`)
    },
    onUserLeftChannel: (data) => {
      console.log(`${data.userName} left channel ${data.channelId}`)
    }
  })

  // Load channels based on user role
  useEffect(() => {
    const loadChannels = async () => {
      try {
        let endpoint = ''
        switch (userRole) {
          case 'ADMIN':
          case 'SUPER_ADMIN':
            endpoint = '/api/admin/messages/channels'
            break
          case 'TEAM_MEMBER':
          case 'PROJECT_MANAGER':
            endpoint = '/api/team-member/messages/channels'
            break
          case 'CLIENT':
            endpoint = '/api/client/messages/channels'
            break
        }

        if (endpoint) {
          const response = await fetch(endpoint)
          if (response.ok) {
            const data = await response.json()
            setChannels(data.channels || [])
            
            // Auto-select first channel
            if (data.channels?.length > 0) {
              setSelectedChannel(data.channels[0].id)
            }
          }
        }
      } catch (error) {
        console.error('Error loading channels:', error)
      }
    }

    if (session?.user && userRole) {
      loadChannels()
    }
  }, [session, userRole])

  // Connect to Socket.io when component mounts
  useEffect(() => {
    if (session?.user) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [session, connect, disconnect])

  // Join selected channel
  useEffect(() => {
    if (selectedChannel && isConnected) {
      joinChannel(selectedChannel)
      loadChannelMessages(selectedChannel)
    }
  }, [selectedChannel, isConnected, joinChannel])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadChannelMessages = async (channelId: string) => {
    try {
      let endpoint = ''
      switch (userRole) {
        case 'ADMIN':
        case 'SUPER_ADMIN':
          endpoint = `/api/admin/messages/channels/${channelId}`
          break
        case 'TEAM_MEMBER':
        case 'PROJECT_MANAGER':
          endpoint = `/api/team-member/messages/channels/${channelId}`
          break
        case 'CLIENT':
          endpoint = `/api/client/messages/channels/${channelId}`
          break
      }

      if (endpoint) {
        const response = await fetch(endpoint)
        if (response.ok) {
          const data = await response.json()
          setMessages(data.messages || [])
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChannel) return

    try {
      // Send via Socket.io for real-time delivery
      sendMessage({
        content: newMessage,
        channelId: selectedChannel,
        messageType: 'BROADCAST'
      })

      // Also send via API for persistence
      let endpoint = ''
      switch (userRole) {
        case 'ADMIN':
        case 'SUPER_ADMIN':
          endpoint = '/api/admin/messages'
          break
        case 'TEAM_MEMBER':
        case 'PROJECT_MANAGER':
          endpoint = '/api/team-member/messages'
          break
        case 'CLIENT':
          endpoint = '/api/client/messages'
          break
      }

      if (endpoint) {
        await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: newMessage,
            channelId: selectedChannel,
            messageType: 'CHANNEL'
          })
        })
      }

      setNewMessage('')
      stopTyping(selectedChannel)
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const handleTyping = (value: string) => {
    setNewMessage(value)
    
    if (value.trim() && selectedChannel) {
      startTyping(selectedChannel)
    } else {
      stopTyping(selectedChannel)
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
      case 'SUPER_ADMIN':
        return 'bg-red-100 text-red-800'
      case 'PROJECT_MANAGER':
        return 'bg-blue-100 text-blue-800'
      case 'TEAM_MEMBER':
        return 'bg-green-100 text-green-800'
      case 'CLIENT':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (compact) {
    return (
      <Card className="h-96">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Messages
            </CardTitle>
            <Badge variant={isConnected ? "default" : "destructive"} className="flex items-center gap-1">
              {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="px-4 pb-2">
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="w-full p-2 border rounded text-sm"
            >
              <option value="">Select a channel</option>
              {channels.map(channel => (
                <option key={channel.id} value={channel.id}>
                  #{channel.name}
                </option>
              ))}
            </select>
          </div>
          
          <ScrollArea className="h-48 px-4">
            {messages
              .filter(msg => !selectedChannel || msg.channelId === selectedChannel)
              .slice(-10)
              .map(message => (
                <div key={message.id} className="mb-2 text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-xs">
                      {message.senderName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {message.content}
                  </p>
                </div>
              ))}
            {typingUsers.length > 0 && (
              <div className="text-xs text-muted-foreground italic">
                {typingUsers.join(', ')} typing...
              </div>
            )}
            <div ref={messagesEndRef} />
          </ScrollArea>
          
          <div className="p-4 pt-2">
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => handleTyping(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type a message..."
                className="text-sm"
                disabled={!selectedChannel || !isConnected}
              />
              <Button 
                onClick={handleSendMessage}
                size="sm"
                disabled={!newMessage.trim() || !selectedChannel || !isConnected}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Real-time Messaging
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? "default" : "destructive"} className="flex items-center gap-1">
              {isConnected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
              {isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {connectedUsers.length} online
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-4 h-96">
          {/* Channels Sidebar */}
          <div className="border-r bg-muted/30 p-4">
            <h3 className="font-medium mb-3">Channels</h3>
            <div className="space-y-1">
              {channels.map(channel => (
                <button
                  key={channel.id}
                  onClick={() => setSelectedChannel(channel.id)}
                  className={`w-full text-left p-2 rounded text-sm transition-colors ${
                    selectedChannel === channel.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-muted'
                  }`}
                >
                  #{channel.name}
                  <div className="text-xs opacity-60">{channel.type}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Messages Area */}
          <div className="col-span-3 flex flex-col">
            {selectedChannel ? (
              <>
                <div className="p-4 border-b bg-muted/30">
                  <h3 className="font-medium">
                    #{channels.find(c => c.id === selectedChannel)?.name}
                  </h3>
                  <Badge className={getRoleColor(userRole)} variant="outline">
                    {userRole.replace('_', ' ')}
                  </Badge>
                </div>

                <ScrollArea className="flex-1 p-4">
                  {messages
                    .filter(msg => msg.channelId === selectedChannel)
                    .map(message => (
                      <div key={message.id} className="mb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {message.senderName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(message.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm">{message.content}</p>
                      </div>
                    ))}
                  
                  {typingUsers.length > 0 && (
                    <div className="text-sm text-muted-foreground italic">
                      {typingUsers.join(', ')} typing...
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </ScrollArea>

                <Separator />
                
                <div className="p-4">
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => handleTyping(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type a message..."
                      disabled={!isConnected}
                    />
                    <Button 
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || !isConnected}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Select a channel to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}