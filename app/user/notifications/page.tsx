"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Bell,
  CheckCircle,
  AlertCircle,
  Info,
  MessageSquare,
  Calendar,
  CreditCard,
  Settings,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react"
import { useState, useEffect } from "react"

interface Notification {
  id: string
  type: string
  title: string
  description: string
  timestamp: string
  read: boolean
  priority: string
}

export default function UserNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch notifications on component mount
  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/user/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      // Error fetching notifications - handle silently or show user notification
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/user/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationId, read: true }),
      })

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, read: true }
              : notif
          )
        )
      }
    } catch (error) {
      // Error marking notification as read - handle silently
    }
  }

  // Initialize with empty array if no data from API
  if (notifications.length === 0 && !isLoading) {
    // Mock data would be set here from the API fallback
  }

  const [notificationSettings, setNotificationSettings] = useState({
    email: {
      messages: true,
      appointments: true,
      system: true,
      billing: true,
      marketing: false,
    },
    push: {
      messages: true,
      appointments: true,
      system: false,
      billing: true,
      marketing: false,
    },
    sms: {
      messages: false,
      appointments: true,
      system: false,
      billing: false,
      marketing: false,
    },
  })

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "message":
        return <MessageSquare className="h-5 w-5 text-blue-400" />
      case "appointment":
        return <Calendar className="h-5 w-5 text-green-400" />
      case "billing":
        return <CreditCard className="h-5 w-5 text-purple-400" />
      case "system":
        return <AlertCircle className="h-5 w-5 text-red-400" />
      case "update":
        return <Info className="h-5 w-5 text-yellow-400" />
      default:
        return <Bell className="h-5 w-5 text-gray-400" />
    }
  }

  const getPriorityColor = (priority: string) => {
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

  const markAllAsRead = async () => {
    try {
      // Mark all notifications as read
      await Promise.all(
        notifications
          .filter(notif => !notif.read)
          .map(notif => markAsRead(notif.id))
      )
    } catch (error) {
      // Error marking all notifications as read - handle silently
    }
  }

  const deleteNotification = async (id: string) => {
    // For now, just remove from local state
    // In a real app, you'd make an API call to delete
    setNotifications(notifications.filter(notif => notif.id !== id))
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold zyphex-heading">Notifications</h1>
          <p className="text-lg zyphex-subheading">Stay updated with your latest activities</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={markAllAsRead} className="zyphex-button-secondary">
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>
          <Button className="zyphex-button-primary hover-zyphex-lift">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="zyphex-card hover-zyphex-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium zyphex-subheading">Unread</CardTitle>
            <Bell className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold zyphex-heading">{unreadCount}</div>
            <p className="text-xs zyphex-subheading">Notifications waiting</p>
          </CardContent>
        </Card>

        <Card className="zyphex-card hover-zyphex-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium zyphex-subheading">Today</CardTitle>
            <Calendar className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold zyphex-heading">
              {notifications.filter(n => new Date(n.timestamp).toDateString() === new Date().toDateString()).length}
            </div>
            <p className="text-xs zyphex-subheading">Notifications today</p>
          </CardContent>
        </Card>

        <Card className="zyphex-card hover-zyphex-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium zyphex-subheading">This Week</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold zyphex-heading">
              {notifications.filter(n => {
                const notifDate = new Date(n.timestamp)
                const weekAgo = new Date()
                weekAgo.setDate(weekAgo.getDate() - 7)
                return notifDate >= weekAgo
              }).length}
            </div>
            <p className="text-xs zyphex-subheading">This week</p>
          </CardContent>
        </Card>

        <Card className="zyphex-card hover-zyphex-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium zyphex-subheading">High Priority</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold zyphex-heading">
              {notifications.filter(n => n.priority === "high").length}
            </div>
            <p className="text-xs zyphex-subheading">Require attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Notifications */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 zyphex-glass-effect border-gray-800/50">
          <TabsTrigger value="all" className="zyphex-button-secondary">
            All ({notifications.length})
          </TabsTrigger>
          <TabsTrigger value="unread" className="zyphex-button-secondary">
            Unread ({unreadCount})
          </TabsTrigger>
          <TabsTrigger value="high" className="zyphex-button-secondary">
            High Priority ({notifications.filter(n => n.priority === "high").length})
          </TabsTrigger>
          <TabsTrigger value="settings" className="zyphex-button-secondary">
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {notifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`zyphex-card hover-zyphex-lift transition-all duration-200 ${
                    !notification.read ? "border-blue-500/30 bg-blue-500/5" : ""
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-gray-500/20">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold zyphex-heading">{notification.title}</h3>
                          <Badge className={`${getPriorityColor(notification.priority)} border text-xs`}>
                            {notification.priority}
                          </Badge>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                          )}
                        </div>
                        <p className="text-sm zyphex-subheading mb-3">{notification.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs zyphex-subheading">
                            {new Date(notification.timestamp).toLocaleString()}
                          </span>
                          <div className="flex gap-2">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(notification.id)}
                                className="zyphex-button-secondary"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteNotification(notification.id)}
                              className="zyphex-button-secondary text-red-400"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="unread" className="space-y-4">
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {notifications.filter(n => !n.read).map((notification) => (
                <Card key={notification.id} className="zyphex-card hover-zyphex-lift border-blue-500/30 bg-blue-500/5">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-gray-500/20">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold zyphex-heading">{notification.title}</h3>
                          <Badge className={`${getPriorityColor(notification.priority)} border text-xs`}>
                            {notification.priority}
                          </Badge>
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        </div>
                        <p className="text-sm zyphex-subheading mb-3">{notification.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs zyphex-subheading">
                            {new Date(notification.timestamp).toLocaleString()}
                          </span>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="zyphex-button-secondary"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteNotification(notification.id)}
                              className="zyphex-button-secondary text-red-400"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="high" className="space-y-4">
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {notifications.filter(n => n.priority === "high").map((notification) => (
                <Card key={notification.id} className="zyphex-card hover-zyphex-lift border-red-500/30">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-red-500/20">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold zyphex-heading">{notification.title}</h3>
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                            high
                          </Badge>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                          )}
                        </div>
                        <p className="text-sm zyphex-subheading mb-3">{notification.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs zyphex-subheading">
                            {new Date(notification.timestamp).toLocaleString()}
                          </span>
                          <div className="flex gap-2">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(notification.id)}
                                className="zyphex-button-secondary"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteNotification(notification.id)}
                              className="zyphex-button-secondary text-red-400"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card className="zyphex-card">
            <CardHeader>
              <CardTitle className="zyphex-heading">Notification Preferences</CardTitle>
              <CardDescription className="zyphex-subheading">Choose how you want to receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold zyphex-heading flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    Email Notifications
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm zyphex-subheading">Messages</span>
                      <Switch
                        checked={notificationSettings.email.messages}
                        onCheckedChange={(checked) =>
                          setNotificationSettings(prev => ({
                            ...prev,
                            email: { ...prev.email, messages: checked }
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm zyphex-subheading">Appointments</span>
                      <Switch
                        checked={notificationSettings.email.appointments}
                        onCheckedChange={(checked) =>
                          setNotificationSettings(prev => ({
                            ...prev,
                            email: { ...prev.email, appointments: checked }
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm zyphex-subheading">System Updates</span>
                      <Switch
                        checked={notificationSettings.email.system}
                        onCheckedChange={(checked) =>
                          setNotificationSettings(prev => ({
                            ...prev,
                            email: { ...prev.email, system: checked }
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm zyphex-subheading">Billing</span>
                      <Switch
                        checked={notificationSettings.email.billing}
                        onCheckedChange={(checked) =>
                          setNotificationSettings(prev => ({
                            ...prev,
                            email: { ...prev.email, billing: checked }
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm zyphex-subheading">Marketing</span>
                      <Switch
                        checked={notificationSettings.email.marketing}
                        onCheckedChange={(checked) =>
                          setNotificationSettings(prev => ({
                            ...prev,
                            email: { ...prev.email, marketing: checked }
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold zyphex-heading flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Push Notifications
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm zyphex-subheading">Messages</span>
                      <Switch
                        checked={notificationSettings.push.messages}
                        onCheckedChange={(checked) =>
                          setNotificationSettings(prev => ({
                            ...prev,
                            push: { ...prev.push, messages: checked }
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm zyphex-subheading">Appointments</span>
                      <Switch
                        checked={notificationSettings.push.appointments}
                        onCheckedChange={(checked) =>
                          setNotificationSettings(prev => ({
                            ...prev,
                            push: { ...prev.push, appointments: checked }
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm zyphex-subheading">System Updates</span>
                      <Switch
                        checked={notificationSettings.push.system}
                        onCheckedChange={(checked) =>
                          setNotificationSettings(prev => ({
                            ...prev,
                            push: { ...prev.push, system: checked }
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm zyphex-subheading">Billing</span>
                      <Switch
                        checked={notificationSettings.push.billing}
                        onCheckedChange={(checked) =>
                          setNotificationSettings(prev => ({
                            ...prev,
                            push: { ...prev.push, billing: checked }
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm zyphex-subheading">Marketing</span>
                      <Switch
                        checked={notificationSettings.push.marketing}
                        onCheckedChange={(checked) =>
                          setNotificationSettings(prev => ({
                            ...prev,
                            push: { ...prev.push, marketing: checked }
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold zyphex-heading flex items-center gap-2">
                    <VolumeX className="h-4 w-4" />
                    SMS Notifications
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm zyphex-subheading">Messages</span>
                      <Switch
                        checked={notificationSettings.sms.messages}
                        onCheckedChange={(checked) =>
                          setNotificationSettings(prev => ({
                            ...prev,
                            sms: { ...prev.sms, messages: checked }
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm zyphex-subheading">Appointments</span>
                      <Switch
                        checked={notificationSettings.sms.appointments}
                        onCheckedChange={(checked) =>
                          setNotificationSettings(prev => ({
                            ...prev,
                            sms: { ...prev.sms, appointments: checked }
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm zyphex-subheading">System Updates</span>
                      <Switch
                        checked={notificationSettings.sms.system}
                        onCheckedChange={(checked) =>
                          setNotificationSettings(prev => ({
                            ...prev,
                            sms: { ...prev.sms, system: checked }
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm zyphex-subheading">Billing</span>
                      <Switch
                        checked={notificationSettings.sms.billing}
                        onCheckedChange={(checked) =>
                          setNotificationSettings(prev => ({
                            ...prev,
                            sms: { ...prev.sms, billing: checked }
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm zyphex-subheading">Marketing</span>
                      <Switch
                        checked={notificationSettings.sms.marketing}
                        onCheckedChange={(checked) =>
                          setNotificationSettings(prev => ({
                            ...prev,
                            sms: { ...prev.sms, marketing: checked }
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
