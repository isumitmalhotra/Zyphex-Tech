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
  MoreHorizontal,
  Phone,
  Video,
  Info,
  Shield,
  Crown,
  Eye,
  Building,
  AlertTriangle,
} from "lucide-react"
import { SubtleBackground } from "@/components/subtle-background"

interface Channel {
  id: string
  name: string
  type: 'SYSTEM' | 'ADMIN' | 'COMPANY' | 'SECURITY' | 'DIRECT'
  description?: string
  members: number
  unreadCount: number
  lastActivity: string
  isPrivate: boolean
  securityLevel: 'STANDARD' | 'ELEVATED' | 'CLASSIFIED'
}

interface Message {
  id: string
  senderId: string
  senderName: string
  senderAvatar?: string
  content: string
  timestamp: string
  type: 'text' | 'file' | 'system' | 'security'
  reactions?: { emoji: string; count: number; users: string[] }[]
  securityLevel?: 'STANDARD' | 'ELEVATED' | 'CLASSIFIED'
}

interface User {
  id: string
  name: string
  email: string
  role: string
  avatar?: string
  status: 'online' | 'away' | 'busy' | 'offline'
  lastSeen?: string
  department?: string
}

export default function SuperAdminMessages() {
  const { data: session } = useSession()
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [messageText, setMessageText] = useState("")
  const [channels, setChannels] = useState<Channel[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'channels' | 'users'>('channels')

  // Mock data for super admin - will be replaced with API calls
  useEffect(() => {
    const mockChannels: Channel[] = [
      {
        id: 'system-alerts',
        name: 'system-alerts',
        type: 'SYSTEM',
        description: 'Critical system notifications and alerts',
        members: 3,
        unreadCount: 5,
        lastActivity: '2 minutes ago',
        isPrivate: true,
        securityLevel: 'CLASSIFIED'
      },
      {
        id: 'security-incidents',
        name: 'security-incidents',
        type: 'SECURITY',
        description: 'Security incident reports and responses',
        members: 4,
        unreadCount: 2,
        lastActivity: '15 minutes ago',
        isPrivate: true,
        securityLevel: 'ELEVATED'
      },
      {
        id: 'admin-coordination',
        name: 'admin-coordination',
        type: 'ADMIN',
        description: 'Admin team coordination and oversight',
        members: 6,
        unreadCount: 1,
        lastActivity: '1 hour ago',
        isPrivate: true,
        securityLevel: 'ELEVATED'
      },
      {
        id: 'company-oversight',
        name: 'company-oversight',
        type: 'COMPANY',
        description: 'Company-wide oversight and strategic discussions',
        members: 8,
        unreadCount: 0,
        lastActivity: '3 hours ago',
        isPrivate: true,
        securityLevel: 'CLASSIFIED'
      },
      {
        id: 'compliance-monitoring',
        name: 'compliance-monitoring',
        type: 'SYSTEM',
        description: 'Compliance and audit monitoring',
        members: 5,
        unreadCount: 0,
        lastActivity: '6 hours ago',
        isPrivate: true,
        securityLevel: 'ELEVATED'
      },
    ]

    const mockUsers: User[] = [
      {
        id: '1',
        name: 'Jennifer Clark',
        email: 'jennifer@zyphextech.com',
        role: 'Admin',
        status: 'online',
        avatar: '/avatars/jennifer.jpg',
        department: 'Administration'
      },
      {
        id: '2',
        name: 'Michael Chen',
        email: 'michael@zyphextech.com',
        role: 'Senior Developer',
        status: 'online',
        avatar: '/avatars/michael.jpg',
        department: 'Development'
      },
      {
        id: '3',
        name: 'Sarah Johnson',
        email: 'sarah@zyphextech.com',
        role: 'Project Manager',
        status: 'away',
        avatar: '/avatars/sarah.jpg',
        department: 'Project Management'
      },
      {
        id: '4',
        name: 'Emma Wilson',
        email: 'emma@zyphextech.com',
        role: 'UI/UX Designer',
        status: 'online',
        avatar: '/avatars/emma.jpg',
        department: 'Design'
      },
      {
        id: '5',
        name: 'David Brown',
        email: 'david@zyphextech.com',
        role: 'Backend Developer',
        status: 'busy',
        avatar: '/avatars/david.jpg',
        department: 'Development'
      },
      {
        id: '6',
        name: 'Robert White',
        email: 'robert@zyphextech.com',
        role: 'Super Admin',
        status: 'online',
        avatar: '/avatars/robert.jpg',
        department: 'Executive'
      },
    ]

    const mockMessages: Message[] = [
      {
        id: '1',
        senderId: 'system',
        senderName: 'System Monitor',
        content: '🔴 CRITICAL: Unusual login activity detected from IP 192.168.1.100. Immediate review required.',
        timestamp: '2:15 PM',
        type: 'security',
        securityLevel: 'CLASSIFIED'
      },
      {
        id: '2',
        senderId: '6',
        senderName: 'Robert White',
        content: 'Investigating this immediately. Jennifer, please pull the access logs for the last 24 hours.',
        timestamp: '2:16 PM',
        type: 'text',
        securityLevel: 'CLASSIFIED'
      },
      {
        id: '3',
        senderId: '1',
        senderName: 'Jennifer Clark',
        content: 'On it. Running comprehensive security audit now. Will have full report in 15 minutes.',
        timestamp: '2:18 PM',
        type: 'text',
        securityLevel: 'CLASSIFIED'
      },
    ]

    setChannels(mockChannels)
    setUsers(mockUsers)
    setMessages(mockMessages)
    setSelectedChannel('system-alerts')
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
      type: 'text',
      securityLevel: channels.find(c => c.id === selectedChannel)?.securityLevel || 'STANDARD'
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

  const getSecurityBadgeColor = (level: string) => {
    switch (level) {
      case 'CLASSIFIED': return 'bg-red-500 text-white'
      case 'ELEVATED': return 'bg-orange-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getChannelIcon = (type: string, securityLevel: string) => {
    if (type === 'SYSTEM') {
      return <AlertTriangle className="h-4 w-4 text-red-500" />
    }
    if (type === 'SECURITY') {
      return <Shield className="h-4 w-4 text-orange-500" />
    }
    if (type === 'ADMIN') {
      return <Crown className="h-4 w-4 text-purple-500" />
    }
    if (type === 'COMPANY') {
      return <Building className="h-4 w-4 text-blue-500" />
    }
    return <Hash className="h-4 w-4 text-muted-foreground" />
  }

  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.department?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
        <SubtleBackground />
        <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
          <div className="animate-pulse">Loading super admin messages...</div>
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
                  <BreadcrumbLink href="/super-admin">
                    Super Admin Dashboard
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
                  <Crown className="h-5 w-5 text-purple-500" />
                  Super Admin Control
                </CardTitle>
                <Button size="sm" variant="ghost">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search all communications..."
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
                  All Users
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
                          {getChannelIcon(channel.type, channel.securityLevel)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">{channel.name}</span>
                              <Badge className={`text-xs ${getSecurityBadgeColor(channel.securityLevel)}`}>
                                {channel.securityLevel}
                              </Badge>
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
                          <div className="flex items-center gap-2">
                            <div className="font-medium truncate">{user.name}</div>
                            {(user.role === 'Admin' || user.role === 'Super Admin') && (
                              <Badge variant="default" className="text-xs bg-purple-500">
                                {user.role}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {user.department} • {user.status}
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
                      {getChannelIcon(
                        channels.find(c => c.id === selectedChannel)?.type || 'SYSTEM',
                        channels.find(c => c.id === selectedChannel)?.securityLevel || 'STANDARD'
                      )}
                      <div>
                        <h2 className="font-semibold flex items-center gap-2">
                          {channels.find(c => c.id === selectedChannel)?.name}
                          <Badge className={`text-xs ${getSecurityBadgeColor(
                            channels.find(c => c.id === selectedChannel)?.securityLevel || 'STANDARD'
                          )}`}>
                            {channels.find(c => c.id === selectedChannel)?.securityLevel}
                          </Badge>
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
                        <div key={message.id} className={`flex gap-3 ${
                          message.type === 'security' ? 'bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-200 dark:border-red-900' : ''
                        }`}>
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={message.senderAvatar} alt={message.senderName} />
                            <AvatarFallback>
                              {message.senderId === 'system' ? '🤖' : 
                               message.senderName.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{message.senderName}</span>
                              {message.securityLevel && message.securityLevel !== 'STANDARD' && (
                                <Badge className={`text-xs ${getSecurityBadgeColor(message.securityLevel)}`}>
                                  {message.securityLevel}
                                </Badge>
                              )}
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
                        placeholder={`Secure message to #${channels.find(c => c.id === selectedChannel)?.name}`}
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
                  <Crown className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Select a secure channel</h3>
                  <p className="text-muted-foreground">
                    Choose a channel or start a direct message for super admin oversight
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