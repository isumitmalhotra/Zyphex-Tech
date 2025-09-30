"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Search, Filter, MoreHorizontal, Calendar, Users, Eye, Edit, Trash2, RefreshCw, AlertCircle } from "lucide-react"
import { SubtleBackground } from "@/components/subtle-background"
import { useAdminProjects } from "@/hooks/use-admin-data"
import { CreateProjectDialog } from "@/components/admin/create-project-dialog"
import { AdminTableContainer } from "@/components/admin/admin-table-container"
import { useState } from "react"

export default function ProjectsPage() {
  const { projects, isLoading, error, mutate } = useAdminProjects()
  const [searchTerm, setSearchTerm] = useState("")
  const [_statusFilter, _setStatusFilter] = useState("all")

  // Filter projects based on search and status
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.client.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = _statusFilter === "all" || project.status === _statusFilter
    return matchesSearch && matchesStatus
  })

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
      case 'urgent': return 'destructive'
      case 'high': return 'destructive'
      case 'medium': return 'default'
      case 'low': return 'secondary'
      default: return 'secondary'
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
        <SubtleBackground />
        <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Card className="zyphex-card">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
        <SubtleBackground />
        <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
          <Alert className="border-red-500">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load projects. Please try again.
              <Button onClick={() => mutate()} variant="outline" size="sm" className="ml-2">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen overflow-hidden">
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

      <div className="flex flex-1 flex-col gap-4 p-4 relative z-10 admin-content-container">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold zyphex-heading">Project Management</h1>
            <p className="zyphex-subheading">Manage and track all your active projects and their progress.</p>
          </div>
          <CreateProjectDialog onProjectCreated={() => mutate()} />
        </div>

        {/* Filters and Search */}
        <Card className="zyphex-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
        <Card className="zyphex-card hover-zyphex-lift relative z-0 overflow-hidden">
          <CardHeader>
            <CardTitle className="zyphex-heading">All Projects</CardTitle>
            <CardDescription className="zyphex-subheading">
              A comprehensive view of all projects and their current status
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <AdminTableContainer>
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
                {filteredProjects.map((project) => (
                  <TableRow key={project.id} className="border-gray-700 hover:bg-gray-800/50">
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium zyphex-heading">{project.name}</div>
                        <div className="text-xs zyphex-subheading">
                          {project.id} • {project.description || 'No description'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="zyphex-subheading">{project.client.name}</TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(project.status)} border`}>{project.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPriorityColor(project.priority)}>{project.priority}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full zyphex-gradient-primary transition-all duration-300"
                            style={{ width: `${project.completionRate}%` }}
                          ></div>
                        </div>
                        <span className="text-xs zyphex-subheading">{project.completionRate}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm zyphex-heading">
                          {project.budget ? `$${project.budget.toLocaleString()}` : 'No budget'}
                        </div>
                        <div className="text-xs zyphex-subheading">
                          Spent: {project.budgetUsed ? `$${project.budgetUsed.toLocaleString()}` : '$0'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1 text-sm zyphex-subheading">
                        <Calendar className="h-3 w-3" />
                        <span>{project.endDate ? new Date(project.endDate).toLocaleDateString() : 'No due date'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3 zyphex-accent-text" />
                        <span className="text-xs zyphex-subheading">{project.users.length} members</span>
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
            </AdminTableContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
