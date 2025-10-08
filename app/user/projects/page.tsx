"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Briefcase,
  Calendar,
  Eye,
  MessageSquare,
  DollarSign,
  Loader2,
  User,
} from "lucide-react"
import { ProjectRequestForm } from "@/components/user/project-request-form"
import { toast } from "sonner"

interface Project {
  id: string
  name: string
  description?: string | null
  status: string
  budget?: number | null
  createdAt: string
  client?: {
    name: string
  }
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/user/projects")
      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects || [])
      } else {
        toast.error("Failed to load projects")  
      }
    } catch (error) {
      toast.error("Failed to load projects")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold zyphex-heading">My Projects</h1>
          <p className="text-muted-foreground mt-2">
            Manage and track your project requests and ongoing work
          </p>
        </div>
        <ProjectRequestForm onSuccess={fetchProjects} />
      </div>

      {projects.length === 0 ? (
        <Card className="zyphex-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No projects yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Get started by creating your first project request.
            </p>
            <ProjectRequestForm onSuccess={fetchProjects} />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="zyphex-card hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-xl zyphex-heading">
                    {project.name}
                  </CardTitle>
                  <Badge variant="secondary">
                    {project.status}
                  </Badge>
                </div>
                {project.description && (
                  <CardDescription>
                    {project.description}
                  </CardDescription>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  {project.budget && (
                    <div className="flex items-center text-muted-foreground">
                      <DollarSign className="h-4 w-4 mr-2" />
                      <span>Budget: ${project.budget.toLocaleString()}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center text-muted-foreground">
                    <User className="h-4 w-4 mr-2" />
                    <span>Client: {project.client?.name || "Unknown"}</span>
                  </div>
                  
                  <div className="flex items-center text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Created: {new Date(project.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => window.location.href = `/user/projects/${project.id}`}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.location.href = `/user/messages?projectId=${project.id}`}
                    title="Send message about this project"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
