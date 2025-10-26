"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { toast } from "@/hooks/use-toast"
import { format } from "date-fns"
import {
  Mail,
  MessageSquare,
  Phone,
  Video,
  Calendar,
  Search,
  Send,
  Clock,
  User,
  Building,
  FileText,
  Loader2,
  History,
  Paperclip,
  X,
  Filter,
  CheckCheck,
  Check,
  Download,
  Image as ImageIcon,
  File as FileIcon,
  Bell,
  BellOff
} from "lucide-react"
import { io, Socket } from "socket.io-client"

interface Client {
  id: string
  name: string
  email: string
  company: string
  avatar?: string
  unreadCount: number
  lastMessage?: string
  lastMessageTime?: string
  status: 'active' | 'inactive'
  projectId?: string
  isTyping?: boolean
}

interface Message {
  id: string
  senderId: string
  senderName: string
  senderAvatar?: string
  content: string
  timestamp: string
  type: 'email' | 'message' | 'call' | 'meeting'
  read: boolean
  readAt?: string
  attachments?: MessageAttachment[]
}

interface MessageAttachment {
  id: string
  name: string
  url: string
  type: string
  size: number
}

interface CommunicationStats {
  emailsSent: number
  messagesSent: number
  calls: number
  meetings: number
}

interface _CallLog {
  id: string
  clientId: string
  clientName: string
  type: 'incoming' | 'outgoing' | 'missed'
  duration: number
  timestamp: string
  notes?: string
}

interface _Meeting {
  id: string
  title: string
  clientId: string
  clientName: string
  date: Date
  duration: number
  type: 'video' | 'phone' | 'in-person'
  notes?: string
  status: 'scheduled' | 'completed' | 'cancelled'
}

const EMAIL_TEMPLATES = [
  { id: 'welcome', name: 'Welcome Email', subject: 'Welcome to Project' },
  { id: 'update', name: 'Project Update', subject: 'Update on Project' },
  { id: 'milestone', name: 'Milestone Achieved', subject: 'Milestone Completed' },
  { id: 'meeting', name: 'Meeting Request', subject: 'Meeting Request' },
  { id: 'follow-up', name: 'Follow-up', subject: 'Following up' },
]

