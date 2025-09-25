"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, CheckCircle, Star, Quote } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import InteractiveShowcase from "@/components/interactive-showcase"
import { Hero3DClean } from "@/components/hero-3d-clean"
import { SubtleBackground, MinimalParticles } from "@/components/subtle-background"
import { Icon3D } from "@/components/3d-icons"
import { useScrollAnimation } from "@/components/scroll-animations"
import { useEffect, useState } from "react"

// Define types for our content
interface ContentSection {
  id: string
  sectionKey: string
  title: string | null
  subtitle: string | null
  content: {
    description?: string
    ctaText?: string
    ctaSecondary?: string
    features?: string[]
    reasons?: Array<{
      title: string
      description: string
      icon: string
    }>
  } | string | null
  imageUrl: string | null
  order: number
  createdAt: Date
  updatedAt: Date
}

interface ApiResponse {
  success: boolean
  data: Record<string, ContentSection>
  sections: ContentSection[]
}

async function fetchContentSections(): Promise<Record<string, ContentSection>> {
  try {
    const response = await fetch('/api/content?keys=hero,about,services-intro,why-choose-us,cta', {
      cache: 'no-store' // Client-side fetch, don't use server-side caching options
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch content')
    }
    
    const data: ApiResponse = await response.json()
    return data.success ? data.data : {}
  } catch (error) {
    console.error('Error fetching content sections:', error)
    // Return fallback content if API fails
    return {
      hero: {
        id: 'fallback',
        sectionKey: 'hero',
        title: 'Transform Your Business with Remote Excellence',
        subtitle: 'Leading Remote IT Solutions Provider',
        content: {
          description: 'Zyphex Tech delivers innovative technology solutions through expert remote teams. From custom software to cloud migration, we drive growth and efficiency from anywhere in the world.',
          ctaText: 'Get Free Consultation',
          ctaSecondary: 'View Our Work'
        },
        imageUrl: null,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    } as Record<string, ContentSection>
  }
}

export default function HomePage() {
  const [contentSections, setContentSections] = useState<Record<string, ContentSection>>({
    hero: {
      id: 'default',
      sectionKey: 'hero',
      title: 'Transform Your Business with Remote Excellence',
      subtitle: 'Leading Remote IT Solutions Provider',
      content: {
        description: 'Zyphex Tech delivers innovative technology solutions through expert remote teams. From custom software to cloud migration, we drive growth and efficiency from anywhere in the world.',
        ctaText: 'Get Free Consultation',
        ctaSecondary: 'View Our Work'
      },
      imageUrl: null,
      order: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  } as Record<string, ContentSection>)
  
  useScrollAnimation()

  useEffect(() => {
    // Trigger initial animations for hero section after a short delay
    const timer = setTimeout(() => {
      const heroElements = document.querySelectorAll('.scroll-reveal-left, .scroll-reveal-scale, .scroll-reveal')
      heroElements.forEach((el) => {
        const rect = el.getBoundingClientRect()
        // If element is in the top portion of the viewport, animate it immediately
        if (rect.top < window.innerHeight * 0.8) {
          el.classList.add('revealed')
        }
      })
    }, 200)

    // Try to fetch dynamic content but don't break if it fails
    const fetchData = async () => {
      try {
        const sections = await fetchContentSections()
        console.log('Fetched dynamic sections:', sections)
        if (sections && Object.keys(sections).length > 0) {
          setContentSections(prev => ({ ...prev, ...sections }))
        }
      } catch (err) {
        console.error('Failed to fetch dynamic content, using static content:', err)
      }
    }
    fetchData()

    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      {/* Hero Section */}
      <section className="relative zyphex-gradient-bg section-padding overflow-hidden">
        <SubtleBackground />
        <MinimalParticles />

        <div className="container mx-auto container-padding relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[80vh] lg:min-h-[70vh]">
            <div className="space-y-6 lg:space-y-8 scroll-reveal-left order-2 lg:order-1">
              <div className="space-y-4 lg:space-y-6">
                <Badge variant="secondary" className="w-fit zyphex-blue-glow animate-zyphex-glow text-xs sm:text-sm">
                  🚀 Leading Remote IT Solutions Provider
                </Badge>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold zyphex-heading leading-tight">
                  {contentSections.hero?.title || 'Transform Your Business with'}
                  <span className="zyphex-accent-text animate-metallic-shine block mt-2">
                    Remote Excellence
                  </span>
                </h1>
                <p className="text-base sm:text-lg lg:text-xl zyphex-subheading leading-relaxed max-w-2xl">
                  {(typeof contentSections.hero?.content === 'object' && contentSections.hero?.content?.description) || contentSections.hero?.subtitle || 'Zyphex Tech delivers innovative technology solutions through expert remote teams. From custom software to cloud migration, we drive growth and efficiency from anywhere in the world.'}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 scroll-reveal-scale">
                <Button size="lg" className="text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 zyphex-button-primary hover-zyphex-lift w-full sm:w-auto" asChild>
                  <Link href="/contact">
                    {(typeof contentSections.hero?.content === 'object' && contentSections.hero?.content?.ctaText) || 'Get Free Consultation'}
                    <ArrowRight className="ml-2 h-4 sm:h-5 w-4 sm:w-5" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 zyphex-button-secondary hover-zyphex-lift bg-transparent w-full sm:w-auto"
                  asChild
                >
                  <Link href="/services">
                    {(typeof contentSections.hero?.content === 'object' && contentSections.hero?.content?.ctaSecondary) || 'View Our Services'}
                  </Link>
                </Button>
              </div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 sm:gap-8 pt-4 scroll-reveal">
                <div className="text-center hover-zyphex-glow transition-all duration-300 cursor-pointer flex-1 min-w-[80px]">
                  <div className="text-xl sm:text-2xl font-bold zyphex-accent-text animate-zyphex-glow">50+</div>
                  <div className="text-xs sm:text-sm zyphex-subheading">Projects Completed</div>
                </div>
                <div className="text-center hover-zyphex-glow transition-all duration-300 cursor-pointer flex-1 min-w-[80px]">
                  <div className="text-xl sm:text-2xl font-bold zyphex-accent-text animate-zyphex-glow">98%</div>
                  <div className="text-xs sm:text-sm zyphex-subheading">Client Satisfaction</div>
                </div>
                <div className="text-center hover-zyphex-glow transition-all duration-300 cursor-pointer flex-1 min-w-[80px]">
                  <div className="text-xl sm:text-2xl font-bold zyphex-accent-text animate-zyphex-glow">24/7</div>
                  <div className="text-xs sm:text-sm zyphex-subheading">Remote Support</div>
                </div>
              </div>
            </div>

            {/* Enhanced Hero Visual with Clean 3D Effects */}
            <div className="scroll-reveal-right order-1 lg:order-2 flex justify-center lg:justify-end">
              <div className="w-full max-w-md lg:max-w-none">
                <Hero3DClean />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Intro */}
      <section className="section-padding bg-slate-900/50 relative">
        <SubtleBackground />
        <div className="container mx-auto container-padding relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-6 scroll-reveal">
            <h2 className="text-3xl lg:text-4xl font-bold zyphex-heading">
              {contentSections.about?.title || 'Empowering Businesses Through Technology'}
            </h2>
            <p className="text-lg zyphex-subheading leading-relaxed">
              {contentSections.about?.subtitle || 'Founded with a vision to bridge the gap between complex technology and business success, our agency combines deep technical expertise with strategic thinking. We don&apos;t just build solutions; we craft digital experiences that transform how businesses operate and grow.'}
            </p>
            <div className="flex justify-center pt-4">
              <Button variant="outline" className="zyphex-button-secondary hover-zyphex-lift bg-transparent" asChild>
                <Link href="/about">
                  {(typeof contentSections.about?.content === 'object' && contentSections.about?.content?.ctaText) || 'Learn More About Us'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Overview */}
      <section className="section-padding zyphex-section-bg relative">
        <SubtleBackground />
        <div className="container mx-auto container-padding relative z-10">
          <div className="text-center space-y-4 mb-16 scroll-reveal">
            <h2 className="text-3xl lg:text-4xl font-bold zyphex-heading">Our Core Services</h2>
            <p className="text-lg zyphex-subheading max-w-2xl mx-auto">
              Comprehensive remote IT solutions tailored to meet your unique business needs
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: "Code",
                title: "Custom Software Development",
                description:
                  "Tailored applications built with cutting-edge technologies to solve your specific business challenges.",
                features: ["Web Applications", "Mobile Apps", "API Development"],
              },
              {
                icon: "Globe",
                title: "Cloud Solutions & Migration",
                description:
                  "Seamless cloud adoption strategies that enhance scalability, security, and cost-effectiveness.",
                features: ["AWS/Azure Migration", "Cloud Architecture", "DevOps Implementation"],
              },
              {
                icon: "Database",
                title: "Data Analytics & BI",
                description:
                  "Transform raw data into actionable insights with advanced analytics and business intelligence solutions.",
                features: ["Data Warehousing", "Real-time Analytics", "Custom Dashboards"],
              },
              {
                icon: "Smartphone",
                title: "Mobile App Development",
                description: "Native and cross-platform mobile applications that deliver exceptional user experiences.",
                features: ["iOS Development", "Android Development", "React Native"],
              },
              {
                icon: "Zap",
                title: "IT Consulting & Strategy",
                description: "Strategic technology guidance to align your IT infrastructure with business objectives.",
                features: ["Technology Roadmap", "Digital Transformation", "IT Audit"],
              },
              {
                icon: "Users",
                title: "Dedicated Development Teams",
                description:
                  "Skilled remote teams that integrate seamlessly with your existing workflows and processes.",
                features: ["Remote Teams", "Staff Augmentation", "Project Management"],
              },
            ].map((service, index) => (
              <Card
                key={index}
                className={`zyphex-card hover-zyphex-lift scroll-reveal-scale`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader className="pb-4">
                  <div className="w-12 h-12 zyphex-gradient-primary rounded-lg flex items-center justify-center mb-4 animate-pulse-3d hover-zyphex-glow">
                    <Icon3D icon={service.icon} size={24} color="white" />
                  </div>
                  <CardTitle className="text-xl zyphex-heading">{service.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="zyphex-subheading leading-relaxed">{service.description}</CardDescription>
                  <ul className="space-y-2">
                    {service.features.map((feature, idx) => (
                      <li
                        key={idx}
                        className="flex items-center gap-2 text-sm zyphex-subheading hover:text-white transition-colors duration-200"
                      >
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-12 scroll-reveal">
            <Button size="lg" className="zyphex-button-primary hover-zyphex-lift" asChild>
              <Link href="/services">
                Explore All Services
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Interactive Service Showcase */}
      <section className="section-padding bg-slate-900/50 relative">
        <SubtleBackground />
        <div className="container mx-auto container-padding relative z-10">
          <div className="text-center space-y-4 mb-16 scroll-reveal">
            <h2 className="text-3xl lg:text-4xl font-bold zyphex-heading">Experience Our Solutions Live</h2>
            <p className="text-lg zyphex-subheading max-w-2xl mx-auto">
              Interact with real examples of our work and see how our solutions can transform your business
            </p>
          </div>

          <div className="scroll-reveal">
            <InteractiveShowcase />
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="section-padding zyphex-section-bg relative">
        <SubtleBackground />
        <div className="container mx-auto container-padding relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 scroll-reveal-left">
              <div className="space-y-4">
                <h2 className="text-3xl lg:text-4xl font-bold zyphex-heading">
                  {contentSections['why-choose-us']?.title || 'Why Leading Companies Choose Us'}
                </h2>
                <p className="text-lg zyphex-subheading">
                  {contentSections['why-choose-us']?.subtitle || 'We combine technical excellence with business acumen to deliver solutions that not only work but drive real results.'}
                </p>
              </div>
              <div className="space-y-6">
                {(typeof contentSections['why-choose-us']?.content === 'object' && 
                  contentSections['why-choose-us']?.content?.reasons) ? 
                  contentSections['why-choose-us'].content.reasons.map((reason, index) => (
                    <div key={index} className="flex gap-4 scroll-reveal" style={{ animationDelay: `${index * 200}ms` }}>
                      <div className="flex items-center justify-center flex-shrink-0 mt-1">
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold zyphex-heading mb-2">{reason.title}</h3>
                        <p className="zyphex-subheading">{reason.description}</p>
                      </div>
                    </div>
                  )) : [
                  {
                    title: "Expert Team",
                    description:
                      "Our developers and consultants stay ahead of technology trends, ensuring you get cutting-edge solutions.",
                  },
                  {
                    title: "Proven Track Record",
                    description: "50+ successful projects across various industries with 98% client satisfaction rate.",
                  },
                  {
                    title: "Agile Methodology",
                    description:
                      "Fast, iterative development process that adapts to your changing needs and delivers value quickly.",
                  },
                  {
                    title: "24/7 Support",
                    description:
                      "Round-the-clock technical support to ensure your systems run smoothly without interruption.",
                  },
                ].map((item, index) => (
                  <div key={index} className="flex gap-4 scroll-reveal" style={{ animationDelay: `${index * 200}ms` }}>
                    <div className="flex items-center justify-center flex-shrink-0 mt-1">
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold zyphex-heading mb-2">{item.title}</h3>
                      <p className="zyphex-subheading">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative scroll-reveal-right">
              <div className="zyphex-3d-card hover-zyphex-lift">
                <Image
                  src="/placeholder.svg?height=500&width=500"
                  alt="Why Choose Zyphex Tech"
                  width={500}
                  height={500}
                  className="rounded-2xl w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Updates / Blog Preview */}
      <section className="section-padding bg-slate-900/50 relative">
        <SubtleBackground />
        <div className="container mx-auto container-padding relative z-10">
          <div className="text-center space-y-4 mb-16 scroll-reveal">
            <h2 className="text-3xl lg:text-4xl font-bold zyphex-heading">Latest Insights & Updates</h2>
            <p className="text-lg zyphex-subheading max-w-2xl mx-auto">
              Stay informed with our latest thoughts on technology trends, best practices, and industry insights
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "The Future of Cloud Computing in 2024",
                excerpt:
                  "Exploring emerging trends in cloud technology and how businesses can leverage them for competitive advantage.",
                date: "Dec 15, 2024",
                category: "Cloud Technology",
                image: "/placeholder.svg?height=200&width=400",
              },
              {
                title: "AI Integration in Business Applications",
                excerpt:
                  "How artificial intelligence is transforming business processes and creating new opportunities for growth.",
                date: "Dec 10, 2024",
                category: "Artificial Intelligence",
                image: "/placeholder.svg?height=200&width=400",
              },
              {
                title: "Cybersecurity Best Practices for SMBs",
                excerpt:
                  "Essential security measures every small and medium business should implement to protect their digital assets.",
                date: "Dec 5, 2024",
                category: "Security",
                image: "/placeholder.svg?height=200&width=400",
              },
            ].map((post, index) => (
              <Card
                key={index}
                className={`zyphex-card hover-zyphex-lift overflow-hidden scroll-reveal-scale`}
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="relative overflow-hidden">
                  <Image
                    src={post.image || "/placeholder.svg"}
                    alt={post.title}
                    width={400}
                    height={200}
                    className="w-full h-48 object-cover hover:scale-110 transition-transform duration-500"
                  />
                  <Badge className="absolute top-4 left-4 zyphex-gradient-primary animate-zyphex-glow">
                    {post.category}
                  </Badge>
                </div>
                <CardHeader>
                  <div className="text-sm zyphex-subheading mb-2">{post.date}</div>
                  <CardTitle className="text-xl zyphex-heading hover:text-blue-400 transition-colors duration-300">
                    {post.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="zyphex-subheading leading-relaxed">{post.excerpt}</CardDescription>
                  <Button
                    variant="ghost"
                    className="mt-4 p-0 h-auto font-medium zyphex-accent-text hover:translate-x-1 transition-all duration-300"
                  >
                    Read More
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-12 scroll-reveal">
            <Button
              variant="outline"
              size="lg"
              className="zyphex-button-secondary hover-zyphex-lift bg-transparent"
              asChild
            >
              <Link href="/updates">
                View All Updates
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Client Testimonials */}
      <section className="section-padding zyphex-section-bg relative">
        <SubtleBackground />
        <div className="container mx-auto container-padding relative z-10">
          <div className="text-center space-y-4 mb-16 scroll-reveal">
            <h2 className="text-3xl lg:text-4xl font-bold zyphex-heading">What Our Clients Say</h2>
            <p className="text-lg zyphex-subheading max-w-2xl mx-auto">
              Don&apos;t just take our word for it - hear from the businesses we&apos;ve helped transform
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Johnson",
                role: "CTO, TechStart Inc.",
                content:
                  "The team delivered an exceptional cloud migration solution that reduced our infrastructure costs by 40% while improving performance. Their expertise and professionalism are unmatched.",
                rating: 5,
              },
              {
                name: "Michael Chen",
                role: "CEO, DataFlow Solutions",
                content:
                  "Working with Zyphex Tech transformed our data analytics capabilities. The custom dashboard they built gives us insights we never had before, directly impacting our decision-making process.",
                rating: 5,
              },
              {
                name: "Emily Rodriguez",
                role: "Operations Director, RetailMax",
                content:
                  "Their mobile app development team created an amazing customer experience for our retail business. Sales through the app increased by 60% in the first quarter after launch.",
                rating: 5,
              },
            ].map((testimonial, index) => (
              <Card
                key={index}
                className={`zyphex-card hover-zyphex-lift relative scroll-reveal-rotate`}
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <CardHeader>
                  <Quote className="h-8 w-8 text-blue-400 mb-4 animate-pulse-3d" />
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-5 w-5 fill-yellow-400 text-yellow-400 animate-zyphex-glow"
                        style={{ animationDelay: `${i * 100}ms` }}
                      />
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="zyphex-subheading leading-relaxed italic">&ldquo;{testimonial.content}&rdquo;</p>
                  <div className="border-t border-gray-700 pt-4">
                    <div className="font-semibold zyphex-heading">{testimonial.name}</div>
                    <div className="text-sm zyphex-subheading">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
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
              Let&apos;s discuss how our IT solutions can drive your business forward. Get a free consultation and discover
              the possibilities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="secondary"
                className="text-lg px-8 py-6 zyphex-button-secondary hover-zyphex-lift"
                asChild
              >
                <Link href="/contact">
                  Start Your Project
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 border-white text-white hover:bg-white hover:text-blue-600 bg-transparent zyphex-button-secondary hover-zyphex-lift"
                asChild
              >
                <Link href="/services">View Services</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
