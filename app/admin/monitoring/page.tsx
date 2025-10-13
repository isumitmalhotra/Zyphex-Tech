/**
 * Admin Monitoring Dashboard
 * Real-time system health and metrics visualization
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, AlertTriangle, CheckCircle2, XCircle, Clock, Activity } from 'lucide-react';
import type { HealthReport, HealthStatus } from '@/lib/health/types';

export default function MonitoringDashboard() {
  const [health, setHealth] = useState<HealthReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/health');
      const data = await response.json();
      setHealth(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch health data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();

    if (autoRefresh) {
      const interval = setInterval(fetchHealth, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getStatusColor = (status: HealthStatus) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-50';
      case 'unhealthy':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: HealthStatus) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'unhealthy':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);

    return parts.join(' ') || '< 1m';
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
  };

  if (loading && !health) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Loading system health...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Monitoring</h1>
          <p className="text-gray-600 mt-1">Real-time health and performance metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={autoRefresh ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setAutoRefresh(!autoRefresh)}>
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Badge>
          <Button onClick={fetchHealth} disabled={loading} size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      {health && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon(health.status)}
                <div>
                  <CardTitle className="text-2xl">
                    System Status: <span className={getStatusColor(health.status)}>{health.status.toUpperCase()}</span>
                  </CardTitle>
                  <CardDescription className="mt-1">
                    <Clock className="h-4 w-4 inline mr-1" />
                    Last updated: {lastUpdate.toLocaleString()}
                  </CardDescription>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Uptime</p>
                <p className="text-2xl font-bold text-gray-900">{formatUptime(health.uptime)}</p>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      <Tabs defaultValue="services" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="system">System Resources</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-4">
          {health && Object.entries(health.services).map(([serviceName, serviceHealth]) => (
            <Card key={serviceName}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(serviceHealth.status)}
                    <div>
                      <CardTitle className="capitalize">{serviceName.replace('_', ' ')}</CardTitle>
                      <CardDescription>{serviceHealth.message}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(serviceHealth.status)}>
                      {serviceHealth.status.toUpperCase()}
                    </Badge>
                    {serviceHealth.responseTime !== undefined && (
                      <Badge variant="outline">
                        {serviceHealth.responseTime}ms
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              {serviceHealth.details && (
                <CardContent>
                  <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-auto max-h-48">
                    {JSON.stringify(serviceHealth.details, null, 2)}
                  </pre>
                </CardContent>
              )}
            </Card>
          ))}
        </TabsContent>

        {/* System Resources Tab */}
        <TabsContent value="system" className="space-y-4">
          {health?.system && (
            <>
              {/* Memory */}
              <Card>
                <CardHeader>
                  <CardTitle>Memory Usage</CardTitle>
                  <CardDescription>Current system and process memory utilization</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">System Memory</span>
                        <span className="text-sm text-gray-600">
                          {health.system.memory.percentUsed.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all ${
                            health.system.memory.percentUsed > 90
                              ? 'bg-red-600'
                              : health.system.memory.percentUsed > 80
                              ? 'bg-yellow-600'
                              : 'bg-green-600'
                          }`}
                          style={{ width: `${health.system.memory.percentUsed}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-2 text-xs text-gray-600">
                        <span>Used: {formatBytes(health.system.memory.used)}</span>
                        <span>Total: {formatBytes(health.system.memory.total)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* CPU */}
              <Card>
                <CardHeader>
                  <CardTitle>CPU Usage</CardTitle>
                  <CardDescription>Current CPU utilization and load averages</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">CPU Usage</span>
                        <span className="text-sm text-gray-600">
                          {health.system.cpu.usage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all ${
                            health.system.cpu.usage > 90
                              ? 'bg-red-600'
                              : health.system.cpu.usage > 70
                              ? 'bg-yellow-600'
                              : 'bg-green-600'
                          }`}
                          style={{ width: `${health.system.cpu.usage}%` }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                      <div>
                        <p className="text-xs text-gray-600">1min avg</p>
                        <p className="text-lg font-semibold">{health.system.cpu.loadAverage[0].toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">5min avg</p>
                        <p className="text-lg font-semibold">{health.system.cpu.loadAverage[1].toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">15min avg</p>
                        <p className="text-lg font-semibold">{health.system.cpu.loadAverage[2].toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          {health && (
            <Card>
              <CardHeader>
                <CardTitle>Full Health Report</CardTitle>
                <CardDescription>Complete system health data in JSON format</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-auto max-h-96">
                  {JSON.stringify(health, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
