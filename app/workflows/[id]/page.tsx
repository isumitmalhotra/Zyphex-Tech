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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Play,
  Pause,
  Edit,
  BarChart3,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Zap,
  AlertCircle,
  Settings,
} from "lucide-react"
import { toast } from "sonner"
import { WorkflowTestDialog } from "@/components/workflow/workflow-test-dialog"

interface WorkflowData {
  id: string
  name: string
  description: string | null
  enabled: boolean
  version: number
  triggers: Array<Record<string, unknown>>
  conditions: Record<string, unknown> | null
  actions: Array<Record<string, unknown>>
  priority: number
  maxRetries?: number
  retryDelay?: number
  timeout?: number
  executionCount: number
  successCount: number
  failureCount: number
  lastExecutionAt: string | null
  avgExecutionMs: number | null
  category: string | null
  tags: string[]
  successRate: number
  createdBy: string
  createdAt: string
  updatedAt: string
  executions?: Array<Record<string, unknown>>
}

interface WorkflowDetailProps {
  params: {
    id: string
  }
}

export default function WorkflowDetailPage({ params }: WorkflowDetailProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [workflow, setWorkflow] = useState<WorkflowData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (status === "authenticated") {
      fetchWorkflow()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, params.id])

  const fetchWorkflow = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/workflows/${params.id}`)
      
      if (!response.ok) {
        throw new Error("Failed to fetch workflow")
      }

      const data = await response.json()
      setWorkflow(data)
    } catch (_err) {
      setError("Failed to load workflow")
      toast.error("Failed to load workflow")
    } finally {
      setLoading(false)
    }
  }

  const handleToggleWorkflow = async () => {
    if (!workflow) return
    
    try {
      const response = await fetch(`/api/workflows/${params.id}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !workflow.enabled }),
      })

      if (!response.ok) {
        throw new Error("Failed to toggle workflow")
      }

      toast.success(`Workflow ${!workflow.enabled ? "enabled" : "disabled"} successfully`)
      fetchWorkflow()
    } catch (_err) {
      toast.error("Failed to toggle workflow")
    }
  }

  const handleExecuteWorkflow = async () => {
    try {
      const response = await fetch(`/api/workflows/${params.id}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity: { type: "manual", id: "manual-trigger", data: {} },
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to execute workflow")
      }

      const data = await response.json()
      toast.success(`Workflow executed - ${data.execution.status}`)
      fetchWorkflow()
    } catch (_err) {
      toast.error("Failed to execute workflow")
    }
  }

  if (loading) {
    return <WorkflowDetailSkeleton />
  }

  if (error || !workflow) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Workflow not found"}</AlertDescription>
        </Alert>
        <Link href="/workflows">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Workflows
          </Button>
        </Link>
      </div>
    )
  }

  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN"

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <Link href="/workflows">
          <Button variant="ghost" size="sm" className="gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Workflows
          </Button>
        </Link>
        
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold tracking-tight">{workflow.name}</h1>
              <Badge variant={workflow.enabled ? "default" : "secondary"} className="text-sm">
                {workflow.enabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <p className="text-muted-foreground">{workflow.description || "No description"}</p>
          </div>

          {isAdmin && (
            <div className="flex gap-2">
              <WorkflowTestDialog workflowId={params.id} />
              <Button variant="outline" onClick={handleExecuteWorkflow} className="gap-2">
                <Play className="h-4 w-4" />
                Execute
              </Button>
              <Button variant="outline" onClick={handleToggleWorkflow} className="gap-2">
                {workflow.enabled ? (
                  <>
                    <Pause className="h-4 w-4" />
                    Disable
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Enable
                  </>
                )}
              </Button>
              <Button onClick={() => router.push(`/workflows/${params.id}/edit`)} className="gap-2">
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Total Executions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{workflow.executionCount || 0}</p>
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
            <p className="text-2xl font-bold">{workflow.successRate?.toFixed(1) || 0}%</p>
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
              {workflow.avgExecutionMs ? `${(workflow.avgExecutionMs / 1000).toFixed(2)}s` : "N/A"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Version
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">v{workflow.version}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="executions">Executions</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Triggers */}
          <Card>
            <CardHeader>
              <CardTitle>Triggers</CardTitle>
              <CardDescription>Events that start this workflow</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {workflow.triggers?.map((trigger: Record<string, unknown>, idx: number) => (
                  <div key={idx} className="flex items-start gap-3 p-3 border rounded-lg">
                    <Zap className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <div className="font-medium">{String((trigger.type as string) || 'UNKNOWN').replace(/_/g, " ")}</div>
                      {trigger.config && Object.keys(trigger.config as object).length > 0 ? (
                        <pre className="text-xs text-muted-foreground mt-1">
                          {JSON.stringify(trigger.config, null, 2)}
                        </pre>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Conditions */}
          {workflow.conditions && (
            <Card>
              <CardHeader>
                <CardTitle>Conditions</CardTitle>
                <CardDescription>Logic that determines if workflow should run</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="text-sm p-4 bg-muted rounded-lg overflow-auto">
                  {JSON.stringify(workflow.conditions, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
              <CardDescription>Steps executed by this workflow</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {workflow.actions?.map((action: Record<string, unknown>, idx: number) => (
                  <div key={idx} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                      {action.order as number}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{String((action.type as string) || 'UNKNOWN').replace(/_/g, " ")}</div>
                      {action.config ? (
                        <pre className="text-xs text-muted-foreground mt-1 max-h-40 overflow-auto">
                          {JSON.stringify(action.config, null, 2)}
                        </pre>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-muted-foreground">Priority</dt>
                  <dd className="text-lg font-medium">{workflow.priority}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Max Retries</dt>
                  <dd className="text-lg font-medium">{workflow.maxRetries}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Retry Delay</dt>
                  <dd className="text-lg font-medium">{workflow.retryDelay}s</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Timeout</dt>
                  <dd className="text-lg font-medium">{workflow.timeout}s</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Category</dt>
                  <dd className="text-lg font-medium">{workflow.category || "None"}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Tags</dt>
                  <dd className="flex flex-wrap gap-1">
                    {workflow.tags?.map((tag: string, idx: number) => (
                      <Badge key={idx} variant="secondary">{tag}</Badge>
                    ))}
                    {workflow.tags?.length === 0 && <span className="text-muted-foreground">None</span>}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="executions">
          <Card>
            <CardHeader>
              <CardTitle>Recent Executions</CardTitle>
              <CardDescription>Latest workflow execution history</CardDescription>
            </CardHeader>
            <CardContent>
              {workflow.executions && workflow.executions.length > 0 ? (
                <div className="space-y-3">
                  {workflow.executions.map((execution: Record<string, unknown>) => (
                    <div key={execution.id as string} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {execution.status === "SUCCESS" ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : execution.status === "FAILED" ? (
                          <XCircle className="h-5 w-5 text-red-500" />
                        ) : (
                          <Clock className="h-5 w-5 text-yellow-500" />
                        )}
                        <div>
                          <div className="font-medium">{execution.status as string}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(execution.startedAt as string).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Duration</div>
                        <div className="font-medium">{((execution.duration as number) / 1000).toFixed(2)}s</div>
                      </div>
                    </div>
                  ))}
                  <Link href={`/workflows/${params.id}/executions`}>
                    <Button variant="outline" className="w-full">View All Executions</Button>
                  </Link>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No executions yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics">
          <div className="text-center text-muted-foreground py-8">
            <BarChart3 className="h-12 w-12 mx-auto mb-4" />
            <p>View detailed statistics</p>
            <Link href={`/workflows/${params.id}/stats`}>
              <Button className="mt-4">Go to Statistics Dashboard</Button>
            </Link>
          </div>
        </TabsContent>

        <TabsContent value="logs">
          <div className="text-center text-muted-foreground py-8">
            <FileText className="h-12 w-12 mx-auto mb-4" />
            <p>View workflow logs</p>
            <Link href={`/workflows/${params.id}/logs`}>
              <Button className="mt-4">Go to Logs</Button>
            </Link>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function WorkflowDetailSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <Skeleton className="h-8 w-32 mb-4" />
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-10 w-96" />
            <Skeleton className="h-4 w-[500px]" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-20" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
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
