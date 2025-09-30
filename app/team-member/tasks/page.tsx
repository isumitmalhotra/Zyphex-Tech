"use client"

import { useState } from "react"
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
  Trash2,
  PlayCircle,
  PauseCircle,
  MoreHorizontal,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Mock data for tasks
const tasks = [
  {
    id: "1",
    title: "Implement user authentication",
    description: "Set up NextAuth.js with Google and email providers",
    status: "IN_PROGRESS",
    priority: "HIGH",
    project: "E-commerce Platform",
    dueDate: "2025-10-05",
    estimatedHours: 8,
    actualHours: 5.5,
    assignedDate: "2025-09-28",
  },
  {
    id: "2", 
    title: "Design product catalog UI",
    description: "Create responsive product grid with filters",
    status: "TODO",
    priority: "MEDIUM",
    project: "E-commerce Platform",
    dueDate: "2025-10-08",
    estimatedHours: 12,
    actualHours: 0,
    assignedDate: "2025-09-29",
  },
  {
    id: "3",
    title: "Fix mobile responsiveness",
    description: "Address layout issues on mobile devices",
    status: "REVIEW",
    priority: "HIGH",
    project: "Mobile App Development",
    dueDate: "2025-10-02",
    estimatedHours: 6,
    actualHours: 6,
    assignedDate: "2025-09-25",
  },
  {
    id: "4",
    title: "Write unit tests",
    description: "Add test coverage for authentication module",
    status: "DONE",
    priority: "MEDIUM",
    project: "Data Analytics Dashboard",
    dueDate: "2025-09-30",
    estimatedHours: 4,
    actualHours: 4.5,
    assignedDate: "2025-09-26",
  },
]

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

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "ALL" || task.status === statusFilter
    const matchesPriority = priorityFilter === "ALL" || task.priority === priorityFilter
    
    return matchesSearch && matchesStatus && matchesPriority
  })

  const taskStats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === "TODO").length,
    inProgress: tasks.filter(t => t.status === "IN_PROGRESS").length,
    review: tasks.filter(t => t.status === "REVIEW").length,
    done: tasks.filter(t => t.status === "DONE").length,
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
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="bg-gray-900/50 border-gray-700">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">{taskStats.total}</div>
            <p className="text-xs text-muted-foreground">Total Tasks</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 border-gray-700">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-400">{taskStats.todo}</div>
            <p className="text-xs text-muted-foreground">To Do</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-900/20 border-blue-700">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-400">{taskStats.inProgress}</div>
            <p className="text-xs text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-900/20 border-yellow-700">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-400">{taskStats.review}</div>
            <p className="text-xs text-muted-foreground">In Review</p>
          </CardContent>
        </Card>
        <Card className="bg-green-900/20 border-green-700">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-400">{taskStats.done}</div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
      </div>

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
            {filteredTasks.length} of {tasks.length} tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
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
              {filteredTasks.map((task) => {
                const progress = task.estimatedHours > 0 
                  ? Math.min((task.actualHours / task.estimatedHours) * 100, 100)
                  : 0
                const isOverdue = new Date(task.dueDate) < new Date() && task.status !== "DONE"
                
                return (
                  <TableRow key={task.id} className="border-gray-700">
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(task.status)}
                          <span className="font-medium text-white">{task.title}</span>
                          {isOverdue && <Badge variant="destructive" className="text-xs">Overdue</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-blue-400">{task.project}</span>
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
                        <span className={isOverdue ? "text-red-400" : "text-gray-300"}>
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Progress value={progress} className="w-20" />
                        <span className="text-xs text-muted-foreground">
                          {task.actualHours}h / {task.estimatedHours}h
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
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Task
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <PlayCircle className="h-4 w-4 mr-2" />
                            Start Timer
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}