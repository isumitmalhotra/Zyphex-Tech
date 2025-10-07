"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { Permission } from "@/lib/auth/permissions"
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  Calendar,
  BarChart3,
  FileText,
  MessageSquare,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Loader2,
  Briefcase,
  Target,
} from "lucide-react"
import { SubtleBackground } from "@/components/subtle-background"
import { useTeamMemberDashboard } from "@/hooks/use-team-member-dashboard"
import { DashboardMessaging } from "@/components/dashboard-messaging"
import { useSession } from "next-auth/react"

// Type definitions for better type safety
interface TaskType {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  project: { name: string; id: string };
}

interface ProjectType {
  id: string;
  name: string;
  description: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  budget: number | null;
  client: { name: string };
  taskStats: {
    total: number;
    completed: number;
    inProgress: number;
    todo: number;
  };
}

interface MessageType {
  id: string;
  content: string;
  createdAt: string;
  sender: { name: string | null; email: string };
}

interface DocumentType {
  id: string;
  title: string;
  fileName: string;
  createdAt: string;
  project: { name: string; id: string } | null;
  uploadedBy: { name: string | null; email: string };
}

function TeamMemberDashboardContent() {
  const { dashboardData, loading, error, refresh } = useTeamMemberDashboard()
  const { data: session } = useSession()

  if (loading) {
    return (
      <div className="h-screen flex flex-col zyphex-gradient-bg relative overflow-hidden">
        <SubtleBackground />
        <div className="flex-1 flex items-center justify-center relative z-10">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
            <span className="zyphex-subheading">Loading your dashboard...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen flex flex-col zyphex-gradient-bg relative overflow-hidden">
        <SubtleBackground />
        <div className="flex-1 flex flex-col gap-4 p-4 relative z-10">
          <Alert className="border-red-500/30">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div>Error loading dashboard: {error}</div>
                <Button 
                  onClick={() => refresh()} 
                  variant="outline" 
                  size="sm"
                  className="zyphex-button"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  if (!dashboardData) return null

  const { overview, recentTasks, upcomingDeadlines, userProjects, timeByProject, recentMessages, recentDocuments, weeklyActivity } = dashboardData

  return (
    <div className="h-screen flex flex-col zyphex-gradient-bg relative overflow-hidden">
      <SubtleBackground />
      <div className="flex-1 flex flex-col gap-4 p-4 relative z-10 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold zyphex-heading">My Dashboard</h1>
            <p className="zyphex-subheading">Track your tasks, projects, and productivity</p>
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
              <CardTitle className="text-sm font-medium zyphex-subheading">My Tasks</CardTitle>
              <Target className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">{overview.totalTasks}</div>
              <p className="text-xs zyphex-subheading">
                {overview.completedTasks} completed, {overview.pendingTasks} pending
              </p>
              <Progress value={overview.taskCompletionRate} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Hours This Month</CardTitle>
              <Clock className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">{overview.totalHoursWorked}h</div>
              <p className="text-xs zyphex-subheading">
                Avg: {overview.averageHoursPerDay}h/day
              </p>
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Active Projects</CardTitle>
              <Briefcase className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">{overview.activeProjects}</div>
              <p className="text-xs zyphex-subheading">Projects you&apos;re involved in</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Overdue Tasks</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading text-red-400">{overview.overdueTasks}</div>
              <p className="text-xs zyphex-subheading">Need immediate attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Tasks */}
          <Card className="zyphex-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 zyphex-heading">
                <CheckCircle className="h-5 w-5" />
                My Recent Tasks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentTasks.slice(0, 5).map((task: TaskType) => (
                <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium zyphex-heading text-sm">{task.title}</h4>
                      <Badge 
                        variant={task.status === 'COMPLETED' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {task.status}
                      </Badge>
                      <Badge 
                        variant={task.priority === 'HIGH' ? 'destructive' : 'outline'}
                        className="text-xs"
                      >
                        {task.priority}
                      </Badge>
                    </div>
                    <p className="text-xs zyphex-subheading">{task.project.name}</p>
                    {task.dueDate && (
                      <p className="text-xs zyphex-subheading">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Button variant="ghost" size="sm">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" className="w-full zyphex-button">
                View All My Tasks
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
              {upcomingDeadlines.map((task: TaskType) => (
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
                      Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                    </p>
                  </div>
                </div>
              ))}
              {upcomingDeadlines.length === 0 && (
                <p className="text-center text-sm zyphex-subheading py-4">
                  No upcoming deadlines! 🎉
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Projects and Time Tracking */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Projects */}
          <Card className="zyphex-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 zyphex-heading">
                <Briefcase className="h-5 w-5" />
                My Projects
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {userProjects.slice(0, 4).map((project: ProjectType) => (
                <div key={project.id} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium zyphex-heading text-sm">{project.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {project.status}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs zyphex-subheading mb-2">{project.client.name}</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <div className="font-medium text-blue-400">{project.taskStats.todo}</div>
                      <div className="zyphex-subheading">Todo</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-yellow-400">{project.taskStats.inProgress}</div>
                      <div className="zyphex-subheading">In Progress</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-green-400">{project.taskStats.completed}</div>
                      <div className="zyphex-subheading">Completed</div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Time by Project (Last Week) */}
          <Card className="zyphex-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 zyphex-heading">
                <BarChart3 className="h-5 w-5" />
                Time by Project (This Week)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(timeByProject).map(([projectName, hours]: [string, number]) => (
                <div key={projectName} className="flex items-center justify-between">
                  <span className="text-sm zyphex-heading">{projectName}</span>
                  <span className="text-sm font-medium text-blue-400">{Math.round(hours * 100) / 100}h</span>
                </div>
              ))}
              {Object.keys(timeByProject).length === 0 && (
                <p className="text-center text-sm zyphex-subheading py-4">
                  No time logged this week
                </p>
              )}
              <div className="pt-2 border-t border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium zyphex-heading">Weekly Total</span>
                  <span className="text-sm font-medium text-green-400">{weeklyActivity.totalHours.toFixed(2)}h</span>
                </div>
                <p className="text-xs zyphex-subheading">
                  {weeklyActivity.totalEntries} entries • Avg: {weeklyActivity.averagePerDay.toFixed(1)} entries/day
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Messages and Documents */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Messages */}
          <Card className="zyphex-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 zyphex-heading">
                <MessageSquare className="h-5 w-5" />
                Recent Messages
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentMessages.slice(0, 5).map((message: MessageType) => (
                <div key={message.id} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm zyphex-heading">{message.sender.name}</p>
                      <p className="text-xs zyphex-subheading truncate">{message.content}</p>
                      <p className="text-xs zyphex-subheading">
                        {new Date(message.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {recentMessages.length === 0 && (
                <p className="text-center text-sm zyphex-subheading py-4">
                  No recent messages
                </p>
              )}
              <Button variant="outline" className="w-full zyphex-button">
                View All Messages
              </Button>
            </CardContent>
          </Card>

          {/* Recent Documents */}
          <Card className="zyphex-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 zyphex-heading">
                <FileText className="h-5 w-5" />
                Recent Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentDocuments.slice(0, 5).map((document: DocumentType) => (
                <div key={document.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="flex-1">
                    <h4 className="font-medium zyphex-heading text-sm">{document.title}</h4>
                    <p className="text-xs zyphex-subheading">{document.fileName}</p>
                    <p className="text-xs zyphex-subheading">
                      {document.project?.name} • {new Date(document.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {recentDocuments.length === 0 && (
                <p className="text-center text-sm zyphex-subheading py-4">
                  No recent documents
                </p>
              )}
              <Button variant="outline" className="w-full zyphex-button">
                View All Documents
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Real-time Messaging - Temporarily disabled */}
        {/* {session?.user && (
          <DashboardMessaging 
            userRole="TEAM_MEMBER"
            userId={session.user.id}
            compact={true}
          />
        )} */}
      </div>
    </div>
  )
}

export default function TeamMemberDashboard() {
  return (
    <PermissionGuard 
      permission={Permission.VIEW_DASHBOARD}
      fallback={
        <div className="h-screen flex flex-col zyphex-gradient-bg relative overflow-hidden">
          <SubtleBackground />
          <div className="flex-1 flex flex-col gap-4 p-4 relative z-10">
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
      <TeamMemberDashboardContent />
    </PermissionGuard>
  )
}