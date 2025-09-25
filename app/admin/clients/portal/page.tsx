"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CalendarDays, DollarSign, FileText, MessageSquare, Eye, Download, Settings, Users } from "lucide-react"
import { SubtleBackground } from "@/components/subtle-background"

export default function ClientPortalPage() {
  const portalClients = [
    {
      id: 1,
      name: "TechCorp Solutions",
      company: "TechCorp Solutions Inc.",
      avatar: "/placeholder-user.jpg",
      portalAccess: true,
      lastLogin: "2024-01-20",
      totalProjects: 3,
      activeProjects: 2,
      unreadMessages: 3,
      documents: 12,
      contactPerson: "Sarah Johnson",
      email: "sarah.johnson@techcorp.com",
      status: "Active",
    },
    {
      id: 2,
      name: "StartupXYZ",
      company: "StartupXYZ LLC",
      avatar: "/placeholder-user.jpg",
      portalAccess: true,
      lastLogin: "2024-01-18",
      totalProjects: 2,
      activeProjects: 1,
      unreadMessages: 0,
      documents: 8,
      contactPerson: "Mike Chen",
      email: "mike.chen@startupxyz.com",
      status: "Active",
    },
    {
      id: 3,
      name: "FashionForward",
      company: "FashionForward Retail",
      avatar: "/placeholder-user.jpg",
      portalAccess: false,
      lastLogin: null,
      totalProjects: 1,
      activeProjects: 1,
      unreadMessages: 0,
      documents: 5,
      contactPerson: "Emma Davis",
      email: "emma.davis@fashionforward.com",
      status: "Pending Invitation",
    },
    {
      id: 4,
      name: "DataFlow Inc",
      company: "DataFlow Inc",
      avatar: "/placeholder-user.jpg",
      portalAccess: true,
      lastLogin: "2024-01-15",
      totalProjects: 1,
      activeProjects: 1,
      unreadMessages: 1,
      documents: 6,
      contactPerson: "Alex Rodriguez",
      email: "alex.rodriguez@dataflow.com",
      status: "Active",
    },
  ]

  const recentActivity = [
    {
      id: 1,
      client: "TechCorp Solutions",
      action: "Downloaded project files",
      timestamp: "2024-01-20 14:30",
      type: "download",
    },
    {
      id: 2,
      client: "StartupXYZ",
      action: "Sent message to project team",
      timestamp: "2024-01-19 11:15",
      type: "message",
    },
    {
      id: 3,
      client: "DataFlow Inc",
      action: "Viewed project timeline",
      timestamp: "2024-01-18 16:45",
      type: "view",
    },
    {
      id: 4,
      client: "TechCorp Solutions",
      action: "Updated project requirements",
      timestamp: "2024-01-17 09:20",
      type: "update",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "text-green-600 border-green-600"
      case "Pending Invitation":
        return "text-yellow-600 border-yellow-600"
      case "Inactive":
        return "text-gray-600 border-gray-600"
      default:
        return "text-blue-600 border-blue-600"
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "download":
        return <Download className="h-4 w-4 text-blue-400" />
      case "message":
        return <MessageSquare className="h-4 w-4 text-green-400" />
      case "view":
        return <Eye className="h-4 w-4 text-purple-400" />
      case "update":
        return <Settings className="h-4 w-4 text-orange-400" />
      default:
        return <FileText className="h-4 w-4 text-gray-400" />
    }
  }

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
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/admin/clients" className="zyphex-subheading hover:text-white">
                  Clients
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage className="zyphex-heading">Portal</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold zyphex-heading">Client Portal</h1>
              <p className="text-lg zyphex-subheading">Manage client access and monitor portal activity</p>
            </div>
            <Button className="zyphex-button-primary hover-zyphex-lift">
              <Settings className="mr-2 h-4 w-4" />
              Portal Settings
            </Button>
          </div>
        </div>

        {/* Portal Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Active Users</CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">3</div>
              <p className="text-xs zyphex-subheading">clients with access</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Pending Invites</CardTitle>
              <FileText className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">1</div>
              <p className="text-xs zyphex-subheading">awaiting acceptance</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Total Documents</CardTitle>
              <FileText className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">31</div>
              <p className="text-xs zyphex-subheading">shared with clients</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Unread Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">4</div>
              <p className="text-xs zyphex-subheading">from clients</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Client Portal Access */}
          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader>
              <CardTitle className="zyphex-heading">Client Portal Access</CardTitle>
              <CardDescription className="zyphex-subheading">
                Manage which clients have access to the portal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {portalClients.map((client) => (
                  <div key={client.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={client.avatar} alt={client.name} />
                        <AvatarFallback>{client.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium zyphex-heading">{client.company}</p>
                        <p className="text-sm zyphex-subheading">{client.contactPerson}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className={getStatusColor(client.status)}>
                            {client.status}
                          </Badge>
                          {client.unreadMessages > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {client.unreadMessages} new
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-right text-sm">
                        <p className="zyphex-subheading">Last login</p>
                        <p className="zyphex-subheading">{client.lastLogin || 'Never'}</p>
                      </div>
                      <Button variant="outline" size="sm" className="zyphex-button-secondary hover-zyphex-glow">
                        {client.portalAccess ? 'Manage' : 'Invite'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader>
              <CardTitle className="zyphex-heading">Recent Activity</CardTitle>
              <CardDescription className="zyphex-subheading">
                Latest client interactions in the portal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-4 p-3 bg-slate-800/50 rounded-lg">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium zyphex-heading text-sm">{activity.client}</p>
                      <p className="text-sm zyphex-subheading">{activity.action}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs zyphex-subheading">{activity.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Portal Features */}
        <Card className="zyphex-card hover-zyphex-lift">
          <CardHeader>
            <CardTitle className="zyphex-heading">Portal Features</CardTitle>
            <CardDescription className="zyphex-subheading">
              Overview of features available to clients
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-800/50 rounded-lg text-center">
                <FileText className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                <h3 className="font-medium zyphex-heading mb-1">Project Documents</h3>
                <p className="text-sm zyphex-subheading">Access to all project files and deliverables</p>
              </div>
              <div className="p-4 bg-slate-800/50 rounded-lg text-center">
                <MessageSquare className="h-8 w-8 text-green-400 mx-auto mb-2" />
                <h3 className="font-medium zyphex-heading mb-1">Direct Communication</h3>
                <p className="text-sm zyphex-subheading">Secure messaging with project teams</p>
              </div>
              <div className="p-4 bg-slate-800/50 rounded-lg text-center">
                <CalendarDays className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                <h3 className="font-medium zyphex-heading mb-1">Project Timeline</h3>
                <p className="text-sm zyphex-subheading">Real-time project progress tracking</p>
              </div>
              <div className="p-4 bg-slate-800/50 rounded-lg text-center">
                <DollarSign className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                <h3 className="font-medium zyphex-heading mb-1">Invoice Management</h3>
                <p className="text-sm zyphex-subheading">View and download invoices and receipts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
