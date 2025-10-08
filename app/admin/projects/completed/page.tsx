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
import { CalendarDays, DollarSign, CheckCircle, Star, Filter, Download, Clock } from "lucide-react"
import { SubtleBackground } from "@/components/subtle-background"

export default function CompletedProjectsPage() {
  const completedProjects = [
    {
      id: 1,
      name: "Corporate Website Redesign",
      client: "GlobalTech Industries",
      completedDate: "2024-01-15",
      duration: "3 months",
      budget: 55000,
      finalCost: 52000,
      rating: 5,
      testimonial: "Excellent work! The new website has significantly improved our online presence.",
      team: [
        { name: "Alice Johnson", role: "Project Manager", avatar: "" },
        { name: "Bob Smith", role: "Lead Developer", avatar: "" },
        { name: "Carol Davis", role: "UI/UX Designer", avatar: "" },
      ],
      category: "Web Development",
      status: "Delivered",
    },
    {
      id: 2,
      name: "Logo & Brand Identity",
      client: "FreshStart Bakery",
      completedDate: "2024-01-08",
      duration: "6 weeks",
      budget: 12000,
      finalCost: 11800,
      rating: 4,
      testimonial: "Love the new branding! It perfectly captures our bakery's warm and inviting atmosphere.",
      team: [
        { name: "Frank Miller", role: "Creative Director", avatar: "" },
        { name: "Grace Lee", role: "Graphic Designer", avatar: "" },
      ],
      category: "Design",
      status: "Delivered",
    },
    {
      id: 3,
      name: "E-Commerce Integration",
      client: "RetailPlus",
      completedDate: "2023-12-20",
      duration: "2 months",
      budget: 38000,
      finalCost: 36500,
      rating: 5,
      testimonial: "The e-commerce integration was seamless. Sales have increased by 40% since launch.",
      team: [
        { name: "Henry Taylor", role: "Backend Developer", avatar: "" },
        { name: "Ivy Chen", role: "DevOps Engineer", avatar: "" },
        { name: "David Wilson", role: "Mobile Developer", avatar: "" },
      ],
      category: "E-Commerce",
      status: "Delivered",
    },
    {
      id: 4,
      name: "Mobile App MVP",
      client: "HealthTrack Pro",
      completedDate: "2023-12-10",
      duration: "8 weeks",
      budget: 45000,
      finalCost: 44000,
      rating: 4,
      testimonial: "Great MVP! The app works perfectly and our users love the interface.",
      team: [
        { name: "David Wilson", role: "Mobile Developer", avatar: "" },
        { name: "Eva Brown", role: "QA Tester", avatar: "" },
        { name: "Alice Johnson", role: "Project Manager", avatar: "" },
      ],
      category: "Mobile Development",
      status: "Delivered",
    },
    {
      id: 5,
      name: "SEO Optimization Campaign",
      client: "Local Services Co",
      completedDate: "2023-11-30",
      duration: "4 weeks",
      budget: 8000,
      finalCost: 7800,
      rating: 5,
      testimonial: "Our search rankings have improved dramatically. Highly recommend their SEO services!",
      team: [
        { name: "Jack Robinson", role: "SEO Specialist", avatar: "" },
        { name: "Alice Johnson", role: "Project Manager", avatar: "" },
      ],
      category: "Digital Marketing",
      status: "Delivered",
    },
  ]

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
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
                <BreadcrumbLink href="/admin/projects" className="zyphex-subheading hover:text-white">
                  Projects
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage className="zyphex-heading">Completed</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold zyphex-heading">Completed Projects</h1>
              <p className="text-lg zyphex-subheading">Review your successfully delivered projects</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" className="zyphex-button-secondary hover-zyphex-glow">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
              <Button className="zyphex-button-primary hover-zyphex-lift">
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </Button>
            </div>
          </div>
        </div>

        {/* Project Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Total Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">5</div>
              <p className="text-xs zyphex-subheading">projects delivered</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Avg. Rating</CardTitle>
              <Star className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">4.6</div>
              <p className="text-xs zyphex-subheading">out of 5 stars</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">$246,100</div>
              <p className="text-xs zyphex-subheading">from completed projects</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">On Budget</CardTitle>
              <CalendarDays className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">100%</div>
              <p className="text-xs zyphex-subheading">delivered within budget</p>
            </CardContent>
          </Card>
        </div>

        {/* Completed Projects List */}
        <div className="space-y-6">
          {completedProjects.map((project) => (
            <Card key={project.id} className="zyphex-card hover-zyphex-lift">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="zyphex-heading">{project.name}</CardTitle>
                    <CardDescription className="zyphex-subheading">{project.client}</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      {project.status}
                    </Badge>
                    <Badge variant="outline" className="text-blue-600 border-blue-600">
                      {project.category}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Project Details */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="flex items-center space-x-2">
                      <CalendarDays className="h-4 w-4 text-blue-400" />
                      <div>
                        <p className="text-sm font-medium zyphex-heading">Completed</p>
                        <p className="text-xs zyphex-subheading">{project.completedDate}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-blue-400" />
                      <div>
                        <p className="text-sm font-medium zyphex-heading">Duration</p>
                        <p className="text-xs zyphex-subheading">{project.duration}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-blue-400" />
                      <div>
                        <p className="text-sm font-medium zyphex-heading">Final Cost</p>
                        <p className="text-xs zyphex-subheading">${project.finalCost.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Star className="h-4 w-4 text-yellow-400" />
                      <div>
                        <p className="text-sm font-medium zyphex-heading">Rating</p>
                        <div className="flex items-center space-x-1">
                          {renderStars(project.rating)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Testimonial */}
                  <div className="bg-slate-800/50 p-4 rounded-lg">
                    <p className="text-sm italic zyphex-subheading mb-2">&ldquo;{project.testimonial}&rdquo;</p>
                    <p className="text-xs zyphex-subheading">- {project.client}</p>
                  </div>

                  {/* Team Members */}
                  <div>
                    <p className="text-sm font-medium zyphex-heading mb-2">Project Team</p>
                    <div className="flex items-center space-x-2">
                      {project.team.map((member, index) => (
                        <Avatar key={index} className="h-8 w-8">
                          <AvatarImage src={member.avatar} alt={member.name} />
                          <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                      ))}
                      <span className="text-sm zyphex-subheading ml-2">
                        {project.team.map(m => m.name.split(' ')[0]).join(', ')}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" className="zyphex-button-secondary hover-zyphex-glow">
                        View Case Study
                      </Button>
                      <Button variant="outline" size="sm" className="zyphex-button-secondary hover-zyphex-glow">
                        Contact Client
                      </Button>
                    </div>
                    <Button variant="outline" size="sm" className="zyphex-button-secondary hover-zyphex-glow">
                      Download Files
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
