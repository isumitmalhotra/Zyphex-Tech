'use client'

import React, { createContext, useContext, useCallback, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import * as Sentry from '@sentry/nextjs'

export interface ErrorContextData {
  route: string
  userRole?: 'admin' | 'user' | 'client' | 'guest'
  userId?: string
  projectId?: string
  clientId?: string
  lastAction?: string
  sessionId?: string
  timestamp: Date
  breadcrumbs: string[]
}

interface ErrorContextProviderProps {
  children: React.ReactNode
  userRole?: 'admin' | 'user' | 'client' | 'guest'
  userId?: string
  projectId?: string
  clientId?: string
}

interface ErrorContextValue {
  context: ErrorContextData
  updateLastAction: (action: string) => void
  addBreadcrumb: (breadcrumb: string) => void
  reportError: (error: Error, additionalData?: Record<string, unknown>) => void
}

const ErrorContext = createContext<ErrorContextValue | undefined>(undefined)

export function ErrorContextProvider({
  children,
  userRole = 'guest',
  userId,
  projectId,
  clientId
}: ErrorContextProviderProps) {
  const pathname = usePathname()
  const [context, setContext] = React.useState<ErrorContextData>({
    route: pathname,
    userRole,
    userId,
    projectId,
    clientId,
    timestamp: new Date(),
    breadcrumbs: []
  })

  // Generate session ID on mount
  useEffect(() => {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    setContext(prev => ({ ...prev, sessionId }))
  }, [])

  // Update route when pathname changes
  useEffect(() => {
    setContext(prev => ({
      ...prev,
      route: pathname,
      timestamp: new Date()
    }))
  }, [pathname])

  // Update context when props change
  useEffect(() => {
    setContext(prev => ({
      ...prev,
      userRole,
      userId,
      projectId,
      clientId
    }))
  }, [userRole, userId, projectId, clientId])

  const updateLastAction = useCallback((action: string) => {
    setContext(prev => ({
      ...prev,
      lastAction: action,
      timestamp: new Date()
    }))
  }, [])

  const addBreadcrumb = useCallback((breadcrumb: string) => {
    setContext(prev => ({
      ...prev,
      breadcrumbs: [...prev.breadcrumbs.slice(-9), breadcrumb], // Keep last 10
      timestamp: new Date()
    }))
  }, [])

  const reportError = useCallback((error: Error, additionalData?: Record<string, unknown>) => {
    // Enhanced error reporting with context
    Sentry.withScope((scope) => {
      // Set user context
      if (context.userId) {
        scope.setUser({
          id: context.userId,
          role: context.userRole
        })
      }

      // Set additional context
      scope.setContext('errorContext', {
        route: context.route,
        userRole: context.userRole,
        projectId: context.projectId,
        clientId: context.clientId,
        lastAction: context.lastAction,
        sessionId: context.sessionId,
        breadcrumbs: context.breadcrumbs,
        timestamp: context.timestamp.toISOString(),
        ...additionalData
      })

      // Set tags for better filtering
      scope.setTag('route', context.route)
      scope.setTag('userRole', context.userRole || 'guest')
      scope.setTag('errorSource', 'errorTemplate')

      // Add breadcrumbs
      context.breadcrumbs.forEach(breadcrumb => {
        scope.addBreadcrumb({
          message: breadcrumb,
          level: 'info',
          timestamp: Date.now() / 1000
        })
      })

      // Report the error
      Sentry.captureException(error)
    })
  }, [context])

  const value: ErrorContextValue = {
    context,
    updateLastAction,
    addBreadcrumb,
    reportError
  }

  return (
    <ErrorContext.Provider value={value}>
      {children}
    </ErrorContext.Provider>
  )
}

export function useErrorContext() {
  const context = useContext(ErrorContext)
  if (context === undefined) {
    throw new Error('useErrorContext must be used within an ErrorContextProvider')
  }
  return context
}

// Hook for tracking user actions
export function useActionTracker() {
  const { updateLastAction, addBreadcrumb } = useErrorContext()

  const trackAction = useCallback((action: string, breadcrumb?: string) => {
    updateLastAction(action)
    if (breadcrumb) {
      addBreadcrumb(breadcrumb)
    }
  }, [updateLastAction, addBreadcrumb])

  return { trackAction }
}

// Hook for route-specific error handling
export function useRouteErrorHandler() {
  const { context, reportError } = useErrorContext()

  const handleError = useCallback((error: Error, errorType?: string) => {
    const additionalData = {
      errorType,
      route: context.route,
      userRole: context.userRole,
      timestamp: new Date().toISOString()
    }

    reportError(error, additionalData)
  }, [context, reportError])

  const getErrorPageUrl = useCallback(() => {
    // Route to appropriate error page based on current route
    if (context.route.startsWith('/admin')) {
      return '/admin/error'
    } else if (context.route.startsWith('/dashboard')) {
      return '/dashboard/error'
    } else if (context.route.startsWith('/client')) {
      return '/client/error'
    }
    return '/error' // Fallback to root error page
  }, [context.route])

  return { handleError, getErrorPageUrl, context }
}