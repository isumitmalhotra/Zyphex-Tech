"use client"

import { Card, CardContent,  CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { Permission } from "@/lib/auth/permissions"
import {
  Shield,
  Users,
  Building,
  DollarSign,
  TrendingUp,
  Activity,
  AlertTriangle,
  BarChart3,
  Database,
  Lock,
  UserCheck,
  Clock,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Loader2,
  Briefcase,
} from "lucide-react"
import { SubtleBackground } from "@/components/subtle-background"
import { useSuperAdminDashboard } from "@/hooks/use-super-admin-dashboard"
import { DashboardMessaging } from "@/components/dashboard-messaging"
import { useSession } from "next-auth/react"
import Link from "next/link"

function SuperAdminDashboardContent() {
  const { dashboardData, loading, error, refresh } = useSuperAdminDashboard()
  const { data: session } = useSession()

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
        <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
              <span className="zyphex-subheading">Loading system dashboard...</span>
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
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  if (!dashboardData) return null

  const { 
    systemOverview, 
    monthlyStats, 
    usersByRole, 
    projectsByStatus, 
    teamPerformance, 
    securityMetrics, 
    systemHealth, 
    clientMetrics, 
    permissionUsage, 
    recentActivities, 
    recentUsers, 
    urgentTasks 
  } = dashboardData

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
      <SubtleBackground />
      <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold zyphex-heading flex items-center gap-2">
              <Shield className="h-8 w-8 text-red-400" />
              Super Admin Dashboard
            </h1>
            <p className="zyphex-subheading">Complete system oversight and control</p>
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

        {/* System Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">{systemOverview.totalUsers}</div>
              <p className="text-xs zyphex-subheading">
                +{monthlyStats.newUsers} this month
              </p>
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">
                ${systemOverview.totalRevenue.toLocaleString()}
              </div>
              <p className="text-xs zyphex-subheading">
                ${systemOverview.monthlyRevenue.toLocaleString()} this month
              </p>
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Total Projects</CardTitle>
              <Briefcase className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">{systemOverview.totalProjects}</div>
              <p className="text-xs zyphex-subheading">
                +{monthlyStats.newProjects} this month
              </p>
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Active Clients</CardTitle>
              <UserCheck className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">{clientMetrics.activeClients}</div>
              <p className="text-xs zyphex-subheading">
                {clientMetrics.totalClients} total clients
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Security & System Health */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Security Metrics */}
          <Card className="zyphex-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 zyphex-heading">
                <Lock className="h-5 w-5" />
                Security Metrics (30 days)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm zyphex-subheading">Failed Logins</span>
                <span className="text-sm font-medium text-red-400">{securityMetrics.failedLogins}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm zyphex-subheading">Admin Actions</span>
                <span className="text-sm font-medium text-yellow-400">{securityMetrics.adminActions}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm zyphex-subheading">Permission Changes</span>
                <span className="text-sm font-medium text-blue-400">{securityMetrics.permissionChanges}</span>
              </div>
              <Button variant="outline" className="w-full zyphex-button" asChild>
                <Link href="/super-admin/security">View Security Logs</Link>
              </Button>
            </CardContent>
          </Card>

          {/* System Health */}
          <Card className="zyphex-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 zyphex-heading">
                <Activity className="h-5 w-5" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm zyphex-subheading">Active Projects</span>
                <span className="text-sm font-medium text-green-400">{systemHealth.activeProjects}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm zyphex-subheading">Overdue Tasks</span>
                <span className="text-sm font-medium text-red-400">{systemHealth.overdueTasks}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm zyphex-subheading">Overdue Invoices</span>
                <span className="text-sm font-medium text-yellow-400">{systemHealth.overdueInvoices}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm zyphex-subheading">Inactive Users</span>
                <span className="text-sm font-medium text-gray-400">{systemHealth.inactiveUsers}</span>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Growth */}
          <Card className="zyphex-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 zyphex-heading">
                <TrendingUp className="h-5 w-5" />
                Monthly Growth
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm zyphex-subheading">New Users</span>
                <span className="text-sm font-medium text-green-400">+{monthlyStats.newUsers}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm zyphex-subheading">New Projects</span>
                <span className="text-sm font-medium text-blue-400">+{monthlyStats.newProjects}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm zyphex-subheading">New Clients</span>
                <span className="text-sm font-medium text-purple-400">+{monthlyStats.newClients}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm zyphex-subheading">Completed Projects</span>
                <span className="text-sm font-medium text-orange-400">{monthlyStats.completedProjects}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Users by Role */}
          <Card className="zyphex-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 zyphex-heading">
                <BarChart3 className="h-5 w-5" />
                Users by Role
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {usersByRole.map((roleData: any) => (
                <div key={roleData.role} className="flex items-center justify-between">
                  <span className="text-sm zyphex-subheading">{roleData.role}</span>
                  <span className="text-sm font-medium text-blue-400">{roleData._count.id}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Projects by Status */}
          <Card className="zyphex-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 zyphex-heading">
                <Briefcase className="h-5 w-5" />
                Projects by Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {projectsByStatus.map((statusData: any) => (
                <div key={statusData.status} className="flex items-center justify-between">
                  <span className="text-sm zyphex-subheading">{statusData.status}</span>
                  <span className="text-sm font-medium text-purple-400">{statusData._count.id}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Team Performance and Recent Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Performers */}
          <Card className="zyphex-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 zyphex-heading">
                <Users className="h-5 w-5" />
                Top Performers (30 days)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {teamPerformance.slice(0, 5).map((member: any) => (
                <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium zyphex-heading text-sm">{member.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {member.role}
                      </Badge>
                    </div>
                    <p className="text-xs zyphex-subheading">{member.email}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs zyphex-subheading">
                        Hours: {member.totalHours}
                      </span>
                      <span className="text-xs zyphex-subheading">
                        Tasks: {member.completedTasks}/{member.totalTasks}
                      </span>
                      <span className="text-xs zyphex-subheading">
                        Efficiency: {member.efficiency}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full zyphex-button" asChild>
                <Link href="/super-admin/team">View All Team Members</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Recent System Activities */}
          <Card className="zyphex-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 zyphex-heading">
                <Clock className="h-5 w-5" />
                Recent System Activities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivities.slice(0, 5).map((activity: any) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="w-2 h-2 rounded-full bg-blue-400 mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm zyphex-heading">{activity.action}</p>
                    <p className="text-xs zyphex-subheading">
                      {activity.user?.name || 'System'} • {activity.user?.role} • {new Date(activity.createdAt).toLocaleDateString()}
                    </p>
                    {activity.description && (
                      <p className="text-xs zyphex-subheading mt-1">{activity.description}</p>
                    )}
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full zyphex-button" asChild>
                <Link href="/super-admin/audit-logs">View All Activities</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Users and Urgent Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Users */}
          <Card className="zyphex-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 zyphex-heading">
                <UserCheck className="h-5 w-5" />
                Recent User Registrations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentUsers.slice(0, 5).map((user: any) => (
                <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium zyphex-heading text-sm">{user.name || 'No Name'}</h4>
                      <Badge variant="outline" className="text-xs">
                        {user.role}
                      </Badge>
                      {user.emailVerified && (
                        <Badge variant="default" className="text-xs">
                          Verified
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs zyphex-subheading">{user.email}</p>
                    <p className="text-xs zyphex-subheading">
                      Joined: {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/super-admin/users/${user.id}`}>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ))}
              <Button variant="outline" className="w-full zyphex-button" asChild>
                <Link href="/super-admin/users">Manage All Users</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Urgent Tasks */}
          <Card className="zyphex-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 zyphex-heading">
                <AlertTriangle className="h-5 w-5" />
                Urgent Tasks System-wide
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {urgentTasks.slice(0, 5).map((task: any) => (
                <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium zyphex-heading text-sm">{task.title}</h4>
                      <Badge variant="destructive" className="text-xs">
                        {task.priority}
                      </Badge>
                    </div>
                    <p className="text-xs zyphex-subheading">{task.project.name}</p>
                    {task.dueDate && (
                      <p className="text-xs zyphex-subheading">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </p>
                    )}
                    {task.assignee && (
                      <p className="text-xs zyphex-subheading">
                        Assigned: {task.assignee.name}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {urgentTasks.length === 0 && (
                <p className="text-center text-sm zyphex-subheading py-4">
                  No urgent tasks system-wide! 🎉
                </p>
              )}
              <Button variant="outline" className="w-full zyphex-button" asChild>
                <Link href="/super-admin/tasks">View All Tasks</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Permission Usage Analytics */}
        <Card className="zyphex-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 zyphex-heading">
              <Database className="h-5 w-5" />
              Most Used Permissions (30 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {permissionUsage.map((usage: any) => (
                <div key={usage.action} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <span className="text-sm zyphex-subheading">{usage.action}</span>
                  <span className="text-sm font-medium text-blue-400">{usage._count.id}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Messaging - Temporarily disabled */}
      {/* {session?.user && (
        <DashboardMessaging 
          userRole="SUPER_ADMIN"
          userId={session.user.id}
          compact={true}
        />
      )} */}
    </div>
  )
}

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