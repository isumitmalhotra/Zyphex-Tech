/**
 * CMS Analytics Dashboard
 * Display page analytics and engagement metrics
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Eye, 
  Users, 
  Clock, 
  TrendingUp, 
  Download,
  Calendar,
  ArrowUp,
  ArrowDown,
  Minus,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, subDays } from 'date-fns';

interface AnalyticsDashboardProps {
  pageId?: string; // If provided, show analytics for specific page, otherwise show all pages
}

interface MetricCard {
  title: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
}

interface PageAnalytics {
  pageId: string;
  pageTitle: string;
  slug: string;
  views: number;
  uniqueVisitors: number;
  avgTimeOnPage: number;
  bounceRate: number;
}

interface ChartData {
  date: string;
  views: number;
  visitors: number;
}

interface TrafficSource {
  source: string;
  visitors: number;
  percentage: number;
}

export function AnalyticsDashboard({ pageId }: AnalyticsDashboardProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7'); // days
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [customRange, setCustomRange] = useState(false);

  // Metrics data
  const [metrics, setMetrics] = useState<MetricCard[]>([
    {
      title: 'Total Views',
      value: 0,
      change: 0,
      trend: 'neutral',
      icon: <Eye className="w-4 h-4" />,
    },
    {
      title: 'Unique Visitors',
      value: 0,
      change: 0,
      trend: 'neutral',
      icon: <Users className="w-4 h-4" />,
    },
    {
      title: 'Avg. Time on Page',
      value: '0m 0s',
      change: 0,
      trend: 'neutral',
      icon: <Clock className="w-4 h-4" />,
    },
    {
      title: 'Engagement Rate',
      value: '0%',
      change: 0,
      trend: 'neutral',
      icon: <TrendingUp className="w-4 h-4" />,
    },
  ]);

  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [topPages, setTopPages] = useState<PageAnalytics[]>([]);
  const [trafficSources, setTrafficSources] = useState<TrafficSource[]>([]);

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId, startDate, endDate]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
      });

      if (pageId) {
        params.append('pageId', pageId);
      }

      const response = await fetch(`/api/cms/analytics?${params}`);
      const data = await response.json();

      if (data.success) {
        updateMetrics(data.data.metrics);
        setChartData(data.data.chartData || []);
        setTopPages(data.data.topPages || []);
        setTrafficSources(data.data.trafficSources || []);
      } else {
        throw new Error(data.message || 'Failed to fetch analytics');
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateMetrics = (metricsData: Record<string, unknown>) => {
    const formatTime = (seconds: number) => {
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${minutes}m ${secs}s`;
    };

    setMetrics([
      {
        title: 'Total Views',
        value: metricsData.totalViews as number || 0,
        change: metricsData.viewsChange as number || 0,
        trend: (metricsData.viewsChange as number || 0) > 0 ? 'up' : (metricsData.viewsChange as number || 0) < 0 ? 'down' : 'neutral',
        icon: <Eye className="w-4 h-4" />,
      },
      {
        title: 'Unique Visitors',
        value: metricsData.uniqueVisitors as number || 0,
        change: metricsData.visitorsChange as number || 0,
        trend: (metricsData.visitorsChange as number || 0) > 0 ? 'up' : (metricsData.visitorsChange as number || 0) < 0 ? 'down' : 'neutral',
        icon: <Users className="w-4 h-4" />,
      },
      {
        title: 'Avg. Time on Page',
        value: formatTime(metricsData.avgTimeOnPage as number || 0),
        change: metricsData.timeChange as number || 0,
        trend: (metricsData.timeChange as number || 0) > 0 ? 'up' : (metricsData.timeChange as number || 0) < 0 ? 'down' : 'neutral',
        icon: <Clock className="w-4 h-4" />,
      },
      {
        title: 'Engagement Rate',
        value: `${metricsData.engagementRate as number || 0}%`,
        change: metricsData.engagementChange as number || 0,
        trend: (metricsData.engagementChange as number || 0) > 0 ? 'up' : (metricsData.engagementChange as number || 0) < 0 ? 'down' : 'neutral',
        icon: <TrendingUp className="w-4 h-4" />,
      },
    ]);
  };

  const handleDateRangeChange = (value: string) => {
    setDateRange(value);
    if (value === 'custom') {
      setCustomRange(true);
    } else {
      setCustomRange(false);
      const days = parseInt(value);
      setStartDate(format(subDays(new Date(), days), 'yyyy-MM-dd'));
      setEndDate(format(new Date(), 'yyyy-MM-dd'));
    }
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
        format,
      });

      if (pageId) {
        params.append('pageId', pageId);
      }

      const response = await fetch(`/api/cms/analytics/export?${params}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${startDate}-to-${endDate}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Success',
        description: `Analytics exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Failed to export analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to export analytics',
        variant: 'destructive',
      });
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return <ArrowUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <ArrowDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Activity className="w-12 h-12 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            {pageId ? 'Page performance metrics' : 'Overall site performance metrics'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => handleExport('csv')}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport('pdf')}>
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Date Range Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Date Range
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label htmlFor="dateRange">Select Range</Label>
              <Select value={dateRange} onValueChange={handleDateRangeChange}>
                <SelectTrigger id="dateRange">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="14">Last 14 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {customRange && (
              <>
                <div className="flex-1">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    max={endDate}
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    max={format(new Date(), 'yyyy-MM-dd')}
                  />
                </div>
                <Button onClick={fetchAnalytics}>Apply</Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.title}
              </CardTitle>
              <div className="p-2 bg-muted rounded-full">
                {metric.icon}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                {getTrendIcon(metric.trend)}
                <span className={getTrendColor(metric.trend)}>
                  {Math.abs(metric.change)}%
                </span>
                <span>vs previous period</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            <BarChart3 className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="pages">
            <Eye className="w-4 h-4 mr-2" />
            Top Pages
          </TabsTrigger>
          <TabsTrigger value="traffic">
            <PieChart className="w-4 h-4 mr-2" />
            Traffic Sources
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Views Over Time</CardTitle>
              <CardDescription>
                Daily page views and unique visitors
              </CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <div className="space-y-4">
                  {/* Simple bar chart representation */}
                  <div className="space-y-2">
                    {chartData.map((data, index) => {
                      const maxViews = Math.max(...chartData.map(d => d.views));
                      const viewsPercentage = (data.views / maxViews) * 100;
                      const visitorsPercentage = (data.visitors / maxViews) * 100;

                      return (
                        <div key={index} className="space-y-1">
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(data.date), 'MMM dd')}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-20 text-xs">Views</div>
                            <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                              <div
                                className="bg-primary h-full flex items-center justify-end px-2 text-xs text-primary-foreground"
                                style={{ width: `${viewsPercentage}%` }}
                              >
                                {data.views}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-20 text-xs">Visitors</div>
                            <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                              <div
                                className="bg-blue-500 h-full flex items-center justify-end px-2 text-xs text-white"
                                style={{ width: `${visitorsPercentage}%` }}
                              >
                                {data.visitors}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-center gap-6 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-primary rounded" />
                      <span className="text-sm">Page Views</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded" />
                      <span className="text-sm">Unique Visitors</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No data available for the selected period
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Pages Tab */}
        <TabsContent value="pages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Pages</CardTitle>
              <CardDescription>
                Pages with the most views and engagement
              </CardDescription>
            </CardHeader>
            <CardContent>
              {topPages.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Page Title</TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead className="text-right">Views</TableHead>
                      <TableHead className="text-right">Visitors</TableHead>
                      <TableHead className="text-right">Avg. Time</TableHead>
                      <TableHead className="text-right">Bounce Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topPages.map((page) => (
                      <TableRow key={page.pageId}>
                        <TableCell className="font-medium">
                          {page.pageTitle}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          /{page.slug}
                        </TableCell>
                        <TableCell className="text-right">
                          {page.views.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {page.uniqueVisitors.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {Math.floor(page.avgTimeOnPage / 60)}m {page.avgTimeOnPage % 60}s
                        </TableCell>
                        <TableCell className="text-right">
                          {page.bounceRate}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No page data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Traffic Sources Tab */}
        <TabsContent value="traffic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Traffic Sources</CardTitle>
              <CardDescription>
                Where your visitors are coming from
              </CardDescription>
            </CardHeader>
            <CardContent>
              {trafficSources.length > 0 ? (
                <div className="space-y-4">
                  {trafficSources.map((source, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium capitalize">{source.source}</span>
                        <span className="text-muted-foreground">
                          {source.visitors.toLocaleString()} visitors ({source.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-primary h-full"
                          style={{ width: `${source.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No traffic source data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
