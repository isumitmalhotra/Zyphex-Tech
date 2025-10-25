"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { SubtleBackground } from "@/components/subtle-background"
import {
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  Clock,
  MousePointer,
  Download,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  MapPin,
  Languages,
  Chrome,
  ArrowUpRight,
  ArrowDownRight,
  Share2
} from "lucide-react"

export default function SuperAdminTrafficAnalyticsPage() {
  const [dateRange, setDateRange] = useState("30")

  // Traffic Overview Metrics
  const trafficMetrics = [
    {
      title: "Total Page Views",
      value: "2,543,890",
      change: "+15.3%",
      trend: "up",
      icon: Eye,
      description: "Total page views this month"
    },
    {
      title: "Unique Visitors",
      value: "845,230",
      change: "+12.8%",
      trend: "up",
      icon: Users,
      description: "Unique visitors this month"
    },
    {
      title: "Bounce Rate",
      value: "32.4%",
      change: "-5.2%",
      trend: "down",
      icon: MousePointer,
      description: "Average bounce rate"
    },
    {
      title: "Avg. Session",
      value: "4m 35s",
      change: "+23s",
      trend: "up",
      icon: Clock,
      description: "Average session duration"
    }
  ]

  // Traffic Sources Data
  const trafficSources = [
    {
      source: "Organic Search",
      visitors: 385420,
      sessions: 452890,
      bounceRate: "28.5%",
      avgDuration: "5m 12s",
      change: "+15.7%",
      trend: "up",
      percentage: 45.6
    },
    {
      source: "Direct Traffic",
      visitors: 245820,
      sessions: 289630,
      bounceRate: "31.2%",
      avgDuration: "4m 45s",
      change: "+8.3%",
      trend: "up",
      percentage: 29.1
    },
    {
      source: "Social Media",
      visitors: 134650,
      sessions: 167280,
      bounceRate: "42.8%",
      avgDuration: "3m 18s",
      change: "+22.4%",
      trend: "up",
      percentage: 15.9
    },
    {
      source: "Referral Links",
      visitors: 52340,
      sessions: 64120,
      bounceRate: "35.6%",
      avgDuration: "4m 02s",
      change: "+6.1%",
      trend: "up",
      percentage: 6.2
    },
    {
      source: "Email Campaigns",
      visitors: 27020,
      sessions: 32170,
      bounceRate: "38.9%",
      avgDuration: "3m 47s",
      change: "-2.3%",
      trend: "down",
      percentage: 3.2
    }
  ]

  // Search Engine Traffic
  const searchEngines = [
    { name: "Google", traffic: 352410, percentage: 91.4, change: "+14.2%" },
    { name: "Bing", traffic: 18920, percentage: 4.9, change: "+22.8%" },
    { name: "Yahoo", traffic: 8450, percentage: 2.2, change: "+8.1%" },
    { name: "DuckDuckGo", traffic: 3280, percentage: 0.9, change: "+45.3%" },
    { name: "Other", traffic: 2360, percentage: 0.6, change: "+12.7%" }
  ]

  // Social Media Traffic
  const socialTraffic = [
    { platform: "LinkedIn", visitors: 56780, change: "+28.4%", trend: "up" },
    { platform: "Twitter", visitors: 34560, change: "+15.2%", trend: "up" },
    { platform: "Facebook", visitors: 28340, change: "+12.7%", trend: "up" },
    { platform: "Instagram", visitors: 10450, change: "+35.6%", trend: "up" },
    { platform: "YouTube", visitors: 4520, change: "+8.9%", trend: "up" }
  ]

  // Geographic Analytics
  const topCountries = [
    { country: "United States", flag: "🇺🇸", visitors: 342890, percentage: 40.6, change: "+12.3%" },
    { country: "United Kingdom", flag: "🇬🇧", visitors: 127840, percentage: 15.1, change: "+8.9%" },
    { country: "Canada", flag: "🇨🇦", visitors: 89450, percentage: 10.6, change: "+15.2%" },
    { country: "Germany", flag: "🇩🇪", visitors: 67230, percentage: 8.0, change: "+18.7%" },
    { country: "Australia", flag: "🇦🇺", visitors: 54620, percentage: 6.5, change: "+11.4%" },
    { country: "India", flag: "🇮🇳", visitors: 45780, percentage: 5.4, change: "+42.8%" },
    { country: "France", flag: "🇫🇷", visitors: 38920, percentage: 4.6, change: "+9.2%" },
    { country: "Netherlands", flag: "🇳🇱", visitors: 27450, percentage: 3.2, change: "+14.5%" },
    { country: "Singapore", flag: "🇸🇬", visitors: 23410, percentage: 2.8, change: "+25.3%" },
    { country: "Japan", flag: "🇯🇵", visitors: 19840, percentage: 2.3, change: "+7.6%" }
  ]

  // Top Cities
  const topCities = [
    { city: "New York", country: "USA", visitors: 87650 },
    { city: "London", country: "UK", visitors: 65430 },
    { city: "Toronto", country: "Canada", visitors: 43280 },
    { city: "Sydney", country: "Australia", visitors: 38920 },
    { city: "San Francisco", country: "USA", visitors: 34560 },
    { city: "Berlin", country: "Germany", visitors: 29870 }
  ]

  // Language Preferences
  const languages = [
    { language: "English", code: "en", visitors: 654320, percentage: 77.4 },
    { language: "German", code: "de", visitors: 67230, percentage: 8.0 },
    { language: "French", code: "fr", visitors: 45680, percentage: 5.4 },
    { language: "Spanish", code: "es", visitors: 34220, percentage: 4.0 },
    { language: "Chinese", code: "zh", visitors: 23450, percentage: 2.8 },
    { language: "Other", code: "other", visitors: 20330, percentage: 2.4 }
  ]

  // Device Analytics
  const deviceBreakdown = [
    {
      device: "Desktop",
      icon: Monitor,
      visitors: 512340,
      percentage: 60.6,
      avgDuration: "5m 42s",
      bounceRate: "28.3%",
      change: "+8.2%"
    },
    {
      device: "Mobile",
      icon: Smartphone,
      visitors: 287650,
      percentage: 34.0,
      avgDuration: "3m 18s",
      bounceRate: "38.7%",
      change: "+18.5%"
    },
    {
      device: "Tablet",
      icon: Tablet,
      visitors: 45240,
      percentage: 5.4,
      avgDuration: "4m 26s",
      bounceRate: "32.1%",
      change: "+12.3%"
    }
  ]

  // Browser Statistics
  const browsers = [
    { name: "Chrome", icon: Chrome, users: 523890, percentage: 62.0, change: "+10.2%" },
    { name: "Safari", icon: Globe, users: 186540, percentage: 22.1, change: "+15.8%" },
    { name: "Firefox", icon: Globe, users: 75420, percentage: 8.9, change: "+5.3%" },
    { name: "Edge", icon: Chrome, users: 42380, percentage: 5.0, change: "+22.4%" },
    { name: "Other", icon: Globe, users: 16990, percentage: 2.0, change: "+7.1%" }
  ]

  // Operating Systems
  const operatingSystems = [
    { os: "Windows", users: 428340, percentage: 50.7, change: "+8.9%" },
    { os: "macOS", users: 253680, percentage: 30.0, change: "+15.2%" },
    { os: "iOS", users: 101470, percentage: 12.0, change: "+18.7%" },
    { os: "Android", users: 50890, percentage: 6.0, change: "+23.4%" },
    { os: "Linux", users: 10850, percentage: 1.3, change: "+12.8%" }
  ]

  // Top Pages
  const topPages = [
    { page: "/", views: 456890, bounce: "25.3%", avgTime: "6m 12s", exitRate: "32.4%" },
    { page: "/services", views: 328450, bounce: "31.7%", avgTime: "5m 45s", exitRate: "42.1%" },
    { page: "/about", views: 245680, bounce: "28.9%", avgTime: "4m 33s", exitRate: "38.7%" },
    { page: "/contact", views: 187290, bounce: "45.2%", avgTime: "2m 18s", exitRate: "68.9%" },
    { page: "/blog", views: 156740, bounce: "35.6%", avgTime: "7m 42s", exitRate: "45.3%" },
    { page: "/portfolio", views: 134520, bounce: "33.2%", avgTime: "5m 28s", exitRate: "41.8%" }
  ]

  // Export functionality
  const handleExport = (format: string) => {
    const data = topPages
    const timestamp = new Date().toISOString().split('T')[0]
    
    if (format === 'csv') {
      // Convert to CSV
      const headers = ['Page', 'Views', 'Bounce Rate', 'Avg Time', 'Exit Rate']
      const csvContent = [
        headers.join(','),
        ...data.map((row: { page: string; views: number; bounce: string; avgTime: string; exitRate: string }) => [
          row.page,
          row.views,
          row.bounce,
          row.avgTime,
          row.exitRate
        ].join(','))
      ].join('\n')
      
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `traffic-analytics-${timestamp}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } else if (format === 'json') {
      // Convert to JSON
      const jsonContent = JSON.stringify({ 
        exportDate: new Date().toISOString(),
        topPages: data,
        browsers,
        operatingSystems
      }, null, 2)
      
      const blob = new Blob([jsonContent], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `traffic-analytics-${timestamp}.json`
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
              <h1 className="text-4xl font-bold zyphex-heading mb-2">Traffic Analytics</h1>
              <p className="text-lg zyphex-subheading">
                Comprehensive website traffic and visitor behavior analysis
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[180px] zyphex-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="zyphex-dropdown">
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
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

          {/* Traffic Overview Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {trafficMetrics.map((metric, index) => (
              <Card key={index} className="zyphex-card hover-zyphex-lift transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30">
                      <metric.icon className="h-6 w-6 text-blue-400" />
                    </div>
                    <Badge variant="outline" className={`${
                      metric.trend === "up" 
                        ? "bg-green-500/20 text-green-400 border-green-500/30" 
                        : "bg-red-500/20 text-red-400 border-red-500/30"
                    }`}>
                      {metric.trend === "up" ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                      {metric.change}
                    </Badge>
                  </div>
                  <h3 className="text-sm zyphex-subheading mb-1">{metric.title}</h3>
                  <p className="text-3xl font-bold zyphex-heading mb-1">{metric.value}</p>
                  <p className="text-xs zyphex-subheading">{metric.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Traffic Sources */}
          <Card className="zyphex-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="zyphex-heading">Traffic Sources</CardTitle>
                  <CardDescription className="zyphex-subheading">
                    Breakdown of traffic by source and channel
                  </CardDescription>
                </div>
                <Share2 className="h-5 w-5 text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trafficSources.map((source, index) => (
                  <div key={index} className="p-4 rounded-lg zyphex-glass-effect hover-zyphex-lift transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <span className="font-semibold zyphex-heading">{source.source}</span>
                          <span className="text-sm zyphex-subheading">{source.visitors.toLocaleString()} visitors</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className={`${
                          source.trend === "up" 
                            ? "bg-green-500/20 text-green-400 border-green-500/30" 
                            : "bg-red-500/20 text-red-400 border-red-500/30"
                        }`}>
                          {source.trend === "up" ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                          {source.change}
                        </Badge>
                        <span className="text-sm font-medium zyphex-heading">{source.percentage}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-800/50 rounded-full h-2 mb-3">
                      <div 
                        className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                        style={{ width: `${source.percentage}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="zyphex-subheading">Sessions:</span>
                        <span className="ml-2 zyphex-heading font-medium">{source.sessions.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="zyphex-subheading">Bounce:</span>
                        <span className="ml-2 zyphex-heading font-medium">{source.bounceRate}</span>
                      </div>
                      <div>
                        <span className="zyphex-subheading">Avg Duration:</span>
                        <span className="ml-2 zyphex-heading font-medium">{source.avgDuration}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Search Engines and Social Media */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Search Engine Traffic */}
            <Card className="zyphex-card">
              <CardHeader>
                <CardTitle className="zyphex-heading">Search Engine Traffic</CardTitle>
                <CardDescription className="zyphex-subheading">
                  Organic search traffic by search engine
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {searchEngines.map((engine, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-800/30">
                      <div className="flex items-center gap-3">
                        <Globe className="h-5 w-5 text-blue-400" />
                        <div>
                          <p className="font-medium zyphex-heading">{engine.name}</p>
                          <p className="text-sm zyphex-subheading">{engine.traffic.toLocaleString()} visits</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30 mb-1">
                          {engine.percentage}%
                        </Badge>
                        <p className="text-xs text-green-400">{engine.change}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Social Media Traffic */}
            <Card className="zyphex-card">
              <CardHeader>
                <CardTitle className="zyphex-heading">Social Media Traffic</CardTitle>
                <CardDescription className="zyphex-subheading">
                  Traffic from social media platforms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {socialTraffic.map((social, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-800/30">
                      <div className="flex items-center gap-3">
                        <Share2 className="h-5 w-5 text-purple-400" />
                        <div>
                          <p className="font-medium zyphex-heading">{social.platform}</p>
                          <p className="text-sm zyphex-subheading">{social.visitors.toLocaleString()} visitors</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={`${
                        social.trend === "up"
                          ? "bg-green-500/20 text-green-400 border-green-500/30"
                          : "bg-red-500/20 text-red-400 border-red-500/30"
                      }`}>
                        {social.trend === "up" ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                        {social.change}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Geographic Analytics */}
          <Card className="zyphex-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="zyphex-heading">Geographic Distribution</CardTitle>
                  <CardDescription className="zyphex-subheading">
                    Top countries and cities by visitor count
                  </CardDescription>
                </div>
                <MapPin className="h-5 w-5 text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Countries */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold zyphex-heading mb-4">Top Countries</h3>
                  {topCountries.map((country, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-800/30">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{country.flag}</span>
                        <div>
                          <p className="font-medium zyphex-heading">{country.country}</p>
                          <p className="text-sm zyphex-subheading">{country.visitors.toLocaleString()} visitors</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30 mb-1">
                          {country.percentage}%
                        </Badge>
                        <p className="text-xs text-green-400">{country.change}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Top Cities */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold zyphex-heading mb-4">Top Cities</h3>
                  {topCities.map((city, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-800/30">
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-green-400" />
                        <div>
                          <p className="font-medium zyphex-heading">{city.city}</p>
                          <p className="text-sm zyphex-subheading">{city.country}</p>
                        </div>
                      </div>
                      <p className="font-medium zyphex-heading">{city.visitors.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Language Preferences */}
          <Card className="zyphex-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="zyphex-heading">Language Preferences</CardTitle>
                  <CardDescription className="zyphex-subheading">
                    Visitor distribution by preferred language
                  </CardDescription>
                </div>
                <Languages className="h-5 w-5 text-cyan-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {languages.map((lang, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-gray-500/20 text-gray-400 border-gray-500/30">
                          {lang.code}
                        </Badge>
                        <span className="font-medium zyphex-heading">{lang.language}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm zyphex-subheading">{lang.visitors.toLocaleString()} visitors</span>
                        <span className="font-medium zyphex-heading">{lang.percentage}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-800/50 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                        style={{ width: `${lang.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Device Analytics */}
          <Card className="zyphex-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="zyphex-heading">Device Analytics</CardTitle>
                  <CardDescription className="zyphex-subheading">
                    Traffic breakdown by device type with performance metrics
                  </CardDescription>
                </div>
                <Monitor className="h-5 w-5 text-orange-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {deviceBreakdown.map((device, index) => (
                  <div key={index} className="p-4 rounded-lg zyphex-glass-effect">
                    <div className="flex items-center justify-between mb-4">
                      <device.icon className="h-8 w-8 text-orange-400" />
                      <Badge variant="outline" className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                        {device.percentage}%
                      </Badge>
                    </div>
                    <h3 className="text-lg font-semibold zyphex-heading mb-2">{device.device}</h3>
                    <p className="text-2xl font-bold zyphex-heading mb-4">{device.visitors.toLocaleString()}</p>
                    <Separator className="my-4 bg-gray-800/50" />
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="zyphex-subheading">Avg Duration:</span>
                        <span className="zyphex-heading font-medium">{device.avgDuration}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="zyphex-subheading">Bounce Rate:</span>
                        <span className="zyphex-heading font-medium">{device.bounceRate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="zyphex-subheading">Change:</span>
                        <span className="text-green-400 font-medium">{device.change}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Browser and OS Statistics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Browser Statistics */}
            <Card className="zyphex-card">
              <CardHeader>
                <CardTitle className="zyphex-heading">Browser Statistics</CardTitle>
                <CardDescription className="zyphex-subheading">
                  Visitor distribution by browser
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {browsers.map((browser, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-800/30">
                      <div className="flex items-center gap-3">
                        <browser.icon className="h-5 w-5 text-blue-400" />
                        <div>
                          <p className="font-medium zyphex-heading">{browser.name}</p>
                          <p className="text-sm zyphex-subheading">{browser.users.toLocaleString()} users</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30 mb-1">
                          {browser.percentage}%
                        </Badge>
                        <p className="text-xs text-green-400">{browser.change}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Operating System Statistics */}
            <Card className="zyphex-card">
              <CardHeader>
                <CardTitle className="zyphex-heading">Operating Systems</CardTitle>
                <CardDescription className="zyphex-subheading">
                  Visitor distribution by OS
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {operatingSystems.map((os, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-800/30">
                      <div className="flex items-center gap-3">
                        <Monitor className="h-5 w-5 text-purple-400" />
                        <div>
                          <p className="font-medium zyphex-heading">{os.os}</p>
                          <p className="text-sm zyphex-subheading">{os.users.toLocaleString()} users</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30 mb-1">
                          {os.percentage}%
                        </Badge>
                        <p className="text-xs text-green-400">{os.change}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Pages */}
          <Card className="zyphex-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="zyphex-heading">Top Pages</CardTitle>
                  <CardDescription className="zyphex-subheading">
                    Most visited pages with engagement metrics
                  </CardDescription>
                </div>
                <Eye className="h-5 w-5 text-pink-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topPages.map((page, index) => (
                  <div key={index} className="p-4 rounded-lg zyphex-glass-effect hover-zyphex-lift transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold zyphex-heading mb-1">{page.page}</p>
                        <p className="text-sm zyphex-subheading">{page.views.toLocaleString()} page views</p>
                      </div>
                      <Badge variant="outline" className="bg-pink-500/20 text-pink-400 border-pink-500/30">
                        #{index + 1}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="zyphex-subheading">Bounce Rate:</span>
                        <span className="ml-2 zyphex-heading font-medium">{page.bounce}</span>
                      </div>
                      <div>
                        <span className="zyphex-subheading">Avg Time:</span>
                        <span className="ml-2 zyphex-heading font-medium">{page.avgTime}</span>
                      </div>
                      <div>
                        <span className="zyphex-subheading">Exit Rate:</span>
                        <span className="ml-2 zyphex-heading font-medium">{page.exitRate}</span>
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
