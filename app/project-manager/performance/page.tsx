"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { Permission } from "@/lib/auth/permissions"
import {
  TrendingUp,
  Users,
  Clock,
  Target,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Award,
  BarChart3,
  Timer,
} from "lucide-react"
import { SubtleBackground } from "@/components/subtle-background"
import { useProjectManagerDashboard } from "@/hooks/use-project-manager-dashboard"
import Link from "next/link"

function TeamPerformanceContent() {
  const { dashboardData, loading, error, refresh } = useProjectManagerDashboard()

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
        <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
              <span className="zyphex-subheading">Loading team performance...</span>
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
          <div className="text-white">No team performance data available</div>
        </div>
      </div>
    )
  }

  const { overview, teamPerformance } = dashboardData

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
      <SubtleBackground />
      <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold zyphex-heading">Team Performance</h1>
            <p className="zyphex-subheading">Monitor team productivity and performance metrics</p>
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

        {/* Performance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Team Members</CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">{overview.totalTeamMembers}</div>
              <p className="text-xs zyphex-subheading">Active team size</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Tasks Completed</CardTitle>
              <Target className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">{overview.completedTasks}</div>
              <p className="text-xs zyphex-subheading">This month</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Avg. Performance</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">85%</div>
              <p className="text-xs zyphex-subheading">Team efficiency</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Hours Logged</CardTitle>
              <Clock className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">240</div>
              <p className="text-xs zyphex-subheading">This week</p>
            </CardContent>
          </Card>
        </div>

        {/* Team Performance Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Individual Performance */}
          <Card className="zyphex-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 zyphex-heading">
                <Award className="h-5 w-5" />
                Individual Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {teamPerformance.length === 0 ? (
                <p className="text-center zyphex-subheading py-8">No team performance data available</p>
              ) : (
                teamPerformance.slice(0, 5).map((member, _index) => (
                  <div key={member.userId} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                        {member.user?.name?.[0] || 'U'}
                      </div>
                      <div>
                        <p className="font-medium zyphex-heading">{member.user?.name || 'Unknown User'}</p>
                        <p className="text-sm zyphex-subheading">{member.user?.email || 'No email'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium zyphex-heading">{member._count.id} tasks</p>
                      <p className="text-sm zyphex-subheading">
                        {Math.round((member._sum.duration || 0) / 60)} hrs
                      </p>
                    </div>
                  </div>
                ))
              )}
              <Button variant="outline" className="w-full zyphex-button" asChild>
                <Link href="/project-manager/team">View All Team Members</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Performance Trends */}
          <Card className="zyphex-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 zyphex-heading">
                <BarChart3 className="h-5 w-5" />
                Performance Trends
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm zyphex-subheading">Task Completion Rate</span>
                  <span className="text-sm font-medium zyphex-heading">92%</span>
                </div>
                <Progress value={92} className="h-2" />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm zyphex-subheading">On-time Delivery</span>
                  <span className="text-sm font-medium zyphex-heading">88%</span>
                </div>
                <Progress value={88} className="h-2" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm zyphex-subheading">Quality Score</span>
                  <span className="text-sm font-medium zyphex-heading">95%</span>
                </div>
                <Progress value={95} className="h-2" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm zyphex-subheading">Team Satisfaction</span>
                  <span className="text-sm font-medium zyphex-heading">87%</span>
                </div>
                <Progress value={87} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="zyphex-card">
          <CardHeader>
            <CardTitle className="zyphex-heading">Performance Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button className="zyphex-button h-auto p-4 flex-col gap-2" asChild>
                <Link href="/project-manager/team">
                  <Users className="h-6 w-6" />
                  <span>Manage Team</span>
                </Link>
              </Button>
              <Button className="zyphex-button h-auto p-4 flex-col gap-2" asChild>
                <Link href="/project-manager/time-tracking">
                  <Timer className="h-6 w-6" />
                  <span>Time Tracking</span>
                </Link>
              </Button>
              <Button className="zyphex-button h-auto p-4 flex-col gap-2" asChild>
                <Link href="/project-manager/workload">
                  <Clock className="h-6 w-6" />
                  <span>Workload</span>
                </Link>
              </Button>
              <Button className="zyphex-button h-auto p-4 flex-col gap-2" asChild>
                <Link href="/project-manager/performance-reports">
                  <Award className="h-6 w-6" />
                  <span>Reports</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function TeamPerformance() {
  return (
    <PermissionGuard 
      permission={Permission.VIEW_TEAM_PERFORMANCE}
      fallback={
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
          <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You don&apos;t have permission to view team performance.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      }
    >
      <TeamPerformanceContent />
    </PermissionGuard>
  )
}