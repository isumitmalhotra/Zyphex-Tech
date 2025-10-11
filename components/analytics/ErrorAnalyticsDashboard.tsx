'use client';

// Admin Error Analytics Dashboard
// Real-time error monitoring, trend analysis, and system health overview

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  Activity, 
  Users, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Bell,
  Settings,
  Download,
  RefreshCw,
  Eye,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { ErrorMetric, ErrorTrend, PerformanceCorrelation } from '@/lib/analytics/error-analytics';
import { NotificationHistory, SystemStatusUpdate } from '@/lib/analytics/notification-engine';

interface DashboardData {
  realTime: {
    activeErrors: number;
    errorsLastHour: number;
    avgResolutionTime: number;
    criticalErrors: number;
  };
  trends: {
    hourly: ErrorTrend[];
    daily: ErrorTrend[];
  };
  topIssues: Array<{
    id: string;
    errorType: string;
    route: string;
    count: number;
    severity: string;
    totalImpactedUsers: number;
    avgResolutionTime: number;
  }>;
  performanceImpact: PerformanceCorrelation;
  userImpact: {
    uniqueUsersAffected: number;
    totalSessionsAffected: number;
    averageErrorsPerUser: number;
    criticalErrorsAffectingUsers: number;
  };
}

interface ErrorAnalyticsDashboardProps {
  className?: string;
}

