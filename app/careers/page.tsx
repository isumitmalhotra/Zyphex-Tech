"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  ArrowRight, 
  Briefcase, 
  MapPin, 
  Clock, 
  DollarSign,
  Heart,
  Users,
  Zap,
  Award,
  Coffee,
  Home,
  Laptop,
  TrendingUp,
  Shield,
  Globe,
  Calendar,
  CheckCircle2,
  Mail,
  Phone,
  MessageCircle,
  Filter,
  Search
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useScrollAnimation } from "@/components/scroll-animations"
import { SubtleBackground, MinimalParticles } from "@/components/subtle-background"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Job Position Interface
interface JobPosition {
  id: string
  title: string
  department: string
  location: string
  type: "Full-time" | "Part-time" | "Contract"
  remote: boolean
  salary?: string
  description: string
  requirements: string[]
  responsibilities: string[]
  postedDate: string
}

// Mock Job Positions Data
const jobPositions: JobPosition[] = [
  {
    id: "1",
    title: "Senior Full Stack Developer",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
    remote: true,
    salary: "$100k - $140k",
    description: "Join our engineering team to build scalable web applications using modern technologies.",
    requirements: ["5+ years experience", "React/Next.js", "Node.js", "TypeScript", "AWS/Cloud"],
    responsibilities: ["Build and maintain web applications", "Collaborate with design team", "Code reviews", "Mentor junior developers"],
    postedDate: "2024-10-15"
  },
  {
    id: "2",
    title: "UI/UX Designer",
    department: "Design",
    location: "Remote",
    type: "Full-time",
    remote: true,
    salary: "$80k - $110k",
    description: "Create beautiful and intuitive user experiences for our platform and clients.",
    requirements: ["3+ years experience", "Figma/Sketch", "Design systems", "User research", "Prototyping"],
    responsibilities: ["Design user interfaces", "Conduct user research", "Create design systems", "Collaborate with developers"],
    postedDate: "2024-10-10"
  },
  {
    id: "3",
    title: "DevOps Engineer",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
    remote: true,
    salary: "$95k - $130k",
    description: "Build and maintain our cloud infrastructure and deployment pipelines.",
    requirements: ["4+ years experience", "AWS/Azure", "Docker/Kubernetes", "CI/CD", "Terraform"],
    responsibilities: ["Manage cloud infrastructure", "Automate deployments", "Monitor system performance", "Security implementation"],
    postedDate: "2024-10-12"
  },
  {
    id: "4",
    title: "Product Manager",
    department: "Product",
    location: "Remote",
    type: "Full-time",
    remote: true,
    salary: "$110k - $150k",
    description: "Lead product strategy and roadmap for our innovative platform.",
    requirements: ["5+ years experience", "Product strategy", "Agile/Scrum", "Data analysis", "Stakeholder management"],
    responsibilities: ["Define product vision", "Manage roadmap", "Coordinate with teams", "Analyze metrics"],
    postedDate: "2024-10-08"
  },
  {
    id: "5",
    title: "Frontend Developer",
    department: "Engineering",
    location: "Remote",
    type: "Contract",
    remote: true,
    salary: "$70 - $100/hr",
    description: "Build responsive and performant user interfaces for client projects.",
    requirements: ["3+ years experience", "React", "CSS/Tailwind", "JavaScript/TypeScript", "Responsive design"],
    responsibilities: ["Develop UI components", "Implement designs", "Optimize performance", "Write tests"],
    postedDate: "2024-10-18"
  },
  {
    id: "6",
    title: "Marketing Manager",
    department: "Marketing",
    location: "Remote",
    type: "Full-time",
    remote: true,
    salary: "$85k - $120k",
    description: "Drive marketing strategy and growth initiatives for Zyphex Tech.",
    requirements: ["4+ years experience", "Digital marketing", "SEO/SEM", "Content strategy", "Analytics"],
    responsibilities: ["Develop marketing strategy", "Manage campaigns", "Analyze performance", "Lead content creation"],
    postedDate: "2024-10-05"
  }
]

