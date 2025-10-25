"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  Plus,
  Search,
  MoreHorizontal,
  Calendar,
  User,
  Loader2,
  BarChart3,
  Target,
} from "lucide-react"
import { format } from "date-fns"
import { SubtleBackground } from "@/components/subtle-background"

interface Task {
  id: string
  title: string
  description: string
  status: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE" | "BLOCKED"
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  project: {
    id: string
    name: string
  }
  assignee: {
    id: string
    name: string
    email: string
  } | null
  dueDate: string | null
  estimatedHours: number
  actualHours: number
  createdAt: string
  updatedAt: string
}

export default function TaskAssignmentPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [priorityFilter, setPriorityFilter] = useState("ALL")
  const [projectFilter, setProjectFilter] = useState("ALL")
  const [assigneeFilter, setAssigneeFilter] = useState("ALL")

  useEffect(() => {
    // Mock data for tasks
    const mockTasks: Task[] = [
      {
        id: "1",
        title: "Implement user authentication",
        description: "Create login/logout functionality with JWT tokens",
        status: "IN_PROGRESS",
        priority: "HIGH",
        project: { id: "p1", name: "E-commerce Platform" },
        assignee: { id: "u1", name: "Alice Johnson", email: "alice@zyphextech.com" },
        dueDate: "2025-10-15",
        estimatedHours: 16,
        actualHours: 12,
        createdAt: "2025-10-01",
        updatedAt: "2025-10-02"
      },
      {
        id: "2", 
        title: "Design payment gateway integration",
        description: "Create UI/UX for payment processing",
        status: "TODO",
        priority: "MEDIUM",
        project: { id: "p1", name: "E-commerce Platform" },
        assignee: { id: "u2", name: "Bob Smith", email: "bob@zyphextech.com" },
        dueDate: "2025-10-20",
        estimatedHours: 24,
        actualHours: 0,
        createdAt: "2025-10-01",
        updatedAt: "2025-10-01"
      },
      {
        id: "3",
        title: "Database migration script",
        description: "Create migration for new user fields",
        status: "DONE",
        priority: "LOW",
        project: { id: "p2", name: "Mobile App" },
        assignee: { id: "u3", name: "Carol Davis", email: "carol@zyphextech.com" },
        dueDate: "2025-10-10",
        estimatedHours: 8,
        actualHours: 6,
        createdAt: "2025-09-25",
        updatedAt: "2025-10-01"
      },
      {
        id: "4",
        title: "API documentation update",
        description: "Update API docs for new endpoints",
        status: "REVIEW",
        priority: "MEDIUM",
        project: { id: "p2", name: "Mobile App" },
        assignee: { id: "u1", name: "Alice Johnson", email: "alice@zyphextech.com" },
        dueDate: "2025-10-12",
        estimatedHours: 4,
        actualHours: 4,
        createdAt: "2025-09-28",
        updatedAt: "2025-10-02"
      },
      {
        id: "5",
        title: "Security audit",
        description: "Perform security review of authentication system",
        status: "BLOCKED",
        priority: "CRITICAL",
        project: { id: "p1", name: "E-commerce Platform" },
        assignee: null,
        dueDate: "2025-10-18",
        estimatedHours: 20,
        actualHours: 0,
        createdAt: "2025-10-01",
        updatedAt: "2025-10-02"
      }
    ]
    
    setTimeout(() => {
      setTasks(mockTasks)
      setLoading(false)
    }, 1000)
  }, [])

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.project.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "ALL" || task.status === statusFilter
    const matchesPriority = priorityFilter === "ALL" || task.priority === priorityFilter
    const matchesProject = projectFilter === "ALL" || task.project.id === projectFilter
    const matchesAssignee = assigneeFilter === "ALL" || 
                           (assigneeFilter === "UNASSIGNED" && !task.assignee) ||
                           (task.assignee && task.assignee.id === assigneeFilter)
    
    return matchesSearch && matchesStatus && matchesPriority && matchesProject && matchesAssignee
  })

  const statusColors = {
    TODO: "bg-gray-100 text-gray-800",
    IN_PROGRESS: "bg-blue-100 text-blue-800",
    REVIEW: "bg-purple-100 text-purple-800",
    DONE: "bg-green-100 text-green-800",
    BLOCKED: "bg-red-100 text-red-800",
  }

  const priorityColors = {
    LOW: "bg-gray-100 text-gray-800",
    MEDIUM: "bg-blue-100 text-blue-800",
    HIGH: "bg-orange-100 text-orange-800",
    CRITICAL: "bg-red-100 text-red-800",
  }

  const stats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'TODO').length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    review: tasks.filter(t => t.status === 'REVIEW').length,
    done: tasks.filter(t => t.status === 'DONE').length,
    blocked: tasks.filter(t => t.status === 'BLOCKED').length,
    unassigned: tasks.filter(t => !t.assignee).length,
    overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE').length,
  }

  const projects = [...new Set(tasks.map(t => t.project))]
  const assignees = [...new Set(tasks.filter(t => t.assignee).map(t => t.assignee!))]

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
        <SubtleBackground />
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin zyphex-heading" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
      <SubtleBackground />
      <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold zyphex-heading">Task Assignment</h1>
            <p className="zyphex-subheading">Manage and assign tasks to team members</p>
          </div>
          <Button className="zyphex-button-primary">
            <Plus className="h-4 w-4 mr-2" />
            Create Task
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <Card className="zyphex-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Total</CardTitle>
              <Target className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">{stats.total}</div>
            </CardContent>
          </Card>

          <Card className="zyphex-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">To Do</CardTitle>
              <Clock className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">{stats.todo}</div>
            </CardContent>
          </Card>

          <Card className="zyphex-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">In Progress</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">{stats.inProgress}</div>
            </CardContent>
          </Card>

          <Card className="zyphex-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Review</CardTitle>
              <CheckCircle className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">{stats.review}</div>
            </CardContent>
          </Card>

          <Card className="zyphex-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Done</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">{stats.done}</div>
            </CardContent>
          </Card>

          <Card className="zyphex-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Blocked</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">{stats.blocked}</div>
            </CardContent>
          </Card>

          <Card className="zyphex-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Unassigned</CardTitle>
              <User className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">{stats.unassigned}</div>
            </CardContent>
          </Card>

          <Card className="zyphex-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Overdue</CardTitle>
              <Calendar className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">{stats.overdue}</div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        {stats.overdue > 0 && (
          <Card className="border-red-200 bg-red-50 zyphex-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-800">Overdue Tasks Alert</p>
                  <p className="text-sm text-red-600">
                    {stats.overdue} task{stats.overdue > 1 ? 's are' : ' is'} overdue and need immediate attention.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Task Management */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all">All Tasks</TabsTrigger>
            <TabsTrigger value="todo">To Do ({stats.todo})</TabsTrigger>
            <TabsTrigger value="in-progress">In Progress ({stats.inProgress})</TabsTrigger>
            <TabsTrigger value="review">Review ({stats.review})</TabsTrigger>
            <TabsTrigger value="done">Done ({stats.done})</TabsTrigger>
            <TabsTrigger value="blocked">Blocked ({stats.blocked})</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <Card className="zyphex-card">
              <CardHeader>
                <CardTitle className="zyphex-heading">All Tasks</CardTitle>
                <CardDescription className="zyphex-subheading">
                  View and manage all tasks across projects
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search tasks, projects, or descriptions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Status</SelectItem>
                      <SelectItem value="TODO">To Do</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="REVIEW">Review</SelectItem>
                      <SelectItem value="DONE">Done</SelectItem>
                      <SelectItem value="BLOCKED">Blocked</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Priority</SelectItem>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="CRITICAL">Critical</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={projectFilter} onValueChange={setProjectFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Projects</SelectItem>
                      {projects.map(project => (
                        <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Assignees</SelectItem>
                      <SelectItem value="UNASSIGNED">Unassigned</SelectItem>
                      {assignees.map(assignee => (
                        <SelectItem key={assignee.id} value={assignee.id}>{assignee.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tasks Table */}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Task</TableHead>
                        <TableHead>Project</TableHead>
                        <TableHead>Assignee</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTasks.map((task) => {
                        const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE'
                        return (
                          <TableRow key={task.id} className={isOverdue ? "bg-red-50" : ""}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{task.title}</p>
                                <p className="text-sm text-gray-500 max-w-xs truncate">{task.description}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{task.project.name}</Badge>
                            </TableCell>
                            <TableCell>
                              {task.assignee ? (
                                <div>
                                  <p className="font-medium text-sm">{task.assignee.name}</p>
                                  <p className="text-xs text-gray-500">{task.assignee.email}</p>
                                </div>
                              ) : (
                                <Badge variant="outline" className="text-orange-600">
                                  Unassigned
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge className={statusColors[task.status]}>
                                {task.status.replace('_', ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={priorityColors[task.priority]}>
                                {task.priority}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {task.dueDate ? (
                                <div className={isOverdue ? 'text-red-600 font-medium' : ''}>
                                  {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                                  {isOverdue && (
                                    <div className="flex items-center gap-1 mt-1">
                                      <AlertTriangle className="h-3 w-3" />
                                      <span className="text-xs">Overdue</span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400">No deadline</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <p>{task.actualHours}h / {task.estimatedHours}h</p>
                                <div className="w-16 bg-gray-200 rounded-full h-2 mt-1">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full" 
                                    style={{ width: `${Math.min((task.actualHours / task.estimatedHours) * 100, 100)}%` }}
                                  ></div>
                                </div>
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
                                  <DropdownMenuItem>
                                    Edit Task
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    Assign to User
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    Change Status
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    View Details
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

                {filteredTasks.length === 0 && (
                  <div className="text-center py-12">
                    <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium zyphex-heading mb-2">No tasks found</h3>
                    <p className="zyphex-subheading mb-4">
                      {searchTerm || statusFilter !== "ALL" || priorityFilter !== "ALL" 
                        ? "Try adjusting your filters or search terms."
                        : "Create your first task to get started."}
                    </p>
                    <Button className="zyphex-button-primary">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Task
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* PROMPT 27: To Do Tasks View */}
          <TabsContent value="todo">
            <Card className="zyphex-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="zyphex-heading">To Do Tasks</CardTitle>
                    <CardDescription className="zyphex-subheading">
                      Tasks ready to be started ({stats.todo} tasks)
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Select defaultValue="priority">
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="priority">Sort by Priority</SelectItem>
                        <SelectItem value="dueDate">Sort by Due Date</SelectItem>
                        <SelectItem value="assignee">Sort by Assignee</SelectItem>
                        <SelectItem value="project">Sort by Project</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button className="zyphex-button-primary">
                      <Plus className="h-4 w-4 mr-2" />
                      Quick Add Task
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTasks.filter(t => t.status === 'TODO').map((task) => {
                    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date()
                    return (
                      <Card key={task.id} className={`hover-zyphex-lift ${isOverdue ? 'border-red-300' : ''}`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-base font-semibold line-clamp-2">
                              {task.title}
                            </CardTitle>
                            <Badge variant="outline" className={priorityColors[task.priority]}>
                              {task.priority}
                            </Badge>
                          </div>
                          <CardDescription className="text-sm line-clamp-2">
                            {task.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Badge variant="outline" className="text-xs">
                              {task.project.name}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <User className="h-4 w-4" />
                            <span>{task.assignee?.name || 'Unassigned'}</span>
                          </div>
                          <div className={`flex items-center gap-2 text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                            <Calendar className="h-4 w-4" />
                            <span>{task.dueDate ? format(new Date(task.dueDate), 'MMM dd, yyyy') : 'No deadline'}</span>
                            {isOverdue && <AlertTriangle className="h-4 w-4" />}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="h-4 w-4" />
                            <span>Est: {task.estimatedHours}h</span>
                          </div>
                          <div className="flex gap-2 pt-2">
                            <Button size="sm" variant="outline" className="flex-1">
                              Start Task
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="outline" className="px-2">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>Edit</DropdownMenuItem>
                                <DropdownMenuItem>Assign</DropdownMenuItem>
                                <DropdownMenuItem>Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
                {filteredTasks.filter(t => t.status === 'TODO').length === 0 && (
                  <div className="text-center py-12">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium zyphex-heading mb-2">No To Do tasks</h3>
                    <p className="zyphex-subheading">All tasks have been started or completed!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* PROMPT 28: In Progress Tasks View */}
          <TabsContent value="in-progress">
            <Card className="zyphex-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="zyphex-heading">In Progress Tasks</CardTitle>
                    <CardDescription className="zyphex-subheading">
                      Tasks currently being worked on ({stats.inProgress} tasks)
                    </CardDescription>
                  </div>
                  <Select defaultValue="startDate">
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="startDate">Sort by Start Date</SelectItem>
                      <SelectItem value="progress">Sort by Progress</SelectItem>
                      <SelectItem value="dueDate">Sort by Due Date</SelectItem>
                      <SelectItem value="assignee">Sort by Assignee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTasks.filter(t => t.status === 'IN_PROGRESS').map((task) => {
                    const progress = Math.min((task.actualHours / task.estimatedHours) * 100, 100)
                    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date()
                    return (
                      <Card key={task.id} className="hover-zyphex-lift border-blue-200 bg-blue-50/50">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-base font-semibold line-clamp-2">
                              {task.title}
                            </CardTitle>
                            <Badge variant="outline" className={priorityColors[task.priority]}>
                              {task.priority}
                            </Badge>
                          </div>
                          <CardDescription className="text-sm line-clamp-2">
                            {task.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Badge variant="outline" className="text-xs">
                              {task.project.name}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <User className="h-4 w-4" />
                            <span className="font-medium">{task.assignee?.name || 'Unassigned'}</span>
                          </div>
                          <div className={`flex items-center gap-2 text-sm ${isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
                            <Calendar className="h-4 w-4" />
                            <span>{task.dueDate ? format(new Date(task.dueDate), 'MMM dd, yyyy') : 'No deadline'}</span>
                          </div>
                          <div>
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-gray-600">Time Progress</span>
                              <span className="font-medium">{task.actualHours}h / {task.estimatedHours}h</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all" 
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{Math.round(progress)}% complete</p>
                          </div>
                          <div className="flex gap-2 pt-2">
                            <Button size="sm" variant="outline" className="flex-1">
                              Log Time
                            </Button>
                            <Button size="sm" className="flex-1 bg-purple-600 hover:bg-purple-700">
                              Move to Review
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
                {filteredTasks.filter(t => t.status === 'IN_PROGRESS').length === 0 && (
                  <div className="text-center py-12">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium zyphex-heading mb-2">No tasks in progress</h3>
                    <p className="zyphex-subheading">Start working on a task from the To Do list!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* PROMPT 29: Review Tasks View */}
          <TabsContent value="review">
            <Card className="zyphex-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="zyphex-heading">Review Tasks</CardTitle>
                    <CardDescription className="zyphex-subheading">
                      Tasks pending review or approval ({stats.review} tasks)
                    </CardDescription>
                  </div>
                  <Button className="zyphex-button-primary">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Selected
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredTasks.filter(t => t.status === 'REVIEW').map((task) => (
                    <Card key={task.id} className="hover-zyphex-lift border-purple-200 bg-purple-50/50">
                      <CardContent className="pt-6">
                        <div className="flex gap-4">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="text-lg font-semibold mb-1">{task.title}</h3>
                                <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                                <div className="flex gap-2 flex-wrap">
                                  <Badge variant="outline" className="text-xs">
                                    {task.project.name}
                                  </Badge>
                                  <Badge variant="outline" className={priorityColors[task.priority]}>
                                    {task.priority}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500 mb-1">Submitted by</p>
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  <span className="font-medium">{task.assignee?.name || 'Unknown'}</span>
                                </div>
                              </div>
                              <div>
                                <p className="text-gray-500 mb-1">Time Spent</p>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  <span className="font-medium">{task.actualHours}h / {task.estimatedHours}h</span>
                                </div>
                              </div>
                              <div>
                                <p className="text-gray-500 mb-1">Due Date</p>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  <span className="font-medium">
                                    {task.dueDate ? format(new Date(task.dueDate), 'MMM dd') : 'No deadline'}
                                  </span>
                                </div>
                              </div>
                              <div>
                                <p className="text-gray-500 mb-1">Reviewer</p>
                                <Button variant="outline" size="sm">
                                  Assign Reviewer
                                </Button>
                              </div>
                            </div>

                            <div className="border-t pt-3">
                              <p className="text-sm font-medium mb-2">Review Comments</p>
                              <div className="bg-white rounded-lg p-3 text-sm text-gray-600 mb-3 border">
                                No comments yet. Add your feedback below.
                              </div>
                              <Input placeholder="Add review comments..." className="mb-2" />
                            </div>

                            <div className="flex gap-2">
                              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-600 border-red-300">
                                Request Changes
                              </Button>
                              <Button size="sm" variant="outline">
                                Back to In Progress
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {filteredTasks.filter(t => t.status === 'REVIEW').length === 0 && (
                  <div className="text-center py-12">
                    <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium zyphex-heading mb-2">No tasks in review</h3>
                    <p className="zyphex-subheading">Tasks will appear here when they are ready for review!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* PROMPT 30: Completed Tasks View */}
          <TabsContent value="done">
            <Card className="zyphex-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="zyphex-heading">Completed Tasks</CardTitle>
                    <CardDescription className="zyphex-subheading">
                      Archive of finished tasks ({stats.done} tasks)
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Export Report
                    </Button>
                    <Select defaultValue="completionDate">
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="completionDate">Completion Date</SelectItem>
                        <SelectItem value="project">Project</SelectItem>
                        <SelectItem value="assignee">Assignee</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Completion Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-green-600 mb-1">Total Completed</p>
                          <p className="text-2xl font-bold text-green-700">{stats.done}</p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-blue-600 mb-1">Avg Completion Time</p>
                          <p className="text-2xl font-bold text-blue-700">
                            {Math.round(tasks.filter(t => t.status === 'DONE').reduce((sum, t) => sum + t.actualHours, 0) / Math.max(stats.done, 1))}h
                          </p>
                        </div>
                        <Clock className="h-8 w-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-purple-50 border-purple-200">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-purple-600 mb-1">This Month</p>
                          <p className="text-2xl font-bold text-purple-700">{stats.done}</p>
                        </div>
                        <Target className="h-8 w-8 text-purple-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Completed Tasks List */}
                <div className="space-y-3">
                  {filteredTasks.filter(t => t.status === 'DONE').map((task) => (
                    <Card key={task.id} className="hover-zyphex-lift border-green-200 bg-green-50/30">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-start gap-3">
                              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <h3 className="font-semibold mb-1">{task.title}</h3>
                                <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                                <div className="flex gap-4 text-sm text-gray-600">
                                  <div className="flex items-center gap-1">
                                    <Badge variant="outline" className="text-xs">{task.project.name}</Badge>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    <span>{task.assignee?.name || 'Unassigned'}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>Completed {format(new Date(task.updatedAt), 'MMM dd, yyyy')}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    <span>{task.actualHours}h spent</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              View Details
                            </Button>
                            <Button size="sm" variant="outline" className="text-orange-600">
                              Re-open Task
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {filteredTasks.filter(t => t.status === 'DONE').length === 0 && (
                  <div className="text-center py-12">
                    <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium zyphex-heading mb-2">No completed tasks</h3>
                    <p className="zyphex-subheading">Complete some tasks to see them here!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* PROMPT 31: Blocked Tasks View */}
          <TabsContent value="blocked">
            <Card className="zyphex-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="zyphex-heading flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      Blocked Tasks
                    </CardTitle>
                    <CardDescription className="zyphex-subheading">
                      Tasks with blockers requiring attention ({stats.blocked} tasks)
                    </CardDescription>
                  </div>
                  <Button variant="outline" className="text-red-600 border-red-300">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Report Blocker
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredTasks.filter(t => t.status === 'BLOCKED').map((task) => (
                    <Card key={task.id} className="border-red-300 bg-red-50/50">
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
                                <h3 className="text-lg font-semibold">{task.title}</h3>
                                <Badge variant="outline" className={priorityColors[task.priority]}>
                                  {task.priority} PRIORITY
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-3 ml-8">{task.description}</p>
                              
                              <div className="bg-red-100 border border-red-200 rounded-lg p-4 ml-8">
                                <p className="text-sm font-medium text-red-800 mb-2">🚫 Blocker Reason</p>
                                <p className="text-sm text-red-700">
                                  Waiting for security audit approval before proceeding with implementation. 
                                  Dependencies on external authentication service not yet configured.
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm ml-8">
                            <div>
                              <p className="text-gray-500 mb-1">Project</p>
                              <Badge variant="outline" className="text-xs">
                                {task.project.name}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-gray-500 mb-1">Blocked Since</p>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span className="font-medium">{format(new Date(task.updatedAt), 'MMM dd')}</span>
                              </div>
                            </div>
                            <div>
                              <p className="text-gray-500 mb-1">Assignee</p>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <span className="font-medium">{task.assignee?.name || 'Unassigned'}</span>
                              </div>
                            </div>
                            <div>
                              <p className="text-gray-500 mb-1">Resolver</p>
                              <Button variant="outline" size="sm">
                                Assign Resolver
                              </Button>
                            </div>
                          </div>

                          <div className="ml-8 border-t pt-4">
                            <p className="text-sm font-medium mb-2">Blocker Resolution Tracking</p>
                            <div className="space-y-2 mb-3">
                              <div className="flex items-center gap-2 text-sm">
                                <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                                <span className="text-gray-600">Security team contacted - Pending response</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <div className="h-2 w-2 rounded-full bg-gray-300"></div>
                                <span className="text-gray-400">Authentication service setup - Not started</span>
                              </div>
                            </div>
                            <Input placeholder="Add resolution update..." className="mb-2" />
                          </div>

                          <div className="flex gap-2 ml-8">
                            <Button size="sm" className="bg-green-600 hover:bg-green-700">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Resolve Blocker
                            </Button>
                            <Button size="sm" variant="outline">
                              Update Status
                            </Button>
                            <Button size="sm" variant="outline">
                              Escalate Issue
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>Edit Task</DropdownMenuItem>
                                <DropdownMenuItem>Change Priority</DropdownMenuItem>
                                <DropdownMenuItem>View History</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {filteredTasks.filter(t => t.status === 'BLOCKED').length === 0 && (
                  <div className="text-center py-12">
                    <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium zyphex-heading mb-2">No blocked tasks! 🎉</h3>
                    <p className="zyphex-subheading">All tasks are progressing smoothly without blockers.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}