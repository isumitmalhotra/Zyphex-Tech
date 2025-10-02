"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { Permission } from "@/lib/auth/permissions"
import {
  BarChart3,
  Briefcase,
  Clock,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Target,
  Users,
  DollarSign,
  RefreshCw,
  Loader2,
} from "lucide-react"
import { SubtleBackground } from "@/components/subtle-background"
import { useProjectManagerDashboard } from "@/hooks/use-project-manager-dashboard"
import Link from "next/link"

function ProjectOverviewContent() {
  const { dashboardData, loading, error, refresh } = useProjectManagerDashboard()

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
        <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
              <span className="zyphex-subheading">Loading project overview...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
        <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
          <Alert className="border-red-500/30">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
        <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
          <div className="text-white">No project data available</div>
        </div>
      </div>
    )
  }

  const { overview, recentProjects } = dashboardData

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
      <SubtleBackground />
      <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold zyphex-heading">Project Overview</h1>
            <p className="zyphex-subheading">Comprehensive view of all projects and their status</p>
          </div>
          <Button 
            onClick={() => refresh()} 
            variant="outline" 
            size="sm"
            className="zyphex-button"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Project Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Total Projects</CardTitle>
              <Briefcase className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">{overview.totalProjects}</div>
              <p className="text-xs zyphex-subheading">All active projects</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">{overview.activeProjects}</div>
              <p className="text-xs zyphex-subheading">Currently active</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Completed</CardTitle>
              <Target className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">{overview.completedProjects}</div>
              <p className="text-xs zyphex-subheading">Successfully finished</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Team Members</CardTitle>
              <Users className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">{overview.totalTeamMembers}</div>
              <p className="text-xs zyphex-subheading">Active team size</p>
            </CardContent>
          </Card>
        </div>

        {/* Project Status Chart & Recent Projects */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Project Status Distribution */}
          <Card className="zyphex-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 zyphex-heading">
                <BarChart3 className="h-5 w-5" />
                Project Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm zyphex-subheading">In Progress</span>
                  <span className="text-sm font-medium zyphex-heading">{overview.activeProjects}</span>
                </div>
                <Progress 
                  value={(overview.activeProjects / overview.totalProjects) * 100} 
                  className="h-2"
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm zyphex-subheading">Completed</span>
                  <span className="text-sm font-medium zyphex-heading">{overview.completedProjects}</span>
                </div>
                <Progress 
                  value={(overview.completedProjects / overview.totalProjects) * 100} 
                  className="h-2"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm zyphex-subheading">Planning</span>
                  <span className="text-sm font-medium zyphex-heading">
                    {overview.totalProjects - overview.activeProjects - overview.completedProjects}
                  </span>
                </div>
                <Progress 
                  value={((overview.totalProjects - overview.activeProjects - overview.completedProjects) / overview.totalProjects) * 100} 
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>

          {/* Recent Projects */}
          <Card className="zyphex-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 zyphex-heading">
                <Briefcase className="h-5 w-5" />
                Recent Projects
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentProjects.slice(0, 5).map((project) => (
                <div key={project.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="flex-1">
                    <h4 className="font-medium zyphex-heading">{project.name}</h4>
                    <p className="text-sm zyphex-subheading">{project.client?.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      project.status === 'COMPLETED' ? 'default' :
                      project.status === 'IN_PROGRESS' ? 'secondary' :
                      'outline'
                    }>
                      {project.status}
                    </Badge>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full zyphex-button" asChild>
                <Link href="/project-manager/projects">View All Projects</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="zyphex-card">
          <CardHeader>
            <CardTitle className="zyphex-heading">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button className="zyphex-button h-auto p-4 flex-col gap-2" asChild>
                <Link href="/project-manager/projects">
                  <Briefcase className="h-6 w-6" />
                  <span>Manage Projects</span>
                </Link>
              </Button>
              <Button className="zyphex-button h-auto p-4 flex-col gap-2" asChild>
                <Link href="/project-manager/team">
                  <Users className="h-6 w-6" />
                  <span>View Team</span>
                </Link>
              </Button>
              <Button className="zyphex-button h-auto p-4 flex-col gap-2" asChild>
                <Link href="/project-manager/reports">
                  <BarChart3 className="h-6 w-6" />
                  <span>Generate Reports</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function ProjectOverview() {
  return (
    <PermissionGuard 
      permission={Permission.VIEW_PROJECTS}
      fallback={
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
          <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You don&apos;t have permission to view project overview.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      }
    >
      <ProjectOverviewContent />
    </PermissionGuard>
  )
}