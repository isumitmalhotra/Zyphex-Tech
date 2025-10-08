"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  ArrowLeft,
  Calendar,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Target,
  TrendingUp,
  FileText,
  DollarSign,
  BarChart3,
  Activity,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { SubtleBackground } from "@/components/subtle-background"
import { format, differenceInDays } from "date-fns"
import { RealtimeTaskUpdates } from "@/components/realtime/RealtimeTaskUpdates"
import { RealtimeProjectActivity } from "@/components/realtime/RealtimeProjectActivity"
import { RealtimeMessages } from "@/components/realtime/RealtimeMessages"

interface ProjectStats {
  id: string
  name: string
  description: string
  status: string
  priority: string
  startDate: string | null
  endDate: string | null
  budget: number
  budgetUsed: number
  completionRate: number
  tasks: {
    total: number
    completed: number
    inProgress: number
    overdue: number
  }
  milestones: {
    total: number
    completed: number
    atRisk: number
  }
  team: {
    total: number
    manager: string
  }
  timeline: {
    daysRemaining: number
    isOverdue: boolean
    progress: number
  }
}

export default function ProjectOverviewPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<ProjectStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchProjectStats()
  }, [params.id])

  const fetchProjectStats = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/project-manager/projects/${params.id}/overview`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch project overview')
      }
      
      const data = await response.json()
      setProject(data.project)
    } catch (error) {
      setError('Failed to load project overview')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'done': return 'bg-green-500 text-white'
      case 'in_progress': return 'bg-blue-500 text-white'
      case 'review': return 'bg-yellow-500 text-black'
      case 'testing': return 'bg-purple-500 text-white'
      case 'planning': return 'bg-gray-500 text-white'
      case 'on_hold': return 'bg-orange-500 text-white'
      case 'cancelled': return 'bg-red-500 text-white'
      default: return 'bg-gray-500 text-white'
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
              <p className="mt-2 zyphex-subheading">Loading project overview...</p>
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
              onClick={() => router.push(`/project-manager/projects/${params.id}`)}
              className="zyphex-button"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Project
            </Button>
            <div>
              <h1 className="text-2xl font-bold zyphex-heading">Project Overview</h1>
              <p className="zyphex-subheading">{project.name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={getStatusColor(project.status)}>
              {project.status.replace('_', ' ')}
            </Badge>
            <Badge className={getPriorityColor(project.priority)}>
              {project.priority} Priority
            </Badge>
          </div>
        </div>

        {/* Project Health Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Overall Progress */}
          <Card className="zyphex-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Overall Progress</CardTitle>
              <TrendingUp className="h-4 w-4 zyphex-accent-text" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-text">{project.completionRate}%</div>
              <Progress value={project.completionRate} className="mt-2" />
            </CardContent>
          </Card>

          {/* Budget Status */}
          <Card className="zyphex-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Budget Status</CardTitle>
              <DollarSign className="h-4 w-4 zyphex-accent-text" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-text">
                ${project.budgetUsed.toLocaleString()}
              </div>
              <p className="text-xs zyphex-subheading">
                of ${project.budget.toLocaleString()} budget
              </p>
              <Progress value={(project.budgetUsed / project.budget) * 100} className="mt-2" />
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="zyphex-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Timeline</CardTitle>
              <Calendar className="h-4 w-4 zyphex-accent-text" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${project.timeline.isOverdue ? 'text-red-400' : 'zyphex-text'}`}>
                {project.timeline.isOverdue ? 'Overdue' : `${project.timeline.daysRemaining} days`}
              </div>
              <p className="text-xs zyphex-subheading">
                {project.timeline.isOverdue ? 'Past deadline' : 'remaining'}
              </p>
            </CardContent>
          </Card>

          {/* Team Size */}
          <Card className="zyphex-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Team Size</CardTitle>
              <Users className="h-4 w-4 zyphex-accent-text" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-text">{project.team.total}</div>
              <p className="text-xs zyphex-subheading">team members</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Task Breakdown */}
          <Card className="zyphex-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 zyphex-heading">
                <CheckCircle className="h-5 w-5" />
                Task Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm zyphex-subheading">Total Tasks</span>
                <span className="font-medium zyphex-text">{project.tasks.total}</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-400">Completed</span>
                  <span className="font-medium text-green-400">{project.tasks.completed}</span>
                </div>
                <Progress 
                  value={project.tasks.total > 0 ? (project.tasks.completed / project.tasks.total) * 100 : 0} 
                  className="h-2 bg-slate-800"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-400">In Progress</span>
                  <span className="font-medium text-blue-400">{project.tasks.inProgress}</span>
                </div>
                <Progress 
                  value={project.tasks.total > 0 ? (project.tasks.inProgress / project.tasks.total) * 100 : 0} 
                  className="h-2 bg-slate-800"
                />
              </div>

              {project.tasks.overdue > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-red-400">Overdue</span>
                    <span className="font-medium text-red-400">{project.tasks.overdue}</span>
                  </div>
                  <Progress 
                    value={project.tasks.total > 0 ? (project.tasks.overdue / project.tasks.total) * 100 : 0} 
                    className="h-2 bg-slate-800"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Milestone Progress */}
          <Card className="zyphex-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 zyphex-heading">
                <Target className="h-5 w-5" />
                Milestone Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm zyphex-subheading">Total Milestones</span>
                <span className="font-medium zyphex-text">{project.milestones.total}</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-400">Completed</span>
                  <span className="font-medium text-green-400">{project.milestones.completed}</span>
                </div>
                <Progress 
                  value={project.milestones.total > 0 ? (project.milestones.completed / project.milestones.total) * 100 : 0} 
                  className="h-2 bg-slate-800"
                />
              </div>

              {project.milestones.atRisk > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-yellow-400">At Risk</span>
                    <span className="font-medium text-yellow-400">{project.milestones.atRisk}</span>
                  </div>
                  <Progress 
                    value={project.milestones.total > 0 ? (project.milestones.atRisk / project.milestones.total) * 100 : 0} 
                    className="h-2 bg-slate-800"
                  />
                </div>
              )}

              {project.milestones.total === 0 && (
                <p className="text-sm zyphex-subheading text-center py-4">
                  No milestones created yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Project Timeline */}
        <Card className="zyphex-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 zyphex-heading">
              <Calendar className="h-5 w-5" />
              Project Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-sm zyphex-subheading">Start Date</div>
                <div className="text-lg font-medium zyphex-text">
                  {project.startDate ? format(new Date(project.startDate), 'MMM d, yyyy') : 'Not set'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm zyphex-subheading">End Date</div>
                <div className="text-lg font-medium zyphex-text">
                  {project.endDate ? format(new Date(project.endDate), 'MMM d, yyyy') : 'Not set'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm zyphex-subheading">Duration</div>
                <div className="text-lg font-medium zyphex-text">
                  {project.startDate && project.endDate
                    ? `${differenceInDays(new Date(project.endDate), new Date(project.startDate))} days`
                    : 'Not calculated'
                  }
                </div>
              </div>
            </div>
            
            {project.startDate && project.endDate && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm zyphex-subheading">Timeline Progress</span>
                  <span className="text-sm zyphex-text">{project.timeline.progress}%</span>
                </div>
                <Progress value={project.timeline.progress} className="h-3" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="zyphex-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 zyphex-heading">
              <Activity className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
                <Target className="mr-2 h-4 w-4" />
                Milestones
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push(`/project-manager/projects/${project.id}/gantt`)}
                className="zyphex-button"
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Gantt Chart
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push(`/project-manager/projects/${project.id}`)}
                className="zyphex-button"
              >
                <FileText className="mr-2 h-4 w-4" />
                Full Details
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Real-time Features Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">
          {/* Real-time Task Updates */}
          <RealtimeTaskUpdates 
            projectId={params.id}
            className="lg:col-span-1"
          />
          
          {/* Real-time Project Activity */}
          <RealtimeProjectActivity 
            projectId={params.id}
            className="lg:col-span-1"
            maxHeight="h-80"
          />
          
          {/* Real-time Messages */}
          <RealtimeMessages 
            projectId={params.id}
            className="lg:col-span-1 xl:col-span-1"
            maxHeight="h-80"
          />
        </div>
      </div>
    </div>
  )
}