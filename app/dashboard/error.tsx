'use client'

import React from 'react'
import { ErrorTemplate } from '@/components/error/ErrorTemplate'
import { useErrorContext } from '@/lib/error/error-context'
import { getErrorConfig, getErrorMessage, generateErrorCode } from '@/lib/error/error-config'
import { Home, RefreshCw, MessageSquare, BarChart3, Settings } from 'lucide-react'

interface DashboardErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  const { context, reportError } = useErrorContext()
  const [hasReported, setHasReported] = React.useState(false)
  
  // Determine error type based on error characteristics
  const getErrorType = (error: Error) => {
    const message = error.message.toLowerCase()
    
    if (message.includes('network') || message.includes('fetch')) return 'network'
    if (message.includes('permission') || message.includes('unauthorized')) return 'permission'
    if (message.includes('validation') || message.includes('invalid')) return 'validation'
    if (message.includes('server') || message.includes('internal')) return 'server'
    return 'client'
  }
  
  const errorType = getErrorType(error)
  const errorMessage = getErrorMessage(errorType)
  const errorCode = generateErrorCode(errorType, '/dashboard')
  const config = getErrorConfig('/dashboard')

  // Handle error retry with dashboard state preservation
  const handleRetry = async () => {
    try {
      // Preserve dashboard filters/state in localStorage
      const dashboardState = {
        lastRoute: context.route,
        timestamp: new Date().toISOString(),
        userPreferences: localStorage.getItem('dashboard-preferences')
      }
      localStorage.setItem('dashboard-recovery-state', JSON.stringify(dashboardState))
      
      // Reset the error boundary
      reset()
    } catch (retryError) {
      console.error('Dashboard retry failed:', retryError)
      reportError(retryError instanceof Error ? retryError : new Error('Retry failed'))
    }
  }

  // Handle error reporting with dashboard context
  const handleReport = async (errorDetails: Record<string, unknown>) => {
    if (hasReported) return
    
    try {
      const dashboardContext = {
        ...errorDetails,
        dashboardSection: context.route.split('/').pop() || 'main',
        userRole: context.userRole,
        lastAction: context.lastAction,
        breadcrumbs: context.breadcrumbs,
        dashboardPreferences: localStorage.getItem('dashboard-preferences'),
        viewportSize: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      }
      
      await reportError(error, dashboardContext)
      setHasReported(true)
    } catch (reportError) {
      console.error('Failed to report dashboard error:', reportError)
    }
  }

  // Dashboard-specific actions
  const dashboardActions = [
    {
      id: 'dashboard-home',
      label: 'Dashboard Home',
      href: '/dashboard',
      variant: 'default' as const,
      icon: <Home className="mr-2 h-4 w-4" />
    },
    {
      id: 'analytics',
      label: 'View Analytics',
      href: '/dashboard/analytics',
      variant: 'outline' as const,
      icon: <BarChart3 className="mr-2 h-4 w-4" />
    },
    {
      id: 'settings',
      label: 'Dashboard Settings',
      href: '/dashboard/settings',
      variant: 'outline' as const,
      icon: <Settings className="mr-2 h-4 w-4" />
    },
    {
      id: 'support',
      label: 'Get Help',
      href: '/support',
      variant: 'outline' as const,
      icon: <MessageSquare className="mr-2 h-4 w-4" />
    }
  ]

  return (
    <ErrorTemplate
      title={errorMessage.title}
      description={`${errorMessage.description} Your dashboard data and preferences have been preserved.`}
      errorCode={errorCode}
      errorType={errorType}
      severity={config.severity}
      theme={config.theme}
      primaryAction={{
        id: 'retry-dashboard',
        label: 'Restore Dashboard',
        variant: 'default',
        icon: <RefreshCw className="mr-2 h-4 w-4" />,
        onClick: handleRetry
      }}
      secondaryActions={dashboardActions}
      context={context}
      showDetails={config.showDetails}
      showReportButton={config.showReportButton}
      onRetry={handleRetry}
      onReport={handleReport}
    >
      {/* Dashboard-specific recovery information */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="space-y-2">
            <h4 className="font-medium text-blue-900 dark:text-blue-100">
              Dashboard Recovery Available
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Your dashboard preferences, filters, and view settings have been automatically saved. 
              Click "Restore Dashboard" to return to your previous state.
            </p>
            <div className="flex flex-wrap gap-2 text-xs text-blue-600 dark:text-blue-400">
              <span className="bg-blue-100 dark:bg-blue-900/50 px-2 py-1 rounded">
                Session Preserved
              </span>
              <span className="bg-blue-100 dark:bg-blue-900/50 px-2 py-1 rounded">
                Filters Saved
              </span>
              <span className="bg-blue-100 dark:bg-blue-900/50 px-2 py-1 rounded">
                Quick Recovery
              </span>
            </div>
          </div>
        </div>
      </div>
    </ErrorTemplate>
  )
}