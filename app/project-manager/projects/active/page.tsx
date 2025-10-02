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
  BarChart3,
  Loader2,
  Play,
  Pause,
  AlertTriangle,
  TrendingUp,
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
  IN_PROGRESS: "bg-blue-100 text-blue-800", 
  REVIEW: "bg-purple-100 text-purple-800",
}

const priorityColors = {
  LOW: "bg-gray-100 text-gray-800",
  MEDIUM: "bg-blue-100 text-blue-800",
  HIGH: "bg-orange-100 text-orange-800", 
  CRITICAL: "bg-red-100 text-red-800",
}

export default function ActiveProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("ALL")
  const [sortBy, setSortBy] = useState("name")

  useEffect(() => {
    fetchActiveProjects()
  }, [])

  const fetchActiveProjects = async () => {
    try {
      const response = await fetch('/api/projects?status=IN_PROGRESS,REVIEW')
      if (response.ok) {
        const data = await response.json()
        // Filter for only active projects
        const activeProjects = (data.projects || []).filter((p: Project) => 
          p.status === 'IN_PROGRESS' || p.status === 'REVIEW'
        )
        setProjects(activeProjects)
      }
    } catch (error) {
      console.error('Error fetching active projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.client.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPriority = priorityFilter === "ALL" || project.priority === priorityFilter
    
    return matchesSearch && matchesPriority
  })

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name)
      case "priority":
        return a.priority.localeCompare(b.priority)
      case "completion":
        return b.completionRate - a.completionRate
      case "budget":
        return b.budget - a.budget
      case "deadline":
        if (!a.endDate && !b.endDate) return 0
        if (!a.endDate) return 1
        if (!b.endDate) return -1
        return new Date(a.endDate).getTime() - new Date(b.endDate).getTime()
      default:
        return 0
    }
  })

  const projectStats = {
    total: projects.length,
    inProgress: projects.filter(p => p.status === 'IN_PROGRESS').length,
    inReview: projects.filter(p => p.status === 'REVIEW').length,
    highPriority: projects.filter(p => p.priority === 'HIGH' || p.priority === 'CRITICAL').length,
    avgCompletion: projects.length > 0 ? Math.round(projects.reduce((sum, p) => sum + p.completionRate, 0) / projects.length) : 0,
    totalBudget: projects.reduce((sum, p) => sum + p.budget, 0),
    usedBudget: projects.reduce((sum, p) => sum + p.budgetUsed, 0),
  }

  const overdueTasks = projects.filter(p => {
    if (!p.endDate) return false
    return new Date(p.endDate) < new Date() && p.status !== 'COMPLETED'
  }).length

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
            <h1 className="text-3xl font-bold zyphex-heading">Active Projects</h1>
            <p className="zyphex-subheading">Monitor and manage projects currently in progress</p>
          </div>
          <Button asChild className="zyphex-button-primary">
            <Link href="/dashboard/projects/create">
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Link>
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="zyphex-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Active Projects</CardTitle>
              <Play className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">{projectStats.total}</div>
              <p className="text-xs zyphex-subheading">Currently active</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">In Progress</CardTitle>
              <BarChart3 className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">{projectStats.inProgress}</div>
              <p className="text-xs zyphex-subheading">Active development</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">In Review</CardTitle>
              <Pause className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">{projectStats.inReview}</div>
              <p className="text-xs zyphex-subheading">Pending review</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">High Priority</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">{projectStats.highPriority}</div>
              <p className="text-xs zyphex-subheading">Urgent attention</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Avg. Completion</CardTitle>
              <TrendingUp className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">{projectStats.avgCompletion}%</div>
              <p className="text-xs zyphex-subheading">Average progress</p>
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        {overdueTasks > 0 && (
          <Card className="border-red-200 bg-red-50 zyphex-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-800">Attention Required</p>
                  <p className="text-sm text-red-600">
                    {overdueTasks} project{overdueTasks > 1 ? 's are' : ' is'} past deadline and require immediate attention.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters and Search */}
        <Card className="zyphex-card">
          <CardHeader>
            <CardTitle className="zyphex-heading">Active Project Management</CardTitle>
            <CardDescription className="zyphex-subheading">
              Monitor progress and manage active projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search active projects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

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
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="completion">Completion</SelectItem>
                  <SelectItem value="budget">Budget</SelectItem>
                  <SelectItem value="deadline">Deadline</SelectItem>
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
                    <TableHead>Budget Usage</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedProjects.map((project) => {
                    const isOverdue = project.endDate && new Date(project.endDate) < new Date()
                    return (
                      <TableRow key={project.id} className={isOverdue ? "bg-red-50" : ""}>
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
                            <p className="font-medium">${project.budgetUsed.toLocaleString()} / ${project.budget.toLocaleString()}</p>
                            <Progress 
                              value={(project.budgetUsed / project.budget) * 100} 
                              className="h-2 mt-1"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          {project.endDate ? (
                            <div className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                              {format(new Date(project.endDate), 'MMM dd, yyyy')}
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
                                <Link href={`/project-manager/projects/${project.id}/gantt`}>
                                  Gantt Chart
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/project-manager/projects/${project.id}/tasks`}>
                                  Manage Tasks
                                </Link>
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

            {sortedProjects.length === 0 && (
              <div className="text-center py-12">
                <Play className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium zyphex-heading mb-2">No active projects</h3>
                <p className="zyphex-subheading mb-4">
                  {searchTerm || priorityFilter !== "ALL"
                    ? "No active projects match your current filters."
                    : "All projects are either completed or in planning phase."}
                </p>
                <Button asChild className="zyphex-button-primary">
                  <Link href="/project-manager/projects">
                    <Briefcase className="h-4 w-4 mr-2" />
                    View All Projects
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