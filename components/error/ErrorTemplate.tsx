import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  AlertCircle,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  Settings,
  Shield
} from 'lucide-react'

export interface ErrorAction {
  id: string
  label: string
  href?: string
  onClick?: () => void | Promise<void>
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  icon?: React.ReactNode
  external?: boolean
}

export interface ErrorContext {
  route: string
  userRole?: 'admin' | 'user' | 'client' | 'guest'
  userId?: string
  projectId?: string
  lastAction?: string
  sessionId?: string
  timestamp: Date
}

export interface ErrorTemplateProps {
  // Error Information
  title: string
  description: string
  errorCode?: string
  errorType?: 'network' | 'permission' | 'validation' | 'server' | 'client' | 'unknown'
  
  // Visual Customization
  icon?: React.ReactNode
  severity?: 'low' | 'medium' | 'high' | 'critical'
  theme?: 'default' | 'admin' | 'client' | 'dashboard'
  
  // Actions
  primaryAction?: ErrorAction
  secondaryActions?: ErrorAction[]
  
  // Context & Metadata
  context?: ErrorContext
  showDetails?: boolean
  showReportButton?: boolean
  
  // Custom Content
  children?: React.ReactNode
  
  // Callbacks
  onRetry?: () => void | Promise<void>
  onReport?: (errorDetails: Record<string, unknown>) => void | Promise<void>
}

const severityConfig = {
  low: {
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
    borderColor: 'border-blue-200 dark:border-blue-800'
  },
  medium: {
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/20', 
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    borderColor: 'border-yellow-200 dark:border-yellow-800'
  },
  high: {
    bgColor: 'bg-orange-50 dark:bg-orange-950/20',
    iconColor: 'text-orange-600 dark:text-orange-400', 
    borderColor: 'border-orange-200 dark:border-orange-800'
  },
  critical: {
    bgColor: 'bg-red-50 dark:bg-red-950/20',
    iconColor: 'text-red-600 dark:text-red-400',
    borderColor: 'border-red-200 dark:border-red-800'
  }
}

const themeConfig = {
  default: {
    containerClass: 'min-h-screen bg-background',
    cardClass: 'max-w-2xl mx-auto'
  },
  admin: {
    containerClass: 'min-h-screen bg-slate-50 dark:bg-slate-950',
    cardClass: 'max-w-4xl mx-auto border-2'
  },
  client: {
    containerClass: 'min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800',
    cardClass: 'max-w-3xl mx-auto shadow-xl'
  },
  dashboard: {
    containerClass: 'min-h-[60vh] bg-background',
    cardClass: 'max-w-xl mx-auto'
  }
}

