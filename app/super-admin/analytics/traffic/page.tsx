"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Loader2, AlertCircle, RefreshCw, TrendingUp, Users, Eye, MousePointerClick, Clock, Monitor, Smartphone, Tablet, Download, Calendar } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface TrafficMetrics {
  totalUsers: number
  totalSessions: number
  totalPageViews: number
  bounceRate: number
  avgSessionDuration: number
  newUsersRate: number
}

interface TrafficSource {
  source: string
  medium: string
  users: number
  sessions: number
  pageViews: number
  percentage: number
}

interface GeographicData {
  country: string
  users: number
  sessions: number
  percentage: number
}

interface DeviceData {
  category: string
  users: number
  sessions: number
  percentage: number
}

interface TopPage {
  page: string
  pageViews: number
  uniquePageViews: number
  avgTimeOnPage: number
  bounceRate: number
}

interface TrendData {
  date: string
  users: number
  sessions: number
  pageViews: number
}

interface TrafficData {
  success: boolean
  source: 'ga4' | 'mock'
  metrics: TrafficMetrics
  sources: TrafficSource[]
  geographic: GeographicData[]
  devices: DeviceData[]
  topPages: TopPage[]
  activeUsers: number
  trend: TrendData[]
  dateRange: { start: string; end: string }
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function TrafficAnalyticsPage() {
  const [data, setData] = useState<TrafficData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<'30' | '7' | 'today'>('30')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    fetchTrafficData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange, refreshKey])

  async function fetchTrafficData() {
    setIsLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({
        startDate: dateRange === '30' ? '30daysAgo' : dateRange === '7' ? '7daysAgo' : 'today',
        endDate: 'today'
      })
      
      const response = await fetch(`/api/super-admin/analytics/traffic?${params}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch traffic data: ${response.statusText}`)
      }
      
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load traffic data')
      console.error('Traffic data fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  function formatNumber(num: number): string {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  function formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${minutes}m ${secs}s`
  }

  function getCountryFlag(country: string): string {
    const flags: Record<string, string> = {
      'United States': '🇺🇸',
      'United Kingdom': '🇬🇧',
      'Canada': '🇨🇦',
      'Germany': '🇩🇪',
      'France': '🇫🇷',
      'India': '🇮🇳',
      'Australia': '🇦🇺',
      'Japan': '🇯🇵',
      'Brazil': '🇧🇷',
    }
    return flags[country] || '🌍'
  }

  function exportData() {
    if (!data) return
    
    const csv = [
      ['Metric', 'Value'],
      ['Total Users', data.metrics.totalUsers],
      ['Total Sessions', data.metrics.totalSessions],
      ['Total Page Views', data.metrics.totalPageViews],
      ['Bounce Rate', `${data.metrics.bounceRate}%`],
      ['Avg Session Duration', formatDuration(data.metrics.avgSessionDuration)],
      ['New Users Rate', `${data.metrics.newUsersRate}%`],
      ['Active Users Now', data.activeUsers],
      ['Data Source', data.source === 'ga4' ? 'Google Analytics 4' : 'Mock Data'],
      ['Date Range', `${data.dateRange.start} to ${data.dateRange.end}`],
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `traffic-analytics-${Date.now()}.csv`
    a.click()
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading traffic analytics...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="ml-2">
            {error}
          </AlertDescription>
        </Alert>
        <Button onClick={() => setRefreshKey(prev => prev + 1)} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  if (!data) return null

  const { metrics, sources, geographic, devices, topPages, activeUsers, trend } = data

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Traffic Analytics</h1>
          <p className="text-muted-foreground">
            Monitor your website traffic and visitor behavior
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={data.source === 'ga4' ? 'default' : 'secondary'}>
            {data.source === 'ga4' ? '📊 Live GA4 Data' : '🔧 Demo Data'}
          </Badge>
          <Select value={dateRange} onValueChange={(value: '30' | '7' | 'today') => setDateRange(value)}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="icon" onClick={() => setRefreshKey(prev => prev + 1)}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.totalUsers)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.newUsersRate.toFixed(1)}% new users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.totalSessions)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {(metrics.totalSessions / metrics.totalUsers).toFixed(1)} per user
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Page Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.totalPageViews)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {(metrics.totalPageViews / metrics.totalSessions).toFixed(1)} per session
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg. Session</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(metrics.avgSessionDuration)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.bounceRate.toFixed(1)}% bounce rate
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 bg-green-400 rounded-full animate-pulse" />
              <span className="text-lg font-semibold">{activeUsers} users active right now</span>
            </div>
            <TrendingUp className="h-6 w-6" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Traffic Trend</CardTitle>
          <CardDescription>Daily visitors over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} name="Users" />
              <Line type="monotone" dataKey="sessions" stroke="#10b981" strokeWidth={2} name="Sessions" />
              <Line type="monotone" dataKey="pageViews" stroke="#f59e0b" strokeWidth={2} name="Page Views" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Traffic Sources</CardTitle>
            <CardDescription>Where your visitors come from</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sources.map((source, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-medium">{source.source}</span>
                      <Badge variant="outline" className="text-xs">{source.medium}</Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatNumber(source.users)} users ({source.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <Progress value={source.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Devices</CardTitle>
            <CardDescription>Device breakdown of visitors</CardDescription>
          </CardHeader>
          <CardContent>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={devices as any}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percentage }: any) => `${category} (${percentage.toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="users"
                >
                  {devices.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {devices.map((device, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {device.category === 'desktop' && <Monitor className="h-4 w-4" />}
                    {device.category === 'mobile' && <Smartphone className="h-4 w-4" />}
                    {device.category === 'tablet' && <Tablet className="h-4 w-4" />}
                    <span className="capitalize">{device.category}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatNumber(device.users)} users
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Geographic Distribution</CardTitle>
          <CardDescription>Top countries by visitors</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Country</TableHead>
                <TableHead className="text-right">Users</TableHead>
                <TableHead className="text-right">Sessions</TableHead>
                <TableHead className="text-right">% of Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {geographic.map((country, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getCountryFlag(country.country)}</span>
                      {country.country}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{formatNumber(country.users)}</TableCell>
                  <TableCell className="text-right">{formatNumber(country.sessions)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {country.percentage.toFixed(1)}%
                      <Progress value={country.percentage} className="h-2 w-20" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top Pages</CardTitle>
          <CardDescription>Most visited pages on your site</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Page</TableHead>
                <TableHead className="text-right">Page Views</TableHead>
                <TableHead className="text-right">Unique Views</TableHead>
                <TableHead className="text-right">Avg. Time</TableHead>
                <TableHead className="text-right">Bounce Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topPages.map((page, index) => (
                <TableRow key={index}>
                  <TableCell className="font-mono text-sm">{page.page}</TableCell>
                  <TableCell className="text-right">{formatNumber(page.pageViews)}</TableCell>
                  <TableCell className="text-right">{formatNumber(page.uniquePageViews)}</TableCell>
                  <TableCell className="text-right">{formatDuration(page.avgTimeOnPage)}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={page.bounceRate > 70 ? 'destructive' : page.bounceRate > 50 ? 'secondary' : 'default'}>
                      {page.bounceRate.toFixed(1)}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
