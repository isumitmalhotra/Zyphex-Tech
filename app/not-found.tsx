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
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle background effects matching homepage design */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-blob" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-1/3 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-blob animation-delay-4000" />
      </div>

      <div className="max-w-4xl w-full space-y-8">
        {/* Main Error Message */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-destructive/10 dark:bg-destructive/20 mb-4">
            <FileQuestion className="w-10 h-10 text-destructive" />
          </div>
          
          <h1 className="text-6xl md:text-8xl font-bold text-foreground">
            404
          </h1>
          
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
            Page Not Found
          </h2>
          
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Oops! The page you&apos;re looking for seems to have wandered off into the digital void. 
            Don&apos;t worry, we&apos;ll help you find your way back.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button asChild size="lg" className="min-w-[160px]">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </Button>
          
          <Button asChild variant="outline" size="lg" className="min-w-[160px]">
            <Link href="javascript:history.back()">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Link>
          </Button>
        </div>

        {/* Search Section */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Our Site
            </CardTitle>
            <CardDescription>
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
                className="flex-1"
              />
              <Button type="submit">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Popular Pages */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-center text-foreground">
            Popular Pages
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {popularPages.map((page) => {
              const Icon = page.icon
              return (
                <Link key={page.href} href={page.href}>
                  <Card className="h-full transition-all hover:shadow-md hover:border-primary/50 cursor-pointer group">
                    <CardHeader>
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 dark:bg-primary/20 group-hover:bg-primary/20 dark:group-hover:bg-primary/30 transition-colors">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-base group-hover:text-primary transition-colors">
                            {page.title}
                          </CardTitle>
                          <CardDescription className="mt-1 text-sm">
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
        <Card className="max-w-2xl mx-auto bg-muted/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="h-5 w-5 text-primary" />
              Still Can&apos;t Find What You&apos;re Looking For?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              If you believe this is an error or need assistance, our support team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild variant="outline" className="flex-1">
                <Link href="/contact">
                  <Mail className="mr-2 h-4 w-4" />
                  Contact Support
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href="/services">
                  <Briefcase className="mr-2 h-4 w-4" />
                  View Services
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer Note */}
        <p className="text-center text-sm text-muted-foreground">
          Error Code: 404 • Page Not Found
        </p>
      </div>
    </div>
  )
}
