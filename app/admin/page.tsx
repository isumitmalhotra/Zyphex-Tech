"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
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
} from "lucide-react"
import { SubtleBackground } from "@/components/subtle-background"
import { Icon3D } from "@/components/3d-icons"

export default function AdminDashboard() {
  const stats = [
    {
      title: "Total Revenue",
      value: "$124,500",
      change: "+12.5%",
      trend: "up",
      icon: "DollarSign",
      description: "From last month",
    },
    {
      title: "Active Projects",
      value: "23",
      change: "+3",
      trend: "up",
      icon: "Briefcase",
      description: "Currently in progress",
    },
    {
      title: "Total Clients",
      value: "156",
      change: "+8",
      trend: "up",
      icon: "Users",
      description: "Active client base",
    },
    {
      title: "Completion Rate",
      value: "94.2%",
      change: "-2.1%",
      trend: "down",
      icon: "BarChart3",
      description: "Project success rate",
    },
  ]

  const recentProjects = [
    {
      name: "E-commerce Platform",
      client: "TechStart Inc.",
      status: "In Progress",
      progress: 75,
      dueDate: "Dec 30, 2024",
      priority: "High",
    },
    {
      name: "Mobile App Development",
      client: "RetailMax",
      status: "Review",
      progress: 90,
      dueDate: "Jan 15, 2025",
      priority: "Medium",
    },
    {
      name: "Cloud Migration",
      client: "DataFlow Solutions",
      status: "Planning",
      progress: 25,
      dueDate: "Feb 28, 2025",
      priority: "High",
    },
    {
      name: "Analytics Dashboard",
      client: "FinanceHub",
      status: "Completed",
      progress: 100,
      dueDate: "Dec 15, 2024",
      priority: "Low",
    },
  ]

  const recentActivities = [
    {
      action: "New project proposal submitted",
      client: "TechVision Corp",
      time: "2 hours ago",
      type: "proposal",
    },
    {
      action: "Payment received",
      client: "RetailMax",
      time: "4 hours ago",
      type: "payment",
    },
    {
      action: "Project milestone completed",
      client: "DataFlow Solutions",
      time: "6 hours ago",
      type: "milestone",
    },
    {
      action: "New client onboarded",
      client: "StartupXYZ",
      time: "1 day ago",
      type: "client",
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
                        <Badge
                          variant={
                            project.priority === "High"
                              ? "destructive"
                              : project.priority === "Medium"
                                ? "default"
                                : "secondary"
                          }
                          className="text-xs"
                        >
                          {project.priority}
                        </Badge>
                      </div>
                      <p className="text-sm zyphex-subheading">{project.client}</p>
                      <div className="flex items-center space-x-4 text-xs zyphex-subheading">
                        <span className="flex items-center">
                          <Calendar className="mr-1 h-3 w-3" />
                          {project.dueDate}
                        </span>
                        <span>{project.progress}% complete</span>
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
                      <p className="text-xs zyphex-subheading">{activity.client}</p>
                      <p className="text-xs zyphex-subheading flex items-center">
                        <Clock className="mr-1 h-3 w-3" />
                        {activity.time}
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
      </div>
    </div>
  )
}
