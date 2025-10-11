'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  AlertCircle, 
  RefreshCw, 
  Home, 
  Mail, 
  ArrowLeft,
  Bug
} from 'lucide-react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Root-level Error Boundary for Next.js App Router
 * Catches errors that occur in route segments and provides a branded error UI
 * Integrates with Sentry for error tracking
 */
export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to Sentry with additional context
    Sentry.captureException(error, {
      tags: {
        error_boundary: 'app_error',
        error_digest: error.digest,
      },
      level: 'error',
      extra: {
        errorMessage: error.message,
        errorStack: error.stack,
        errorDigest: error.digest,
      },
    })

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('App Error Boundary caught:', error)
    }
  }, [error])

  // Determine error type and message
  const getErrorInfo = () => {
    const errorMessage = error.message.toLowerCase()

    // Check for common error types
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return {
        title: 'Network Error',
        description: 'Unable to connect to the server. Please check your internet connection and try again.',
        suggestion: 'This might be a temporary issue. Refreshing the page usually helps.',
      }
    }

    if (errorMessage.includes('timeout')) {
      return {
        title: 'Request Timeout',
        description: 'The request took too long to complete. Please try again.',
        suggestion: 'Your internet connection might be slow, or our servers might be experiencing high traffic.',
      }
    }

    if (errorMessage.includes('unauthorized') || errorMessage.includes('forbidden')) {
      return {
        title: 'Access Denied',
        description: 'You don&apos;t have permission to access this resource.',
        suggestion: 'Please log in or contact support if you believe this is an error.',
      }
    }

    // Generic error
    return {
      title: 'Something Went Wrong',
      description: 'We encountered an unexpected error while processing your request.',
      suggestion: 'Our team has been notified and is working on a fix. Please try again in a few moments.',
    }
  }

  const errorInfo = getErrorInfo()

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle background effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-destructive/5 rounded-full blur-3xl animate-blob" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-1/3 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl animate-blob animation-delay-4000" />
      </div>

      <div className="max-w-2xl w-full space-y-6">
        {/* Error Icon and Title */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-destructive/10 dark:bg-destructive/20 mb-2">
            <AlertCircle className="w-10 h-10 text-destructive" />
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            {errorInfo.title}
          </h1>

          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            {errorInfo.description}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            onClick={reset} 
            size="lg" 
            className="min-w-[160px]"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>

          <Button 
            asChild 
            variant="outline" 
            size="lg" 
            className="min-w-[160px]"
          >
            <a href="/">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </a>
          </Button>
        </div>

        {/* Information Card */}
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bug className="h-5 w-5 text-primary" />
              What Happened?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {errorInfo.suggestion}
            </p>

            {error.digest && (
              <div className="p-3 bg-background border border-border rounded-lg">
                <p className="text-xs text-muted-foreground font-mono">
                  Error ID: {error.digest}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Please reference this ID when contacting support.
                </p>
              </div>
            )}

            {/* Development-only error details */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-4 bg-destructive/10 border border-destructive rounded-lg">
                <p className="text-sm font-semibold text-destructive mb-2">
                  Development Error Details:
                </p>
                <p className="font-mono text-xs text-destructive break-all">
                  {error.message}
                </p>
                {error.stack && (
                  <pre className="mt-2 text-xs text-muted-foreground overflow-auto max-h-40 whitespace-pre-wrap break-all">
                    {error.stack}
                  </pre>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Help Options */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Need More Help?</CardTitle>
            <CardDescription>
              If the problem persists, we&apos;re here to help
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild variant="outline" className="flex-1">
                <a href="javascript:history.back()">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Go Back
                </a>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <a href="/contact">
                  <Mail className="mr-2 h-4 w-4" />
                  Contact Support
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Our team has been automatically notified of this issue.
          </p>
          <p className="text-xs text-muted-foreground">
            Error occurred at {new Date().toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  )
}
