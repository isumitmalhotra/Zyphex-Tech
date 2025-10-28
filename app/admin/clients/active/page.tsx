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
import { UserAvatar } from "@/components/ui/user-avatar"
import { CalendarDays, DollarSign, Phone, Mail, MapPin, Users, TrendingUp, Filter, Plus } from "lucide-react"
import { SubtleBackground } from "@/components/subtle-background"

export default function ActiveClientsPage() {
  const activeClients = [
    {
      id: 1,
      name: "TechCorp Solutions",
      company: "TechCorp Solutions Inc.",
      avatar: "",
      status: "Active",
      totalProjects: 3,
      totalRevenue: 125000,
      lastContact: "2024-01-20",
      nextMeeting: "2024-02-05",
      contactPerson: "Sarah Johnson",
      email: "sarah.johnson@techcorp.com",
      phone: "+1 (555) 123-4567",
      location: "San Francisco, CA",
      currentProjects: [
        { name: "E-Commerce Platform Redesign", status: "In Progress", value: 45000 },
        { name: "Mobile App Development", status: "Planning", value: 35000 },
      ],
      satisfaction: 95,
    },
    {
      id: 2,
      name: "StartupXYZ",
      company: "StartupXYZ LLC",
      avatar: "",
      status: "Active",
      totalProjects: 2,
      totalRevenue: 65000,
      lastContact: "2024-01-18",
      nextMeeting: "2024-02-10",
      contactPerson: "Mike Chen",
      email: "mike.chen@startupxyz.com",
      phone: "+1 (555) 234-5678",
      location: "Austin, TX",
      currentProjects: [
        { name: "Mobile App Development", status: "In Progress", value: 35000 },
      ],
      satisfaction: 88,
    },
    {
      id: 3,
      name: "FashionForward",
      company: "FashionForward Retail",
      avatar: "",
      status: "Active",
      totalProjects: 1,
      totalRevenue: 15000,
      lastContact: "2024-01-15",
      nextMeeting: "2024-01-30",
      contactPerson: "Emma Davis",
      email: "emma.davis@fashionforward.com",
      phone: "+1 (555) 345-6789",
      location: "New York, NY",
      currentProjects: [
        { name: "Brand Identity Design", status: "Review", value: 15000 },
      ],
      satisfaction: 92,
    },
    {
      id: 4,
      name: "DataFlow Inc",
      company: "DataFlow Inc",
      avatar: "",
      status: "Active",
      totalProjects: 1,
      totalRevenue: 28000,
      lastContact: "2024-01-12",
      nextMeeting: "2024-02-15",
      contactPerson: "Alex Rodriguez",
      email: "alex.rodriguez@dataflow.com",
      phone: "+1 (555) 456-7890",
      location: "Seattle, WA",
      currentProjects: [
        { name: "API Integration Service", status: "In Progress", value: 28000 },
      ],
      satisfaction: 90,
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "text-green-600 border-green-600"
      case "Inactive":
        return "text-gray-600 border-gray-600"
      default:
        return "text-blue-600 border-blue-600"
    }
  }

  const getSatisfactionColor = (satisfaction: number) => {
    if (satisfaction >= 90) return "text-green-600"
    if (satisfaction >= 80) return "text-yellow-600"
    return "text-red-600"
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
                <BreadcrumbPage className="zyphex-heading">Active</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold zyphex-heading">Active Clients</h1>
              <p className="text-lg zyphex-subheading">Manage your current client relationships</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" className="zyphex-button-secondary hover-zyphex-glow">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
              <Button className="zyphex-button-primary hover-zyphex-lift">
                <Plus className="mr-2 h-4 w-4" />
                Add Client
              </Button>
            </div>
          </div>
        </div>

        {/* Client Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Total Active</CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">4</div>
              <p className="text-xs zyphex-subheading">active clients</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">$235,000</div>
              <p className="text-xs zyphex-subheading">from active clients</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Avg. Satisfaction</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">91%</div>
              <p className="text-xs zyphex-subheading">client satisfaction</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Active Projects</CardTitle>
              <CalendarDays className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">5</div>
              <p className="text-xs zyphex-subheading">ongoing projects</p>
            </CardContent>
          </Card>
        </div>

        {/* Active Clients List */}
        <div className="space-y-6">
          {activeClients.map((client) => (
            <Card key={client.id} className="zyphex-card hover-zyphex-lift">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <UserAvatar 
                      name={client.name} 
                      imageUrl={client.avatar}
                      size="lg"
                      alt={`${client.name} from ${client.company}`}
                    />
                    <div>
                      <CardTitle className="zyphex-heading">{client.company}</CardTitle>
                      <CardDescription className="zyphex-subheading">{client.contactPerson}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className={getStatusColor(client.status)}>
                      {client.status}
                    </Badge>
                    <Badge variant="secondary" className={getSatisfactionColor(client.satisfaction)}>
                      {client.satisfaction}% satisfied
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Client Details */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-blue-400" />
                      <div>
                        <p className="text-sm font-medium zyphex-heading">Email</p>
                        <p className="text-xs zyphex-subheading">{client.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-blue-400" />
                      <div>
                        <p className="text-sm font-medium zyphex-heading">Phone</p>
                        <p className="text-xs zyphex-subheading">{client.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-blue-400" />
                      <div>
                        <p className="text-sm font-medium zyphex-heading">Location</p>
                        <p className="text-xs zyphex-subheading">{client.location}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CalendarDays className="h-4 w-4 text-blue-400" />
                      <div>
                        <p className="text-sm font-medium zyphex-heading">Last Contact</p>
                        <p className="text-xs zyphex-subheading">{client.lastContact}</p>
                      </div>
                    </div>
                  </div>

                  {/* Client Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-800/50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium zyphex-heading">Total Projects</p>
                          <p className="text-2xl font-bold zyphex-heading">{client.totalProjects}</p>
                        </div>
                        <Users className="h-8 w-8 text-blue-400" />
                      </div>
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium zyphex-heading">Total Revenue</p>
                          <p className="text-2xl font-bold zyphex-heading">${client.totalRevenue.toLocaleString()}</p>
                        </div>
                        <DollarSign className="h-8 w-8 text-green-400" />
                      </div>
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium zyphex-heading">Next Meeting</p>
                          <p className="text-sm zyphex-subheading">{client.nextMeeting}</p>
                        </div>
                        <CalendarDays className="h-8 w-8 text-yellow-400" />
                      </div>
                    </div>
                  </div>

                  {/* Current Projects */}
                  <div>
                    <p className="text-sm font-medium zyphex-heading mb-2">Current Projects</p>
                    <div className="space-y-2">
                      {client.currentProjects.map((project, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                          <div>
                            <p className="font-medium zyphex-heading text-sm">{project.name}</p>
                            <p className="text-xs zyphex-subheading">{project.status}</p>
                          </div>
                          <Badge variant="secondary" className="text-green-600">
                            ${project.value.toLocaleString()}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" className="zyphex-button-secondary hover-zyphex-glow">
                        View Profile
                      </Button>
                      <Button variant="outline" size="sm" className="zyphex-button-secondary hover-zyphex-glow">
                        <Mail className="mr-2 h-4 w-4" />
                        Send Message
                      </Button>
                      <Button variant="outline" size="sm" className="zyphex-button-secondary hover-zyphex-glow">
                        <Phone className="mr-2 h-4 w-4" />
                        Call
                      </Button>
                    </div>
                    <Button variant="outline" size="sm" className="zyphex-button-secondary hover-zyphex-glow">
                      Schedule Meeting
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
