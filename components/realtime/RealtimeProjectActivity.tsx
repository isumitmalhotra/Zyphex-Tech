"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useProjectSocket } from '@/hooks/useSocket';
import { 
  Activity, 
  User, 
  CheckCircle, 
  MessageSquare, 
  FileText, 
  Calendar,
  Users,
  Settings,
  AlertCircle,
  Clock,
  Trash2
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface ActivityItem {
  id: string;
  type: 'task_created' | 'task_updated' | 'task_completed' | 'message_sent' | 'milestone_created' | 'milestone_updated' | 'user_joined' | 'user_left' | 'project_updated' | 'file_uploaded';
  title: string;
  description: string;
  timestamp: string;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  data?: any;
  projectId: string;
}

interface RealtimeProjectActivityProps {
  projectId: string;
  className?: string;
  showTitle?: boolean;
  maxHeight?: string;
}

export function RealtimeProjectActivity({ 
  projectId, 
  className, 
  showTitle = true,
  maxHeight = "h-96"
}: RealtimeProjectActivityProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const projectSocket = useProjectSocket(projectId);

  // Memoized event handlers
  const handleTaskActivity = useCallback((data: any) => {
    const activity: ActivityItem = {
      id: `task_${data.taskId}_${Date.now()}`,
      type: data.type || 'task_updated',
      title: data.type === 'task_created' ? 'New Task Created' : 
             data.type === 'task_completed' ? 'Task Completed' : 'Task Updated',
      description: `${data.updatedBy.name} ${
        data.type === 'task_created' ? 'created' :
        data.type === 'task_completed' ? 'completed' : 'updated'
      } "${data.task?.title || 'a task'}"`,
      timestamp: new Date().toISOString(),
      user: data.updatedBy,
      data: data,
      projectId
    };
    
    setActivities(prev => [activity, ...prev.slice(0, 49)]);
  }, [projectId]);

  const handleMilestoneActivity = useCallback((data: any) => {
    const activity: ActivityItem = {
      id: `milestone_${data.milestoneId}_${Date.now()}`,
      type: data.type || 'milestone_updated',
      title: data.type === 'milestone_created' ? 'New Milestone Created' : 'Milestone Updated',
      description: `${data.updatedBy.name} ${
        data.type === 'milestone_created' ? 'created' : 'updated'
      } milestone "${data.milestone?.title || 'a milestone'}"`,
      timestamp: new Date().toISOString(),
      user: data.updatedBy,
      data: data,
      projectId
    };
    
    setActivities(prev => [activity, ...prev.slice(0, 49)]);
  }, [projectId]);

  const handleMessageActivity = useCallback((data: any) => {
    const activity: ActivityItem = {
      id: `message_${data.messageId}_${Date.now()}`,
      type: 'message_sent',
      title: 'New Message',
      description: `${data.sender.name} sent a message: "${
        data.content.length > 50 ? data.content.substring(0, 50) + '...' : data.content
      }"`,
      timestamp: new Date().toISOString(),
      user: data.sender,
      data: data,
      projectId
    };
    
    setActivities(prev => [activity, ...prev.slice(0, 49)]);
  }, [projectId]);

  const handleUserActivity = useCallback((data: any) => {
    const activity: ActivityItem = {
      id: `user_${data.userId}_${Date.now()}`,
      type: data.type || 'user_joined',
      title: data.type === 'user_joined' ? 'User Joined' : 'User Left',
      description: `${data.userName} ${data.type === 'user_joined' ? 'joined' : 'left'} the project`,
      timestamp: new Date().toISOString(),
      user: {
        id: data.userId,
        name: data.userName,
        email: data.userEmail || '',
        image: data.userImage
      },
      data: data,
      projectId
    };
    
    setActivities(prev => [activity, ...prev.slice(0, 49)]);
  }, [projectId]);

  const handleProjectActivity = useCallback((data: any) => {
    const activity: ActivityItem = {
      id: `project_${projectId}_${Date.now()}`,
      type: 'project_updated',
      title: 'Project Updated',
      description: `${data.updatedBy.name} updated the project settings`,
      timestamp: new Date().toISOString(),
      user: data.updatedBy,
      data: data,
      projectId
    };
    
    setActivities(prev => [activity, ...prev.slice(0, 49)]);
  }, [projectId]);

  // Join project room for real-time updates
  useEffect(() => {
    if (projectSocket.socket && projectId) {
      projectSocket.joinProject(projectId);
    }
  }, [projectSocket.socket, projectId, projectSocket.joinProject]);

  // Listen for real-time activity updates
  useEffect(() => {
    if (!projectSocket.socket) return;

    // Subscribe to events
    projectSocket.socket.on('task_created', handleTaskActivity);
    projectSocket.socket.on('task_updated', handleTaskActivity);
    projectSocket.socket.on('task_completed', handleTaskActivity);
    projectSocket.socket.on('milestone_created', handleMilestoneActivity);
    projectSocket.socket.on('milestone_updated', handleMilestoneActivity);
    projectSocket.socket.on('new_message', handleMessageActivity);
    projectSocket.socket.on('user_joined_project', handleUserActivity);
    projectSocket.socket.on('user_left_project', handleUserActivity);
    projectSocket.socket.on('project_updated', handleProjectActivity);

    return () => {
      if (projectSocket.socket) {
        projectSocket.socket.off('task_created', handleTaskActivity);
        projectSocket.socket.off('task_updated', handleTaskActivity);
        projectSocket.socket.off('task_completed', handleTaskActivity);
        projectSocket.socket.off('milestone_created', handleMilestoneActivity);
        projectSocket.socket.off('milestone_updated', handleMilestoneActivity);
        projectSocket.socket.off('new_message', handleMessageActivity);
        projectSocket.socket.off('user_joined_project', handleUserActivity);
        projectSocket.socket.off('user_left_project', handleUserActivity);
        projectSocket.socket.off('project_updated', handleProjectActivity);
      }
    };
  }, [
    projectSocket.socket, 
    handleTaskActivity, 
    handleMilestoneActivity, 
    handleMessageActivity, 
    handleUserActivity, 
    handleProjectActivity
  ]);

  // Load initial activity on mount
  useEffect(() => {
    const loadActivity = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/projects/${projectId}/activity`);
        if (response.ok) {
          const data = await response.json();
          setActivities(data.activities || []);
        }
      } catch (error) {
        console.error('Error loading project activity:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (projectId) {
      loadActivity();
    }
  }, [projectId]);

  // Get activity icon and color
  const getActivityInfo = (type: string) => {
    switch (type) {
      case 'task_created':
      case 'task_updated':
        return { icon: CheckCircle, color: 'text-blue-400', bg: 'bg-blue-400/10' };
      case 'task_completed':
        return { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-400/10' };
      case 'milestone_created':
      case 'milestone_updated':
        return { icon: Calendar, color: 'text-purple-400', bg: 'bg-purple-400/10' };
      case 'message_sent':
        return { icon: MessageSquare, color: 'text-cyan-400', bg: 'bg-cyan-400/10' };
      case 'user_joined':
        return { icon: Users, color: 'text-green-400', bg: 'bg-green-400/10' };
      case 'user_left':
        return { icon: Users, color: 'text-red-400', bg: 'bg-red-400/10' };
      case 'project_updated':
        return { icon: Settings, color: 'text-orange-400', bg: 'bg-orange-400/10' };
      case 'file_uploaded':
        return { icon: FileText, color: 'text-indigo-400', bg: 'bg-indigo-400/10' };
      default:
        return { icon: Activity, color: 'text-gray-400', bg: 'bg-gray-400/10' };
    }
  };

  // Format timestamp
  const formatActivityTime = (timestamp: string) => {
    try {
      const activityTime = new Date(timestamp);
      const now = new Date();
      const diff = now.getTime() - activityTime.getTime();
      
      if (diff < 60000) { // Less than 1 minute
        return 'Just now';
      } else if (diff < 3600000) { // Less than 1 hour
        return formatDistanceToNow(activityTime, { addSuffix: true });
      } else if (diff < 86400000) { // Less than 1 day
        return format(activityTime, 'HH:mm');
      } else {
        return format(activityTime, 'MMM d, HH:mm');
      }
    } catch {
      return 'Unknown';
    }
  };

  // Clear all activities
  const clearActivities = () => {
    setActivities([]);
  };

  return (
    <Card className={`zyphex-card ${className}`}>
      {showTitle && (
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 zyphex-heading">
              <Activity className="h-5 w-5" />
              Project Activity
              {activities.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {activities.length}
                </Badge>
              )}
            </CardTitle>
            
            {activities.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearActivities}
                className="text-xs text-red-400 hover:text-red-300"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </CardHeader>
      )}

      <CardContent className="p-0">
        <ScrollArea className={maxHeight}>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8 px-4">
              <Activity className="h-8 w-8 mx-auto zyphex-subheading mb-2" />
              <p className="text-sm zyphex-subheading">No recent activity</p>
              <p className="text-xs zyphex-subheading">Activity will appear here as team members work on the project</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700">
              {activities.map((activity, index) => {
                const activityInfo = getActivityInfo(activity.type);
                const ActivityIcon = activityInfo.icon;
                
                return (
                  <div
                    key={activity.id}
                    className="p-4 hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {/* User Avatar */}
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage 
                          src={activity.user.image} 
                          alt={activity.user.name} 
                        />
                        <AvatarFallback className="bg-slate-700 text-xs">
                          {activity.user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      {/* Activity Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {/* Activity Icon */}
                          <div className={`p-1 rounded-full ${activityInfo.bg} flex-shrink-0`}>
                            <ActivityIcon className={`h-3 w-3 ${activityInfo.color}`} />
                          </div>
                          
                          <h4 className="text-sm font-medium zyphex-text">
                            {activity.title}
                          </h4>
                          
                          <span className="text-xs zyphex-subheading">
                            {formatActivityTime(activity.timestamp)}
                          </span>
                        </div>
                        
                        <p className="text-sm zyphex-subheading">
                          {activity.description}
                        </p>
                        
                        {/* Additional data display for certain activity types */}
                        {activity.type === 'task_updated' && activity.data?.changes && (
                          <div className="mt-2 text-xs zyphex-subheading">
                            <div className="flex flex-wrap gap-1">
                              {Object.keys(activity.data.changes).map(field => (
                                <Badge 
                                  key={field} 
                                  variant="outline" 
                                  className="text-xs"
                                >
                                  {field}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
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
  );
}