"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  DollarSign,
  User,
  MessageSquare,
  FileText,
  Clock,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"

interface Project {
  id: string
  name: string
  description?: string | null
  status: string
  budget?: number | null
  createdAt: string
  updatedAt: string
  client?: {
    name: string
    email: string
  }
}

export default function ProjectDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchProject()
    }
  }, [params.id])

  const fetchProject = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/user/projects/${params.id}`)
      
      if (response.ok) {
        const data = await response.json()
        setProject(data.project)
      } else {
        toast.error("Failed to load project")
        router.push("/user/projects")
      }
    } catch (error) {
      toast.error("Failed to load project")
      router.push("/user/projects")
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

  if (!project) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold zyphex-heading mb-2">{project.name}</h1>
            <p className="text-muted-foreground">
              Created on {new Date(project.createdAt).toLocaleDateString()}
            </p>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {project.status}
          </Badge>
        </div>
      </div>

      {/* Project Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="zyphex-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Budget
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {project.budget ? `$${project.budget.toLocaleString()}` : "Not set"}
            </p>
          </CardContent>
        </Card>

        <Card className="zyphex-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <User className="h-4 w-4 mr-2" />
              Client
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{project.client?.name || "Unknown"}</p>
            <p className="text-sm text-muted-foreground">{project.client?.email}</p>
          </CardContent>
        </Card>

        <Card className="zyphex-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Last Updated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold">
              {new Date(project.updatedAt).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card className="zyphex-card">
            <CardHeader>
              <CardTitle>Project Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {project.description || "No description provided"}
              </p>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button 
              onClick={() => router.push(`/user/messages?projectId=${project.id}`)}
              className="zyphex-button"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="messages">
          <Card className="zyphex-card">
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground mb-4">
                No messages yet for this project
              </p>
              <div className="flex justify-center">
                <Button 
                  onClick={() => router.push(`/user/messages?projectId=${project.id}`)}
                  className="zyphex-button"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Start Conversation
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card className="zyphex-card">
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                No documents uploaded yet
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
