"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import useSocketMessaging from "@/hooks/use-socket-messaging"
import { useSession } from "next-auth/react"

interface TestMessage {
  id: string
  content: string
  senderId: string
  sender: {
    name: string
    email: string
  }
  createdAt: string
}

export default function SocketTestPage() {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<TestMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [selectedChannel, setSelectedChannel] = useState<string>("")
  const [channels, setChannels] = useState<any[]>([])
  const [typingUsers, setTypingUsers] = useState<string[]>([])

  const {
    isConnected,
    joinChannel,
    leaveChannel,
    sendMessage,
    startTyping,
    stopTyping,
    markMessageAsRead
  } = useSocketMessaging({
    onNewMessage: (message) => {
      setMessages(prev => [...prev, message as TestMessage])
    },
    onMessageRead: (data) => {
      // Message read
    },
    onTypingStart: (data) => {
      setTypingUsers(prev => prev.includes(data.userId) ? prev : [...prev, data.userId])
    },
    onTypingStop: (data) => {
      setTypingUsers(prev => prev.filter(id => id !== data.userId))
    },
    onUserJoinedChannel: (data) => {
      // User joined channel
    },
    onUserLeftChannel: (data) => {
      // User left channel
    },
    onError: (error) => {
      // Socket error
    }
  })

  useEffect(() => {
    fetchChannels()
  }, [])

  useEffect(() => {
    if (selectedChannel) {
      joinChannel(selectedChannel)
      fetchMessages(selectedChannel)
    }
  }, [selectedChannel, joinChannel])

  const fetchChannels = async () => {
    try {
      const response = await fetch("/api/admin/messages/channels")
      if (response.ok) {
        const data = await response.json()
        setChannels(data.channels || [])
      }
    } catch (error) {
      // Error fetching channels
    }
  }

  const fetchMessages = async (channelId: string) => {
    try {
      const response = await fetch(`/api/admin/messages/${channelId}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      // Error fetching messages
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChannel) return

    try {
      // Send via HTTP API (which will trigger Socket.io broadcast)
      const response = await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newMessage,
          channelId: selectedChannel
        })
      })

      if (response.ok) {
        setNewMessage("")
        // Message will be added via Socket.io event
      }
    } catch (error) {
      // Error sending message
    }
  }

  const handleTyping = (value: string) => {
    setNewMessage(value)
    
    if (value.trim() && selectedChannel) {
      startTyping(selectedChannel)
    } else if (!value.trim() && selectedChannel) {
      stopTyping(selectedChannel)
    }
  }

  const selectChannel = (channelId: string) => {
    if (selectedChannel) {
      leaveChannel(selectedChannel)
    }
    setSelectedChannel(channelId)
    setMessages([])
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Socket.io Test</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Please sign in to test the messaging system.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Connection Status */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Socket.io Real-time Messaging Test
                <Badge variant={isConnected ? "default" : "destructive"}>
                  {isConnected ? "Connected" : "Disconnected"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Logged in as: <strong>{session.user?.name}</strong> ({session.user?.email})
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Channels List */}
        <Card>
          <CardHeader>
            <CardTitle>Channels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {channels.map((channel) => (
                <Button
                  key={channel.id}
                  variant={selectedChannel === channel.id ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => selectChannel(channel.id)}
                >
                  # {channel.name}
                  <Badge variant="secondary" className="ml-auto">
                    {channel.type}
                  </Badge>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Messages */}
        <div className="lg:col-span-2">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle>
                {selectedChannel ? 
                  `# ${channels.find(c => c.id === selectedChannel)?.name || 'Channel'}` : 
                  "Select a channel"}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {messages.map((message) => (
                  <div key={message.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
                      {message.sender.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{message.sender.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(message.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Typing Indicator */}
              {typingUsers.length > 0 && (
                <div className="text-xs text-muted-foreground mb-2">
                  {typingUsers.length === 1 ? "Someone is" : `${typingUsers.length} people are`} typing...
                </div>
              )}

              {/* Message Input */}
              <div className="flex gap-2">
                <Input
                  placeholder={selectedChannel ? "Type a message..." : "Select a channel first"}
                  value={newMessage}
                  onChange={(e) => handleTyping(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  disabled={!selectedChannel}
                />
                <Button onClick={handleSendMessage} disabled={!selectedChannel || !newMessage.trim()}>
                  Send
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Debug Info */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Socket Status:</strong> {isConnected ? "Connected" : "Disconnected"}
            </div>
            <div>
              <strong>Selected Channel:</strong> {selectedChannel || "None"}
            </div>
            <div>
              <strong>Messages Count:</strong> {messages.length}
            </div>
            <div>
              <strong>Typing Users:</strong> {typingUsers.length}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}