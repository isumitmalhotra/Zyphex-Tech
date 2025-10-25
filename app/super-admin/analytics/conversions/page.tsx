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
  TrendingUp,
  TrendingDown,
  Target,
  DollarSign,
  Download,
  ArrowRight,
  CheckCircle,
  Clock,
  Mail,
  Phone,
  MessageSquare,
  Calendar,
  Award,
  Star,
  AlertCircle,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Filter
} from "lucide-react"

export default function SuperAdminConversionAnalyticsPage() {
  const [dateRange, setDateRange] = useState("30")
  const [funnelView, setFunnelView] = useState("all")

  // Conversion Metrics Overview
  const conversionMetrics = [
    {
      title: "Conversion Rate",
      value: "3.45%",
      change: "+0.28%",
      trend: "up",
      icon: Target,
      description: "Overall conversion rate",
      color: "blue"
    },
    {
      title: "Total Conversions",
      value: "2,847",
      change: "+342",
      trend: "up",
      icon: CheckCircle,
      description: "This month",
      color: "green"
    },
    {
      title: "Goal Completions",
      value: "4,523",
      change: "+567",
      trend: "up",
      icon: Award,
      description: "All goals achieved",
      color: "purple"
    },
    {
      title: "Conversion Value",
      value: "$428,560",
      change: "+$52,340",
      trend: "up",
      icon: DollarSign,
      description: "Total revenue from conversions",
      color: "orange"
    }
  ]

  // Conversion Funnel Data
  const conversionFunnel = [
    {
      stage: "Visitors",
      count: 82450,
      percentage: 100,
      dropOff: 0,
      conversionRate: "100%",
      color: "from-blue-500 to-blue-600"
    },
    {
      stage: "Page Views",
      count: 65230,
      percentage: 79.1,
      dropOff: 17220,
      conversionRate: "79.1%",
      color: "from-cyan-500 to-cyan-600"
    },
    {
      stage: "Engaged Users",
      count: 34580,
      percentage: 41.9,
      dropOff: 30650,
      conversionRate: "53.0%",
      color: "from-green-500 to-green-600"
    },
    {
      stage: "Form Submissions",
      count: 8920,
      percentage: 10.8,
      dropOff: 25660,
      conversionRate: "25.8%",
      color: "from-yellow-500 to-yellow-600"
    },
    {
      stage: "Qualified Leads",
      count: 4560,
      percentage: 5.5,
      dropOff: 4360,
      conversionRate: "51.1%",
      color: "from-orange-500 to-orange-600"
    },
    {
      stage: "Conversions",
      count: 2847,
      percentage: 3.45,
      dropOff: 1713,
      conversionRate: "62.4%",
      color: "from-red-500 to-red-600"
    }
  ]

  // Goal Completions
  const goals = [
    {
      name: "Contact Form Submission",
      completions: 1245,
      value: "$124,500",
      conversionRate: "2.8%",
      change: "+18.2%",
      trend: "up",
      icon: Mail
    },
    {
      name: "Phone Call Request",
      completions: 678,
      value: "$203,400",
      conversionRate: "1.5%",
      change: "+12.5%",
      trend: "up",
      icon: Phone
    },
    {
      name: "Demo Booking",
      completions: 534,
      value: "$160,200",
      conversionRate: "1.2%",
      change: "+25.8%",
      trend: "up",
      icon: Calendar
    },
    {
      name: "Newsletter Signup",
      completions: 2156,
      value: "$43,120",
      conversionRate: "4.8%",
      change: "+8.9%",
      trend: "up",
      icon: MessageSquare
    },
    {
      name: "Free Trial Started",
      completions: 892,
      value: "$89,200",
      conversionRate: "2.0%",
      change: "+32.4%",
      trend: "up",
      icon: Award
    }
  ]

  // Lead Analytics
  const leadMetrics = [
    {
      title: "Lead Generation Rate",
      value: "10.8%",
      change: "+1.2%",
      trend: "up",
      description: "Visitor to lead conversion"
    },
    {
      title: "Lead Quality Score",
      value: "8.2/10",
      change: "+0.5",
      trend: "up",
      description: "Average lead quality"
    },
    {
      title: "Lead-to-Customer",
      value: "31.9%",
      change: "+4.3%",
      trend: "up",
      description: "Lead conversion rate"
    },
    {
      title: "Avg. Lead Value",
      value: "$3,240",
      change: "+$420",
      trend: "up",
      description: "Per qualified lead"
    }
  ]

  // Lead Sources
  const leadSources = [
    {
      source: "Organic Search",
      leads: 3845,
      conversions: 1234,
      conversionRate: "32.1%",
      value: "$370,260",
      quality: 8.5,
      change: "+15.2%"
    },
    {
      source: "Paid Advertising",
      leads: 2560,
      conversions: 892,
      conversionRate: "34.8%",
      value: "$267,600",
      quality: 9.2,
      change: "+22.4%"
    },
    {
      source: "Social Media",
      leads: 1890,
      conversions: 456,
      conversionRate: "24.1%",
      value: "$136,800",
      quality: 7.8,
      change: "+8.9%"
    },
    {
      source: "Referrals",
      leads: 1234,
      conversions: 678,
      conversionRate: "54.9%",
      value: "$203,400",
      quality: 9.8,
      change: "+32.1%"
    },
    {
      source: "Email Marketing",
      leads: 891,
      conversions: 234,
      conversionRate: "26.3%",
      value: "$70,200",
      quality: 8.1,
      change: "+11.5%"
    },
    {
      source: "Direct Traffic",
      leads: 1500,
      conversions: 353,
      conversionRate: "23.5%",
      value: "$105,900",
      quality: 7.5,
      change: "+6.8%"
    }
  ]

  // Sales Funnel Stages
  const salesFunnel = [
    {
      stage: "Awareness",
      leads: 8920,
      percentage: 100,
      avgTime: "0 days",
      conversionRate: "100%",
      nextStageRate: "68.5%"
    },
    {
      stage: "Interest",
      leads: 6110,
      percentage: 68.5,
      avgTime: "2.3 days",
      conversionRate: "68.5%",
      nextStageRate: "52.3%"
    },
    {
      stage: "Consideration",
      leads: 3195,
      percentage: 35.8,
      avgTime: "5.7 days",
      conversionRate: "52.3%",
      nextStageRate: "61.2%"
    },
    {
      stage: "Intent",
      leads: 1955,
      percentage: 21.9,
      avgTime: "8.4 days",
      conversionRate: "61.2%",
      nextStageRate: "71.8%"
    },
    {
      stage: "Evaluation",
      leads: 1404,
      percentage: 15.7,
      avgTime: "6.2 days",
      conversionRate: "71.8%",
      nextStageRate: "68.9%"
    },
    {
      stage: "Purchase",
      leads: 967,
      percentage: 10.8,
      avgTime: "3.1 days",
      conversionRate: "68.9%",
      nextStageRate: "100%"
    }
  ]

  // Drop-off Analysis
  const dropOffPoints = [
    {
      point: "Landing Page → Engagement",
      dropOff: 17220,
      percentage: "20.9%",
      reason: "High bounce rate",
      impact: "High",
      recommendation: "Optimize landing page content"
    },
    {
      point: "Engagement → Form Start",
      dropOff: 25660,
      percentage: "74.2%",
      reason: "Form friction",
      impact: "Critical",
      recommendation: "Simplify form fields"
    },
    {
      point: "Form → Qualification",
      dropOff: 4360,
      percentage: "48.9%",
      reason: "Low quality leads",
      impact: "Medium",
      recommendation: "Improve lead scoring"
    },
    {
      point: "Qualification → Conversion",
      dropOff: 1713,
      percentage: "37.6%",
      reason: "Sales process friction",
      impact: "High",
      recommendation: "Streamline sales process"
    }
  ]

  // Conversion by Channel
  const channelConversions = [
    { channel: "Website", conversions: 1245, rate: "3.8%", value: "$373,500" },
    { channel: "Mobile App", conversions: 678, rate: "5.2%", value: "$203,400" },
    { channel: "Email", conversions: 534, rate: "2.1%", value: "$160,200" },
    { channel: "Social", conversions: 234, rate: "1.8%", value: "$70,200" },
    { channel: "Other", conversions: 156, rate: "2.4%", value: "$46,800" }
  ]

  // Time-based Conversion Analysis
  const timeAnalysis = [
    { period: "0-24 hours", conversions: 892, percentage: "31.3%", avgValue: "$420" },
    { period: "1-3 days", conversions: 678, percentage: "23.8%", avgValue: "$380" },
    { period: "4-7 days", conversions: 534, percentage: "18.8%", avgValue: "$340" },
    { period: "1-2 weeks", conversions: 423, percentage: "14.9%", avgValue: "$310" },
    { period: "2-4 weeks", conversions: 234, percentage: "8.2%", avgValue: "$280" },
    { period: "1+ month", conversions: 86, percentage: "3.0%", avgValue: "$250" }
  ]

  // Device Performance
  const devicePerformance = [
    {
      device: "Desktop",
      visitors: 45230,
      conversions: 1678,
      rate: "3.7%",
      value: "$503,400",
      change: "+12.3%"
    },
    {
      device: "Mobile",
      visitors: 28940,
      conversions: 892,
      rate: "3.1%",
      value: "$267,600",
      change: "+18.7%"
    },
    {
      device: "Tablet",
      visitors: 8280,
      conversions: 277,
      rate: "3.3%",
      value: "$83,100",
      change: "+8.2%"
    }
  ]

  // Top Converting Pages
  const topPages = [
    { page: "/services", conversions: 567, rate: "4.2%", value: "$170,100" },
    { page: "/pricing", conversions: 489, rate: "5.8%", value: "$146,700" },
    { page: "/contact", conversions: 423, rate: "3.9%", value: "$126,900" },
    { page: "/demo", conversions: 356, rate: "6.4%", value: "$106,800" },
    { page: "/free-trial", conversions: 298, rate: "5.1%", value: "$89,400" }
  ]

  // Export functionality
  const handleExport = (format: string) => {
    console.log(`Exporting conversion analytics as ${format}`)
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
              <h1 className="text-4xl font-bold zyphex-heading mb-2">Conversion Analytics</h1>
              <p className="text-lg zyphex-subheading">
                Track conversion metrics, lead analytics, and sales funnel performance
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

          {/* Conversion Metrics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {conversionMetrics.map((metric, index) => (
              <Card key={index} className="zyphex-card hover-zyphex-lift transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg bg-gradient-to-br from-${metric.color}-500/20 to-${metric.color}-600/20 border border-${metric.color}-500/30`}>
                      <metric.icon className={`h-6 w-6 text-${metric.color}-400`} />
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

          {/* Conversion Funnel Visualization */}
          <Card className="zyphex-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="zyphex-heading">Conversion Funnel</CardTitle>
                  <CardDescription className="zyphex-subheading">
                    Track visitor journey from entry to conversion
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-blue-400" />
                  <Select value={funnelView} onValueChange={setFunnelView}>
                    <SelectTrigger className="w-[150px] zyphex-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="zyphex-dropdown">
                      <SelectItem value="all">All Traffic</SelectItem>
                      <SelectItem value="organic">Organic Only</SelectItem>
                      <SelectItem value="paid">Paid Only</SelectItem>
                      <SelectItem value="social">Social Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {conversionFunnel.map((stage, index) => (
                  <div key={index} className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="bg-gray-500/20 text-gray-400 border-gray-500/30">
                          {index + 1}
                        </Badge>
                        <div>
                          <p className="font-semibold zyphex-heading">{stage.stage}</p>
                          <p className="text-sm zyphex-subheading">
                            {stage.count.toLocaleString()} users • {stage.conversionRate} conversion
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold zyphex-heading">{stage.percentage}%</p>
                        {stage.dropOff > 0 && (
                          <p className="text-sm text-red-400">-{stage.dropOff.toLocaleString()} drop-off</p>
                        )}
                      </div>
                    </div>
                    <div className="relative">
                      <div className="w-full bg-gray-800/50 rounded-full h-8">
                        <div 
                          className={`h-8 rounded-full bg-gradient-to-r ${stage.color} flex items-center justify-center transition-all duration-500`}
                          style={{ width: `${stage.percentage}%` }}
                        >
                          <span className="text-white text-sm font-medium">{stage.count.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    {index < conversionFunnel.length - 1 && (
                      <div className="flex justify-center my-2">
                        <ArrowRight className="h-6 w-6 text-gray-500" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Goal Completions */}
          <Card className="zyphex-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="zyphex-heading">Goal Completions</CardTitle>
                  <CardDescription className="zyphex-subheading">
                    Track specific conversion goals and their performance
                  </CardDescription>
                </div>
                <Award className="h-5 w-5 text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {goals.map((goal, index) => (
                  <div key={index} className="p-4 rounded-lg zyphex-glass-effect hover-zyphex-lift transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500/30">
                          <goal.icon className="h-5 w-5 text-purple-400" />
                        </div>
                        <div>
                          <p className="font-semibold zyphex-heading">{goal.name}</p>
                          <p className="text-sm zyphex-subheading">{goal.completions.toLocaleString()} completions</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30 mb-1">
                          {goal.trend === "up" ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                          {goal.change}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="zyphex-subheading">Conversion Rate:</span>
                        <span className="ml-2 zyphex-heading font-medium">{goal.conversionRate}</span>
                      </div>
                      <div className="text-right">
                        <span className="zyphex-subheading">Value:</span>
                        <span className="ml-2 zyphex-heading font-medium">{goal.value}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Lead Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {leadMetrics.map((metric, index) => (
              <Card key={index} className="zyphex-card hover-zyphex-lift transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium zyphex-subheading">{metric.title}</h3>
                    <Badge variant="outline" className={`${
                      metric.trend === "up"
                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                        : "bg-red-500/20 text-red-400 border-red-500/30"
                    }`}>
                      {metric.change}
                    </Badge>
                  </div>
                  <p className="text-3xl font-bold zyphex-heading mb-1">{metric.value}</p>
                  <p className="text-xs zyphex-subheading">{metric.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Lead Sources */}
          <Card className="zyphex-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="zyphex-heading">Lead Sources</CardTitle>
                  <CardDescription className="zyphex-subheading">
                    Lead generation and conversion by source channel
                  </CardDescription>
                </div>
                <BarChart3 className="h-5 w-5 text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leadSources.map((source, index) => (
                  <div key={index} className="p-4 rounded-lg zyphex-glass-effect hover-zyphex-lift transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold zyphex-heading mb-1">{source.source}</p>
                        <p className="text-sm zyphex-subheading">{source.leads.toLocaleString()} leads generated</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30 mb-1">
                            {source.conversionRate}
                          </Badge>
                          <p className="text-xs text-green-400">{source.change}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                          <span className="text-sm font-medium zyphex-heading">{source.quality}</span>
                        </div>
                      </div>
                    </div>
                    <Separator className="my-3 bg-gray-800/50" />
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="zyphex-subheading">Conversions:</span>
                        <span className="ml-2 zyphex-heading font-medium">{source.conversions.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="zyphex-subheading">Value:</span>
                        <span className="ml-2 zyphex-heading font-medium">{source.value}</span>
                      </div>
                      <div className="text-right">
                        <span className="zyphex-subheading">Quality:</span>
                        <span className="ml-2 zyphex-heading font-medium">{source.quality}/10</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Sales Funnel Stages */}
          <Card className="zyphex-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="zyphex-heading">Sales Funnel Analysis</CardTitle>
                  <CardDescription className="zyphex-subheading">
                    Detailed breakdown of each funnel stage with conversion rates
                  </CardDescription>
                </div>
                <PieChart className="h-5 w-5 text-orange-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {salesFunnel.map((stage, index) => (
                  <div key={index} className="p-4 rounded-lg bg-gray-800/30">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                          Stage {index + 1}
                        </Badge>
                        <div>
                          <p className="font-semibold zyphex-heading">{stage.stage}</p>
                          <p className="text-sm zyphex-subheading">{stage.leads.toLocaleString()} leads</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold zyphex-heading">{stage.percentage}%</p>
                        <p className="text-xs zyphex-subheading">{stage.avgTime} avg time</p>
                      </div>
                    </div>
                    <Progress value={stage.percentage} className="h-2 mb-2" />
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="zyphex-subheading">Stage Conversion:</span>
                        <span className="ml-2 zyphex-heading font-medium">{stage.conversionRate}</span>
                      </div>
                      <div className="text-right">
                        <span className="zyphex-subheading">Next Stage:</span>
                        <span className="ml-2 zyphex-heading font-medium">{stage.nextStageRate}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Drop-off Analysis */}
          <Card className="zyphex-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="zyphex-heading">Funnel Drop-off Points</CardTitle>
                  <CardDescription className="zyphex-subheading">
                    Identify critical drop-off points and optimization opportunities
                  </CardDescription>
                </div>
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dropOffPoints.map((point, index) => (
                  <div key={index} className="p-4 rounded-lg border-l-4 border-red-500 bg-red-500/5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold zyphex-heading mb-1">{point.point}</p>
                        <p className="text-sm zyphex-subheading">{point.reason}</p>
                      </div>
                      <Badge variant="outline" className={`${
                        point.impact === "Critical" 
                          ? "bg-red-500/20 text-red-400 border-red-500/30"
                          : point.impact === "High"
                          ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                          : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                      }`}>
                        {point.impact} Impact
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <span className="zyphex-subheading">Drop-off:</span>
                        <span className="ml-2 text-red-400 font-medium">{point.dropOff.toLocaleString()} users ({point.percentage})</span>
                      </div>
                      <div className="text-right">
                        <span className="zyphex-subheading">Recommendation:</span>
                        <span className="ml-2 text-blue-400 font-medium">{point.recommendation}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Additional Analytics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Conversion by Channel */}
            <Card className="zyphex-card">
              <CardHeader>
                <CardTitle className="zyphex-heading">Conversion by Channel</CardTitle>
                <CardDescription className="zyphex-subheading">
                  Performance breakdown by traffic channel
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {channelConversions.map((channel, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-800/30">
                      <div>
                        <p className="font-medium zyphex-heading">{channel.channel}</p>
                        <p className="text-sm zyphex-subheading">{channel.conversions.toLocaleString()} conversions</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30 mb-1">
                          {channel.rate}
                        </Badge>
                        <p className="text-xs zyphex-subheading">{channel.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Time to Conversion */}
            <Card className="zyphex-card">
              <CardHeader>
                <CardTitle className="zyphex-heading">Time to Conversion</CardTitle>
                <CardDescription className="zyphex-subheading">
                  Conversion timeline analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {timeAnalysis.map((period, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-800/30">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-cyan-400" />
                        <div>
                          <p className="font-medium zyphex-heading">{period.period}</p>
                          <p className="text-sm zyphex-subheading">{period.conversions.toLocaleString()} conversions</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium zyphex-heading">{period.percentage}</p>
                        <p className="text-xs zyphex-subheading">{period.avgValue} avg</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Device Performance */}
            <Card className="zyphex-card">
              <CardHeader>
                <CardTitle className="zyphex-heading">Device Performance</CardTitle>
                <CardDescription className="zyphex-subheading">
                  Conversion rates by device type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {devicePerformance.map((device, index) => (
                    <div key={index} className="p-4 rounded-lg zyphex-glass-effect">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold zyphex-heading">{device.device}</p>
                        <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                          {device.change}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                        <div>
                          <span className="zyphex-subheading">Visitors:</span>
                          <span className="ml-2 zyphex-heading font-medium">{device.visitors.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="zyphex-subheading">Rate:</span>
                          <span className="ml-2 zyphex-heading font-medium">{device.rate}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div>
                          <span className="zyphex-subheading">Conversions:</span>
                          <span className="ml-2 zyphex-heading font-medium">{device.conversions.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="zyphex-subheading">Value:</span>
                          <span className="ml-2 zyphex-heading font-medium">{device.value}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Converting Pages */}
            <Card className="zyphex-card">
              <CardHeader>
                <CardTitle className="zyphex-heading">Top Converting Pages</CardTitle>
                <CardDescription className="zyphex-subheading">
                  Best performing pages for conversions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topPages.map((page, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-800/30">
                      <div>
                        <p className="font-medium zyphex-heading">{page.page}</p>
                        <p className="text-sm zyphex-subheading">{page.conversions.toLocaleString()} conversions</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30 mb-1">
                          {page.rate}
                        </Badge>
                        <p className="text-xs zyphex-subheading">{page.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
