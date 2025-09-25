"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Shield, Eye, Lock, Database, Mail, Globe } from "lucide-react"
import Link from "next/link"
import { useScrollAnimation } from "@/components/scroll-animations"
import { SubtleBackground, MinimalParticles } from "@/components/subtle-background"

export default function PrivacyPage() {
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
              Privacy Policy
            </Badge>
            <h1 className="text-4xl lg:text-5xl font-bold zyphex-heading scroll-reveal-scale">
              Your Privacy Matters to Us
            </h1>
            <p className="text-xl zyphex-subheading leading-relaxed scroll-reveal">
              At Zyphex Tech, we are committed to protecting your privacy and ensuring the security of your personal information.
              This privacy policy explains how we collect, use, and safeguard your data.
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

      {/* Privacy Overview */}
      <section className="section-padding zyphex-section-bg relative">
        <SubtleBackground />
        <div className="container mx-auto container-padding relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="text-center space-y-4 mb-12 scroll-reveal">
              <h2 className="text-3xl lg:text-4xl font-bold zyphex-heading">Privacy Overview</h2>
              <p className="text-lg zyphex-subheading">
                We collect information to provide better services and improve your experience
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {[
                {
                  icon: Eye,
                  title: "Information We Collect",
                  description: "Personal details, usage data, and communication preferences",
                },
                {
                  icon: Shield,
                  title: "How We Protect It",
                  description: "Industry-standard security measures and encryption",
                },
                {
                  icon: Database,
                  title: "Data Usage",
                  description: "Used only for service delivery and improvement",
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

      {/* Detailed Privacy Policy */}
      <section className="section-padding bg-slate-900/50 relative">
        <SubtleBackground />
        <div className="container mx-auto container-padding relative z-10">
          <div className="max-w-4xl mx-auto">
            <Card className="zyphex-card">
              <CardHeader>
                <CardTitle className="text-2xl zyphex-heading">Detailed Privacy Policy</CardTitle>
                <CardDescription className="zyphex-subheading">
                  Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold zyphex-heading flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    1. Information We Collect
                  </h3>
                  <div className="space-y-3 zyphex-subheading leading-relaxed">
                    <p>We collect information you provide directly to us, such as:</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Name, email address, and contact information</li>
                      <li>Company details and project requirements</li>
                      <li>Communication preferences and feedback</li>
                      <li>Payment information for billing purposes</li>
                    </ul>
                    <p>We also automatically collect certain information when you use our services:</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>IP address and location data</li>
                      <li>Browser type and version</li>
                      <li>Pages visited and time spent on our site</li>
                      <li>Device information and screen resolution</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold zyphex-heading flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    2. How We Use Your Information
                  </h3>
                  <div className="space-y-3 zyphex-subheading leading-relaxed">
                    <p>We use the collected information for the following purposes:</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>To provide and maintain our services</li>
                      <li>To communicate with you about your projects</li>
                      <li>To send you updates and marketing materials (with consent)</li>
                      <li>To improve our website and services</li>
                      <li>To comply with legal obligations</li>
                      <li>To protect against fraud and security threats</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold zyphex-heading flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    3. Information Sharing and Disclosure
                  </h3>
                  <div className="space-y-3 zyphex-subheading leading-relaxed">
                    <p>We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>With your explicit consent</li>
                      <li>To comply with legal requirements</li>
                      <li>To protect our rights and prevent fraud</li>
                      <li>With trusted service providers who assist our operations</li>
                      <li>In connection with a business transfer or acquisition</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold zyphex-heading flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    4. Data Security
                  </h3>
                  <div className="space-y-3 zyphex-subheading leading-relaxed">
                    <p>We implement appropriate technical and organizational measures to protect your personal information:</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>SSL/TLS encryption for data transmission</li>
                      <li>Secure data storage with access controls</li>
                      <li>Regular security audits and updates</li>
                      <li>Employee training on data protection</li>
                      <li>Incident response procedures</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold zyphex-heading flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    5. Your Rights
                  </h3>
                  <div className="space-y-3 zyphex-subheading leading-relaxed">
                    <p>You have the following rights regarding your personal information:</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Access: Request a copy of your personal data</li>
                      <li>Rectification: Correct inaccurate or incomplete data</li>
                      <li>Erasure: Request deletion of your personal data</li>
                      <li>Portability: Receive your data in a structured format</li>
                      <li>Restriction: Limit how we process your data</li>
                      <li>Objection: Object to processing based on legitimate interests</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold zyphex-heading">6. Cookies and Tracking</h3>
                  <div className="space-y-3 zyphex-subheading leading-relaxed">
                    <p>We use cookies and similar technologies to enhance your experience:</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Essential cookies for website functionality</li>
                      <li>Analytics cookies to understand usage patterns</li>
                      <li>Preference cookies to remember your settings</li>
                      <li>Marketing cookies for targeted communications</li>
                    </ul>
                    <p>You can control cookie preferences through your browser settings.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold zyphex-heading">7. International Data Transfers</h3>
                  <div className="space-y-3 zyphex-subheading leading-relaxed">
                    <p>Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for such transfers, including:</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Adequacy decisions by relevant authorities</li>
                      <li>Standard contractual clauses</li>
                      <li>Binding corporate rules</li>
                      <li>Your explicit consent where required</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold zyphex-heading">8. Data Retention</h3>
                  <div className="space-y-3 zyphex-subheading leading-relaxed">
                    <p>We retain your personal information only as long as necessary for the purposes outlined in this policy, unless a longer retention period is required by law. Typically:</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Customer data: Retained during active relationship and for 7 years after</li>
                      <li>Marketing data: Retained until you unsubscribe or withdraw consent</li>
                      <li>Website analytics: Retained for 26 months</li>
                      <li>Legal compliance data: Retained as required by applicable laws</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold zyphex-heading">9. Third-Party Services</h3>
                  <div className="space-y-3 zyphex-subheading leading-relaxed">
                    <p>We may use third-party services that collect information about you:</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Analytics providers (Google Analytics)</li>
                      <li>Customer support platforms</li>
                      <li>Payment processors</li>
                      <li>Email service providers</li>
                      <li>Cloud hosting services</li>
                    </ul>
                    <p>These third parties have their own privacy policies and practices.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold zyphex-heading">10. Changes to This Policy</h3>
                  <div className="space-y-3 zyphex-subheading leading-relaxed">
                    <p>We may update this privacy policy from time to time. We will notify you of any material changes by:</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Posting the updated policy on our website</li>
                      <li>Sending you an email notification</li>
                      <li>Providing an in-app notification</li>
                    </ul>
                    <p>Your continued use of our services after changes take effect constitutes acceptance of the updated policy.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold zyphex-heading">11. Contact Us</h3>
                  <div className="space-y-3 zyphex-subheading leading-relaxed">
                    <p>If you have any questions about this privacy policy or our data practices, please contact us:</p>
                    <div className="bg-slate-800/50 p-4 rounded-lg">
                      <p><strong>Email:</strong> privacy@zyphextech.com</p>
                      <p><strong>Phone:</strong> +1 (555) 123-4567</p>
                      <p><strong>Address:</strong> 123 Tech Street, San Francisco, CA 94105</p>
                    </div>
                    <p>We will respond to your inquiries within 30 days.</p>
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
            <h2 className="text-2xl lg:text-3xl font-bold zyphex-heading">Questions About Your Privacy?</h2>
            <p className="text-lg zyphex-subheading">
              We&apos;re here to help. Contact our privacy team for any concerns or questions about your data.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="secondary"
                className="zyphex-button-secondary hover-zyphex-lift"
                asChild
              >
                <Link href="/contact">
                  Contact Privacy Team
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-blue-600 bg-transparent zyphex-button-secondary hover-zyphex-lift"
                asChild
              >
                <Link href="mailto:privacy@zyphextech.com">
                  Email Us
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
