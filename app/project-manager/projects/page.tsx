"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  Briefcase,
  Plus,
  Search,
  MoreHorizontal,
  DollarSign,
  Clock,
  BarChart3,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { SubtleBackground } from "@/components/subtle-background"

interface Project {
  id: string
  name: string
  description?: string
  status: string
  priority: string
  methodology: string
  budget: number
  budgetUsed: number
  completionRate: number
  startDate?: string
  endDate?: string
  client: {
    name: string
    email: string
  }
  manager?: {
    name: string
    email: string
  }
  tasks: Array<{
    status: string
  }>
  createdAt: string
}

const statusColors = {
  PLANNING: "bg-yellow-100 text-yellow-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800", 
  REVIEW: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-green-100 text-green-800",
  ON_HOLD: "bg-orange-100 text-orange-800",
  CANCELLED: "bg-red-100 text-red-800",
}

const priorityColors = {
  LOW: "bg-gray-100 text-gray-800",
  MEDIUM: "bg-blue-100 text-blue-800",
  HIGH: "bg-orange-100 text-orange-800", 
  CRITICAL: "bg-red-100 text-red-800",
}

export default function AllProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [priorityFilter, setPriorityFilter] = useState("ALL")
  const [sortBy, setSortBy] = useState("name")

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects || [])
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.client.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "ALL" || project.status === statusFilter
    const matchesPriority = priorityFilter === "ALL" || project.priority === priorityFilter
    
    return matchesSearch && matchesStatus && matchesPriority
  })

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name)
      case "status":
        return a.status.localeCompare(b.status)
      case "priority":
        return a.priority.localeCompare(b.priority)
      case "budget":
        return b.budget - a.budget
      case "completion":
        return b.completionRate - a.completionRate
      case "created":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      default:
        return 0
    }
  })

  const projectStats = {
    total: projects.length,
    active: projects.filter(p => p.status === 'IN_PROGRESS').length,
    planning: projects.filter(p => p.status === 'PLANNING').length,
    completed: projects.filter(p => p.status === 'COMPLETED').length,
    totalBudget: projects.reduce((sum, p) => sum + p.budget, 0),
    usedBudget: projects.reduce((sum, p) => sum + p.budgetUsed, 0),
  }

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
            <h1 className="text-3xl font-bold zyphex-heading">All Projects</h1>
            <p className="zyphex-subheading">Manage and oversee all project activities</p>
          </div>
          <Button asChild className="zyphex-button-primary">
            <Link href="/dashboard/projects/create">
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Link>
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="zyphex-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Total Projects</CardTitle>
              <Briefcase className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">{projectStats.total}</div>
              <p className="text-xs zyphex-subheading">
                {projectStats.active} active, {projectStats.completed} completed
              </p>
            </CardContent>
          </Card>

          <Card className="zyphex-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Active Projects</CardTitle>
              <BarChart3 className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">{projectStats.active}</div>
              <p className="text-xs zyphex-subheading">Currently in progress</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Total Budget</CardTitle>
              <DollarSign className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">${projectStats.totalBudget.toLocaleString()}</div>
              <p className="text-xs zyphex-subheading">
                ${projectStats.usedBudget.toLocaleString()} used ({Math.round((projectStats.usedBudget / projectStats.totalBudget) * 100)}%)
              </p>
            </CardContent>
          </Card>

          <Card className="zyphex-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Planning Phase</CardTitle>
              <Clock className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">{projectStats.planning}</div>
              <p className="text-xs zyphex-subheading">Projects in planning</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="zyphex-card">
          <CardHeader>
            <CardTitle className="zyphex-heading">Project Management</CardTitle>
            <CardDescription className="zyphex-subheading">
              Filter and manage your projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search projects or clients..."
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
                  <SelectItem value="PLANNING">Planning</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="REVIEW">Review</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="ON_HOLD">On Hold</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
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

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="budget">Budget</SelectItem>
                  <SelectItem value="completion">Completion</SelectItem>
                  <SelectItem value="created">Created Date</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Projects Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Timeline</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedProjects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell>
                        <div>
                          <Link href={`/project-manager/projects/${project.id}`} className="font-medium text-blue-600 hover:text-blue-800">
                            {project.name}
                          </Link>
                          <p className="text-sm text-gray-500">{project.methodology}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{project.client.name}</p>
                          <p className="text-sm text-gray-500">{project.client.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[project.status as keyof typeof statusColors]}>
                          {project.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={priorityColors[project.priority as keyof typeof priorityColors]}>
                          {project.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{project.completionRate}%</span>
                          </div>
                          <Progress value={project.completionRate} className="h-2" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">${project.budget.toLocaleString()}</p>
                          <p className="text-sm text-gray-500">${project.budgetUsed.toLocaleString()} used</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {project.startDate && (
                            <p>Start: {format(new Date(project.startDate), 'MMM dd, yyyy')}</p>
                          )}
                          {project.endDate && (
                            <p>End: {format(new Date(project.endDate), 'MMM dd, yyyy')}</p>
                          )}
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
                            <DropdownMenuItem asChild>
                              <Link href={`/project-manager/projects/${project.id}`}>
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/project-manager/projects/${project.id}/edit`}>
                                Edit Project
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/project-manager/projects/${project.id}/gantt`}>
                                Gantt Chart
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {sortedProjects.length === 0 && (
              <div className="text-center py-12">
                <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium zyphex-heading mb-2">No projects found</h3>
                <p className="zyphex-subheading mb-4">
                  {searchTerm || statusFilter !== "ALL" || priorityFilter !== "ALL"
                    ? "Try adjusting your filters or search terms."
                    : "Get started by creating your first project."}
                </p>
                <Button asChild className="zyphex-button-primary">
                  <Link href="/dashboard/projects/create">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Project
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}