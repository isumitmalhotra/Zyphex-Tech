"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  AlertCircle,
  Activity,
  Zap,
} from "lucide-react"
import { toast } from "sonner"

interface WorkflowStatsProps {
  params: {
    id: string
  }
}

interface StatsData {
  overview: {
    totalExecutions: number
    successfulExecutions: number
    failedExecutions: number
    successRate: number
    avgDurationMs: number
    avgDurationSeconds: number
  }
  statusBreakdown: Record<string, number>
  trend: Array<{
    date: string
    success: number
    failed: number
    total: number
    successRate: number
  }>
  workflow: {
    id: string
    name: string
    enabled: boolean
    lastExecutionAt: string | null
    totalExecutions: number
    totalSuccess: number
    totalFailure: number
  }
  timeRange: {
    days: number
    startDate: string
    endDate: string
  }
}

export default function WorkflowStatsPage({ params }: WorkflowStatsProps) {
  const { data: _session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState("30")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (status === "authenticated") {
      fetchStats()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, params.id, timeRange])

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/workflows/${params.id}/stats?days=${timeRange}`)
      
      if (!response.ok) {
        throw new Error("Failed to fetch statistics")
      }

      const data = await response.json()
      setStats(data)
    } catch (_err) {
      setError("Failed to load statistics")
      toast.error("Failed to load statistics")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <WorkflowStatsSkeleton />
  }

  if (error || !stats) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Statistics not found"}</AlertDescription>
        </Alert>
        <Link href={`/workflows/${params.id}`}>
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Workflow
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <Link href={`/workflows/${params.id}`}>
          <Button variant="ghost" size="sm" className="gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Workflow
          </Button>
        </Link>
        
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold tracking-tight">{stats.workflow.name}</h1>
              <Badge variant={stats.workflow.enabled ? "default" : "secondary"}>
                {stats.workflow.enabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <p className="text-muted-foreground">Performance Statistics</p>
          </div>

          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
              <SelectItem value="365">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Total Executions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.overview.totalExecutions}</p>
            <p className="text-xs text-muted-foreground mt-1">
              in last {stats.timeRange.days} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Success Rate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold">{stats.overview.successRate.toFixed(1)}%</p>
              {stats.overview.successRate >= 95 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : stats.overview.successRate >= 80 ? (
                <Activity className="h-4 w-4 text-yellow-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.overview.successfulExecutions} / {stats.overview.totalExecutions}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Avg Duration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {stats.overview.avgDurationSeconds.toFixed(2)}s
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              per execution
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              Failed Executions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-500">{stats.overview.failedExecutions}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {((stats.overview.failedExecutions / stats.overview.totalExecutions) * 100).toFixed(1)}% failure rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Status Breakdown
          </CardTitle>
          <CardDescription>Execution status distribution</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(stats.statusBreakdown).map(([status, count]) => {
              const percentage = (count / stats.overview.totalExecutions) * 100
              return (
                <div key={status} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <StatusIcon status={status} />
                      <span className="font-medium">{status}</span>
                    </div>
                    <span className="text-muted-foreground">
                      {count} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getStatusColor(status)}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Execution Trend
          </CardTitle>
          <CardDescription>Daily execution history</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.trend.length > 0 ? (
            <div className="space-y-2">
              {stats.trend.slice().reverse().map((day) => (
                <div key={day.date} className="flex items-center gap-3 p-2 border rounded">
                  <div className="flex-shrink-0 w-24 text-sm text-muted-foreground">
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex items-center gap-1 text-sm">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span>{day.success}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <XCircle className="h-3 w-3 text-red-500" />
                        <span>{day.failed}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total: {day.total}
                      </div>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-green-500"
                        style={{ width: `${day.successRate}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex-shrink-0 w-16 text-right text-sm font-medium">
                    {day.successRate.toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No execution data for this time period
            </p>
          )}
        </CardContent>
      </Card>

      {/* Workflow Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Lifetime Statistics</CardTitle>
          <CardDescription>All-time workflow performance</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <dt className="text-sm text-muted-foreground">Total Executions</dt>
              <dd className="text-2xl font-bold">{stats.workflow.totalExecutions}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Total Success</dt>
              <dd className="text-2xl font-bold text-green-500">{stats.workflow.totalSuccess}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Total Failures</dt>
              <dd className="text-2xl font-bold text-red-500">{stats.workflow.totalFailure}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Last Execution</dt>
              <dd className="text-sm font-medium">
                {stats.workflow.lastExecutionAt
                  ? new Date(stats.workflow.lastExecutionAt).toLocaleString()
                  : "Never"}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "SUCCESS":
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case "FAILED":
      return <XCircle className="h-4 w-4 text-red-500" />
    case "PENDING":
      return <Clock className="h-4 w-4 text-blue-500" />
    case "RUNNING":
      return <Activity className="h-4 w-4 text-yellow-500" />
    default:
      return <AlertCircle className="h-4 w-4 text-gray-500" />
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case "SUCCESS":
      return "bg-green-500"
    case "FAILED":
      return "bg-red-500"
    case "PENDING":
      return "bg-blue-500"
    case "RUNNING":
      return "bg-yellow-500"
    default:
      return "bg-gray-500"
  }
}

function WorkflowStatsSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <Skeleton className="h-8 w-32 mb-4" />
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-10 w-96" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-[180px]" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-24 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}
