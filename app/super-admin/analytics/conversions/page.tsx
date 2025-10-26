"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Loader2, AlertCircle, RefreshCw, Users, Target, DollarSign, Clock, ArrowRight, Download } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface FunnelStage {
  leads: number
  contacted: number
  qualified: number
  proposal: number
  negotiation: number
  won: number
}

interface ConversionRates {
  leadToContacted: number
  contactedToQualified: number
  qualifiedToProposal: number
  proposalToNegotiation: number
  negotiationToWon: number
  overallConversion: number
}

interface LeadSource {
  source: string
  leads: number
  converted: number
  conversionRate: number
  totalValue: number
  avgQualityScore: number
}

interface PipelineData {
  stages: {
    qualified: number
    proposal: number
    negotiation: number
    closed: number
    lost: number
  }
  value: {
    qualified: number
    proposal: number
    negotiation: number
    closed: number
    lost: number
  }
}

interface ConversionMetrics {
  totalLeads: number
  totalDeals: number
  avgTimeToConversion: number
  bestSource: string
  winRate: number
  avgDealSize: number
  totalPipelineValue: number
}

interface MonthlyTrend {
  month: string
  leads: number
  converted: number
  deals: number
  closed: number
  value: number
}

interface ConversionsData {
  success: boolean
  source: 'database'
  funnel: FunnelStage
  conversionRates: ConversionRates
  leadSources: LeadSource[]
  pipeline: PipelineData
  metrics: ConversionMetrics
  monthlyTrend: MonthlyTrend[]
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function ConversionsAnalyticsPage() {
  const [data, setData] = useState<ConversionsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    fetchConversionsData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey])

  async function fetchConversionsData() {
    setIsLoading(true)
    setError(null)
    
    try {
      const now = new Date()
      const startDate = new Date(now.getFullYear(), 0, 1)
      
      const params = new URLSearchParams({
        startDate: startDate.toISOString().split('T')[0],
        endDate: now.toISOString().split('T')[0]
      })
      
      const response = await fetch(`/api/super-admin/analytics/conversions?${params}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch conversions data: ${response.statusText}`)
      }
      
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversions data')
      console.error('Conversions data fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  function formatNumber(num: number): string {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  function formatDays(days: number): string {
    if (days < 1) return '< 1 day'
    if (days === 1) return '1 day'
    if (days < 7) return `${Math.round(days)} days`
    if (days < 30) return `${Math.round(days / 7)} weeks`
    return `${Math.round(days / 30)} months`
  }

  function exportData() {
    if (!data) return
    
    const csv = [
      ['Metric', 'Value'],
      ['Total Leads', data.metrics.totalLeads],
      ['Total Deals', data.metrics.totalDeals],
      ['Win Rate', `${data.metrics.winRate}%`],
      ['Avg Deal Size', formatCurrency(data.metrics.avgDealSize)],
      ['Avg Time to Conversion', formatDays(data.metrics.avgTimeToConversion)],
      ['Best Source', data.metrics.bestSource],
      ['Total Pipeline Value', formatCurrency(data.metrics.totalPipelineValue)],
      ['Overall Conversion Rate', `${data.conversionRates.overallConversion}%`],
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `conversions-analytics-${Date.now()}.csv`
    a.click()
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading conversion analytics...</p>
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

  const { funnel, conversionRates, leadSources, pipeline, metrics, monthlyTrend } = data

  const funnelChartData = [
    { stage: 'Leads', count: funnel.leads, rate: 100 },
    { stage: 'Contacted', count: funnel.contacted, rate: conversionRates.leadToContacted },
    { stage: 'Qualified', count: funnel.qualified, rate: conversionRates.contactedToQualified },
    { stage: 'Proposal', count: funnel.proposal, rate: conversionRates.qualifiedToProposal },
    { stage: 'Negotiation', count: funnel.negotiation, rate: conversionRates.proposalToNegotiation },
    { stage: 'Won', count: funnel.won, rate: conversionRates.negotiationToWon },
  ]

  const pipelineChartData = [
    { stage: 'Qualified', count: pipeline.stages.qualified, value: pipeline.value.qualified },
    { stage: 'Proposal', count: pipeline.stages.proposal, value: pipeline.value.proposal },
    { stage: 'Negotiation', count: pipeline.stages.negotiation, value: pipeline.value.negotiation },
    { stage: 'Closed Won', count: pipeline.stages.closed, value: pipeline.value.closed },
    { stage: 'Closed Lost', count: pipeline.stages.lost, value: pipeline.value.lost },
  ]

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Conversion Analytics</h1>
          <p className="text-muted-foreground">
            Track your sales funnel and conversion performance
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="default">
            📊 Live Database Data
          </Badge>
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
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.totalLeads)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {conversionRates.overallConversion.toFixed(1)}% conversion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Deals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.totalDeals)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.winRate.toFixed(1)}% win rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Deal Size</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.avgDealSize)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(metrics.totalPipelineValue)} pipeline
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Conversion Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDays(metrics.avgTimeToConversion)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Best: {metrics.bestSource}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
          <CardDescription>Lead progression through sales stages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {funnelChartData.map((stage, index) => (
              <div key={stage.stage}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="font-semibold text-lg">{stage.stage}</div>
                    {index < funnelChartData.length - 1 && (
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold">{formatNumber(stage.count)}</span>
                    <Badge variant={stage.rate >= 50 ? 'default' : stage.rate >= 30 ? 'secondary' : 'destructive'}>
                      {stage.rate.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={stage.rate} className="h-3 flex-1" />
                  <span className="text-sm text-muted-foreground min-w-[60px]">
                    {index > 0 && `${((stage.count / funnelChartData[index - 1].count) * 100).toFixed(0)}% conv`}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={funnelChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#3b82f6" name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Lead Source Performance</CardTitle>
            <CardDescription>Conversion rates by source</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Leads</TableHead>
                  <TableHead className="text-right">Conv Rate</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leadSources.map((source, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{source.source}</TableCell>
                    <TableCell className="text-right">
                      {formatNumber(source.leads)}
                      <span className="text-xs text-muted-foreground ml-1">
                        ({formatNumber(source.converted)} won)
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={source.conversionRate >= 30 ? 'default' : source.conversionRate >= 20 ? 'secondary' : 'outline'}>
                        {source.conversionRate.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(source.totalValue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pipeline Overview</CardTitle>
            <CardDescription>Deals by stage</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pipelineChartData.filter(d => d.count > 0) as any}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ stage, count }: any) => `${stage}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {pipelineChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="mt-6 space-y-3">
              {pipelineChartData.map((stage, index) => (
                <div key={stage.stage} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm font-medium">{stage.stage}</span>
                    <Badge variant="outline" className="text-xs">{stage.count}</Badge>
                  </div>
                  <span className="text-sm font-semibold">
                    {formatCurrency(stage.value)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Trend</CardTitle>
          <CardDescription>Lead and deal performance over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="leads" stroke="#3b82f6" strokeWidth={2} name="Leads" />
              <Line yAxisId="left" type="monotone" dataKey="converted" stroke="#10b981" strokeWidth={2} name="Converted" />
              <Line yAxisId="left" type="monotone" dataKey="deals" stroke="#f59e0b" strokeWidth={2} name="Deals" />
              <Line yAxisId="left" type="monotone" dataKey="closed" stroke="#ef4444" strokeWidth={2} name="Closed" />
            </LineChart>
          </ResponsiveContainer>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
            {monthlyTrend.slice(-5).map((month, index) => (
              <Card key={index} className="p-4">
                <div className="text-xs text-muted-foreground mb-1">{month.month}</div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Leads:</span>
                    <span className="text-sm font-semibold">{month.leads}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Closed:</span>
                    <span className="text-sm font-semibold text-green-600">{month.closed}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Value:</span>
                    <span className="text-sm font-semibold">{formatCurrency(month.value)}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
