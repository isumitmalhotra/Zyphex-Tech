"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  ListTodo,
  Search, 
  Plus,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  PlayCircle,
  Circle,
  RefreshCw,
  Calendar,
  User,
  Briefcase,
  Download
} from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format, isPast } from "date-fns"
import { toast } from "sonner"
import { exportToCSV } from "@/lib/utils/export"
import { StatsGridSkeleton } from "@/components/skeletons/stats-skeleton"
import { TableSkeletonWithActions } from "@/components/skeletons/table-skeleton"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { DataPagination } from "@/components/data-pagination"
import { useSortableData } from "@/hooks/use-sortable-data"
import { SortableTableHeader } from "@/components/sortable-table-header"

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  dueDate: Date | null
  estimatedHours: number | null
  actualHours: number | null
  progress: number
  projectId: string
  assigneeId: string | null
  createdBy: string
  createdAt: Date
  completedAt: Date | null
  project: {
    id: string
    name: string
  }
  assignee: {
    id: string
    name: string | null
    email: string
    image: string | null
  } | null
  creator: {
    id: string
    name: string | null
    email: string
  }
}

interface TaskStatistics {
  total: number
  todo: number
  inProgress: number
  review: number
  done: number
  blocked: number
  highPriority: number
  overdue: number
  unassigned: number
}

