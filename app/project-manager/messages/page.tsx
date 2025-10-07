"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  MessageSquare,
  Send,
  Search,
  Plus,
  Users,
  Hash,
  ChevronDown,
  MoreHorizontal,
  Phone,
  Video,
  Info,
  Pin,
  Star,
} from "lucide-react"
import { SubtleBackground } from "@/components/subtle-background"

interface Channel {
  id: string
  name: string
  type: 'PROJECT' | 'TEAM' | 'DIRECT'
  description?: string
  members: number
  unreadCount: number
  lastActivity: string
  isPrivate: boolean
}

interface Message {
  id: string
  senderId: string
  senderName: string
  senderAvatar?: string
  content: string
  timestamp: string
  type: 'text' | 'file' | 'system'
  reactions?: { emoji: string; count: number; users: string[] }[]
}

interface User {
  id: string
  name: string
  email: string
  role: string
  avatar?: string
  status: 'online' | 'away' | 'busy' | 'offline'
  lastSeen?: string
}

export default function ProjectManagerMessages() {
  const { data: session } = useSession()
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [messageText, setMessageText] = useState("")
  const [channels, setChannels] = useState<Channel[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'channels' | 'users'>('channels')

  // Mock data for now - will be replaced with API calls
  useEffect(() => {
    const mockChannels: Channel[] = [
      {
        id: 'general',
        name: 'general',
        type: 'TEAM',
        description: 'General team discussions',
        members: 12,
        unreadCount: 3,
        lastActivity: '2 minutes ago',
        isPrivate: false
      },
      {
        id: 'project-alpha',
        name: 'project-alpha',
        type: 'PROJECT',
        description: 'Alpha project development',
        members: 6,
        unreadCount: 0,
        lastActivity: '1 hour ago',
        isPrivate: false
      },
      {
        id: 'dev-team',
        name: 'development',
        type: 'TEAM',
        description: 'Development team coordination',
        members: 8,
        unreadCount: 1,
        lastActivity: '30 minutes ago',
        isPrivate: false
      },
    ]

    const mockUsers: User[] = [
      {
        id: '1',
        name: 'Sarah Johnson',
        email: 'sarah@zyphextech.com',
        role: 'Project Manager',
        status: 'online',
        avatar: '/avatars/sarah.jpg'
      },
      {
        id: '2',
        name: 'Michael Chen',
        email: 'michael@zyphextech.com',
        role: 'Senior Developer',
        status: 'online',
        avatar: '/avatars/michael.jpg'
      },
      {
        id: '3',
        name: 'Emma Wilson',
        email: 'emma@zyphextech.com',
        role: 'UI/UX Designer',
        status: 'away',
        avatar: '/avatars/emma.jpg'
      },
      {
        id: '4',
        name: 'David Brown',
        email: 'david@zyphextech.com',
        role: 'Backend Developer',
        status: 'busy',
        avatar: '/avatars/david.jpg'
      },
    ]

    const mockMessages: Message[] = [
      {
        id: '1',
        senderId: '2',
        senderName: 'Michael Chen',
        content: 'Hey team, I\'ve finished the authentication module. Ready for review!',
        timestamp: '10:30 AM',
        type: 'text'
      },
      {
        id: '2',
        senderId: '1',
        senderName: 'Sarah Johnson',
        content: 'Great work Michael! I\'ll review it this afternoon. Can you also update the documentation?',
        timestamp: '10:35 AM',
        type: 'text'
      },
      {
        id: '3',
        senderId: '3',
        senderName: 'Emma Wilson',
        content: 'I\'ve updated the design system. The new components are in Figma.',
        timestamp: '11:15 AM',
        type: 'text'
      },
    ]

    setChannels(mockChannels)
    setUsers(mockUsers)
    setMessages(mockMessages)
    setSelectedChannel('general')
    setLoading(false)
  }, [])

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedChannel) return

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: session?.user?.id || '1',
      senderName: session?.user?.name || 'You',
      content: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'text'
    }

    setMessages(prev => [...prev, newMessage])
    setMessageText("")
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'away': return 'bg-yellow-500'
      case 'busy': return 'bg-red-500'
      default: return 'bg-gray-400'
    }
  }

  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
        <SubtleBackground />
        <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
          <div className="animate-pulse">Loading messages...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
      <SubtleBackground />
      <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-4 zyphex-card border-b">
          <div className="flex items-center gap-4 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/project-manager">
                    Dashboard
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Messages</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        {/* Main Messages Interface */}
        <div className="flex flex-1 gap-4 h-[calc(100vh-200px)]">
          {/* Sidebar - Channels and Users */}
          <Card className="w-80 zyphex-card flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Messages
                </CardTitle>
                <Button size="sm" variant="ghost">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={view === 'channels' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setView('channels')}
                  className="flex-1"
                >
                  <Hash className="h-4 w-4 mr-1" />
                  Channels
                </Button>
                <Button
                  variant={view === 'users' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setView('users')}
                  className="flex-1"
                >
                  <Users className="h-4 w-4 mr-1" />
                  People
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <ScrollArea className="h-full">
                {view === 'channels' ? (
                  <div className="space-y-1 p-4">
                    {filteredChannels.map((channel) => (
                      <div
                        key={channel.id}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                          selectedChannel === channel.id ? 'bg-muted' : ''
                        }`}
                        onClick={() => setSelectedChannel(channel.id)}
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <Hash className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">{channel.name}</span>
                              {channel.isPrivate && (
                                <Badge variant="secondary" className="text-xs">Private</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {channel.members} members • {channel.lastActivity}
                            </p>
                          </div>
                        </div>
                        {channel.unreadCount > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {channel.unreadCount}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1 p-4">
                    {filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50"
                        onClick={() => {
                          // Handle direct message creation
                          console.log('Start DM with', user.name)
                        }}
                      >
                        <div className="relative">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar} alt={user.name} />
                            <AvatarFallback>
                              {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div
                            className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-background ${getStatusColor(user.status)}`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{user.name}</div>
                          <p className="text-xs text-muted-foreground truncate">
                            {user.role} • {user.status}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Main Chat Area */}
          <Card className="flex-1 zyphex-card flex flex-col">
            {selectedChannel ? (
              <>
                {/* Chat Header */}
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Hash className="h-5 w-5" />
                      <div>
                        <h2 className="font-semibold">
                          {channels.find(c => c.id === selectedChannel)?.name}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          {channels.find(c => c.id === selectedChannel)?.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost">
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Video className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Info className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* Messages Area */}
                <CardContent className="flex-1 p-0 flex flex-col">
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div key={message.id} className="flex gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={message.senderAvatar} alt={message.senderName} />
                            <AvatarFallback>
                              {message.senderName.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{message.senderName}</span>
                              <span className="text-xs text-muted-foreground">
                                {message.timestamp}
                              </span>
                            </div>
                            <p className="text-sm">{message.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  {/* Message Input */}
                  <div className="p-4 border-t">
                    <div className="flex gap-2">
                      <Textarea
                        placeholder={`Message #${channels.find(c => c.id === selectedChannel)?.name}`}
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        className="min-h-[60px] resize-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleSendMessage()
                          }
                        }}
                      />
                      <Button 
                        onClick={handleSendMessage}
                        disabled={!messageText.trim()}
                        className="self-end"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Select a conversation</h3>
                  <p className="text-muted-foreground">
                    Choose a channel or start a direct message to begin chatting
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}