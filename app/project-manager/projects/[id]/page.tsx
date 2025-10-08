"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Calendar,
  Users,
  DollarSign,
  Clock,
  AlertCircle,
  Briefcase,
  User,
  Mail,
  Phone,
  MapPin,
  Edit,
  BarChart3,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  Flag,
  Activity,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { SubtleBackground } from "@/components/subtle-background"
import { format } from "date-fns"

interface Project {
  id: string
  name: string
  description: string
  status: string
  priority: string
  methodology: string
  budget: number
  budgetUsed: number
  hourlyRate: number
  startDate: string
  endDate: string
  estimatedHours: number
  actualHours: number
  completionRate: number
  client: {
    id: string
    name: string
    email: string
  }
  manager: {
    id: string
    name: string
    email: string
  }
  users: Array<{
    id: string
    name: string
    email: string
    role: string
  }>
  tasks: Array<{
    id: string
    title: string
    status: string
    priority: string
    dueDate: string
    assignee: {
      id: string
      name: string
      email: string
    }
  }>
  timeEntries: Array<{
    id: string
    hours: number
    description: string
    date: string
    user: {
      id: string
      name: string
    }
  }>
  documents: Array<{
    id: string
    filename: string
    originalName: string
    fileSize: number
    mimeType: string
    createdAt: string
    user: {
      id: string
      name: string
    }
  }>
}

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchProject()
  }, [params.id])

  const fetchProject = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/project-manager/projects/${params.id}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch project')
      }
      
      const data = await response.json()
      setProject(data.project)
    } catch (error) {
      setError('Failed to load project details')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'done': return 'bg-green-500'
      case 'in_progress': return 'bg-blue-500'
      case 'review': return 'bg-yellow-500'
      case 'testing': return 'bg-purple-500'
      case 'planning': return 'bg-gray-500'
      case 'on_hold': return 'bg-orange-500'
      case 'cancelled': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'text-red-400 bg-red-400/10'
      case 'medium': return 'text-yellow-400 bg-yellow-400/10'
      case 'low': return 'text-green-400 bg-green-400/10'
      default: return 'text-gray-400 bg-gray-400/10'
    }
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6 zyphex-gradient-bg relative min-h-screen">
        <SubtleBackground />
        <div className="relative z-10">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto zyphex-accent-text" />
              <p className="mt-2 zyphex-subheading">Loading project details...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6 zyphex-gradient-bg relative min-h-screen">
        <SubtleBackground />
        <div className="relative z-10">
          <Alert className="border-red-800/50 bg-red-900/20">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || "Project not found"}
            </AlertDescription>
          </Alert>
          <Button
            variant="outline"
            onClick={() => router.push('/project-manager/projects')}
            className="mt-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
        </div>
      </div>
    )
  }

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
              onClick={() => router.push('/project-manager/projects')}
              className="zyphex-button"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Projects
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/project-manager/projects/${project.id}/overview`)}
              className="zyphex-button"
            >
              <Activity className="mr-2 h-4 w-4" />
              Overview
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/project-manager/projects/${project.id}/tasks`)}
              className="zyphex-button"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Manage Tasks
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/project-manager/projects/${project.id}/team`)}
              className="zyphex-button"
            >
              <Users className="mr-2 h-4 w-4" />
              Manage Team
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/project-manager/projects/${project.id}/milestones`)}
              className="zyphex-button"
            >
              <Flag className="mr-2 h-4 w-4" />
              Milestones
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/project-manager/projects/${project.id}/edit`)}
              className="zyphex-button"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Project
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/project-manager/projects/${project.id}/gantt`)}
              className="zyphex-button"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Gantt Chart
            </Button>
          </div>
        </div>

        {/* Project Header */}
        <Card className="zyphex-card">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle className="text-3xl zyphex-heading">{project.name}</CardTitle>
                <CardDescription className="text-lg zyphex-subheading">
                  {project.description}
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={`${getStatusColor(project.status)} text-white`}>
                  {project.status.replace('_', ' ')}
                </Badge>
                <Badge className={getPriorityColor(project.priority)}>
                  {project.priority} Priority
                </Badge>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="zyphex-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Budget</CardTitle>
              <DollarSign className="h-4 w-4 zyphex-accent-text" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-text">
                ${project.budget?.toLocaleString() || 'N/A'}
              </div>
              {project.budgetUsed && (
                <p className="text-xs zyphex-subheading">
                  ${project.budgetUsed.toLocaleString()} used
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="zyphex-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Timeline</CardTitle>
              <Calendar className="h-4 w-4 zyphex-accent-text" />
            </CardHeader>
            <CardContent>
              <div className="text-sm zyphex-text">
                {project.startDate ? format(new Date(project.startDate), 'MMM d, yyyy') : 'No start date'}
              </div>
              <p className="text-xs zyphex-subheading">
                to {project.endDate ? format(new Date(project.endDate), 'MMM d, yyyy') : 'No end date'}
              </p>
            </CardContent>
          </Card>

          <Card className="zyphex-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Team</CardTitle>
              <Users className="h-4 w-4 zyphex-accent-text" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-text">{project.users.length}</div>
              <p className="text-xs zyphex-subheading">team members</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Progress</CardTitle>
              <Clock className="h-4 w-4 zyphex-accent-text" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-text">
                {project.completionRate || 0}%
              </div>
              <Progress value={project.completionRate || 0} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Client and Manager Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="zyphex-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 zyphex-heading">
                <Briefcase className="h-5 w-5" />
                Client Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <User className="h-4 w-4 zyphex-accent-text" />
                <div>
                  <p className="font-medium zyphex-text">{project.client.name}</p>
                  <p className="text-sm zyphex-subheading">Client</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 zyphex-accent-text" />
                <div>
                  <p className="font-medium zyphex-text">{project.client.email}</p>
                  <p className="text-sm zyphex-subheading">Email</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="zyphex-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 zyphex-heading">
                <User className="h-5 w-5" />
                Project Manager
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <User className="h-4 w-4 zyphex-accent-text" />
                <div>
                  <p className="font-medium zyphex-text">{project.manager?.name || 'Not assigned'}</p>
                  <p className="text-sm zyphex-subheading">Manager</p>
                </div>
              </div>
              {project.manager && (
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 zyphex-accent-text" />
                  <div>
                    <p className="font-medium zyphex-text">{project.manager.email}</p>
                    <p className="text-sm zyphex-subheading">Email</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Team Members */}
        <Card className="zyphex-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 zyphex-heading">
              <Users className="h-5 w-5" />
              Team Members ({project.users.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {project.users.map((user) => (
                <div key={user.id} className="flex items-center space-x-3 p-3 rounded-lg bg-slate-800/50">
                  <User className="h-8 w-8 p-2 bg-blue-500/20 rounded-full text-blue-400" />
                  <div>
                    <p className="font-medium zyphex-text">{user.name}</p>
                    <p className="text-sm zyphex-subheading">{user.role}</p>
                    <p className="text-xs zyphex-subheading">{user.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Tasks */}
        {project.tasks && project.tasks.length > 0 && (
          <Card className="zyphex-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 zyphex-heading">
                <CheckCircle className="h-5 w-5" />
                Recent Tasks ({project.tasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {project.tasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                    <div>
                      <p className="font-medium zyphex-text">{task.title}</p>
                      <p className="text-sm zyphex-subheading">
                        Assigned to: {task.assignee?.name || 'Unassigned'}
                      </p>
                      {task.dueDate && (
                        <p className="text-xs zyphex-subheading">
                          Due: {format(new Date(task.dueDate), 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                      <Badge className={getStatusColor(task.status)}>
                        {task.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}