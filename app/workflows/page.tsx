"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Workflow,
  Plus,
  Search,
  MoreVertical,
  Play,
  Pause,
  Edit,
  Trash2,
  BarChart3,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
} from "lucide-react"
import { toast } from "sonner"

interface WorkflowData {
  id: string
  name: string
  description: string
  enabled: boolean
  version: number
  triggers: Array<Record<string, unknown>>
  priority: number
  executionCount: number
  successCount: number
  failureCount: number
  lastExecutionAt: string | null
  avgExecutionMs: number | null
  category: string | null
  tags: string[]
  successRate: number
  createdAt: string
  updatedAt: string
}

interface PaginationData {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function WorkflowsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [workflows, setWorkflows] = useState<WorkflowData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [enabledFilter, setEnabledFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  
  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [workflowToDelete, setWorkflowToDelete] = useState<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  const fetchWorkflows = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })

      if (enabledFilter !== "all") {
        params.append("enabled", enabledFilter)
      }

      if (categoryFilter !== "all") {
        params.append("category", categoryFilter)
      }

      if (searchQuery) {
        params.append("search", searchQuery)
      }

      const response = await fetch(`/api/workflows?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error("Failed to fetch workflows")
      }

      const data = await response.json()
      setWorkflows(data.workflows)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      toast.error("Failed to load workflows")
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, enabledFilter, categoryFilter, searchQuery])

  useEffect(() => {
    if (status === "authenticated") {
      fetchWorkflows()
    }
  }, [status, fetchWorkflows])

  const handleToggleWorkflow = async (workflowId: string, currentState: boolean) => {
    try {
      const response = await fetch(`/api/workflows/${workflowId}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !currentState }),
      })

      if (!response.ok) {
        throw new Error("Failed to toggle workflow")
      }

      toast.success(`Workflow ${!currentState ? "enabled" : "disabled"} successfully`)
      fetchWorkflows()
    } catch (_err) {
      toast.error("Failed to toggle workflow")
    }
  }

  const handleDeleteWorkflow = async () => {
    if (!workflowToDelete) return

    try {
      const response = await fetch(`/api/workflows/${workflowToDelete}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete workflow")
      }

      toast.success("Workflow deleted successfully")
      setDeleteDialogOpen(false)
      setWorkflowToDelete(null)
      fetchWorkflows()
    } catch (_err) {
      toast.error("Failed to delete workflow")
    }
  }

  const handleExecuteWorkflow = async (workflowId: string) => {
    try {
      const response = await fetch(`/api/workflows/${workflowId}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity: {
            type: "manual",
            id: "manual-trigger",
            data: {},
          },
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to execute workflow")
      }

      const data = await response.json()
      toast.success(`Workflow executed successfully - ${data.execution.status}`)
      fetchWorkflows()
    } catch (_err) {
      toast.error("Failed to execute workflow")
    }
  }

  const openDeleteDialog = (workflowId: string) => {
    setWorkflowToDelete(workflowId)
    setDeleteDialogOpen(true)
  }

  if (status === "loading" || loading) {
    return <WorkflowsPageSkeleton />
  }

  if (!session) {
    return null
  }

  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN"

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Workflow className="h-8 w-8" />
            Workflows
          </h1>
          <p className="text-muted-foreground mt-2">
            Automate your business processes with custom workflows
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-3">
            <Link href="/workflows/templates">
              <Button size="lg" variant="outline" className="gap-2">
                <Zap className="h-4 w-4" />
                Browse Templates
              </Button>
            </Link>
            <Link href="/workflows/create">
              <Button size="lg" className="gap-2">
                <Plus className="h-4 w-4" />
                Create Workflow
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search workflows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={enabledFilter} onValueChange={setEnabledFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="true">Enabled</SelectItem>
                <SelectItem value="false">Disabled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="project-management">Project Management</SelectItem>
                <SelectItem value="communication">Communication</SelectItem>
                <SelectItem value="billing">Billing</SelectItem>
                <SelectItem value="notifications">Notifications</SelectItem>
                <SelectItem value="automation">Automation</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Workflows Grid */}
      {workflows.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Workflow className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No workflows found</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              {searchQuery || enabledFilter !== "all" || categoryFilter !== "all"
                ? "Try adjusting your filters"
                : "Get started by creating your first workflow"}
            </p>
            {isAdmin && !searchQuery && (
              <Link href="/workflows/create">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Your First Workflow
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {workflows.map((workflow) => (
              <WorkflowCard
                key={workflow.id}
                workflow={workflow}
                isAdmin={isAdmin}
                onToggle={handleToggleWorkflow}
                onDelete={openDeleteDialog}
                onExecute={handleExecuteWorkflow}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                {pagination.total} workflows
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workflow</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this workflow? This action cannot be undone.
              All execution history and logs will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setWorkflowToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteWorkflow} className="bg-destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function WorkflowCard({
  workflow,
  isAdmin,
  onToggle,
  onDelete,
  onExecute,
}: {
  workflow: WorkflowData
  isAdmin: boolean
  onToggle: (id: string, currentState: boolean) => void
  onDelete: (id: string) => void
  onExecute: (id: string) => void
}) {
  const router = useRouter()

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg">{workflow.name}</CardTitle>
              <Badge variant={workflow.enabled ? "default" : "secondary"}>
                {workflow.enabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <CardDescription className="line-clamp-2">
              {workflow.description || "No description"}
            </CardDescription>
          </div>
          
          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push(`/workflows/${workflow.id}`)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(`/workflows/${workflow.id}/edit`)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggle(workflow.id, workflow.enabled)}>
                  {workflow.enabled ? (
                    <>
                      <Pause className="mr-2 h-4 w-4" />
                      Disable
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Enable
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExecute(workflow.id)}>
                  <Zap className="mr-2 h-4 w-4" />
                  Execute Now
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(`/workflows/${workflow.id}/stats`)}>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Statistics
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(workflow.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Executions:</span>
              <span className="font-medium">{workflow.executionCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-muted-foreground">Success:</span>
              <span className="font-medium">{workflow.successRate.toFixed(1)}%</span>
            </div>
          </div>

          {/* Triggers */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Triggers:</p>
            <div className="flex flex-wrap gap-1">
              {workflow.triggers.slice(0, 2).map((trigger, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {String((trigger as { type?: string }).type || 'UNKNOWN').replace(/_/g, " ")}
                </Badge>
              ))}
              {workflow.triggers.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{workflow.triggers.length - 2} more
                </Badge>
              )}
            </div>
          </div>

          {/* Tags */}
          {workflow.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {workflow.tags.slice(0, 3).map((tag, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Last Execution */}
          {workflow.lastExecutionAt && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Last run: {new Date(workflow.lastExecutionAt).toLocaleString()}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function WorkflowsPageSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-[180px]" />
            <Skeleton className="h-10 w-[200px]" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full mt-2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
