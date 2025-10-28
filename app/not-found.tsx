'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { 
  Home, 
  ArrowLeft, 
  Search, 
  FileQuestion, 
  Users, 
  Briefcase, 
  Mail,
  AlertCircle 
} from 'lucide-react'
// Sentry disabled to prevent build errors
// import * as Sentry from '@sentry/nextjs'

// Metadata removed - this is now a client component

// Popular pages for quick navigation
const popularPages = [
  {
    title: 'Services',
    description: 'Explore our IT services and solutions',
    href: '/services',
    icon: Briefcase,
  },
  {
    title: 'About Us',
    description: 'Learn more about Zyphex Tech',
    href: '/about',
    icon: Users,
  },
  {
    title: 'Contact',
    description: 'Get in touch with our team',
    href: '/contact',
    icon: Mail,
  },
]

export default function NotFound() {
  const router = useRouter()
  
  // Log 404 error to Sentry for monitoring - DISABLED
  // React.useEffect(() => {
  //   Sentry.captureMessage('404 Page Not Found', {
  //     level: 'warning',
  //     tags: {
  //       error_type: '404',
  //       error_page: 'not-found',
  //     },
  //   })
  // }, [])

  return (
    <div className="min-h-screen zyphex-gradient-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle background effects matching homepage design */}
      <div className="absolute inset-0 -z-10 opacity-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl animate-float-3d" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500 rounded-full blur-3xl animate-float-3d animation-delay-2000" />
        <div className="absolute -bottom-8 left-1/3 w-96 h-96 bg-cyan-500 rounded-full blur-3xl animate-float-3d animation-delay-4000" />
      </div>

      <div className="max-w-4xl w-full space-y-8">
        {/* Main Error Message */}
        <div className="text-center space-y-4 animate-in fade-in zoom-in duration-700">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full zyphex-gradient-primary mb-6 animate-pulse-3d">
            <FileQuestion className="w-12 h-12 text-white" />
          </div>
          
          <h1 className="text-7xl md:text-9xl font-bold animate-in zoom-in duration-700 delay-100">
            <span className="zyphex-accent-text animate-metallic-shine">404</span>
          </h1>
          
          <h2 className="text-3xl md:text-4xl font-bold zyphex-heading animate-in slide-in-from-bottom-4 duration-700 delay-200">
            Page Not Found
          </h2>
          
          <p className="zyphex-subheading text-lg md:text-xl max-w-2xl mx-auto leading-relaxed animate-in slide-in-from-bottom-4 duration-700 delay-300">
            Oops! The page you&apos;re looking for seems to have wandered off into the digital void. 
            Don&apos;t worry, we&apos;ll help you find your way back.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-in slide-in-from-bottom-4 duration-700 delay-400">
          <Button asChild size="lg" className="min-w-[180px] zyphex-button-primary hover-zyphex-lift transition-all duration-300 hover:scale-105 group">
            <Link href="/">
              <Home className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
              Go Home
            </Link>
          </Button>
          
          <Button 
            variant="outline" 
            size="lg" 
            className="min-w-[180px] zyphex-button-secondary bg-transparent hover-zyphex-lift transition-all duration-300 hover:scale-105 group"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-5 w-5 transition-transform group-hover:-translate-x-1" />
            Go Back
          </Button>
        </div>

        {/* Search Section */}
        <Card className="max-w-2xl mx-auto zyphex-card hover-zyphex-lift animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 zyphex-heading">
              <Search className="h-6 w-6 text-blue-500" />
              Search Our Site
            </CardTitle>
            <CardDescription className="zyphex-subheading">
              Try searching for what you&apos;re looking for
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                const query = formData.get('search') as string
                if (query) {
                  router.push(`/blog?q=${encodeURIComponent(query)}`)
                }
              }}
              className="flex gap-2"
            >
              <Input
                type="search"
                name="search"
                placeholder="Search for services, blog posts..."
                className="flex-1 zyphex-glass-effect border-gray-700 text-gray-200 placeholder:text-gray-400 hover:border-blue-500 transition-colors"
              />
              <Button type="submit" className="zyphex-button-primary hover-zyphex-lift">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Popular Pages */}
        <div className="space-y-6 animate-in fade-in duration-700 delay-600">
          <h3 className="text-2xl font-bold text-center zyphex-heading">
            Popular Pages
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {popularPages.map((page, index) => {
              const Icon = page.icon
              return (
                <Link key={page.href} href={page.href}>
                  <Card 
                    className="h-full zyphex-card hover-zyphex-lift transition-all hover:scale-105 cursor-pointer group animate-in fade-in slide-in-from-bottom-2 duration-500"
                    style={{ animationDelay: `${700 + index * 100}ms` }}
                  >
                    <CardHeader>
                      <div className="flex items-start gap-3">
                        <div className="p-3 rounded-lg zyphex-gradient-primary group-hover:scale-110 transition-transform">
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg zyphex-heading group-hover:text-blue-400 transition-colors">
                            {page.title}
                          </CardTitle>
                          <CardDescription className="mt-2 text-sm zyphex-subheading">
                            {page.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Help Section */}
        <Card className="max-w-2xl mx-auto zyphex-card bg-blue-900/20 animate-in fade-in duration-700 delay-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg zyphex-heading">
              <AlertCircle className="h-6 w-6 text-blue-500" />
              Still Can&apos;t Find What You&apos;re Looking For?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm zyphex-subheading mb-6 leading-relaxed">
              If you believe this is an error or need assistance, our support team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild variant="outline" className="flex-1 zyphex-button-secondary bg-transparent hover-zyphex-lift group">
                <Link href="/contact">
                  <Mail className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
                  Contact Support
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex-1 zyphex-button-secondary bg-transparent hover-zyphex-lift group">
                <Link href="/services">
                  <Briefcase className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
                  View Services
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer Note */}
        <p className="text-center text-sm zyphex-subheading animate-in fade-in duration-700 delay-1000">
          Error Code: 404 • Page Not Found • <Link href="/contact" className="zyphex-accent-text hover:underline">Report Issue</Link>
        </p>
      </div>
    </div>
  )
}
