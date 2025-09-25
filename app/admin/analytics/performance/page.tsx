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
import { TrendingUp, TrendingDown, Zap, Download, Globe, Smartphone, Monitor } from "lucide-react"
import { SubtleBackground } from "@/components/subtle-background"

export default function PerformanceAnalyticsPage() {
  const performanceMetrics = [
    {
      metric: "Page Load Time",
      value: "2.3s",
      change: "-0.4s",
      trend: "up",
      status: "good",
    },
    {
      metric: "First Contentful Paint",
      value: "1.2s",
      change: "-0.2s",
      trend: "up",
      status: "good",
    },
    {
      metric: "Largest Contentful Paint",
      value: "3.1s",
      change: "+0.1s",
      trend: "down",
      status: "warning",
    },
    {
      metric: "Cumulative Layout Shift",
      value: "0.08",
      change: "-0.02",
      trend: "up",
      status: "good",
    },
  ]

  const pagePerformance = [
    { page: "/", loadTime: "1.8s", score: 95, status: "good" },
    { page: "/services", loadTime: "2.1s", score: 88, status: "good" },
    { page: "/contact", loadTime: "2.5s", score: 82, status: "warning" },
    { page: "/about", loadTime: "3.2s", score: 75, status: "warning" },
    { page: "/dashboard", loadTime: "4.1s", score: 68, status: "poor" },
  ]

  const devicePerformance = [
    { device: "Desktop", avgLoadTime: "2.1s", score: 92 },
    { device: "Mobile", avgLoadTime: "2.8s", score: 78 },
    { device: "Tablet", avgLoadTime: "2.4s", score: 85 },
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
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/admin/analytics" className="zyphex-subheading hover:text-white">
                  Analytics
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage className="zyphex-heading">Performance</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold zyphex-heading">Performance Analytics</h1>
              <p className="text-lg zyphex-subheading">Monitor and optimize your website&apos;s performance metrics</p>
            </div>
            <Button className="zyphex-button-primary hover-zyphex-lift">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Core Web Vitals */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {performanceMetrics.map((metric, index) => (
            <Card key={index} className="zyphex-card hover-zyphex-lift">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium zyphex-subheading">{metric.metric}</CardTitle>
                <Zap className={`h-4 w-4 ${
                  metric.status === 'good' ? 'text-green-400' :
                  metric.status === 'warning' ? 'text-yellow-400' : 'text-red-400'
                }`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold zyphex-heading">{metric.value}</div>
                <p className={`text-xs flex items-center ${
                  metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {metric.trend === 'up' ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {metric.change} from last month
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Page Performance */}
        <Card className="zyphex-card hover-zyphex-lift">
          <CardHeader>
            <CardTitle className="zyphex-heading">Page Performance</CardTitle>
            <CardDescription className="zyphex-subheading">
              Load times and performance scores for key pages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pagePerformance.map((page, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Globe className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium zyphex-heading">{page.page}</p>
                      <p className="text-sm zyphex-subheading">Load time: {page.loadTime}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className={`${
                          page.status === 'good' ? 'text-green-600 border-green-600' :
                          page.status === 'warning' ? 'text-yellow-600 border-yellow-600' :
                          'text-red-600 border-red-600'
                        }`}>
                          {page.score}/100
                        </Badge>
                        <div className="w-20 bg-slate-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                              page.status === 'good' ? 'bg-green-500' :
                              page.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${page.score}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Device Performance */}
        <Card className="zyphex-card hover-zyphex-lift">
          <CardHeader>
            <CardTitle className="zyphex-heading">Device Performance</CardTitle>
            <CardDescription className="zyphex-subheading">
              Performance metrics across different device types
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {devicePerformance.map((device, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      {device.device === 'Desktop' && <Monitor className="h-5 w-5 text-blue-400" />}
                      {device.device === 'Mobile' && <Smartphone className="h-5 w-5 text-blue-400" />}
                      {device.device === 'Tablet' && <Monitor className="h-5 w-5 text-blue-400" />}
                    </div>
                    <div>
                      <p className="font-medium zyphex-heading">{device.device}</p>
                      <p className="text-sm zyphex-subheading">Avg load time: {device.avgLoadTime}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className={`${
                          device.score >= 90 ? 'text-green-600 border-green-600' :
                          device.score >= 80 ? 'text-yellow-600 border-yellow-600' :
                          'text-red-600 border-red-600'
                        }`}>
                          {device.score}/100
                        </Badge>
                        <div className="w-20 bg-slate-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                              device.score >= 90 ? 'bg-green-500' :
                              device.score >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${device.score}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader>
              <CardTitle className="zyphex-heading">Optimization Opportunities</CardTitle>
              <CardDescription className="zyphex-subheading">
                Areas for performance improvement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    issue: "Large image files",
                    impact: "High",
                    savings: "2.1s",
                    description: "Compress and optimize images for faster loading"
                  },
                  {
                    issue: "Unused JavaScript",
                    impact: "Medium",
                    savings: "0.8s",
                    description: "Remove unused code and dependencies"
                  },
                  {
                    issue: "Render-blocking resources",
                    impact: "Medium",
                    savings: "0.6s",
                    description: "Optimize CSS delivery and JavaScript loading"
                  },
                  {
                    issue: "Slow server response",
                    impact: "Low",
                    savings: "0.3s",
                    description: "Consider upgrading hosting or optimizing database queries"
                  },
                ].map((opportunity, index) => (
                  <div key={index} className="p-4 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium zyphex-heading">{opportunity.issue}</h4>
                      <Badge variant="outline" className={`${
                        opportunity.impact === 'High' ? 'text-red-600 border-red-600' :
                        opportunity.impact === 'Medium' ? 'text-yellow-600 border-yellow-600' :
                        'text-green-600 border-green-600'
                      }`}>
                        {opportunity.impact}
                      </Badge>
                    </div>
                    <p className="text-sm zyphex-subheading mb-2">{opportunity.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm zyphex-subheading">Potential savings:</span>
                      <Badge variant="secondary" className="text-green-600">
                        {opportunity.savings}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader>
              <CardTitle className="zyphex-heading">Performance Timeline</CardTitle>
              <CardDescription className="zyphex-subheading">
                Performance trends over the last 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { date: "Today", loadTime: "2.3s", change: "-0.1s" },
                  { date: "Yesterday", loadTime: "2.4s", change: "-0.2s" },
                  { date: "2 days ago", loadTime: "2.6s", change: "+0.1s" },
                  { date: "3 days ago", loadTime: "2.5s", change: "-0.3s" },
                  { date: "1 week ago", loadTime: "2.8s", change: "-0.5s" },
                ].map((entry, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                    <div>
                      <p className="font-medium zyphex-heading">{entry.date}</p>
                      <p className="text-sm zyphex-subheading">Load time: {entry.loadTime}</p>
                    </div>
                    <Badge variant="secondary" className={`${
                      entry.change.startsWith('-') ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {entry.change}
                    </Badge>
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
