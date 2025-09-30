"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
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
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertCircle,
  Shield,
  Database,
  FileText,
  Settings,
  Globe,
  Lock,
  Server,
  Monitor,
  Eye,
} from "lucide-react"
import { SubtleBackground } from "@/components/subtle-background"
import { Icon3D } from "@/components/3d-icons"
import { useSuperAdminDashboard } from "@/hooks/use-super-admin-dashboard"
import Link from "next/link"

export default function SuperAdminDashboard() {
  return (
    <PermissionGuard 
      permission={Permission.MANAGE_SYSTEM}
      fallback={
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
          <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You don&apos;t have permission to view the super admin dashboard.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      }
    >
      <SuperAdminDashboardContent />
    </PermissionGuard>
  )
}

function SuperAdminDashboardContent() {
  const { dashboardData: data, error, loading: isLoading, refresh: mutate } = useSuperAdminDashboard()

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
        <SubtleBackground />
        <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="zyphex-card">
                <CardHeader>
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
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
              Failed to load super admin dashboard data. Please try again.
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

  const { systemOverview, monthlyStats, securityMetrics, systemHealth } = data

  const systemStats = [
    {
      title: "Total Users",
      value: systemOverview.totalUsers.toString(),
      change: `+${monthlyStats.newUsers} this month`,
      trend: "up",
      icon: "Users",
      description: "Registered platform users",
    },
    {
      title: "Active Projects",
      value: systemHealth.activeProjects.toString(),
      change: `+${monthlyStats.newProjects} new`,
      trend: "up",
      icon: "Database",
      description: "Currently active projects",
    },
    {
      title: "Total Revenue",
      value: `$${systemOverview.totalRevenue.toLocaleString()}`,
      change: `+$${systemOverview.monthlyRevenue.toLocaleString()} this month`,
      trend: "up",
      icon: "TrendingUp",
      description: "Total platform revenue",
    },
    {
      title: "Failed Logins",
      value: securityMetrics.failedLogins.toString(),
      change: "Last 24 hours",
      trend: "down",
      icon: "Shield",
      description: "Security incidents",
    },
    {
      title: "Total Clients",
      value: systemOverview.totalClients.toString(),
      change: `+${monthlyStats.newClients} this month`,
      trend: "up",
      icon: "Building2",
      description: "Active client accounts",
    },
    {
      title: "Overdue Tasks",
      value: systemHealth.overdueTasks.toString(),
      change: "Requires attention",
      trend: "down",
      icon: "AlertCircle",
      description: "Tasks past due date",
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
                <BreadcrumbLink href="/dashboard" className="zyphex-subheading hover:text-white">
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage className="zyphex-heading">Super Admin</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-red-500 animate-pulse" />
            <div>
              <h1 className="text-3xl font-bold zyphex-heading">System Control Center</h1>
              <p className="zyphex-subheading">Full platform oversight and system administration</p>
            </div>
          </div>
        </div>

        {/* System Health Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {systemStats.map((stat, index) => (
            <Card key={index} className="zyphex-card hover-zyphex-lift">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium zyphex-heading">{stat.title}</CardTitle>
                <Icon3D icon={stat.icon} size={16} color="var(--zyphex-accent)" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold zyphex-heading">{stat.value}</div>
                <div className="flex items-center space-x-2 text-xs">
                  {stat.trend === "up" ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className={`font-medium ${stat.trend === "up" ? "text-green-500" : "text-red-500"}`}>
                    {stat.change}
                  </span>
                </div>
                <p className="text-xs zyphex-subheading mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          {/* Security Overview */}
          <Card className="col-span-4 zyphex-card hover-zyphex-lift">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="zyphex-heading flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Security Overview
                  </CardTitle>
                  <CardDescription className="zyphex-subheading">Security incidents and monitoring</CardDescription>
                </div>
                <PermissionGuard permission={Permission.VIEW_AUDIT_LOGS}>
                  <Button variant="outline" size="sm" className="zyphex-button-secondary bg-transparent" asChild>
                    <Link href="/dashboard/super-admin/security">
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </Link>
                  </Button>
                </PermissionGuard>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="zyphex-subheading">Failed Login Attempts</span>
                      <span className="font-medium text-red-400">{securityMetrics.failedLogins || 0}</span>
                    </div>
                    <Progress value={(securityMetrics.failedLogins || 0) / 100 * 100} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="zyphex-subheading">Suspicious Activities</span>
                      <span className="font-medium text-yellow-400">{securityMetrics.failedLogins}</span>
                    </div>
                    <Progress value={(securityMetrics.failedLogins) / 50 * 100} className="h-2" />
                  </div>
                </div>
                
                <div className="space-y-3">
                  {[
                    { action: "Failed login attempt", details: "IP: 192.168.1.100", level: "warning" },
                    { action: "Admin privilege escalation", details: "User: admin@zyphextech.com", level: "critical" },
                    { action: "Database backup completed", details: "Size: 2.1GB", level: "info" },
                    { action: "Security scan completed", details: "0 vulnerabilities found", level: "info" },
                    { action: "Password reset request", details: "User: user@example.com", level: "info" }
                  ].map((event: { action: string; details: string; level: string }, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg zyphex-glass-effect">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${
                          event.level === 'critical' ? 'bg-red-500' :
                          event.level === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                        }`} />
                        <div>
                          <p className="text-sm font-medium zyphex-heading">{event.action}</p>
                          <p className="text-xs zyphex-subheading">{event.details}</p>
                        </div>
                      </div>
                      <Badge variant={event.level === 'critical' ? 'destructive' : 'secondary'}>
                        {event.level}
                      </Badge>
                    </div>
                  )) || (
                    <div className="text-center py-4">
                      <p className="text-sm zyphex-subheading">No recent security events</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Resources */}
          <Card className="col-span-3 zyphex-card hover-zyphex-lift">
            <CardHeader>
              <CardTitle className="zyphex-heading flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                System Resources
              </CardTitle>
              <CardDescription className="zyphex-subheading">Real-time system performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="zyphex-subheading">Active Projects</span>
                    <span className="font-medium">{systemHealth.activeProjects}</span>
                  </div>
                  <Progress value={(systemHealth.activeProjects / 50) * 100} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="zyphex-subheading">Overdue Tasks</span>
                    <span className="font-medium">{systemHealth.overdueTasks}</span>
                  </div>
                  <Progress value={(systemHealth.overdueTasks / 20) * 100} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="zyphex-subheading">Overdue Invoices</span>
                    <span className="font-medium">{systemHealth.overdueInvoices}</span>
                  </div>
                  <Progress value={(systemHealth.overdueInvoices / 10) * 100} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="zyphex-subheading">Inactive Users</span>
                    <span className="font-medium">{systemHealth.inactiveUsers}</span>
                  </div>
                  <Progress value={(systemHealth.inactiveUsers / 100) * 100} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Administration Actions */}
        <Card className="zyphex-card hover-zyphex-lift">
          <CardHeader>
            <CardTitle className="zyphex-heading flex items-center gap-2">
              <Settings className="h-5 w-5" />
              System Administration
            </CardTitle>
            <CardDescription className="zyphex-subheading">Critical system management functions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
              <PermissionGuard permission={Permission.MANAGE_SYSTEM}>
                <Button className="h-20 flex-col space-y-2 zyphex-button-primary hover-zyphex-lift" asChild>
                  <Link href="/dashboard/super-admin/system">
                    <Server className="h-6 w-6" />
                    <span>System Config</span>
                  </Link>
                </Button>
              </PermissionGuard>
              
              <PermissionGuard permission={Permission.VIEW_AUDIT_LOGS}>
                <Button className="h-20 flex-col space-y-2 zyphex-button-secondary bg-transparent hover-zyphex-lift" asChild>
                  <Link href="/dashboard/super-admin/audit">
                    <FileText className="h-6 w-6" />
                    <span>Audit Logs</span>
                  </Link>
                </Button>
              </PermissionGuard>
              
              <PermissionGuard permission={Permission.MANAGE_BACKUPS}>
                <Button className="h-20 flex-col space-y-2 zyphex-button-secondary bg-transparent hover-zyphex-lift" asChild>
                  <Link href="/dashboard/super-admin/backups">
                    <Database className="h-6 w-6" />
                    <span>Backups</span>
                  </Link>
                </Button>
              </PermissionGuard>
              
              <PermissionGuard permission={Permission.MANAGE_USER_ROLES}>
                <Button className="h-20 flex-col space-y-2 zyphex-button-secondary bg-transparent hover-zyphex-lift" asChild>
                  <Link href="/dashboard/super-admin/users">
                    <Users className="h-6 w-6" />
                    <span>User Management</span>
                  </Link>
                </Button>
              </PermissionGuard>
              
              <PermissionGuard permission={Permission.MANAGE_SETTINGS}>
                <Button className="h-20 flex-col space-y-2 zyphex-button-secondary bg-transparent hover-zyphex-lift" asChild>
                  <Link href="/dashboard/super-admin/settings">
                    <Globe className="h-6 w-6" />
                    <span>Global Settings</span>
                  </Link>
                </Button>
              </PermissionGuard>
              
              <PermissionGuard permission={Permission.VIEW_ANALYTICS}>
                <Button className="h-20 flex-col space-y-2 zyphex-button-secondary bg-transparent hover-zyphex-lift" asChild>
                  <Link href="/dashboard/super-admin/analytics">
                    <BarChart3 className="h-6 w-6" />
                    <span>Analytics</span>
                  </Link>
                </Button>
              </PermissionGuard>
            </div>
          </CardContent>
        </Card>

        {/* Platform Status */}
        <Card className="zyphex-card hover-zyphex-lift">
          <CardHeader>
            <CardTitle className="zyphex-heading">Platform Status</CardTitle>
            <CardDescription className="zyphex-subheading">Overall platform health and metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="text-center p-4 rounded-lg zyphex-glass-effect">
                <div className="text-2xl font-bold zyphex-heading">{systemOverview.totalUsers}</div>
                <p className="text-sm zyphex-subheading">Total Users</p>
              </div>
              <div className="text-center p-4 rounded-lg zyphex-glass-effect">
                <div className="text-2xl font-bold zyphex-heading">{systemOverview.totalProjects}</div>
                <p className="text-sm zyphex-subheading">Total Projects</p>
              </div>
              <div className="text-center p-4 rounded-lg zyphex-glass-effect">
                <div className="text-2xl font-bold zyphex-heading">${systemOverview.totalRevenue.toLocaleString()}</div>
                <p className="text-sm zyphex-subheading">Platform Revenue</p>
              </div>
              <div className="text-center p-4 rounded-lg zyphex-glass-effect">
                <div className="text-2xl font-bold zyphex-heading">{systemOverview.totalClients}</div>
                <p className="text-sm zyphex-subheading">Active Clients</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}