'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  X,
  BarChart3,
  Activity
} from 'lucide-react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from '@/hooks/use-toast'

interface CacheMetrics {
  hits: number
  misses: number
  totalRequests: number
  averageResponseTime: number
  errorCount: number
  hitRate: number
  missRate: number
  errorRate: number
  currentResponseTimes: number[]
  lastError?: string
  lastErrorTime?: string
}

interface PerformanceAlert {
  id: string
  type: 'high_miss_rate' | 'slow_response' | 'cache_error' | 'high_memory'
  message: string
  severity: 'low' | 'medium' | 'high'
  timestamp: string
  resolved: boolean
}

interface MetricsResponse {
  metrics: CacheMetrics
  alerts: PerformanceAlert[]
  allAlerts: PerformanceAlert[]
  timestamp: string
}

async function fetchCacheMetrics(): Promise<MetricsResponse> {
  const response = await fetch('/api/admin/cache/metrics')
  if (!response.ok) {
    throw new Error('Failed to fetch cache metrics')
  }
  return response.json()
}

async function manageAlert(action: string, alertId?: string) {
  const response = await fetch('/api/admin/cache/metrics', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, alertId }),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to manage alert')
  }
  
  return response.json()
}

function getSeverityColor(severity: string) {
  switch (severity) {
    case 'high': return 'destructive'
    case 'medium': return 'default'
    case 'low': return 'secondary'
    default: return 'default'
  }
}

function getSeverityIcon(severity: string) {
  switch (severity) {
    case 'high': return <AlertTriangle className="h-4 w-4" />
    case 'medium': return <TrendingDown className="h-4 w-4" />
    case 'low': return <Activity className="h-4 w-4" />
    default: return <Activity className="h-4 w-4" />
  }
}

export function PerformanceMonitoring() {
  const { 
    data: metricsData, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['cache-metrics'],
    queryFn: fetchCacheMetrics,
    refetchInterval: 10000, // Refetch every 10 seconds
  })

  const alertMutation = useMutation({
    mutationFn: ({ action, alertId }: { action: string; alertId?: string }) =>
      manageAlert(action, alertId),
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: data.message,
      })
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

  const handleResolveAlert = (alertId: string) => {
    alertMutation.mutate({ action: 'resolve-alert', alertId })
  }

  const handleResetMetrics = () => {
    alertMutation.mutate({ action: 'reset-metrics' })
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Monitoring</CardTitle>
          <CardDescription>Loading performance metrics...</CardDescription>
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

  if (error || !metricsData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Monitoring</CardTitle>
          <CardDescription>Error loading performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">Failed to load metrics</div>
        </CardContent>
      </Card>
    )
  }

  const { metrics, alerts } = metricsData

  return (
    <div className="space-y-6">
      {/* Performance Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Active Performance Alerts
            </CardTitle>
            <CardDescription>
              Issues that require attention
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((alert) => (
              <Alert key={alert.id} className="relative">
                <div className="flex items-start gap-3">
                  <Badge 
                    variant={getSeverityColor(alert.severity) as 'default' | 'destructive' | 'secondary'}
                    className="flex items-center gap-1 mt-1"
                  >
                    {getSeverityIcon(alert.severity)}
                    {alert.severity.toUpperCase()}
                  </Badge>
                  <div className="flex-1">
                    <AlertDescription className="font-medium">
                      {alert.message}
                    </AlertDescription>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(alert.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleResolveAlert(alert.id)}
                    disabled={alertMutation.isPending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Metrics
          </CardTitle>
          <CardDescription>
            Real-time cache performance statistics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Key Performance Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Hit Rate</span>
                <div className="flex items-center gap-1">
                  {metrics.hitRate > 0.8 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm">{(metrics.hitRate * 100).toFixed(1)}%</span>
                </div>
              </div>
              <Progress 
                value={metrics.hitRate * 100} 
                className="h-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Avg Response</span>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">{metrics.averageResponseTime.toFixed(0)}ms</span>
                </div>
              </div>
              <Progress 
                value={Math.min(metrics.averageResponseTime / 10, 100)} 
                className="h-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Requests</span>
                <span className="text-sm">{metrics.totalRequests}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {metrics.hits} hits, {metrics.misses} misses
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Error Rate</span>
                <div className="flex items-center gap-1">
                  {metrics.errorRate > 0 ? (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                  <span className="text-sm">{(metrics.errorRate * 100).toFixed(2)}%</span>
                </div>
              </div>
              <Progress 
                value={metrics.errorRate * 100} 
                className="h-2"
              />
            </div>
          </div>

          {/* Detailed Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Request Statistics</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cache Hits:</span>
                  <span className="text-green-500 font-medium">{metrics.hits}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cache Misses:</span>
                  <span className="text-red-500 font-medium">{metrics.misses}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Errors:</span>
                  <span className="text-orange-500 font-medium">{metrics.errorCount}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-medium">Response Times</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Average:</span>
                  <span className="font-medium">{metrics.averageResponseTime.toFixed(0)}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Recent Samples:</span>
                  <span className="font-medium">{metrics.currentResponseTimes.length}</span>
                </div>
                {metrics.lastErrorTime && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Error:</span>
                    <span className="text-xs text-red-500">
                      {new Date(metrics.lastErrorTime).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={handleResetMetrics}
              disabled={alertMutation.isPending}
              variant="outline"
              size="sm"
            >
              Reset Metrics
            </Button>
            <Button
              onClick={() => refetch()}
              disabled={isLoading}
              variant="secondary"
              size="sm"
            >
              Refresh
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            Last updated: {new Date(metricsData.timestamp).toLocaleString()}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}