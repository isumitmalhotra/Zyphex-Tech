"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  AlertCircle,
  Eye,
  RefreshCw,
} from "lucide-react"
import { toast } from "sonner"

interface WorkflowExecutionsProps {
  params: {
    id: string
  }
}

interface ExecutionData {
  id: string
  workflowId: string
  status: string
  triggeredBy: string
  triggerSource: string | null
  startedAt: string
  completedAt: string | null
  duration: number | null
  actionsExecuted: number
  actionsSuccess: number
  actionsFailed: number
  retryCount: number
  createdAt: string
  logs?: Array<{
    id: string
    level: string
    message: string
    timestamp: string
    action?: string
  }>
  results?: Record<string, unknown>
  errors?: Record<string, unknown>
}

interface PaginationData {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function WorkflowExecutionsPage({ params }: WorkflowExecutionsProps) {
  const { status } = useSession()
  const router = useRouter()
  const [executions, setExecutions] = useState<ExecutionData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  })
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedExecution, setSelectedExecution] = useState<ExecutionData | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (status === "authenticated") {
      fetchExecutions()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, params.id, pagination.page, statusFilter])

  const fetchExecutions = async () => {
    try {
      setLoading(true)
      setError(null)

      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })

      if (statusFilter !== "all") {
        queryParams.append("status", statusFilter)
      }

      const response = await fetch(`/api/workflows/${params.id}/execute?${queryParams.toString()}`)
      
      if (!response.ok) {
        throw new Error("Failed to fetch executions")
      }

      const data = await response.json()
      setExecutions(data.executions)
      setPagination(data.pagination)
    } catch (_err) {
      setError("Failed to load executions")
      toast.error("Failed to load executions")
    } finally {
      setLoading(false)
    }
  }

  const fetchExecutionDetails = async (executionId: string) => {
    try {
      const response = await fetch(
        `/api/workflows/${params.id}/executions/${executionId}`
      )
      
      if (!response.ok) {
        throw new Error("Failed to fetch execution details")
      }

      const data = await response.json()
      setSelectedExecution(data.execution)
      setDetailsOpen(true)
    } catch (_err) {
      toast.error("Failed to load execution details")
    }
  }

  if (loading && executions.length === 0) {
    return <ExecutionsSkeleton />
  }

  if (error && executions.length === 0) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
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
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Workflow Executions</h1>
            <p className="text-muted-foreground mt-2">Execution history and details</p>
          </div>

          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="SUCCESS">Success</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="RUNNING">Running</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchExecutions} variant="outline" size="icon">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Executions List */}
      {executions.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Activity className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No executions found</h3>
            <p className="text-muted-foreground text-center">
              {statusFilter !== "all"
                ? "Try adjusting your filter"
                : "This workflow hasn't been executed yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {executions.map((execution) => (
              <Card key={execution.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <ExecutionStatusIcon status={execution.status} />
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={getStatusVariant(execution.status)}>
                            {execution.status}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {execution.triggeredBy}
                          </span>
                          {execution.retryCount > 0 && (
                            <Badge variant="outline" className="text-xs">
                              Retry {execution.retryCount}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(execution.startedAt).toLocaleString()}
                          </div>
                          {execution.duration && (
                            <div>
                              Duration: {(execution.duration / 1000).toFixed(2)}s
                            </div>
                          )}
                          <div>
                            Actions: {execution.actionsSuccess}/{execution.actionsExecuted}
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchExecutionDetails(execution.id)}
                      className="gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                {pagination.total} executions
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Execution Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Execution Details</DialogTitle>
            <DialogDescription>
              Complete execution information and logs
            </DialogDescription>
          </DialogHeader>
          
          {selectedExecution && (
            <div className="space-y-4">
              {/* Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <ExecutionStatusIcon status={selectedExecution.status} />
                    <Badge variant={getStatusVariant(selectedExecution.status)}>
                      {selectedExecution.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Timing */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Timing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Started:</span>
                    <span>{new Date(selectedExecution.startedAt).toLocaleString()}</span>
                  </div>
                  {selectedExecution.completedAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Completed:</span>
                      <span>{new Date(selectedExecution.completedAt).toLocaleString()}</span>
                    </div>
                  )}
                  {selectedExecution.duration && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration:</span>
                      <span>{(selectedExecution.duration / 1000).toFixed(2)}s</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Executed:</span>
                    <span>{selectedExecution.actionsExecuted}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Successful:</span>
                    <span className="text-green-500">{selectedExecution.actionsSuccess}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Failed:</span>
                    <span className="text-red-500">{selectedExecution.actionsFailed}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Logs */}
              {selectedExecution.logs && selectedExecution.logs.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Logs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {selectedExecution.logs.map((log) => (
                        <div
                          key={log.id}
                          className={`p-2 rounded text-xs font-mono ${
                            log.level === "ERROR" || log.level === "CRITICAL"
                              ? "bg-red-50 text-red-900"
                              : log.level === "WARNING"
                              ? "bg-yellow-50 text-yellow-900"
                              : "bg-muted"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {log.level}
                            </Badge>
                            <span className="text-muted-foreground">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                            {log.action && (
                              <span className="text-muted-foreground">
                                • {log.action}
                              </span>
                            )}
                          </div>
                          <div>{log.message}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Results/Errors */}
              {selectedExecution.results && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-40">
                      {JSON.stringify(selectedExecution.results, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}

              {selectedExecution.errors && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm text-red-500">Errors</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-red-50 text-red-900 p-3 rounded overflow-auto max-h-40">
                      {JSON.stringify(selectedExecution.errors, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ExecutionStatusIcon({ status }: { status: string }) {
  switch (status) {
    case "SUCCESS":
      return <CheckCircle className="h-5 w-5 text-green-500" />
    case "FAILED":
      return <XCircle className="h-5 w-5 text-red-500" />
    case "RUNNING":
      return <Activity className="h-5 w-5 text-yellow-500 animate-pulse" />
    case "PENDING":
      return <Clock className="h-5 w-5 text-blue-500" />
    default:
      return <AlertCircle className="h-5 w-5 text-gray-500" />
  }
}

function getStatusVariant(status: string): "default" | "destructive" | "secondary" | "outline" {
  switch (status) {
    case "SUCCESS":
      return "default"
    case "FAILED":
      return "destructive"
    case "RUNNING":
      return "secondary"
    default:
      return "outline"
  }
}

function ExecutionsSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <Skeleton className="h-8 w-32 mb-4" />
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-10 w-96" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-[180px]" />
        </div>
      </div>

      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-96" />
                  </div>
                </div>
                <Skeleton className="h-9 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
