/**
 * CMS Cache Management Component
 * Displays cache statistics and provides cache invalidation controls
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, RefreshCw, Database, Activity, AlertCircle } from 'lucide-react';

interface CacheStats {
  connected: boolean;
  keysCount: number;
  memoryUsage: string;
  hitRate: number;
}

export default function CacheManager() {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [invalidating, setInvalidating] = useState(false);
  const [selectedScope, setSelectedScope] = useState<string>('all');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch cache statistics
  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/cms/cache');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      } else {
        setMessage({ type: 'error', text: 'Failed to load cache statistics' });
      }
    } catch (error) {
      console.error('Failed to fetch cache stats:', error);
      setMessage({ type: 'error', text: 'Failed to load cache statistics' });
    } finally {
      setLoading(false);
    }
  };

  // Invalidate cache
  const handleInvalidate = async () => {
    try {
      setInvalidating(true);
      setMessage(null);

      const response = await fetch('/api/cms/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope: selectedScope }),
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        // Refresh stats after invalidation
        await fetchStats();
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to invalidate cache' });
      }
    } catch (error) {
      console.error('Failed to invalidate cache:', error);
      setMessage({ type: 'error', text: 'Failed to invalidate cache' });
    } finally {
      setInvalidating(false);
    }
  };

  // Load stats on mount
  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Cache Statistics */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Cache Statistics
              </CardTitle>
              <CardDescription>
                Real-time Redis cache performance metrics
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchStats}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading && !stats ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : stats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Connection Status */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  Connection Status
                </div>
                <Badge variant={stats.connected ? 'default' : 'destructive'}>
                  {stats.connected ? 'Connected' : 'Disconnected'}
                </Badge>
              </div>

              {/* Total Keys */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  Total Cache Keys
                </div>
                <div className="text-2xl font-bold">
                  {stats.keysCount.toLocaleString()}
                </div>
              </div>

              {/* Memory Usage */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  Memory Usage
                </div>
                <div className="text-2xl font-bold">
                  {stats.memoryUsage}
                </div>
              </div>

              {/* Hit Rate */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Cache Hit Rate
                </div>
                <div className="text-2xl font-bold">
                  {stats.hitRate.toFixed(1)}%
                </div>
              </div>
            </div>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to load cache statistics
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Cache Invalidation */}
      <Card>
        <CardHeader>
          <CardTitle>Cache Invalidation</CardTitle>
          <CardDescription>
            Clear cached data to force fresh data retrieval
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <Alert variant={message.type === 'success' ? 'default' : 'destructive'}>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">
                Cache Scope
              </label>
              <Select value={selectedScope} onValueChange={setSelectedScope}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All CMS Cache</SelectItem>
                  <SelectItem value="pages">Pages Only</SelectItem>
                  <SelectItem value="templates">Templates Only</SelectItem>
                  <SelectItem value="media">Media Only</SelectItem>
                  <SelectItem value="search">Search Results Only</SelectItem>
                  <SelectItem value="sections">Sections Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleInvalidate}
              disabled={invalidating || !stats?.connected}
              variant="destructive"
            >
              {invalidating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Invalidating...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Invalidate Cache
                </>
              )}
            </Button>
          </div>

          <div className="rounded-lg bg-muted p-4 space-y-2">
            <div className="text-sm font-medium">ℹ️ Cache Invalidation Guide</div>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li><strong>All CMS Cache:</strong> Clears all CMS-related cached data</li>
              <li><strong>Pages Only:</strong> Clears page content and lists</li>
              <li><strong>Templates Only:</strong> Clears template definitions</li>
              <li><strong>Media Only:</strong> Clears media library cache</li>
              <li><strong>Search Results:</strong> Clears search query cache</li>
              <li><strong>Sections Only:</strong> Clears section content cache</li>
            </ul>
            <div className="text-sm text-muted-foreground mt-2">
              💡 <strong>Note:</strong> Cache is automatically invalidated when content is modified.
              Manual invalidation is only needed for troubleshooting or forcing fresh data.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
