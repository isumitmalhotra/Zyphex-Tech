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
import { CalendarDays, DollarSign, FileText, TrendingUp, Filter, Plus, Eye, CheckCircle, XCircle } from "lucide-react"
import { SubtleBackground } from "@/components/subtle-background"
import { generateAvatar } from '@/lib/utils/avatar'

export default function ProposalsPage() {
  const proposals = [
    {
      id: 1,
      title: "E-Commerce Platform Development",
      client: "FashionHub Retail",
      submittedDate: "2024-01-20",
      status: "Under Review",
      estimatedValue: 75000,
      probability: 75,
      dueDate: "2024-02-01",
      description: "Complete e-commerce solution with inventory management, payment processing, and customer analytics.",
      requirements: ["React Frontend", "Node.js Backend", "Stripe Integration", "Analytics Dashboard"],
      team: [
        { name: "Alice Johnson", role: "Project Manager", avatar: "" },
        { name: "Bob Smith", role: "Technical Lead", avatar: "" },
      ],
      category: "E-Commerce",
    },
    {
      id: 2,
      title: "Mobile App for Fitness Tracking",
      client: "FitLife Studios",
      submittedDate: "2024-01-18",
      status: "Pending",
      estimatedValue: 45000,
      probability: 60,
      dueDate: "2024-02-15",
      description: "Cross-platform mobile app for workout tracking, nutrition planning, and community features.",
      requirements: ["React Native", "Firebase", "Health API Integration", "Social Features"],
      team: [
        { name: "David Wilson", role: "Mobile Developer", avatar: "" },
        { name: "Eva Brown", role: "UI/UX Designer", avatar: "" },
      ],
      category: "Mobile Development",
    },
    {
      id: 3,
      title: "Corporate Website Redesign",
      client: "TechSolutions Inc",
      submittedDate: "2024-01-15",
      status: "Accepted",
      estimatedValue: 35000,
      probability: 95,
      dueDate: "2024-01-25",
      description: "Modern website redesign with improved UX, SEO optimization, and content management system.",
      requirements: ["Next.js", "CMS Integration", "SEO Optimization", "Responsive Design"],
      team: [
        { name: "Carol Davis", role: "UI/UX Designer", avatar: "" },
        { name: "Bob Smith", role: "Frontend Developer", avatar: "" },
      ],
      category: "Web Development",
    },
    {
      id: 4,
      title: "Data Analytics Dashboard",
      client: "Business Insights Co",
      submittedDate: "2024-01-12",
      status: "Rejected",
      estimatedValue: 55000,
      probability: 0,
      dueDate: "2024-01-30",
      description: "Comprehensive analytics dashboard for business intelligence and reporting.",
      requirements: ["Python Backend", "Data Visualization", "API Integration", "Real-time Updates"],
      team: [
        { name: "Henry Taylor", role: "Data Engineer", avatar: "" },
        { name: "Ivy Chen", role: "Data Analyst", avatar: "" },
      ],
      category: "Data Analytics",
    },
    {
      id: 5,
      title: "Brand Identity & Marketing Materials",
      client: "GreenEnergy Solutions",
      submittedDate: "2024-01-10",
      status: "Under Review",
      estimatedValue: 25000,
      probability: 80,
      dueDate: "2024-02-10",
      description: "Complete brand identity package including logo, marketing materials, and digital assets.",
      requirements: ["Logo Design", "Brand Guidelines", "Marketing Materials", "Digital Assets"],
      team: [
        { name: "Frank Miller", role: "Creative Director", avatar: "" },
        { name: "Grace Lee", role: "Graphic Designer", avatar: "" },
      ],
      category: "Design",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Accepted":
        return "text-green-600 border-green-600"
      case "Under Review":
        return "text-yellow-600 border-yellow-600"
      case "Pending":
        return "text-blue-600 border-blue-600"
      case "Rejected":
        return "text-red-600 border-red-600"
      default:
        return "text-gray-600 border-gray-600"
    }
  }

  const getProbabilityColor = (probability: number) => {
    if (probability >= 80) return "text-green-600"
    if (probability >= 60) return "text-yellow-600"
    if (probability >= 40) return "text-orange-600"
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
                <BreadcrumbLink href="/admin/projects" className="zyphex-subheading hover:text-white">
                  Projects
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage className="zyphex-heading">Proposals</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold zyphex-heading">Project Proposals</h1>
              <p className="text-lg zyphex-subheading">Manage and track your project proposals</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" className="zyphex-button-secondary hover-zyphex-glow">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
              <Button className="zyphex-button-primary hover-zyphex-lift">
                <Plus className="mr-2 h-4 w-4" />
                New Proposal
              </Button>
            </div>
          </div>
        </div>

        {/* Proposal Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Total Proposals</CardTitle>
              <FileText className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">5</div>
              <p className="text-xs zyphex-subheading">active proposals</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Accepted</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">1</div>
              <p className="text-xs zyphex-subheading">20% acceptance rate</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">$235,000</div>
              <p className="text-xs zyphex-subheading">potential revenue</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Avg. Probability</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">62%</div>
              <p className="text-xs zyphex-subheading">conversion likelihood</p>
            </CardContent>
          </Card>
        </div>

        {/* Proposals List */}
        <div className="space-y-6">
          {proposals.map((proposal) => (
            <Card key={proposal.id} className="zyphex-card hover-zyphex-lift">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="zyphex-heading">{proposal.title}</CardTitle>
                    <CardDescription className="zyphex-subheading">{proposal.client}</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className={getStatusColor(proposal.status)}>
                      {proposal.status}
                    </Badge>
                    <Badge variant="outline" className="text-blue-600 border-blue-600">
                      {proposal.category}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Proposal Details */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="flex items-center space-x-2">
                      <CalendarDays className="h-4 w-4 text-blue-400" />
                      <div>
                        <p className="text-sm font-medium zyphex-heading">Submitted</p>
                        <p className="text-xs zyphex-subheading">{proposal.submittedDate}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-blue-400" />
                      <div>
                        <p className="text-sm font-medium zyphex-heading">Value</p>
                        <p className="text-xs zyphex-subheading">${proposal.estimatedValue.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-blue-400" />
                      <div>
                        <p className="text-sm font-medium zyphex-heading">Probability</p>
                        <p className={`text-xs font-medium ${getProbabilityColor(proposal.probability)}`}>
                          {proposal.probability}%
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CalendarDays className="h-4 w-4 text-blue-400" />
                      <div>
                        <p className="text-sm font-medium zyphex-heading">Due Date</p>
                        <p className="text-xs zyphex-subheading">{proposal.dueDate}</p>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <p className="text-sm zyphex-subheading">{proposal.description}</p>
                  </div>

                  {/* Requirements */}
                  <div>
                    <p className="text-sm font-medium zyphex-heading mb-2">Key Requirements</p>
                    <div className="flex flex-wrap gap-2">
                      {proposal.requirements.map((req, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {req}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Team Members */}
                  <div>
                    <p className="text-sm font-medium zyphex-heading mb-2">Assigned Team</p>
                    <div className="flex items-center space-x-2">
                      {proposal.team.map((member, index) => (
                        <Avatar key={index} className="h-8 w-8">
                          <AvatarImage src={member.avatar || generateAvatar(member.name, 32)} alt={member.name} />
                          <AvatarFallback>
                            <img src={generateAvatar(member.name, 32)} alt={member.name} />
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      <span className="text-sm zyphex-subheading ml-2">
                        {proposal.team.map(m => m.name.split(' ')[0]).join(', ')}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" className="zyphex-button-secondary hover-zyphex-glow">
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Button>
                      {proposal.status === "Under Review" && (
                        <>
                          <Button variant="outline" size="sm" className="text-green-600 border-green-600 hover:bg-green-600 hover:text-white">
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Accept
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white">
                            <XCircle className="mr-2 h-4 w-4" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                    <Button variant="outline" size="sm" className="zyphex-button-secondary hover-zyphex-glow">
                      Download PDF
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
