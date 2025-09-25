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
import { TrendingUp, TrendingDown, Target, Download, Mail, Phone, MessageSquare, DollarSign } from "lucide-react"
import { SubtleBackground } from "@/components/subtle-background"

export default function ConversionsAnalyticsPage() {
  const conversionData = [
    {
      channel: "Contact Form",
      conversions: 234,
      rate: "2.4%",
      change: "+15.2%",
      trend: "up",
      value: 46800,
    },
    {
      channel: "Email Campaigns",
      conversions: 189,
      rate: "3.1%",
      change: "+8.7%",
      trend: "up",
      value: 37800,
    },
    {
      channel: "Phone Calls",
      conversions: 67,
      rate: "1.8%",
      change: "-2.3%",
      trend: "down",
      value: 13400,
    },
    {
      channel: "Live Chat",
      conversions: 145,
      rate: "4.2%",
      change: "+22.1%",
      trend: "up",
      value: 29000,
    },
    {
      channel: "Social Media",
      conversions: 98,
      rate: "1.2%",
      change: "+5.4%",
      trend: "up",
      value: 19600,
    },
  ]

  const funnelData = [
    { stage: "Visitors", count: 100000, percentage: 100 },
    { stage: "Leads", count: 25000, percentage: 25 },
    { stage: "Qualified", count: 7500, percentage: 7.5 },
    { stage: "Proposals", count: 2250, percentage: 2.25 },
    { stage: "Closed Won", count: 675, percentage: 0.675 },
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
                <BreadcrumbPage className="zyphex-heading">Conversions</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold zyphex-heading">Conversion Analytics</h1>
              <p className="text-lg zyphex-subheading">Track and optimize your conversion rates across all channels</p>
            </div>
            <Button className="zyphex-button-primary hover-zyphex-lift">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Conversion Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Total Conversions</CardTitle>
              <Target className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">733</div>
              <p className="text-xs zyphex-subheading flex items-center">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                +12.5% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">2.8%</div>
              <p className="text-xs zyphex-subheading flex items-center">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                +0.3% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">$146,600</div>
              <p className="text-xs zyphex-subheading flex items-center">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                +18.2% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Avg. Deal Size</CardTitle>
              <Target className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">$200</div>
              <p className="text-xs zyphex-subheading flex items-center">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                +5.4% from last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Conversion Channels */}
        <Card className="zyphex-card hover-zyphex-lift">
          <CardHeader>
            <CardTitle className="zyphex-heading">Conversion by Channel</CardTitle>
            <CardDescription className="zyphex-subheading">
              Performance breakdown across different conversion channels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {conversionData.map((channel, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      {channel.channel === 'Contact Form' && <MessageSquare className="h-5 w-5 text-blue-400" />}
                      {channel.channel === 'Email Campaigns' && <Mail className="h-5 w-5 text-blue-400" />}
                      {channel.channel === 'Phone Calls' && <Phone className="h-5 w-5 text-blue-400" />}
                      {channel.channel === 'Live Chat' && <MessageSquare className="h-5 w-5 text-blue-400" />}
                      {channel.channel === 'Social Media' && <Target className="h-5 w-5 text-blue-400" />}
                    </div>
                    <div>
                      <p className="font-medium zyphex-heading">{channel.channel}</p>
                      <p className="text-sm zyphex-subheading">{channel.conversions} conversions • {channel.rate} rate</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className={`flex items-center ${
                        channel.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {channel.trend === 'up' ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {channel.change}
                      </Badge>
                      <div className="text-right">
                        <p className="font-medium zyphex-heading">${channel.value.toLocaleString()}</p>
                        <p className="text-xs zyphex-subheading">revenue</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Conversion Funnel */}
        <Card className="zyphex-card hover-zyphex-lift">
          <CardHeader>
            <CardTitle className="zyphex-heading">Conversion Funnel</CardTitle>
            <CardDescription className="zyphex-subheading">
              Track the customer journey from visitor to conversion
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {funnelData.map((stage, index) => (
                <div key={index} className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium zyphex-heading">{stage.stage}</p>
                        <p className="text-sm zyphex-subheading">{stage.count.toLocaleString()} ({stage.percentage}%)</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium zyphex-heading">{stage.percentage}%</p>
                    </div>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-3 mb-4">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${stage.percentage}%` }}
                    ></div>
                  </div>
                  {index < funnelData.length - 1 && (
                    <div className="flex justify-center mb-4">
                      <div className="w-0.5 h-8 bg-slate-600"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Conversion Goals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader>
              <CardTitle className="zyphex-heading">Top Converting Pages</CardTitle>
              <CardDescription className="zyphex-subheading">
                Pages that drive the most conversions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { page: "/services", conversions: 145, rate: "3.2%" },
                  { page: "/contact", conversions: 98, rate: "4.1%" },
                  { page: "/about", conversions: 67, rate: "2.8%" },
                  { page: "/updates", conversions: 45, rate: "1.9%" },
                ].map((page, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium zyphex-heading">{page.page}</p>
                      <p className="text-sm zyphex-subheading">{page.conversions} conversions</p>
                    </div>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      {page.rate} rate
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader>
              <CardTitle className="zyphex-heading">Device Performance</CardTitle>
              <CardDescription className="zyphex-subheading">
                Conversion rates by device type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { device: "Desktop", conversions: 423, rate: "3.1%", change: "+5.2%" },
                  { device: "Mobile", conversions: 245, rate: "2.4%", change: "+8.7%" },
                  { device: "Tablet", conversions: 65, rate: "2.8%", change: "-1.3%" },
                ].map((device, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                    <div>
                      <p className="font-medium zyphex-heading">{device.device}</p>
                      <p className="text-sm zyphex-subheading">{device.conversions} conversions</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="text-green-600 mb-1">
                        {device.rate} rate
                      </Badge>
                      <p className="text-xs zyphex-subheading">{device.change}</p>
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
