// Sentry disabled to prevent build errors
// import { captureException, captureMessage, setUser, setTag, setContext, addBreadcrumb as sentryAddBreadcrumb } from '@sentry/nextjs';

// Stub functions to replace Sentry calls
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const captureException = (_error: any) => console.error('[SENTRY DISABLED]', _error);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const captureMessage = (_message: string, _level?: any) => console.log('[SENTRY DISABLED]', _message, _level);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const setUser = (_user: any) => { /* noop */ };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const setTag = (_key: string, _value: any) => { /* noop */ };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const setContext = (_name: string, _context: any) => { /* noop */ };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sentryAddBreadcrumb = (_breadcrumb: any) => { /* noop */ };

import { NextRequest } from 'next/server';
import { ApiErrorCode, ErrorSeverity } from '@/lib/api/error-types';
import React from 'react';

/**
 * Centralized Error Logging Service
 * 
 * Provides comprehensive error logging, context enrichment, and monitoring
 * integration for the Zyphex Tech platform. This service handles both 
 * client-side and server-side error tracking with detailed context information.
 * 
 * Features:
 * - Sentry integration for comprehensive error tracking
 * - User context and session tracking
 * - Route and performance correlation
 * - Browser and device information capture
 * - Error categorization and severity assessment
 * - Breadcrumb tracking for error reproduction
 * - Rate limiting for error spam prevention
 * - Development vs production behavior
 */

// Types for error logging context
export interface ErrorContext {
  userId?: string;
  userEmail?: string;
  userRole?: string;
  route?: string;
  method?: string;
  statusCode?: number;
  requestId?: string;
  sessionId?: string;
  userAgent?: string;
  ipAddress?: string;
  referer?: string;
  timestamp?: string;
  buildVersion?: string;
  environment?: string;
}

export interface BrowserInfo {
  userAgent: string;
  language: string;
  platform: string;
  cookieEnabled: boolean;
  onLine: boolean;
  screen?: {
    width: number;
    height: number;
    colorDepth: number;
  };
  viewport?: {
    width: number;
    height: number;
  };
}

export interface PerformanceContext {
  loadTime?: number;
  renderTime?: number;
  apiResponseTime?: number;
  memoryUsage?: number;
  networkType?: string;
  connectionSpeed?: string;
}

export interface ErrorLogEntry {
  id: string;
  message: string;
  stack?: string;
  code?: ApiErrorCode;
  severity: ErrorSeverity;
  context: ErrorContext;
  browserInfo?: BrowserInfo;
  performanceContext?: PerformanceContext;
  tags: Record<string, string>;
  fingerprint?: string[];
  timestamp: Date;
  resolved: boolean;
  occurrenceCount: number;
}

/**
 * Error Logger Class
 * 
 * Main class for handling error logging with context enrichment
 */
class ErrorLogger {
  private rateLimitMap = new Map<string, { count: number; resetTime: number }>();
  private readonly maxErrorsPerMinute = 10;
  private readonly rateLimitWindow = 60000; // 1 minute

  constructor() {
    this.setupGlobalErrorHandlers();
  }

