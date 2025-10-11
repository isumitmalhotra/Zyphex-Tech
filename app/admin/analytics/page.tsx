"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, TrendingUp, TrendingDown, Users, Globe, Clock, Target, Download, Calendar, AlertTriangle, Activity } from "lucide-react"
import { SubtleBackground } from "@/components/subtle-background"
import { ErrorAnalyticsDashboard } from "@/components/analytics/ErrorAnalyticsDashboard"

export default function AnalyticsPage() {
  const metrics = [
    {
      title: "Website Traffic",
      value: "45,231",
      change: "+12.5%",
      trend: "up",
      icon: Globe,
      period: "This month",
    },
    {
      title: "Conversion Rate",
      value: "3.24%",
      change: "+0.8%",
      trend: "up",
      icon: Target,
      period: "This month",
    },
    {
      title: "Avg. Session Duration",
      value: "4m 32s",
      change: "-0.3%",
      trend: "down",
      icon: Clock,
      period: "This month",
    },
    {
      title: "Active Users",
      value: "12,543",
      change: "+18.2%",
      trend: "up",
      icon: Users,
      period: "This month",
    },
  ]

  const trafficSources = [
    { source: "Organic Search", visitors: 18420, percentage: 40.8, color: "bg-blue-500" },
    { source: "Direct", visitors: 12650, percentage: 28.0, color: "bg-green-500" },
    { source: "Social Media", visitors: 8930, percentage: 19.8, color: "bg-purple-500" },
    { source: "Referral", visitors: 3420, percentage: 7.6, color: "bg-orange-500" },
    { source: "Email", visitors: 1811, percentage: 4.0, color: "bg-pink-500" },
  ]

  const topPages = [
    { page: "/services", views: 8420, bounce: "32%", duration: "5m 12s" },
    { page: "/", views: 7230, bounce: "28%", duration: "4m 45s" },
    { page: "/about", views: 5640, bounce: "35%", duration: "3m 22s" },
    { page: "/contact", views: 4120, bounce: "42%", duration: "2m 18s" },
    { page: "/updates", views: 3890, bounce: "38%", duration: "6m 05s" },
  ]

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
      <SubtleBackground />

      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 relative z-10">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1 zyphex-button-secondary hover-zyphex-glow" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/admin" className="zyphex-subheading hover:text-white">
                  Admin
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage className="zyphex-heading">Analytics</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold zyphex-heading">Analytics Overview</h1>
            <p className="zyphex-subheading">Track your website performance and user engagement metrics.</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" className="zyphex-button-secondary bg-transparent">
              <Calendar className="mr-2 h-4 w-4" />
              Last 30 days
            </Button>
            <Button size="sm" className="zyphex-button-primary hover-zyphex-lift">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Analytics Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Website Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="errors" className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4" />
              <span>Error Analytics</span>
            </TabsTrigger>
          </TabsList>

          {/* Website Analytics Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {metrics.map((metric, index) => (
                <Card key={index} className="zyphex-card hover-zyphex-lift">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium zyphex-heading">{metric.title}</CardTitle>
                    <metric.icon className="h-4 w-4 zyphex-accent-text animate-pulse-3d" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold zyphex-heading">{metric.value}</div>
                    <div className="flex items-center space-x-2 text-xs">
                      {metric.trend === "up" ? (
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-500" />
                      )}
                      <span className={`font-medium ${metric.trend === "up" ? "text-green-500" : "text-red-500"}`}>
                        {metric.change}
                      </span>
                      <span className="zyphex-subheading">{metric.period}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Traffic Sources */}
              <Card className="zyphex-card hover-zyphex-lift">
                <CardHeader>
                  <CardTitle className="zyphex-heading">Traffic Sources</CardTitle>
                  <CardDescription className="zyphex-subheading">Where your visitors are coming from</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {trafficSources.map((source, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${source.color} animate-zyphex-glow`}></div>
                          <span className="text-sm font-medium zyphex-heading">{source.source}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm zyphex-subheading">{source.visitors.toLocaleString()}</span>
                          <Badge variant="secondary" className="text-xs">
                            {source.percentage}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Pages */}
              <Card className="zyphex-card hover-zyphex-lift">
                <CardHeader>
                  <CardTitle className="zyphex-heading">Top Pages</CardTitle>
                  <CardDescription className="zyphex-subheading">Most visited pages on your website</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topPages.map((page, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg zyphex-glass-effect">
                        <div className="space-y-1">
                          <span className="text-sm font-medium zyphex-heading">{page.page}</span>
                          <div className="flex items-center space-x-4 text-xs zyphex-subheading">
                            <span>{page.views.toLocaleString()} views</span>
                            <span>Bounce: {page.bounce}</span>
                            <span>Avg: {page.duration}</span>
                          </div>
                        </div>
                        <BarChart3 className="h-4 w-4 zyphex-accent-text" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Error Analytics Tab */}
          <TabsContent value="errors" className="space-y-6">
            <ErrorAnalyticsDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
