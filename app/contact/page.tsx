"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Phone, Mail, MapPin, Clock, Send, MessageSquare, Calendar, Users } from "lucide-react"
import Link from "next/link"
import { useScrollAnimation } from "@/components/scroll-animations"
import { SubtleBackground, MinimalParticles } from "@/components/subtle-background"
import { useState } from "react"
import { toast } from "sonner"

export default function ContactPage() {
  useScrollAnimation()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    service: '',
    budget: '',
    message: '',
    newsletter: false,
    terms: false
  })

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setIsSubmitted(true)
        toast.success('Message sent successfully! We&apos;ll get back to you within 24 hours.')
        // Reset form
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          company: '',
          service: '',
          budget: '',
          message: '',
          newsletter: false,
          terms: false
        })
      } else {
        toast.error(data.error || 'Failed to send message. Please try again.')
      }
    } catch (error) {
      // Log error without importing logger (client-side)
      if (process.env.NODE_ENV === 'development') {
        console.error('Form submission error:', error)
      }
      toast.error('Network error. Please check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* Hero Section */}
      <section className="zyphex-gradient-bg section-padding overflow-hidden relative">
        <SubtleBackground />
        <MinimalParticles />
        <div className="container mx-auto container-padding relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge variant="secondary" className="w-fit mx-auto zyphex-blue-glow animate-zyphex-glow scroll-reveal">
              Get In Touch
            </Badge>
            <h1 className="text-4xl lg:text-5xl font-bold zyphex-heading scroll-reveal-scale">
              Let&apos;s Build Something Amazing Together
            </h1>
            <p className="text-xl zyphex-subheading leading-relaxed scroll-reveal">
              Ready to transform your business with cutting-edge remote technology? We&apos;re here to help. Get in touch for
              a free consultation and let&apos;s discuss your project requirements.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="section-padding zyphex-section-bg">
        <div className="container mx-auto container-padding">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Contact Form */}
            <div className="lg:col-span-2 scroll-reveal-left">
              <Card className="zyphex-card hover-zyphex-lift">
                <CardHeader className="pb-6">
                  <CardTitle className="text-2xl zyphex-heading">Send Us a Message</CardTitle>
                  <CardDescription className="zyphex-subheading">
                    Fill out the form below and we&apos;ll get back to you within 24 hours.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isSubmitted ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Send className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold zyphex-heading mb-2">Message Sent Successfully!</h3>
                      <p className="zyphex-subheading mb-4">Thank you for contacting us. We&apos;ll get back to you within 24 hours.</p>
                      <Button
                        onClick={() => setIsSubmitted(false)}
                        variant="outline"
                        className="zyphex-button-secondary hover-zyphex-lift bg-transparent"
                      >
                        Send Another Message
                      </Button>
                    </div>
                  ) : (
                    <form className="space-y-6" onSubmit={handleSubmit}>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2 scroll-reveal" style={{ animationDelay: "100ms" }}>
                          <Label htmlFor="firstName" className="zyphex-subheading">
                            First Name *
                          </Label>
                          <Input
                            id="firstName"
                            placeholder="John"
                            required
                            value={formData.firstName}
                            onChange={(e) => handleInputChange('firstName', e.target.value)}
                            className="zyphex-glass-effect border-gray-700 text-gray-200 placeholder:text-gray-400 hover:border-blue-500 transition-colors duration-200"
                          />
                        </div>
                        <div className="space-y-2 scroll-reveal" style={{ animationDelay: "200ms" }}>
                          <Label htmlFor="lastName" className="zyphex-subheading">
                            Last Name *
                          </Label>
                          <Input
                            id="lastName"
                            placeholder="Doe"
                            required
                            value={formData.lastName}
                            onChange={(e) => handleInputChange('lastName', e.target.value)}
                            className="zyphex-glass-effect border-gray-700 text-gray-200 placeholder:text-gray-400 hover:border-blue-500 transition-colors duration-200"
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2 scroll-reveal" style={{ animationDelay: "300ms" }}>
                          <Label htmlFor="email" className="zyphex-subheading">
                            Email Address *
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="john@company.com"
                            required
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className="zyphex-glass-effect border-gray-700 text-gray-200 placeholder:text-gray-400 hover:border-blue-500 transition-colors duration-200"
                          />
                        </div>
                        <div className="space-y-2 scroll-reveal" style={{ animationDelay: "400ms" }}>
                          <Label htmlFor="phone" className="zyphex-subheading">
                            Phone Number
                          </Label>
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="+1 (555) 123-4567"
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            className="zyphex-glass-effect border-gray-700 text-gray-200 placeholder:text-gray-400 hover:border-blue-500 transition-colors duration-200"
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2 scroll-reveal" style={{ animationDelay: "500ms" }}>
                          <Label htmlFor="company" className="zyphex-subheading">
                            Company Name
                          </Label>
                          <Input
                            id="company"
                            placeholder="Your Company"
                            value={formData.company}
                            onChange={(e) => handleInputChange('company', e.target.value)}
                            className="zyphex-glass-effect border-gray-700 text-gray-200 placeholder:text-gray-400 hover:border-blue-500 transition-colors duration-200"
                          />
                        </div>
                        <div className="space-y-2 scroll-reveal" style={{ animationDelay: "600ms" }}>
                          <Label htmlFor="service" className="zyphex-subheading">
                            Service Interest *
                          </Label>
                          <Select
                            required
                            value={formData.service}
                            onValueChange={(value) => handleInputChange('service', value)}
                          >
                            <SelectTrigger className="zyphex-glass-effect border-gray-700 text-gray-200 hover:border-blue-500 transition-colors duration-200">
                              <SelectValue placeholder="Select a service" />
                            </SelectTrigger>
                            <SelectContent className="zyphex-glass-effect border-gray-700">
                              <SelectItem value="custom-software">Custom Software Development</SelectItem>
                              <SelectItem value="cloud-solutions">Cloud Solutions &amp; Migration</SelectItem>
                              <SelectItem value="data-analytics">Data Analytics &amp; BI</SelectItem>
                              <SelectItem value="mobile-development">Mobile App Development</SelectItem>
                              <SelectItem value="it-consulting">IT Consulting &amp; Strategy</SelectItem>
                              <SelectItem value="dedicated-teams">Dedicated Development Teams</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2 scroll-reveal" style={{ animationDelay: "700ms" }}>
                        <Label htmlFor="budget" className="zyphex-subheading">
                          Project Budget Range
                        </Label>
                        <Select
                          value={formData.budget}
                          onValueChange={(value) => handleInputChange('budget', value)}
                        >
                          <SelectTrigger className="zyphex-glass-effect border-gray-700 text-gray-200 hover:border-blue-500 transition-colors duration-200">
                            <SelectValue placeholder="Select budget range" />
                          </SelectTrigger>
                          <SelectContent className="zyphex-glass-effect border-gray-700">
                            <SelectItem value="under-5k">Under $5,000</SelectItem>
                            <SelectItem value="5k-15k">$5,000 - $15,000</SelectItem>
                            <SelectItem value="15k-50k">$15,000 - $50,000</SelectItem>
                            <SelectItem value="50k-100k">$50,000 - $100,000</SelectItem>
                            <SelectItem value="over-100k">Over $100,000</SelectItem>
                            <SelectItem value="discuss">Let&apos;s Discuss</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2 scroll-reveal" style={{ animationDelay: "800ms" }}>
                        <Label htmlFor="message" className="zyphex-subheading">
                          Project Description *
                        </Label>
                        <Textarea
                          id="message"
                          placeholder="Please describe your project requirements, goals, and any specific features you need..."
                          value={formData.message}
                          onChange={(e) => handleInputChange('message', e.target.value)}
                          className="min-h-[120px] zyphex-glass-effect border-gray-700 text-gray-200 placeholder:text-gray-400 hover:border-blue-500 transition-colors duration-200"
                          required
                        />
                      </div>

                      <div className="space-y-4 scroll-reveal" style={{ animationDelay: "900ms" }}>
                        <div className="flex items-start space-x-2">
                          <input
                            type="checkbox"
                            id="newsletter"
                            checked={formData.newsletter}
                            onChange={(e) => handleInputChange('newsletter', e.target.checked)}
                            className="mt-1"
                          />
                          <Label htmlFor="newsletter" className="text-sm zyphex-subheading">
                            I&apos;d like to receive updates about technology trends and company news
                          </Label>
                        </div>
                        <div className="flex items-start space-x-2">
                          <input
                            type="checkbox"
                            id="terms"
                            checked={formData.terms}
                            onChange={(e) => handleInputChange('terms', e.target.checked)}
                            className="mt-1"
                            required
                          />
                          <Label htmlFor="terms" className="text-sm zyphex-subheading">
                            I agree to the{" "}
                            <Link href="/privacy" className="zyphex-accent-text hover:underline">
                              Privacy Policy
                            </Link>{" "}
                            and{" "}
                            <Link href="/terms" className="zyphex-accent-text hover:underline">
                              Terms of Service
                            </Link>
                            *
                          </Label>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        size="lg"
                        disabled={isSubmitting}
                        className="w-full zyphex-button-primary hover-zyphex-lift scroll-reveal"
                        style={{ animationDelay: "1000ms" }}
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-5 w-5" />
                            Send Message
                          </>
                        )}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Contact Information */}
            <div className="space-y-8 scroll-reveal-right">
              {/* Contact Details */}
              <Card className="zyphex-card hover-zyphex-lift">
                <CardHeader>
                  <CardTitle className="text-xl zyphex-heading">Contact Information</CardTitle>
                  <CardDescription className="zyphex-subheading">
                    Get in touch with us through any of these channels
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-start gap-4 hover:bg-blue-900/20 p-3 rounded-lg transition-colors duration-200">
                    <div className="w-10 h-10 zyphex-gradient-primary rounded-lg flex items-center justify-center flex-shrink-0 animate-pulse-3d">
                      <Phone className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold zyphex-heading">Phone</h4>
                      <p className="zyphex-subheading">+1 (555) 123-4567</p>
                      <p className="text-sm zyphex-subheading">Mon-Fri 9AM-6PM EST</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 hover:bg-blue-900/20 p-3 rounded-lg transition-colors duration-200">
                    <div className="w-10 h-10 zyphex-gradient-secondary rounded-lg flex items-center justify-center flex-shrink-0 animate-pulse-3d">
                      <Mail className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold zyphex-heading">Email</h4>
                      <p className="zyphex-subheading">hello@zyphextech.com</p>
                      <p className="text-sm zyphex-subheading">We&apos;ll respond within 24 hours</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 hover:bg-blue-900/20 p-3 rounded-lg transition-colors duration-200">
                    <div className="w-10 h-10 zyphex-gradient-primary rounded-lg flex items-center justify-center flex-shrink-0 animate-pulse-3d">
                      <MapPin className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold zyphex-heading">Office</h4>
                      <p className="zyphex-subheading">
                        123 Tech Street
                        <br />
                        Innovation District
                        <br />
                        San Francisco, CA 94105
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 hover:bg-blue-900/20 p-3 rounded-lg transition-colors duration-200">
                    <div className="w-10 h-10 zyphex-gradient-secondary rounded-lg flex items-center justify-center flex-shrink-0 animate-pulse-3d">
                      <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold zyphex-heading">Business Hours</h4>
                      <p className="zyphex-subheading">Monday - Friday: 9:00 AM - 6:00 PM</p>
                      <p className="zyphex-subheading">Saturday: 10:00 AM - 4:00 PM</p>
                      <p className="zyphex-subheading">Sunday: Closed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="zyphex-card hover-zyphex-lift">
                <CardHeader>
                  <CardTitle className="text-xl zyphex-heading">Quick Actions</CardTitle>
                  <CardDescription className="zyphex-subheading">
                    Need immediate assistance? Try these options
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    variant="outline"
                    className="w-full justify-start zyphex-button-secondary bg-transparent hover-zyphex-lift"
                    asChild
                  >
                    <Link href="/auth/login?redirect=/user/messages">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Live Chat Support
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start zyphex-button-secondary bg-transparent hover-zyphex-lift"
                    asChild
                  >
                    <Link href="/auth/login?redirect=/user/appointments">
                      <Calendar className="mr-2 h-4 w-4" />
                      Schedule a Call
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start zyphex-button-secondary bg-transparent hover-zyphex-lift"
                    asChild
                  >
                    <Link href="/about#team">
                      <Users className="mr-2 h-4 w-4" />
                      Meet Our Team
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Response Time */}
              <Card className="zyphex-card bg-blue-900/20 hover-zyphex-lift">
                <CardContent className="pt-6">
                  <div className="text-center space-y-2 scroll-reveal">
                    <div className="w-12 h-12 zyphex-gradient-primary rounded-full flex items-center justify-center mx-auto animate-pulse-3d">
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                    <h4 className="font-semibold zyphex-heading">Fast Response Time</h4>
                    <p className="text-sm zyphex-subheading">
                      We typically respond to all inquiries within 2-4 hours during business hours.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section-padding bg-slate-900/50">
        <div className="container mx-auto container-padding">
          <div className="text-center space-y-4 mb-16 scroll-reveal">
            <h2 className="text-3xl lg:text-4xl font-bold zyphex-heading">Frequently Asked Questions</h2>
            <p className="text-lg zyphex-subheading max-w-2xl mx-auto">
              Quick answers to common questions about our remote services and process
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                question: "How do you manage remote development projects?",
                answer:
                  "We use advanced project management tools, regular video calls, and agile methodologies to ensure seamless remote collaboration. Our team is experienced in working across different time zones and maintaining clear communication throughout the project lifecycle.",
              },
              {
                question: "Do you work with startups and small businesses?",
                answer:
                  "We work with businesses of all sizes, from startups to enterprise companies. We offer flexible engagement models and pricing to accommodate different budgets and requirements, making our expertise accessible to growing businesses.",
              },
              {
                question: "What technologies do you specialize in?",
                answer:
                  "We specialize in modern web technologies (React, Node.js), cloud platforms (AWS, Azure), mobile development (React Native, Flutter), and database technologies (PostgreSQL, MongoDB). Our team stays current with the latest technology trends.",
              },
              {
                question: "Do you provide ongoing support after project completion?",
                answer:
                  "Yes, we offer comprehensive remote support and maintenance packages. This includes bug fixes, security updates, performance monitoring, and feature enhancements as needed, all managed through our remote support infrastructure.",
              },
              {
                question: "How do you ensure project quality with remote teams?",
                answer:
                  "We follow industry best practices including code reviews, automated testing, continuous integration, and regular client feedback sessions. Our remote-first approach includes quality assurance protocols specifically designed for distributed development.",
              },
              {
                question: "Can you help with existing projects or only new ones?",
                answer:
                  "We can help with both! Whether you need to modernize legacy systems, add new features to existing applications, or start from scratch, our remote team has the expertise to assist with any stage of your project.",
              },
            ].map((faq, index) => (
              <Card
                key={index}
                className={`zyphex-card hover-zyphex-lift scroll-reveal-scale`}
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <CardHeader>
                  <CardTitle className="text-lg zyphex-heading">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="zyphex-subheading leading-relaxed">{faq.answer}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding zyphex-gradient-bg text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full animate-float-3d"></div>
          <div className="absolute bottom-10 right-10 w-24 h-24 bg-white rounded-full animate-float-3d"></div>
        </div>
        <div className="container mx-auto container-padding text-center relative z-10">
          <div className="max-w-3xl mx-auto space-y-8 scroll-reveal">
            <h2 className="text-3xl lg:text-4xl font-bold zyphex-heading">Ready to Start Your Project?</h2>
            <p className="text-xl zyphex-subheading">
              Don&apos;t wait to transform your business. Get in touch today for a free consultation and let&apos;s discuss how we
              can help you achieve your technology goals with our remote expertise.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="secondary"
                className="text-lg px-8 py-6 zyphex-button-secondary hover-zyphex-lift"
              >
                <Phone className="mr-2 h-5 w-5" />
                Call Now: (555) 123-4567
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 border-white text-white hover:bg-white hover:text-blue-600 bg-transparent zyphex-button-secondary hover-zyphex-lift"
              >
                <Mail className="mr-2 h-5 w-5" />
                Email Us
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