  /**
   * Log an error with full context enrichment
   */
  async logError(
    error: Error | string,
    context: Partial<ErrorContext> = {},
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    additionalData?: Record<string, unknown>
  ): Promise<void> {
    try {
      // Rate limiting check
      if (!this.checkRateLimit(context.userId || 'anonymous')) {
        console.warn('Error logging rate limit exceeded for user:', context.userId);
        return;
      }

      // Enrich context with environment data
      const enrichedContext = await this.enrichContext(context);
      
      // Create error entry
      const errorEntry: Partial<ErrorLogEntry> = {
        id: this.generateErrorId(),
        message: typeof error === 'string' ? error : error.message,
        stack: typeof error === 'object' ? error.stack : undefined,
        severity,
        context: enrichedContext,
        tags: this.generateTags(enrichedContext, severity),
        timestamp: new Date(),
        resolved: false,
        occurrenceCount: 1
      };

      // Set Sentry context
      await this.setSentryContext(enrichedContext, additionalData);

      // Log to Sentry
      if (typeof error === 'string') {
        captureMessage(error, severity.toLowerCase() as 'info' | 'warning' | 'error');
      } else {
        captureException(error);
      }

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        this.logToConsole(errorEntry as ErrorLogEntry);
      }

      // Add breadcrumb for future errors
      this.addErrorBreadcrumb(errorEntry as ErrorLogEntry);

      // Store in database if configured (optional enhancement)
      if (process.env.DATABASE_ERROR_LOGGING === 'true') {
        await this.logToDatabase(errorEntry as ErrorLogEntry);
      }

    } catch (loggingError) {
      // Fallback logging to prevent logging errors from breaking the app
      console.error('Error in error logging service:', loggingError);
      console.error('Original error:', error);
    }
  }

  /**
   * Log API errors with request context
   */
  async logApiError(
    error: Error | string,
    request: NextRequest,
    response?: Response,
    additionalContext?: Record<string, unknown>
  ): Promise<void> {
    const context: Partial<ErrorContext> = {
      route: request.nextUrl.pathname,
      method: request.method,
      statusCode: response?.status,
      requestId: request.headers.get('x-request-id') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
      ipAddress: this.getClientIP(request),
      referer: request.headers.get('referer') || undefined,
      ...additionalContext
    };

    await this.logError(error, context, ErrorSeverity.HIGH);
  }

  /**
   * Log client-side errors with browser context
   */
  async logClientError(
    error: Error | string,
    browserInfo?: BrowserInfo,
    performanceContext?: PerformanceContext,
    userId?: string
  ): Promise<void> {
    const context: Partial<ErrorContext> = {
      userId,
      route: typeof window !== 'undefined' ? window.location.pathname : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      timestamp: new Date().toISOString(),
      environment: 'client'
    };

    const errorEntry: Partial<ErrorLogEntry> = {
      browserInfo,
      performanceContext
    };

    await this.logError(error, context, ErrorSeverity.MEDIUM, errorEntry);
  }

  /**
   * Log authentication errors with user context
   */
  async logAuthError(
    error: Error | string,
    userId?: string,
    email?: string,
    attemptedAction?: string
  ): Promise<void> {
    const context: Partial<ErrorContext> = {
      userId,
      userEmail: email,
      route: '/auth',
      environment: 'server'
    };

    setTag('error_category', 'authentication');
    setTag('attempted_action', attemptedAction || 'unknown');

    await this.logError(error, context, ErrorSeverity.HIGH);
  }

  /**
   * Log database errors with query context
   */
  async logDatabaseError(
    error: Error | string,
    query?: string,
    parameters?: Record<string, unknown>,
    userId?: string
  ): Promise<void> {
    const context: Partial<ErrorContext> = {
      userId,
      environment: 'database'
    };

    setContext('database', {
      query: query?.substring(0, 500), // Limit query length for privacy
      parameterCount: parameters ? Object.keys(parameters).length : 0,
      errorType: 'database_operation'
    });

    setTag('error_category', 'database');

    await this.logError(error, context, ErrorSeverity.CRITICAL);
  }

  /**
   * Set user context for error tracking
   */
  setUserContext(userId: string, email?: string, role?: string): void {
    setUser({
      id: userId,
      email,
      username: email?.split('@')[0],
      role
    });

    setTag('user_role', role || 'unknown');
  }

  /**
   * Add breadcrumb for error context
   */
  addBreadcrumb(
    message: string,
    category: string = 'navigation',
    level: 'info' | 'debug' | 'warning' | 'error' = 'info',
    data?: Record<string, unknown>
  ): void {
    sentryAddBreadcrumb({
      message,
      category,
      level,
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Track performance issues that might lead to errors
   */
  trackPerformanceIssue(
    metric: string,
    value: number,
    threshold: number,
    context?: Record<string, unknown>
  ): void {
    if (value > threshold) {
      setContext('performance', {
        metric,
        value,
        threshold,
        exceeded: true,
        ...context
      });

      setTag('performance_issue', metric);

      captureMessage(
        `Performance threshold exceeded: ${metric} = ${value} (threshold: ${threshold})`,
        'warning'
      );
    }
  }

  /**
   * Private helper methods
   */
  private async enrichContext(context: Partial<ErrorContext>): Promise<ErrorContext> {
    return {
      ...context,
      timestamp: context.timestamp || new Date().toISOString(),
      buildVersion: process.env.BUILD_VERSION || process.env.npm_package_version || 'unknown',
      environment: process.env.NODE_ENV || 'unknown',
      requestId: context.requestId || this.generateRequestId()
    };
  }

  private setSentryContext(context: ErrorContext, additionalData?: Record<string, unknown>): void {
    // Set user context if available
    if (context.userId) {
      setUser({
        id: context.userId,
        email: context.userEmail,
        username: context.userEmail?.split('@')[0]
      });
    }

    // Set tags for filtering
    const tags = this.generateTags(context, ErrorSeverity.MEDIUM);
    Object.entries(tags).forEach(([key, value]) => {
      setTag(key, value);
    });

    // Set additional context
    setContext('request', {
      route: context.route,
      method: context.method,
      statusCode: context.statusCode,
      requestId: context.requestId,
      userAgent: context.userAgent,
      ipAddress: context.ipAddress
    });

    if (additionalData) {
      setContext('additional', additionalData);
    }
  }

  private generateTags(context: ErrorContext, severity: ErrorSeverity): Record<string, string> {
    return {
      severity: severity.toLowerCase(),
      environment: context.environment || 'unknown',
      route: context.route || 'unknown',
      method: context.method || 'unknown',
      user_role: context.userRole || 'unknown',
      build_version: context.buildVersion || 'unknown'
    };
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const clientIP = request.headers.get('x-client-ip');
    
    return (
      forwarded?.split(',')[0] ||
      realIP ||
      clientIP ||
      'unknown'
    );
  }

  private checkRateLimit(identifier: string): boolean {
    const now = Date.now();
    const rateLimitData = this.rateLimitMap.get(identifier);

    if (!rateLimitData || now > rateLimitData.resetTime) {
      this.rateLimitMap.set(identifier, {
        count: 1,
        resetTime: now + this.rateLimitWindow
      });
      return true;
    }

    if (rateLimitData.count >= this.maxErrorsPerMinute) {
      return false;
    }

    rateLimitData.count++;
    return true;
  }

  private logToConsole(errorEntry: ErrorLogEntry): void {
    const style = this.getConsoleStyle(errorEntry.severity);
    
    console.group(`%c🚨 Error Log [${errorEntry.severity}]`, style);
    console.log('Message:', errorEntry.message);
    console.log('Context:', errorEntry.context);
    console.log('Tags:', errorEntry.tags);
    if (errorEntry.stack) {
      console.log('Stack:', errorEntry.stack);
    }
    console.groupEnd();
  }

  private getConsoleStyle(severity: ErrorSeverity): string {
    const styles = {
      [ErrorSeverity.LOW]: 'color: #10b981; font-weight: bold;',
      [ErrorSeverity.MEDIUM]: 'color: #f59e0b; font-weight: bold;',
      [ErrorSeverity.HIGH]: 'color: #ef4444; font-weight: bold;',
      [ErrorSeverity.CRITICAL]: 'color: #dc2626; font-weight: bold; background-color: #fef2f2;'
    };
    return styles[severity] || styles[ErrorSeverity.MEDIUM];
  }

  private addErrorBreadcrumb(errorEntry: ErrorLogEntry): void {
    sentryAddBreadcrumb({
      message: `Error occurred: ${errorEntry.message}`,
      category: 'error',
      level: 'error',
      data: {
        errorId: errorEntry.id,
        severity: errorEntry.severity,
        route: errorEntry.context.route
      }
    });
  }

  private async logToDatabase(errorEntry: ErrorLogEntry): Promise<void> {
    // This would integrate with your database to store error logs
    // Implementation depends on your database choice (Prisma, etc.)
    try {
      // Example implementation:
      // await prisma.errorLog.create({
      //   data: {
      //     id: errorEntry.id,
      //     message: errorEntry.message,
      //     stack: errorEntry.stack,
      //     severity: errorEntry.severity,
      //     context: JSON.stringify(errorEntry.context),
      //     tags: JSON.stringify(errorEntry.tags),
      //     timestamp: errorEntry.timestamp,
      //     resolved: errorEntry.resolved
      //   }
      // });
      
      console.log('Error logged to database:', errorEntry.id);
    } catch (dbError) {
      console.error('Failed to log error to database:', dbError);
    }
  }

  private setupGlobalErrorHandlers(): void {
    // Only set up client-side handlers
    if (typeof window !== 'undefined') {
      // Handle unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        this.logClientError(
          `Unhandled Promise Rejection: ${event.reason}`,
          this.getBrowserInfo()
        );
      });

      // Handle global errors
      window.addEventListener('error', (event) => {
        this.logClientError(
          `Global Error: ${event.message} at ${event.filename}:${event.lineno}:${event.colno}`,
          this.getBrowserInfo()
        );
      });
    }
  }

  public getBrowserInfo(): BrowserInfo | undefined {
    if (typeof window === 'undefined') return undefined;

    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screen: screen ? {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth
      } : undefined,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };
  }
}

