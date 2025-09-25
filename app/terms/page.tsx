"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, FileText, Scale, Users, AlertTriangle, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useScrollAnimation } from "@/components/scroll-animations"
import { SubtleBackground, MinimalParticles } from "@/components/subtle-background"

export default function TermsPage() {
  useScrollAnimation()

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="zyphex-gradient-bg section-padding overflow-hidden relative">
        <SubtleBackground />
        <MinimalParticles />
        <div className="container mx-auto container-padding relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge variant="secondary" className="w-fit mx-auto zyphex-blue-glow animate-zyphex-glow scroll-reveal">
              Terms of Service
            </Badge>
            <h1 className="text-4xl lg:text-5xl font-bold zyphex-heading scroll-reveal-scale">
              Terms & Conditions
            </h1>
            <p className="text-xl zyphex-subheading leading-relaxed scroll-reveal">
              These terms govern your use of Zyphex Tech services. By using our services, you agree to be bound by these terms.
              Please read them carefully before proceeding.
            </p>
            <div className="flex justify-center pt-4">
              <Button variant="outline" className="zyphex-button-secondary hover-zyphex-lift bg-transparent" asChild>
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Terms Overview */}
      <section className="section-padding zyphex-section-bg relative">
        <SubtleBackground />
        <div className="container mx-auto container-padding relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="text-center space-y-4 mb-12 scroll-reveal">
              <h2 className="text-3xl lg:text-4xl font-bold zyphex-heading">Agreement Overview</h2>
              <p className="text-lg zyphex-subheading">
                Clear terms for a transparent working relationship
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {[
                {
                  icon: FileText,
                  title: "Service Agreement",
                  description: "Terms for project delivery and service provision",
                },
                {
                  icon: Scale,
                  title: "Legal Compliance",
                  description: "Your rights, obligations, and legal protections",
                },
                {
                  icon: Users,
                  title: "Client Responsibilities",
                  description: "What we expect from our clients",
                },
              ].map((item, index) => (
                <Card
                  key={index}
                  className="zyphex-card hover-zyphex-lift scroll-reveal-scale"
                  style={{ animationDelay: `${index * 200}ms` }}
                >
                  <CardHeader className="pb-4">
                    <div className="w-12 h-12 zyphex-gradient-primary rounded-lg flex items-center justify-center mb-4 animate-pulse-3d">
                      <item.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-xl zyphex-heading">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="zyphex-subheading leading-relaxed">
                      {item.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Terms */}
      <section className="section-padding bg-slate-900/50 relative">
        <SubtleBackground />
        <div className="container mx-auto container-padding relative z-10">
          <div className="max-w-4xl mx-auto">
            <Card className="zyphex-card">
              <CardHeader>
                <CardTitle className="text-2xl zyphex-heading">Terms of Service</CardTitle>
                <CardDescription className="zyphex-subheading">
                  Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold zyphex-heading flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    1. Acceptance of Terms
                  </h3>
                  <div className="space-y-3 zyphex-subheading leading-relaxed">
                    <p>By accessing and using Zyphex Tech services, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.</p>
                    <p>This agreement applies to all visitors, users, and others who access or use our services.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold zyphex-heading flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    2. Description of Service
                  </h3>
                  <div className="space-y-3 zyphex-subheading leading-relaxed">
                    <p>Zyphex Tech provides remote IT services including but not limited to:</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Custom software development</li>
                      <li>Cloud solutions and migration</li>
                      <li>Data analytics and business intelligence</li>
                      <li>Mobile application development</li>
                      <li>IT consulting and strategy</li>
                      <li>Dedicated development teams</li>
                      <li>Technical support and maintenance</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold zyphex-heading flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    3. User Accounts and Responsibilities
                  </h3>
                  <div className="space-y-3 zyphex-subheading leading-relaxed">
                    <p>When you create an account with us, you must provide information that is accurate, complete, and current at all times. You are responsible for:</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Safeguarding your account credentials</li>
                      <li>All activities that occur under your account</li>
                      <li>Notifying us immediately of any unauthorized use</li>
                      <li>Providing accurate project requirements and information</li>
                      <li>Complying with applicable laws and regulations</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold zyphex-heading flex items-center gap-2">
                    <Scale className="h-5 w-5" />
                    4. Intellectual Property Rights
                  </h3>
                  <div className="space-y-3 zyphex-subheading leading-relaxed">
                    <p>The service and its original content, features, and functionality are and will remain the exclusive property of Zyphex Tech and its licensors. The service is protected by copyright, trademark, and other laws.</p>
                    <p>Upon project completion and full payment, clients receive full ownership of the deliverables as specified in the project agreement. Zyphex Tech retains rights to use the work for portfolio purposes unless otherwise agreed.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold zyphex-heading">5. Payment Terms</h3>
                  <div className="space-y-3 zyphex-subheading leading-relaxed">
                    <p>Payment terms are specified in individual project agreements. Generally:</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Deposit required before project commencement</li>
                      <li>Milestone payments as work progresses</li>
                      <li>Final payment upon project completion</li>
                      <li>Late payments may incur additional fees</li>
                      <li>All prices exclude applicable taxes</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold zyphex-heading">6. Project Delivery and Timelines</h3>
                  <div className="space-y-3 zyphex-subheading leading-relaxed">
                    <p>We strive to deliver projects on time and within budget. However:</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Timelines are estimates and may vary based on project complexity</li>
                      <li>Client feedback and approvals may affect delivery schedules</li>
                      <li>We are not liable for delays caused by third-party services</li>
                      <li>Changes to project scope may affect timelines and costs</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold zyphex-heading">7. Confidentiality</h3>
                  <div className="space-y-3 zyphex-subheading leading-relaxed">
                    <p>Both parties agree to maintain confidentiality of proprietary information, including:</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Client business information and data</li>
                      <li>Project specifications and requirements</li>
                      <li>Source code and technical implementations</li>
                      <li>Trade secrets and proprietary processes</li>
                    </ul>
                    <p>Confidentiality obligations survive termination of this agreement.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold zyphex-heading flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    8. Limitation of Liability
                  </h3>
                  <div className="space-y-3 zyphex-subheading leading-relaxed">
                    <p>In no event shall Zyphex Tech be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.</p>
                    <p>Our total liability shall not exceed the amount paid by the client for the specific service that caused the liability.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold zyphex-heading">9. Termination</h3>
                  <div className="space-y-3 zyphex-subheading leading-relaxed">
                    <p>Either party may terminate this agreement with written notice. Upon termination:</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>All rights and obligations cease immediately</li>
                      <li>Client remains responsible for payment of completed work</li>
                      <li>We will provide access to work completed up to termination date</li>
                      <li>Confidentiality obligations remain in effect</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold zyphex-heading">10. Warranty and Support</h3>
                  <div className="space-y-3 zyphex-subheading leading-relaxed">
                    <p>We provide warranty coverage for our deliverables as specified in project agreements. Support services include:</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Bug fixes during warranty period</li>
                      <li>Technical support and maintenance</li>
                      <li>Documentation and training</li>
                      <li>Performance optimization</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold zyphex-heading">11. Governing Law</h3>
                  <div className="space-y-3 zyphex-subheading leading-relaxed">
                    <p>This agreement shall be governed by and construed in accordance with the laws of the State of California, without regard to its conflict of law provisions.</p>
                    <p>Any disputes arising from this agreement shall be resolved through binding arbitration in San Francisco, California.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold zyphex-heading">12. Changes to Terms</h3>
                  <div className="space-y-3 zyphex-subheading leading-relaxed">
                    <p>We reserve the right to modify these terms at any time. We will notify users of material changes via email or website notification.</p>
                    <p>Your continued use of our services after changes constitutes acceptance of the new terms.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold zyphex-heading">13. Contact Information</h3>
                  <div className="space-y-3 zyphex-subheading leading-relaxed">
                    <p>For questions about these terms, please contact us:</p>
                    <div className="bg-slate-800/50 p-4 rounded-lg">
                      <p><strong>Email:</strong> legal@zyphextech.com</p>
                      <p><strong>Phone:</strong> +1 (555) 123-4567</p>
                      <p><strong>Address:</strong> 123 Tech Street, San Francisco, CA 94105</p>
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="section-padding zyphex-gradient-bg text-white relative overflow-hidden">
        <SubtleBackground />
        <div className="container mx-auto container-padding text-center relative z-10">
          <div className="max-w-2xl mx-auto space-y-6 scroll-reveal">
            <h2 className="text-2xl lg:text-3xl font-bold zyphex-heading">Need Clarification?</h2>
            <p className="text-lg zyphex-subheading">
              Our legal team is here to help you understand our terms and conditions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="secondary"
                className="zyphex-button-secondary hover-zyphex-lift"
                asChild
              >
                <Link href="/contact">
                  Contact Legal Team
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-blue-600 bg-transparent zyphex-button-secondary hover-zyphex-lift"
                asChild
              >
                <Link href="mailto:legal@zyphextech.com">
                  Email Legal
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
