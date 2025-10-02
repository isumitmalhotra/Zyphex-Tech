"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { Permission } from "@/lib/auth/permissions"
import {
  Flag,
  Calendar,
  Target,
  AlertTriangle,
  RefreshCw,
  Plus,
  Clock,
  CheckCircle,
  CircleDot,
} from "lucide-react"
import { SubtleBackground } from "@/components/subtle-background"
import Link from "next/link"

const milestones = [
  {
    id: 1,
    title: "Project Kickoff",
    description: "Initial project planning and team alignment",
    dueDate: "2024-01-15",
    status: "completed",
    project: "E-commerce Platform",
    progress: 100,
  },
  {
    id: 2,
    title: "MVP Development",
    description: "Core features development and testing",
    dueDate: "2024-02-28",
    status: "in_progress",
    project: "E-commerce Platform",
    progress: 75,
  },
  {
    id: 3,
    title: "User Testing Phase",
    description: "Comprehensive user testing and feedback collection",
    dueDate: "2024-03-15",
    status: "pending",
    project: "Mobile App",
    progress: 0,
  },
  {
    id: 4,
    title: "Client Review",
    description: "Final client review and approval",
    dueDate: "2024-03-30",
    status: "pending",
    project: "Website Redesign",
    progress: 0,
  },
]

function MilestonesContent() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
      <SubtleBackground />
      <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold zyphex-heading">Project Milestones</h1>
            <p className="zyphex-subheading">Track and manage project milestones and deadlines</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="zyphex-button">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button size="sm" className="zyphex-button">
              <Plus className="h-4 w-4 mr-2" />
              Add Milestone
            </Button>
          </div>
        </div>

        {/* Milestone Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Total Milestones</CardTitle>
              <Flag className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">{milestones.length}</div>
              <p className="text-xs zyphex-subheading">All milestones</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">
                {milestones.filter(m => m.status === 'completed').length}
              </div>
              <p className="text-xs zyphex-subheading">Finished milestones</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">In Progress</CardTitle>
              <CircleDot className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">
                {milestones.filter(m => m.status === 'in_progress').length}
              </div>
              <p className="text-xs zyphex-subheading">Active milestones</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Upcoming</CardTitle>
              <Clock className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">
                {milestones.filter(m => m.status === 'pending').length}
              </div>
              <p className="text-xs zyphex-subheading">Pending milestones</p>
            </CardContent>
          </Card>
        </div>

        {/* Milestones List */}
        <Card className="zyphex-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 zyphex-heading">
              <Flag className="h-5 w-5" />
              All Milestones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {milestones.map((milestone) => (
                <div key={milestone.id} className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold zyphex-heading">{milestone.title}</h3>
                        <Badge variant={
                          milestone.status === 'completed' ? 'default' :
                          milestone.status === 'in_progress' ? 'secondary' :
                          'outline'
                        }>
                          {milestone.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm zyphex-subheading mb-2">{milestone.description}</p>
                      <div className="flex items-center gap-4 text-sm zyphex-subheading">
                        <div className="flex items-center gap-1">
                          <Target className="h-4 w-4" />
                          <span>{milestone.project}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(milestone.dueDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm font-medium zyphex-heading">{milestone.progress}%</p>
                      <div className="w-20 h-2 bg-slate-700 rounded-full mt-1">
                        <div 
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${milestone.progress}%` }}
                        />
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
            <CardTitle className="zyphex-heading">Milestone Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button className="zyphex-button h-auto p-4 flex-col gap-2" asChild>
                <Link href="/project-manager/projects">
                  <Target className="h-6 w-6" />
                  <span>View Projects</span>
                </Link>
              </Button>
              <Button className="zyphex-button h-auto p-4 flex-col gap-2" asChild>
                <Link href="/project-manager/planning">
                  <Calendar className="h-6 w-6" />
                  <span>Project Planning</span>
                </Link>
              </Button>
              <Button className="zyphex-button h-auto p-4 flex-col gap-2" asChild>
                <Link href="/project-manager/reports">
                  <Flag className="h-6 w-6" />
                  <span>Milestone Reports</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function Milestones() {
  return (
    <PermissionGuard 
      permission={Permission.VIEW_PROJECTS}
      fallback={
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
          <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You don&apos;t have permission to view project milestones.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      }
    >
      <MilestonesContent />
    </PermissionGuard>
  )
}