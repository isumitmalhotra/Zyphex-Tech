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
import { Palette, Users, Star, TrendingUp, Filter, Plus, Mail, Phone, Award } from "lucide-react"
import { SubtleBackground } from "@/components/subtle-background"

export default function DesignersPage() {
  const designers = [
    {
      id: 1,
      name: "Carol Davis",
      avatar: "/placeholder-user.jpg",
      role: "Senior UI/UX Designer",
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
      portfolio: "https://carol-designs.com",
      awards: ["CSS Design Awards 2023", "Awwwards Winner"],
    },
    {
      id: 2,
      name: "Grace Lee",
      avatar: "/placeholder-user.jpg",
      role: "Graphic Designer",
      specialization: "Brand Identity, Print Design",
      experience: "5 years",
      currentProjects: 2,
      completedProjects: 14,
      rating: 4.6,
      status: "Active",
      skills: ["Adobe Creative Suite", "Illustrator", "Photoshop", "InDesign", "Brand Design"],
      availability: "Available",
      hourlyRate: 60,
      location: "Los Angeles, CA",
      email: "grace.lee@zyphex.com",
      phone: "+1 (555) 456-7891",
      portfolio: "https://gracelee-design.com",
      awards: ["Print Design Excellence"],
    },
    {
      id: 3,
      name: "Henry Kim",
      avatar: "/placeholder-user.jpg",
      role: "Motion Designer",
      specialization: "Animation, Motion Graphics",
      experience: "6 years",
      currentProjects: 1,
      completedProjects: 11,
      rating: 4.7,
      status: "Active",
      skills: ["After Effects", "Cinema 4D", "Motion Design", "Animation", "Video Editing"],
      availability: "Available",
      hourlyRate: 70,
      location: "Chicago, IL",
      email: "henry.kim@zyphex.com",
      phone: "+1 (555) 567-8902",
      portfolio: "https://henry-motion.com",
      awards: ["Motion Design Awards"],
    },
    {
      id: 4,
      name: "Ivy Chen",
      avatar: "/placeholder-user.jpg",
      role: "Product Designer",
      specialization: "Product Design, Design Systems",
      experience: "4 years",
      currentProjects: 2,
      completedProjects: 9,
      rating: 4.5,
      status: "Active",
      skills: ["Design Systems", "Component Libraries", "User Testing", "Figma", "Design Thinking"],
      availability: "Available",
      hourlyRate: 65,
      location: "San Francisco, CA",
      email: "ivy.chen@zyphex.com",
      phone: "+1 (555) 678-9013",
      portfolio: "https://ivy-productdesign.com",
      awards: [],
    },
    {
      id: 5,
      name: "Jack Thompson",
      avatar: "/placeholder-user.jpg",
      role: "Creative Director",
      specialization: "Creative Direction, Strategy",
      experience: "12 years",
      currentProjects: 1,
      completedProjects: 32,
      rating: 4.9,
      status: "Active",
      skills: ["Creative Direction", "Brand Strategy", "Art Direction", "Leadership", "Client Relations"],
      availability: "Limited",
      hourlyRate: 120,
      location: "Miami, FL",
      email: "jack.thompson@zyphex.com",
      phone: "+1 (555) 789-0124",
      portfolio: "https://jack-creative.com",
      awards: ["Creative Director of the Year 2022", "Brand Excellence Awards"],
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
                <BreadcrumbPage className="zyphex-heading">Designers</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold zyphex-heading">Design Team</h1>
              <p className="text-lg zyphex-subheading">Manage your creative design and UX team members</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" className="zyphex-button-secondary hover-zyphex-glow">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
              <Button className="zyphex-button-primary hover-zyphex-lift">
                <Plus className="mr-2 h-4 w-4" />
                Add Designer
              </Button>
            </div>
          </div>
        </div>

        {/* Team Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Total Designers</CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">5</div>
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
              <Palette className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">9</div>
              <p className="text-xs zyphex-subheading">currently assigned</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Avg. Hourly Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">$78</div>
              <p className="text-xs zyphex-subheading">per hour</p>
            </CardContent>
          </Card>
        </div>

        {/* Designers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {designers.map((designer) => (
            <Card key={designer.id} className="zyphex-card hover-zyphex-lift">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={designer.avatar} alt={designer.name} />
                    <AvatarFallback>{designer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="zyphex-heading">{designer.name}</CardTitle>
                    <CardDescription className="zyphex-subheading">{designer.role}</CardDescription>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant="outline" className={getStatusColor(designer.status)}>
                        {designer.status}
                      </Badge>
                      <Badge variant="secondary" className={getAvailabilityColor(designer.availability)}>
                        {designer.availability}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Designer Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                      <p className="text-2xl font-bold zyphex-heading">{designer.currentProjects}</p>
                      <p className="text-xs zyphex-subheading">Active Projects</p>
                    </div>
                    <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                      <p className="text-2xl font-bold zyphex-heading">{designer.completedProjects}</p>
                      <p className="text-xs zyphex-subheading">Completed</p>
                    </div>
                  </div>

                  {/* Rating and Experience */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      {renderStars(designer.rating)}
                      <span className="text-sm zyphex-subheading ml-2">({designer.rating})</span>
                    </div>
                    <Badge variant="outline" className="text-blue-600 border-blue-600">
                      {designer.experience}
                    </Badge>
                  </div>

                  {/* Skills */}
                  <div>
                    <p className="text-sm font-medium zyphex-heading mb-2">Top Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {designer.skills.slice(0, 3).map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {designer.skills.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{designer.skills.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Awards */}
                  {designer.awards.length > 0 && (
                    <div>
                      <p className="text-sm font-medium zyphex-heading mb-2 flex items-center">
                        <Award className="h-4 w-4 mr-1 text-yellow-400" />
                        Awards
                      </p>
                      <div className="space-y-1">
                        {designer.awards.map((award, index) => (
                          <Badge key={index} variant="outline" className="text-yellow-600 border-yellow-600 text-xs">
                            {award}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contact Info */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <Mail className="h-4 w-4 text-blue-400" />
                      <span className="zyphex-subheading">{designer.email}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Phone className="h-4 w-4 text-blue-400" />
                      <span className="zyphex-subheading">{designer.phone}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" className="flex-1 zyphex-button-secondary hover-zyphex-glow">
                      View Portfolio
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
