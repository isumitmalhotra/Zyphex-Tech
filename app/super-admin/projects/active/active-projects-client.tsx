"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import {
  Folder,
  Calendar,
  DollarSign,
  Clock,
  Edit,
  Eye,
  Search,
  UserPlus,
  Settings,
  Activity,
  Briefcase,
  FileText,
  Timer,
  Target,
  BarChart3,
  Download
} from "lucide-react"

interface ProjectTeamMember {
  name: string
  role: string
  avatar: string
}

interface ProjectTasks {
  total: number
  completed: number
  inProgress: number
  todo: number
}

interface Project {
  id: string
  name: string
  client: string
  status: string
  progress: number
  phase: string
  sprint: string
  startDate: string
  dueDate: string
  budget: number
  spent: number
  team: ProjectTeamMember[]
  tasks: ProjectTasks
  health: string
  priority: string
  lastUpdate: string
}

interface ActiveProjectsClientProps {
  initialProjects: Project[]
}

export function ActiveProjectsClient({ initialProjects }: ActiveProjectsClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("progress")

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "on-track":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "at-risk":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "delayed":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  // Get health indicator
  const getHealthIndicator = (health: string) => {
    switch (health) {
      case "excellent":
        return { color: "text-green-400", label: "Excellent" }
      case "good":
        return { color: "text-blue-400", label: "Good" }
      case "at-risk":
        return { color: "text-yellow-400", label: "At Risk" }
      case "critical":
        return { color: "text-red-400", label: "Critical" }
      default:
        return { color: "text-gray-400", label: "Unknown" }
    }
  }

  // Get priority badge
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      case "high":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30"
      case "medium":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "low":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  // Calculate budget utilization percentage
  const getBudgetUtilization = (spent: number, budget: number) => {
    return ((spent / budget) * 100).toFixed(1)
  }

  // Calculate days remaining
  const getDaysRemaining = (dueDate: string) => {
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    return initialProjects
      .filter((project) => {
        const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            project.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            project.id.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = statusFilter === "all" || project.status === statusFilter
        return matchesSearch && matchesStatus
      })
      .sort((a, b) => {
        if (sortBy === "progress") return b.progress - a.progress
        if (sortBy === "budget") return b.budget - a.budget
        if (sortBy === "name") return a.name.localeCompare(b.name)
        return 0
      })
  }, [initialProjects, searchQuery, statusFilter, sortBy])

  // Export functionality
  const handleExport = (format: string) => {
    console.log(`Exporting active projects as ${format}`)
    // TODO: Implement actual export logic
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold zyphex-heading mb-2">Active Projects</h1>
          <p className="text-lg zyphex-subheading">
            Manage and monitor all currently active projects
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="zyphex-button-secondary"
            onClick={() => handleExport("csv")}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button 
            variant="outline" 
            className="zyphex-button-secondary"
            onClick={() => handleExport("pdf")}
          >
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="zyphex-card">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="search" className="text-sm zyphex-subheading mb-2 block">
                Search Projects
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name, client, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 zyphex-input"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status" className="text-sm zyphex-subheading mb-2 block">
                Status Filter
              </Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status" className="zyphex-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="zyphex-dropdown">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="on-track">On Track</SelectItem>
                  <SelectItem value="at-risk">At Risk</SelectItem>
                  <SelectItem value="delayed">Delayed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sort" className="text-sm zyphex-subheading mb-2 block">
                Sort By
              </Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger id="sort" className="zyphex-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="zyphex-dropdown">
                  <SelectItem value="progress">Progress</SelectItem>
                  <SelectItem value="budget">Budget</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredProjects.map((project) => {
          const health = getHealthIndicator(project.health)
          const daysRemaining = getDaysRemaining(project.dueDate)
          const budgetUtil = getBudgetUtilization(project.spent, project.budget)
          
          return (
            <Card key={project.id} className="zyphex-card hover-zyphex-lift transition-all duration-300">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                        {project.id}
                      </Badge>
                      <Badge variant="outline" className={getPriorityBadge(project.priority)}>
                        {project.priority}
                      </Badge>
                    </div>
                    <CardTitle className="zyphex-heading text-xl mb-1">{project.name}</CardTitle>
                    <CardDescription className="zyphex-subheading flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      {project.client}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="outline" className={getStatusBadge(project.status)}>
                      {project.status.replace("-", " ")}
                    </Badge>
                    <span className={`text-xs font-medium ${health.color}`}>
                      ● {health.label}
                    </span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Progress */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm zyphex-subheading">Overall Progress</span>
                    <span className="text-sm font-bold zyphex-heading">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>

                <Separator className="bg-gray-800/50" />

                {/* Phase & Sprint */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-cyan-400" />
                    <div>
                      <p className="text-xs zyphex-subheading">Phase</p>
                      <p className="text-sm font-medium zyphex-heading">{project.phase}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-purple-400" />
                    <div>
                      <p className="text-xs zyphex-subheading">Sprint</p>
                      <p className="text-sm font-medium zyphex-heading">{project.sprint}</p>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-green-400" />
                    <div>
                      <p className="text-xs zyphex-subheading">Due Date</p>
                      <p className="text-sm font-medium zyphex-heading">{project.dueDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-400" />
                    <div>
                      <p className="text-xs zyphex-subheading">Days Remaining</p>
                      <p className={`text-sm font-medium ${
                        daysRemaining < 30 ? "text-red-400" : daysRemaining < 60 ? "text-yellow-400" : "text-green-400"
                      }`}>
                        {daysRemaining} days
                      </p>
                    </div>
                  </div>
                </div>

                {/* Budget */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-yellow-400" />
                      <span className="text-sm zyphex-subheading">Budget Utilization</span>
                    </div>
                    <span className="text-sm font-bold zyphex-heading">{budgetUtil}%</span>
                  </div>
                  <Progress 
                    value={parseFloat(budgetUtil)} 
                    className="h-2 mb-1" 
                  />
                  <div className="flex items-center justify-between text-xs zyphex-subheading">
                    <span>${project.spent.toLocaleString()} spent</span>
                    <span>${project.budget.toLocaleString()} total</span>
                  </div>
                </div>

                {/* Tasks */}
                <div className="p-3 rounded-lg bg-gray-800/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium zyphex-heading">Task Progress</span>
                    <span className="text-xs zyphex-subheading">
                      {project.tasks.completed}/{project.tasks.total} completed
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs text-center">
                    <div>
                      <p className="zyphex-subheading">Total</p>
                      <p className="font-bold zyphex-heading">{project.tasks.total}</p>
                    </div>
                    <div>
                      <p className="text-green-400">Done</p>
                      <p className="font-bold text-green-400">{project.tasks.completed}</p>
                    </div>
                    <div>
                      <p className="text-blue-400">In Progress</p>
                      <p className="font-bold text-blue-400">{project.tasks.inProgress}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">To Do</p>
                      <p className="font-bold text-gray-400">{project.tasks.todo}</p>
                    </div>
                  </div>
                </div>

                {/* Team */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium zyphex-heading">Team Members</span>
                    <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                      {project.team.length} members
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex -space-x-2">
                      {project.team.slice(0, 4).map((member, idx) => (
                        <div
                          key={idx}
                          className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white border-2 border-gray-900"
                          title={`${member.name} - ${member.role}`}
                        >
                          {member.avatar}
                        </div>
                      ))}
                      {project.team.length > 4 && (
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-300 border-2 border-gray-900">
                          +{project.team.length - 4}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    {project.team.slice(0, 2).map((member, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="zyphex-subheading">{member.name}</span>
                        <span className="text-blue-400">{member.role}</span>
                      </div>
                    ))}
                    {project.team.length > 2 && (
                      <p className="text-xs zyphex-subheading">+{project.team.length - 2} more</p>
                    )}
                  </div>
                </div>

                <Separator className="bg-gray-800/50" />

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <span className="text-xs zyphex-subheading flex items-center gap-1">
                    <Timer className="h-3 w-3" />
                    Updated {project.lastUpdate}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="zyphex-button-secondary">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button size="sm" variant="outline" className="zyphex-button-secondary">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" className="zyphex-button-secondary">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Empty State */}
      {filteredProjects.length === 0 && (
        <Card className="zyphex-card">
          <CardContent className="p-12 text-center">
            <Folder className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold zyphex-heading mb-2">No projects found</h3>
            <p className="zyphex-subheading mb-6">
              Try adjusting your search or filter criteria
            </p>
            <Button 
              variant="outline" 
              className="zyphex-button-secondary"
              onClick={() => {
                setSearchQuery("")
                setStatusFilter("all")
              }}
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions Panel */}
      <Card className="zyphex-card">
        <CardHeader>
          <CardTitle className="zyphex-heading">Quick Actions</CardTitle>
          <CardDescription className="zyphex-subheading">
            Manage active projects efficiently
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="zyphex-button-primary justify-start h-auto py-4">
              <UserPlus className="h-5 w-5 mr-3" />
              <div className="text-left">
                <p className="font-semibold">Assign Resources</p>
                <p className="text-xs opacity-80">Allocate team members to projects</p>
              </div>
            </Button>
            <Button className="zyphex-button-primary justify-start h-auto py-4">
              <BarChart3 className="h-5 w-5 mr-3" />
              <div className="text-left">
                <p className="font-semibold">View Analytics</p>
                <p className="text-xs opacity-80">Project performance insights</p>
              </div>
            </Button>
            <Button className="zyphex-button-primary justify-start h-auto py-4">
              <FileText className="h-5 w-5 mr-3" />
              <div className="text-left">
                <p className="font-semibold">Generate Report</p>
                <p className="text-xs opacity-80">Create project status reports</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
