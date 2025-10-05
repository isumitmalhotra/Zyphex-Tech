"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  ArrowLeft,
  Calendar,
  BarChart3,
  AlertCircle,
  Loader2,
  Eye,
  Edit,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { SubtleBackground } from "@/components/subtle-background"
import { format, differenceInDays, parseISO } from "date-fns"

interface Task {
  id: string
  title: string
  description: string
  status: string
  priority: string
  startDate: string
  dueDate: string
  progress: number
  assignee: {
    id: string
    name: string
    email: string
  }
}

interface Project {
  id: string
  name: string
  description: string
  startDate: string
  endDate: string
  tasks: Task[]
}

export default function ProjectGanttPage({ params }: { params: { id: string } }) {
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
      console.error('Error fetching project:', error)
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
      case 'todo': return 'bg-gray-500'
      case 'cancelled': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'border-red-400'
      case 'medium': return 'border-yellow-400'
      case 'low': return 'border-green-400'
      default: return 'border-gray-400'
    }
  }

  const calculateTaskPosition = (startDate: string, endDate: string, projectStart: string, projectEnd: string) => {
    const projectStartDate = parseISO(projectStart)
    const projectEndDate = parseISO(projectEnd)
    const taskStartDate = parseISO(startDate)
    const taskEndDate = parseISO(endDate)
    
    const totalDays = differenceInDays(projectEndDate, projectStartDate)
    const taskStartDays = differenceInDays(taskStartDate, projectStartDate)
    const taskDuration = differenceInDays(taskEndDate, taskStartDate)
    
    const leftPercent = (taskStartDays / totalDays) * 100
    const widthPercent = (taskDuration / totalDays) * 100
    
    return {
      left: Math.max(0, leftPercent),
      width: Math.max(1, widthPercent)
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
              <p className="mt-2 zyphex-subheading">Loading Gantt chart...</p>
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

  const hasValidDates = project.startDate && project.endDate && project.tasks.some(task => task.startDate && task.dueDate)

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
              <h1 className="text-2xl font-bold zyphex-heading">Gantt Chart</h1>
              <p className="zyphex-subheading">{project.name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/project-manager/projects/${params.id}`)}
              className="zyphex-button"
            >
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/project-manager/projects/${params.id}/edit`)}
              className="zyphex-button"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Project
            </Button>
          </div>
        </div>

        {/* Project Timeline Overview */}
        <Card className="zyphex-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 zyphex-heading">
              <Calendar className="h-5 w-5" />
              Project Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm zyphex-subheading">Start Date</p>
                <p className="text-lg font-semibold zyphex-text">
                  {project.startDate ? format(parseISO(project.startDate), 'MMM d, yyyy') : 'Not set'}
                </p>
              </div>
              <div>
                <p className="text-sm zyphex-subheading">End Date</p>
                <p className="text-lg font-semibold zyphex-text">
                  {project.endDate ? format(parseISO(project.endDate), 'MMM d, yyyy') : 'Not set'}
                </p>
              </div>
              <div>
                <p className="text-sm zyphex-subheading">Duration</p>
                <p className="text-lg font-semibold zyphex-text">
                  {project.startDate && project.endDate
                    ? `${differenceInDays(parseISO(project.endDate), parseISO(project.startDate))} days`
                    : 'Not calculated'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gantt Chart */}
        <Card className="zyphex-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 zyphex-heading">
              <BarChart3 className="h-5 w-5" />
              Task Timeline ({project.tasks.length} tasks)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!hasValidDates ? (
              <Alert className="border-yellow-800/50 bg-yellow-900/20">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Project dates or task dates are not properly configured. Please set project start/end dates and task dates to view the Gantt chart.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {/* Timeline Header */}
                {project.startDate && project.endDate && (
                  <div className="relative bg-slate-800/30 p-4 rounded-lg">
                    <div className="grid grid-cols-7 gap-1 text-xs zyphex-subheading text-center">
                      {Array.from({ length: 7 }, (_, i) => {
                        const date = new Date(project.startDate)
                        date.setDate(date.getDate() + (i * Math.floor(differenceInDays(parseISO(project.endDate), parseISO(project.startDate)) / 7)))
                        return (
                          <div key={i}>
                            {format(date, 'MMM d')}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Tasks */}
                <div className="space-y-3">
                  {project.tasks
                    .filter(task => task.startDate && task.dueDate)
                    .map((task) => {
                      const position = calculateTaskPosition(
                        task.startDate,
                        task.dueDate,
                        project.startDate,
                        project.endDate
                      )
                      
                      return (
                        <div key={task.id} className="relative">
                          {/* Task Info */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="font-medium zyphex-text">{task.title}</h4>
                              <p className="text-xs zyphex-subheading">
                                Assigned to: {task.assignee?.name || 'Unassigned'}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 text-xs rounded border ${getPriorityColor(task.priority)}`}>
                                {task.priority}
                              </span>
                              <span className="text-xs zyphex-subheading">
                                {format(parseISO(task.startDate), 'MMM d')} - {format(parseISO(task.dueDate), 'MMM d')}
                              </span>
                            </div>
                          </div>
                          
                          {/* Gantt Bar */}
                          <div className="relative h-8 bg-slate-800/30 rounded">
                            <div
                              className={`absolute h-full rounded ${getStatusColor(task.status)} opacity-80`}
                              style={{
                                left: `${position.left}%`,
                                width: `${position.width}%`,
                              }}
                            >
                              {/* Progress indicator */}
                              {task.progress > 0 && (
                                <div
                                  className="h-full bg-white/30 rounded-l"
                                  style={{ width: `${task.progress}%` }}
                                />
                              )}
                            </div>
                            
                            {/* Task label on bar */}
                            <div
                              className="absolute top-1/2 transform -translate-y-1/2 px-2 text-xs font-medium text-white truncate"
                              style={{
                                left: `${position.left}%`,
                                maxWidth: `${position.width}%`,
                              }}
                            >
                              {task.progress}%
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>

                {project.tasks.filter(task => !task.startDate || !task.dueDate).length > 0 && (
                  <Alert className="border-yellow-800/50 bg-yellow-900/20 mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {project.tasks.filter(task => !task.startDate || !task.dueDate).length} tasks are not shown because they don't have start or due dates set.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Legend */}
        <Card className="zyphex-card">
          <CardHeader>
            <CardTitle className="zyphex-heading">Legend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-500 rounded"></div>
                <span className="text-sm zyphex-subheading">To Do</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="text-sm zyphex-subheading">In Progress</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span className="text-sm zyphex-subheading">Review</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-purple-500 rounded"></div>
                <span className="text-sm zyphex-subheading">Testing</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-sm zyphex-subheading">Done</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-sm zyphex-subheading">Cancelled</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}