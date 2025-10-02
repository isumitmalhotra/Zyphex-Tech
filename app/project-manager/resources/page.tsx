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
  Clock,
  Target,
  AlertTriangle,
  RefreshCw,
  Plus,
  UserPlus,
  Calendar,
  BarChart3,
} from "lucide-react"
import { SubtleBackground } from "@/components/subtle-background"
import Link from "next/link"

const resources = [
  {
    id: 1,
    name: "John Smith",
    role: "Frontend Developer",
    allocation: 80,
    projects: ["E-commerce Platform", "Mobile App"],
    skills: ["React", "TypeScript", "CSS"],
    availability: "Available",
  },
  {
    id: 2,
    name: "Sarah Johnson",
    role: "Backend Developer",
    allocation: 90,
    projects: ["E-commerce Platform"],
    skills: ["Node.js", "PostgreSQL", "Python"],
    availability: "Busy",
  },
  {
    id: 3,
    name: "Mike Davis",
    role: "UI/UX Designer",
    allocation: 60,
    projects: ["Website Redesign"],
    skills: ["Figma", "Adobe XD", "Design Systems"],
    availability: "Available",
  },
]

function ResourceAllocationContent() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
      <SubtleBackground />
      <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold zyphex-heading">Resource Allocation</h1>
            <p className="zyphex-subheading">Manage team resources and project assignments</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="zyphex-button">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button size="sm" className="zyphex-button">
              <UserPlus className="h-4 w-4 mr-2" />
              Assign Resource
            </Button>
          </div>
        </div>

        {/* Resource Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Total Resources</CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">{resources.length}</div>
              <p className="text-xs zyphex-subheading">Active team members</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Available</CardTitle>
              <Target className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">
                {resources.filter(r => r.availability === 'Available').length}
              </div>
              <p className="text-xs zyphex-subheading">Ready for assignment</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Avg. Allocation</CardTitle>
              <BarChart3 className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">
                {Math.round(resources.reduce((acc, r) => acc + r.allocation, 0) / resources.length)}%
              </div>
              <p className="text-xs zyphex-subheading">Team utilization</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Active Projects</CardTitle>
              <Clock className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">
                {new Set(resources.flatMap(r => r.projects)).size}
              </div>
              <p className="text-xs zyphex-subheading">With assigned resources</p>
            </CardContent>
          </Card>
        </div>

        {/* Resource Allocation Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="zyphex-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 zyphex-heading">
                <BarChart3 className="h-5 w-5" />
                Resource Utilization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {resources.map((resource) => (
                <div key={resource.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium zyphex-heading">{resource.name}</span>
                    <span className="text-sm zyphex-subheading">{resource.allocation}%</span>
                  </div>
                  <Progress value={resource.allocation} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="zyphex-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 zyphex-heading">
                <Users className="h-5 w-5" />
                Team Availability
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {resources.map((resource) => (
                <div key={resource.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                      {resource.name[0]}
                    </div>
                    <div>
                      <p className="font-medium zyphex-heading">{resource.name}</p>
                      <p className="text-sm zyphex-subheading">{resource.role}</p>
                    </div>
                  </div>
                  <Badge variant={resource.availability === 'Available' ? 'default' : 'secondary'}>
                    {resource.availability}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Detailed Resource List */}
        <Card className="zyphex-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 zyphex-heading">
              <Users className="h-5 w-5" />
              Resource Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {resources.map((resource) => (
                <div key={resource.id} className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold zyphex-heading">{resource.name}</h3>
                        <Badge variant="outline">{resource.role}</Badge>
                        <Badge variant={resource.availability === 'Available' ? 'default' : 'secondary'}>
                          {resource.availability}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm font-medium zyphex-subheading mb-1">Projects</p>
                          <div className="flex flex-wrap gap-1">
                            {resource.projects.map((project, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {project}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium zyphex-subheading mb-1">Skills</p>
                          <div className="flex flex-wrap gap-1">
                            {resource.skills.map((skill, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium zyphex-subheading mb-1">Allocation</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-slate-700 rounded-full">
                              <div 
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${resource.allocation}%` }}
                              />
                            </div>
                            <span className="text-sm zyphex-heading">{resource.allocation}%</span>
                          </div>
                        </div>
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
            <CardTitle className="zyphex-heading">Resource Actions</CardTitle>
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
                <Link href="/project-manager/workload">
                  <Clock className="h-6 w-6" />
                  <span>Workload</span>
                </Link>
              </Button>
              <Button className="zyphex-button h-auto p-4 flex-col gap-2" asChild>
                <Link href="/project-manager/projects">
                  <Target className="h-6 w-6" />
                  <span>Projects</span>
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

export default function ResourceAllocation() {
  return (
    <PermissionGuard 
      permission={Permission.MANAGE_PROJECT_TEAM}
      fallback={
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
          <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You don&apos;t have permission to manage resource allocation.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      }
    >
      <ResourceAllocationContent />
    </PermissionGuard>
  )
}