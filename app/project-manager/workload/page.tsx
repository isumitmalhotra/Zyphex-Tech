"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { Permission } from "@/lib/auth/permissions"
import {
  Clock,
  Users,
  Target,
  AlertTriangle,
  RefreshCw,
  Calendar,
  BarChart3,
  Timer,
} from "lucide-react"
import { SubtleBackground } from "@/components/subtle-background"
import Link from "next/link"

const workloadData = [
  {
    id: 1,
    name: "John Smith",
    role: "Frontend Developer",
    currentHours: 32,
    maxHours: 40,
    tasks: 8,
    projects: ["E-commerce Platform", "Mobile App"],
    status: "optimal",
  },
  {
    id: 2,
    name: "Sarah Johnson",
    role: "Backend Developer",
    currentHours: 45,
    maxHours: 40,
    tasks: 12,
    projects: ["E-commerce Platform", "API Integration"],
    status: "overloaded",
  },
  {
    id: 3,
    name: "Mike Davis",
    role: "UI/UX Designer",
    currentHours: 25,
    maxHours: 40,
    tasks: 5,
    projects: ["Website Redesign"],
    status: "underutilized",
  },
]

function WorkloadManagementContent() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
      <SubtleBackground />
      <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold zyphex-heading">Workload Management</h1>
            <p className="zyphex-subheading">Monitor and balance team workload distribution</p>
          </div>
          <Button variant="outline" size="sm" className="zyphex-button">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Workload Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Team Members</CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">{workloadData.length}</div>
              <p className="text-xs zyphex-subheading">Active team members</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Total Hours</CardTitle>
              <Clock className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">
                {workloadData.reduce((acc, w) => acc + w.currentHours, 0)}
              </div>
              <p className="text-xs zyphex-subheading">This week</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Overloaded</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">
                {workloadData.filter(w => w.status === 'overloaded').length}
              </div>
              <p className="text-xs zyphex-subheading">Need attention</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Avg. Utilization</CardTitle>
              <BarChart3 className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">
                {Math.round(workloadData.reduce((acc, w) => acc + (w.currentHours / w.maxHours), 0) / workloadData.length * 100)}%
              </div>
              <p className="text-xs zyphex-subheading">Team average</p>
            </CardContent>
          </Card>
        </div>

        {/* Workload Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="zyphex-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 zyphex-heading">
                <BarChart3 className="h-5 w-5" />
                Hours Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {workloadData.map((member) => (
                <div key={member.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium zyphex-heading">{member.name}</span>
                    <span className="text-sm zyphex-subheading">{member.currentHours}/{member.maxHours}h</span>
                  </div>
                  <Progress 
                    value={(member.currentHours / member.maxHours) * 100} 
                    className="h-2"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="zyphex-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 zyphex-heading">
                <Target className="h-5 w-5" />
                Task Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {workloadData.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                      {member.name[0]}
                    </div>
                    <div>
                      <p className="font-medium zyphex-heading">{member.name}</p>
                      <p className="text-sm zyphex-subheading">{member.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium zyphex-heading">{member.tasks} tasks</p>
                    <Badge variant={
                      member.status === 'optimal' ? 'default' :
                      member.status === 'overloaded' ? 'destructive' :
                      'secondary'
                    }>
                      {member.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Detailed Workload Analysis */}
        <Card className="zyphex-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 zyphex-heading">
              <Clock className="h-5 w-5" />
              Detailed Workload Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {workloadData.map((member) => (
                <div key={member.id} className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                        {member.name[0]}
                      </div>
                      <div>
                        <h3 className="font-semibold zyphex-heading">{member.name}</h3>
                        <p className="text-sm zyphex-subheading">{member.role}</p>
                      </div>
                    </div>
                    <Badge variant={
                      member.status === 'optimal' ? 'default' :
                      member.status === 'overloaded' ? 'destructive' :
                      'secondary'
                    }>
                      {member.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm font-medium zyphex-subheading mb-1">Hours This Week</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-700 rounded-full">
                          <div 
                            className={`h-full rounded-full ${
                              member.status === 'overloaded' ? 'bg-red-500' :
                              member.status === 'optimal' ? 'bg-green-500' :
                              'bg-yellow-500'
                            }`}
                            style={{ width: `${(member.currentHours / member.maxHours) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm zyphex-heading">{member.currentHours}/{member.maxHours}h</span>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium zyphex-subheading mb-1">Active Tasks</p>
                      <p className="text-lg font-semibold zyphex-heading">{member.tasks}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium zyphex-subheading mb-1">Utilization</p>
                      <p className="text-lg font-semibold zyphex-heading">
                        {Math.round((member.currentHours / member.maxHours) * 100)}%
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium zyphex-subheading mb-1">Projects</p>
                      <div className="flex flex-wrap gap-1">
                        {member.projects.map((project, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {project}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="zyphex-card">
          <CardHeader>
            <CardTitle className="zyphex-heading">Workload Actions</CardTitle>
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
                <Link href="/project-manager/tasks">
                  <Target className="h-6 w-6" />
                  <span>Assign Tasks</span>
                </Link>
              </Button>
              <Button className="zyphex-button h-auto p-4 flex-col gap-2" asChild>
                <Link href="/project-manager/time-tracking">
                  <Timer className="h-6 w-6" />
                  <span>Time Tracking</span>
                </Link>
              </Button>
              <Button className="zyphex-button h-auto p-4 flex-col gap-2" asChild>
                <Link href="/project-manager/planning">
                  <Calendar className="h-6 w-6" />
                  <span>Planning</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function WorkloadManagement() {
  return (
    <PermissionGuard 
      permission={Permission.VIEW_TEAM_PERFORMANCE}
      fallback={
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
          <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You don&apos;t have permission to manage workload.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      }
    >
      <WorkloadManagementContent />
    </PermissionGuard>
  )
}