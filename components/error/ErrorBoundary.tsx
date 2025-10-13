'use client';

import React from 'react';
import * as Sentry from '@sentry/nextjs';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorInfo {
  componentStack: string;
}

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  eventId?: string;
}

/**
 * Error Boundary component that catches React errors and reports them to Sentry
 * Provides a user-friendly fallback UI when errors occur
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to Sentry
    const eventId = Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });

    this.setState({ error, errorInfo, eventId });

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorBoundary] Caught error:', error);
      console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
    }
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined,
      eventId: undefined 
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI provided by parent
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
          <div className="max-w-md w-full bg-white shadow-xl rounded-lg p-8 border border-gray-200">
            <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
              Oops! Something went wrong
            </h2>
            
            <p className="text-gray-600 text-center mb-6">
              We apologize for the inconvenience. Our team has been notified and is working on fixing this issue.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                  Error Details (Development Mode)
                </summary>
                <div className="mt-2 space-y-2">
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-1">Error Message:</p>
                    <pre className="text-xs bg-white p-2 rounded border border-gray-200 overflow-auto">
                      {this.state.error.message}
                    </pre>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-1">Stack Trace:</p>
                    <pre className="text-xs bg-white p-2 rounded border border-gray-200 overflow-auto max-h-40">
                      {this.state.error.stack}
                    </pre>
                  </div>
                  {this.state.errorInfo?.componentStack && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-1">Component Stack:</p>
                      <pre className="text-xs bg-white p-2 rounded border border-gray-200 overflow-auto max-h-40">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                  {this.state.eventId && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-1">Sentry Event ID:</p>
                      <p className="text-xs bg-white p-2 rounded border border-gray-200 font-mono">
                        {this.state.eventId}
                      </p>
                    </div>
                  )}
                </div>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={this.handleReset} 
                className="flex-1 flex items-center justify-center gap-2"
                variant="default"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
              
              <Button 
                onClick={this.handleGoHome} 
                className="flex-1 flex items-center justify-center gap-2"
                variant="outline"
              >
                <Home className="w-4 h-4" />
                Go Home
              </Button>
            </div>

            {this.state.eventId && process.env.NODE_ENV !== 'development' && (
              <p className="text-xs text-gray-500 text-center mt-4">
                Error ID: {this.state.eventId}
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
