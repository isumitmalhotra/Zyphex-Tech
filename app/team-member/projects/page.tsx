"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import {
  Users,
  Calendar,
  BarChart3,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  FileText,
  Loader2,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface Project {
  id: string
  name: string
  description: string | null
  status: string
  startDate: Date | null
  endDate: Date | null
  progress: number
  client: {
    id: string
    name: string
  } | null
  manager: {
    id: string
    name: string
  } | null
  myTasksCount: number
  myCompletedTasksCount: number
  totalTasksCount: number
  totalCompletedTasksCount: number
  totalDocumentsCount: number
  teamMembersCount: number
}

interface ProjectStats {
  total: number
  active: number
  planning: number
  onHold: number
  completed: number
  myTasks: number
}

const statusColors = {
  PLANNING: "bg-gray-500",
  IN_PROGRESS: "bg-blue-500",
  REVIEW: "bg-yellow-500",
  COMPLETED: "bg-green-500",
  ON_HOLD: "bg-orange-500",
  CANCELLED: "bg-red-500",
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [stats, setStats] = useState<ProjectStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const fetchProjects = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/team-member/projects')
      
      if (!response.ok) {
        throw new Error('Failed to fetch projects')
      }

      const data = await response.json()
      setProjects(data.projects || [])
      setStats(data.stats || null)
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive"
      })
      setProjects([])
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString()
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500 mb-4" />
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">My Projects</h1>
          <p className="text-muted-foreground">
            Projects you are currently working on
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gray-900/50 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-blue-400" />
                <div>
                  <div className="text-2xl font-bold text-white">{stats.active}</div>
                  <p className="text-xs text-muted-foreground">Active Projects</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <div>
                  <div className="text-2xl font-bold text-white">{stats.myTasks}</div>
                  <p className="text-xs text-muted-foreground">My Tasks</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-purple-400" />
                <div>
                  <div className="text-2xl font-bold text-white">{stats.completed}</div>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
                <div>
                  <div className="text-2xl font-bold text-white">{stats.total}</div>
                  <p className="text-xs text-muted-foreground">Total Projects</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Projects Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.length === 0 ? (
          <Card className="bg-gray-900/50 border-gray-700 col-span-full">
            <CardContent className="p-8">
              <div className="text-center text-muted-foreground">
                No projects assigned
              </div>
            </CardContent>
          </Card>
        ) : (
          projects.map((project) => (
            <Card key={project.id} className="bg-gray-900/50 border-gray-700 hover:border-gray-600 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-white text-lg">{project.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {project.client?.name || 'No Client'}
                    </CardDescription>
                  </div>
                  <Badge 
                    variant="secondary"
                    className={`${statusColors[project.status as keyof typeof statusColors]} text-white ml-2`}
                  >
                    {project.status.replace('_', ' ')}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {project.description || 'No description available'}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium text-white">{Math.round(project.progress)}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>

                {/* My Tasks */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">My Tasks</span>
                  </div>
                  <span className="font-medium text-white">
                    {project.myCompletedTasksCount}/{project.myTasksCount}
                  </span>
                </div>

                {/* Total Tasks */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Total Tasks</span>
                  </div>
                  <span className="font-medium text-white">
                    {project.totalCompletedTasksCount}/{project.totalTasksCount}
                  </span>
                </div>

                {/* Team Size */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Team Size</span>
                  </div>
                  <span className="font-medium text-white">{project.teamMembersCount}</span>
                </div>

                {/* Timeline */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Timeline</span>
                  </div>
                  <span className="font-medium text-white text-xs">
                    {formatDate(project.startDate)} - {formatDate(project.endDate)}
                  </span>
                </div>

                {/* Documents */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Documents</span>
                  </div>
                  <span className="font-medium text-white">{project.totalDocumentsCount}</span>
                </div>

                {/* Manager */}
                {project.manager && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Project Manager</span>
                    <span className="font-medium text-white">{project.manager.name}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    asChild
                  >
                    <Link href={`/team-member/projects/${project.id}`}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Details
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
