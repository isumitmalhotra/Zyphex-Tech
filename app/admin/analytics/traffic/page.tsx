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
import { TrendingUp, TrendingDown, Users, Clock, Download, Eye, MousePointer } from "lucide-react"
import { SubtleBackground } from "@/components/subtle-background"

export default function TrafficAnalyticsPage() {
  const trafficData = [
    {
      source: "Organic Search",
      visitors: 45230,
      change: "+12.5%",
      trend: "up",
      percentage: 45.2,
    },
    {
      source: "Direct",
      visitors: 28940,
      change: "+8.3%",
      trend: "up",
      percentage: 28.9,
    },
    {
      source: "Social Media",
      visitors: 15670,
      change: "+15.7%",
      trend: "up",
      percentage: 15.7,
    },
    {
      source: "Email",
      visitors: 8940,
      change: "-2.1%",
      trend: "down",
      percentage: 8.9,
    },
    {
      source: "Referral",
      visitors: 1320,
      change: "+5.4%",
      trend: "up",
      percentage: 1.3,
    },
  ]

  const pageViews = [
    { page: "/services", views: 15420, bounce: "32%" },
    { page: "/about", views: 12890, bounce: "28%" },
    { page: "/contact", views: 9870, bounce: "45%" },
    { page: "/updates", views: 7650, bounce: "38%" },
    { page: "/", views: 23410, bounce: "25%" },
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
                <BreadcrumbPage className="zyphex-heading">Traffic</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold zyphex-heading">Traffic Analytics</h1>
              <p className="text-lg zyphex-subheading">Monitor your website traffic sources and user behavior</p>
            </div>
            <Button className="zyphex-button-primary hover-zyphex-lift">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Traffic Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Total Visitors</CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">99,100</div>
              <p className="text-xs zyphex-subheading flex items-center">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                +12.5% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Page Views</CardTitle>
              <Eye className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">234,340</div>
              <p className="text-xs zyphex-subheading flex items-center">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                +8.3% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Avg. Session</CardTitle>
              <Clock className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">4m 32s</div>
              <p className="text-xs zyphex-subheading flex items-center">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                +15.7% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Bounce Rate</CardTitle>
              <MousePointer className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">32.4%</div>
              <p className="text-xs zyphex-subheading flex items-center">
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                -2.1% from last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Traffic Sources */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader>
              <CardTitle className="zyphex-heading">Traffic Sources</CardTitle>
              <CardDescription className="zyphex-subheading">
                Breakdown of visitors by source
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trafficData.map((source, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <div>
                        <p className="font-medium zyphex-heading">{source.source}</p>
                        <p className="text-sm zyphex-subheading">{source.visitors.toLocaleString()} visitors</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className={`flex items-center ${
                        source.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {source.trend === 'up' ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {source.change}
                      </Badge>
                      <p className="text-xs zyphex-subheading mt-1">{source.percentage}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader>
              <CardTitle className="zyphex-heading">Top Pages</CardTitle>
              <CardDescription className="zyphex-subheading">
                Most visited pages and their performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pageViews.map((page, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium zyphex-heading">{page.page}</p>
                      <p className="text-sm zyphex-subheading">{page.views.toLocaleString()} views</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-orange-600 border-orange-600">
                        {page.bounce} bounce
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Geographic Data */}
        <Card className="zyphex-card hover-zyphex-lift">
          <CardHeader>
            <CardTitle className="zyphex-heading">Geographic Distribution</CardTitle>
            <CardDescription className="zyphex-subheading">
              Visitors by country and region
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { country: "United States", visitors: 45230, flag: "🇺🇸" },
                { country: "United Kingdom", visitors: 12890, flag: "🇬🇧" },
                { country: "Canada", visitors: 9870, flag: "🇨🇦" },
                { country: "Germany", visitors: 7650, flag: "🇩🇪" },
                { country: "Australia", visitors: 5430, flag: "🇦🇺" },
                { country: "France", visitors: 3210, flag: "🇫🇷" },
              ].map((location, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{location.flag}</span>
                    <div>
                      <p className="font-medium zyphex-heading">{location.country}</p>
                      <p className="text-sm zyphex-subheading">{location.visitors.toLocaleString()} visitors</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="w-16 bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${(location.visitors / 45230) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
