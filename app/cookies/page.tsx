"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Shield, Cookie, Settings, BarChart3 } from "lucide-react"
import Link from "next/link"
import { useScrollAnimation } from "@/components/scroll-animations"
import { SubtleBackground, MinimalParticles } from "@/components/subtle-background"
import { Icon3D } from "@/components/3d-icons"

export default function CookiesPage() {
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
              Cookie Policy
            </Badge>
            <h1 className="text-4xl lg:text-5xl font-bold zyphex-heading scroll-reveal-scale">
              Cookie Policy
            </h1>
            <p className="text-xl zyphex-subheading leading-relaxed scroll-reveal">
              We use cookies to enhance your browsing experience and provide personalized content.
              This policy explains how we use cookies and how you can control them.
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

      {/* Cookie Overview */}
      <section className="section-padding zyphex-section-bg relative">
        <SubtleBackground />
        <div className="container mx-auto container-padding relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="text-center space-y-4 mb-12 scroll-reveal">
              <h2 className="text-3xl lg:text-4xl font-bold zyphex-heading">Understanding Cookies</h2>
              <p className="text-lg zyphex-subheading">
                Cookies help us provide you with the best possible experience
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {[
                {
                  icon: "Cookie",
                  title: "Essential Cookies",
                  description: "Required for website functionality and security",
                },
                {
                  icon: "BarChart3",
                  title: "Analytics Cookies",
                  description: "Help us understand how visitors use our site",
                },
                {
                  icon: "Target",
                  title: "Marketing Cookies",
                  description: "Used to deliver relevant advertisements",
                },
              ].map((item, index) => (
                <Card
                  key={index}
                  className="zyphex-card hover-zyphex-lift scroll-reveal-scale"
                  style={{ animationDelay: `${index * 200}ms` }}
                >
                  <CardHeader className="pb-4">
                    <div className="w-12 h-12 zyphex-gradient-primary rounded-lg flex items-center justify-center mb-4 animate-pulse-3d">
                      <Icon3D icon={item.icon} size={24} color="white" />
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

      {/* Detailed Cookie Policy */}
      <section className="section-padding bg-slate-900/50 relative">
        <SubtleBackground />
        <div className="container mx-auto container-padding relative z-10">
          <div className="max-w-4xl mx-auto">
            <Card className="zyphex-card">
              <CardHeader>
                <CardTitle className="text-2xl zyphex-heading">Cookie Policy Details</CardTitle>
                <CardDescription className="zyphex-subheading">
                  Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold zyphex-heading flex items-center gap-2">
                    <Cookie className="h-5 w-5" />
                    1. What Are Cookies?
                  </h3>
                  <div className="space-y-3 zyphex-subheading leading-relaxed">
                    <p>Cookies are small text files that are stored on your computer or mobile device when you visit our website. They allow us to remember your preferences and improve your browsing experience.</p>
                    <p>Cookies can be categorized as:</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li><strong>Session Cookies:</strong> Temporary cookies that expire when you close your browser</li>
                      <li><strong>Persistent Cookies:</strong> Cookies that remain on your device for a set period</li>
                      <li><strong>First-party Cookies:</strong> Set by our website directly</li>
                      <li><strong>Third-party Cookies:</strong> Set by third-party services we use</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold zyphex-heading flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    2. Types of Cookies We Use
                  </h3>
                  <div className="space-y-6 zyphex-subheading leading-relaxed">

                    <div className="bg-slate-800/30 p-4 rounded-lg">
                      <h4 className="font-semibold zyphex-accent-text mb-2">Essential Cookies</h4>
                      <p className="mb-2">These cookies are necessary for the website to function properly.</p>
                      <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                        <li>Authentication and security cookies</li>
                        <li>Session management cookies</li>
                        <li>CSRF protection cookies</li>
                      </ul>
                      <p className="text-sm mt-2 text-gray-400">These cookies cannot be disabled.</p>
                    </div>

                    <div className="bg-slate-800/30 p-4 rounded-lg">
                      <h4 className="font-semibold zyphex-accent-text mb-2">Analytics Cookies</h4>
                      <p className="mb-2">These cookies help us understand how visitors interact with our website.</p>
                      <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                        <li>Google Analytics (_ga, _gid)</li>
                        <li>Page view tracking</li>
                        <li>User journey analysis</li>
                      </ul>
                    </div>

                    <div className="bg-slate-800/30 p-4 rounded-lg">
                      <h4 className="font-semibold zyphex-accent-text mb-2">Functional Cookies</h4>
                      <p className="mb-2">These cookies enable enhanced functionality and personalization.</p>
                      <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                        <li>Language preferences</li>
                        <li>Theme settings</li>
                        <li>User interface customizations</li>
                      </ul>
                    </div>

                    <div className="bg-slate-800/30 p-4 rounded-lg">
                      <h4 className="font-semibold zyphex-accent-text mb-2">Marketing Cookies</h4>
                      <p className="mb-2">These cookies are used to deliver relevant advertisements.</p>
                      <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                        <li>Targeted advertising cookies</li>
                        <li>Social media pixels</li>
                        <li>Retargeting cookies</li>
                      </ul>
                    </div>

                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold zyphex-heading flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    3. Third-Party Cookies
                  </h3>
                  <div className="space-y-3 zyphex-subheading leading-relaxed">
                    <p>We may use third-party services that set their own cookies:</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li><strong>Google Analytics:</strong> For website analytics and performance monitoring</li>
                      <li><strong>Social Media Platforms:</strong> For social sharing and engagement tracking</li>
                      <li><strong>Content Delivery Networks:</strong> For faster content loading</li>
                      <li><strong>Customer Support:</strong> For live chat and support ticket management</li>
                    </ul>
                    <p>These third parties have their own privacy policies and cookie practices.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold zyphex-heading flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    4. Managing Your Cookie Preferences
                  </h3>
                  <div className="space-y-3 zyphex-subheading leading-relaxed">
                    <p>You have several options to manage cookies:</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li><strong>Browser Settings:</strong> Most browsers allow you to control cookies through settings</li>
                      <li><strong>Our Cookie Banner:</strong> Use our cookie consent banner to manage preferences</li>
                      <li><strong>Opt-out Links:</strong> Follow opt-out links provided by third-party services</li>
                      <li><strong>Incognito/Private Mode:</strong> Browsing in private mode may limit cookie usage</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold zyphex-heading">5. Cookie Retention</h3>
                  <div className="space-y-3 zyphex-subheading leading-relaxed">
                    <p>Cookies have different lifespans depending on their purpose:</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li><strong>Session Cookies:</strong> Deleted when you close your browser</li>
                      <li><strong>Analytics Cookies:</strong> Typically retained for 26 months</li>
                      <li><strong>Marketing Cookies:</strong> Usually retained for 13 months</li>
                      <li><strong>Preference Cookies:</strong> Retained for up to 2 years</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold zyphex-heading">6. Impact of Disabling Cookies</h3>
                  <div className="space-y-3 zyphex-subheading leading-relaxed">
                    <p>Disabling certain cookies may affect your experience:</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Essential cookies cannot be disabled without affecting website functionality</li>
                      <li>Analytics cookies help us improve the site but are not essential</li>
                      <li>Functional cookies enhance usability but the site will still work without them</li>
                      <li>Marketing cookies can be disabled without affecting core functionality</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold zyphex-heading">7. Updates to This Policy</h3>
                  <div className="space-y-3 zyphex-subheading leading-relaxed">
                    <p>We may update this cookie policy from time to time to reflect changes in our practices or for legal reasons. We will notify you of any material changes.</p>
                    <p>The updated policy will be effective immediately upon posting on our website.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold zyphex-heading">8. Contact Us</h3>
                  <div className="space-y-3 zyphex-subheading leading-relaxed">
                    <p>If you have questions about our cookie policy or practices, please contact us:</p>
                    <div className="bg-slate-800/50 p-4 rounded-lg">
                      <p><strong>Email:</strong> privacy@zyphextech.com</p>
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

      {/* Cookie Settings CTA */}
      <section className="section-padding zyphex-gradient-bg text-white relative overflow-hidden">
        <SubtleBackground />
        <div className="container mx-auto container-padding text-center relative z-10">
          <div className="max-w-2xl mx-auto space-y-6 scroll-reveal">
            <h2 className="text-2xl lg:text-3xl font-bold zyphex-heading">Manage Your Cookie Preferences</h2>
            <p className="text-lg zyphex-subheading">
              Take control of your cookie settings and privacy preferences.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="secondary"
                className="zyphex-button-secondary hover-zyphex-lift"
                asChild
              >
                <Link href="/contact">
                  Contact Support
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-blue-600 bg-transparent zyphex-button-secondary hover-zyphex-lift"
              >
                Cookie Settings
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
