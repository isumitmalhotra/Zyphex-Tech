'use client'

import React from 'react'
import Link from 'next/link'
import { ErrorTemplate } from '@/components/error/ErrorTemplate'
import { useErrorContext } from '@/lib/error/error-context'
import { getErrorConfig, getErrorMessage, generateErrorCode } from '@/lib/error/error-config'
import { Home, MessageSquare, Phone, Mail, FileText, Calendar, User } from 'lucide-react'

interface ClientErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ClientError({ error, reset }: ClientErrorProps) {
  const { context, reportError } = useErrorContext()
  const [hasReported, setHasReported] = React.useState(false)
  
  // Determine error type with client-specific context
  const getErrorType = (error: Error) => {
    const message = error.message.toLowerCase()
    
    if (message.includes('network') || message.includes('connection')) return 'network'
    if (message.includes('permission') || message.includes('access')) return 'permission'
    if (message.includes('project') || message.includes('not found')) return 'client'
    if (message.includes('server')) return 'server'
    return 'client'
  }
  
  const errorType = getErrorType(error)
  const errorMessage = getErrorMessage(errorType)
  const errorCode = generateErrorCode(errorType, '/client')
  const config = getErrorConfig('/client')

  // Handle client error retry with project context preservation
  const handleRetry = async () => {
    try {
      // Preserve client session and project context
      const clientState = {
        currentProject: context.projectId,
        clientId: context.clientId,
        lastRoute: context.route,
        timestamp: new Date().toISOString()
      }
      localStorage.setItem('client-recovery-state', JSON.stringify(clientState))
      
      reset()
    } catch (retryError) {
      console.error('Client retry failed:', retryError)
      reportError(retryError instanceof Error ? retryError : new Error('Client retry failed'))
    }
  }

  // Handle error reporting with client-specific context
  const handleReport = async (errorDetails: Record<string, unknown>) => {
    if (hasReported) return
    
    try {
      // Log error details for debugging
      console.error('Client error context:', {
        ...errorDetails,
        clientSection: context.route.split('/').pop() || 'portal',
        clientId: context.clientId,
        projectId: context.projectId,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      })
      
      await reportError(error)
      setHasReported(true)
    } catch (reportingError) {
      console.error('Failed to report client error:', reportingError)
    }
  }

  // Client-specific actions
  const clientActions = [
    {
      id: 'client-portal',
      label: 'Client Portal Home',
      href: '/client',
      variant: 'default' as const,
      icon: <Home className="mr-2 h-4 w-4" />
    },
    {
      id: 'my-projects',
      label: 'My Projects',
      href: '/client/projects',
      variant: 'outline' as const,
      icon: <FileText className="mr-2 h-4 w-4" />
    },
    {
      id: 'schedule-meeting',
      label: 'Schedule Meeting',
      href: '/client/meetings',
      variant: 'outline' as const,
      icon: <Calendar className="mr-2 h-4 w-4" />
    },
    {
      id: 'contact-support',
      label: 'Contact Support',
      href: '/client/support',
      variant: 'outline' as const,
      icon: <MessageSquare className="mr-2 h-4 w-4" />
    }
  ]

  return (
    <ErrorTemplate
      title={errorMessage.title}
      description={`${errorMessage.description} Our client success team is here to help you get back to your projects quickly.`}
      errorCode={errorCode}
      errorType={errorType}
      severity={config.severity}
      theme={config.theme}
      primaryAction={{
        id: 'client-retry',
        label: 'Return to Portal',
        variant: 'default',
        onClick: handleRetry
      }}
      secondaryActions={clientActions}
      context={{
        route: context.route,
        userRole: context.userRole as 'client' | 'admin' | 'user' | 'guest' | undefined,
        projectId: context.projectId,
        timestamp: new Date()
      }}
      showDetails={config.showDetails}
      showReportButton={config.showReportButton}
      onRetry={handleRetry}
      onReport={handleReport}
    >
      {/* Client-specific support and contact information */}
      <div className="space-y-4">
        {/* Priority Support Card */}
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <User className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="space-y-3 flex-1">
              <h4 className="font-medium text-blue-900 dark:text-blue-100">
                Dedicated Client Support
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                As a valued client, you have access to priority support channels. 
                Our team will respond to your inquiry within 2 hours during business hours.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <div>
                    <div className="font-medium text-blue-900 dark:text-blue-100">Phone Support</div>
                    <div className="text-blue-700 dark:text-blue-300">+91 7777010114</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <div>
                    <div className="font-medium text-blue-900 dark:text-blue-100">Email Support</div>
                    <div className="text-blue-700 dark:text-blue-300">info@zyphextech.com</div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                  Priority Response
                </span>
                <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                  Dedicated Account Manager
                </span>
                <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                  24/7 Emergency Line
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Current Project Context (if available) */}
        {context.projectId && (
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <FileText className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div className="space-y-2">
                <h4 className="font-medium text-green-900 dark:text-green-100">
                  Project Context Preserved
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Your current project session has been saved. When you return to the portal, 
                  you&apos;ll be taken back to where you left off.
                </p>
                <div className="text-xs text-green-600 dark:text-green-400">
                  <strong>Project ID:</strong> <code className="bg-green-100 dark:bg-green-900/50 px-1 rounded">{context.projectId}</code>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">
              Quick Actions
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <Link
                href="/client/help"
                className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span>View Help Documentation</span>
              </Link>
              
              <Link
                href="/client/status"
                className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <Calendar className="w-4 h-4" />
                <span>Check Project Status</span>
              </Link>
              
              <Link
                href="/client/billing"
                className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span>Billing & Invoices</span>
              </Link>
              
              <Link
                href="/client/feedback"
                className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Send Feedback</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </ErrorTemplate>
  )
}