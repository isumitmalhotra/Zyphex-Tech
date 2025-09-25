"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  HelpCircle,
  Search,
  MessageSquare,
  Phone,
  Mail,
  Book,
  Video,
  FileText,
  Users,
  Settings,
  CreditCard,
  Shield,
  Zap,
  ChevronRight,
  ExternalLink,
} from "lucide-react"
import { useState } from "react"

export default function UserHelp() {
  const [searchQuery, setSearchQuery] = useState("")

  // Mock data for FAQ
  const faqs = [
    {
      id: 1,
      category: "Getting Started",
      question: "How do I create my first project?",
      answer: "To create your first project, navigate to the Projects section in your dashboard and click the 'New Project' button. Fill in the project details including name, description, and timeline. You can then invite team members and start collaborating.",
    },
    {
      id: 2,
      category: "Getting Started",
      question: "How do I invite team members?",
      answer: "You can invite team members by going to your project settings and clicking 'Invite Members'. Enter their email addresses and assign appropriate roles. They'll receive an invitation email with instructions to join.",
    },
    {
      id: 3,
      category: "Projects",
      question: "How do I track project progress?",
      answer: "Project progress can be tracked through the Projects dashboard. You can update task completion status, add time logs, and view progress charts. Regular updates help keep your team aligned on project milestones.",
    },
    {
      id: 4,
      category: "Projects",
      question: "Can I export project reports?",
      answer: "Yes, you can export project reports in PDF format from the project details page. The report includes task completion status, time tracking, and team member contributions.",
    },
    {
      id: 5,
      category: "Billing",
      question: "How do I update my payment method?",
      answer: "You can update your payment method in the Billing section of your account. Click 'Update Payment Method' and enter your new card details. Your subscription will continue without interruption.",
    },
    {
      id: 6,
      category: "Billing",
      question: "Can I change my subscription plan?",
      answer: "Yes, you can upgrade or downgrade your subscription plan at any time. Visit the Billing section and click 'Upgrade Plan' to see available options. Changes take effect immediately.",
    },
    {
      id: 7,
      category: "Technical",
      question: "How do I reset my password?",
      answer: "To reset your password, click 'Forgot Password' on the login page. Enter your email address and we'll send you a secure link to create a new password.",
    },
    {
      id: 8,
      category: "Technical",
      question: "I'm having trouble uploading files",
      answer: "File upload issues are usually related to file size or format. Make sure your files are under the size limit (10MB for most file types) and in supported formats. If issues persist, contact our support team.",
    },
  ]

  const helpCategories = [
    {
      title: "Getting Started",
      description: "Learn the basics of using our platform",
      icon: Book,
      articles: 12,
      color: "bg-blue-500/20 text-blue-400",
    },
    {
      title: "Projects",
      description: "Manage and collaborate on projects",
      icon: Users,
      articles: 18,
      color: "bg-green-500/20 text-green-400",
    },
    {
      title: "Billing & Payments",
      description: "Subscription and payment information",
      icon: CreditCard,
      articles: 8,
      color: "bg-purple-500/20 text-purple-400",
    },
    {
      title: "Account Settings",
      description: "Manage your account and preferences",
      icon: Settings,
      articles: 15,
      color: "bg-orange-500/20 text-orange-400",
    },
    {
      title: "Security",
      description: "Keep your account secure",
      icon: Shield,
      articles: 10,
      color: "bg-red-500/20 text-red-400",
    },
    {
      title: "Advanced Features",
      description: "Power user tips and tricks",
      icon: Zap,
      articles: 22,
      color: "bg-yellow-500/20 text-yellow-400",
    },
  ]

  const contactOptions = [
    {
      title: "Live Chat",
      description: "Get instant help from our support team",
      icon: MessageSquare,
      availability: "Available 24/7",
      action: "Start Chat",
    },
    {
      title: "Email Support",
      description: "Send us a detailed message about your issue",
      icon: Mail,
      availability: "Response within 24 hours",
      action: "Send Email",
    },
    {
      title: "Phone Support",
      description: "Speak directly with a support specialist",
      icon: Phone,
      availability: "Mon-Fri, 9AM-6PM EST",
      action: "Call Now",
    },
    {
      title: "Video Tutorial",
      description: "Watch step-by-step guides and tutorials",
      icon: Video,
      availability: "On-demand",
      action: "Watch Videos",
    },
  ]

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold zyphex-heading">Help Center</h1>
          <p className="text-lg zyphex-subheading">Find answers and get support</p>
        </div>
        <Button className="zyphex-button-primary hover-zyphex-lift">
          <MessageSquare className="mr-2 h-4 w-4" />
          Contact Support
        </Button>
      </div>

      {/* Search */}
      <Card className="zyphex-card">
        <CardContent className="p-6">
          <div className="max-w-2xl mx-auto text-center space-y-4">
            <HelpCircle className="h-12 w-12 text-blue-400 mx-auto" />
            <h2 className="text-2xl font-bold zyphex-heading">How can we help you?</h2>
            <p className="text-lg zyphex-subheading">
              Search our knowledge base or browse help topics below
            </p>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search for help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 py-3 text-lg zyphex-input"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {helpCategories.map((category, index) => (
          <Card key={index} className="zyphex-card hover-zyphex-lift cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 rounded-lg ${category.color}`}>
                  <category.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold zyphex-heading">{category.title}</h3>
                  <p className="text-sm zyphex-subheading">{category.articles} articles</p>
                </div>
              </div>
              <p className="text-sm zyphex-subheading mb-4">{category.description}</p>
              <Button variant="outline" className="w-full zyphex-button-secondary hover-zyphex-glow">
                Browse Articles
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* FAQ Section */}
      <Card className="zyphex-card">
        <CardHeader>
          <CardTitle className="zyphex-heading">Frequently Asked Questions</CardTitle>
          <CardDescription className="zyphex-subheading">Quick answers to common questions</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="space-y-4">
            {filteredFaqs.map((faq) => (
              <AccordionItem key={faq.id} value={`faq-${faq.id}`} className="border border-gray-800/50 rounded-lg px-4">
                <AccordionTrigger className="zyphex-heading hover:text-blue-400">
                  <div className="flex items-center gap-3 text-left">
                    <Badge variant="outline" className="text-xs">
                      {faq.category}
                    </Badge>
                    <span>{faq.question}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="zyphex-subheading pt-2">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Contact Support */}
      <Card className="zyphex-card">
        <CardHeader>
          <CardTitle className="zyphex-heading">Contact Support</CardTitle>
          <CardDescription className="zyphex-subheading">Can&apos;t find what you&apos;re looking for? Get in touch with our team</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactOptions.map((option, index) => (
              <div key={index} className="text-center space-y-4">
                <div className="p-4 rounded-lg bg-blue-500/20 w-fit mx-auto">
                  <option.icon className="h-8 w-8 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold zyphex-heading">{option.title}</h3>
                  <p className="text-sm zyphex-subheading mb-2">{option.description}</p>
                  <p className="text-xs zyphex-subheading opacity-70 mb-4">{option.availability}</p>
                  <Button className="w-full zyphex-button-primary hover-zyphex-lift">
                    {option.action}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card className="zyphex-card">
        <CardHeader>
          <CardTitle className="zyphex-heading">Quick Links</CardTitle>
          <CardDescription className="zyphex-subheading">Popular resources and guides</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button variant="outline" className="zyphex-button-secondary hover-zyphex-glow h-auto p-4 justify-start">
              <div className="text-left">
                <FileText className="h-5 w-5 mb-2 text-blue-400" />
                <div className="font-medium zyphex-heading">User Guide</div>
                <div className="text-sm zyphex-subheading">Complete platform guide</div>
              </div>
              <ExternalLink className="h-4 w-4 ml-auto" />
            </Button>
            <Button variant="outline" className="zyphex-button-secondary hover-zyphex-glow h-auto p-4 justify-start">
              <div className="text-left">
                <Video className="h-5 w-5 mb-2 text-green-400" />
                <div className="font-medium zyphex-heading">Video Tutorials</div>
                <div className="text-sm zyphex-subheading">Step-by-step video guides</div>
              </div>
              <ExternalLink className="h-4 w-4 ml-auto" />
            </Button>
            <Button variant="outline" className="zyphex-button-secondary hover-zyphex-glow h-auto p-4 justify-start">
              <div className="text-left">
                <Shield className="h-5 w-5 mb-2 text-red-400" />
                <div className="font-medium zyphex-heading">Security Center</div>
                <div className="text-sm zyphex-subheading">Security best practices</div>
              </div>
              <ExternalLink className="h-4 w-4 ml-auto" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