// Employee Testimonials
const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Senior Developer",
    image: "/placeholder.svg?height=100&width=100",
    quote: "Working at Zyphex has been an incredible journey. The team culture is amazing, and I'm constantly learning and growing.",
    years: "3 years at Zyphex"
  },
  {
    name: "Michael Chen",
    role: "Product Designer",
    image: "/placeholder.svg?height=100&width=100",
    quote: "The flexibility and trust given to employees here is unmatched. I can truly balance my work and personal life.",
    years: "2 years at Zyphex"
  },
  {
    name: "Emily Rodriguez",
    role: "DevOps Engineer",
    image: "/placeholder.svg?height=100&width=100",
    quote: "The innovative projects and cutting-edge technology we work with make every day exciting and challenging.",
    years: "4 years at Zyphex"
  }
]

// Benefits Data
const benefits = [
  { icon: Heart, title: "Health & Wellness", description: "Comprehensive health, dental, and vision insurance" },
  { icon: Home, title: "Remote Work", description: "Work from anywhere with flexible hours" },
  { icon: Calendar, title: "Unlimited PTO", description: "Take time off when you need it" },
  { icon: Laptop, title: "Equipment Budget", description: "$2000 for your home office setup" },
  { icon: TrendingUp, title: "Career Growth", description: "Professional development and training budget" },
  { icon: DollarSign, title: "Competitive Salary", description: "Top market rates plus equity options" },
  { icon: Coffee, title: "Team Events", description: "Regular virtual and in-person gatherings" },
  { icon: Shield, title: "401(k) Matching", description: "Up to 6% employer match" }
]

// Company Values
const values = [
  {
    icon: Users,
    title: "Collaboration",
    description: "We believe in the power of teamwork and open communication"
  },
  {
    icon: Zap,
    title: "Innovation",
    description: "We constantly push boundaries and embrace new technologies"
  },
  {
    icon: Award,
    title: "Excellence",
    description: "We strive for quality in everything we do"
  },
  {
    icon: Globe,
    title: "Diversity",
    description: "We celebrate different perspectives and backgrounds"
  }
]

// Hiring Process Steps
const hiringProcess = [
  { step: 1, title: "Apply", description: "Submit your application and resume", duration: "5 min" },
  { step: 2, title: "Phone Screen", description: "Initial call with HR team", duration: "30 min" },
  { step: 3, title: "Technical Interview", description: "Skills assessment with team", duration: "1-2 hours" },
  { step: 4, title: "Team Interview", description: "Meet the team you'll work with", duration: "1 hour" },
  { step: 5, title: "Offer", description: "Receive and review your offer", duration: "1-2 days" }
]

