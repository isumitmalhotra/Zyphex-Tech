'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Bug, Network, Clock, ShieldAlert } from 'lucide-react'

/**
 * Error Testing Dashboard
 * Interactive page to test different error scenarios
 */
export default function ErrorTestingPage() {
  const [, setTriggerError] = useState(false)

  const errorScenarios = [
    {
      title: '404 Not Found Error',
      description: 'Test the custom 404 page',
      icon: AlertTriangle,
      action: () => {
        window.location.href = '/this-page-does-not-exist-test-404'
      },
      buttonText: 'Test 404 Page',
      color: 'text-yellow-500'
    },
    {
      title: 'Component Error',
      description: 'Test the error.tsx boundary',
      icon: Bug,
      action: () => {
        window.location.href = '/test-error'
      },
      buttonText: 'Test Error Boundary',
      color: 'text-red-500'
    },
    {
      title: 'React Error (Inline)',
      description: 'Trigger error in this component',
      icon: Bug,
      action: () => {
        setTriggerError(true)
        throw new Error('Inline React error test')
      },
      buttonText: 'Throw Error Now',
      color: 'text-red-600'
    },
    {
      title: 'Network Error Simulation',
      description: 'Test network error messaging',
      icon: Network,
      action: async () => {
        try {
          await fetch('https://nonexistent-api-endpoint-12345.com/test')
        } catch {
          throw new Error('Network request failed: Unable to connect to server')
        }
      },
      buttonText: 'Test Network Error',
      color: 'text-blue-500'
    },
    {
      title: 'Timeout Error Simulation',
      description: 'Test timeout error handling',
      icon: Clock,
      action: () => {
        throw new Error('Request timeout: The request took too long to complete')
      },
      buttonText: 'Test Timeout Error',
      color: 'text-orange-500'
    },
    {
      title: 'Authorization Error',
      description: 'Test auth error messaging',
      icon: ShieldAlert,
      action: () => {
        throw new Error('Unauthorized: You do not have permission to access this resource')
      },
      buttonText: 'Test Auth Error',
      color: 'text-purple-500'
    }
  ]

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">
            Error Handling Test Suite
          </h1>
          <p className="text-muted-foreground text-lg">
            Test all error scenarios to verify proper error handling
          </p>
        </div>

        {/* Test Scenarios Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {errorScenarios.map((scenario, index) => {
            const Icon = scenario.icon
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg bg-muted ${scenario.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base">
                        {scenario.title}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {scenario.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={scenario.action}
                    variant="outline"
                    className="w-full"
                  >
                    {scenario.buttonText}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Instructions */}
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle>Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">What to Verify:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Custom error pages display correctly</li>
                <li>Branded design matches Zyphex-Tech style</li>
                <li>Error messages are user-friendly</li>
                <li>All buttons and links work properly</li>
                <li>Mobile responsiveness</li>
                <li>Dark/light mode support</li>
                <li>Errors appear in Sentry dashboard</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Sentry Dashboard:</h3>
              <a 
                href="https://zyphex-tech.sentry.io/issues/" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline block"
              >
                https://zyphex-tech.sentry.io/issues/ ↗
              </a>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Test Checklist:</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>□ 404 page displays with search functionality</div>
                <div>□ Error boundary shows contextual error messages</div>
                <div>□ Try Again button resets the error</div>
                <div>□ Go Home button navigates to homepage</div>
                <div>□ Go Back button uses browser history</div>
                <div>□ Contact Support button opens contact page</div>
                <div>□ Error digest/ID displays correctly</div>
                <div>□ Errors logged in Sentry with correct severity</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-center gap-4">
          <Button asChild variant="outline">
            <Link href="/">Go to Homepage</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin">Go to Admin Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
