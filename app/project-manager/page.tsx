"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { Permission } from "@/lib/auth/permissions"
import {
  Users,
  Briefcase,
  Clock,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Target,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Loader2,
} from "lucide-react"
import { SubtleBackground } from "@/components/subtle-background"
import { useProjectManagerDashboard } from "@/hooks/use-project-manager-dashboard"
import { DashboardMessaging } from "@/components/dashboard-messaging"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface Project {
  id: string;
  name: string;
  status: string;
  client: { name: string; email: string };
  startDate: string | null;
  endDate: string | null;
  budget: number | null;
  createdAt: string;
  updatedAt: string;
  taskStats: { completed: number; total: number };
  team: { members: Array<unknown> };
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  priority: string;
  status: string;
  project: { name: string; id: string };
  assignee: { name: string; email: string } | null;
}

interface TeamMember {
  userId: string;
  _sum: { duration: number | null };
  _count: { id: number };
  user: { id: string; name: string; email: string } | undefined;
}

interface Activity {
  id: string;
  action: string;
  entityType: string;
  description: string | null;
  createdAt: string;
  user: { name: string | null; email: string } | null;
}

function ProjectManagerDashboardContent() {
  const { dashboardData, loading, error, refresh } = useProjectManagerDashboard()
  const { data: session } = useSession()
  const router = useRouter()

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
        <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
              <span className="zyphex-subheading">Loading project manager dashboard...</span>
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

  if (!dashboardData) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
        <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
          <div className="text-white">No dashboard data available</div>
        </div>
      </div>
    )
  }

  // Provide default values to prevent undefined errors
  const overview = dashboardData.overview || {
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalTeamMembers: 0,
    totalTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    taskCompletionRate: 0,
  }
  
  const recentProjects = dashboardData.recentProjects || []
  const upcomingDeadlines = dashboardData.upcomingDeadlines || []
  const teamPerformance = dashboardData.teamPerformance || []
  const recentActivities = dashboardData.recentActivities || []

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
      <SubtleBackground />
      <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold zyphex-heading">Project Manager Dashboard</h1>
            <p className="zyphex-subheading">Manage your projects and team performance</p>
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

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Total Projects</CardTitle>
              <Briefcase className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">{overview.totalProjects}</div>
              <p className="text-xs zyphex-subheading">
                {overview.activeProjects} active, {overview.completedProjects} completed
              </p>
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Team Members</CardTitle>
              <Users className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">{overview.totalTeamMembers}</div>
              <p className="text-xs zyphex-subheading">Active team members</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Task Completion</CardTitle>
              <Target className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">{overview.taskCompletionRate}%</div>
              <p className="text-xs zyphex-subheading">
                {overview.completedTasks} of {overview.totalTasks} tasks
              </p>
              <Progress value={overview.taskCompletionRate} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Overdue Tasks</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading text-red-400">{overview.overdueTasks}</div>
              <p className="text-xs zyphex-subheading">Require immediate attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Projects */}
          <Card className="zyphex-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 zyphex-heading">
                <Briefcase className="h-5 w-5" />
                Recent Projects
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentProjects.slice(0, 5).map((project: Project) => (
                <div 
                  key={project.id} 
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800/70 cursor-pointer transition-all duration-200"
                  onClick={() => router.push('/project-manager/projects')}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium zyphex-heading text-sm hover:text-blue-400 transition-colors">{project.name}</h4>
                      <Badge 
                        variant={project.status === 'COMPLETED' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {project.status}
                      </Badge>
                    </div>
                    <p className="text-xs zyphex-subheading">{project.client.name}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs zyphex-subheading">
                        Tasks: {project.taskStats.completed}/{project.taskStats.total}
                      </span>
                      <span className="text-xs zyphex-subheading">
                        Team: {project.team.members.length} members
                      </span>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push('/project-manager/projects');
                    }}
                    className="hover-zyphex-glow"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" className="w-full zyphex-button" asChild>
                <Link href="/project-manager/projects">View All Projects</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Upcoming Deadlines */}
          <Card className="zyphex-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 zyphex-heading">
                <Calendar className="h-5 w-5" />
                Upcoming Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingDeadlines.slice(0, 5).map((task: Task) => (
                <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium zyphex-heading text-sm">{task.title}</h4>
                      <Badge 
                        variant={task.priority === 'HIGH' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {task.priority}
                      </Badge>
                    </div>
                    <p className="text-xs zyphex-subheading">{task.project.name}</p>
                    <p className="text-xs zyphex-subheading">
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </p>
                    {task.assignee && (
                      <p className="text-xs zyphex-subheading">
                        Assigned: {task.assignee.name}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full zyphex-button" asChild>
                <Link href="/project-manager/tasks">View All Tasks</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Team Performance and Recent Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Team Performance */}
          <Card className="zyphex-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 zyphex-heading">
                <TrendingUp className="h-5 w-5" />
                Team Performance (30 days)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {teamPerformance.filter(member => member && member.user).slice(0, 5).map((member: TeamMember) => (
                <div key={member.userId} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="flex-1">
                    <h4 className="font-medium zyphex-heading text-sm">
                      {member.user?.name || 'Unknown User'}
                    </h4>
                    <p className="text-xs zyphex-subheading">{member.user?.email}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs zyphex-subheading">
                        Hours: {Math.round(((member._sum?.duration || 0) * 100)) / 100}
                      </span>
                      <span className="text-xs zyphex-subheading">
                        Entries: {member._count?.id || 0}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full zyphex-button" asChild>
                <Link href="/project-manager/team">View Team Details</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card className="zyphex-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 zyphex-heading">
                <Clock className="h-5 w-5" />
                Recent Activities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivities.slice(0, 5).map((activity: Activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="w-2 h-2 rounded-full bg-blue-400 mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm zyphex-heading">{activity.action}</p>
                    <p className="text-xs zyphex-subheading">
                      {activity.user?.name || 'System'} • {new Date(activity.createdAt).toLocaleDateString()}
                    </p>
                    {activity.description && (
                      <p className="text-xs zyphex-subheading mt-1">{activity.description}</p>
                    )}
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full zyphex-button" asChild>
                <Link href="/project-manager/reports">View All Activities</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Real-time Messaging - Temporarily disabled due to connection issues */}
        {/* {session?.user && (
          <DashboardMessaging 
            userRole="PROJECT_MANAGER"
            userId={session.user.id}
            compact={true}
          />
        )} */}
      </div>
    </div>
  )
}

export default function ProjectManagerDashboard() {
  return (
    <PermissionGuard 
      permission={Permission.VIEW_DASHBOARD}
      fallback={
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
          <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You don&apos;t have permission to view this dashboard.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      }
    >
      <ProjectManagerDashboardContent />
    </PermissionGuard>
  )
}