"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import {
  Users,
  Calendar,
  Clock,
  BarChart3,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  FileText,
  MessageSquare,
} from "lucide-react"

// Mock data for projects
const projects = [
  {
    id: "1",
    name: "E-commerce Platform Redesign",
    description: "Complete overhaul of the existing e-commerce platform with modern UI/UX",
    status: "IN_PROGRESS",
    client: "Acme Corporation",
    startDate: "2025-09-01",
    endDate: "2025-12-15",
    progress: 45,
    totalTasks: 24,
    completedTasks: 11,
    myTasks: 6,
    myCompletedTasks: 3,
    totalHours: 160,
    myHours: 35.5,
    team: ["Alice Johnson", "Bob Smith", "Carol Davis"],
    priority: "HIGH"
  },
  {
    id: "2",
    name: "Mobile App Development",
    description: "React Native mobile application for iOS and Android",
    status: "IN_PROGRESS",
    client: "TechCorp Solutions",
    startDate: "2025-08-15",
    endDate: "2025-11-30",
    progress: 72,
    totalTasks: 18,
    completedTasks: 13,
    myTasks: 4,
    myCompletedTasks: 3,
    totalHours: 120,
    myHours: 28.0,
    team: ["Alice Johnson", "Lisa Brown"],
    priority: "MEDIUM"
  },
  {
    id: "3",
    name: "Data Analytics Dashboard",
    description: "Business intelligence dashboard with real-time analytics",
    status: "REVIEW",
    client: "StartupXYZ",
    startDate: "2025-07-01",
    endDate: "2025-10-31",
    progress: 88,
    totalTasks: 12,
    completedTasks: 11,
    myTasks: 2,
    myCompletedTasks: 2,
    totalHours: 80,
    myHours: 16.5,
    team: ["Alice Johnson", "Tom Wilson"],
    priority: "LOW"
  }
]

const statusColors = {
  PLANNING: "bg-gray-500",
  IN_PROGRESS: "bg-blue-500",
  REVIEW: "bg-yellow-500",
  COMPLETED: "bg-green-500",
  ON_HOLD: "bg-orange-500",
  CANCELLED: "bg-red-500",
}

const priorityColors = {
  LOW: "text-green-600 bg-green-100",
  MEDIUM: "text-yellow-600 bg-yellow-100",
  HIGH: "text-red-600 bg-red-100",
  URGENT: "text-red-800 bg-red-200",
}

export default function ProjectsPage() {
  const totalMyTasks = projects.reduce((sum, project) => sum + project.myTasks, 0)
  const totalMyCompleted = projects.reduce((sum, project) => sum + project.myCompletedTasks, 0)
  const totalMyHours = projects.reduce((sum, project) => sum + project.myHours, 0)

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">My Projects</h1>
          <p className="text-muted-foreground">
            Projects you&apos;re currently working on
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gray-900/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-blue-400" />
              <div>
                <div className="text-2xl font-bold text-white">{projects.length}</div>
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
                <div className="text-2xl font-bold text-white">{totalMyCompleted}/{totalMyTasks}</div>
                <p className="text-xs text-muted-foreground">My Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-purple-400" />
              <div>
                <div className="text-2xl font-bold text-white">{totalMyHours}h</div>
                <p className="text-xs text-muted-foreground">Hours Logged</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              <div>
                <div className="text-2xl font-bold text-white">
                  {Math.round((totalMyCompleted / totalMyTasks) * 100)}%
                </div>
                <p className="text-xs text-muted-foreground">Completion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects Grid */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1">
        {projects.map((project) => (
          <Card key={project.id} className="bg-gray-900/50 border-gray-700">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-xl text-white">{project.name}</CardTitle>
                    <Badge 
                      variant="secondary"
                      className={`${statusColors[project.status as keyof typeof statusColors]} text-white`}
                    >
                      {project.status.replace('_', ' ')}
                    </Badge>
                    <Badge 
                      variant="outline"
                      className={priorityColors[project.priority as keyof typeof priorityColors]}
                    >
                      {project.priority}
                    </Badge>
                  </div>
                  <CardDescription className="text-base">
                    {project.description}
                  </CardDescription>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Client: <span className="text-blue-400">{project.client}</span></span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Overall Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Overall Progress</span>
                    <span className="text-white font-medium">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>

                {/* Project Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Total Tasks</div>
                    <div className="text-lg font-semibold text-white">
                      {project.completedTasks}/{project.totalTasks}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">My Tasks</div>
                    <div className="text-lg font-semibold text-blue-400">
                      {project.myCompletedTasks}/{project.myTasks}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">My Hours</div>
                    <div className="text-lg font-semibold text-purple-400">
                      {project.myHours}h
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Team Size</div>
                    <div className="text-lg font-semibold text-green-400">
                      {project.team.length}
                    </div>
                  </div>
                </div>

                {/* Team Members */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    Team Members
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {project.team.map((member, index) => (
                      <Badge key={index} variant="secondary" className="bg-gray-800 text-gray-300">
                        {member}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="default" className="bg-blue-600 hover:bg-blue-700">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    View Tasks
                  </Button>
                  <Button size="sm" variant="outline" className="border-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                    Log Time
                  </Button>
                  <Button size="sm" variant="outline" className="border-gray-600">
                    <FileText className="h-4 w-4 mr-2" />
                    Documents
                  </Button>
                  <Button size="sm" variant="outline" className="border-gray-600">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Discuss
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}