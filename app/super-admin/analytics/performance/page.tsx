"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { SubtleBackground } from "@/components/subtle-background"
import { Loader2, AlertCircle, RefreshCw } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Activity,
  Zap,
  TrendingUp,
  TrendingDown,
  Download,
  Server,
  Database,
  AlertTriangle,
  CheckCircle,
  Timer,
  Eye,
  Layers,
  MonitorCheck,
  Signal
} from "lucide-react"

interface PerformanceData {
  success: boolean
  source: 'database' | 'mock'
  message?: string
  systemMetrics: SystemMetric[]
  pageMetrics: PageMetric[]
  apiEndpoints: ApiEndpoint[]
  databaseMetrics: DatabaseMetric[]
  cacheMetrics: CacheMetric[]
  serverResources: ServerResource[]
  healthIndicators: HealthIndicator[]
  webVitals: WebVital[]
  errorTracking: ErrorTracking[]
  slowQueries: SlowQuery[]
  performanceTimeline: PerformanceTimelineItem[]
}

interface SystemMetric {
  title: string
  value: string
  change: string
  trend: string
  icon: string
  description: string
  color: string
  status: string
}

interface PageMetric {
  page: string
  loadTime: string
  ttfb: string
  fcp: string
  lcp: string
  cls: string
  tti: string
  requests: number
  size: string
}

interface ApiEndpoint {
  endpoint: string
  avgResponse: string
  p95: string
  p99: string
  successRate: string
  requestsPerMin: number
  errorCount: number
  status: string
}

interface DatabaseMetric {
  metric: string
  value: string
  target: string
  percentage: number
  status: string
  change: string
}

interface CacheMetric {
  cache: string
  hitRate: string
  size: string
  entries: string
  evictions: string
}

interface ServerResource {
  resource: string
  current: string
  avg: string
  peak: string
  status: string
  icon: string
  color: string
}

interface HealthIndicator {
  component: string
  status: string
  uptime: string
  lastCheck: string
  responseTime: string
}

interface WebVital {
  metric: string
  value: string
  threshold: string
  score: string
  description: string
  percentage: number
}

interface ErrorTracking {
  errorType: string
  count: number
  percentage: string
  trend: string
  change: string
  severity: string
}

interface SlowQuery {
  query: string
  avgTime: string
  executions: number
  totalTime: string
  impact: string
}

