"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { ArrowLeft, Calendar, Users, DollarSign, Clock, AlertCircle } from "lucide-react"
import { SubtleBackground } from "@/components/subtle-background"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

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
}

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProject()
  }, [params.id])

  const fetchProject = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/admin/projects/${params.id}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch project')
      }
      
      const data = await response.json()
      setProject(data.project)
    } catch (error) {
      console.error('Error fetching project:', error)
      setError('Failed to load project details')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-500'
      case 'in_progress': return 'bg-blue-500'
      case 'review': return 'bg-yellow-500'
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <SubtleBackground />
        <div className="relative z-10">
          <header className="flex h-16 shrink-0 items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-24" />
            </div>
          </header>
          <div className="p-6 space-y-6">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-10 w-10" />
              <Skeleton className="h-8 w-64" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <SubtleBackground />
        <div className="relative z-10">
          <header className="flex h-16 shrink-0 items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink 
                    onClick={() => router.push("/admin")}
                    className="cursor-pointer hover:text-blue-400"
                  >
                    Admin
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink 
                    onClick={() => router.push("/admin/projects")}
                    className="cursor-pointer hover:text-blue-400"
                  >
                    Projects
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbPage>Error</BreadcrumbPage>
              </BreadcrumbList>
            </Breadcrumb>
          </header>
          <div className="p-6">
            <Alert className="border-red-800/50 bg-red-900/20">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error || "Project not found"}
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <SubtleBackground />
      <div className="relative z-10">
        <header className="flex h-16 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink 
                  onClick={() => router.push("/admin")}
                  className="cursor-pointer hover:text-blue-400"
                >
                  Admin
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink 
                  onClick={() => router.push("/admin/projects")}
                  className="cursor-pointer hover:text-blue-400"
                >
                  Projects
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbPage>{project.name}</BreadcrumbPage>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/admin/projects")}
                className="hover-zyphex-glow"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Projects
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => router.push(`/admin/projects/${project.id}/edit`)}
                className="hover-zyphex-glow"
              >
                Edit Project
              </Button>
            </div>
          </div>

          {/* Project Header */}
          <Card className="zyphex-glass-effect border-gray-800/50">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl zyphex-text">{project.name}</CardTitle>
                  <CardDescription className="mt-2 zyphex-subheading">
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

          {/* Project Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="zyphex-glass-effect border-gray-800/50">
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

            <Card className="zyphex-glass-effect border-gray-800/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium zyphex-subheading">Timeline</CardTitle>
                <Calendar className="h-4 w-4 zyphex-accent-text" />
              </CardHeader>
              <CardContent>
                <div className="text-sm zyphex-text">
                  {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'No start date'}
                </div>
                <p className="text-xs zyphex-subheading">
                  to {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'No end date'}
                </p>
              </CardContent>
            </Card>

            <Card className="zyphex-glass-effect border-gray-800/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium zyphex-subheading">Team</CardTitle>
                <Users className="h-4 w-4 zyphex-accent-text" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold zyphex-text">{project.users.length}</div>
                <p className="text-xs zyphex-subheading">team members</p>
              </CardContent>
            </Card>

            <Card className="zyphex-glass-effect border-gray-800/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium zyphex-subheading">Progress</CardTitle>
                <Clock className="h-4 w-4 zyphex-accent-text" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold zyphex-text">
                  {project.completionRate || 0}%
                </div>
                <p className="text-xs zyphex-subheading">complete</p>
              </CardContent>
            </Card>
          </div>

          {/* Additional Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="zyphex-glass-effect border-gray-800/50">
              <CardHeader>
                <CardTitle className="zyphex-text">Client Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <span className="text-sm zyphex-subheading">Name:</span>
                  <p className="zyphex-text">{project.client.name}</p>
                </div>
                <div>
                  <span className="text-sm zyphex-subheading">Email:</span>
                  <p className="zyphex-text">{project.client.email}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="zyphex-glass-effect border-gray-800/50">
              <CardHeader>
                <CardTitle className="zyphex-text">Project Manager</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <span className="text-sm zyphex-subheading">Name:</span>
                  <p className="zyphex-text">{project.manager?.name || 'Not assigned'}</p>
                </div>
                {project.manager && (
                  <div>
                    <span className="text-sm zyphex-subheading">Email:</span>
                    <p className="zyphex-text">{project.manager.email}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}