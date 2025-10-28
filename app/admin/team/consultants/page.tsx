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
import { Briefcase, Users, Star, TrendingUp, Filter, Plus, Mail, Phone, Award, GraduationCap } from "lucide-react"
import { SubtleBackground } from "@/components/subtle-background"

export default function ConsultantsPage() {
  const consultants = [
    {
      id: 1,
      name: "Dr. Sarah Mitchell",
      avatar: "",
      role: "Senior Technology Consultant",
      specialization: "Digital Transformation, Strategy",
      experience: "15 years",
      currentProjects: 1,
      completedProjects: 28,
      rating: 4.9,
      status: "Active",
      skills: ["Digital Strategy", "Technology Assessment", "Change Management", "Project Management"],
      availability: "Limited",
      hourlyRate: 150,
      location: "Boston, MA",
      email: "sarah.mitchell@zyphex.com",
      phone: "+1 (555) 890-1235",
      certifications: ["PMP", "CSM", "AWS Solutions Architect"],
      education: "PhD Computer Science, MIT",
    },
    {
      id: 2,
      name: "Michael Rodriguez",
      avatar: "",
      role: "Business Strategy Consultant",
      specialization: "Business Analysis, Process Optimization",
      experience: "12 years",
      currentProjects: 2,
      completedProjects: 22,
      rating: 4.8,
      status: "Active",
      skills: ["Business Analysis", "Process Mapping", "Requirements Gathering", "Stakeholder Management"],
      availability: "Available",
      hourlyRate: 130,
      location: "Chicago, IL",
      email: "michael.rodriguez@zyphex.com",
      phone: "+1 (555) 901-2346",
      certifications: ["CBAP", "PMP", "Six Sigma Black Belt"],
      education: "MBA, Harvard Business School",
    },
    {
      id: 3,
      name: "Jennifer Wong",
      avatar: "",
      role: "Data Analytics Consultant",
      specialization: "Data Strategy, BI Solutions",
      experience: "10 years",
      currentProjects: 1,
      completedProjects: 16,
      rating: 4.7,
      status: "Active",
      skills: ["Data Analytics", "Business Intelligence", "SQL", "Tableau", "Power BI"],
      availability: "Available",
      hourlyRate: 125,
      location: "Seattle, WA",
      email: "jennifer.wong@zyphex.com",
      phone: "+1 (555) 012-3457",
      certifications: ["CDMP", "Tableau Desktop Specialist"],
      education: "MS Data Science, Stanford",
    },
    {
      id: 4,
      name: "David Park",
      avatar: "",
      role: "Cybersecurity Consultant",
      specialization: "Security Assessment, Compliance",
      experience: "14 years",
      currentProjects: 1,
      completedProjects: 19,
      rating: 4.8,
      status: "Active",
      skills: ["Security Audits", "Risk Assessment", "Compliance", "Penetration Testing"],
      availability: "Limited",
      hourlyRate: 160,
      location: "Washington, DC",
      email: "david.park@zyphex.com",
      phone: "+1 (555) 123-4568",
      certifications: ["CISSP", "CISM", "CEH"],
      education: "MS Cybersecurity, Carnegie Mellon",
    },
    {
      id: 5,
      name: "Lisa Thompson",
      avatar: "",
      role: "Marketing Technology Consultant",
      specialization: "MarTech Stack, Automation",
      experience: "9 years",
      currentProjects: 1,
      completedProjects: 13,
      rating: 4.6,
      status: "Active",
      skills: ["Marketing Automation", "CRM", "Email Marketing", "Analytics"],
      availability: "Available",
      hourlyRate: 115,
      location: "Atlanta, GA",
      email: "lisa.thompson@zyphex.com",
      phone: "+1 (555) 234-5679",
      certifications: ["HubSpot Marketing", "Google Analytics"],
      education: "MBA Marketing, Wharton",
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

      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible-icon]/sidebar-wrapper:h-12 relative z-10">
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
                <BreadcrumbPage className="zyphex-heading">Consultants</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold zyphex-heading">Consulting Team</h1>
              <p className="text-lg zyphex-subheading">Manage your expert consultants and advisors</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" className="zyphex-button-secondary hover-zyphex-glow">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
              <Button className="zyphex-button-primary hover-zyphex-lift">
                <Plus className="mr-2 h-4 w-4" />
                Add Consultant
              </Button>
            </div>
          </div>
        </div>

        {/* Team Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Total Consultants</CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">5</div>
              <p className="text-xs zyphex-subheading">active consultants</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Avg. Rating</CardTitle>
              <Star className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">4.8</div>
              <p className="text-xs zyphex-subheading">out of 5 stars</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Active Projects</CardTitle>
              <Briefcase className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">6</div>
              <p className="text-xs zyphex-subheading">currently assigned</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Avg. Hourly Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">$136</div>
              <p className="text-xs zyphex-subheading">per hour</p>
            </CardContent>
          </Card>
        </div>

        {/* Consultants Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {consultants.map((consultant) => (
            <Card key={consultant.id} className="zyphex-card hover-zyphex-lift">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <UserAvatar 
                    name={consultant.name} 
                    imageUrl={consultant.avatar}
                    size="xl"
                    alt={`${consultant.name} - ${consultant.role}`}
                  />
                  <div className="flex-1">
                    <CardTitle className="zyphex-heading">{consultant.name}</CardTitle>
                    <CardDescription className="zyphex-subheading">{consultant.role}</CardDescription>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant="outline" className={getStatusColor(consultant.status)}>
                        {consultant.status}
                      </Badge>
                      <Badge variant="secondary" className={getAvailabilityColor(consultant.availability)}>
                        {consultant.availability}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Consultant Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                      <p className="text-2xl font-bold zyphex-heading">{consultant.currentProjects}</p>
                      <p className="text-xs zyphex-subheading">Active Projects</p>
                    </div>
                    <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                      <p className="text-2xl font-bold zyphex-heading">{consultant.completedProjects}</p>
                      <p className="text-xs zyphex-subheading">Completed</p>
                    </div>
                  </div>

                  {/* Rating and Experience */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      {renderStars(consultant.rating)}
                      <span className="text-sm zyphex-subheading ml-2">({consultant.rating})</span>
                    </div>
                    <Badge variant="outline" className="text-blue-600 border-blue-600">
                      {consultant.experience}
                    </Badge>
                  </div>

                  {/* Education */}
                  <div className="flex items-center space-x-2">
                    <GraduationCap className="h-4 w-4 text-blue-400" />
                    <span className="text-sm zyphex-subheading">{consultant.education}</span>
                  </div>

                  {/* Certifications */}
                  <div>
                    <p className="text-sm font-medium zyphex-heading mb-2 flex items-center">
                      <Award className="h-4 w-4 mr-1 text-yellow-400" />
                      Certifications
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {consultant.certifications.map((cert, index) => (
                        <Badge key={index} variant="outline" className="text-yellow-600 border-yellow-600 text-xs">
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Skills */}
                  <div>
                    <p className="text-sm font-medium zyphex-heading mb-2">Top Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {consultant.skills.slice(0, 3).map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {consultant.skills.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{consultant.skills.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <Mail className="h-4 w-4 text-blue-400" />
                      <span className="zyphex-subheading">{consultant.email}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Phone className="h-4 w-4 text-blue-400" />
                      <span className="zyphex-subheading">{consultant.phone}</span>
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
