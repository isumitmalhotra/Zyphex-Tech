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
import { Code, Users, Star, TrendingUp, Filter, Plus, Mail, Phone } from "lucide-react"
import { SubtleBackground } from "@/components/subtle-background"

export default function DevelopersPage() {
  const developers = [
    {
      id: 1,
      name: "Alice Johnson",
      avatar: "",
      role: "Senior Full-Stack Developer",
      specialization: "React, Node.js, TypeScript",
      experience: "8 years",
      currentProjects: 2,
      completedProjects: 15,
      rating: 4.9,
      status: "Active",
      skills: ["React", "Node.js", "TypeScript", "PostgreSQL", "AWS"],
      availability: "Available",
      hourlyRate: 85,
      location: "San Francisco, CA",
      email: "alice.johnson@zyphex.com",
      phone: "+1 (555) 123-4567",
    },
    {
      id: 2,
      name: "Bob Smith",
      avatar: "",
      role: "Frontend Developer",
      specialization: "React, Vue.js, UI/UX",
      experience: "6 years",
      currentProjects: 1,
      completedProjects: 12,
      rating: 4.7,
      status: "Active",
      skills: ["React", "Vue.js", "JavaScript", "CSS", "Figma"],
      availability: "Available",
      hourlyRate: 70,
      location: "Austin, TX",
      email: "bob.smith@zyphex.com",
      phone: "+1 (555) 234-5678",
    },
    {
      id: 3,
      name: "Carol Davis",
      avatar: "",
      role: "UI/UX Designer",
      specialization: "User Experience, Interface Design",
      experience: "7 years",
      currentProjects: 3,
      completedProjects: 18,
      rating: 4.8,
      status: "Active",
      skills: ["Figma", "Sketch", "Adobe XD", "Prototyping", "User Research"],
      availability: "Limited",
      hourlyRate: 75,
      location: "New York, NY",
      email: "carol.davis@zyphex.com",
      phone: "+1 (555) 345-6789",
    },
    {
      id: 4,
      name: "David Wilson",
      avatar: "",
      role: "Mobile Developer",
      specialization: "React Native, iOS, Android",
      experience: "5 years",
      currentProjects: 1,
      completedProjects: 8,
      rating: 4.6,
      status: "Active",
      skills: ["React Native", "iOS", "Android", "JavaScript", "Firebase"],
      availability: "Available",
      hourlyRate: 65,
      location: "Seattle, WA",
      email: "david.wilson@zyphex.com",
      phone: "+1 (555) 456-7890",
    },
    {
      id: 5,
      name: "Eva Brown",
      avatar: "",
      role: "QA Engineer",
      specialization: "Quality Assurance, Testing",
      experience: "4 years",
      currentProjects: 2,
      completedProjects: 10,
      rating: 4.5,
      status: "Active",
      skills: ["Selenium", "Jest", "Cypress", "API Testing", "Manual Testing"],
      availability: "Available",
      hourlyRate: 55,
      location: "Denver, CO",
      email: "eva.brown@zyphex.com",
      phone: "+1 (555) 567-8901",
    },
    {
      id: 6,
      name: "Frank Miller",
      avatar: "",
      role: "Creative Director",
      specialization: "Brand Strategy, Creative Direction",
      experience: "10 years",
      currentProjects: 1,
      completedProjects: 25,
      rating: 4.9,
      status: "Active",
      skills: ["Brand Strategy", "Creative Direction", "Art Direction", "Marketing"],
      availability: "Limited",
      hourlyRate: 95,
      location: "Los Angeles, CA",
      email: "frank.miller@zyphex.com",
      phone: "+1 (555) 678-9012",
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

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case "Available":
        return "text-green-600 bg-green-100"
      case "Limited":
        return "text-yellow-600 bg-yellow-100"
      case "Unavailable":
        return "text-red-600 bg-red-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ))
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
                <BreadcrumbLink href="/admin/team" className="zyphex-subheading hover:text-white">
                  Team
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage className="zyphex-heading">Developers</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold zyphex-heading">Development Team</h1>
              <p className="text-lg zyphex-subheading">Manage your development and design team members</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" className="zyphex-button-secondary hover-zyphex-glow">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
              <Button className="zyphex-button-primary hover-zyphex-lift">
                <Plus className="mr-2 h-4 w-4" />
                Add Developer
              </Button>
            </div>
          </div>
        </div>

        {/* Team Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Total Developers</CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">6</div>
              <p className="text-xs zyphex-subheading">active team members</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Avg. Rating</CardTitle>
              <Star className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">4.7</div>
              <p className="text-xs zyphex-subheading">out of 5 stars</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Active Projects</CardTitle>
              <Code className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">10</div>
              <p className="text-xs zyphex-subheading">currently assigned</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Avg. Hourly Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">$74</div>
              <p className="text-xs zyphex-subheading">per hour</p>
            </CardContent>
          </Card>
        </div>

        {/* Developers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {developers.map((developer) => (
            <Card key={developer.id} className="zyphex-card hover-zyphex-lift">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={developer.avatar} alt={developer.name} />
                    <AvatarFallback>{developer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="zyphex-heading">{developer.name}</CardTitle>
                    <CardDescription className="zyphex-subheading">{developer.role}</CardDescription>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant="outline" className={getStatusColor(developer.status)}>
                        {developer.status}
                      </Badge>
                      <Badge variant="secondary" className={getAvailabilityColor(developer.availability)}>
                        {developer.availability}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Developer Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                      <p className="text-2xl font-bold zyphex-heading">{developer.currentProjects}</p>
                      <p className="text-xs zyphex-subheading">Active Projects</p>
                    </div>
                    <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                      <p className="text-2xl font-bold zyphex-heading">{developer.completedProjects}</p>
                      <p className="text-xs zyphex-subheading">Completed</p>
                    </div>
                  </div>

                  {/* Rating and Experience */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      {renderStars(developer.rating)}
                      <span className="text-sm zyphex-subheading ml-2">({developer.rating})</span>
                    </div>
                    <Badge variant="outline" className="text-blue-600 border-blue-600">
                      {developer.experience}
                    </Badge>
                  </div>

                  {/* Skills */}
                  <div>
                    <p className="text-sm font-medium zyphex-heading mb-2">Top Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {developer.skills.slice(0, 3).map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {developer.skills.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{developer.skills.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <Mail className="h-4 w-4 text-blue-400" />
                      <span className="zyphex-subheading">{developer.email}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Phone className="h-4 w-4 text-blue-400" />
                      <span className="zyphex-subheading">{developer.phone}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" className="flex-1 zyphex-button-secondary hover-zyphex-glow">
                      View Profile
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 zyphex-button-secondary hover-zyphex-glow">
                      Assign Project
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