export default function ClientCommunicationsPage() {
  const { data: session } = useSession()
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageInput, setMessageInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showEmailDialog, setShowEmailDialog] = useState(false)
  const [showMeetingDialog, setShowMeetingDialog] = useState(false)
  const [showCallLogDialog, setShowCallLogDialog] = useState(false)
  const [emailSubject, setEmailSubject] = useState("")
  const [emailBody, setEmailBody] = useState("")
  const [stats, setStats] = useState<CommunicationStats>({
    emailsSent: 0,
    messagesSent: 0,
    calls: 0,
    meetings: 0
  })
  const [selectedAttachments, setSelectedAttachments] = useState<MessageAttachment[]>([])
  const [filterType, setFilterType] = useState<string>("all")
  const [filterProject, setFilterProject] = useState<string>("all")
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [meetingDate, setMeetingDate] = useState<Date | undefined>(undefined)
  const [meetingTitle, setMeetingTitle] = useState("")
  const [meetingDuration, setMeetingDuration] = useState("30")
  const [meetingType, setMeetingType] = useState<"video" | "phone" | "in-person">("video")
  const [meetingNotes, setMeetingNotes] = useState("")
  const [callType, setCallType] = useState<"incoming" | "outgoing" | "missed">("outgoing")
  const [callDuration, setCallDuration] = useState("")
  const [callNotes, setCallNotes] = useState("")
  
  const socketRef = useRef<Socket | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize Socket.io connection (disabled until server is configured)
  useEffect(() => {
    if (!session?.user?.id) return

    // TODO: Enable Socket.io when server is configured
    // Temporarily disabled to prevent 503 errors
    const ENABLE_SOCKET_IO = false;
    
    if (!ENABLE_SOCKET_IO) {
      console.log('Socket.io disabled - real-time features unavailable');
      return;
    }

    socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
      path: '/api/socket/io',
      transports: ['websocket', 'polling'],
      auth: {
        token: Buffer.from(JSON.stringify({
          userId: session.user.id,
          email: session.user.email,
          name: session.user.name
        })).toString('base64')
      }
    })

    socketRef.current.on('connect', () => {
      console.log('Connected to Socket.io')
      // Join user's personal room
      socketRef.current?.emit('join', session.user.id)
    })

    socketRef.current.on('message', (message: Message) => {
      setMessages(prev => [...prev, message])
      scrollToBottom()
      
      // Show notification
      if (notificationsEnabled && Notification.permission === 'granted') {
        new Notification(`New message from ${message.senderName}`, {
          body: message.content,
          icon: '/logo.png'
        })
      }
    })

    socketRef.current.on('typing', (data: { userId: string; isTyping: boolean }) => {
      setClients(prev => prev.map(client => 
        client.id === data.userId ? { ...client, isTyping: data.isTyping } : client
      ))
    })

    socketRef.current.on('messageRead', (data: { messageId: string; readAt: string }) => {
      setMessages(prev => prev.map(msg =>
        msg.id === data.messageId ? { ...msg, read: true, readAt: data.readAt } : msg
      ))
    })

    return () => {
      socketRef.current?.disconnect()
    }
  }, [notificationsEnabled, session])

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        setNotificationsEnabled(permission === 'granted')
      })
    } else if (Notification.permission === 'granted') {
      setNotificationsEnabled(true)
    }
  }, [])

  // Fetch data on mount
  useEffect(() => {
    fetchClients()
    fetchStats()
  }, [])

  useEffect(() => {
    if (selectedClient) {
      fetchMessages()
      // Mark messages as read
      markMessagesAsRead()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClient])

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const fetchClients = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/project-manager/client-comms/clients')
      if (!response.ok) throw new Error('Failed to fetch clients')
      
      const data = await response.json()
      setClients(data.clients || data)
    } catch (error) {
      console.error('Error fetching clients:', error)
      toast({
        title: "Error",
        description: "Failed to load clients. Please refresh the page.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async () => {
    if (!selectedClient) return
    
    try {
      const params = new URLSearchParams()
      if (filterType !== 'all') params.append('type', filterType)
      if (filterDate) params.append('date', filterDate.toISOString())
      
      const response = await fetch(`/api/project-manager/client-comms/messages?clientId=${selectedClient.id}&${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch messages')
      
      const data = await response.json()
      setMessages(data.messages || data)
    } catch (error) {
      console.error('Error fetching messages:', error)
      toast({
        title: "Error",
        description: "Failed to load messages. Please try again.",
        variant: "destructive"
      })
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/project-manager/client-comms/stats')
      if (!response.ok) throw new Error('Failed to fetch stats')
      
      const data = await response.json()
      setStats(data.stats || data)
    } catch (error) {
      console.error('Error fetching stats:', error)
      // Set empty stats on error
      setStats({
        emailsSent: 0,
        messagesSent: 0,
        calls: 0,
        meetings: 0
      })
    }
  }

  const markMessagesAsRead = async () => {
    if (!selectedClient) return
    
    try {
      await fetch('/api/project-manager/client-comms/messages/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: selectedClient.id })
      })
      
      // Update local state
      setMessages(prev => prev.map(msg => ({ ...msg, read: true, readAt: new Date().toISOString() })))
      setClients(prev => prev.map(client => 
        client.id === selectedClient.id ? { ...client, unreadCount: 0 } : client
      ))
    } catch (_error) {
      console.error('Failed to mark messages as read')
    }
  }

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedClient) return

    try {
      setSending(true)
      
      const newMessage: Message = {
        id: Date.now().toString(),
        senderId: 'me',
        senderName: session?.user?.name || 'You',
        senderAvatar: session?.user?.image || undefined,
        content: messageInput,
        timestamp: new Date().toISOString(),
        type: 'message',
        read: false,
        attachments: selectedAttachments.length > 0 ? selectedAttachments : undefined
      }

      // Send via API
      await fetch('/api/project-manager/client-comms/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClient.id,
          content: messageInput,
          attachments: selectedAttachments
        })
      })

      // Emit via Socket.io for real-time
      if (socketRef.current) {
        socketRef.current.emit('message', {
          ...newMessage,
          recipientId: selectedClient.id
        })
      }

      setMessages(prev => [...prev, newMessage])
      setMessageInput("")
      setSelectedAttachments([])
      
      toast({
        title: "Message sent",
        description: "Your message has been delivered"
      })
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      })
    } finally {
      setSending(false)
    }
  }

  const handleTyping = () => {
    if (!selectedClient || !socketRef.current) return
    
    socketRef.current.emit('typing', {
      clientId: selectedClient.id,
      isTyping: true
    })

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (socketRef.current) {
        socketRef.current.emit('typing', {
          clientId: selectedClient.id,
          isTyping: false
        })
      }
    }, 1000)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    try {
      // Upload files to server
      const formData = new FormData()
      Array.from(files).forEach(file => {
        formData.append('files', file)
      })

      const response = await fetch('/api/project-manager/client-comms/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()
      setSelectedAttachments(prev => [...prev, ...data.files])

      toast({
        title: "Files uploaded",
        description: `${data.files.length} file(s) uploaded successfully`
      })
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Upload failed",
        description: "Failed to upload files",
        variant: "destructive"
      })
    }
  }

  const handleRemoveAttachment = (attachmentId: string) => {
    setSelectedAttachments(prev => prev.filter(a => a.id !== attachmentId))
  }

  const handleScheduleMeeting = async () => {
    if (!selectedClient || !meetingDate) return

    try {
      await fetch('/api/project-manager/client-comms/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClient.id,
          title: meetingTitle,
          date: meetingDate,
          duration: meetingDuration,
          type: meetingType,
          notes: meetingNotes
        })
      })

      toast({
        title: "Meeting scheduled",
        description: `Meeting scheduled for ${meetingDate.toLocaleDateString()}`
      })

      setShowMeetingDialog(false)
      setMeetingTitle('')
      setMeetingDate(undefined)
      setMeetingDuration('30')
      setMeetingType('video')
      setMeetingNotes('')
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to schedule meeting",
        variant: "destructive"
      })
    }
  }

  const handleLogCall = async () => {
    if (!selectedClient) return

    try {
      await fetch('/api/project-manager/client-comms/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClient.id,
          type: callType,
          duration: callDuration,
          notes: callNotes
        })
      })

      toast({
        title: "Call logged",
        description: "Call has been logged successfully"
      })

      setShowCallLogDialog(false)
      setCallType('outgoing')
      setCallDuration('')
      setCallNotes('')
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to log call",
        variant: "destructive"
      })
    }
  }

  const toggleNotifications = () => {
    if (!notificationsEnabled) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          setNotificationsEnabled(true)
          toast({
            title: "Notifications enabled",
            description: "You will receive desktop notifications for new messages"
          })
        }
      })
    } else {
      setNotificationsEnabled(false)
      toast({
        title: "Notifications disabled",
        description: "Desktop notifications have been turned off"
      })
    }
  }

  const handleSendEmail = async () => {
    if (!emailSubject.trim() || !emailBody.trim() || !selectedClient) return

    try {
      setSending(true)
      
      const emailMessage: Message = {
        id: Date.now().toString(),
        senderId: 'me',
        senderName: session?.user?.name || 'You',
        senderAvatar: session?.user?.image || undefined,
        content: `Subject: ${emailSubject}\n\n${emailBody}`,
        timestamp: new Date().toISOString(),
        type: 'email',
        read: false
      }

      // Send via API
      await fetch('/api/project-manager/client-comms/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClient.id,
          subject: emailSubject,
          content: emailBody,
          type: 'email'
        })
      })

      setMessages(prev => [...prev, emailMessage])
      setShowEmailDialog(false)
      setEmailSubject("")
      setEmailBody("")
      
      toast({
        title: "Email sent",
        description: "Your email has been sent successfully"
      })
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to send email",
        variant: "destructive"
      })
    } finally {
      setSending(false)
    }
  }

  const applyTemplate = (templateId: string) => {
    const template = EMAIL_TEMPLATES.find(t => t.id === templateId)
    if (template && selectedClient) {
      setEmailSubject(template.subject)
      setEmailBody(`Dear ${selectedClient.name},\n\n[Template content here]\n\nBest regards,\nYour Team`)
    }
  }

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const filteredClients = (clients || []).filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         client.company.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  return (
    <div className="flex flex-col h-screen zyphex-gradient-bg">
      <div className="flex-1 flex flex-col p-6 gap-6 overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold zyphex-heading">Client Communications</h1>
            <p className="text-muted-foreground mt-1">
              Manage all client interactions in one place
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleNotifications}
              title={notificationsEnabled ? "Disable notifications" : "Enable notifications"}
            >
              {notificationsEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <h4 className="font-medium">Filters</h4>
                  
                  <div className="space-y-2">
                    <Label>Message Type</Label>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Messages</SelectItem>
                        <SelectItem value="email">Emails Only</SelectItem>
                        <SelectItem value="message">Messages Only</SelectItem>
                        <SelectItem value="call">Calls Only</SelectItem>
                        <SelectItem value="meeting">Meetings Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Project</Label>
                    <Select value={filterProject} onValueChange={setFilterProject}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Projects" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Projects</SelectItem>
                        <SelectItem value="project-1">Project Alpha</SelectItem>
                        <SelectItem value="project-2">Project Beta</SelectItem>
                        <SelectItem value="project-3">Project Gamma</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Date Range</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left">
                          <Calendar className="mr-2 h-4 w-4" />
                          {filterDate ? format(filterDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={filterDate}
                          onSelect={setFilterDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      setFilterType('all')
                      setFilterProject('all')
                      setFilterDate(undefined)
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="zyphex-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.emailsSent || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.messagesSent || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Calls</CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.calls || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Meetings</CardTitle>
              <Video className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.meetings || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex-1 grid grid-cols-12 gap-4 overflow-hidden">
          <Card className="col-span-12 md:col-span-3 zyphex-card flex flex-col overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Clients</CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search clients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <Separator />
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-2">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : filteredClients.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No clients found
                  </div>
                ) : (
                  filteredClients.map((client) => (
                    <div
                      key={client.id}
                      onClick={() => setSelectedClient(client)}
                      className={`p-3 rounded-lg cursor-pointer transition-all hover:bg-accent ${
                        selectedClient?.id === client.id ? 'bg-accent border-2 border-primary' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{client.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-sm truncate">{client.name}</h4>
                            {client.unreadCount > 0 && (
                              <Badge variant="default" className="ml-2">
                                {client.unreadCount}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{client.company}</p>
                          <p className="text-xs text-muted-foreground truncate mt-1">
                            {client.lastMessage}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">{client.lastMessageTime}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </Card>

          <Card className="col-span-12 md:col-span-6 zyphex-card flex flex-col overflow-hidden">
            {selectedClient ? (
              <>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{selectedClient.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{selectedClient.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{selectedClient.company}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setShowEmailDialog(true)}>
                        <Mail className="h-4 w-4 mr-2" />
                        Email
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setShowCallLogDialog(true)}>
                        <Phone className="h-4 w-4 mr-2" />
                        Call
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setShowMeetingDialog(true)}>
                        <Video className="h-4 w-4 mr-2" />
                        Meet
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <Separator />
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.senderId === 'me' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%]`}>
                          <div
                            className={`rounded-lg p-3 ${
                              message.senderId === 'me'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-sm">{message.senderName}</span>
                              {message.type === 'email' && (
                                <Badge variant="outline" className="text-xs">
                                  <Mail className="h-3 w-3 mr-1" />
                                  Email
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            
                            {message.attachments && message.attachments.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {message.attachments.map((attachment) => (
                                  <div
                                    key={attachment.id}
                                    className="flex items-center gap-2 p-2 rounded bg-background/10 text-xs"
                                  >
                                    {attachment.type.startsWith('image/') ? (
                                      <ImageIcon className="h-4 w-4" />
                                    ) : (
                                      <FileIcon className="h-4 w-4" />
                                    )}
                                    <span className="flex-1 truncate">{attachment.name}</span>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={() => window.open(attachment.url, '_blank')}
                                    >
                                      <Download className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            <div className="flex items-center justify-end gap-1 mt-2">
                              <Clock className="h-3 w-3 opacity-70" />
                              <span className="text-xs opacity-70">{formatMessageTime(message.timestamp)}</span>
                              {message.senderId === 'me' && (
                                message.read ? (
                                  <CheckCheck className="h-3 w-3 ml-1 text-blue-500" />
                                ) : (
                                  <Check className="h-3 w-3 ml-1 opacity-70" />
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <Separator />
                <div className="p-4 space-y-3">
                  {/* Typing Indicator */}
                  {selectedClient?.isTyping && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="flex gap-1">
                        <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span>{selectedClient.name} is typing...</span>
                    </div>
                  )}
                  
                  {/* Attachment Preview */}
                  {selectedAttachments.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedAttachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="flex items-center gap-2 p-2 rounded-md bg-muted text-sm"
                        >
                          {attachment.type.startsWith('image/') ? (
                            <ImageIcon className="h-4 w-4" />
                          ) : (
                            <FileIcon className="h-4 w-4" />
                          )}
                          <span className="max-w-[150px] truncate">{attachment.name}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleRemoveAttachment(attachment.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Message Input */}
                  <div className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={sending}
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Input
                      placeholder="Type your message..."
                      value={messageInput}
                      onChange={(e) => {
                        setMessageInput(e.target.value)
                        handleTyping()
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                      disabled={sending}
                    />
                    <Button onClick={handleSendMessage} disabled={sending || !messageInput.trim()}>
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
                <div className="text-center text-muted-foreground">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Select a client</p>
                  <p className="text-sm">Choose a client from the list to start communicating</p>
                </div>
              </div>
            )}
          </Card>

          <Card className="col-span-12 md:col-span-3 zyphex-card overflow-hidden">
            {selectedClient ? (
              <>
                <CardHeader>
                  <CardTitle className="text-lg">Client Details</CardTitle>
                </CardHeader>
                <Separator />
                <ScrollArea className="flex-1">
                  <div className="p-4 space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Contact Information
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Email:</span>
                          <p className="font-medium">{selectedClient.email}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Company:</span>
                          <p className="font-medium">{selectedClient.company}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Status:</span>
                          <Badge variant={selectedClient.status === 'active' ? 'default' : 'secondary'}>
                            {selectedClient.status}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Projects
                      </h4>
                      <div className="space-y-2">
                        <Button variant="outline" size="sm" className="w-full justify-start">
                          <FileText className="h-4 w-4 mr-2" />
                          View Projects
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <History className="h-4 w-4" />
                        Quick Actions
                      </h4>
                      <div className="space-y-2">
                        <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => setShowEmailDialog(true)}>
                          <Mail className="h-4 w-4 mr-2" />
                          Send Email
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => setShowMeetingDialog(true)}>
                          <Calendar className="h-4 w-4 mr-2" />
                          Schedule Meeting
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => setShowCallLogDialog(true)}>
                          <Phone className="h-4 w-4 mr-2" />
                          Log Call
                        </Button>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center text-muted-foreground text-sm">
                  <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Select a client to view details</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Compose Email</DialogTitle>
            <DialogDescription>
              Send an email to {selectedClient?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Email Template</label>
              <Select onValueChange={applyTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {EMAIL_TEMPLATES.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Subject</label>
              <Input
                placeholder="Email subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Message</label>
              <Textarea
                placeholder="Email message"
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                rows={10}
                className="resize-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEmailDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendEmail} disabled={sending || !emailSubject.trim() || !emailBody.trim()}>
                {sending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Email
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Meeting Scheduler Dialog */}
      <Dialog open={showMeetingDialog} onOpenChange={setShowMeetingDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Schedule Meeting</DialogTitle>
            <DialogDescription>
              Schedule a meeting with {selectedClient?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Meeting Title</Label>
              <Input
                placeholder="e.g., Project Review"
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label>Date & Time</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left mt-1">
                    <Calendar className="mr-2 h-4 w-4" />
                    {meetingDate ? format(meetingDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={meetingDate}
                    onSelect={setMeetingDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Duration (minutes)</Label>
              <Select value={meetingDuration} onValueChange={setMeetingDuration}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Meeting Type</Label>
              <Select value={meetingType} onValueChange={(v) => setMeetingType(v as 'video' | 'phone' | 'in-person')}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      Video Call
                    </div>
                  </SelectItem>
                  <SelectItem value="phone">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone Call
                    </div>
                  </SelectItem>
                  <SelectItem value="in-person">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      In Person
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Notes (Optional)</Label>
              <Textarea
                placeholder="Meeting agenda or notes"
                value={meetingNotes}
                onChange={(e) => setMeetingNotes(e.target.value)}
                rows={3}
                className="mt-1 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowMeetingDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleScheduleMeeting} disabled={!meetingTitle.trim() || !meetingDate}>
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Meeting
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Call Logging Dialog */}
      <Dialog open={showCallLogDialog} onOpenChange={setShowCallLogDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Log Call</DialogTitle>
            <DialogDescription>
              Record details of your call with {selectedClient?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Call Type</Label>
              <Select value={callType} onValueChange={(v) => setCallType(v as 'incoming' | 'outgoing' | 'missed')}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="outgoing">Outgoing Call</SelectItem>
                  <SelectItem value="incoming">Incoming Call</SelectItem>
                  <SelectItem value="missed">Missed Call</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                placeholder="e.g., 15"
                value={callDuration || ''}
                onChange={(e) => setCallDuration(e.target.value)}
                min="0"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Call Notes</Label>
              <Textarea
                placeholder="What was discussed during the call?"
                value={callNotes}
                onChange={(e) => setCallNotes(e.target.value)}
                rows={5}
                className="mt-1 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCallLogDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleLogCall}>
                <Phone className="mr-2 h-4 w-4" />
                Log Call
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}