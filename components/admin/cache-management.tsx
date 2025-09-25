'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { AlertTriangle, CheckCircle, Database, HardDrive, RefreshCw, Trash2, Zap } from 'lucide-react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from '@/hooks/use-toast'

interface CacheStatus {
  status: {
    primary: { type: 'redis' | 'memory'; healthy: boolean }
    fallback: { type: 'memory'; healthy: boolean }
  }
  memoryStats: {
    keys: number
    hits: number
    misses: number
    ksize: number
    vsize: number
  }
  healthMetrics: {
    redisConnected: boolean
    memoryFallbackHealthy: boolean
    totalKeys: number
    hitRate: number
    memoryUsage: {
      keys: number
      values: number
    }
  }
  timestamp: string
}

async function fetchCacheStatus(): Promise<CacheStatus> {
  const response = await fetch('/api/admin/cache')
  if (!response.ok) {
    throw new Error('Failed to fetch cache status')
  }
  return response.json()
}

async function clearCache(action: string, pattern?: string) {
  const response = await fetch('/api/admin/cache', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, pattern }),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to clear cache')
  }
  
  return response.json()
}

export function CacheManagement() {
  const { 
    data: cacheStatus, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['cache-status'],
    queryFn: fetchCacheStatus,
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  const clearCacheMutation = useMutation({
    mutationFn: ({ action, pattern }: { action: string; pattern?: string }) =>
      clearCache(action, pattern),
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: data.message,
      })
      // Refetch status after clearing cache
      refetch()
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const handleClearCache = (action: string, pattern?: string) => {
    clearCacheMutation.mutate({ action, pattern })
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cache Management</CardTitle>
          <CardDescription>Loading cache status...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cache Management</CardTitle>
          <CardDescription>Error loading cache status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-red-500 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span>Failed to load cache status</span>
          </div>
          <Button 
            onClick={() => refetch()} 
            variant="outline" 
            className="mt-2"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!cacheStatus) {
    return null
  }

  const { status, memoryStats, healthMetrics } = cacheStatus

  return (
    <div className="space-y-6">
      {/* Cache Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Cache Status Overview
          </CardTitle>
          <CardDescription>
            Real-time cache health and performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Primary Cache Status */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Primary Cache</span>
                <Badge 
                  variant={status.primary.healthy ? 'default' : 'destructive'}
                  className="flex items-center gap-1"
                >
                  {status.primary.healthy ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    <AlertTriangle className="h-3 w-3" />
                  )}
                  {status.primary.type.toUpperCase()}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {status.primary.type === 'redis' ? 'Redis Server' : 'Memory Fallback'}
              </div>
            </div>

            {/* Hit Rate */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Hit Rate</span>
                <span className="text-sm">
                  {(healthMetrics.hitRate * 100).toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={healthMetrics.hitRate * 100} 
                className="h-2"
              />
            </div>

            {/* Total Keys */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Keys</span>
                <span className="text-sm">{healthMetrics.totalKeys}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Cached items
              </div>
            </div>
          </div>

          <Separator />

          {/* Memory Usage */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              Memory Usage
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Keys Size:</span>
                <span className="ml-2">{(healthMetrics.memoryUsage.keys / 1024).toFixed(2)} KB</span>
              </div>
              <div>
                <span className="text-muted-foreground">Values Size:</span>
                <span className="ml-2">{(healthMetrics.memoryUsage.values / 1024).toFixed(2)} KB</span>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Statistics</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Hits:</span>
                <span className="ml-2 text-green-500">{memoryStats.hits}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Misses:</span>
                <span className="ml-2 text-red-500">{memoryStats.misses}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Total Requests:</span>
                <span className="ml-2">{memoryStats.hits + memoryStats.misses}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cache Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Cache Actions
          </CardTitle>
          <CardDescription>
            Manage and clear different types of cached data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Clear All Cache */}
            <Button
              onClick={() => handleClearCache('clear-all')}
              disabled={clearCacheMutation.isPending}
              variant="destructive"
              className="w-full"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All Cache
            </Button>

            {/* Clear Content Types Cache */}
            <Button
              onClick={() => handleClearCache('clear-content-types')}
              disabled={clearCacheMutation.isPending}
              variant="outline"
              className="w-full"
            >
              Clear Content Types
            </Button>

            {/* Clear Dynamic Content Cache */}
            <Button
              onClick={() => handleClearCache('clear-dynamic-content')}
              disabled={clearCacheMutation.isPending}
              variant="outline"
              className="w-full"
            >
              Clear Dynamic Content
            </Button>

            {/* Refresh Status */}
            <Button
              onClick={() => refetch()}
              disabled={isLoading}
              variant="secondary"
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Status
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            Last updated: {new Date(cacheStatus.timestamp).toLocaleString()}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}