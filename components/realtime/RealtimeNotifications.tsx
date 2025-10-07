"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSocket } from '@/hooks/useSocket';
import { useSession } from 'next-auth/react';
import { 
  Bell, 
  BellRing, 
  X, 
  Check,
  AlertCircle,
  Info,
  CheckCircle,
  Users,
  MessageSquare,
  Calendar,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'message' | 'task' | 'milestone' | 'project';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: any;
  from?: {
    id: string;
    name: string;
    email: string;
  };
}

interface RealtimeNotificationsProps {
  className?: string;
}

export function RealtimeNotifications({ className }: RealtimeNotificationsProps) {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  
  const socket = useSocket();

  // Listen for real-time notifications
  useEffect(() => {
    if (!socket.socket) return;

    const handleNotification = (data: any) => {
      const notification: Notification = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        type: data.type || 'info',
        title: data.title,
        message: data.message,
        timestamp: new Date().toISOString(),
        read: false,
        data: data.data,
        from: data.from
      };

      setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep last 50 notifications
      setUnreadCount(prev => prev + 1);

      // Show toast for important notifications
      if (data.type === 'error' || data.type === 'warning') {
        toast({
          title: notification.title,
          description: notification.message,
          variant: data.type === 'error' ? 'destructive' : 'default',
        });
      }
    };

    const handleTaskUpdated = (data: any) => {
      if (data.updatedBy.id !== session?.user?.id) {
        handleNotification({
          type: 'task',
          title: 'Task Updated',
          message: `${data.updatedBy.name} updated a task in your project`,
          data: data
        });
      }
    };

    const handleMilestoneUpdated = (data: any) => {
      if (data.updatedBy.id !== session?.user?.id) {
        handleNotification({
          type: 'milestone',
          title: 'Milestone Updated',
          message: `${data.updatedBy.name} updated a milestone`,
          data: data
        });
      }
    };

    const handleNewMessage = (data: any) => {
      if (data.sender.id !== session?.user?.id) {
        handleNotification({
          type: 'message',
          title: 'New Message',
          message: `${data.sender.name}: ${data.content.substring(0, 50)}${data.content.length > 50 ? '...' : ''}`,
          data: data,
          from: data.sender
        });
      }
    };

    const handleUserJoinedProject = (data: any) => {
      if (data.userId !== session?.user?.id) {
        handleNotification({
          type: 'project',
          title: 'User Joined Project',
          message: `${data.userName} joined the project`,
          data: data
        });
      }
    };

    const handleRoleNotification = (data: any) => {
      if (data.role === session?.user?.role || data.role === 'ALL') {
        handleNotification({
          type: data.type || 'info',
          title: data.title,
          message: data.message,
          data: data.data
        });
      }
    };

    // Subscribe to events
    socket.on('notification', handleNotification);
    socket.on('task_updated', handleTaskUpdated);
    socket.on('milestone_updated', handleMilestoneUpdated);
    socket.on('new_message', handleNewMessage);
    socket.on('user_joined_project', handleUserJoinedProject);
    socket.on('role_notification', handleRoleNotification);

    return () => {
      socket.off('notification', handleNotification);
      socket.off('task_updated', handleTaskUpdated);
      socket.off('milestone_updated', handleMilestoneUpdated);
      socket.off('new_message', handleNewMessage);
      socket.off('user_joined_project', handleUserJoinedProject);
      socket.off('role_notification', handleRoleNotification);
    };
  }, [socket.socket, session?.user?.id, session?.user?.role, socket]);

  // Load existing notifications on mount
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const response = await fetch('/api/user/notifications');
        if (response.ok) {
          const data = await response.json();
          setNotifications(data.notifications || []);
          setUnreadCount(data.notifications?.filter((n: Notification) => !n.read).length || 0);
        }
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    };

    if (session?.user) {
      loadNotifications();
    }
  }, [session?.user]);

  // Get notification icon and color
  const getNotificationInfo = (type: string) => {
    switch (type) {
      case 'success':
        return { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-400/10' };
      case 'warning':
        return { icon: AlertCircle, color: 'text-yellow-400', bg: 'bg-yellow-400/10' };
      case 'error':
        return { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-400/10' };
      case 'message':
        return { icon: MessageSquare, color: 'text-blue-400', bg: 'bg-blue-400/10' };
      case 'task':
        return { icon: Check, color: 'text-purple-400', bg: 'bg-purple-400/10' };
      case 'milestone':
        return { icon: Calendar, color: 'text-orange-400', bg: 'bg-orange-400/10' };
      case 'project':
        return { icon: Users, color: 'text-cyan-400', bg: 'bg-cyan-400/10' };
      default:
        return { icon: Info, color: 'text-blue-400', bg: 'bg-blue-400/10' };
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    // Optionally sync with backend
    try {
      await fetch(`/api/user/notifications/${notificationId}/read`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);

    try {
      await fetch('/api/user/notifications/mark-all-read', {
        method: 'POST'
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Delete notification
  const deleteNotification = (notificationId: string) => {
    const notification = notifications.find(n => n.id === notificationId);
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  // Format timestamp
  const formatNotificationTime = (timestamp: string) => {
    try {
      const notificationTime = new Date(timestamp);
      const now = new Date();
      const diff = now.getTime() - notificationTime.getTime();
      
      if (diff < 60000) { // Less than 1 minute
        return 'Just now';
      } else if (diff < 3600000) { // Less than 1 hour
        return `${Math.floor(diff / 60000)}m ago`;
      } else if (diff < 86400000) { // Less than 1 day
        return `${Math.floor(diff / 3600000)}h ago`;
      } else {
        return format(notificationTime, 'MMM d, HH:mm');
      }
    } catch {
      return 'Unknown';
    }
  };

  return (
    <div className={className}>
      {/* Notification Bell Button */}
      <Button
        variant="ghost"
        size="sm"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        {unreadCount > 0 ? (
          <BellRing className="h-5 w-5" />
        ) : (
          <Bell className="h-5 w-5" />
        )}
        
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notifications Panel */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-96 z-50">
          <Card className="zyphex-card shadow-lg border-slate-700">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 zyphex-heading">
                  <Bell className="h-5 w-5" />
                  Notifications
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {unreadCount} new
                    </Badge>
                  )}
                </CardTitle>
                
                <div className="flex items-center gap-1">
                  {notifications.length > 0 && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={markAllAsRead}
                        className="text-xs"
                      >
                        Mark all read
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAllNotifications}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <ScrollArea className="h-80">
                {notifications.length === 0 ? (
                  <div className="text-center py-8 px-4">
                    <Bell className="h-8 w-8 mx-auto zyphex-subheading mb-2" />
                    <p className="text-sm zyphex-subheading">No notifications</p>
                    <p className="text-xs zyphex-subheading">You're all caught up!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-700">
                    {notifications.map((notification) => {
                      const notificationInfo = getNotificationInfo(notification.type);
                      const NotificationIcon = notificationInfo.icon;
                      
                      return (
                        <div
                          key={notification.id}
                          className={`p-4 hover:bg-slate-800/50 transition-colors ${
                            !notification.read ? 'bg-slate-800/30' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Icon */}
                            <div className={`p-1.5 rounded-full ${notificationInfo.bg} flex-shrink-0`}>
                              <NotificationIcon className={`h-3 w-3 ${notificationInfo.color}`} />
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-medium zyphex-text">
                                      {notification.title}
                                    </h4>
                                    {!notification.read && (
                                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    )}
                                  </div>
                                  <p className="text-sm zyphex-subheading mt-1">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs zyphex-subheading mt-2">
                                    {formatNotificationTime(notification.timestamp)}
                                  </p>
                                </div>
                                
                                {/* Actions */}
                                <div className="flex items-center gap-1 ml-2">
                                  {!notification.read && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => markAsRead(notification.id)}
                                      className="h-6 w-6 p-0"
                                    >
                                      <Check className="h-3 w-3" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteNotification(notification.id)}
                                    className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}