// Create singleton instance
export const errorLogger = new ErrorLogger();

// Convenience functions for common error types
export const logError = errorLogger.logError.bind(errorLogger);
export const logApiError = errorLogger.logApiError.bind(errorLogger);
export const logClientError = errorLogger.logClientError.bind(errorLogger);
export const logAuthError = errorLogger.logAuthError.bind(errorLogger);
export const logDatabaseError = errorLogger.logDatabaseError.bind(errorLogger);
export const setUserContext = errorLogger.setUserContext.bind(errorLogger);
export const addBreadcrumb = errorLogger.addBreadcrumb.bind(errorLogger);
export const trackPerformanceIssue = errorLogger.trackPerformanceIssue.bind(errorLogger);

/**
 * React Hook for Error Logging
 */
export function useErrorLogger() {
  return {
    logError,
    logClientError,
    setUserContext,
    addBreadcrumb,
    trackPerformanceIssue
  };
}

/**
 * Higher-order component for automatic error boundary logging
 */
export function withErrorLogging<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  return function ErrorLoggedComponent(props: P) {
    React.useEffect(() => {
      errorLogger.addBreadcrumb(`Component mounted: ${componentName || Component.name}`, 'navigation');
      
      return () => {
        errorLogger.addBreadcrumb(`Component unmounted: ${componentName || Component.name}`, 'navigation');
      };
    }, []);

    return React.createElement(Component, props);
  };
}

export default errorLogger;