export function ErrorAnalyticsDashboard({ className }: ErrorAnalyticsDashboardProps) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [notifications, setNotifications] = useState<NotificationHistory[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatusUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'hour' | 'day' | 'week'>('day');

  // Simulate data loading (replace with actual API calls)
  useEffect(() => {
    loadDashboardData();
    
    if (autoRefresh) {
      const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    
    // Simulate API calls (replace with actual implementations)
    try {
      // Mock data - replace with actual API calls
      const mockData: DashboardData = {
        realTime: {
          activeErrors: 3,
          errorsLastHour: 12,
          avgResolutionTime: 8.5 * 60 * 1000, // 8.5 minutes in milliseconds
          criticalErrors: 1,
        },
        trends: {
          hourly: generateMockTrends('hour'),
          daily: generateMockTrends('day'),
        },
        topIssues: [
          {
            id: 'auth-timeout',
            errorType: 'AuthenticationTimeout',
            route: '/api/auth/login',
            count: 8,
            severity: 'high',
            totalImpactedUsers: 15,
            avgResolutionTime: 5 * 60 * 1000,
          },
          {
            id: 'db-connection',
            errorType: 'DatabaseConnectionError',
            route: '/dashboard/projects',
            count: 5,
            severity: 'critical',
            totalImpactedUsers: 25,
            avgResolutionTime: 12 * 60 * 1000,
          },
        ],
        performanceImpact: {
          errorCount: 25,
          avgResponseTime: 450,
          throughputImpact: 15.5,
          userExperienceScore: 7.2,
          systemHealthScore: 8.1,
        },
        userImpact: {
          uniqueUsersAffected: 18,
          totalSessionsAffected: 32,
          averageErrorsPerUser: 1.4,
          criticalErrorsAffectingUsers: 3,
        },
      };

      setDashboardData(mockData);
      setNotifications(generateMockNotifications());
      setSystemStatus(generateMockSystemStatus());
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'partial_outage': return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'major_outage': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Loading dashboard data...</span>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
          <h3 className="text-lg font-semibold">Failed to Load Dashboard</h3>
          <p className="text-gray-600 mb-4">Unable to fetch error analytics data</p>
          <Button onClick={loadDashboardData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Error Analytics Dashboard</h1>
          <p className="text-gray-600">
            Real-time error monitoring and performance insights
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-pulse' : ''}`} />
            {autoRefresh ? 'Auto-refresh On' : 'Auto-refresh Off'}
          </Button>
          <Button variant="outline" size="sm" onClick={loadDashboardData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Errors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {dashboardData.realTime.activeErrors}
            </div>
            <p className="text-xs text-gray-600">
              {dashboardData.realTime.errorsLastHour} in the last hour
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(dashboardData.realTime.avgResolutionTime)}
            </div>
            <p className="text-xs text-gray-600">
              Target: &lt;5 minutes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users Affected</CardTitle>
            <Users className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.userImpact.uniqueUsersAffected}
            </div>
            <p className="text-xs text-gray-600">
              {dashboardData.userImpact.totalSessionsAffected} sessions impacted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.performanceImpact.systemHealthScore.toFixed(1)}/10
            </div>
            <Progress 
              value={dashboardData.performanceImpact.systemHealthScore * 10} 
              className="mt-2" 
            />
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="status">System Status</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Issues */}
            <Card>
              <CardHeader>
                <CardTitle>Top Issues</CardTitle>
                <CardDescription>
                  Most frequent errors requiring attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.topIssues.map((issue) => (
                    <div
                      key={issue.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant="outline"
                            className={getSeverityColor(issue.severity)}
                          >
                            {issue.severity}
                          </Badge>
                          <span className="font-medium">{issue.errorType}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {issue.route} • {issue.count} occurrences
                        </p>
                        <p className="text-xs text-gray-500">
                          {issue.totalImpactedUsers} users affected • 
                          Avg resolution: {formatDuration(issue.avgResolutionTime)}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Performance Impact */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Impact</CardTitle>
                <CardDescription>
                  How errors are affecting system performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Response Time</span>
                    <span className="text-sm">
                      {dashboardData.performanceImpact.avgResponseTime}ms
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(100, (dashboardData.performanceImpact.avgResponseTime / 1000) * 100)} 
                  />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Throughput Impact</span>
                    <span className="text-sm text-red-600">
                      -{dashboardData.performanceImpact.throughputImpact.toFixed(1)}%
                    </span>
                  </div>
                  <Progress 
                    value={dashboardData.performanceImpact.throughputImpact} 
                    className="bg-red-100"
                  />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">User Experience Score</span>
                    <span className="text-sm">
                      {dashboardData.performanceImpact.userExperienceScore.toFixed(1)}/10
                    </span>
                  </div>
                  <Progress 
                    value={dashboardData.performanceImpact.userExperienceScore * 10} 
                    className="bg-green-100"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Error Trends</CardTitle>
                  <CardDescription>
                    Historical error patterns and trends
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant={selectedTimeframe === 'hour' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTimeframe('hour')}
                  >
                    Hourly
                  </Button>
                  <Button
                    variant={selectedTimeframe === 'day' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTimeframe('day')}
                  >
                    Daily
                  </Button>
                  <Button
                    variant={selectedTimeframe === 'week' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTimeframe('week')}
                  >
                    Weekly
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center border rounded-lg bg-gray-50">
                <div className="text-center">
                  <TrendingUp className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-600">Chart visualization would go here</p>
                  <p className="text-sm text-gray-500">
                    Integration with charting library (Chart.js, Recharts, etc.)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Notifications</CardTitle>
                  <CardDescription>
                    Client and admin notifications sent
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Rules
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <Bell className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="font-medium">{notification.content.subject}</p>
                        <p className="text-sm text-gray-600">
                          {notification.type} • {notification.method} • 
                          {notification.timestamp.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant={notification.status === 'sent' ? 'default' : 'destructive'}
                    >
                      {notification.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Error-Performance Correlation</CardTitle>
                <CardDescription>
                  How errors impact system performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-6 border rounded-lg bg-gray-50">
                    <Activity className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-600">Performance charts would go here</p>
                    <p className="text-sm text-gray-500">
                      CPU, Memory, Response Time correlations
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resource Utilization</CardTitle>
                <CardDescription>
                  System resource usage during error events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-6 border rounded-lg bg-gray-50">
                    <TrendingDown className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-600">Resource utilization charts</p>
                    <p className="text-sm text-gray-500">
                      Memory, CPU, Network usage trends
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* System Status Tab */}
        <TabsContent value="status" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Status History</CardTitle>
              <CardDescription>
                Real-time system status updates and incidents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {systemStatus.map((status) => (
                  <div
                    key={status.id}
                    className="flex items-center space-x-3 p-3 border rounded-lg"
                  >
                    {getStatusIcon(status.status)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{status.component}</span>
                        <Badge variant="outline">
                          {status.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{status.description}</p>
                      <p className="text-xs text-gray-500">
                        {status.timestamp.toLocaleString()}
                        {status.estimatedResolution && (
                          <span> • ETA: {status.estimatedResolution.toLocaleString()}</span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Mock data generators (replace with actual API calls)
function generateMockTrends(timeframe: 'hour' | 'day'): ErrorTrend[] {
  const trends: ErrorTrend[] = [];
  const now = new Date();
  const periods = timeframe === 'hour' ? 24 : 7;
  
  for (let i = 0; i < periods; i++) {
    const timestamp = new Date(now);
    if (timeframe === 'hour') {
      timestamp.setHours(timestamp.getHours() - i);
    } else {
      timestamp.setDate(timestamp.getDate() - i);
    }
    
    trends.push({
      timeframe,
      period: timestamp.toISOString().substring(0, timeframe === 'hour' ? 13 : 10),
      totalErrors: Math.floor(Math.random() * 20) + 1,
      errorsByType: {
        'AuthenticationError': Math.floor(Math.random() * 5),
        'DatabaseError': Math.floor(Math.random() * 3),
        'ValidationError': Math.floor(Math.random() * 8),
      },
      errorsByRoute: {
        '/api/auth': Math.floor(Math.random() * 4),
        '/dashboard': Math.floor(Math.random() * 6),
        '/admin': Math.floor(Math.random() * 2),
      },
      errorsBySeverity: {
        'low': Math.floor(Math.random() * 10),
        'medium': Math.floor(Math.random() * 5),
        'high': Math.floor(Math.random() * 3),
        'critical': Math.floor(Math.random() * 1),
      },
      avgResolutionTime: Math.random() * 600000, // 0-10 minutes
      totalImpactedUsers: Math.floor(Math.random() * 50),
      performanceCorrelation: {
        avgLoadTime: Math.random() * 1000 + 200,
        avgMemoryUsage: Math.random() * 100 + 50,
        avgCpuUsage: Math.random() * 80 + 10,
      },
    });
  }
  
  return trends;
}

function generateMockNotifications(): NotificationHistory[] {
  const notifications: NotificationHistory[] = [];
  const types: NotificationHistory['type'][] = ['error_occurred', 'error_resolved', 'maintenance_scheduled'];
  const methods: NotificationHistory['method'][] = ['email', 'sms', 'inApp'];
  const statuses: NotificationHistory['status'][] = ['sent', 'pending', 'failed'];
  
  for (let i = 0; i < 10; i++) {
    const timestamp = new Date();
    timestamp.setMinutes(timestamp.getMinutes() - (i * 15));
    
    notifications.push({
      id: `notif_${i}`,
      timestamp,
      clientId: `client_${i % 3}`,
      type: types[i % types.length],
      method: methods[i % methods.length],
      status: statuses[i % statuses.length],
      content: {
        subject: `Notification ${i + 1}`,
        body: `This is a mock notification body for notification ${i + 1}`,
      },
      metadata: {
        retryCount: 0,
      },
    });
  }
  
  return notifications;
}

function generateMockSystemStatus(): SystemStatusUpdate[] {
  const statuses: SystemStatusUpdate[] = [];
  const statusTypes: SystemStatusUpdate['status'][] = ['operational', 'degraded', 'partial_outage'];
  const components = ['Web Application', 'API Services', 'Database', 'Admin Panel'];
  
  for (let i = 0; i < 5; i++) {
    const timestamp = new Date();
    timestamp.setHours(timestamp.getHours() - i);
    
    statuses.push({
      id: `status_${i}`,
      timestamp,
      status: statusTypes[i % statusTypes.length],
      component: components[i % components.length],
      description: `System status update ${i + 1}`,
      affectedServices: ['web', 'api'],
    });
  }
  
  return statuses;
}