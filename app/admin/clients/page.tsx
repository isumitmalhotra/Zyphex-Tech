"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Mail,
  Phone,
  Building,
  MapPin,
  Calendar,
  Eye,
  Edit,
  MessageSquare,
} from "lucide-react"
import { SubtleBackground } from "@/components/subtle-background"

export default function ClientsPage() {
  const clients = [
    {
      id: "CLT-001",
      name: "TechStart Inc.",
      contact: "Sarah Johnson",
      email: "sarah@techstart.com",
      phone: "+1 (555) 123-4567",
      company: "TechStart Inc.",
      location: "San Francisco, CA",
      status: "Active",
      type: "Enterprise",
      joinDate: "Jan 15, 2024",
      totalProjects: 5,
      activeProjects: 2,
      totalValue: "$125,000",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: "CLT-002",
      name: "RetailMax",
      contact: "Michael Chen",
      email: "m.chen@retailmax.com",
      phone: "+1 (555) 234-5678",
      company: "RetailMax",
      location: "New York, NY",
      status: "Active",
      type: "SMB",
      joinDate: "Mar 22, 2024",
      totalProjects: 3,
      activeProjects: 1,
      totalValue: "$78,000",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: "CLT-003",
      name: "DataFlow Solutions",
      contact: "Emily Rodriguez",
      email: "emily@dataflow.com",
      phone: "+1 (555) 345-6789",
      company: "DataFlow Solutions",
      location: "Austin, TX",
      status: "Active",
      type: "Enterprise",
      joinDate: "Feb 8, 2024",
      totalProjects: 4,
      activeProjects: 2,
      totalValue: "$156,000",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: "CLT-004",
      name: "FinanceHub",
      contact: "David Wilson",
      email: "david@financehub.com",
      phone: "+1 (555) 456-7890",
      company: "FinanceHub",
      location: "Chicago, IL",
      status: "Completed",
      type: "SMB",
      joinDate: "Sep 12, 2024",
      totalProjects: 2,
      activeProjects: 0,
      totalValue: "$45,000",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: "CLT-005",
      name: "SecureBank",
      contact: "Lisa Thompson",
      email: "lisa@securebank.com",
      phone: "+1 (555) 567-8901",
      company: "SecureBank",
      location: "Boston, MA",
      status: "Lead",
      type: "Enterprise",
      joinDate: "Nov 30, 2024",
      totalProjects: 0,
      activeProjects: 0,
      totalValue: "$0",
      avatar: "/placeholder.svg?height=40&width=40",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "Lead":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "Completed":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
      case "Inactive":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Enterprise":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30"
      case "SMB":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
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
              <BreadcrumbItem>
                <BreadcrumbPage className="zyphex-heading">Clients</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold zyphex-heading">Client Management</h1>
            <p className="zyphex-subheading">Manage your client relationships and track project history.</p>
          </div>
          <Button className="zyphex-button-primary hover-zyphex-lift">
            <Plus className="mr-2 h-4 w-4" />
            Add Client
          </Button>
        </div>

        {/* Filters and Search */}
        <Card className="zyphex-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search clients..."
                  className="pl-10 zyphex-glass-effect border-gray-600 focus:border-blue-400"
                />
              </div>
              <Button variant="outline" size="sm" className="zyphex-button-secondary bg-transparent">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Clients Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <Card key={client.id} className="zyphex-card hover-zyphex-lift">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12 zyphex-blue-glow">
                      <AvatarImage src={client.avatar || "/placeholder.svg"} alt={client.name} />
                      <AvatarFallback className="zyphex-gradient-primary">
                        {client.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg zyphex-heading">{client.name}</CardTitle>
                      <CardDescription className="zyphex-subheading">{client.contact}</CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0 hover-zyphex-glow">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="zyphex-glass-effect border-gray-800/50">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem className="hover-zyphex-glow">
                        <Eye className="mr-2 h-4 w-4" />
                        View Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem className="hover-zyphex-glow">
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Client
                      </DropdownMenuItem>
                      <DropdownMenuItem className="hover-zyphex-glow">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Send Message
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge className={`${getStatusColor(client.status)} border`}>{client.status}</Badge>
                  <Badge className={`${getTypeColor(client.type)} border`}>{client.type}</Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm zyphex-subheading">
                    <Mail className="h-4 w-4" />
                    <span>{client.email}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm zyphex-subheading">
                    <Phone className="h-4 w-4" />
                    <span>{client.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm zyphex-subheading">
                    <Building className="h-4 w-4" />
                    <span>{client.company}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm zyphex-subheading">
                    <MapPin className="h-4 w-4" />
                    <span>{client.location}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm zyphex-subheading">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {client.joinDate}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-700">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold zyphex-heading">{client.totalProjects}</div>
                      <div className="text-xs zyphex-subheading">Total Projects</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold zyphex-heading">{client.activeProjects}</div>
                      <div className="text-xs zyphex-subheading">Active Projects</div>
                    </div>
                  </div>
                  <div className="mt-3 text-center">
                    <div className="text-lg font-bold zyphex-accent-text">{client.totalValue}</div>
                    <div className="text-xs zyphex-subheading">Total Value</div>
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