export default function CareersPage() {
  useScrollAnimation()

  const [searchQuery, setSearchQuery] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [locationFilter, setLocationFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [emailSubscription, setEmailSubscription] = useState("")

  // Get unique departments, locations, and types for filters
  const departments = useMemo(() => {
    const depts = Array.from(new Set(jobPositions.map(job => job.department)))
    return ["all", ...depts]
  }, [])

  const locations = useMemo(() => {
    const locs = Array.from(new Set(jobPositions.map(job => job.location)))
    return ["all", ...locs]
  }, [])

  const types = useMemo(() => {
    const jobTypes = Array.from(new Set(jobPositions.map(job => job.type)))
    return ["all", ...jobTypes]
  }, [])

  // Filter jobs based on search and filters
  const filteredJobs = useMemo(() => {
    return jobPositions.filter(job => {
      const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          job.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesDepartment = departmentFilter === "all" || job.department === departmentFilter
      const matchesLocation = locationFilter === "all" || job.location === locationFilter
      const matchesType = typeFilter === "all" || job.type === typeFilter

      return matchesSearch && matchesDepartment && matchesLocation && matchesType
    })
  }, [searchQuery, departmentFilter, locationFilter, typeFilter])

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle email subscription
    console.log("Subscribe email:", emailSubscription)
    alert("Thank you for subscribing to job alerts!")
    setEmailSubscription("")
  }

  return (
    <>
      {/* Hero Section */}
      <section className="zyphex-gradient-bg section-padding overflow-hidden relative min-h-[600px] flex items-center">
        <SubtleBackground />
        <MinimalParticles />
        <div className="container mx-auto container-padding relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge variant="secondary" className="w-fit mx-auto zyphex-blue-glow animate-zyphex-glow scroll-reveal">
              🚀 Join Our Team
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold zyphex-heading scroll-reveal-scale">
              Build Your Career at Zyphex Tech
            </h1>
            <p className="text-xl lg:text-2xl zyphex-subheading leading-relaxed scroll-reveal">
              Join a passionate team of innovators creating the future of remote IT services. 
              We&apos;re building something special, and we want you to be part of it.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center scroll-reveal">
              <Button 
                size="lg" 
                className="text-lg px-8 py-6 zyphex-button-primary hover-zyphex-lift"
                asChild
              >
                <a href="#open-positions">
                  View Open Positions
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="text-lg px-8 py-6 border-white text-white hover:bg-white hover:text-blue-600 bg-transparent"
                asChild
              >
                <a href="#culture">Learn About Our Culture</a>
              </Button>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 scroll-reveal">
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold zyphex-accent-text mb-2">50+</div>
                <div className="text-sm zyphex-subheading">Team Members</div>
              </div>
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold zyphex-accent-text mb-2">15+</div>
                <div className="text-sm zyphex-subheading">Countries</div>
              </div>
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold zyphex-accent-text mb-2">100%</div>
                <div className="text-sm zyphex-subheading">Remote</div>
              </div>
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold zyphex-accent-text mb-2">4.8★</div>
                <div className="text-sm zyphex-subheading">Glassdoor Rating</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Company Culture Section */}
      <section id="culture" className="section-padding zyphex-section-bg relative">
        <SubtleBackground />
        <div className="container mx-auto container-padding relative z-10">
          <div className="text-center space-y-4 mb-16 scroll-reveal">
            <h2 className="text-3xl lg:text-4xl font-bold zyphex-heading">Why Work at Zyphex?</h2>
            <p className="text-lg zyphex-subheading max-w-2xl mx-auto">
              We&apos;re more than just a company - we&apos;re a community of passionate individuals who love what we do
            </p>
          </div>

          {/* Company Values Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {values.map((value, index) => (
              <Card 
                key={index} 
                className="text-center zyphex-card hover-zyphex-lift scroll-reveal-scale"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader className="pb-4">
                  <div className="w-16 h-16 zyphex-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-3d">
                    <value.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl zyphex-heading">{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="zyphex-subheading">
                    {value.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Employee Testimonials */}
          <div className="space-y-8">
            <h3 className="text-2xl lg:text-3xl font-bold zyphex-heading text-center scroll-reveal">
              What Our Team Says
            </h3>
            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card 
                  key={index} 
                  className="zyphex-card hover-zyphex-lift scroll-reveal-rotate"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <CardHeader>
                    <div className="flex items-center gap-4 mb-4">
                      <Image
                        src={testimonial.image}
                        alt={testimonial.name}
                        width={60}
                        height={60}
                        className="rounded-full"
                      />
                      <div>
                        <CardTitle className="text-lg zyphex-heading">{testimonial.name}</CardTitle>
                        <CardDescription className="zyphex-accent-text">{testimonial.role}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="zyphex-subheading italic">&quot;{testimonial.quote}&quot;</p>
                    <p className="text-sm zyphex-accent-text">{testimonial.years}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Open Positions Section */}
      <section id="open-positions" className="section-padding bg-slate-900/50 relative">
        <SubtleBackground />
        <div className="container mx-auto container-padding relative z-10">
          <div className="text-center space-y-4 mb-12 scroll-reveal">
            <h2 className="text-3xl lg:text-4xl font-bold zyphex-heading">Open Positions</h2>
            <p className="text-lg zyphex-subheading max-w-2xl mx-auto">
              Find your next opportunity and join our growing team
            </p>
          </div>

          {/* Search and Filters */}
          <div className="mb-8 space-y-4 scroll-reveal">
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search positions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-lg"
              />
            </div>
            
            <div className="flex flex-wrap gap-4 justify-center items-center">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm zyphex-subheading">Filters:</span>
              </div>
              
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>
                      {dept === "all" ? "All Departments" : dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map(loc => (
                    <SelectItem key={loc} value={loc}>
                      {loc === "all" ? "All Locations" : loc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Job Type" />
                </SelectTrigger>
                <SelectContent>
                  {types.map(type => (
                    <SelectItem key={type} value={type}>
                      {type === "all" ? "All Types" : type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Job Listings */}
          <div className="space-y-6">
            {filteredJobs.length > 0 ? (
              filteredJobs.map((job, index) => (
                <Card 
                  key={job.id} 
                  className="zyphex-card hover-zyphex-lift scroll-reveal"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardHeader className="pb-4">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <CardTitle className="text-2xl zyphex-heading">{job.title}</CardTitle>
                          {job.remote && (
                            <Badge variant="secondary" className="zyphex-blue-glow">
                              Remote
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 flex-wrap text-sm zyphex-subheading">
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4" />
                            <span>{job.department}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{job.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{job.type}</span>
                          </div>
                          {job.salary && (
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4" />
                              <span>{job.salary}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Button 
                        size="lg"
                        className="zyphex-button-primary hover-zyphex-lift"
                        asChild
                      >
                        <Link href={`/careers/${job.id}`}>
                          Apply Now
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="zyphex-subheading">{job.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {job.requirements.slice(0, 4).map((req, idx) => (
                        <Badge key={idx} variant="outline">
                          {req}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="zyphex-card text-center py-12">
                <CardContent>
                  <p className="text-lg zyphex-subheading">
                    No positions found matching your criteria. Try adjusting your filters.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* Benefits & Perks Section */}
      <section className="section-padding zyphex-section-bg relative">
        <SubtleBackground />
        <div className="container mx-auto container-padding relative z-10">
          <div className="text-center space-y-4 mb-16 scroll-reveal">
            <h2 className="text-3xl lg:text-4xl font-bold zyphex-heading">Benefits & Perks</h2>
            <p className="text-lg zyphex-subheading max-w-2xl mx-auto">
              We invest in our team&apos;s well-being and success
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <Card 
                key={index} 
                className="text-center zyphex-card hover-zyphex-lift scroll-reveal-scale"
                style={{ animationDelay: `${index * 75}ms` }}
              >
                <CardHeader className="pb-4">
                  <div className="w-16 h-16 zyphex-gradient-secondary rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-3d">
                    <benefit.icon className="h-8 w-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg zyphex-heading">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="zyphex-subheading">
                    {benefit.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Application Process Section */}
      <section className="section-padding bg-slate-900/50 relative">
        <SubtleBackground />
        <div className="container mx-auto container-padding relative z-10">
          <div className="text-center space-y-4 mb-16 scroll-reveal">
            <h2 className="text-3xl lg:text-4xl font-bold zyphex-heading">Our Hiring Process</h2>
            <p className="text-lg zyphex-subheading max-w-2xl mx-auto">
              A transparent and straightforward path to joining our team
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              {hiringProcess.map((step, index) => (
                <div 
                  key={step.step}
                  className="flex gap-6 items-start scroll-reveal"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex-shrink-0 w-12 h-12 zyphex-gradient-primary rounded-full flex items-center justify-center text-white font-bold text-lg animate-pulse-3d">
                    {step.step}
                  </div>
                  <Card className="flex-1 zyphex-card hover-zyphex-lift">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl zyphex-heading">{step.title}</CardTitle>
                        <Badge variant="secondary">{step.duration}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="zyphex-subheading">{step.description}</p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Diversity & Inclusion Section */}
      <section className="section-padding zyphex-section-bg relative">
        <SubtleBackground />
        <div className="container mx-auto container-padding relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8 scroll-reveal">
            <div className="w-20 h-20 zyphex-gradient-primary rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse-3d">
              <Globe className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold zyphex-heading">
              Committed to Diversity & Inclusion
            </h2>
            <p className="text-lg zyphex-subheading leading-relaxed">
              At Zyphex Tech, we believe that diverse teams build better products. We&apos;re committed to creating 
              an inclusive environment where everyone feels valued, respected, and empowered to do their best work. 
              We&apos;re an equal opportunity employer and welcome applicants from all backgrounds.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Badge variant="secondary" className="text-base px-4 py-2">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Equal Opportunity Employer
              </Badge>
              <Badge variant="secondary" className="text-base px-4 py-2">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Inclusive Workplace
              </Badge>
              <Badge variant="secondary" className="text-base px-4 py-2">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Diverse Team
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Join Talent Network Section */}
      <section className="section-padding bg-slate-900/50 relative">
        <SubtleBackground />
        <div className="container mx-auto container-padding relative z-10">
          <div className="max-w-2xl mx-auto text-center space-y-8 scroll-reveal">
            <h2 className="text-3xl lg:text-4xl font-bold zyphex-heading">
              Don&apos;t See the Right Position?
            </h2>
            <p className="text-lg zyphex-subheading">
              Join our talent network and be the first to know about new opportunities that match your skills
            </p>
            
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
              <Input
                type="email"
                placeholder="Enter your email"
                value={emailSubscription}
                onChange={(e) => setEmailSubscription(e.target.value)}
                required
                className="flex-1 h-12 text-lg"
              />
              <Button 
                type="submit"
                size="lg"
                className="zyphex-button-primary hover-zyphex-lift"
              >
                Subscribe
                <Mail className="ml-2 h-5 w-5" />
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Contact & FAQ Section */}
      <section className="section-padding zyphex-section-bg relative">
        <SubtleBackground />
        <div className="container mx-auto container-padding relative z-10">
          <div className="text-center space-y-4 mb-16 scroll-reveal">
            <h2 className="text-3xl lg:text-4xl font-bold zyphex-heading">Have Questions?</h2>
            <p className="text-lg zyphex-subheading max-w-2xl mx-auto">
              We&apos;re here to help! Reach out to our HR team
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="text-center zyphex-card hover-zyphex-lift scroll-reveal-scale">
              <CardHeader>
                <div className="w-16 h-16 zyphex-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="zyphex-heading">Email Us</CardTitle>
              </CardHeader>
              <CardContent>
                <a 
                  href="mailto:careers@zyphextech.com" 
                  className="zyphex-accent-text hover:underline"
                >
                  careers@zyphextech.com
                </a>
              </CardContent>
            </Card>

            <Card className="text-center zyphex-card hover-zyphex-lift scroll-reveal-scale" style={{ animationDelay: "150ms" }}>
              <CardHeader>
                <div className="w-16 h-16 zyphex-gradient-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="zyphex-heading">Call Us</CardTitle>
              </CardHeader>
              <CardContent>
                <a 
                  href="tel:+1-555-ZYPHEX" 
                  className="zyphex-accent-text hover:underline"
                >
                  +1 (555) ZYPHEX
                </a>
              </CardContent>
            </Card>

            <Card className="text-center zyphex-card hover-zyphex-lift scroll-reveal-scale" style={{ animationDelay: "300ms" }}>
              <CardHeader>
                <div className="w-16 h-16 zyphex-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="zyphex-heading">Live Chat</CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="link" 
                  className="zyphex-accent-text"
                  onClick={() => alert("Chat feature coming soon!")}
                >
                  Start a conversation
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* FAQ */}
          <div className="mt-16 max-w-3xl mx-auto scroll-reveal">
            <h3 className="text-2xl font-bold zyphex-heading text-center mb-8">
              Frequently Asked Questions
            </h3>
            <div className="space-y-4">
              {[
                {
                  q: "Do you sponsor work visas?",
                  a: "Yes, we sponsor H1-B visas and other work permits for qualified candidates."
                },
                {
                  q: "What is your remote work policy?",
                  a: "We are 100% remote-first. You can work from anywhere with a reliable internet connection."
                },
                {
                  q: "How long does the hiring process take?",
                  a: "Our typical hiring process takes 2-3 weeks from application to offer."
                },
                {
                  q: "Do you offer internships?",
                  a: "Yes, we offer paid internships during summer and throughout the year. Check our open positions."
                }
              ].map((faq, index) => (
                <Card key={index} className="zyphex-card">
                  <CardHeader>
                    <CardTitle className="text-lg zyphex-heading">{faq.q}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="zyphex-subheading">{faq.a}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding zyphex-gradient-bg text-white relative overflow-hidden">
        <SubtleBackground />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full animate-float-3d"></div>
          <div className="absolute bottom-10 right-10 w-24 h-24 bg-white rounded-full animate-float-3d"></div>
        </div>
        <div className="container mx-auto container-padding text-center relative z-10">
          <div className="max-w-3xl mx-auto space-y-8 scroll-reveal">
            <h2 className="text-3xl lg:text-4xl font-bold zyphex-heading">Ready to Make an Impact?</h2>
            <p className="text-xl zyphex-subheading">
              Join our team and help us build the future of remote IT services. Your next great opportunity is waiting.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="secondary"
                className="text-lg px-8 py-6 zyphex-button-secondary hover-zyphex-lift"
                asChild
              >
                <a href="#open-positions">
                  Browse Open Positions
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 border-white text-white hover:bg-white hover:text-blue-600 bg-transparent"
                asChild
              >
                <Link href="/contact">Contact HR Team</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
