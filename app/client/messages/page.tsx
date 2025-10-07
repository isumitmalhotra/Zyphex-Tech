"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  MessageSquare,
  Send,
  Hash,
  Users,
  Clock,
  Loader2,
  Search,
  MessageCircle,
  Reply,
  MoreHorizontal,
  Phone,
  Video,
  Building,
  User
} from "lucide-react"
import { toast } from "sonner"
import { useSocket } from "@/hooks/useSocket"
import { formatDistanceToNow } from "date-fns"

interface User {
  id: string
  name: string
  email: string
  image?: string
  role: string
  isOnline?: boolean
  lastSeen?: string
}

interface Channel {
  id: string
  name: string
  description?: string
  type: 'TEAM' | 'PROJECT' | 'DIRECT'
  projectId?: string
  project?: {
    id: string
    name: string
  }
  isPrivate: boolean
  members: User[]
  unreadCount: number
  lastMessage?: {
    id: string
    content: string
    sender: User
    createdAt: string
  }
  createdAt: string
}

interface Message {
  id: string
  content: string
  sender: User
  channelId: string
  parentId?: string
  messageType: string
  isEdited: boolean
  createdAt: string
  updatedAt: string
  replies?: Message[]
  replyCount?: number
}

export default function ClientMessagesPage() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { socket, isConnected } = useSocket()

  useEffect(() => {
    fetchChannels()
  }, [])

  useEffect(() => {
    if (socket && isConnected) {
      // Join client messaging room
      socket.emit('join:client-messages')

      // Listen for real-time events
      socket.on('message:new', handleNewMessage)
      socket.on('message:updated', handleMessageUpdate)
      socket.on('channel:updated', handleChannelUpdate)
      socket.on('user:status', handleUserStatusChange)

      return () => {
        socket.off('message:new')
        socket.off('message:updated')
        socket.off('channel:updated')
        socket.off('user:status')
      }
    }
  }, [socket, isConnected])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchChannels = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/client/messages/channels")
      if (response.ok) {
        const data = await response.json()
        setChannels(data.channels || [])
        if (data.channels?.length > 0 && !selectedChannel) {
          setSelectedChannel(data.channels[0])
        }
      } else {
        toast.error("Failed to load channels")
      }
    } catch (error) {
      console.error("Error fetching channels:", error)
      toast.error("Failed to load channels")
    } finally {
      setLoading(false)
    }
  }

  const fetchChannelMessages = async (channelId: string) => {
    try {
      const response = await fetch(`/api/client/messages/channels/${channelId}/messages`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error("Error fetching messages:", error)
      toast.error("Failed to load messages")
    }
  }

  const handleNewMessage = (message: Message) => {
    if (message.channelId === selectedChannel?.id) {
      setMessages(prev => [...prev, message])
    }
    // Update channel last message
    setChannels(prev => prev.map(channel => 
      channel.id === message.channelId 
        ? { ...channel, lastMessage: { 
            id: message.id, 
            content: message.content, 
            sender: message.sender, 
            createdAt: message.createdAt 
          }}
        : channel
    ))
  }

  const handleMessageUpdate = (updatedMessage: Message) => {
    setMessages(prev => prev.map(msg => 
      msg.id === updatedMessage.id ? updatedMessage : msg
    ))
  }

  const handleChannelUpdate = (updatedChannel: Channel) => {
    setChannels(prev => prev.map(channel => 
      channel.id === updatedChannel.id ? updatedChannel : channel
    ))
    if (selectedChannel?.id === updatedChannel.id) {
      setSelectedChannel(updatedChannel)
    }
  }

  const handleUserStatusChange = (userId: string, status: { isOnline: boolean, lastSeen?: string }) => {
    // Update user status in channels and messages
    setChannels(prev => prev.map(channel => ({
      ...channel,
      members: channel.members.map(member => 
        member.id === userId ? { ...member, ...status } : member
      )
    })))
  }

  const handleChannelSelect = async (channel: Channel) => {
    setSelectedChannel(channel)
    await fetchChannelMessages(channel.id)
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChannel) return

    try {
      setSending(true)
      const response = await fetch("/api/client/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newMessage,
          channelId: selectedChannel.id,
          parentId: replyingTo?.id
        })
      })

      if (response.ok) {
        setNewMessage("")
        setReplyingTo(null)
        // Message will be added via socket event
      } else {
        toast.error("Failed to send message")
      }
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Failed to send message")
    } finally {
      setSending(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const filteredChannels = channels.filter(channel => 
    channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    channel.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    channel.project?.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Project Communication</h1>
            <p className="text-muted-foreground">Connect with your project team and ZyphexTech</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              {isConnected ? 'Connected' : 'Disconnected'}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 border-r bg-muted/30">
          <div className="p-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search project channels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="space-y-1">
                {filteredChannels.map((channel) => (
                  <ClientChannelItem
                    key={channel.id}
                    channel={channel}
                    isSelected={selectedChannel?.id === channel.id}
                    onClick={() => handleChannelSelect(channel)}
                  />
                ))}
                {filteredChannels.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2" />
                    <p>No project channels available</p>
                    <p className="text-sm mt-1">You'll see channels for your assigned projects here</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedChannel ? (
            <>
              {/* Chat Header */}
              <div className="border-b px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {selectedChannel.type === 'DIRECT' ? (
                        <MessageCircle className="h-5 w-5" />
                      ) : (
                        <Hash className="h-5 w-5" />
                      )}
                      <h2 className="font-semibold">{selectedChannel.name}</h2>
                    </div>
                    {selectedChannel.project && (
                      <Badge variant="outline">
                        <Building className="h-3 w-3 mr-1" />
                        {selectedChannel.project.name}
                      </Badge>
                    )}
                    {selectedChannel.description && (
                      <span className="text-sm text-muted-foreground">
                        {selectedChannel.description}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      <Users className="h-3 w-3 mr-1" />
                      {selectedChannel.members.length} members
                    </Badge>
                    <Button variant="ghost" size="sm" title="Call">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" title="Video Call">
                      <Video className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <ClientMessageItem
                      key={message.id}
                      message={message}
                      onReply={setReplyingTo}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="border-t p-4">
                {replyingTo && (
                  <div className="mb-2 p-2 bg-muted rounded-md text-sm">
                    <div className="flex items-center justify-between">
                      <span>Replying to {replyingTo.sender.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setReplyingTo(null)}
                      >
                        ×
                      </Button>
                    </div>
                    <p className="text-muted-foreground truncate">
                      {replyingTo.content}
                    </p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Textarea
                    placeholder={`Message ${selectedChannel.name}`}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage()
                      }
                    }}
                    className="min-h-[44px] max-h-32 resize-none"
                    rows={1}
                  />
                  <Button 
                    onClick={sendMessage} 
                    disabled={sending || !newMessage.trim()}
                    size="sm"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Select a project channel to start messaging</h3>
                <p className="text-muted-foreground max-w-md">
                  Choose a project channel to communicate with your dedicated team members and ZyphexTech staff.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Client Channel Item Component
function ClientChannelItem({ 
  channel, 
  isSelected, 
  onClick 
}: { 
  channel: Channel
  isSelected: boolean
  onClick: () => void 
}) {
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-md cursor-pointer hover:bg-muted/50 ${
        isSelected ? 'bg-muted' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {channel.type === 'DIRECT' ? (
          <MessageCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        ) : (
          <Hash className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-medium truncate">{channel.name}</p>
            {channel.project && (
              <Badge variant="outline" className="text-xs">
                {channel.project.name}
              </Badge>
            )}
          </div>
          {channel.lastMessage && (
            <p className="text-xs text-muted-foreground truncate">
              {channel.lastMessage.sender.name}: {channel.lastMessage.content}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="text-xs">
              <Users className="h-2 w-2 mr-1" />
              {channel.members.length} members
            </Badge>
            {channel.lastMessage && (
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(channel.lastMessage.createdAt), { addSuffix: true })}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        {channel.unreadCount > 0 && (
          <Badge variant="destructive" className="h-5 px-1.5 text-xs">
            {channel.unreadCount}
          </Badge>
        )}
      </div>
    </div>
  )
}

// Client Message Item Component
function ClientMessageItem({ 
  message, 
  onReply
}: { 
  message: Message
  onReply: (message: Message) => void
}) {
  const isZyphexTeam = ['ADMIN', 'SUPER_ADMIN', 'PROJECT_MANAGER', 'TEAM_MEMBER'].includes(message.sender.role)
  
  return (
    <div className="group flex gap-3 hover:bg-muted/30 p-3 rounded-md">
      <Avatar className="h-8 w-8">
        <AvatarImage src={message.sender.image} alt={message.sender.name} />
        <AvatarFallback>{message.sender.name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium">{message.sender.name}</span>
          <Badge 
            variant={isZyphexTeam ? "default" : "outline"} 
            className="text-xs"
          >
            {isZyphexTeam ? (
              <>
                <Building className="h-2 w-2 mr-1" />
                ZyphexTech {message.sender.role.replace('_', ' ')}
              </>
            ) : (
              <>
                <User className="h-2 w-2 mr-1" />
                {message.sender.role.replace('_', ' ')}
              </>
            )}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
          </span>
          {message.isEdited && (
            <span className="text-xs text-muted-foreground">(edited)</span>
          )}
        </div>
        <div className="text-sm leading-relaxed">{message.content}</div>
        {message.replyCount && message.replyCount > 0 && (
          <div className="mt-2 pl-4 border-l-2 border-muted">
            <p className="text-xs text-muted-foreground">
              {message.replyCount} {message.replyCount === 1 ? 'reply' : 'replies'}
            </p>
          </div>
        )}
      </div>
      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onReply(message)}
          title="Reply"
        >
          <Reply className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          title="More options"
        >
          <MoreHorizontal className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}