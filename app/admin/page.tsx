"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { Permission } from "@/lib/auth/permissions"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  BarChart3,
  Users,
  Briefcase,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  CheckCircle,
  ArrowRight,
  RefreshCw,
  AlertCircle,
} from "lucide-react"
import { SubtleBackground } from "@/components/subtle-background"
import { Icon3D } from "@/components/3d-icons"
import { useAdminDashboard } from "@/hooks/use-admin-dashboard"
import { useSession } from "next-auth/react"
import { DashboardSkeleton } from "@/components/ui/loading-skeletons"

export default function AdminDashboard() {
  return (
    <PermissionGuard 
      permission={Permission.VIEW_DASHBOARD}
      fallback={
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
          <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You don&apos;t have permission to view the admin dashboard.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      }
    >
      <AdminDashboardContent />
    </PermissionGuard>
  )
}

function AdminDashboardContent() {
  const { data, error, isLoading, mutate } = useAdminDashboard()
  const { data: _session } = useSession()

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
        <SubtleBackground />
        <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
          <DashboardSkeleton />
        </div>
      </div>
    )
  }

  // Handle error state
  if (error) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
        <SubtleBackground />
        <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
          <Alert className="border-red-500">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load dashboard data. Please try again.
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

  if (!data) {
    return null
  }

  const { overview, recentProjects, recentActivities } = data

  const stats = [
    {
      title: "Total Revenue",
      value: overview.totalRevenue ? `$${overview.totalRevenue.toLocaleString()}` : "$0",
      change: overview.revenueChange ? `${overview.revenueChange > 0 ? '+' : ''}${overview.revenueChange.toFixed(1)}%` : "0%",
      trend: overview.revenueChange >= 0 ? "up" : "down",
      icon: "DollarSign",
      description: "From last month",
    },
    {
      title: "Active Projects",
      value: overview.activeProjects.toString(),
      change: `+${overview.activeProjects}`,
      trend: "up",
      icon: "Briefcase",
      description: "Currently in progress",
    },
    {
      title: "Total Clients",
      value: overview.totalClients.toString(),
      change: `${overview.totalClients} total`,
      trend: "up",
      icon: "Users",
      description: "Active client base",
    },
    {
      title: "Completion Rate",
      value: `${overview.projectCompletionRate.toFixed(1)}%`,
      change: `${overview.completedProjects}/${overview.totalProjects}`,
      trend: overview.projectCompletionRate >= 80 ? "up" : "down",
      icon: "BarChart3",
      description: "Project success rate",
    },
  ]

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
                <BreadcrumbPage className="zyphex-heading">Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold zyphex-heading">Admin Dashboard</h1>
          <p className="zyphex-subheading">Welcome back! Here&apos;s an overview of your business performance.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={index} className="zyphex-card hover-zyphex-lift">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium zyphex-heading">{stat.title}</CardTitle>
                <Icon3D icon={stat.icon} size={16} color="var(--zyphex-accent)" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold zyphex-heading">{stat.value}</div>
                <div className="flex items-center space-x-2 text-xs">
                  {stat.trend === "up" ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className={`font-medium ${stat.trend === "up" ? "text-green-500" : "text-red-500"}`}>
                    {stat.change}
                  </span>
                  <span className="zyphex-subheading">{stat.description}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          {/* Recent Projects */}
          <Card className="col-span-4 zyphex-card hover-zyphex-lift">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="zyphex-heading">Recent Projects</CardTitle>
                  <CardDescription className="zyphex-subheading">Latest project updates and status</CardDescription>
                </div>
                <Button variant="outline" size="sm" className="zyphex-button-secondary bg-transparent">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentProjects.map((project, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg zyphex-glass-effect hover-zyphex-glow transition-all duration-300"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium zyphex-heading">{project.name}</h4>
                      </div>
                      <p className="text-sm zyphex-subheading">{project.client?.name || 'No client'}</p>
                      <div className="flex items-center space-x-4 text-xs zyphex-subheading">
                        <span className="flex items-center">
                          <Calendar className="mr-1 h-3 w-3" />
                          {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'No due date'}
                        </span>
                        <span className="flex items-center">
                          <DollarSign className="mr-1 h-3 w-3" />
                          {project.budget ? `$${project.budget.toLocaleString()}` : 'No budget'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={
                          project.status === "Completed"
                            ? "default"
                            : project.status === "In Progress"
                              ? "secondary"
                              : "outline"
                        }
                        className="zyphex-blue-glow"
                      >
                        {project.status}
                      </Badge>
                      {project.status === "Completed" ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Clock className="h-4 w-4 zyphex-accent-text" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="col-span-3 zyphex-card hover-zyphex-lift">
            <CardHeader>
              <CardTitle className="zyphex-heading">Recent Activity</CardTitle>
              <CardDescription className="zyphex-subheading">Latest business activities and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 rounded-full zyphex-gradient-primary mt-2 animate-zyphex-glow"></div>
                    <div className="space-y-1 flex-1">
                      <p className="text-sm font-medium zyphex-heading">{activity.action}</p>
                      <p className="text-xs zyphex-subheading">{activity.user?.name || activity.user?.email || 'Unknown user'}</p>
                      <p className="text-xs zyphex-subheading flex items-center">
                        <Clock className="mr-1 h-3 w-3" />
                        {new Date(activity.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="zyphex-card hover-zyphex-lift">
          <CardHeader>
            <CardTitle className="zyphex-heading">Quick Actions</CardTitle>
            <CardDescription className="zyphex-subheading">Frequently used administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Button className="h-20 flex-col space-y-2 zyphex-button-primary hover-zyphex-lift">
                <Users className="h-6 w-6" />
                <span>Add Client</span>
              </Button>
              <Button className="h-20 flex-col space-y-2 zyphex-button-secondary bg-transparent hover-zyphex-lift">
                <Briefcase className="h-6 w-6" />
                <span>New Project</span>
              </Button>
              <Button className="h-20 flex-col space-y-2 zyphex-button-secondary bg-transparent hover-zyphex-lift">
                <DollarSign className="h-6 w-6" />
                <span>Create Invoice</span>
              </Button>
              <Button className="h-20 flex-col space-y-2 zyphex-button-secondary bg-transparent hover-zyphex-lift">
                <BarChart3 className="h-6 w-6" />
                <span>View Reports</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Real-time Messaging - Temporarily disabled */}
        {/* {session?.user && (
          <DashboardMessaging 
            userRole="ADMIN"
            userId={session.user.id}
            compact={true}
          />
        )} */}
      </div>
    </div>
  )
}
