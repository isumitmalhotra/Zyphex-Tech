'use client'

import React, { createContext, useContext, ReactNode } from 'react'

/**
 * Stub Error Context - Sentry disabled
 * Provides minimal error context functionality without Sentry
 */

interface ErrorContextType {
  context: {
    route: string
    userRole?: string
    projectId?: string
    clientId?: string
  }
  reportError: (error: Error) => void
}

const ErrorContext = createContext<ErrorContextType>({
  context: {
    route: '/',
  },
  reportError: (error: Error) => {
    console.error('[Error Context]', error)
  },
})

export function ErrorProvider({ children }: { children: ReactNode }) {
  const context = {
    route: typeof window !== 'undefined' ? window.location.pathname : '/',
  }

  const reportError = (error: Error) => {
    console.error('[Error Reported]', error)
  }

  return (
    <ErrorContext.Provider value={{ context, reportError }}>
      {children}
    </ErrorContext.Provider>
  )
}

export function useErrorContext() {
  return useContext(ErrorContext)
}
