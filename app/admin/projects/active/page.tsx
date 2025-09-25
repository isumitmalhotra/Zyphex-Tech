"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CalendarDays, Clock, Users, DollarSign, Plus, Filter } from "lucide-react"
import { SubtleBackground } from "@/components/subtle-background"

export default function ActiveProjectsPage() {
  const activeProjects = [
    {
      id: 1,
      name: "E-Commerce Platform Redesign",
      client: "TechCorp Solutions",
      status: "In Progress",
      progress: 75,
      dueDate: "2024-02-15",
      budget: 45000,
      spent: 33750,
      team: [
        { name: "Alice Johnson", role: "Project Manager", avatar: "/placeholder-user.jpg" },
        { name: "Bob Smith", role: "Lead Developer", avatar: "/placeholder-user.jpg" },
        { name: "Carol Davis", role: "UI/UX Designer", avatar: "/placeholder-user.jpg" },
      ],
      priority: "High",
      category: "Web Development",
    },
    {
      id: 2,
      name: "Mobile App Development",
      client: "StartupXYZ",
      status: "In Progress",
      progress: 45,
      dueDate: "2024-03-01",
      budget: 35000,
      spent: 15750,
      team: [
        { name: "David Wilson", role: "Mobile Developer", avatar: "/placeholder-user.jpg" },
        { name: "Eva Brown", role: "QA Tester", avatar: "/placeholder-user.jpg" },
      ],
      priority: "Medium",
      category: "Mobile Development",
    },
    {
      id: 3,
      name: "Brand Identity Design",
      client: "FashionForward",
      status: "Review",
      progress: 90,
      dueDate: "2024-01-30",
      budget: 15000,
      spent: 13500,
      team: [
        { name: "Frank Miller", role: "Creative Director", avatar: "/placeholder-user.jpg" },
        { name: "Grace Lee", role: "Graphic Designer", avatar: "/placeholder-user.jpg" },
      ],
      priority: "High",
      category: "Design",
    },
    {
      id: 4,
      name: "API Integration Service",
      client: "DataFlow Inc",
      status: "In Progress",
      progress: 60,
      dueDate: "2024-02-28",
      budget: 28000,
      spent: 16800,
      team: [
        { name: "Henry Taylor", role: "Backend Developer", avatar: "/placeholder-user.jpg" },
        { name: "Ivy Chen", role: "DevOps Engineer", avatar: "/placeholder-user.jpg" },
      ],
      priority: "Medium",
      category: "Backend Development",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Progress":
        return "text-blue-600 border-blue-600"
      case "Review":
        return "text-yellow-600 border-yellow-600"
      case "Completed":
        return "text-green-600 border-green-600"
      default:
        return "text-gray-600 border-gray-600"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "text-red-600 bg-red-100"
      case "Medium":
        return "text-yellow-600 bg-yellow-100"
      case "Low":
        return "text-green-600 bg-green-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
      <SubtleBackground />

      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 relative z-10">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1 zyphex-button-secondary hover-zyphex-glow" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/admin" className="zyphex-subheading hover:text-white">
                  Admin
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/admin/projects" className="zyphex-subheading hover:text-white">
                  Projects
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage className="zyphex-heading">Active</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold zyphex-heading">Active Projects</h1>
              <p className="text-lg zyphex-subheading">Monitor and manage your ongoing projects</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" className="zyphex-button-secondary hover-zyphex-glow">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
              <Button className="zyphex-button-primary hover-zyphex-lift">
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </div>
          </div>
        </div>

        {/* Project Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Total Active</CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">4</div>
              <p className="text-xs zyphex-subheading">projects in progress</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Avg. Progress</CardTitle>
              <Clock className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">68%</div>
              <p className="text-xs zyphex-subheading">across all projects</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Total Budget</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">$123,000</div>
              <p className="text-xs zyphex-subheading">allocated budget</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">On Time</CardTitle>
              <CalendarDays className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">75%</div>
              <p className="text-xs zyphex-subheading">projects on schedule</p>
            </CardContent>
          </Card>
        </div>

        {/* Active Projects List */}
        <div className="space-y-6">
          {activeProjects.map((project) => (
            <Card key={project.id} className="zyphex-card hover-zyphex-lift">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="zyphex-heading">{project.name}</CardTitle>
                    <CardDescription className="zyphex-subheading">{project.client}</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className={getStatusColor(project.status)}>
                      {project.status}
                    </Badge>
                    <Badge variant="secondary" className={getPriorityColor(project.priority)}>
                      {project.priority}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Progress */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium zyphex-subheading">Progress</span>
                      <span className="text-sm zyphex-subheading">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                  </div>

                  {/* Project Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <CalendarDays className="h-4 w-4 text-blue-400" />
                      <div>
                        <p className="text-sm font-medium zyphex-heading">Due Date</p>
                        <p className="text-xs zyphex-subheading">{project.dueDate}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-blue-400" />
                      <div>
                        <p className="text-sm font-medium zyphex-heading">Budget</p>
                        <p className="text-xs zyphex-subheading">${project.spent.toLocaleString()} / ${project.budget.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-blue-400" />
                      <div>
                        <p className="text-sm font-medium zyphex-heading">Team</p>
                        <p className="text-xs zyphex-subheading">{project.team.length} members</p>
                      </div>
                    </div>
                  </div>

                  {/* Team Members */}
                  <div>
                    <p className="text-sm font-medium zyphex-heading mb-2">Team Members</p>
                    <div className="flex items-center space-x-2">
                      {project.team.slice(0, 3).map((member, index) => (
                        <Avatar key={index} className="h-8 w-8">
                          <AvatarImage src={member.avatar} alt={member.name} />
                          <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                      ))}
                      {project.team.length > 3 && (
                        <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-medium">
                          +{project.team.length - 3}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Category */}
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-blue-600 border-blue-600">
                      {project.category}
                    </Badge>
                    <Button variant="outline" size="sm" className="zyphex-button-secondary hover-zyphex-glow">
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
