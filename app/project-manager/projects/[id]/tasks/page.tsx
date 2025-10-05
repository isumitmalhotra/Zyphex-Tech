"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ArrowLeft,
  Plus,
  MoreHorizontal,
  Calendar,
  Clock,
  User,
  AlertCircle,
  Loader2,
  Edit,
  Trash2,
  CheckCircle,
  Play,
  Pause,
  Filter,
  Search,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { SubtleBackground } from "@/components/subtle-background"
import { toast } from "@/hooks/use-toast"
import { format } from "date-fns"

interface Task {
  id: string
  title: string
  description: string
  status: string
  priority: string
  progress: number
  startDate: string | null
  dueDate: string | null
  estimatedHours: number | null
  actualHours: number | null
  assigneeId: string | null
  assignee: {
    id: string
    name: string
    email: string
  } | null
  createdAt: string
  updatedAt: string
}

interface Project {
  id: string
  name: string
  description: string
  users: {
    id: string
    name: string
    email: string
    role: string
  }[]
}

interface TaskFormData {
  title: string
  description: string
  status: string
  priority: string
  progress: string
  startDate: string
  dueDate: string
  estimatedHours: string
  assigneeId: string
}

export default function ProjectTasksPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterAssignee, setFilterAssignee] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    status: 'TODO',
    priority: 'MEDIUM',
    progress: '0',
    startDate: '',
    dueDate: '',
    estimatedHours: '',
    assigneeId: 'unassigned',
  })

  useEffect(() => {
    fetchProject()
    fetchTasks()
  }, [params.id])

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/project-manager/projects/${params.id}`)
      if (!response.ok) throw new Error('Failed to fetch project')
      const data = await response.json()
      setProject(data.project)
    } catch (error) {
      console.error('Error fetching project:', error)
      setError('Failed to load project details')
    }
  }

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/project-manager/projects/${params.id}/tasks`)
      if (!response.ok) throw new Error('Failed to fetch tasks')
      const data = await response.json()
      setTasks(data.tasks)
    } catch (error) {
      console.error('Error fetching tasks:', error)
      setError('Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof TaskFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      status: 'TODO',
      priority: 'MEDIUM',
      progress: '0',
      startDate: '',
      dueDate: '',
      estimatedHours: '',
      assigneeId: 'unassigned',
    })
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Task title is required",
        variant: "destructive",
      })
      return
    }

    try {
      setSaving(true)
      const response = await fetch(`/api/project-manager/projects/${params.id}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          progress: parseInt(formData.progress),
          estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : null,
          startDate: formData.startDate || null,
          dueDate: formData.dueDate || null,
          assigneeId: formData.assigneeId === 'unassigned' ? null : formData.assigneeId || null,
        }),
      })

      if (!response.ok) throw new Error('Failed to create task')

      const data = await response.json()
      setTasks(prev => [data.task, ...prev])
      setIsCreateDialogOpen(false)
      resetForm()
      
      toast({
        title: "Success",
        description: "Task created successfully",
      })
    } catch (error) {
      console.error('Error creating task:', error)
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTask) return

    try {
      setSaving(true)
      const response = await fetch(`/api/project-manager/projects/${params.id}/tasks/${editingTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          progress: parseInt(formData.progress),
          estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : null,
          startDate: formData.startDate || null,
          dueDate: formData.dueDate || null,
          assigneeId: formData.assigneeId === 'unassigned' ? null : formData.assigneeId || null,
        }),
      })

      if (!response.ok) throw new Error('Failed to update task')

      const data = await response.json()
      setTasks(prev => prev.map(task => task.id === editingTask.id ? data.task : task))
      setIsEditDialogOpen(false)
      setEditingTask(null)
      resetForm()
      
      toast({
        title: "Success",
        description: "Task updated successfully",
      })
    } catch (error) {
      console.error('Error updating task:', error)
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return

    try {
      const response = await fetch(`/api/project-manager/projects/${params.id}/tasks/${taskId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete task')

      setTasks(prev => prev.filter(task => task.id !== taskId))
      
      toast({
        title: "Success",
        description: "Task deleted successfully",
      })
    } catch (error) {
      console.error('Error deleting task:', error)
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (task: Task) => {
    setEditingTask(task)
    setFormData({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      progress: task.progress.toString(),
      startDate: task.startDate ? task.startDate.split('T')[0] : '',
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      estimatedHours: task.estimatedHours?.toString() || '',
      assigneeId: task.assigneeId || 'unassigned',
    })
    setIsEditDialogOpen(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DONE': return 'bg-green-500 text-white'
      case 'IN_PROGRESS': return 'bg-blue-500 text-white'
      case 'REVIEW': return 'bg-yellow-500 text-black'
      case 'TESTING': return 'bg-purple-500 text-white'
      case 'TODO': return 'bg-gray-500 text-white'
      case 'CANCELLED': return 'bg-red-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'text-red-400 bg-red-400/10'
      case 'MEDIUM': return 'text-yellow-400 bg-yellow-400/10'
      case 'LOW': return 'text-green-400 bg-green-400/10'
      default: return 'text-gray-400 bg-gray-400/10'
    }
  }

  // Filter tasks based on current filters
  const filteredTasks = tasks.filter(task => {
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus
    const matchesAssignee = filterAssignee === 'all' || 
                           (filterAssignee === 'unassigned' && !task.assigneeId) ||
                           task.assigneeId === filterAssignee
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesStatus && matchesAssignee && matchesSearch
  })

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6 zyphex-gradient-bg relative min-h-screen">
        <SubtleBackground />
        <div className="relative z-10">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto zyphex-accent-text" />
              <p className="mt-2 zyphex-subheading">Loading tasks...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6 zyphex-gradient-bg relative min-h-screen">
        <SubtleBackground />
        <div className="relative z-10">
          <Alert className="border-red-800/50 bg-red-900/20">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button
            variant="outline"
            onClick={() => router.push(`/project-manager/projects/${params.id}`)}
            className="mt-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Project
          </Button>
        </div>
      </div>
    )
  }

  const TaskForm = ({ onSubmit, submitText }: { onSubmit: (e: React.FormEvent) => void, submitText: string }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Task Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          required
          className="zyphex-input"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          className="zyphex-input"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
            <SelectTrigger className="zyphex-input">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODO">To Do</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="REVIEW">Review</SelectItem>
              <SelectItem value="TESTING">Testing</SelectItem>
              <SelectItem value="DONE">Done</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
            <SelectTrigger className="zyphex-input">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => handleInputChange('startDate', e.target.value)}
            className="zyphex-input"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dueDate">Due Date</Label>
          <Input
            id="dueDate"
            type="date"
            value={formData.dueDate}
            onChange={(e) => handleInputChange('dueDate', e.target.value)}
            className="zyphex-input"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="estimatedHours">Estimated Hours</Label>
          <Input
            id="estimatedHours"
            type="number"
            min="0"
            step="0.5"
            value={formData.estimatedHours}
            onChange={(e) => handleInputChange('estimatedHours', e.target.value)}
            className="zyphex-input"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="progress">Progress (%)</Label>
          <Input
            id="progress"
            type="number"
            min="0"
            max="100"
            value={formData.progress}
            onChange={(e) => handleInputChange('progress', e.target.value)}
            className="zyphex-input"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="assigneeId">Assignee</Label>
        <Select value={formData.assigneeId} onValueChange={(value) => handleInputChange('assigneeId', value)}>
          <SelectTrigger className="zyphex-input">
            <SelectValue placeholder="Select team member" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {project?.users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name} ({user.role})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setIsCreateDialogOpen(false)
            setIsEditDialogOpen(false)
            setEditingTask(null)
            resetForm()
          }}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={saving} className="zyphex-button">
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitText}
        </Button>
      </DialogFooter>
    </form>
  )

  return (
    <div className="flex-1 space-y-4 p-8 pt-6 zyphex-gradient-bg relative min-h-screen">
      <SubtleBackground />
      <div className="relative z-10 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/project-manager/projects/${params.id}`)}
              className="zyphex-button"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Project
            </Button>
            <div>
              <h1 className="text-2xl font-bold zyphex-heading">Task Management</h1>
              <p className="zyphex-subheading">{project?.name}</p>
            </div>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="zyphex-button">
                <Plus className="mr-2 h-4 w-4" />
                Create Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-slate-900 border-slate-800">
              <DialogHeader>
                <DialogTitle className="zyphex-heading">Create New Task</DialogTitle>
                <DialogDescription className="zyphex-subheading">
                  Add a new task to the project
                </DialogDescription>
              </DialogHeader>
              <TaskForm onSubmit={handleCreateTask} submitText="Create Task" />
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters and Search */}
        <Card className="zyphex-card">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 zyphex-accent-text" />
                <span className="text-sm zyphex-subheading">Filters:</span>
              </div>
              
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px] zyphex-input">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="TODO">To Do</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="REVIEW">Review</SelectItem>
                  <SelectItem value="TESTING">Testing</SelectItem>
                  <SelectItem value="DONE">Done</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterAssignee} onValueChange={setFilterAssignee}>
                <SelectTrigger className="w-[160px] zyphex-input">
                  <SelectValue placeholder="Assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignees</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {project?.users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 zyphex-subheading" />
                  <Input
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 zyphex-input"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Task Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="zyphex-card">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold zyphex-text">{tasks.length}</div>
              <p className="text-xs zyphex-subheading">Total Tasks</p>
            </CardContent>
          </Card>
          <Card className="zyphex-card">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-400">{tasks.filter(t => t.status === 'IN_PROGRESS').length}</div>
              <p className="text-xs zyphex-subheading">In Progress</p>
            </CardContent>
          </Card>
          <Card className="zyphex-card">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-400">{tasks.filter(t => t.status === 'DONE').length}</div>
              <p className="text-xs zyphex-subheading">Completed</p>
            </CardContent>
          </Card>
          <Card className="zyphex-card">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-400">{tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE').length}</div>
              <p className="text-xs zyphex-subheading">Overdue</p>
            </CardContent>
          </Card>
        </div>

        {/* Task List */}
        <Card className="zyphex-card">
          <CardHeader>
            <CardTitle className="zyphex-heading">
              Tasks ({filteredTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredTasks.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 mx-auto zyphex-subheading mb-4" />
                <p className="zyphex-subheading">No tasks found</p>
                <p className="text-sm zyphex-subheading mt-2">
                  {tasks.length === 0 ? "Create your first task to get started" : "Try adjusting your filters"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium zyphex-text">{task.title}</h4>
                        <Badge className={getStatusColor(task.status)}>
                          {task.status.replace('_', ' ')}
                        </Badge>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                      </div>
                      
                      {task.description && (
                        <p className="text-sm zyphex-subheading mb-2">{task.description}</p>
                      )}
                      
                      <div className="flex items-center space-x-4 text-xs zyphex-subheading">
                        {task.assignee && (
                          <div className="flex items-center space-x-1">
                            <User className="h-3 w-3" />
                            <span>{task.assignee.name}</span>
                          </div>
                        )}
                        {task.dueDate && (
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>Due {format(new Date(task.dueDate), 'MMM d, yyyy')}</span>
                          </div>
                        )}
                        {task.estimatedHours && (
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{task.estimatedHours}h estimated</span>
                          </div>
                        )}
                      </div>
                      
                      {task.progress > 0 && (
                        <div className="mt-2">
                          <div className="flex items-center space-x-2">
                            <Progress value={task.progress} className="flex-1" />
                            <span className="text-xs zyphex-subheading">{task.progress}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800">
                        <DropdownMenuItem onClick={() => openEditDialog(task)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Task
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-red-400 focus:text-red-400"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Task
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Task Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px] bg-slate-900 border-slate-800">
            <DialogHeader>
              <DialogTitle className="zyphex-heading">Edit Task</DialogTitle>
              <DialogDescription className="zyphex-subheading">
                Update task details and progress
              </DialogDescription>
            </DialogHeader>
            <TaskForm onSubmit={handleUpdateTask} submitText="Update Task" />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}