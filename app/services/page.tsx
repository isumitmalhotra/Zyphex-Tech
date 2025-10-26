import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, CheckCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Icon3D } from "@/components/3d-icons"
import { SubtleBackground, MinimalParticles } from "@/components/subtle-background"
import { ServicesGrid } from "@/components/services-grid"

// Define types for our services
interface Service {
  id: string
  title: string
  description: string
  icon: string | null
  imageUrl: string | null
  features: string[] | string | null
  isActive: boolean
  order: number
  pricing?: string
  timeline?: string
  technologies?: string[]
  createdAt: Date
  updatedAt: Date
}

// Fetch services from API
async function fetchServices(): Promise<Service[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/services`, {
      cache: 'no-store' // Always get fresh data
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch services')
    }
    
    return await response.json()
  } catch (_error) {
    return []
  }
}

// Helper function to parse features
function parseFeatures(features: string[] | string | null): string[] {
  if (!features) return []
  if (Array.isArray(features)) return features
  try {
    return JSON.parse(features)
  } catch {
    return [features]
  }
}

export const dynamic = 'force-dynamic';

export default async function ServicesPage() {
  const services = await fetchServices()

  return (
    <ServicesGrid>
      {/* Hero Section */}
      <section className="zyphex-gradient-bg section-padding overflow-hidden relative">
        <SubtleBackground />
        <MinimalParticles />
        <div className="container mx-auto container-padding relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge variant="secondary" className="w-fit mx-auto zyphex-blue-glow animate-zyphex-glow scroll-reveal">
              Our Services
            </Badge>
            <h1 className="text-4xl lg:text-5xl font-bold zyphex-heading scroll-reveal-scale">
              Comprehensive Remote IT Solutions for Every Business Need
            </h1>
            <p className="text-xl zyphex-subheading leading-relaxed scroll-reveal">
              From custom software development to cloud migration, we offer a complete suite of remote IT services
              designed to transform your business and drive sustainable growth.
            </p>
            <Button size="lg" className="zyphex-button-primary hover-zyphex-lift scroll-reveal" asChild>
              <Link href="/contact">
                Get Free Consultation
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="section-padding zyphex-section-bg">
        <div className="container mx-auto container-padding">
          <div className="grid gap-12">
            {services.map((service, index) => (
              <Card
                key={index}
                className={`zyphex-card hover-zyphex-lift overflow-hidden scroll-reveal-scale`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="grid lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 p-8">
                    <CardHeader className="p-0 mb-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 zyphex-gradient-primary rounded-lg flex items-center justify-center animate-pulse-3d hover-zyphex-glow">
                          <Icon3D icon={service.icon || 'Code'} size={24} color="white" />
                        </div>
                        <div>
                          <CardTitle className="text-2xl zyphex-heading hover:text-blue-400 transition-colors duration-300">
                            {service.title}
                          </CardTitle>
                          <div className="flex items-center gap-4 mt-2 text-sm zyphex-subheading">
                            <span>💰 {service.pricing || 'Contact for pricing'}</span>
                            <span>⏱️ {service.timeline || 'Contact for timeline'}</span>
                          </div>
                        </div>
                      </div>
                      <CardDescription className="zyphex-subheading text-base leading-relaxed">
                        {service.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 space-y-6">
                      <div>
                        <h4 className="font-semibold zyphex-heading mb-3">Key Features:</h4>
                        <div className="grid md:grid-cols-2 gap-2">
                          {parseFeatures(service.features).map((feature: string, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 hover:text-blue-400 transition-colors duration-200"
                            >
                              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                              <span className="text-sm zyphex-subheading">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold zyphex-heading mb-3">Technologies:</h4>
                        <div className="flex flex-wrap gap-2">
                          {(service.technologies || []).map((tech: string, idx: number) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="text-xs hover:bg-blue-600 hover:text-white transition-colors duration-200"
                            >
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-4 pt-4">
                        <Button className="zyphex-button-primary hover-zyphex-lift" asChild>
                          <Link href="/contact">
                            Get Quote
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          className="zyphex-button-secondary hover-zyphex-lift bg-transparent"
                          asChild
                        >
                          <Link href="/contact">Learn More</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </div>
                  <div className="lg:col-span-1 bg-slate-800/50 p-8 flex items-center justify-center">
                    <div className="zyphex-3d-card hover-zyphex-lift">
                      <Image
                        src={`/abstract-geometric-shapes.png?height=300&width=300&query=${service.title.toLowerCase().replace(/\s+/g, "-")}-technology-illustration`}
                        alt={service.title}
                        width={300}
                        height={300}
                        className="rounded-lg w-full h-auto"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="section-padding bg-slate-900/50">
        <div className="container mx-auto container-padding">
          <div className="text-center space-y-4 mb-16 scroll-reveal">
            <h2 className="text-3xl lg:text-4xl font-bold zyphex-heading">Our Development Process</h2>
            <p className="text-lg zyphex-subheading max-w-2xl mx-auto">
              A proven methodology that ensures successful project delivery and client satisfaction
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Discovery & Planning",
                description: "We analyze your requirements, define project scope, and create a detailed roadmap.",
              },
              {
                step: "02",
                title: "Design & Architecture",
                description: "Our team designs the solution architecture and creates user-friendly interfaces.",
              },
              {
                step: "03",
                title: "Development & Testing",
                description: "Agile development with continuous testing to ensure quality and functionality.",
              },
              {
                step: "04",
                title: "Deployment & Support",
                description: "Smooth deployment with ongoing support and maintenance for optimal performance.",
              },
            ].map((process, index) => (
              <Card
                key={index}
                className="text-center zyphex-card hover-zyphex-lift scroll-reveal-scale"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <CardHeader className="pb-4">
                  <div className="w-16 h-16 zyphex-gradient-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold animate-pulse-3d hover-zyphex-glow">
                    {process.step}
                  </div>
                  <CardTitle className="text-xl zyphex-heading">{process.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="zyphex-subheading leading-relaxed">{process.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Engagement Models */}
      <section className="section-padding zyphex-section-bg">
        <div className="container mx-auto container-padding">
          <div className="text-center space-y-4 mb-16 scroll-reveal">
            <h2 className="text-3xl lg:text-4xl font-bold zyphex-heading">Flexible Engagement Models</h2>
            <p className="text-lg zyphex-subheading max-w-2xl mx-auto">
              Choose the engagement model that best fits your project requirements and budget
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 border-gray-700 hover:border-blue-500 zyphex-card hover-zyphex-lift scroll-reveal-scale">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl zyphex-accent-text">Fixed Price Projects</CardTitle>
                <CardDescription className="zyphex-subheading">
                  Perfect for well-defined projects with clear requirements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center gap-2 hover:text-blue-400 transition-colors duration-200">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="zyphex-subheading">Fixed scope and timeline</span>
                  </li>
                  <li className="flex items-center gap-2 hover:text-blue-400 transition-colors duration-200">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="zyphex-subheading">Predictable costs</span>
                  </li>
                  <li className="flex items-center gap-2 hover:text-blue-400 transition-colors duration-200">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="zyphex-subheading">Milestone-based delivery</span>
                  </li>
                  <li className="flex items-center gap-2 hover:text-blue-400 transition-colors duration-200">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="zyphex-subheading">Quality assurance included</span>
                  </li>
                </ul>
                <Button className="w-full mt-6 zyphex-button-primary hover-zyphex-lift" asChild>
                  <Link href="/contact">Get Quote</Link>
                </Button>
              </CardContent>
            </Card>

            <Card
              className="border-2 border-blue-500 zyphex-card relative hover-zyphex-lift scroll-reveal-scale"
              style={{ animationDelay: "200ms" }}
            >
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-lg px-4 py-1 font-semibold animate-zyphex-glow">
                Most Popular
              </Badge>
              <CardHeader className="text-center pb-4 pt-6">
                <CardTitle className="text-2xl zyphex-accent-text">Dedicated Teams</CardTitle>
                <CardDescription className="zyphex-subheading">
                  Ideal for long-term projects requiring ongoing development
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center gap-2 hover:text-blue-400 transition-colors duration-200">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="zyphex-subheading">Dedicated team members</span>
                  </li>
                  <li className="flex items-center gap-2 hover:text-blue-400 transition-colors duration-200">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="zyphex-subheading">Flexible scaling</span>
                  </li>
                  <li className="flex items-center gap-2 hover:text-blue-400 transition-colors duration-200">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="zyphex-subheading">Direct communication</span>
                  </li>
                  <li className="flex items-center gap-2 hover:text-blue-400 transition-colors duration-200">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="zyphex-subheading">Agile methodology</span>
                  </li>
                </ul>
                <Button className="w-full mt-6 zyphex-button-primary hover-zyphex-lift" asChild>
                  <Link href="/contact">Start Discussion</Link>
                </Button>
              </CardContent>
            </Card>

            <Card
              className="border-2 border-gray-700 hover:border-blue-500 zyphex-card hover-zyphex-lift scroll-reveal-scale"
              style={{ animationDelay: "400ms" }}
            >
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl zyphex-accent-text">Hourly Consulting</CardTitle>
                <CardDescription className="zyphex-subheading">
                  Best for short-term consulting and technical guidance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center gap-2 hover:text-blue-400 transition-colors duration-200">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="zyphex-subheading">Pay for actual hours</span>
                  </li>
                  <li className="flex items-center gap-2 hover:text-blue-400 transition-colors duration-200">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="zyphex-subheading">Expert consultation</span>
                  </li>
                  <li className="flex items-center gap-2 hover:text-blue-400 transition-colors duration-200">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="zyphex-subheading">Flexible engagement</span>
                  </li>
                  <li className="flex items-center gap-2 hover:text-blue-400 transition-colors duration-200">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="zyphex-subheading">Quick turnaround</span>
                  </li>
                </ul>
                <Button className="w-full mt-6 zyphex-button-primary hover-zyphex-lift" asChild>
                  <Link href="/contact">Book Consultation</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding zyphex-gradient-bg text-white relative overflow-hidden">
        <SubtleBackground />
        <div className="container mx-auto container-padding text-center relative z-10">
          <div className="max-w-3xl mx-auto space-y-8 scroll-reveal">
            <h2 className="text-3xl lg:text-4xl font-bold zyphex-heading">Ready to Transform Your Business?</h2>
            <p className="text-xl zyphex-subheading">
              Let&apos;s discuss your project requirements and find the perfect solution for your business needs. Get a free
              consultation and detailed project proposal.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="secondary"
                className="text-lg px-8 py-6 zyphex-button-secondary hover-zyphex-lift"
                asChild
              >
                <Link href="/contact">
                  Get Free Consultation
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 border-white text-white hover:bg-white hover:text-blue-600 bg-transparent zyphex-button-secondary hover-zyphex-lift"
                asChild
              >
                <Link href="/about">Learn About Us</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </ServicesGrid>
  )
}
