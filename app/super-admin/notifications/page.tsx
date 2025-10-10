"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Bell,
  MessageSquare,
  FileText,
  AlertTriangle,
  CheckCircle,
  Info,
  Loader2,
  Trash2,
  ExternalLink,
} from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { format } from "date-fns"

interface Notification {
  id: string
  title: string
  message: string
  type: "INFO" | "SUCCESS" | "WARNING" | "ERROR" | "TASK" | "MESSAGE" | "BILLING" | "DOCUMENT" | "PROJECT_UPDATE" | "SYSTEM"
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
}

export default function AdminNotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all")

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/super-admin/notifications")
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
      } else {
        toast.error("Failed to load notifications")
      }
    } catch (error) {
      toast.error("Failed to load notifications")
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch("/api/super-admin/notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notificationId }),
      })

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === notificationId
              ? { ...notif, read: true, readAt: new Date() }
              : notif
          )
        )
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      markAsRead(notification.id)
    }

    // Navigate to related page
    if (notification.actionUrl) {
      router.push(notification.actionUrl)
    } else if (notification.relatedType === "message" && notification.relatedId) {
      router.push(`/super-admin/messages-new?id=${notification.relatedId}`)
    } else if (notification.relatedType === "project" && notification.relatedId) {
      router.push(`/super-admin/projects/${notification.relatedId}`)
    } else if (notification.relatedType === "user" && notification.relatedId) {
      router.push(`/super-admin/users/${notification.relatedId}`)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/super-admin/notifications", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "markAllRead" }),
      })

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notif) => ({ ...notif, read: true, readAt: new Date() }))
        )
        toast.success("All notifications marked as read")
      }
    } catch (error) {
      toast.error("Failed to mark all as read")
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch("/api/super-admin/notifications", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notificationId }),
      })

      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
        toast.success("Notification deleted")
      }
    } catch (error) {
      toast.error("Failed to delete notification")
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "MESSAGE":
        return <MessageSquare className="h-5 w-5 text-blue-400" />
      case "DOCUMENT":
        return <FileText className="h-5 w-5 text-purple-400" />
      case "WARNING":
      case "ERROR":
        return <AlertTriangle className="h-5 w-5 text-red-400" />
      case "SUCCESS":
        return <CheckCircle className="h-5 w-5 text-green-400" />
      default:
        return <Info className="h-5 w-5 text-gray-400" />
    }
  }

  const getNotificationBadgeColor = (type: string) => {
    switch (type) {
      case "MESSAGE":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
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

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === "unread") return !notif.read
    if (filter === "read") return notif.read
    return true
  })

  const unreadCount = notifications.filter((n) => !n.read).length

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
            <span className="zyphex-subheading">Loading notifications...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
      <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold zyphex-heading flex items-center gap-2">
              <Bell className="h-8 w-8 text-blue-400" />
              Notifications
            </h1>
            <p className="zyphex-subheading">
              System notifications and alerts • {unreadCount} unread
            </p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button onClick={markAllAsRead} variant="outline" size="sm">
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark All Read
              </Button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All ({notifications.length})
          </Button>
          <Button
            variant={filter === "unread" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("unread")}
          >
            Unread ({unreadCount})
          </Button>
          <Button
            variant={filter === "read" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("read")}
          >
            Read ({notifications.length - unreadCount})
          </Button>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <Card className="zyphex-card">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  {filter === "all"
                    ? "No notifications yet"
                    : filter === "unread"
                    ? "No unread notifications"
                    : "No read notifications"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((notification) => (
              <Card
                key={notification.id}
                className={`zyphex-card cursor-pointer transition-all hover:scale-[1.01] hover:shadow-lg ${
                  !notification.read ? "border-blue-500/30 bg-blue-500/5" : ""
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <h3 className="font-semibold zyphex-heading flex-1 break-words">
                          {notification.title}
                        </h3>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!notification.read && (
                            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteNotification(notification.id)
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-400" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm zyphex-subheading break-words">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge
                          variant="outline"
                          className={getNotificationBadgeColor(notification.type)}
                        >
                          {notification.type}
                        </Badge>
                        {notification.project && (
                          <Badge variant="outline" className="text-xs">
                            {notification.project.name}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground ml-auto">
                          {format(new Date(notification.createdAt), "MMM d, h:mm a")}
                        </span>
                      </div>
                    </div>

                    {/* Action Icon */}
                    {notification.actionUrl && (
                      <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
