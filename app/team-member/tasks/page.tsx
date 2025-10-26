"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  Calendar,
  Search,
  Plus,
  Edit,
  PlayCircle,
  PauseCircle,
  MoreHorizontal,
  Loader2,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  dueDate: Date | null
  estimatedHours: number | null
  actualHours: number | null
  createdAt: Date
  project: {
    id: string
    name: string
  } | null
}

interface TaskStats {
  total: number
  todo: number
  inProgress: number
  review: number
  testing: number
  done: number
  cancelled: number
  highPriority: number
  overdue: number
  completedThisWeek: number
}

const statusColors = {
  TODO: "bg-gray-500",
  IN_PROGRESS: "bg-blue-500",
  REVIEW: "bg-yellow-500",
  TESTING: "bg-purple-500",
  DONE: "bg-green-500",
  CANCELLED: "bg-red-500",
}

const priorityColors = {
  LOW: "text-green-600 bg-green-100",
  MEDIUM: "text-yellow-600 bg-yellow-100",
  HIGH: "text-red-600 bg-red-100",
  URGENT: "text-red-800 bg-red-200",
}

export default function MyTasksPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [priorityFilter, setPriorityFilter] = useState("ALL")
  const [tasks, setTasks] = useState<Task[]>([])
  const [stats, setStats] = useState<TaskStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchTasks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, priorityFilter, searchTerm])

  const fetchTasks = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      
      if (statusFilter !== 'ALL') {
        params.append('status', statusFilter)
      }
      
      if (priorityFilter !== 'ALL') {
        params.append('priority', priorityFilter)
      }
      
      if (searchTerm) {
        params.append('search', searchTerm)
      }

      const response = await fetch(`/api/team-member/tasks?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch tasks')
      }

      const data = await response.json()
      setTasks(data.tasks || [])
      setStats(data.stats || null)
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to load tasks",
        variant: "destructive"
      })
      setTasks([])
    } finally {
      setIsLoading(false)
    }
  }

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/team-member/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, status: newStatus })
      })

      if (!response.ok) {
        throw new Error('Failed to update task')
      }

      toast({
        title: "Success",
        description: "Task status updated successfully"
      })

      fetchTasks()
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive"
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "TODO": return <Clock className="h-4 w-4" />
      case "IN_PROGRESS": return <PlayCircle className="h-4 w-4 text-blue-500" />
      case "REVIEW": return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "TESTING": return <PauseCircle className="h-4 w-4 text-purple-500" />
      case "DONE": return <CheckCircle className="h-4 w-4 text-green-500" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const formatDate = (date: Date | null) => {
    if (!date) return 'No due date'
    return new Date(date).toLocaleDateString()
  }

  const isOverdue = (dueDate: Date | null, status: string) => {
    if (!dueDate || status === 'DONE') return false
    return new Date(dueDate) < new Date()
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500 mb-4" />
          <p className="text-muted-foreground">Loading tasks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">My Tasks</h1>
          <p className="text-muted-foreground">
            Manage your assigned tasks and track progress
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </div>

      {/* Task Statistics */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card className="bg-gray-900/50 border-gray-700">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Total Tasks</p>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-gray-700">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gray-400">{stats.todo}</div>
              <p className="text-xs text-muted-foreground">To Do</p>
            </CardContent>
          </Card>
          <Card className="bg-blue-900/20 border-blue-700">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-400">{stats.inProgress}</div>
              <p className="text-xs text-muted-foreground">In Progress</p>
            </CardContent>
          </Card>
          <Card className="bg-yellow-900/20 border-yellow-700">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-400">{stats.review}</div>
              <p className="text-xs text-muted-foreground">In Review</p>
            </CardContent>
          </Card>
          <Card className="bg-green-900/20 border-green-700">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-400">{stats.done}</div>
              <p className="text-xs text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="bg-gray-900/50 border-gray-700">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-600"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-gray-800 border-gray-600">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="TODO">To Do</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="REVIEW">Review</SelectItem>
                <SelectItem value="TESTING">Testing</SelectItem>
                <SelectItem value="DONE">Done</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-40 bg-gray-800 border-gray-600">
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
        </CardContent>
      </Card>

      {/* Tasks Table */}
      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Task List</CardTitle>
          <CardDescription>
            {tasks.length} task{tasks.length !== 1 ? 's' : ''} assigned
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tasks found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300">Task</TableHead>
                  <TableHead className="text-gray-300">Project</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Priority</TableHead>
                  <TableHead className="text-gray-300">Due Date</TableHead>
                  <TableHead className="text-gray-300">Progress</TableHead>
                  <TableHead className="text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => {
                  const progress = task.estimatedHours && task.estimatedHours > 0 
                    ? Math.min(((task.actualHours || 0) / task.estimatedHours) * 100, 100)
                    : 0
                  const overdue = isOverdue(task.dueDate, task.status)
                  
                  return (
                    <TableRow key={task.id} className="border-gray-700">
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(task.status)}
                            <span className="font-medium text-white">{task.title}</span>
                            {overdue && <Badge variant="destructive" className="text-xs">Overdue</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">{task.description || 'No description'}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-blue-400">{task.project?.name || 'No Project'}</span>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary"
                          className={`${statusColors[task.status as keyof typeof statusColors]} text-white`}
                        >
                          {task.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline"
                          className={priorityColors[task.priority as keyof typeof priorityColors]}
                        >
                          {task.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className={overdue ? "text-red-400" : "text-gray-300"}>
                            {formatDate(task.dueDate)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Progress value={progress} className="w-20" />
                          <span className="text-xs text-muted-foreground">
                            {task.actualHours || 0}h / {task.estimatedHours || 0}h
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => updateTaskStatus(task.id, 'IN_PROGRESS')}>
                              <PlayCircle className="h-4 w-4 mr-2" />
                              Start Task
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateTaskStatus(task.id, 'REVIEW')}>
                              <Edit className="h-4 w-4 mr-2" />
                              Mark for Review
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateTaskStatus(task.id, 'DONE')}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Complete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}