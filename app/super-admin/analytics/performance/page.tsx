"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { SubtleBackground } from "@/components/subtle-background"
import {
  Activity,
  Zap,
  TrendingUp,
  TrendingDown,
  Download,
  Clock,
  Server,
  Database,
  Cpu,
  HardDrive,
  AlertTriangle,
  CheckCircle,
  Timer,
  Eye,
  Layers,
  MonitorCheck,
  Network,
  Signal
} from "lucide-react"

export default function SuperAdminPerformanceAnalyticsPage() {
  const [dateRange, setDateRange] = useState("24h")
  const [_metricView, _setMetricView] = useState("all")

  // System Performance Overview
  const systemMetrics = [
    {
      title: "Avg Page Load Time",
      value: "1.24s",
      change: "-0.15s",
      trend: "up",
      icon: Clock,
      description: "Last 24 hours",
      color: "blue",
      status: "good"
    },
    {
      title: "API Response Time",
      value: "142ms",
      change: "-18ms",
      trend: "up",
      icon: Zap,
      description: "Average response time",
      color: "cyan",
      status: "good"
    },
    {
      title: "Server Uptime",
      value: "99.98%",
      change: "+0.02%",
      trend: "up",
      icon: Server,
      description: "Last 30 days",
      color: "green",
      status: "excellent"
    },
    {
      title: "Error Rate",
      value: "0.12%",
      change: "-0.03%",
      trend: "up",
      icon: AlertTriangle,
      description: "Error percentage",
      color: "orange",
      status: "good"
    }
  ]

  // Page Performance Metrics
  const pageMetrics = [
    {
      page: "/dashboard",
      loadTime: "0.98s",
      ttfb: "245ms",
      fcp: "1.1s",
      lcp: "1.8s",
      cls: "0.05",
      tti: "2.1s",
      requests: 42,
      size: "1.2MB"
    },
    {
      page: "/project-manager",
      loadTime: "1.15s",
      ttfb: "312ms",
      fcp: "1.3s",
      lcp: "2.1s",
      cls: "0.08",
      tti: "2.5s",
      requests: 38,
      size: "1.5MB"
    },
    {
      page: "/admin",
      loadTime: "1.42s",
      ttfb: "298ms",
      fcp: "1.5s",
      lcp: "2.4s",
      cls: "0.06",
      tti: "2.8s",
      requests: 51,
      size: "1.8MB"
    },
    {
      page: "/analytics",
      loadTime: "1.68s",
      ttfb: "334ms",
      fcp: "1.7s",
      lcp: "2.9s",
      cls: "0.09",
      tti: "3.2s",
      requests: 67,
      size: "2.4MB"
    },
    {
      page: "/portfolio",
      loadTime: "1.89s",
      ttfb: "412ms",
      fcp: "1.9s",
      lcp: "3.2s",
      cls: "0.11",
      tti: "3.6s",
      requests: 73,
      size: "3.1MB"
    }
  ]

  // API Endpoint Performance
  const apiEndpoints = [
    {
      endpoint: "/api/projects",
      avgResponse: "98ms",
      p95: "145ms",
      p99: "234ms",
      successRate: "99.8%",
      requestsPerMin: 1250,
      errorCount: 3,
      status: "healthy"
    },
    {
      endpoint: "/api/tasks",
      avgResponse: "112ms",
      p95: "178ms",
      p99: "298ms",
      successRate: "99.6%",
      requestsPerMin: 890,
      errorCount: 5,
      status: "healthy"
    },
    {
      endpoint: "/api/users",
      avgResponse: "87ms",
      p95: "134ms",
      p99: "201ms",
      successRate: "99.9%",
      requestsPerMin: 2340,
      errorCount: 2,
      status: "healthy"
    },
    {
      endpoint: "/api/analytics",
      avgResponse: "245ms",
      p95: "412ms",
      p99: "678ms",
      successRate: "98.9%",
      requestsPerMin: 450,
      errorCount: 12,
      status: "warning"
    },
    {
      endpoint: "/api/documents",
      avgResponse: "189ms",
      p95: "298ms",
      p99: "445ms",
      successRate: "99.4%",
      requestsPerMin: 670,
      errorCount: 7,
      status: "healthy"
    }
  ]

  // Database Performance
  const databaseMetrics = [
    {
      metric: "Query Response Time",
      value: "45ms",
      target: "< 100ms",
      percentage: 45,
      status: "excellent",
      change: "-8ms"
    },
    {
      metric: "Connection Pool Usage",
      value: "68%",
      target: "< 80%",
      percentage: 68,
      status: "good",
      change: "+5%"
    },
    {
      metric: "Cache Hit Rate",
      value: "94.2%",
      target: "> 90%",
      percentage: 94.2,
      status: "excellent",
      change: "+2.1%"
    },
    {
      metric: "Query Execution Rate",
      value: "1,245/sec",
      target: "< 2000/sec",
      percentage: 62.25,
      status: "good",
      change: "+120/sec"
    },
    {
      metric: "Slow Query Count",
      value: "12",
      target: "< 50",
      percentage: 24,
      status: "excellent",
      change: "-8"
    },
    {
      metric: "Deadlock Count",
      value: "2",
      target: "< 10",
      percentage: 20,
      status: "excellent",
      change: "0"
    }
  ]

  // Server Resource Usage
  const serverResources = [
    {
      resource: "CPU Usage",
      current: "34%",
      avg: "42%",
      peak: "78%",
      status: "healthy",
      icon: Cpu,
      color: "blue"
    },
    {
      resource: "Memory Usage",
      current: "6.2GB",
      avg: "5.8GB",
      peak: "8.4GB",
      status: "healthy",
      icon: HardDrive,
      color: "purple"
    },
    {
      resource: "Disk I/O",
      current: "145MB/s",
      avg: "132MB/s",
      peak: "298MB/s",
      status: "healthy",
      icon: Database,
      color: "cyan"
    },
    {
      resource: "Network Traffic",
      current: "1.2GB/h",
      avg: "1.1GB/h",
      peak: "2.3GB/h",
      status: "healthy",
      icon: Network,
      color: "green"
    }
  ]

  // Application Health Indicators
  const healthIndicators = [
    {
      component: "Web Server",
      status: "healthy",
      uptime: "99.98%",
      lastCheck: "2 min ago",
      responseTime: "12ms"
    },
    {
      component: "Database Primary",
      status: "healthy",
      uptime: "99.99%",
      lastCheck: "1 min ago",
      responseTime: "8ms"
    },
    {
      component: "Database Replica",
      status: "healthy",
      uptime: "99.97%",
      lastCheck: "1 min ago",
      responseTime: "11ms"
    },
    {
      component: "Redis Cache",
      status: "healthy",
      uptime: "100%",
      lastCheck: "30 sec ago",
      responseTime: "2ms"
    },
    {
      component: "Background Jobs",
      status: "healthy",
      uptime: "99.95%",
      lastCheck: "3 min ago",
      responseTime: "45ms"
    },
    {
      component: "Email Service",
      status: "warning",
      uptime: "98.5%",
      lastCheck: "5 min ago",
      responseTime: "234ms"
    }
  ]

  // Core Web Vitals
  const webVitals = [
    {
      metric: "Largest Contentful Paint (LCP)",
      value: "1.8s",
      threshold: "< 2.5s",
      score: "good",
      description: "Measures loading performance",
      percentage: 72
    },
    {
      metric: "First Input Delay (FID)",
      value: "45ms",
      threshold: "< 100ms",
      score: "good",
      description: "Measures interactivity",
      percentage: 45
    },
    {
      metric: "Cumulative Layout Shift (CLS)",
      value: "0.08",
      threshold: "< 0.1",
      score: "good",
      description: "Measures visual stability",
      percentage: 80
    },
    {
      metric: "First Contentful Paint (FCP)",
      value: "1.2s",
      threshold: "< 1.8s",
      score: "good",
      description: "First content render time",
      percentage: 67
    },
    {
      metric: "Time to Interactive (TTI)",
      value: "2.4s",
      threshold: "< 3.8s",
      score: "good",
      description: "Time until fully interactive",
      percentage: 63
    },
    {
      metric: "Total Blocking Time (TBT)",
      value: "180ms",
      threshold: "< 300ms",
      score: "good",
      description: "Main thread blocking time",
      percentage: 60
    }
  ]

  // Error Tracking
  const errorTracking = [
    {
      errorType: "JavaScript Errors",
      count: 24,
      percentage: "0.08%",
      trend: "down",
      change: "-12",
      severity: "medium"
    },
    {
      errorType: "API Errors (5xx)",
      count: 8,
      percentage: "0.02%",
      trend: "down",
      change: "-3",
      severity: "high"
    },
    {
      errorType: "API Errors (4xx)",
      count: 145,
      percentage: "0.45%",
      trend: "up",
      change: "+12",
      severity: "low"
    },
    {
      errorType: "Database Errors",
      count: 3,
      percentage: "0.01%",
      trend: "stable",
      change: "0",
      severity: "high"
    },
    {
      errorType: "Timeout Errors",
      count: 17,
      percentage: "0.05%",
      trend: "down",
      change: "-5",
      severity: "medium"
    }
  ]

  // Cache Performance
  const cacheMetrics = [
    {
      cache: "Redis (Memory)",
      hitRate: "94.2%",
      size: "2.3GB",
      entries: "145,234",
      evictions: "1,234"
    },
    {
      cache: "CDN Cache",
      hitRate: "89.7%",
      size: "45GB",
      entries: "23,456",
      evictions: "567"
    },
    {
      cache: "Browser Cache",
      hitRate: "87.3%",
      size: "N/A",
      entries: "N/A",
      evictions: "N/A"
    },
    {
      cache: "Database Query Cache",
      hitRate: "91.5%",
      size: "1.2GB",
      entries: "34,567",
      evictions: "890"
    }
  ]

  // Performance Timeline (Last 24 hours) - for future chart implementation
  const _performanceTimeline = [
    { time: "00:00", loadTime: 1.2, apiTime: 145, errorRate: 0.1 },
    { time: "03:00", loadTime: 1.1, apiTime: 138, errorRate: 0.08 },
    { time: "06:00", loadTime: 1.3, apiTime: 156, errorRate: 0.12 },
    { time: "09:00", loadTime: 1.5, apiTime: 178, errorRate: 0.15 },
    { time: "12:00", loadTime: 1.6, apiTime: 189, errorRate: 0.18 },
    { time: "15:00", loadTime: 1.4, apiTime: 167, errorRate: 0.14 },
    { time: "18:00", loadTime: 1.3, apiTime: 152, errorRate: 0.11 },
    { time: "21:00", loadTime: 1.2, apiTime: 142, errorRate: 0.09 }
  ]

  // Top Slow Queries
  const slowQueries = [
    {
      query: "SELECT * FROM projects JOIN...",
      avgTime: "1,245ms",
      executions: 234,
      totalTime: "291,330ms",
      impact: "high"
    },
    {
      query: "UPDATE tasks SET status...",
      avgTime: "892ms",
      executions: 567,
      totalTime: "505,764ms",
      impact: "high"
    },
    {
      query: "SELECT analytics_data FROM...",
      avgTime: "678ms",
      executions: 123,
      totalTime: "83,394ms",
      impact: "medium"
    },
    {
      query: "INSERT INTO audit_logs...",
      avgTime: "445ms",
      executions: 1890,
      totalTime: "841,050ms",
      impact: "medium"
    }
  ]

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

  // Export functionality
  const handleExport = (format: string) => {
    console.log(`Exporting performance analytics as ${format}`)
    // TODO: Implement actual export logic
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
            {systemMetrics.map((metric, index) => (
              <Card key={index} className="zyphex-card hover-zyphex-lift transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg bg-gradient-to-br from-${metric.color}-500/20 to-${metric.color}-600/20 border border-${metric.color}-500/30`}>
                      <metric.icon className={`h-6 w-6 text-${metric.color}-400`} />
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
            ))}
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
                {serverResources.map((resource, index) => (
                  <div key={index} className="p-4 rounded-lg bg-gradient-to-br from-gray-800/50 to-gray-900/50">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2 rounded-lg bg-${resource.color}-500/20 border border-${resource.color}-500/30`}>
                        <resource.icon className={`h-5 w-5 text-${resource.color}-400`} />
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
                ))}
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