export default function TasksOverviewPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL")
  const [tasks, setTasks] = useState<Task[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string; title: string }>({
    open: false,
    id: "",
    title: ""
  })
  const [statistics, setStatistics] = useState<TaskStatistics>({
    total: 0,
    todo: 0,
    inProgress: 0,
    review: 0,
    done: 0,
    blocked: 0,
    highPriority: 0,
    overdue: 0,
    unassigned: 0
  })
  const [loading, setLoading] = useState(true)

  // Apply sorting
  const { items: sortedTasks, requestSort, getSortDirection } = useSortableData(tasks)

  // Apply pagination
  const paginatedTasks = sortedTasks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter, priorityFilter])

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (statusFilter !== 'ALL') params.append('status', statusFilter)
      if (priorityFilter !== 'ALL') params.append('priority', priorityFilter)
      
      const response = await fetch(`/api/project-manager/tasks?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch tasks')
      
      const data = await response.json()
      setTasks(data.tasks || [])
      setStatistics(data.statistics || statistics)
      toast.success(`Loaded ${data.tasks?.length || 0} tasks`)
    } catch (error) {
      console.error('Error fetching tasks:', error)
      toast.error('Failed to load tasks. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, priorityFilter])

  // Handle search with debounce
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchTasks()
    }, 500)

    return () => clearTimeout(delayDebounce)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  // Get status badge
  const getStatusBadge = (status: string) => {
    const badges = {
      TODO: { label: 'To Do', icon: Circle, color: 'bg-gray-500/10 text-gray-500 border-gray-500/20' },
      IN_PROGRESS: { label: 'In Progress', icon: PlayCircle, color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
      REVIEW: { label: 'Review', icon: Clock, color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
      DONE: { label: 'Done', icon: CheckCircle2, color: 'bg-green-500/10 text-green-500 border-green-500/20' },
      BLOCKED: { label: 'Blocked', icon: AlertCircle, color: 'bg-red-500/10 text-red-500 border-red-500/20' }
    }
    return badges[status as keyof typeof badges] || badges.TODO
  }

  // Get priority badge
  const getPriorityBadge = (priority: string) => {
    const badges = {
      LOW: { label: 'Low', color: 'bg-gray-500/10 text-gray-500 border-gray-500/20' },
      MEDIUM: { label: 'Medium', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
      HIGH: { label: 'High', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
      URGENT: { label: 'Urgent', color: 'bg-red-500/10 text-red-500 border-red-500/20' }
    }
    return badges[priority as keyof typeof badges] || badges.MEDIUM
  }

  // Handle delete task
  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/project-manager/tasks?id=${deleteDialog.id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete task')
      
      toast.success(`Task "${deleteDialog.title}" deleted successfully!`)
      setDeleteDialog({ open: false, id: "", title: "" })
      fetchTasks()
    } catch (error) {
      console.error('Error deleting task:', error)
      toast.error('Failed to delete task. Please try again.')
    }
  }

  // Handle status change
  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/project-manager/tasks?id=${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (!response.ok) throw new Error('Failed to update task status')
      
      toast.success('Task status updated successfully!')
      fetchTasks()
    } catch (error) {
      console.error('Error updating task:', error)
      toast.error('Failed to update task status. Please try again.')
    }
  }

  // Handle export to CSV
  const handleExport = () => {
    const exportData = tasks.map(task => ({
      Title: task.title,
      Description: task.description || 'N/A',
      Project: task.project.name,
      Status: task.status.replace('_', ' '),
      Priority: task.priority,
      Assignee: task.assignee?.name || task.assignee?.email || 'Unassigned',
      'Due Date': task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : 'N/A',
      'Progress (%)': task.progress,
      'Estimated Hours': task.estimatedHours || 0,
      'Actual Hours': task.actualHours || 0
    }))
    
    exportToCSV(exportData, 'tasks')
  }

  if (loading && tasks.length === 0) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-muted animate-pulse rounded" />
            <div className="h-4 w-96 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <StatsGridSkeleton count={4} />
        <div className="space-y-4">
          <div className="h-32 bg-muted animate-pulse rounded-lg" />
          <TableSkeletonWithActions rows={10} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tasks Overview</h2>
          <p className="text-muted-foreground">
            Manage all tasks across projects ({tasks.length} tasks)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={handleExport} title="Export to CSV">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={fetchTasks} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={() => router.push('/super-admin/projects')}>
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.total}</div>
            <p className="text-xs text-muted-foreground">
              {statistics.unassigned} unassigned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <PlayCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{statistics.inProgress}</div>
            <p className="text-xs text-muted-foreground">
              {statistics.todo} pending start
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{statistics.done}</div>
            <p className="text-xs text-muted-foreground">
              {statistics.review} in review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Attention</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{statistics.overdue}</div>
            <p className="text-xs text-muted-foreground">
              {statistics.highPriority} high priority
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Tasks</CardTitle>
              <CardDescription>
                View and manage all system tasks ({tasks.length} results)
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-[250px]"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="TODO">To Do</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="REVIEW">Review</SelectItem>
                  <SelectItem value="DONE">Done</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Priority</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery || statusFilter !== 'ALL' || priorityFilter !== 'ALL' 
                ? 'No tasks found matching your filters.' 
                : 'No tasks found.'}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableTableHeader
                      label="Task"
                      sortKey="title"
                      onSort={requestSort}
                      sortDirection={getSortDirection('title')}
                    />
                    <SortableTableHeader
                      label="Project"
                      sortKey="project.name"
                      onSort={requestSort}
                      sortDirection={getSortDirection('project.name')}
                    />
                    <SortableTableHeader
                      label="Status"
                      sortKey="status"
                      onSort={requestSort}
                      sortDirection={getSortDirection('status')}
                    />
                    <SortableTableHeader
                      label="Priority"
                      sortKey="priority"
                      onSort={requestSort}
                      sortDirection={getSortDirection('priority')}
                    />
                    <SortableTableHeader
                      label="Assignee"
                      sortKey="assignee.name"
                      onSort={requestSort}
                      sortDirection={getSortDirection('assignee.name')}
                    />
                    <SortableTableHeader
                      label="Due Date"
                      sortKey="dueDate"
                      onSort={requestSort}
                      sortDirection={getSortDirection('dueDate')}
                    />
                    <SortableTableHeader
                      label="Progress"
                      sortKey="progress"
                      onSort={requestSort}
                      sortDirection={getSortDirection('progress')}
                    />
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTasks.map((task) => {
                    const statusBadge = getStatusBadge(task.status)
                    const priorityBadge = getPriorityBadge(task.priority)
                    const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'DONE'
                    const StatusIcon = statusBadge.icon
                    
                    return (
                      <TableRow key={task.id} className={isOverdue ? 'bg-red-500/5' : ''}>
                        <TableCell>
                          <div className="font-medium max-w-[300px]">
                            {task.title}
                            {isOverdue && (
                              <Badge variant="outline" className="ml-2 bg-red-500/10 text-red-500 border-red-500/20">
                                Overdue
                              </Badge>
                            )}
                          </div>
                          {task.description && (
                            <div className="text-sm text-muted-foreground truncate max-w-[300px]">
                              {task.description}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Briefcase className="h-3 w-3 text-muted-foreground" />
                            {task.project.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusBadge.color}>
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {statusBadge.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={priorityBadge.color}>
                            {priorityBadge.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {task.assignee ? (
                            <div className="flex items-center gap-1 text-sm">
                              <User className="h-3 w-3 text-muted-foreground" />
                              {task.assignee.name || task.assignee.email}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {task.dueDate ? (
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">No due date</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium">{task.progress}%</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => router.push(`/super-admin/projects/${task.projectId}`)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Project
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => alert('Edit task functionality would be implemented here')}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Task
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'TODO')}>
                                <Circle className="mr-2 h-4 w-4" />
                                To Do
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'IN_PROGRESS')}>
                                <PlayCircle className="mr-2 h-4 w-4" />
                                In Progress
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'REVIEW')}>
                                <Clock className="mr-2 h-4 w-4" />
                                Review
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'DONE')}>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Done
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => setDeleteDialog({ open: true, id: task.id, title: task.title })}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Task
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          
          {/* Pagination */}
          {tasks.length > 0 && (
            <div className="mt-4">
              <DataPagination
                currentPage={currentPage}
                totalPages={Math.ceil(sortedTasks.length / itemsPerPage)}
                totalItems={sortedTasks.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        title="Delete Task?"
        description={`Are you sure you want to delete "${deleteDialog.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  )
}
