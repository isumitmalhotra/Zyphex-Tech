"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  ArrowLeft, 
  Briefcase, 
  MapPin, 
  Clock, 
  DollarSign,
  Upload,
  CheckCircle2,
  Loader2
} from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useScrollAnimation } from "@/components/scroll-animations"
import { SubtleBackground } from "@/components/subtle-background"
import { useToast } from "@/hooks/use-toast"

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

// Mock Job Positions Data (same as careers page)
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

export default function JobDetailPage() {
  useScrollAnimation()
  const params = useParams()
  const { toast } = useToast()
  const jobId = params.id as string

  const [job, setJob] = useState<JobPosition | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    linkedin: "",
    portfolio: "",
    coverLetter: "",
    resume: null as File | null
  })

  useEffect(() => {
    const foundJob = jobPositions.find(j => j.id === jobId)
    if (foundJob) {
      setJob(foundJob)
    }
  }, [jobId])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, resume: e.target.files![0] }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false)
      toast({
        title: "Application Submitted!",
        description: "We've received your application and will be in touch soon.",
      })
      
      // Reset form
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        linkedin: "",
        portfolio: "",
        coverLetter: "",
        resume: null
      })
    }, 2000)
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Job Not Found</h1>
          <Button asChild>
            <Link href="/careers">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Careers
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Header with Back Button */}
      <section className="zyphex-gradient-bg section-padding relative">
        <SubtleBackground />
        <div className="container mx-auto container-padding relative z-10">
          <div className="mb-8">
            <Button variant="outline" asChild className="border-white text-white hover:bg-white hover:text-blue-600">
              <Link href="/careers">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to All Positions
              </Link>
            </Button>
          </div>
          
          <div className="max-w-4xl space-y-6 scroll-reveal">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl lg:text-5xl font-bold zyphex-heading">{job.title}</h1>
              {job.remote && (
                <Badge variant="secondary" className="zyphex-blue-glow text-base px-3 py-1">
                  Remote
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-6 flex-wrap text-white">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                <span>{job.department}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                <span>{job.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <span>{job.type}</span>
              </div>
              {job.salary && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  <span>{job.salary}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Job Details and Application Form */}
      <section className="section-padding zyphex-section-bg relative">
        <SubtleBackground />
        <div className="container mx-auto container-padding relative z-10">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Job Details */}
            <div className="lg:col-span-2 space-y-8">
              <Card className="zyphex-card scroll-reveal">
                <CardHeader>
                  <CardTitle className="text-2xl zyphex-heading">About the Role</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-lg zyphex-subheading leading-relaxed">{job.description}</p>
                  
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold zyphex-heading">Responsibilities</h3>
                    <ul className="space-y-2">
                      {job.responsibilities.map((resp, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span className="zyphex-subheading">{resp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold zyphex-heading">Requirements</h3>
                    <ul className="space-y-2">
                      {job.requirements.map((req, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span className="zyphex-subheading">{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Benefits Preview */}
              <Card className="zyphex-card scroll-reveal">
                <CardHeader>
                  <CardTitle className="text-2xl zyphex-heading">What We Offer</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium zyphex-heading">Competitive Salary</p>
                        <p className="text-sm zyphex-subheading">Top market rates</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium zyphex-heading">Health Benefits</p>
                        <p className="text-sm zyphex-subheading">Full coverage</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium zyphex-heading">Remote Work</p>
                        <p className="text-sm zyphex-subheading">Work from anywhere</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium zyphex-heading">Unlimited PTO</p>
                        <p className="text-sm zyphex-subheading">Take time when needed</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Application Form */}
            <div className="lg:col-span-1">
              <Card className="zyphex-card sticky top-8 scroll-reveal">
                <CardHeader>
                  <CardTitle className="text-2xl zyphex-heading">Apply Now</CardTitle>
                  <CardDescription>Submit your application for this position</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required
                        placeholder="John Doe"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        placeholder="john@example.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="linkedin">LinkedIn Profile</Label>
                      <Input
                        id="linkedin"
                        name="linkedin"
                        value={formData.linkedin}
                        onChange={handleInputChange}
                        placeholder="https://linkedin.com/in/..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="portfolio">Portfolio/Website</Label>
                      <Input
                        id="portfolio"
                        name="portfolio"
                        value={formData.portfolio}
                        onChange={handleInputChange}
                        placeholder="https://yourportfolio.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="coverLetter">Cover Letter *</Label>
                      <Textarea
                        id="coverLetter"
                        name="coverLetter"
                        value={formData.coverLetter}
                        onChange={handleInputChange}
                        required
                        rows={4}
                        placeholder="Tell us why you're a great fit..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="resume">Resume/CV *</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="resume"
                          name="resume"
                          type="file"
                          onChange={handleFileChange}
                          required
                          accept=".pdf,.doc,.docx"
                          className="cursor-pointer"
                        />
                        <Upload className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        PDF, DOC, or DOCX (Max 5MB)
                      </p>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full zyphex-button-primary"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Submit Application"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* More Positions CTA */}
      <section className="section-padding bg-slate-900/50 relative">
        <SubtleBackground />
        <div className="container mx-auto container-padding text-center relative z-10">
          <div className="max-w-2xl mx-auto space-y-6 scroll-reveal">
            <h2 className="text-2xl lg:text-3xl font-bold zyphex-heading">
              Interested in Other Positions?
            </h2>
            <p className="text-lg zyphex-subheading">
              Check out our other open positions and find your perfect fit
            </p>
            <Button size="lg" variant="outline" asChild>
              <Link href="/careers">
                View All Open Positions
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
