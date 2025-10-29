/**
 * Activity Timeline Component
 * Shows chronological activity history for an entity
 */

'use client';

import React, { useState, useEffect } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import {
  Clock,
  FileText,
  Edit,
  Trash2,
  Archive,
  CheckCircle,
  XCircle,
  Copy,
  RefreshCw
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  changes: Record<string, unknown> | null;
  createdAt: string;
  user?: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

export interface ActivityTimelineProps {
  entityType: 'page' | 'section' | 'template' | 'media' | 'workflow';
  entityId: string;
  limit?: number;
  className?: string;
}

// Get icon for action
const getActionIcon = (action: string) => {
  if (action.includes('create')) return FileText;
  if (action.includes('edit') || action.includes('update')) return Edit;
  if (action.includes('delete')) return Trash2;
  if (action.includes('archive')) return Archive;
  if (action.includes('publish')) return CheckCircle;
  if (action.includes('unpublish')) return XCircle;
  if (action.includes('duplicate')) return Copy;
  return Clock;
};

// Get icon color for action
const getActionColor = (action: string) => {
  if (action.includes('create') || action.includes('publish')) return 'text-green-600 dark:text-green-400';
  if (action.includes('delete') || action.includes('archive')) return 'text-red-600 dark:text-red-400';
  if (action.includes('edit') || action.includes('update')) return 'text-blue-600 dark:text-blue-400';
  return 'text-gray-600 dark:text-gray-400';
};

/**
 * Activity Timeline Component
 * Displays entity activity history in chronological order
 * 
 * @example
 * ```tsx
 * <ActivityTimeline
 *   entityType="page"
 *   entityId="page-123"
 *   limit={20}
 * />
 * ```
 */
export function ActivityTimeline({
  entityType,
  entityId,
  limit = 20,
  className
}: ActivityTimelineProps) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivities = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/cms/activity-log/${entityType}/${entityId}?limit=${limit}&includeUser=true`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch activity history');
        }

        const data = await response.json();
        setActivities(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load activity');
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivities();
  }, [entityType, entityId, limit]);

  if (isLoading) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="flex items-center gap-2 text-muted-foreground">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading activity history...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn('p-6 text-center', className)}>
        <p className="text-sm text-destructive">{error}</p>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className={cn('p-6 text-center', className)}>
        <Clock className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No activity history</p>
      </Card>
    );
  }

  return (
    <Card className={cn('p-6', className)}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Activity History</h3>
          <Badge variant="secondary">{activities.length} events</Badge>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

          {/* Timeline items */}
          <div className="space-y-6">
            {activities.map((activity, index) => {
              const Icon = getActionIcon(activity.action);
              const iconColor = getActionColor(activity.action);

              return (
                <div key={activity.id} className="relative pl-10">
                  {/* Timeline dot */}
                  <div className={cn(
                    'absolute left-0 w-8 h-8 rounded-full border-2 bg-background flex items-center justify-center',
                    'border-border'
                  )}>
                    <Icon className={cn('w-4 h-4', iconColor)} />
                  </div>

                  {/* Content */}
                  <div className="space-y-2">
                    {/* Action and user */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={activity.user?.image || undefined} />
                          <AvatarFallback className="text-xs">
                            {activity.user?.name?.[0] || activity.user?.email[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium">
                              {activity.user?.name || 'Unknown'}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {activity.action.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                          {activity.changes && Object.keys(activity.changes).length > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {Object.keys(activity.changes).length} change{Object.keys(activity.changes).length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Time */}
                      <div className="text-xs text-muted-foreground text-right">
                        <div title={format(new Date(activity.createdAt), 'PPpp')}>
                          {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                        </div>
                      </div>
                    </div>

                    {/* Changes details (if available) */}
                    {activity.changes && Object.keys(activity.changes).length > 0 && (
                      <div className="pl-8 text-xs space-y-1">
                        {Object.entries(activity.changes).slice(0, 3).map(([key, value]) => (
                          <div key={key} className="text-muted-foreground">
                            <span className="font-medium">{key}:</span>{' '}
                            <span className="font-mono">
                              {typeof value === 'object' ? JSON.stringify(value).slice(0, 50) : String(value).slice(0, 50)}
                            </span>
                          </div>
                        ))}
                        {Object.keys(activity.changes).length > 3 && (
                          <div className="text-muted-foreground italic">
                            +{Object.keys(activity.changes).length - 3} more changes
                          </div>
                        )}
                      </div>
                    )}

                    {/* Separator (not for last item) */}
                    {index < activities.length - 1 && (
                      <div className="h-4" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}