export function ErrorTemplate({
  title,
  description,
  errorCode,
  errorType = 'unknown',
  icon,
  severity = 'medium',
  theme = 'default',
  primaryAction,
  secondaryActions = [],
  context,
  showDetails = false,
  showReportButton = true,
  children,
  onRetry,
  onReport
}: ErrorTemplateProps) {
  const [isRetrying, setIsRetrying] = React.useState(false)
  const [showFullDetails, setShowFullDetails] = React.useState(false)
  
  const severityStyle = severityConfig[severity]
  const themeStyle = themeConfig[theme]
  
  const handleRetry = async () => {
    if (!onRetry) return
    
    try {
      setIsRetrying(true)
      await onRetry()
    } catch (error) {
      console.error('Retry failed:', error)
    } finally {
      setIsRetrying(false)
    }
  }
  
  const handleReport = async () => {
    if (!onReport) return
    
    const errorDetails = {
      title,
      description,
      errorCode,
      errorType,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }
    
    try {
      await onReport(errorDetails)
    } catch (error) {
      console.error('Failed to report error:', error)
    }
  }
  
  // Default icon based on error type
  const getDefaultIcon = () => {
    switch (errorType) {
      case 'network':
        return <ExternalLink className="w-8 h-8" />
      case 'permission':
        return <Shield className="w-8 h-8" />
      case 'server':
        return <Settings className="w-8 h-8" />
      default:
        return <AlertCircle className="w-8 h-8" />
    }
  }
  
  const displayIcon = icon || getDefaultIcon()
  
  return (
    <div className={`${themeStyle.containerClass} flex items-center justify-center p-4 relative`}>
      {/* Background Effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-blob" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl animate-blob animation-delay-2000" />
      </div>
      
      <div className={`${themeStyle.cardClass} w-full space-y-6`}>
        {/* Main Error Card */}
        <Card className={`${severityStyle.bgColor} ${severityStyle.borderColor}`}>
          <CardHeader className="text-center space-y-4">
            {/* Error Icon */}
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-background/80 ${severityStyle.iconColor}`}>
              {displayIcon}
            </div>
            
            {/* Error Code Badge */}
            {errorCode && (
              <Badge variant="outline" className="mx-auto">
                Error {errorCode}
              </Badge>
            )}
            
            {/* Title & Description */}
            <div className="space-y-2">
              <CardTitle className="text-2xl md:text-3xl font-bold text-foreground">
                {title}
              </CardTitle>
              <CardDescription className="text-lg text-muted-foreground max-w-lg mx-auto">
                {description}
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Primary Action */}
            {primaryAction && (
              <div className="flex justify-center">
                <Button
                  variant={primaryAction.variant || 'default'}
                  size="lg"
                  className="min-w-[160px]"
                  asChild={!!primaryAction.href}
                  onClick={primaryAction.onClick}
                >
                  {primaryAction.href ? (
                    <Link 
                      href={primaryAction.href}
                      target={primaryAction.external ? '_blank' : undefined}
                      rel={primaryAction.external ? 'noopener noreferrer' : undefined}
                    >
                      {primaryAction.icon}
                      {primaryAction.label}
                      {primaryAction.external && <ExternalLink className="ml-2 h-4 w-4" />}
                    </Link>
                  ) : (
                    <>
                      {primaryAction.icon}
                      {primaryAction.label}
                    </>
                  )}
                </Button>
              </div>
            )}
            
            {/* Secondary Actions */}
            {secondaryActions.length > 0 && (
              <div className="flex flex-wrap gap-3 justify-center">
                {secondaryActions.map((action) => (
                  <Button
                    key={action.id}
                    variant={action.variant || 'outline'}
                    size="sm"
                    asChild={!!action.href}
                    onClick={action.onClick}
                  >
                    {action.href ? (
                      <Link 
                        href={action.href}
                        target={action.external ? '_blank' : undefined}
                        rel={action.external ? 'noopener noreferrer' : undefined}
                      >
                        {action.icon}
                        {action.label}
                        {action.external && <ExternalLink className="ml-1 h-3 w-3" />}
                      </Link>
                    ) : (
                      <>
                        {action.icon}
                        {action.label}
                      </>
                    )}
                  </Button>
                ))}
              </div>
            )}
            
            {/* Retry & Report Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              {onRetry && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRetry}
                  disabled={isRetrying}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
                  {isRetrying ? 'Retrying...' : 'Try Again'}
                </Button>
              )}
              
              {showReportButton && onReport && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReport}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Report Issue
                </Button>
              )}
            </div>
            
            {/* Custom Content */}
            {children && (
              <div className="border-t pt-4">
                {children}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Error Details (Collapsible) */}
        {showDetails && context && (
          <Card className="bg-muted/30">
            <CardHeader className="pb-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFullDetails(!showFullDetails)}
                className="h-8 px-2 text-sm"
              >
                {showFullDetails ? 'Hide' : 'Show'} Technical Details
              </Button>
            </CardHeader>
            
            {showFullDetails && (
              <CardContent className="pt-0 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Route:</strong> {context.route}
                  </div>
                  <div>
                    <strong>User Role:</strong> {context.userRole || 'Unknown'}
                  </div>
                  <div>
                    <strong>Error Type:</strong> {errorType}
                  </div>
                  <div>
                    <strong>Timestamp:</strong> {context.timestamp.toLocaleString()}
                  </div>
                  {context.lastAction && (
                    <div className="md:col-span-2">
                      <strong>Last Action:</strong> {context.lastAction}
                    </div>
                  )}
                  {context.sessionId && (
                    <div className="md:col-span-2">
                      <strong>Session ID:</strong> 
                      <code className="ml-2 text-xs bg-background px-1 py-0.5 rounded">
                        {context.sessionId}
                      </code>
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}