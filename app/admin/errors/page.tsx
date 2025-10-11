'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Users, 
  AlertCircle,
  Check,
  X,
  Search,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';

/**
 * Error Analytics Dashboard
 * 
 * Comprehensive admin dashboard for monitoring and analyzing application errors.
 * Provides real-time insights into error patterns, trends, and system health.
 * 
 * Features:
 * - Real-time error statistics and trends
 * - Error categorization and filtering
 * - User impact analysis
 * - Recent error logs with detailed context
 * - Performance correlation metrics
 * - Automated alert management
 * - Export capabilities for reporting
 */

// Mock data types (replace with actual API types)
interface ErrorStat {
  id: string;
  label: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface ErrorLog {
  id: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  userId?: string;
  userEmail?: string;
  route: string;
  method: string;
  statusCode: number;
  resolved: boolean;
  occurrenceCount: number;
  lastOccurrence: string;
}

interface ErrorTrend {
  date: string;
  count: number;
  severity: Record<string, number>;
}

export default function ErrorAnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [errorStats, setErrorStats] = useState<ErrorStat[]>([]);
  const [recentErrors, setRecentErrors] = useState<ErrorLog[]>([]);
  const [_errorTrends, _setErrorTrends] = useState<ErrorTrend[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // Simulate data loading
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      // Simulate API calls
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock error statistics
      setErrorStats([
        {
          id: '1',
          label: 'Total Errors',
          value: 247,
          change: -12.5,
          trend: 'down',
          severity: 'medium'
        },
        {
          id: '2',
          label: 'Critical Errors',
          value: 8,
          change: 25.0,
          trend: 'up',
          severity: 'critical'
        },
        {
          id: '3',
          label: 'Error Rate',
          value: 0.8,
          change: -5.2,
          trend: 'down',
          severity: 'low'
        },
        {
          id: '4',
          label: 'Affected Users',
          value: 42,
          change: -8.7,
          trend: 'down',
          severity: 'medium'
        }
      ]);

      // Mock recent errors
      setRecentErrors([
        {
          id: 'err_1',
          message: 'Database connection timeout',
          severity: 'high',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          userId: 'user_123',
          userEmail: 'john@example.com',
          route: '/api/projects',
          method: 'GET',
          statusCode: 500,
          resolved: false,
          occurrenceCount: 15,
          lastOccurrence: new Date(Date.now() - 60000).toISOString()
        },
        {
          id: 'err_2',
          message: 'Authentication token expired',
          severity: 'medium',
          timestamp: new Date(Date.now() - 600000).toISOString(),
          userId: 'user_456',
          userEmail: 'jane@example.com',
          route: '/api/auth/verify',
          method: 'POST',
          statusCode: 401,
          resolved: true,
          occurrenceCount: 3,
          lastOccurrence: new Date(Date.now() - 300000).toISOString()
        },
        {
          id: 'err_3',
          message: 'File upload size limit exceeded',
          severity: 'low',
          timestamp: new Date(Date.now() - 900000).toISOString(),
          userId: 'user_789',
          userEmail: 'bob@example.com',
          route: '/api/upload',
          method: 'POST',
          statusCode: 413,
          resolved: true,
          occurrenceCount: 1,
          lastOccurrence: new Date(Date.now() - 900000).toISOString()
        }
      ]);

      setLoading(false);
    };

