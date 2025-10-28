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
import { CalendarDays, DollarSign, Phone, Mail, MapPin, Target, TrendingUp, Filter, Plus, UserPlus } from "lucide-react"
import { SubtleBackground } from "@/components/subtle-background"

export default function LeadsPage() {
  const leads = [
    {
      id: 1,
      name: "GreenEnergy Solutions",
      company: "GreenEnergy Solutions LLC",
      avatar: "",
      status: "Qualified",
      source: "Website Contact",
      estimatedValue: 75000,
      probability: 75,
      lastContact: "2024-01-20",
      nextFollowUp: "2024-01-25",
      contactPerson: "Lisa Green",
      email: "lisa.green@greenenergy.com",
      phone: "+1 (555) 567-8901",
      location: "Portland, OR",
      requirements: "Complete brand identity and website redesign for renewable energy company",
      notes: "Very interested in sustainable design. Budget approved. Need proposal by end of month.",
    },
    {
      id: 2,
      name: "HealthTrack Pro",
      company: "HealthTrack Pro Inc",
      avatar: "",
      status: "Contacted",
      source: "LinkedIn",
      estimatedValue: 45000,
      probability: 60,
      lastContact: "2024-01-18",
      nextFollowUp: "2024-01-28",
      contactPerson: "Dr. Michael Health",
      email: "michael.health@healthtrack.com",
      phone: "+1 (555) 678-9012",
      location: "Boston, MA",
      requirements: "Mobile app development for fitness tracking and health monitoring",
      notes: "Medical professional looking for HIPAA-compliant solution. Technical requirements are complex.",
    },
    {
      id: 3,
      name: "RetailPlus",
      company: "RetailPlus Corporation",
      avatar: "",
      status: "Qualified",
      source: "Referral",
      estimatedValue: 55000,
      probability: 80,
      lastContact: "2024-01-15",
      nextFollowUp: "2024-01-30",
      contactPerson: "Jennifer Retail",
      email: "jennifer.retail@retailplus.com",
      phone: "+1 (555) 789-0123",
      location: "Chicago, IL",
      requirements: "E-commerce platform with inventory management and customer analytics",
      notes: "Referred by existing client. Strong budget and clear requirements. High conversion potential.",
    },
    {
      id: 4,
      name: "EduTech Innovations",
      company: "EduTech Innovations Ltd",
      avatar: "",
      status: "New",
      source: "Trade Show",
      estimatedValue: 35000,
      probability: 40,
      lastContact: "2024-01-10",
      nextFollowUp: "2024-01-27",
      contactPerson: "Professor Sarah Learn",
      email: "sarah.learn@edutech.com",
      phone: "+1 (555) 890-1234",
      location: "Denver, CO",
      requirements: "Educational platform with interactive learning modules and assessment tools",
      notes: "Met at education technology conference. Still gathering requirements. Long sales cycle expected.",
    },
    {
      id: 5,
      name: "LogisticsPro",
      company: "LogisticsPro Systems",
      avatar: "",
      status: "Qualified",
      source: "Cold Outreach",
      estimatedValue: 65000,
      probability: 65,
      lastContact: "2024-01-12",
      nextFollowUp: "2024-01-26",
      contactPerson: "Tom Logistics",
      email: "tom.logistics@logisticspro.com",
      phone: "+1 (555) 901-2345",
      location: "Atlanta, GA",
      requirements: "Logistics management system with real-time tracking and route optimization",
      notes: "Responded well to initial outreach. Technical requirements well-defined. Ready for proposal.",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Qualified":
        return "text-green-600 border-green-600"
      case "Contacted":
        return "text-blue-600 border-blue-600"
      case "New":
        return "text-yellow-600 border-yellow-600"
      case "Lost":
        return "text-red-600 border-red-600"
      default:
        return "text-gray-600 border-gray-600"
    }
  }

  const getSourceColor = (source: string) => {
    switch (source) {
      case "Website Contact":
        return "text-blue-600 bg-blue-100"
      case "LinkedIn":
        return "text-blue-700 bg-blue-100"
      case "Referral":
        return "text-green-600 bg-green-100"
      case "Trade Show":
        return "text-purple-600 bg-purple-100"
      case "Cold Outreach":
        return "text-orange-600 bg-orange-100"
      default:
        return "text-gray-600 bg-gray-100"
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
                <BreadcrumbLink href="/admin/clients" className="zyphex-subheading hover:text-white">
                  Clients
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage className="zyphex-heading">Leads</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold zyphex-heading">Sales Leads</h1>
              <p className="text-lg zyphex-subheading">Track and nurture your potential clients</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" className="zyphex-button-secondary hover-zyphex-glow">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
              <Button className="zyphex-button-primary hover-zyphex-lift">
                <Plus className="mr-2 h-4 w-4" />
                Add Lead
              </Button>
            </div>
          </div>
        </div>

        {/* Leads Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Total Leads</CardTitle>
              <Target className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">5</div>
              <p className="text-xs zyphex-subheading">active leads</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Qualified</CardTitle>
              <UserPlus className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">3</div>
              <p className="text-xs zyphex-subheading">60% qualification rate</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">$275,000</div>
              <p className="text-xs zyphex-subheading">potential revenue</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Avg. Probability</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">64%</div>
              <p className="text-xs zyphex-subheading">conversion likelihood</p>
            </CardContent>
          </Card>
        </div>

        {/* Leads List */}
        <div className="space-y-6">
          {leads.map((lead) => (
            <Card key={lead.id} className="zyphex-card hover-zyphex-lift">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <UserAvatar 
                      name={lead.contactPerson} 
                      imageUrl={lead.avatar}
                      size="lg"
                      alt={`${lead.contactPerson} from ${lead.company}`}
                    />
                    <div>
                      <CardTitle className="zyphex-heading">{lead.company}</CardTitle>
                      <CardDescription className="zyphex-subheading">{lead.contactPerson}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className={getStatusColor(lead.status)}>
                      {lead.status}
                    </Badge>
                    <Badge variant="secondary" className={getSourceColor(lead.source)}>
                      {lead.source}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Lead Details */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-blue-400" />
                      <div>
                        <p className="text-sm font-medium zyphex-heading">Email</p>
                        <p className="text-xs zyphex-subheading">{lead.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-blue-400" />
                      <div>
                        <p className="text-sm font-medium zyphex-heading">Phone</p>
                        <p className="text-xs zyphex-subheading">{lead.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-blue-400" />
                      <div>
                        <p className="text-sm font-medium zyphex-heading">Location</p>
                        <p className="text-xs zyphex-subheading">{lead.location}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CalendarDays className="h-4 w-4 text-blue-400" />
                      <div>
                        <p className="text-sm font-medium zyphex-heading">Last Contact</p>
                        <p className="text-xs zyphex-subheading">{lead.lastContact}</p>
                      </div>
                    </div>
                  </div>

                  {/* Lead Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-800/50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium zyphex-heading">Estimated Value</p>
                          <p className="text-xl font-bold zyphex-heading">${lead.estimatedValue.toLocaleString()}</p>
                        </div>
                        <DollarSign className="h-6 w-6 text-green-400" />
                      </div>
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium zyphex-heading">Probability</p>
                          <p className={`text-xl font-bold ${getProbabilityColor(lead.probability)}`}>
                            {lead.probability}%
                          </p>
                        </div>
                        <TrendingUp className="h-6 w-6 text-blue-400" />
                      </div>
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium zyphex-heading">Next Follow-up</p>
                          <p className="text-sm zyphex-subheading">{lead.nextFollowUp}</p>
                        </div>
                        <CalendarDays className="h-6 w-6 text-yellow-400" />
                      </div>
                    </div>
                  </div>

                  {/* Requirements */}
                  <div>
                    <p className="text-sm font-medium zyphex-heading mb-2">Requirements</p>
                    <p className="text-sm zyphex-subheading">{lead.requirements}</p>
                  </div>

                  {/* Notes */}
                  <div>
                    <p className="text-sm font-medium zyphex-heading mb-2">Notes</p>
                    <p className="text-sm zyphex-subheading">{lead.notes}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" className="zyphex-button-secondary hover-zyphex-glow">
                        View Details
                      </Button>
                      <Button variant="outline" size="sm" className="zyphex-button-secondary hover-zyphex-glow">
                        <Mail className="mr-2 h-4 w-4" />
                        Send Email
                      </Button>
                      <Button variant="outline" size="sm" className="zyphex-button-secondary hover-zyphex-glow">
                        <Phone className="mr-2 h-4 w-4" />
                        Call
                      </Button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" className="text-green-600 border-green-600 hover:bg-green-600 hover:text-white">
                        Qualify
                      </Button>
                      <Button variant="outline" size="sm" className="zyphex-button-secondary hover-zyphex-glow">
                        Create Proposal
                      </Button>
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
