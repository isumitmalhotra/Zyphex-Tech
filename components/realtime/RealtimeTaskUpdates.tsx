"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSocket } from '@/hooks/useSocket';
import { useSession } from 'next-auth/react';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  User, 
  Calendar,
  RefreshCw,
  TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

interface TaskUpdate {
  taskId: string;
  projectId: string;
  updates: any;
  action: string;
  updatedBy: {
    id: string;
    name: string;
    email: string;
  };
  timestamp: string;
}

interface RealtimeTaskUpdatesProps {
  projectId: string;
  onTaskUpdate?: (update: TaskUpdate) => void;
  className?: string;
}

export function RealtimeTaskUpdates({ projectId, onTaskUpdate, className }: RealtimeTaskUpdatesProps) {
  const { data: session } = useSession();
  const [recentUpdates, setRecentUpdates] = useState<TaskUpdate[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  
  const socket = useSocket();

  useEffect(() => {
    setIsConnected(socket.isConnected);
  }, [socket.isConnected]);

  // Join project room on mount
  useEffect(() => {
    if (socket.isConnected && projectId) {
      socket.joinProject(projectId);
    }
  }, [socket.isConnected, projectId, socket]);

  // Listen for task updates
  useEffect(() => {
    if (!socket.socket) return;

    const handleTaskUpdate = (update: TaskUpdate) => {
      if (update.projectId === projectId) {
        // Add to recent updates
        setRecentUpdates(prev => [update, ...prev.slice(0, 9)]); // Keep last 10 updates
        
        // Show toast notification if not from current user
        if (update.updatedBy.id !== session?.user?.id) {
          toast({
            title: "Task Updated",
            description: `${update.updatedBy.name} updated a task`,
          });
        }

        // Call callback if provided
        onTaskUpdate?.(update);
      }
    };

    socket.on('task_updated', handleTaskUpdate);

    return () => {
      socket.off('task_updated', handleTaskUpdate);
    };
  }, [socket.socket, projectId, session?.user?.id, onTaskUpdate, socket]);

  // Get status icon and color
  const getStatusInfo = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'done':
        return { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-400/10' };
      case 'in_progress':
      case 'in-progress':
        return { icon: RefreshCw, color: 'text-blue-400', bg: 'bg-blue-400/10' };
      case 'todo':
      case 'pending':
        return { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-400/10' };
      default:
        return { icon: AlertCircle, color: 'text-gray-400', bg: 'bg-gray-400/10' };
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'text-red-400 bg-red-400/10';
      case 'medium':
        return 'text-yellow-400 bg-yellow-400/10';
      case 'low':
        return 'text-green-400 bg-green-400/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  // Format timestamp
  const formatUpdateTime = (timestamp: string) => {
    try {
      const updateTime = new Date(timestamp);
      const now = new Date();
      const diff = now.getTime() - updateTime.getTime();
      
      if (diff < 60000) { // Less than 1 minute
        return 'Just now';
      } else if (diff < 3600000) { // Less than 1 hour
        return `${Math.floor(diff / 60000)}m ago`;
      } else if (diff < 86400000) { // Less than 1 day
        return `${Math.floor(diff / 3600000)}h ago`;
      } else {
        return format(updateTime, 'MMM d, HH:mm');
      }
    } catch {
      return 'Unknown';
    }
  };

  // Get update description
  const getUpdateDescription = (update: TaskUpdate) => {
    const { updates, action } = update;
    
    if (action === 'created') {
      return 'Created new task';
    }
    
    if (action === 'deleted') {
      return 'Deleted task';
    }
    
    const changes = [];
    
    if (updates.status) {
      changes.push(`status to ${updates.status}`);
    }
    
    if (updates.assigneeId !== undefined) {
      changes.push(updates.assigneeId ? 'assigned task' : 'unassigned task');
    }
    
    if (updates.priority) {
      changes.push(`priority to ${updates.priority}`);
    }
    
    if (updates.dueDate) {
      changes.push('due date');
    }
    
    if (updates.title) {
      changes.push('title');
    }
    
    if (updates.description) {
      changes.push('description');
    }
    
    if (changes.length === 0) {
      return 'Updated task';
    }
    
    return `Updated ${changes.join(', ')}`;
  };

  return (
    <Card className={`zyphex-card ${className || ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 zyphex-heading">
            <TrendingUp className="h-5 w-5" />
            Real-time Updates
          </CardTitle>
          
          <Badge variant={isConnected ? "default" : "destructive"} className="text-xs">
            {isConnected ? "Live" : "Disconnected"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {recentUpdates.length === 0 ? (
          <div className="text-center py-6">
            <TrendingUp className="h-8 w-8 mx-auto zyphex-subheading mb-2" />
            <p className="text-sm zyphex-subheading">No recent updates</p>
            <p className="text-xs zyphex-subheading">Task changes will appear here in real-time</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {recentUpdates.map((update, index) => {
              const statusInfo = getStatusInfo(update.updates.status || '');
              const StatusIcon = statusInfo.icon;
              
              return (
                <div 
                  key={`${update.taskId}-${update.timestamp}-${index}`}
                  className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700"
                >
                  {/* Status icon */}
                  <div className={`p-1.5 rounded-full ${statusInfo.bg}`}>
                    <StatusIcon className={`h-3 w-3 ${statusInfo.color}`} />
                  </div>
                  
                  {/* Update content */}
                  <div className="flex-1 min-w-0">
                    {/* User and action */}
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-3 w-3 zyphex-subheading" />
                      <span className="text-sm font-medium zyphex-text">
                        {update.updatedBy.name}
                      </span>
                      <span className="text-xs zyphex-subheading">
                        {getUpdateDescription(update)}
                      </span>
                    </div>
                    
                    {/* Update details */}
                    <div className="space-y-1">
                      {update.updates.status && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs zyphex-subheading">Status:</span>
                          <Badge variant="outline" className={statusInfo.color}>
                            {update.updates.status}
                          </Badge>
                        </div>
                      )}
                      
                      {update.updates.priority && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs zyphex-subheading">Priority:</span>
                          <Badge variant="outline" className={getPriorityColor(update.updates.priority)}>
                            {update.updates.priority}
                          </Badge>
                        </div>
                      )}
                      
                      {update.updates.dueDate && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 zyphex-subheading" />
                          <span className="text-xs zyphex-subheading">
                            Due: {format(new Date(update.updates.dueDate), 'MMM d, yyyy')}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Timestamp */}
                    <div className="text-xs zyphex-subheading mt-2">
                      {formatUpdateTime(update.timestamp)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Connection status footer */}
        {!isConnected && (
          <div className="text-center py-2 border-t border-slate-700">
            <p className="text-xs text-red-400">
              Connection lost. Updates will resume when reconnected.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}