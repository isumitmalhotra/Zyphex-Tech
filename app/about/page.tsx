"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useScrollAnimation } from "@/components/scroll-animations"
import { SubtleBackground, MinimalParticles } from "@/components/subtle-background"
import { Icon3D } from "@/components/3d-icons"

export default function AboutPage() {
  useScrollAnimation()

  return (
    <>
      {/* Hero Section */}
      <section className="zyphex-gradient-bg section-padding overflow-hidden relative">
        <SubtleBackground />
        <MinimalParticles />
        <div className="container mx-auto container-padding relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge variant="secondary" className="w-fit mx-auto zyphex-blue-glow animate-zyphex-glow scroll-reveal">
              About Zyphex Tech
            </Badge>
            <h1 className="text-4xl lg:text-5xl font-bold zyphex-heading scroll-reveal-scale">
              Building Tomorrow&apos;s Technology Solutions Today
            </h1>
            <p className="text-xl zyphex-subheading leading-relaxed scroll-reveal">
              We are a passionate team of remote technology experts dedicated to transforming businesses through
              innovative IT solutions. Our mission is to bridge the gap between complex technology and business success.
            </p>
          </div>
        </div>
      </section>

      {/* Agency Background */}
      <section className="section-padding zyphex-section-bg relative">
        <SubtleBackground />
        <div className="container mx-auto container-padding relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 scroll-reveal-left">
              <div className="space-y-4">
                <h2 className="text-3xl lg:text-4xl font-bold zyphex-heading">Our Story</h2>
                <p className="text-lg zyphex-subheading leading-relaxed">
                  Founded in 2020 with a vision to democratize access to cutting-edge technology solutions, Zyphex Tech
                  has grown from a small team of passionate developers to a comprehensive remote IT services provider
                  serving clients across various industries.
                </p>
                <p className="text-lg zyphex-subheading leading-relaxed">
                  We believe that every business, regardless of size, deserves access to world-class technology
                  solutions. This belief drives us to deliver exceptional value through innovative approaches,
                  transparent communication, and unwavering commitment to quality.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-8 scroll-reveal">
                <div className="text-center hover-zyphex-glow transition-all duration-300 cursor-pointer">
                  <div className="text-3xl font-bold zyphex-accent-text mb-2 animate-zyphex-glow">50+</div>
                  <div className="zyphex-subheading">Projects Delivered</div>
                </div>
                <div className="text-center hover-zyphex-glow transition-all duration-300 cursor-pointer">
                  <div className="text-3xl font-bold zyphex-accent-text mb-2 animate-zyphex-glow">25+</div>
                  <div className="zyphex-subheading">Happy Clients</div>
                </div>
                <div className="text-center hover-zyphex-glow transition-all duration-300 cursor-pointer">
                  <div className="text-3xl font-bold zyphex-accent-text mb-2 animate-zyphex-glow">4+</div>
                  <div className="zyphex-subheading">Years Experience</div>
                </div>
                <div className="text-center hover-zyphex-glow transition-all duration-300 cursor-pointer">
                  <div className="text-3xl font-bold zyphex-accent-text mb-2 animate-zyphex-glow">98%</div>
                  <div className="zyphex-subheading">Client Satisfaction</div>
                </div>
              </div>
            </div>
            <div className="relative scroll-reveal-right">
              <div className="zyphex-3d-card hover-zyphex-lift">
                <Image
                  src="/placeholder.svg?height=500&width=500"
                  alt="Zyphex Tech Office"
                  width={500}
                  height={500}
                  className="rounded-2xl w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission, Vision, Values */}
      <section className="section-padding bg-slate-900/50 relative">
        <SubtleBackground />
        <div className="container mx-auto container-padding relative z-10">
          <div className="text-center space-y-4 mb-16 scroll-reveal">
            <h2 className="text-3xl lg:text-4xl font-bold zyphex-heading">Our Foundation</h2>
            <p className="text-lg zyphex-subheading max-w-2xl mx-auto">The principles that guide everything we do</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center zyphex-card hover-zyphex-lift scroll-reveal-scale">
              <CardHeader className="pb-4">
                <div className="w-16 h-16 zyphex-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-3d hover-zyphex-glow">
                  <Icon3D icon="Target" size={32} color="white" />
                </div>
                <CardTitle className="text-2xl zyphex-heading">Our Mission</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="zyphex-subheading leading-relaxed text-base">
                  To empower businesses with innovative remote technology solutions that drive growth, enhance
                  efficiency, and create competitive advantages in the digital landscape.
                </CardDescription>
              </CardContent>
            </Card>
            <Card
              className="text-center zyphex-card hover-zyphex-lift scroll-reveal-scale"
              style={{ animationDelay: "200ms" }}
            >
              <CardHeader className="pb-4">
                <div className="w-16 h-16 zyphex-gradient-secondary rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-3d hover-zyphex-glow">
                  <Icon3D icon="Award" size={32} color="#0080ff" />
                </div>
                <CardTitle className="text-2xl zyphex-heading">Our Vision</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="zyphex-subheading leading-relaxed text-base">
                  To be the leading remote IT services agency recognized for delivering transformative technology
                  solutions that shape the future of business operations worldwide.
                </CardDescription>
              </CardContent>
            </Card>
            <Card
              className="text-center zyphex-card hover-zyphex-lift scroll-reveal-scale"
              style={{ animationDelay: "400ms" }}
            >
              <CardHeader className="pb-4">
                <div className="w-16 h-16 zyphex-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-3d hover-zyphex-glow">
                  <Icon3D icon="Heart" size={32} color="white" />
                </div>
                <CardTitle className="text-2xl zyphex-heading">Our Values</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="zyphex-subheading leading-relaxed text-base">
                  Excellence, integrity, innovation, and client success. We believe in transparent communication,
                  continuous learning, and building long-term partnerships.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Core Team Section */}
      <section className="section-padding zyphex-section-bg relative">
        <SubtleBackground />
        <div className="container mx-auto container-padding relative z-10">
          <div className="text-center space-y-4 mb-16 scroll-reveal">
            <h2 className="text-3xl lg:text-4xl font-bold zyphex-heading">Meet Our Leadership Team</h2>
            <p className="text-lg zyphex-subheading max-w-2xl mx-auto">
              The visionaries and experts driving our agency&apos;s success
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="text-center zyphex-card hover-zyphex-lift scroll-reveal-rotate">
              <CardHeader className="pb-4">
                <div className="relative mx-auto mb-4">
                  <Image
                    src="/placeholder.svg?height=200&width=200"
                    alt="Ishan Garg"
                    width={200}
                    height={200}
                    className="w-32 h-32 rounded-full object-cover mx-auto hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <CardTitle className="text-xl zyphex-heading">Ishan Garg</CardTitle>
                <CardDescription className="zyphex-accent-text font-medium">Co-Founder & CTO</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="zyphex-subheading text-sm leading-relaxed">
                  Ishan brings over 8 years of experience in software architecture and cloud solutions. He specializes
                  in scalable system design and leads our technical innovation initiatives.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Badge
                    variant="secondary"
                    className="hover:bg-blue-600 hover:text-white transition-colors duration-200"
                  >
                    Cloud Architecture
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="hover:bg-blue-600 hover:text-white transition-colors duration-200"
                  >
                    System Design
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="hover:bg-blue-600 hover:text-white transition-colors duration-200"
                  >
                    DevOps
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card
              className="text-center zyphex-card hover-zyphex-lift scroll-reveal-rotate"
              style={{ animationDelay: "200ms" }}
            >
              <CardHeader className="pb-4">
                <div className="relative mx-auto mb-4">
                  <Image
                    src="/placeholder.svg?height=200&width=200"
                    alt="Sumit Malhotra"
                    width={200}
                    height={200}
                    className="w-32 h-32 rounded-full object-cover mx-auto hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <CardTitle className="text-xl zyphex-heading">Sumit Malhotra</CardTitle>
                <CardDescription className="zyphex-accent-text font-medium">Co-Founder & CEO</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="zyphex-subheading text-sm leading-relaxed">
                  Sumit combines business acumen with technical expertise to drive strategic growth. He focuses on
                  client relationships and ensuring our solutions deliver measurable business value.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Badge
                    variant="secondary"
                    className="hover:bg-blue-600 hover:text-white transition-colors duration-200"
                  >
                    Business Strategy
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="hover:bg-blue-600 hover:text-white transition-colors duration-200"
                  >
                    Client Relations
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="hover:bg-blue-600 hover:text-white transition-colors duration-200"
                  >
                    Product Management
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card
              className="text-center zyphex-card hover-zyphex-lift scroll-reveal-rotate md:col-span-2 lg:col-span-1"
              style={{ animationDelay: "400ms" }}
            >
              <CardHeader className="pb-4">
                <div className="relative mx-auto mb-4">
                  <Image
                    src="/placeholder.svg?height=200&width=200"
                    alt="Development Team"
                    width={200}
                    height={200}
                    className="w-32 h-32 rounded-full object-cover mx-auto hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <CardTitle className="text-xl zyphex-heading">Our Expert Team</CardTitle>
                <CardDescription className="zyphex-accent-text font-medium">
                  Senior Developers & Consultants
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="zyphex-subheading text-sm leading-relaxed">
                  Our team of senior developers, designers, and consultants brings diverse expertise across multiple
                  technologies and industries to deliver exceptional results.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Badge
                    variant="secondary"
                    className="hover:bg-blue-600 hover:text-white transition-colors duration-200"
                  >
                    Full-Stack Development
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="hover:bg-blue-600 hover:text-white transition-colors duration-200"
                  >
                    UI/UX Design
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="hover:bg-blue-600 hover:text-white transition-colors duration-200"
                  >
                    Quality Assurance
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Technologies & Skills */}
      <section className="section-padding bg-slate-900/50 relative">
        <SubtleBackground />
        <div className="container mx-auto container-padding relative z-10">
          <div className="text-center space-y-4 mb-16 scroll-reveal">
            <h2 className="text-3xl lg:text-4xl font-bold zyphex-heading">Our Technology Stack</h2>
            <p className="text-lg zyphex-subheading max-w-2xl mx-auto">
              We stay at the forefront of technology to deliver cutting-edge solutions
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center zyphex-card hover-zyphex-lift scroll-reveal-scale">
              <CardHeader className="pb-4">
                <div className="w-16 h-16 zyphex-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-3d hover-zyphex-glow">
                  <Icon3D icon="Code" size={32} color="white" />
                </div>
                <CardTitle className="text-lg zyphex-heading">Frontend Development</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Badge
                    variant="outline"
                    className="hover:bg-blue-600 hover:text-white transition-colors duration-200"
                  >
                    React
                  </Badge>
                  <Badge
                    variant="outline"
                    className="hover:bg-blue-600 hover:text-white transition-colors duration-200"
                  >
                    Next.js
                  </Badge>
                  <Badge
                    variant="outline"
                    className="hover:bg-blue-600 hover:text-white transition-colors duration-200"
                  >
                    Vue.js
                  </Badge>
                  <Badge
                    variant="outline"
                    className="hover:bg-blue-600 hover:text-white transition-colors duration-200"
                  >
                    TypeScript
                  </Badge>
                  <Badge
                    variant="outline"
                    className="hover:bg-blue-600 hover:text-white transition-colors duration-200"
                  >
                    Tailwind CSS
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card
              className="text-center zyphex-card hover-zyphex-lift scroll-reveal-scale"
              style={{ animationDelay: "150ms" }}
            >
              <CardHeader className="pb-4">
                <div className="w-16 h-16 zyphex-gradient-secondary rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-3d hover-zyphex-glow">
                  <Icon3D icon="Database" size={32} color="#0080ff" />
                </div>
                <CardTitle className="text-lg zyphex-heading">Backend & Database</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Badge
                    variant="outline"
                    className="hover:bg-blue-600 hover:text-white transition-colors duration-200"
                  >
                    Node.js
                  </Badge>
                  <Badge
                    variant="outline"
                    className="hover:bg-blue-600 hover:text-white transition-colors duration-200"
                  >
                    Python
                  </Badge>
                  <Badge
                    variant="outline"
                    className="hover:bg-blue-600 hover:text-white transition-colors duration-200"
                  >
                    PostgreSQL
                  </Badge>
                  <Badge
                    variant="outline"
                    className="hover:bg-blue-600 hover:text-white transition-colors duration-200"
                  >
                    MongoDB
                  </Badge>
                  <Badge
                    variant="outline"
                    className="hover:bg-blue-600 hover:text-white transition-colors duration-200"
                  >
                    Redis
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card
              className="text-center zyphex-card hover-zyphex-lift scroll-reveal-scale"
              style={{ animationDelay: "300ms" }}
            >
              <CardHeader className="pb-4">
                <div className="w-16 h-16 zyphex-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-3d hover-zyphex-glow">
                  <Icon3D icon="Cloud" size={32} color="white" />
                </div>
                <CardTitle className="text-lg zyphex-heading">Cloud & DevOps</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Badge
                    variant="outline"
                    className="hover:bg-blue-600 hover:text-white transition-colors duration-200"
                  >
                    AWS
                  </Badge>
                  <Badge
                    variant="outline"
                    className="hover:bg-blue-600 hover:text-white transition-colors duration-200"
                  >
                    Azure
                  </Badge>
                  <Badge
                    variant="outline"
                    className="hover:bg-blue-600 hover:text-white transition-colors duration-200"
                  >
                    Docker
                  </Badge>
                  <Badge
                    variant="outline"
                    className="hover:bg-blue-600 hover:text-white transition-colors duration-200"
                  >
                    Kubernetes
                  </Badge>
                  <Badge
                    variant="outline"
                    className="hover:bg-blue-600 hover:text-white transition-colors duration-200"
                  >
                    CI/CD
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card
              className="text-center zyphex-card hover-zyphex-lift scroll-reveal-scale"
              style={{ animationDelay: "450ms" }}
            >
              <CardHeader className="pb-4">
                <div className="w-16 h-16 zyphex-gradient-secondary rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-3d hover-zyphex-glow">
                  <Icon3D icon="Smartphone" size={32} color="#0080ff" />
                </div>
                <CardTitle className="text-lg zyphex-heading">Mobile Development</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Badge
                    variant="outline"
                    className="hover:bg-blue-600 hover:text-white transition-colors duration-200"
                  >
                    React Native
                  </Badge>
                  <Badge
                    variant="outline"
                    className="hover:bg-blue-600 hover:text-white transition-colors duration-200"
                  >
                    Flutter
                  </Badge>
                  <Badge
                    variant="outline"
                    className="hover:bg-blue-600 hover:text-white transition-colors duration-200"
                  >
                    iOS Native
                  </Badge>
                  <Badge
                    variant="outline"
                    className="hover:bg-blue-600 hover:text-white transition-colors duration-200"
                  >
                    Android Native
                  </Badge>
                  <Badge
                    variant="outline"
                    className="hover:bg-blue-600 hover:text-white transition-colors duration-200"
                  >
                    PWA
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Agency Culture */}
      <section className="section-padding zyphex-section-bg relative">
        <SubtleBackground />
        <div className="container mx-auto container-padding relative z-10">
          <div className="text-center space-y-4 mb-16 scroll-reveal">
            <h2 className="text-3xl lg:text-4xl font-bold zyphex-heading">Our Culture & Values</h2>
            <p className="text-lg zyphex-subheading max-w-2xl mx-auto">
              What makes our remote team unique and drives our success
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Continuous Learning",
                description:
                  "We invest in our team's growth through regular training, certifications, and conference attendance to stay ahead of technology trends.",
              },
              {
                title: "Remote Collaboration",
                description:
                  "Our distributed team culture encourages knowledge sharing, creative problem-solving, and collective success across time zones.",
              },
              {
                title: "Work-Life Balance",
                description:
                  "We believe that happy, well-rested team members produce the best work. Flexible schedules and remote work options support this philosophy.",
              },
              {
                title: "Innovation Focus",
                description:
                  "We allocate time for experimentation and innovation, encouraging our team to explore new technologies and approaches.",
              },
              {
                title: "Client-Centric Approach",
                description:
                  "Every decision we make is guided by what's best for our clients' success and long-term partnership.",
              },
              {
                title: "Quality Excellence",
                description:
                  "We maintain high standards through code reviews, testing protocols, and continuous improvement processes.",
              },
            ].map((value, index) => (
              <Card
                key={index}
                className="zyphex-card hover-zyphex-lift scroll-reveal-scale"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader>
                  <CardTitle className="text-xl zyphex-accent-text hover:text-blue-300 transition-colors duration-300">
                    {value.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="zyphex-subheading leading-relaxed">{value.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
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
            <h2 className="text-3xl lg:text-4xl font-bold zyphex-heading">Ready to Work with Our Team?</h2>
            <p className="text-xl zyphex-subheading">
              Let&apos;s discuss how our expertise and passion can help transform your business. Get in touch for a free
              consultation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="secondary"
                className="text-lg px-8 py-6 zyphex-button-secondary hover-zyphex-lift"
                asChild
              >
                <Link href="/contact">
                  Start a Conversation
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 border-white text-white hover:bg-white hover:text-blue-600 bg-transparent zyphex-button-secondary hover-zyphex-lift"
                asChild
              >
                <Link href="/services">View Our Services</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
