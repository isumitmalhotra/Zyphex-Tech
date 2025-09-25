"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, Search, Filter, MoreHorizontal, Calendar, Users, Eye, Edit, Trash2 } from "lucide-react"
import { SubtleBackground } from "@/components/subtle-background"

export default function ProjectsPage() {
  const projects = [
    {
      id: "PRJ-001",
      name: "E-commerce Platform Redesign",
      client: "TechStart Inc.",
      status: "In Progress",
      priority: "High",
      progress: 75,
      budget: "$45,000",
      spent: "$33,750",
      startDate: "Nov 15, 2024",
      dueDate: "Dec 30, 2024",
      team: ["John D.", "Sarah M.", "Mike R."],
      type: "Web Development",
    },
    {
      id: "PRJ-002",
      name: "Mobile App Development",
      client: "RetailMax",
      status: "Review",
      priority: "Medium",
      progress: 90,
      budget: "$32,000",
      spent: "$28,800",
      startDate: "Oct 20, 2024",
      dueDate: "Jan 15, 2025",
      team: ["Alice K.", "Bob L."],
      type: "Mobile Development",
    },
    {
      id: "PRJ-003",
      name: "Cloud Infrastructure Migration",
      client: "DataFlow Solutions",
      status: "Planning",
      priority: "High",
      progress: 25,
      budget: "$78,000",
      spent: "$19,500",
      startDate: "Dec 1, 2024",
      dueDate: "Feb 28, 2025",
      team: ["David W.", "Emma T.", "Frank H.", "Grace P."],
      type: "Cloud Solutions",
    },
    {
      id: "PRJ-004",
      name: "Analytics Dashboard",
      client: "FinanceHub",
      status: "Completed",
      priority: "Low",
      progress: 100,
      budget: "$25,000",
      spent: "$24,200",
      startDate: "Sep 10, 2024",
      dueDate: "Dec 15, 2024",
      team: ["Helen C.", "Ivan S."],
      type: "Data Analytics",
    },
    {
      id: "PRJ-005",
      name: "Security Audit & Implementation",
      client: "SecureBank",
      status: "On Hold",
      priority: "High",
      progress: 40,
      budget: "$55,000",
      spent: "$22,000",
      startDate: "Nov 1, 2024",
      dueDate: "Jan 30, 2025",
      team: ["Jack M.", "Kate N."],
      type: "Security",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "In Progress":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "Review":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "Planning":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30"
      case "On Hold":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      case "Medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "Low":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
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
              <BreadcrumbItem>
                <BreadcrumbPage className="zyphex-heading">Projects</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold zyphex-heading">Project Management</h1>
            <p className="zyphex-subheading">Manage and track all your active projects and their progress.</p>
          </div>
          <Button className="zyphex-button-primary hover-zyphex-lift">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>

        {/* Filters and Search */}
        <Card className="zyphex-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search projects..."
                  className="pl-10 zyphex-glass-effect border-gray-600 focus:border-blue-400"
                />
              </div>
              <Button variant="outline" size="sm" className="zyphex-button-secondary bg-transparent">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Projects Table */}
        <Card className="zyphex-card hover-zyphex-lift">
          <CardHeader>
            <CardTitle className="zyphex-heading">All Projects</CardTitle>
            <CardDescription className="zyphex-subheading">
              A comprehensive view of all projects and their current status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="zyphex-heading">Project</TableHead>
                  <TableHead className="zyphex-heading">Client</TableHead>
                  <TableHead className="zyphex-heading">Status</TableHead>
                  <TableHead className="zyphex-heading">Priority</TableHead>
                  <TableHead className="zyphex-heading">Progress</TableHead>
                  <TableHead className="zyphex-heading">Budget</TableHead>
                  <TableHead className="zyphex-heading">Due Date</TableHead>
                  <TableHead className="zyphex-heading">Team</TableHead>
                  <TableHead className="zyphex-heading">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id} className="border-gray-700 hover:bg-gray-800/50">
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium zyphex-heading">{project.name}</div>
                        <div className="text-xs zyphex-subheading">
                          {project.id} • {project.type}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="zyphex-subheading">{project.client}</TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(project.status)} border`}>{project.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getPriorityColor(project.priority)} border`}>{project.priority}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full zyphex-gradient-primary transition-all duration-300"
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-xs zyphex-subheading">{project.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm zyphex-heading">{project.budget}</div>
                        <div className="text-xs zyphex-subheading">Spent: {project.spent}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1 text-sm zyphex-subheading">
                        <Calendar className="h-3 w-3" />
                        <span>{project.dueDate}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3 zyphex-accent-text" />
                        <span className="text-xs zyphex-subheading">{project.team.length} members</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 hover-zyphex-glow">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="zyphex-glass-effect border-gray-800/50">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem className="hover-zyphex-glow">
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="hover-zyphex-glow">
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Project
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="hover-zyphex-glow text-red-400">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Project
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
