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
  MapPin,
  Calendar,
  Eye,
  Edit,
  MessageSquare,
  Star,
} from "lucide-react"
import { SubtleBackground } from "@/components/subtle-background"

export default function TeamPage() {
  const teamMembers = [
    {
      id: "TM-001",
      name: "John Doe",
      role: "Senior Full-Stack Developer",
      department: "Development",
      email: "john.doe@zyphextech.com",
      phone: "+1 (555) 123-4567",
      location: "San Francisco, CA",
      status: "Active",
      joinDate: "Jan 15, 2023",
      projects: 8,
      skills: ["React", "Node.js", "TypeScript", "AWS"],
      rating: 4.9,
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: "TM-002",
      name: "Sarah Mitchell",
      role: "UI/UX Designer",
      department: "Design",
      email: "sarah.mitchell@zyphextech.com",
      phone: "+1 (555) 234-5678",
      location: "New York, NY",
      status: "Active",
      joinDate: "Mar 22, 2023",
      projects: 12,
      skills: ["Figma", "Adobe XD", "Prototyping", "User Research"],
      rating: 4.8,
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: "TM-003",
      name: "Mike Rodriguez",
      role: "DevOps Engineer",
      department: "Infrastructure",
      email: "mike.rodriguez@zyphextech.com",
      phone: "+1 (555) 345-6789",
      location: "Austin, TX",
      status: "Active",
      joinDate: "Feb 8, 2023",
      projects: 6,
      skills: ["Docker", "Kubernetes", "AWS", "Terraform"],
      rating: 4.7,
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: "TM-004",
      name: "Emily Chen",
      role: "Project Manager",
      department: "Management",
      email: "emily.chen@zyphextech.com",
      phone: "+1 (555) 456-7890",
      location: "Seattle, WA",
      status: "Active",
      joinDate: "Sep 12, 2022",
      projects: 15,
      skills: ["Agile", "Scrum", "Jira", "Team Leadership"],
      rating: 4.9,
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: "TM-005",
      name: "David Wilson",
      role: "Mobile Developer",
      department: "Development",
      email: "david.wilson@zyphextech.com",
      phone: "+1 (555) 567-8901",
      location: "Remote",
      status: "On Leave",
      joinDate: "Nov 30, 2023",
      projects: 4,
      skills: ["React Native", "Flutter", "iOS", "Android"],
      rating: 4.6,
      avatar: "/placeholder.svg?height=40&width=40",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "On Leave":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "Inactive":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const getDepartmentColor = (department: string) => {
    switch (department) {
      case "Development":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "Design":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30"
      case "Infrastructure":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30"
      case "Management":
        return "bg-green-500/20 text-green-400 border-green-500/30"
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
                <BreadcrumbPage className="zyphex-heading">Team</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold zyphex-heading">Team Management</h1>
            <p className="zyphex-subheading">Manage your team members, roles, and performance.</p>
          </div>
          <Button className="zyphex-button-primary hover-zyphex-lift">
            <Plus className="mr-2 h-4 w-4" />
            Add Team Member
          </Button>
        </div>

        {/* Filters and Search */}
        <Card className="zyphex-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search team members..."
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

        {/* Team Members Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {teamMembers.map((member) => (
            <Card key={member.id} className="zyphex-card hover-zyphex-lift">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12 zyphex-blue-glow">
                      <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.name} />
                      <AvatarFallback className="zyphex-gradient-primary">
                        {member.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg zyphex-heading">{member.name}</CardTitle>
                      <CardDescription className="zyphex-subheading">{member.role}</CardDescription>
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
                        Edit Member
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
                  <Badge className={`${getStatusColor(member.status)} border`}>{member.status}</Badge>
                  <Badge className={`${getDepartmentColor(member.department)} border`}>{member.department}</Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm zyphex-subheading">
                    <Mail className="h-4 w-4" />
                    <span>{member.email}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm zyphex-subheading">
                    <Phone className="h-4 w-4" />
                    <span>{member.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm zyphex-subheading">
                    <MapPin className="h-4 w-4" />
                    <span>{member.location}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm zyphex-subheading">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {member.joinDate}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium zyphex-heading">Rating</span>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm zyphex-accent-text">{member.rating}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium zyphex-heading">Projects</span>
                    <span className="text-sm zyphex-accent-text">{member.projects}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-700">
                  <div className="space-y-2">
                    <span className="text-sm font-medium zyphex-heading">Skills</span>
                    <div className="flex flex-wrap gap-1">
                      {member.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
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