    loadData();
  }, [selectedTimeframe, selectedSeverity]);

  const getSeverityColor = (severity: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    };
    return colors[severity as keyof typeof colors] || colors.medium;
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'medium':
        return <Activity className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <Check className="h-4 w-4 text-green-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const filteredErrors = recentErrors.filter(error => {
    const matchesSearch = error.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         error.route.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         error.userEmail?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = selectedSeverity === 'all' || error.severity === selectedSeverity;
    return matchesSearch && matchesSeverity;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading error analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              Error Analytics
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Monitor and analyze application errors in real-time
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Last Hour</SelectItem>
                <SelectItem value="24h">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="errors">Error Logs</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {errorStats.map((stat) => (
              <Card key={stat.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {stat.label}
                  </CardTitle>
                  {stat.trend === 'up' ? (
                    <TrendingUp className="h-4 w-4 text-red-500" />
                  ) : stat.trend === 'down' ? (
                    <TrendingDown className="h-4 w-4 text-green-500" />
                  ) : (
                    <Activity className="h-4 w-4 text-gray-500" />
                  )}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {stat.label === 'Error Rate' ? `${stat.value}%` : stat.value.toLocaleString()}
                  </div>
                  <p className={`text-xs mt-1 ${
                    stat.change > 0 ? 'text-red-600' : stat.change < 0 ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {stat.change > 0 ? '+' : ''}{stat.change}% from last period
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
                  Critical Errors Requiring Attention
                </CardTitle>
                <CardDescription>
                  Unresolved critical and high-severity errors
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentErrors
                  .filter(error => !error.resolved && (error.severity === 'critical' || error.severity === 'high'))
                  .slice(0, 3)
                  .map((error) => (
                    <div key={error.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getSeverityIcon(error.severity)}
                        <div>
                          <p className="font-medium text-sm text-slate-900 dark:text-slate-100">
                            {error.message}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {error.route} • {error.occurrenceCount} occurrences
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        View
                      </Button>
                    </div>
                  ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-blue-500" />
                  Most Affected Users
                </CardTitle>
                <CardDescription>
                  Users experiencing the most errors
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { email: 'john@example.com', errors: 15, lastError: '5 min ago' },
                  { email: 'jane@example.com', errors: 8, lastError: '12 min ago' },
                  { email: 'bob@example.com', errors: 3, lastError: '1 hour ago' }
                ].map((user, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div>
                      <p className="font-medium text-sm text-slate-900 dark:text-slate-100">
                        {user.email}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Last error: {user.lastError}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {user.errors} errors
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Error Logs Tab */}
        <TabsContent value="errors" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search errors, routes, or users..."
                      value={searchQuery}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                  <SelectTrigger className="w-40">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Error List */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Errors ({filteredErrors.length})</CardTitle>
              <CardDescription>
                Real-time error logs with detailed context
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredErrors.map((error) => (
                  <div
                    key={error.id}
                    className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-3"
                  >
                    {/* Error Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        {getSeverityIcon(error.severity)}
                        <div className="flex-1">
                          <p className="font-medium text-slate-900 dark:text-slate-100">
                            {error.message}
                          </p>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-slate-500 dark:text-slate-400">
                            <span>{error.route}</span>
                            <span>•</span>
                            <span>{error.method}</span>
                            <span>•</span>
                            <span>Status {error.statusCode}</span>
                            {error.userEmail && (
                              <>
                                <span>•</span>
                                <span>{error.userEmail}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge className={getSeverityColor(error.severity)}>
                          {error.severity}
                        </Badge>
                        {error.resolved ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            <Check className="h-3 w-3 mr-1" />
                            Resolved
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <X className="h-3 w-3 mr-1" />
                            Open
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Error Details */}
                    <div className="bg-slate-50 dark:bg-slate-800 rounded p-3 text-sm">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-slate-500 dark:text-slate-400">First Occurred</p>
                          <p className="font-medium text-slate-900 dark:text-slate-100">
                            {new Date(error.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500 dark:text-slate-400">Last Occurred</p>
                          <p className="font-medium text-slate-900 dark:text-slate-100">
                            {new Date(error.lastOccurrence).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500 dark:text-slate-400">Occurrences</p>
                          <p className="font-medium text-slate-900 dark:text-slate-100">
                            {error.occurrenceCount}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500 dark:text-slate-400">Error ID</p>
                          <p className="font-mono text-xs text-slate-600 dark:text-slate-400">
                            {error.id}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end space-x-2">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                      {!error.resolved && (
                        <Button size="sm">
                          Mark Resolved
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Error Trends</CardTitle>
              <CardDescription>
                Error patterns and trends over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-slate-500 dark:text-slate-400">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Chart visualization would be implemented here</p>
                  <p className="text-sm">Integration with charting library like Chart.js or Recharts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Alert Configuration</CardTitle>
              <CardDescription>
                Manage automated error alerts and notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-slate-900 dark:text-slate-100">
                        Critical Error Alert
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Notify when critical errors occur
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      Active
                    </Badge>
                  </div>
                </div>
                
                <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-slate-900 dark:text-slate-100">
                        Error Rate Spike Alert
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Notify when error rate exceeds 5% in 10 minutes
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      Active
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}