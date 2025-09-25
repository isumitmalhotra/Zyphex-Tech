"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Briefcase,
  Calendar,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Plus,
  ArrowRight,
  Download,
  Bell,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { useUserDashboard } from "@/hooks/use-user-dashboard"
import { ProjectRequestForm } from "@/components/user/project-request-form"
import React from "react"



export default function UserDashboard() {
  const { dashboardData, loading, error } = useUserDashboard()



  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
          <span className="zyphex-subheading">Loading your dashboard...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="zyphex-card border-red-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-400">
              <AlertCircle className="h-6 w-6" />
              <div>
                <h3 className="font-semibold">Error loading dashboard</h3>
                <p className="text-sm zyphex-subheading">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!dashboardData) {
    return null
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold zyphex-heading">
              Welcome back, {dashboardData.user.name}!
            </h1>
            <p className="text-lg zyphex-subheading">
              Here&apos;s what&apos;s happening with your projects
            </p>
          </div>
          <ProjectRequestForm onSuccess={() => window.location.reload()} />
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="zyphex-card hover-zyphex-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium zyphex-subheading">Active Projects</CardTitle>
            <Briefcase className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold zyphex-heading">{dashboardData.stats.activeProjects}</div>
            <p className="text-xs zyphex-subheading">Currently in progress</p>
          </CardContent>
        </Card>

        <Card className="zyphex-card hover-zyphex-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium zyphex-subheading">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold zyphex-heading">{dashboardData.stats.completedProjects}</div>
            <p className="text-xs zyphex-subheading">Successfully delivered</p>
          </CardContent>
        </Card>

        <Card className="zyphex-card hover-zyphex-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium zyphex-subheading">Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold zyphex-heading">{dashboardData.stats.messages}</div>
            <p className="text-xs zyphex-subheading">Coming soon</p>
          </CardContent>
        </Card>

        <Card className="zyphex-card hover-zyphex-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium zyphex-subheading">Next Meeting</CardTitle>
            <Calendar className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold zyphex-heading">-</div>
            <p className="text-xs zyphex-subheading">No meetings scheduled</p>
          </CardContent>
        </Card>
      </div>

      {/* Current Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="zyphex-card">
          <CardHeader>
            <CardTitle className="zyphex-heading">Current Projects</CardTitle>
            <CardDescription className="zyphex-subheading">Your active development projects</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboardData.projects.length === 0 ? (
              <div className="text-center py-8">
                <Briefcase className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <h4 className="text-lg font-medium zyphex-heading mb-2">No Projects Yet</h4>
                <p className="zyphex-subheading mb-4">Start your first project with us!</p>
                <Button className="zyphex-button-primary" asChild>
                  <Link href="/contact">
                    <Plus className="mr-2 h-4 w-4" />
                    Request New Project
                  </Link>
                </Button>
              </div>
            ) : (
              dashboardData.projects.slice(0, 3).map((project, index) => (
                <div key={index} className="space-y-3 p-4 rounded-lg zyphex-card-bg">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium zyphex-heading">{project.name}</h4>
                    <Badge
                      variant="secondary"
                      className={`${
                        project.priority === "High"
                          ? "bg-red-500/20 text-red-400 border-red-500/30"
                          : project.priority === "Medium"
                            ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                            : "bg-green-500/20 text-green-400 border-green-500/30"
                      }`}
                    >
                      {project.priority}
                    </Badge>
                  </div>
                  {project.description && (
                    <p className="text-sm zyphex-subheading">{project.description}</p>
                  )}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="zyphex-subheading">Progress</span>
                      <span className="zyphex-accent-text">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="zyphex-subheading">
                      Client: {project.client}
                    </span>
                    <Badge 
                      variant="outline" 
                      className={`border-blue-500/30 text-blue-400 ${
                        project.status === 'COMPLETED' ? 'border-green-500/30 text-green-400' :
                        project.status === 'IN_PROGRESS' ? 'border-blue-500/30 text-blue-400' :
                        project.status === 'REVIEW' ? 'border-purple-500/30 text-purple-400' :
                        'border-gray-500/30 text-gray-400'
                      }`}
                    >
                      {project.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              ))
            )}
            <Button variant="outline" className="w-full zyphex-button-secondary bg-transparent" asChild>
              <Link href="/user/projects">
                View All Projects
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="zyphex-card">
          <CardHeader>
            <CardTitle className="zyphex-heading">Recent Activity</CardTitle>
            <CardDescription className="zyphex-subheading">Latest updates and notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboardData.recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <h4 className="text-lg font-medium zyphex-heading mb-2">No Recent Activity</h4>
                <p className="zyphex-subheading">Your activity will appear here once you start working on projects.</p>
              </div>
            ) : (
              dashboardData.recentActivity.map((activity, index) => {
                const IconComponent = activity.icon === 'MessageSquare' ? MessageSquare :
                                   activity.icon === 'CheckCircle' ? CheckCircle :
                                   activity.icon === 'Calendar' ? Calendar :
                                   activity.icon === 'Download' ? Download :
                                   activity.icon === 'AlertCircle' ? AlertCircle :
                                   Bell
                return (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-800/30 transition-colors">
                    <IconComponent className={`h-5 w-5 ${activity.color} mt-0.5`} />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium zyphex-heading">{activity.title}</p>
                      <p className="text-xs zyphex-subheading">{activity.time}</p>
                    </div>
                  </div>
                )
              })
            )}
            <Button variant="outline" className="w-full zyphex-button-secondary bg-transparent" asChild>
              <Link href="/user/notifications">
                View All Activity
                <Bell className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="zyphex-card">
        <CardHeader>
          <CardTitle className="zyphex-heading">Quick Actions</CardTitle>
          <CardDescription className="zyphex-subheading">Frequently used features and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col zyphex-button-secondary bg-transparent" asChild>
              <Link href="/user/messages">
                <MessageSquare className="h-6 w-6 mb-2" />
                Messages
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex-col zyphex-button-secondary bg-transparent" asChild>
              <Link href="/user/appointments">
                <Calendar className="h-6 w-6 mb-2" />
                Schedule Meeting
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex-col zyphex-button-secondary bg-transparent" asChild>
              <Link href="/user/documents">
                <Download className="h-6 w-6 mb-2" />
                Downloads
              </Link>
            </Button>
            <div className="h-20 flex items-center justify-center">
              <ProjectRequestForm onSuccess={() => window.location.reload()} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
