"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { SubtleBackground } from "@/components/subtle-background"
import {
  Bell,
  BellRing,
  CheckCircle,
  CheckCheck,
  Trash2,
  Archive,
  Search,
  Settings,
  MessageSquare,
  Calendar,
  AlertTriangle,
  FolderKanban,
  Clock,
  Mail,
  UserPlus,
  Activity,
  Info,
  RefreshCw
} from "lucide-react"

export const dynamic = 'force-dynamic'

// Notification interface
interface Notification {
  id: string
  title: string
  message: string
  type: "INFO" | "SUCCESS" | "WARNING" | "ERROR" | "TASK" | "MESSAGE" | "MENTION" | "DEADLINE" | "COMMENT" | "INVITATION" | "PROJECT_UPDATE" | "SYSTEM"
  read: boolean
  readAt: Date | null
  actionUrl: string | null
  relatedType: string | null
  relatedId: string | null
  createdAt: string
  project?: {
    id: string
    name: string
  } | null
  priority?: "low" | "normal" | "high"
}

// Notification filter type
type FilterType = "all" | "unread" | "task" | "mention" | "deadline" | "project"

// Date range type
type DateRange = "all" | "today" | "week" | "month"

export default function ProjectManagerNotificationsPage() {
  const router = useRouter()
  const { toast } = useToast()

  // State management
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<FilterType>("all")
  const [dateRange, setDateRange] = useState<DateRange>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProject, setSelectedProject] = useState<string>("all")
  const [showSettings, setShowSettings] = useState(false)

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    taskAssignments: true,
    projectUpdates: true,
    mentions: true,
    deadlines: true,
    comments: true,
    teamInvitations: true,
    quietHours: false,
    quietHoursStart: "22:00",
    quietHoursEnd: "08:00"
  })

  // Fetch notifications on mount
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/user/notifications")
        
        if (response.ok) {
          const data = await response.json()
          setNotifications(data.notifications || [])
        } else {
          toast({
            title: "Error",
            description: "Failed to load notifications",
            variant: "destructive"
          })
        }
      } catch (_error) {
        toast({
          title: "Error",
          description: "An error occurred while loading notifications",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    loadNotifications()
  }, [toast])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/user/notifications")
      
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
      } else {
        toast({
          title: "Error",
          description: "Failed to load notifications",
          variant: "destructive"
        })
      }
    } catch (_error) {
      toast({
        title: "Error",
        description: "An error occurred while loading notifications",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const refreshNotifications = async () => {
    try {
      setRefreshing(true)
      await fetchNotifications()
      toast({
        title: "Success",
        description: "Notifications refreshed"
      })
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to refresh notifications",
        variant: "destructive"
      })
    } finally {
      setRefreshing(false)
    }
  }

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch("/api/user/notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notificationId, read: true }),
      })

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notif =>
            notif.id === notificationId
              ? { ...notif, read: true, readAt: new Date() }
              : notif
          )
        )
      }
    } catch (_error) {
      console.error("Error marking notification as read:", _error)
    }
  }

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/user/notifications", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "markAllRead" }),
      })

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notif => ({ ...notif, read: true, readAt: new Date() }))
        )
        toast({
          title: "Success",
          description: "All notifications marked as read"
        })
      }
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to mark all as read",
        variant: "destructive"
      })
    }
  }

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch("/api/user/notifications", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notificationId }),
      })

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
        toast({
          title: "Success",
          description: "Notification deleted"
        })
      }
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive"
      })
    }
  }

  // Clear all notifications
  const clearAllNotifications = async () => {
    try {
      const response = await fetch("/api/user/notifications", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "deleteRead" }),
      })

      if (response.ok) {
        setNotifications(prev => prev.filter(n => !n.read))
        toast({
          title: "Success",
          description: "Read notifications cleared"
        })
      }
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to clear notifications",
        variant: "destructive"
      })
    }
  }

  // Archive notification (mark as read and remove from view)
  const archiveNotification = async (notificationId: string) => {
    await markAsRead(notificationId)
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
    toast({
      title: "Success",
      description: "Notification archived"
    })
  }

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }

    if (notification.actionUrl) {
      router.push(notification.actionUrl)
    }
  }

  // Save notification settings
  const saveNotificationSettings = async () => {
    try {
      // In a real app, you'd save to API
      toast({
        title: "Success",
        description: "Notification settings saved"
      })
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive"
      })
    }
  }

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "TASK":
        return <CheckCircle className="h-5 w-5 text-blue-400" />
      case "MESSAGE":
        return <MessageSquare className="h-5 w-5 text-purple-400" />
      case "MENTION":
        return <UserPlus className="h-5 w-5 text-cyan-400" />
      case "DEADLINE":
        return <Clock className="h-5 w-5 text-orange-400" />
      case "COMMENT":
        return <MessageSquare className="h-5 w-5 text-green-400" />
      case "INVITATION":
        return <Mail className="h-5 w-5 text-pink-400" />
      case "PROJECT_UPDATE":
        return <FolderKanban className="h-5 w-5 text-indigo-400" />
      case "WARNING":
      case "ERROR":
        return <AlertTriangle className="h-5 w-5 text-red-400" />
      case "SUCCESS":
        return <CheckCircle className="h-5 w-5 text-green-400" />
      case "INFO":
        return <Info className="h-5 w-5 text-blue-400" />
      case "SYSTEM":
        return <Activity className="h-5 w-5 text-gray-400" />
      default:
        return <Bell className="h-5 w-5 text-gray-400" />
    }
  }

  // Get notification badge color
  const getNotificationBadgeColor = (type: string) => {
    switch (type) {
      case "TASK":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "MESSAGE":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30"
      case "MENTION":
        return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
      case "DEADLINE":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30"
      case "COMMENT":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "INVITATION":
        return "bg-pink-500/20 text-pink-400 border-pink-500/30"
      case "PROJECT_UPDATE":
        return "bg-indigo-500/20 text-indigo-400 border-indigo-500/30"
      case "WARNING":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "ERROR":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      case "SUCCESS":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  // Get priority badge color
  const getPriorityBadgeColor = (priority?: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      case "normal":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "low":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  // Filter notifications based on selected filters
  const filteredNotifications = notifications.filter(notification => {
    // Filter by read status and type
    if (filter === "unread" && notification.read) return false
    if (filter === "task" && notification.type !== "TASK") return false
    if (filter === "mention" && notification.type !== "MENTION") return false
    if (filter === "deadline" && notification.type !== "DEADLINE") return false
    if (filter === "project" && notification.type !== "PROJECT_UPDATE") return false

    // Filter by date range
    if (dateRange !== "all") {
      const notificationDate = new Date(notification.createdAt)
      const now = new Date()
      const diffDays = Math.floor((now.getTime() - notificationDate.getTime()) / 86400000)

      if (dateRange === "today" && diffDays > 0) return false
      if (dateRange === "week" && diffDays > 7) return false
      if (dateRange === "month" && diffDays > 30) return false
    }

    // Filter by project
    if (selectedProject !== "all" && notification.project?.id !== selectedProject) return false

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        notification.title.toLowerCase().includes(query) ||
        notification.message.toLowerCase().includes(query)
      )
    }

    return true
  })

  // Get unique projects from notifications
  const projects = Array.from(
    new Set(
      notifications
        .filter(n => n.project)
        .map(n => JSON.stringify(n.project))
    )
  ).map(p => JSON.parse(p))

  // Calculate statistics
  const unreadCount = notifications.filter(n => !n.read).length
  const todayCount = notifications.filter(n => {
    const notificationDate = new Date(n.createdAt)
    const today = new Date()
    return notificationDate.toDateString() === today.toDateString()
  }).length
  const highPriorityCount = notifications.filter(n => n.priority === "high" && !n.read).length

  return (
    <div className="min-h-screen zyphex-gradient-bg relative">
      <SubtleBackground />
      
      <div className="relative z-10 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="transition-all duration-1000 opacity-100 translate-y-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30">
                  <BellRing className="h-8 w-8 text-blue-400" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold zyphex-heading">Notification Center</h1>
                  <p className="text-lg zyphex-subheading mt-1">
                    Stay updated with all your project activities
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshNotifications}
                  disabled={refreshing}
                  className="zyphex-button-secondary"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSettings(!showSettings)}
                  className="zyphex-button-secondary"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="zyphex-card hover-zyphex-lift transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm zyphex-subheading mb-1">Total</p>
                    <p className="text-3xl font-bold zyphex-heading">{notifications.length}</p>
                  </div>
                  <Bell className="h-8 w-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="zyphex-card hover-zyphex-lift transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm zyphex-subheading mb-1">Unread</p>
                    <p className="text-3xl font-bold zyphex-heading">{unreadCount}</p>
                  </div>
                  <BellRing className="h-8 w-8 text-orange-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="zyphex-card hover-zyphex-lift transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm zyphex-subheading mb-1">Today</p>
                    <p className="text-3xl font-bold zyphex-heading">{todayCount}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="zyphex-card hover-zyphex-lift transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm zyphex-subheading mb-1">High Priority</p>
                    <p className="text-3xl font-bold zyphex-heading">{highPriorityCount}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="notifications" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 zyphex-glass-effect border-gray-800/50">
              <TabsTrigger
                value="notifications"
                onClick={() => setShowSettings(false)}
                className="zyphex-button-secondary"
              >
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                onClick={() => setShowSettings(true)}
                className="zyphex-button-secondary"
              >
                <Settings className="h-4 w-4 mr-2" />
                Preferences
              </TabsTrigger>
            </TabsList>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-6">
              {/* Filters and Search */}
              <Card className="zyphex-card">
                <CardContent className="p-6 space-y-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search notifications..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 zyphex-input"
                    />
                  </div>

                  {/* Filter Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={filter === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilter("all")}
                      className={filter === "all" ? "zyphex-button-primary" : "zyphex-button-secondary"}
                    >
                      All ({notifications.length})
                    </Button>
                    <Button
                      variant={filter === "unread" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilter("unread")}
                      className={filter === "unread" ? "zyphex-button-primary" : "zyphex-button-secondary"}
                    >
                      Unread ({unreadCount})
                    </Button>
                    <Button
                      variant={filter === "task" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilter("task")}
                      className={filter === "task" ? "zyphex-button-primary" : "zyphex-button-secondary"}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Tasks
                    </Button>
                    <Button
                      variant={filter === "mention" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilter("mention")}
                      className={filter === "mention" ? "zyphex-button-primary" : "zyphex-button-secondary"}
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Mentions
                    </Button>
                    <Button
                      variant={filter === "deadline" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilter("deadline")}
                      className={filter === "deadline" ? "zyphex-button-primary" : "zyphex-button-secondary"}
                    >
                      <Clock className="h-4 w-4 mr-1" />
                      Deadlines
                    </Button>
                    <Button
                      variant={filter === "project" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilter("project")}
                      className={filter === "project" ? "zyphex-button-primary" : "zyphex-button-secondary"}
                    >
                      <FolderKanban className="h-4 w-4 mr-1" />
                      Projects
                    </Button>
                  </div>

                  {/* Additional Filters */}
                  <div className="flex flex-wrap gap-4">
                    {/* Date Range */}
                    <Select value={dateRange} onValueChange={(value: DateRange) => setDateRange(value)}>
                      <SelectTrigger className="w-[180px] zyphex-input">
                        <SelectValue placeholder="Date range" />
                      </SelectTrigger>
                      <SelectContent className="zyphex-dropdown">
                        <SelectItem value="all">All time</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">This week</SelectItem>
                        <SelectItem value="month">This month</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Project Filter */}
                    {projects.length > 0 && (
                      <Select value={selectedProject} onValueChange={setSelectedProject}>
                        <SelectTrigger className="w-[200px] zyphex-input">
                          <SelectValue placeholder="All projects" />
                        </SelectTrigger>
                        <SelectContent className="zyphex-dropdown">
                          <SelectItem value="all">All projects</SelectItem>
                          {projects.map((project: { id: string; name: string }) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    <div className="flex-1" />

                    {/* Action Buttons */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={markAllAsRead}
                      disabled={unreadCount === 0}
                      className="zyphex-button-secondary"
                    >
                      <CheckCheck className="h-4 w-4 mr-2" />
                      Mark All Read
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearAllNotifications}
                      className="zyphex-button-secondary"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear Read
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Notifications List */}
              <Card className="zyphex-card">
                <CardHeader>
                  <CardTitle className="zyphex-heading">
                    {filteredNotifications.length} Notification{filteredNotifications.length !== 1 ? "s" : ""}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <RefreshCw className="h-8 w-8 animate-spin text-blue-400" />
                    </div>
                  ) : filteredNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Bell className="h-12 w-12 text-gray-500 mb-4" />
                      <p className="text-lg zyphex-subheading text-center">
                        {notifications.length === 0
                          ? "No notifications yet"
                          : "No notifications match your filters"}
                      </p>
                      {(filter !== "all" || dateRange !== "all" || selectedProject !== "all" || searchQuery) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setFilter("all")
                            setDateRange("all")
                            setSelectedProject("all")
                            setSearchQuery("")
                          }}
                          className="mt-4 zyphex-button-secondary"
                        >
                          Clear Filters
                        </Button>
                      )}
                    </div>
                  ) : (
                    <ScrollArea className="h-[600px] pr-4">
                      <div className="space-y-3">
                        {filteredNotifications.map((notification) => (
                          <Card
                            key={notification.id}
                            className={`zyphex-card cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:shadow-lg ${
                              !notification.read ? "border-blue-500/30 bg-blue-500/5" : ""
                            }`}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-4">
                                {/* Icon */}
                                <div className="flex-shrink-0 p-2 rounded-lg bg-gray-500/10">
                                  {getNotificationIcon(notification.type)}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0 space-y-2">
                                  <div className="flex items-start justify-between gap-2">
                                    <h3 className="font-semibold zyphex-heading flex-1 break-words">
                                      {notification.title}
                                    </h3>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      {!notification.read && (
                                        <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                                      )}
                                    </div>
                                  </div>

                                  <p className="text-sm zyphex-subheading break-words">
                                    {notification.message}
                                  </p>

                                  <div className="flex items-center flex-wrap gap-2">
                                    <Badge
                                      variant="outline"
                                      className={getNotificationBadgeColor(notification.type)}
                                    >
                                      {notification.type.replace("_", " ")}
                                    </Badge>

                                    {notification.priority && (
                                      <Badge
                                        variant="outline"
                                        className={getPriorityBadgeColor(notification.priority)}
                                      >
                                        {notification.priority}
                                      </Badge>
                                    )}

                                    {notification.project && (
                                      <Badge variant="outline" className="bg-gray-500/20 text-gray-400 border-gray-500/30">
                                        <FolderKanban className="h-3 w-3 mr-1" />
                                        {notification.project.name}
                                      </Badge>
                                    )}

                                    <span className="text-xs text-gray-500 ml-auto">
                                      {formatTimestamp(notification.createdAt)}
                                    </span>
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col gap-2 flex-shrink-0">
                                  {!notification.read && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        markAsRead(notification.id)
                                      }}
                                      className="h-8 w-8 p-0"
                                      title="Mark as read"
                                    >
                                      <CheckCircle className="h-4 w-4 text-green-400" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      archiveNotification(notification.id)
                                    }}
                                    className="h-8 w-8 p-0"
                                    title="Archive"
                                  >
                                    <Archive className="h-4 w-4 text-blue-400" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      deleteNotification(notification.id)
                                    }}
                                    className="h-8 w-8 p-0"
                                    title="Delete"
                                  >
                                    <Trash2 className="h-4 w-4 text-red-400" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <Card className="zyphex-card">
                <CardHeader>
                  <CardTitle className="zyphex-heading">Notification Preferences</CardTitle>
                  <p className="text-sm zyphex-subheading">
                    Manage how you receive notifications
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* General Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold zyphex-heading">General</h3>
                    <Separator className="bg-gray-800/50" />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="zyphex-heading">Email Notifications</Label>
                        <p className="text-sm zyphex-subheading">
                          Receive notifications via email
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.emailNotifications}
                        onCheckedChange={(checked) =>
                          setNotificationSettings(prev => ({ ...prev, emailNotifications: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="zyphex-heading">Push Notifications</Label>
                        <p className="text-sm zyphex-subheading">
                          Receive push notifications in browser
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.pushNotifications}
                        onCheckedChange={(checked) =>
                          setNotificationSettings(prev => ({ ...prev, pushNotifications: checked }))
                        }
                      />
                    </div>
                  </div>

                  {/* Notification Types */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold zyphex-heading">Notification Types</h3>
                    <Separator className="bg-gray-800/50" />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="zyphex-heading">Task Assignments</Label>
                        <p className="text-sm zyphex-subheading">
                          When you&apos;re assigned to a task
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.taskAssignments}
                        onCheckedChange={(checked) =>
                          setNotificationSettings(prev => ({ ...prev, taskAssignments: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="zyphex-heading">Project Updates</Label>
                        <p className="text-sm zyphex-subheading">
                          Updates on projects you&apos;re involved in
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.projectUpdates}
                        onCheckedChange={(checked) =>
                          setNotificationSettings(prev => ({ ...prev, projectUpdates: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="zyphex-heading">@Mentions</Label>
                        <p className="text-sm zyphex-subheading">
                          When someone mentions you
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.mentions}
                        onCheckedChange={(checked) =>
                          setNotificationSettings(prev => ({ ...prev, mentions: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="zyphex-heading">Deadline Reminders</Label>
                        <p className="text-sm zyphex-subheading">
                          Reminders for upcoming deadlines
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.deadlines}
                        onCheckedChange={(checked) =>
                          setNotificationSettings(prev => ({ ...prev, deadlines: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="zyphex-heading">Comment Replies</Label>
                        <p className="text-sm zyphex-subheading">
                          Replies to your comments
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.comments}
                        onCheckedChange={(checked) =>
                          setNotificationSettings(prev => ({ ...prev, comments: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="zyphex-heading">Team Invitations</Label>
                        <p className="text-sm zyphex-subheading">
                          Invitations to join teams
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.teamInvitations}
                        onCheckedChange={(checked) =>
                          setNotificationSettings(prev => ({ ...prev, teamInvitations: checked }))
                        }
                      />
                    </div>
                  </div>

                  {/* Quiet Hours */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold zyphex-heading">Quiet Hours</h3>
                    <Separator className="bg-gray-800/50" />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="zyphex-heading">Enable Quiet Hours</Label>
                        <p className="text-sm zyphex-subheading">
                          Pause notifications during specific hours
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.quietHours}
                        onCheckedChange={(checked) =>
                          setNotificationSettings(prev => ({ ...prev, quietHours: checked }))
                        }
                      />
                    </div>

                    {notificationSettings.quietHours && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="zyphex-heading">Start Time</Label>
                          <Input
                            type="time"
                            value={notificationSettings.quietHoursStart}
                            onChange={(e) =>
                              setNotificationSettings(prev => ({ ...prev, quietHoursStart: e.target.value }))
                            }
                            className="zyphex-input"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="zyphex-heading">End Time</Label>
                          <Input
                            type="time"
                            value={notificationSettings.quietHoursEnd}
                            onChange={(e) =>
                              setNotificationSettings(prev => ({ ...prev, quietHoursEnd: e.target.value }))
                            }
                            className="zyphex-input"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator className="bg-gray-800/50" />

                  {/* Save Button */}
                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        // Reset to defaults
                        setNotificationSettings({
                          emailNotifications: true,
                          pushNotifications: true,
                          taskAssignments: true,
                          projectUpdates: true,
                          mentions: true,
                          deadlines: true,
                          comments: true,
                          teamInvitations: true,
                          quietHours: false,
                          quietHoursStart: "22:00",
                          quietHoursEnd: "08:00"
                        })
                      }}
                      className="zyphex-button-secondary"
                    >
                      Reset to Defaults
                    </Button>
                    <Button
                      onClick={saveNotificationSettings}
                      className="zyphex-button-primary hover-zyphex-lift"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Save Preferences
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Links */}
              <Card className="zyphex-card">
                <CardHeader>
                  <CardTitle className="zyphex-heading">Quick Links</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start zyphex-button-secondary"
                    onClick={() => router.push("/project-manager/settings")}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Account Settings
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start zyphex-button-secondary"
                    onClick={() => router.push("/project-manager/dashboard")}
                  >
                    <Activity className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}