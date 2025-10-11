'use client'

import React from 'react'
import { ErrorTemplate } from '@/components/error/ErrorTemplate'
import { useErrorContext } from '@/lib/error/error-context'
import { getErrorConfig, getErrorMessage, generateErrorCode } from '@/lib/error/error-config'
import { Shield, Settings, Database, AlertTriangle, ExternalLink, Terminal, Activity } from 'lucide-react'

interface AdminErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function AdminError({ error, reset }: AdminErrorProps) {
  const { context, reportError } = useErrorContext()
  const [systemStatus, setSystemStatus] = React.useState<'checking' | 'healthy' | 'degraded' | 'down'>('checking')
  const [hasReported, setHasReported] = React.useState(false)
  
  // Check system status on mount
  React.useEffect(() => {
    checkSystemStatus()
  }, [])
  
  const checkSystemStatus = async () => {
    try {
      // Simulate system health checks
      const checks = await Promise.allSettled([
        fetch('/api/health/database'),
        fetch('/api/health/redis'),
        fetch('/api/health/external-services')
      ])
      
      const failedChecks = checks.filter(check => check.status === 'rejected').length
      
      if (failedChecks === 0) {
        setSystemStatus('healthy')
      } else if (failedChecks <= 1) {
        setSystemStatus('degraded')
      } else {
        setSystemStatus('down')
      }
    } catch {
      setSystemStatus('down')
    }
  }
  
  // Determine error type with admin-specific context
  const getErrorType = (error: Error) => {
    const message = error.message.toLowerCase()
    const stack = error.stack?.toLowerCase() || ''
    
    if (message.includes('database') || stack.includes('prisma')) return 'server'
    if (message.includes('permission') || message.includes('admin')) return 'permission'
    if (message.includes('network') || message.includes('fetch')) return 'network'
    if (message.includes('validation')) return 'validation'
    return 'server' // Default to server for admin errors
  }
  
  const errorType = getErrorType(error)
  const errorMessage = getErrorMessage(errorType)
  const errorCode = generateErrorCode(errorType, '/admin')
  const config = getErrorConfig('/admin')

  // Handle admin error retry with system diagnostics
  const handleRetry = async () => {
    try {
      // Run pre-retry diagnostics
      setSystemStatus('checking')
      await checkSystemStatus()
      
      // Log admin retry attempt
      console.info('Admin error retry initiated:', {
        errorCode,
        systemStatus,
        timestamp: new Date().toISOString()
      })
      
      reset()
    } catch (retryError) {
      console.error('Admin retry failed:', retryError)
      reportError(retryError instanceof Error ? retryError : new Error('Admin retry failed'))
    }
  }

  // Enhanced error reporting for admin context
  const handleReport = async (errorDetails: Record<string, unknown>) => {
    if (hasReported) return
    
    try {
      const adminContext = {
        ...errorDetails,
        adminSection: context.route.split('/').pop() || 'main',
        systemStatus,
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        adminPermissions: context.userRole === 'admin',
        errorStack: error.stack,
        breadcrumbs: context.breadcrumbs,
        sessionInfo: {
          userId: context.userId,
          sessionId: context.sessionId,
          lastAction: context.lastAction
        }
      }
      
      await reportError(error, adminContext)
      setHasReported(true)
    } catch (reportingError) {
      console.error('Failed to report admin error:', reportingError)
    }
  }

  // Admin-specific actions
  const adminActions = [
    {
      id: 'admin-dashboard',
      label: 'Admin Dashboard', 
      href: '/admin',
      variant: 'default' as const,
      icon: <Shield className="mr-2 h-4 w-4" />
    },
    {
      id: 'system-status',
      label: 'System Status',
      href: '/admin/system-status',
      variant: 'outline' as const,
      icon: <Activity className="mr-2 h-4 w-4" />
    },
    {
      id: 'error-logs',
      label: 'Error Logs',
      href: '/admin/logs',
      variant: 'outline' as const,
      icon: <Terminal className="mr-2 h-4 w-4" />
    },
    {
      id: 'database-status',
      label: 'Database Status',
      href: '/admin/database',
      variant: 'outline' as const,
      icon: <Database className="mr-2 h-4 w-4" />
    }
  ]

  const getSystemStatusDisplay = () => {
    switch (systemStatus) {
      case 'checking':
        return { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Checking...' }
      case 'healthy':
        return { color: 'text-green-600', bg: 'bg-green-100', label: 'All Systems Operational' }
      case 'degraded':
        return { color: 'text-orange-600', bg: 'bg-orange-100', label: 'Degraded Performance' }
      case 'down':
        return { color: 'text-red-600', bg: 'bg-red-100', label: 'System Issues Detected' }
    }
  }

  const statusDisplay = getSystemStatusDisplay()

  return (
    <ErrorTemplate
      title={errorMessage.title}
      description={`${errorMessage.description} Administrative tools and system diagnostics are available below.`}
      errorCode={errorCode}
      errorType={errorType}
      severity={config.severity}
      theme={config.theme}
      primaryAction={{
        id: 'admin-retry',
        label: 'Run Diagnostics & Retry',
        variant: 'default',
        icon: <Settings className="mr-2 h-4 w-4" />,
        onClick: handleRetry
      }}
      secondaryActions={adminActions}
      context={context}
      showDetails={config.showDetails}
      showReportButton={config.showReportButton}
      onRetry={handleRetry}
      onReport={handleReport}
    >
      {/* Admin-specific system status and diagnostics */}
      <div className="space-y-4">
        {/* System Status Card */}
        <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Activity className="w-5 h-5 text-slate-600 dark:text-slate-400 mt-0.5" />
            <div className="space-y-3 flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-slate-900 dark:text-slate-100">
                  System Status
                </h4>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusDisplay.bg} ${statusDisplay.color}`}>
                  {statusDisplay.label}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-slate-600 dark:text-slate-400">Database</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-slate-600 dark:text-slate-400">Cache Layer</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-slate-600 dark:text-slate-400">API Services</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Details Card (Admin-specific) */}
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
            <div className="space-y-2 flex-1">
              <h4 className="font-medium text-red-900 dark:text-red-100">
                Administrative Error Details
              </h4>
              <div className="text-sm text-red-700 dark:text-red-300 space-y-1">
                <p><strong>Error Type:</strong> {errorType.toUpperCase()}</p>
                <p><strong>Route:</strong> {context.route}</p>
                <p><strong>User Role:</strong> {context.userRole}</p>
                <p><strong>Session:</strong> {context.sessionId?.slice(-8) || 'Unknown'}</p>
                {error.digest && (
                  <p><strong>Error Digest:</strong> <code className="bg-red-100 dark:bg-red-900/50 px-1 rounded">{error.digest}</code></p>
                )}
              </div>
              
              <div className="flex space-x-2 pt-2">
                <button
                  onClick={() => navigator.clipboard.writeText(JSON.stringify({
                    errorCode,
                    message: error.message,
                    stack: error.stack,
                    context
                  }, null, 2))}
                  className="text-xs bg-red-100 hover:bg-red-200 dark:bg-red-900/50 dark:hover:bg-red-900/70 px-2 py-1 rounded transition-colors"
                >
                  Copy Error Info
                </button>
                <a
                  href="/admin/logs"
                  className="text-xs bg-red-100 hover:bg-red-200 dark:bg-red-900/50 dark:hover:bg-red-900/70 px-2 py-1 rounded transition-colors inline-flex items-center"
                >
                  View Logs <ExternalLink className="ml-1 w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorTemplate>
  )
}