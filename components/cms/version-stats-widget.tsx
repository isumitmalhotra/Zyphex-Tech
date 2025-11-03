/**
 * Version Statistics Widget
 * Display version statistics in a compact card format
 * 
 * Can be used standalone in dashboards or alongside version history
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  History, 
  TrendingUp, 
  CheckCircle2, 
  Clock,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface VersionStats {
  totalVersions: number;
  latestVersionNumber: number;
  publishedVersions: number;
  latestVersion: {
    versionNumber: number;
    createdAt: string;
    createdBy: string;
  } | null;
}

interface VersionStatsWidgetProps {
  pageId: string;
  variant?: 'grid' | 'compact';
}

export function VersionStatsWidget({ 
  pageId, 
  variant = 'grid' 
}: VersionStatsWidgetProps) {
  const [stats, setStats] = useState<VersionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId]);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/cms/pages/${pageId}/versions/stats`);
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch stats');
      }
    } catch (err) {
      console.error('Failed to fetch version stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load stats');
      toast({
        title: 'Error',
        description: 'Failed to load version statistics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error || !stats) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-destructive" />
          <p className="text-sm text-muted-foreground">
            {error || 'Failed to load statistics'}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'compact') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <History className="w-4 h-4" />
            Version Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total</span>
            <Badge variant="outline">{stats.totalVersions}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Latest</span>
            <Badge variant="secondary">v{stats.latestVersionNumber}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Published</span>
            <Badge variant="default">{stats.publishedVersions}</Badge>
          </div>
          {stats.latestVersion && (
            <div className="pt-2 border-t">
              <span className="text-xs text-muted-foreground">Last updated</span>
              <p className="text-sm font-medium mt-1">
                {formatDistanceToNow(new Date(stats.latestVersion.createdAt), { 
                  addSuffix: true 
                })}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <History className="w-4 h-4" />
            Total Versions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalVersions}</div>
          <p className="text-xs text-muted-foreground mt-1">
            All saved versions
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Latest Version
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">v{stats.latestVersionNumber}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Current version number
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Published
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.publishedVersions}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Published versions
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Last Updated
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm font-medium">
            {stats.latestVersion 
              ? formatDistanceToNow(new Date(stats.latestVersion.createdAt), { 
                  addSuffix: true 
                })
              : 'Never'
            }
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Most recent change
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