interface PerformanceTimelineItem {
  time: string
  loadTime: number
  apiTime: number
  errorRate: number
}

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function SuperAdminPerformanceAnalyticsPage() {
  const [data, setData] = useState<PerformanceData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState("24h")
  const [_metricView, _setMetricView] = useState("all")
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    fetchPerformanceData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange, refreshKey])

  async function fetchPerformanceData() {
    setIsLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({ dateRange })
      const response = await fetch(`/api/super-admin/analytics/performance?${params}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch performance data: ${response.statusText}`)
      }
      
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load performance data')
      console.error('Performance data fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading performance analytics...</p>
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

  const {
    systemMetrics,
    pageMetrics,
    apiEndpoints,
    databaseMetrics,
    cacheMetrics,
    serverResources,
    healthIndicators,
    webVitals,
    errorTracking,
    slowQueries,
  } = data

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent":
      case "healthy":
      case "good":
        return "text-green-400 bg-green-500/20 border-green-500/30"
      case "warning":
        return "text-yellow-400 bg-yellow-500/20 border-yellow-500/30"
      case "critical":
        return "text-red-400 bg-red-500/20 border-red-500/30"
      default:
        return "text-gray-400 bg-gray-500/20 border-gray-500/30"
    }
  }

  // Get icon component
  const getIconComponent = (iconName: string) => {
    const icons: Record<string, any> = {
      Clock: Server, // Fallback to Server for simplicity
      Zap,
      Server,
      AlertTriangle,
      Database,
      Activity,
      Eye,
      Layers,
      MonitorCheck,
      Timer,
    }
    return icons[iconName] || Server
  }

  // Export functionality
  const handleExport = (format: string) => {
    const timestamp = new Date().toISOString().split('T')[0]
    
    if (format === 'csv') {
      // Convert system metrics to CSV
      const headers = ['Metric', 'Value', 'Status', 'Change']
      const csvContent = [
        headers.join(','),
        ...systemMetrics.map((row: { title: string; value: string; status: string; change: string }) => [
          row.title,
          row.value,
          row.status,
          row.change
        ].join(','))
      ].join('\n')
      
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `performance-analytics-${timestamp}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } else if (format === 'json') {
      // Convert to JSON
      const jsonContent = JSON.stringify({ 
        exportDate: new Date().toISOString(),
        systemMetrics,
        pageMetrics,
        databaseMetrics,
        cacheMetrics
      }, null, 2)
      
      const blob = new Blob([jsonContent], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `performance-analytics-${timestamp}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="min-h-screen zyphex-gradient-bg relative">
      <SubtleBackground />
      
      <div className="relative z-10 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold zyphex-heading mb-2">Performance Analytics</h1>
              <p className="text-lg zyphex-subheading">
                Monitor system performance, application health, and user experience metrics
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={data.source === 'database' ? 'default' : 'secondary'}>
                {data.source === 'database' ? '📊 Live Database' : '🔧 Demo Data'}
              </Badge>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[180px] zyphex-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="zyphex-dropdown">
                  <SelectItem value="1h">Last hour</SelectItem>
                  <SelectItem value="24h">Last 24 hours</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                className="zyphex-button-secondary"
                onClick={() => handleExport("csv")}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button 
                variant="outline" 
                className="zyphex-button-secondary"
                onClick={() => handleExport("pdf")}
              >
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>

          {/* System Performance Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {systemMetrics.map((metric, index) => {
              const IconComponent = getIconComponent(metric.icon)
              return (
              <Card key={index} className="zyphex-card hover-zyphex-lift transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg bg-gradient-to-br from-${metric.color}-500/20 to-${metric.color}-600/20 border border-${metric.color}-500/30`}>
                      <IconComponent className={`h-6 w-6 text-${metric.color}-400`} />
                    </div>
                    <Badge variant="outline" className={getStatusColor(metric.status)}>
                      {metric.status}
                    </Badge>
                  </div>
                  <h3 className="text-sm zyphex-subheading mb-1">{metric.title}</h3>
                  <p className="text-3xl font-bold zyphex-heading mb-1">{metric.value}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline" className={`${
                      metric.trend === "up" 
                        ? "bg-green-500/20 text-green-400 border-green-500/30" 
                        : "bg-red-500/20 text-red-400 border-red-500/30"
                    }`}>
                      {metric.trend === "up" ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                      {metric.change}
                    </Badge>
                    <span className="zyphex-subheading">{metric.description}</span>
                  </div>
                </CardContent>
              </Card>
            )})}
          </div>

          {/* Page Performance Metrics */}
          <Card className="zyphex-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="zyphex-heading">Page Load Performance</CardTitle>
                  <CardDescription className="zyphex-subheading">
                    Detailed performance metrics for key pages
                  </CardDescription>
                </div>
                <MonitorCheck className="h-5 w-5 text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pageMetrics.map((page, index) => (
                  <div key={index} className="p-4 rounded-lg zyphex-glass-effect hover-zyphex-lift transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold zyphex-heading mb-1">{page.page}</p>
                        <p className="text-sm zyphex-subheading">{page.requests} requests • {page.size}</p>
                      </div>
                      <Badge variant="outline" className={
                        parseFloat(page.loadTime) < 1.5 
                          ? "bg-green-500/20 text-green-400 border-green-500/30"
                          : parseFloat(page.loadTime) < 2.5
                          ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                          : "bg-red-500/20 text-red-400 border-red-500/30"
                      }>
                        {page.loadTime}
                      </Badge>
                    </div>
                    <Separator className="my-3 bg-gray-800/50" />
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
                      <div>
                        <span className="zyphex-subheading">TTFB:</span>
                        <span className="ml-2 zyphex-heading font-medium">{page.ttfb}</span>
                      </div>
                      <div>
                        <span className="zyphex-subheading">FCP:</span>
                        <span className="ml-2 zyphex-heading font-medium">{page.fcp}</span>
                      </div>
                      <div>
                        <span className="zyphex-subheading">LCP:</span>
                        <span className="ml-2 zyphex-heading font-medium">{page.lcp}</span>
                      </div>
                      <div>
                        <span className="zyphex-subheading">TTI:</span>
                        <span className="ml-2 zyphex-heading font-medium">{page.tti}</span>
                      </div>
                      <div>
                        <span className="zyphex-subheading">CLS:</span>
                        <span className="ml-2 zyphex-heading font-medium">{page.cls}</span>
                      </div>
                      <div>
                        <span className="zyphex-subheading">Load:</span>
                        <span className="ml-2 zyphex-heading font-medium">{page.loadTime}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* API Endpoint Performance */}
          <Card className="zyphex-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="zyphex-heading">API Endpoint Performance</CardTitle>
                  <CardDescription className="zyphex-subheading">
                    Response times and success rates for API endpoints
                  </CardDescription>
                </div>
                <Zap className="h-5 w-5 text-cyan-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {apiEndpoints.map((endpoint, index) => (
                  <div key={index} className="p-4 rounded-lg bg-gray-800/30">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-mono text-sm font-semibold zyphex-heading mb-1">{endpoint.endpoint}</p>
                        <p className="text-sm zyphex-subheading">{endpoint.requestsPerMin.toLocaleString()} req/min</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getStatusColor(endpoint.status)}>
                          {endpoint.status}
                        </Badge>
                        <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                          {endpoint.successRate}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <span className="zyphex-subheading">Avg:</span>
                        <span className="ml-2 zyphex-heading font-medium">{endpoint.avgResponse}</span>
                      </div>
                      <div>
                        <span className="zyphex-subheading">P95:</span>
                        <span className="ml-2 zyphex-heading font-medium">{endpoint.p95}</span>
                      </div>
                      <div>
                        <span className="zyphex-subheading">P99:</span>
                        <span className="ml-2 zyphex-heading font-medium">{endpoint.p99}</span>
                      </div>
                      <div>
                        <span className="zyphex-subheading">Errors:</span>
                        <span className="ml-2 text-red-400 font-medium">{endpoint.errorCount}</span>
                      </div>
                      <div>
                        <span className="zyphex-subheading">Success:</span>
                        <span className="ml-2 text-green-400 font-medium">{endpoint.successRate}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Core Web Vitals */}
          <Card className="zyphex-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="zyphex-heading">Core Web Vitals</CardTitle>
                  <CardDescription className="zyphex-subheading">
                    Google&apos;s user experience performance metrics
                  </CardDescription>
                </div>
                <Eye className="h-5 w-5 text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {webVitals.map((vital, index) => (
                  <div key={index} className="p-4 rounded-lg zyphex-glass-effect">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold zyphex-heading mb-1">{vital.metric}</p>
                        <p className="text-xs zyphex-subheading">{vital.description}</p>
                      </div>
                      <Badge variant="outline" className={getStatusColor(vital.score)}>
                        {vital.score}
                      </Badge>
                    </div>
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-2xl font-bold zyphex-heading">{vital.value}</span>
                        <span className="text-sm zyphex-subheading">{vital.threshold}</span>
                      </div>
                      <Progress value={vital.percentage} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Database & Cache Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Database Performance */}
            <Card className="zyphex-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="zyphex-heading">Database Performance</CardTitle>
                    <CardDescription className="zyphex-subheading">
                      Query performance and connection metrics
                    </CardDescription>
                  </div>
                  <Database className="h-5 w-5 text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {databaseMetrics.map((metric, index) => (
                    <div key={index} className="p-3 rounded-lg bg-gray-800/30">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium zyphex-heading">{metric.metric}</p>
                        <Badge variant="outline" className={getStatusColor(metric.status)}>
                          {metric.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-lg font-bold zyphex-heading">{metric.value}</span>
                        <span className="text-sm zyphex-subheading">{metric.target}</span>
                      </div>
                      <Progress value={metric.percentage} className="h-2 mb-1" />
                      <p className="text-xs text-green-400">{metric.change} from last period</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Cache Performance */}
            <Card className="zyphex-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="zyphex-heading">Cache Performance</CardTitle>
                    <CardDescription className="zyphex-subheading">
                      Cache hit rates and efficiency metrics
                    </CardDescription>
                  </div>
                  <Layers className="h-5 w-5 text-orange-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cacheMetrics.map((cache, index) => (
                    <div key={index} className="p-4 rounded-lg zyphex-glass-effect">
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-semibold zyphex-heading">{cache.cache}</p>
                        <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                          {cache.hitRate}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="zyphex-subheading">Size:</span>
                          <p className="zyphex-heading font-medium">{cache.size}</p>
                        </div>
                        <div>
                          <span className="zyphex-subheading">Entries:</span>
                          <p className="zyphex-heading font-medium">{cache.entries}</p>
                        </div>
                        <div>
                          <span className="zyphex-subheading">Evictions:</span>
                          <p className="zyphex-heading font-medium">{cache.evictions}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Server Resources */}
          <Card className="zyphex-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="zyphex-heading">Server Resource Utilization</CardTitle>
                  <CardDescription className="zyphex-subheading">
                    Real-time server resource monitoring
                  </CardDescription>
                </div>
                <Server className="h-5 w-5 text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {serverResources.map((resource, index) => {
                  const ResourceIcon = getIconComponent(resource.icon)
                  return (
                  <div key={index} className="p-4 rounded-lg bg-gradient-to-br from-gray-800/50 to-gray-900/50">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2 rounded-lg bg-${resource.color}-500/20 border border-${resource.color}-500/30`}>
                        <ResourceIcon className={`h-5 w-5 text-${resource.color}-400`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium zyphex-heading">{resource.resource}</p>
                        <Badge variant="outline" className={getStatusColor(resource.status)}>
                          {resource.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="zyphex-subheading">Current:</span>
                        <span className="zyphex-heading font-medium">{resource.current}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="zyphex-subheading">Average:</span>
                        <span className="zyphex-heading font-medium">{resource.avg}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="zyphex-subheading">Peak:</span>
                        <span className="text-orange-400 font-medium">{resource.peak}</span>
                      </div>
                    </div>
                  </div>
                )})}
              </div>
            </CardContent>
          </Card>

          {/* Application Health */}
          <Card className="zyphex-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="zyphex-heading">Application Health Status</CardTitle>
                  <CardDescription className="zyphex-subheading">
                    Real-time health monitoring of system components
                  </CardDescription>
                </div>
                <Activity className="h-5 w-5 text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {healthIndicators.map((indicator, index) => (
                  <div key={index} className="p-4 rounded-lg border-l-4 border-green-500 bg-gray-800/30">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold zyphex-heading mb-1">{indicator.component}</p>
                        <p className="text-xs zyphex-subheading">Last check: {indicator.lastCheck}</p>
                      </div>
                      <Badge variant="outline" className={getStatusColor(indicator.status)}>
                        {indicator.status === "healthy" ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertTriangle className="h-3 w-3 mr-1" />}
                        {indicator.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-3">
                      <div>
                        <span className="zyphex-subheading">Uptime:</span>
                        <span className="ml-2 text-green-400 font-medium">{indicator.uptime}</span>
                      </div>
                      <div>
                        <span className="zyphex-subheading">Response:</span>
                        <span className="ml-2 zyphex-heading font-medium">{indicator.responseTime}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Error Tracking */}
          <Card className="zyphex-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="zyphex-heading">Error Tracking</CardTitle>
                  <CardDescription className="zyphex-subheading">
                    Monitor application errors and their trends
                  </CardDescription>
                </div>
                <AlertTriangle className="h-5 w-5 text-orange-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {errorTracking.map((error, index) => (
                  <div key={index} className="p-4 rounded-lg zyphex-glass-effect hover-zyphex-lift transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold zyphex-heading mb-1">{error.errorType}</p>
                        <p className="text-sm zyphex-subheading">{error.count} errors • {error.percentage} of total traffic</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={
                          error.severity === "high" 
                            ? "bg-red-500/20 text-red-400 border-red-500/30"
                            : error.severity === "medium"
                            ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                            : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                        }>
                          {error.severity}
                        </Badge>
                        <Badge variant="outline" className={
                          error.trend === "down"
                            ? "bg-green-500/20 text-green-400 border-green-500/30"
                            : error.trend === "up"
                            ? "bg-red-500/20 text-red-400 border-red-500/30"
                            : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                        }>
                          {error.trend === "down" ? <TrendingDown className="h-3 w-3 mr-1" /> : error.trend === "up" ? <TrendingUp className="h-3 w-3 mr-1" /> : <Signal className="h-3 w-3 mr-1" />}
                          {error.change}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Slow Queries */}
          <Card className="zyphex-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="zyphex-heading">Slow Query Analysis</CardTitle>
                  <CardDescription className="zyphex-subheading">
                    Identify and optimize slow database queries
                  </CardDescription>
                </div>
                <Timer className="h-5 w-5 text-red-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {slowQueries.map((query, index) => (
                  <div key={index} className="p-4 rounded-lg border-l-4 border-red-500 bg-red-500/5">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-mono text-sm zyphex-heading mb-1">{query.query}</p>
                        <p className="text-xs zyphex-subheading">{query.executions} executions</p>
                      </div>
                      <Badge variant="outline" className={
                        query.impact === "high"
                          ? "bg-red-500/20 text-red-400 border-red-500/30"
                          : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                      }>
                        {query.impact} impact
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm mt-3">
                      <div>
                        <span className="zyphex-subheading">Avg Time:</span>
                        <span className="ml-2 text-red-400 font-medium">{query.avgTime}</span>
                      </div>
                      <div>
                        <span className="zyphex-subheading">Total Time:</span>
                        <span className="ml-2 zyphex-heading font-medium">{query.totalTime}</span>
                      </div>
                      <div>
                        <span className="zyphex-subheading">Executions:</span>
                        <span className="ml-2 zyphex-heading font-medium">{query.executions}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
