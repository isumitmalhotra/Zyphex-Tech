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

          {/* Similar TabsContent for other status filters would go here */}
          <TabsContent value="todo">
            <Card className="zyphex-card">
              <CardContent className="pt-6">
                <p className="text-center text-gray-500">To Do tasks view - Coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="in-progress">
            <Card className="zyphex-card">
              <CardContent className="pt-6">
                <p className="text-center text-gray-500">In Progress tasks view - Coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="review">
            <Card className="zyphex-card">
              <CardContent className="pt-6">
                <p className="text-center text-gray-500">Review tasks view - Coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="done">
            <Card className="zyphex-card">
              <CardContent className="pt-6">
                <p className="text-center text-gray-500">Completed tasks view - Coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="blocked">
            <Card className="zyphex-card">
              <CardContent className="pt-6">
                <p className="text-center text-gray-500">Blocked tasks view - Coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}