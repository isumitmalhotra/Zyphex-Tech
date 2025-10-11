/**
 * API Error Handler Utility
 * 
 * Centralized error handling system for all API routes
 * Provides consistent error responses, logging, and monitoring integration
 * 
 * @author Zyphex Tech Development Team
 * @version 1.0.0
 * @created 2025-10-11
 */

import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { z } from 'zod';
import { 
  ApiErrorResponse, 
  ApiSuccessResponse,
  ApiErrorCode, 
  HttpStatusCode,
  ErrorSeverity,
  ValidationError,
  RequestContext,
  ErrorHandlerContext,
  ErrorHandlerConfig,
  RateLimitInfo,
  ERROR_CODE_TO_STATUS,
  ERROR_CODE_TO_SEVERITY 
} from './error-types';
import { errorLogger } from '@/lib/services/error-logger';

/**
 * Default Error Handler Configuration
 */
const DEFAULT_CONFIG: ErrorHandlerConfig = {
  includeStack: process.env.NODE_ENV === 'development',
  includeDebugInfo: process.env.NODE_ENV === 'development',
  logErrors: true,
  notifyOnCritical: true,
  rateLimitEnabled: true,
  corsEnabled: true,
  sanitizeOutput: true,
};

/**
 * Generate Unique Request ID
 */
export const generateRequestId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 15);
  return `req_${timestamp}_${randomStr}`;
};

/**
 * Extract Request Context from Next.js Request
 */
export const extractRequestContext = (
  request: NextRequest,
  requestId?: string
): RequestContext => {
  const context: RequestContext = {
    requestId: requestId || generateRequestId(),
    timestamp: new Date().toISOString(),
    method: request.method,
    path: request.nextUrl.pathname,
    userAgent: request.headers.get('user-agent') || undefined,
    clientIp: request.headers.get('x-forwarded-for') || 
              request.headers.get('x-real-ip') || 
              undefined,
  };

  // Extract user information from request (if available)
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    // Extract user ID from JWT or session (simplified example)
    try {
      // This would be replaced with actual JWT parsing
      const payload = JSON.parse(atob(authHeader.split('.')[1] || ''));
      context.userId = payload.sub || payload.userId;
      context.sessionId = payload.sessionId;
    } catch {
      // Ignore JWT parsing errors
    }
  }

  // Extract correlation ID for distributed tracing
  const correlationId = request.headers.get('x-correlation-id');
  if (correlationId) {
    context.correlationId = correlationId;
  }

  return context;
};

/**
 * Sanitize Sensitive Data from Objects
 */
const sanitizeObject = (obj: unknown): unknown => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sensitiveKeys = [
    'password', 'token', 'secret', 'key', 'authorization',
    'cookie', 'session', 'auth', 'credential', 'private'
  ];
  
  const sanitized = { ...obj as Record<string, unknown> };
  
  for (const key in sanitized) {
    if (sensitiveKeys.some(sensitive => 
      key.toLowerCase().includes(sensitive.toLowerCase())
    )) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeObject(sanitized[key]);
    }
  }
  
  return sanitized;
};

/**
 * Create Standardized Error Response
 */
export const createErrorResponse = (
  code: ApiErrorCode,
  message: string,
  context: RequestContext,
  options: {
    details?: Record<string, unknown>;
    validationErrors?: ValidationError[];
    rateLimitInfo?: RateLimitInfo;
    retryable?: boolean;
    retryAfter?: number;
    cause?: Error;
    config?: Partial<ErrorHandlerConfig>;
  } = {}
): ApiErrorResponse => {
  const config = { ...DEFAULT_CONFIG, ...options.config };
  const statusCode = ERROR_CODE_TO_STATUS[code] || HttpStatusCode.INTERNAL_SERVER_ERROR;
  const severity = ERROR_CODE_TO_SEVERITY[code] || ErrorSeverity.MEDIUM;

  const errorResponse: ApiErrorResponse = {
    error: true,
    code,
    message,
    statusCode,
    severity,
    timestamp: context.timestamp,
    requestId: context.requestId,
    path: context.path,
    method: context.method,
    retryable: options.retryable || false,
  };

  // Add optional details
  if (options.details && Object.keys(options.details).length > 0) {
    errorResponse.details = config.sanitizeOutput 
      ? sanitizeObject(options.details) as Record<string, unknown>
      : options.details;
  }

  if (options.validationErrors && options.validationErrors.length > 0) {
    errorResponse.validationErrors = options.validationErrors;
  }

  if (options.rateLimitInfo) {
    errorResponse.rateLimitInfo = options.rateLimitInfo;
  }

  if (options.retryAfter) {
    errorResponse.retryAfter = options.retryAfter;
  }

  // Add documentation links for common errors
  switch (code) {
    case ApiErrorCode.AUTH_TOKEN_INVALID:
      errorResponse.documentation = '/docs/authentication';
      break;
    case ApiErrorCode.RATE_LIMIT_EXCEEDED:
      errorResponse.documentation = '/docs/rate-limits';
      break;
    case ApiErrorCode.VALIDATION_REQUIRED_FIELD:
      errorResponse.documentation = '/docs/api-validation';
      break;
  }

  errorResponse.supportContact = 'support@zyphextech.com';

  // Development-only information
  if (config.includeStack && options.cause) {
    errorResponse.stack = {
      message: options.cause.message,
      stack: options.cause.stack,
      cause: options.cause.cause,
    };
  }

  if (config.includeDebugInfo) {
    errorResponse.debug = {
      userAgent: context.userAgent,
      clientIp: context.clientIp,
      correlationId: context.correlationId,
      timestamp: Date.now(),
    };
  }

  return errorResponse;
};

/**
 * Create Success Response
 */
export const createSuccessResponse = <T>(
  data: T,
  context: RequestContext,
  options: {
    message?: string;
    statusCode?: HttpStatusCode;
    meta?: {
      pagination?: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
      version?: string;
      cached?: boolean;
      executionTime?: number;
    };
  } = {}
): ApiSuccessResponse<T> => {
  return {
    error: false,
    data,
    message: options.message,
    statusCode: options.statusCode || HttpStatusCode.OK,
    timestamp: context.timestamp,
    requestId: context.requestId,
    meta: options.meta,
  };
};

/**
 * Handle Zod Validation Errors
 */
export const handleZodError = (
  error: z.ZodError,
  context: RequestContext
): ApiErrorResponse => {
  const validationErrors: ValidationError[] = error.errors.map(err => ({
    field: err.path.join('.'),
    code: ApiErrorCode.VALIDATION_INVALID_FORMAT,
    message: err.message,
    value: err.input,
    constraints: { expected: err.expected, received: err.received },
  }));

  return createErrorResponse(
    ApiErrorCode.VALIDATION_SCHEMA_MISMATCH,
    'Request validation failed',
    context,
    { validationErrors }
  );
};

/**
 * Handle Database Errors
 */
export const handleDatabaseError = (
  error: Error,
  context: RequestContext
): ApiErrorResponse => {
  // Prisma-specific error handling
  if (error.message.includes('Record to update not found')) {
    return createErrorResponse(
      ApiErrorCode.RESOURCE_NOT_FOUND,
      'The requested resource was not found',
      context,
      { cause: error }
    );
  }

  if (error.message.includes('Unique constraint failed')) {
    return createErrorResponse(
      ApiErrorCode.VALIDATION_DUPLICATE_VALUE,
      'A resource with this value already exists',
      context,
      { cause: error }
    );
  }

  if (error.message.includes('Foreign key constraint failed')) {
    return createErrorResponse(
      ApiErrorCode.DATABASE_CONSTRAINT_VIOLATION,
      'Operation violates database constraints',
      context,
      { cause: error }
    );
  }

  if (error.message.includes('Connection') || error.message.includes('timeout')) {
    return createErrorResponse(
      ApiErrorCode.DATABASE_CONNECTION_ERROR,
      'Database connection error',
      context,
      { 
        cause: error,
        retryable: true,
        retryAfter: 5
      }
    );
  }

  // Generic database error
  return createErrorResponse(
    ApiErrorCode.DATABASE_QUERY_ERROR,
    'Database operation failed',
    context,
    { cause: error }
  );
};

/**
 * Handle Authentication Errors
 */
export const handleAuthError = (
  type: 'missing' | 'invalid' | 'expired' | 'insufficient',
  context: RequestContext,
  details?: Record<string, unknown>
): ApiErrorResponse => {
  const errorMap = {
    missing: {
      code: ApiErrorCode.AUTH_TOKEN_MISSING,
      message: 'Authentication token is required'
    },
    invalid: {
      code: ApiErrorCode.AUTH_TOKEN_INVALID,
      message: 'Authentication token is invalid'
    },
    expired: {
      code: ApiErrorCode.AUTH_TOKEN_EXPIRED,
      message: 'Authentication token has expired'
    },
    insufficient: {
      code: ApiErrorCode.AUTH_INSUFFICIENT_PERMISSIONS,
      message: 'Insufficient permissions for this operation'
    }
  };

  const { code, message } = errorMap[type];
  
  return createErrorResponse(code, message, context, { details });
};

/**
 * Handle Rate Limit Errors
 */
export const handleRateLimitError = (
  rateLimitInfo: RateLimitInfo,
  context: RequestContext
): ApiErrorResponse => {
  return createErrorResponse(
    ApiErrorCode.RATE_LIMIT_EXCEEDED,
    'Rate limit exceeded. Please try again later.',
    context,
    {
      rateLimitInfo,
      retryable: true,
      retryAfter: rateLimitInfo.retryAfter || 60
    }
  );
};

/**
 * Log Error to Monitoring Systems
 */
const logError = async (
  error: ApiErrorResponse,
  originalError?: Error,
  context?: ErrorHandlerContext
): Promise<void> => {
  try {
    // Log to Sentry for error tracking
    if (originalError) {
      Sentry.withScope((scope) => {
        scope.setTag('errorCode', error.code);
        scope.setTag('severity', error.severity);
        scope.setTag('statusCode', error.statusCode);
        scope.setContext('request', {
          requestId: error.requestId,
          method: error.method,
          path: error.path,
          userAgent: context?.request.headers['user-agent'],
          clientIp: context?.request.headers['x-forwarded-for'],
        });
        
        if (context?.user) {
          scope.setUser({
            id: context.user.id,
            email: context.user.email,
          });
        }

        Sentry.captureException(originalError);
      });
    }

    // Use comprehensive error logger service
    const errorContext = {
      userId: context?.user?.id,
      userEmail: context?.user?.email,
      userRole: context?.user?.role,
      route: error.path,
      method: error.method,
      statusCode: error.statusCode,
      requestId: error.requestId,
      sessionId: undefined, // Could be added to context if needed
      userAgent: context?.request?.headers?.['user-agent'],
      ipAddress: context?.request?.headers?.['x-forwarded-for'],
      referer: context?.request?.headers?.['referer'],
      timestamp: error.timestamp,
      buildVersion: process.env.BUILD_VERSION,
      environment: process.env.NODE_ENV || 'unknown'
    };

    // Log using the comprehensive error logger
    await errorLogger.logError(
      originalError || error.message,
      errorContext,
      error.severity as ErrorSeverity,
      {
        errorCode: error.code,
        apiErrorResponse: error,
        validationErrors: error.validationErrors,
        details: error.details
      }
    );

    // Log to console in development (fallback)
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', {
        code: error.code,
        message: error.message,
        requestId: error.requestId,
        path: error.path,
        stack: originalError?.stack,
      });
    }

  } catch (loggingError) {
    console.error('Failed to log error:', loggingError);
  }
};

/**
 * Send Critical Error Notifications
 */
const notifyOnCriticalError = async (
  error: ApiErrorResponse,
  context?: ErrorHandlerContext
): Promise<void> => {
  if (error.severity !== ErrorSeverity.CRITICAL) return;

  try {
    // Send notification to monitoring systems
    // This could be Slack, PagerDuty, email, etc.
    
    const notification = {
      title: `🚨 Critical API Error: ${error.code}`,
      message: error.message,
      details: {
        requestId: error.requestId,
        path: error.path,
        method: error.method,
        timestamp: error.timestamp,
        userId: context?.user?.id,
      },
      severity: error.severity,
    };

    // Log critical error notification (replace with actual notification service)
    console.error('CRITICAL ERROR NOTIFICATION:', notification);
    
    // Here you would integrate with your notification service:
    // await sendSlackNotification(notification);
    // await sendPagerDutyAlert(notification);
    // await sendEmailAlert(notification);

  } catch (notificationError) {
    console.error('Failed to send critical error notification:', notificationError);
  }
};

/**
 * Main Error Handler Function
 */
export const handleApiError = async (
  error: unknown,
  request: NextRequest,
  context?: Partial<ErrorHandlerContext>,
  config?: Partial<ErrorHandlerConfig>
): Promise<NextResponse<ApiErrorResponse>> => {
  const requestContext = extractRequestContext(request, context?.request?.url);
  const handlerConfig = { ...DEFAULT_CONFIG, ...config };

  let apiError: ApiErrorResponse;
  let originalError: Error | undefined;

  // Handle different error types
  if (error instanceof z.ZodError) {
    apiError = handleZodError(error, requestContext);
  } else if (error instanceof Error) {
    originalError = error;
    
    // Check for specific error types
    if (error.name === 'PrismaClientKnownRequestError' ||
        error.message.includes('prisma') ||
        error.message.includes('database')) {
      apiError = handleDatabaseError(error, requestContext);
    } else if (error.message.includes('unauthorized') ||
               error.message.includes('authentication')) {
      apiError = handleAuthError('invalid', requestContext);
    } else {
      // Generic error
      apiError = createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        handlerConfig.sanitizeOutput 
          ? 'An internal error occurred'
          : error.message,
        requestContext,
        { cause: error }
      );
    }
  } else {
    // Unknown error type
    apiError = createErrorResponse(
      ApiErrorCode.INTERNAL_ERROR,
      'An unexpected error occurred',
      requestContext,
      { 
        details: handlerConfig.sanitizeOutput 
          ? undefined 
          : { originalError: error }
      }
    );
  }

  // Log error if enabled
  if (handlerConfig.logErrors) {
    await logError(apiError, originalError, context);
  }

  // Send critical error notifications
  if (handlerConfig.notifyOnCritical) {
    await notifyOnCriticalError(apiError, context);
  }

  // Create NextResponse with appropriate headers
  const response = NextResponse.json(apiError, { 
    status: apiError.statusCode 
  });

  // Add CORS headers if enabled
  if (handlerConfig.corsEnabled) {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  // Add rate limit headers if provided
  if (apiError.rateLimitInfo) {
    response.headers.set('X-RateLimit-Limit', apiError.rateLimitInfo.limit.toString());
    response.headers.set('X-RateLimit-Remaining', apiError.rateLimitInfo.remaining.toString());
    response.headers.set('X-RateLimit-Reset', apiError.rateLimitInfo.resetTime);
    if (apiError.rateLimitInfo.retryAfter) {
      response.headers.set('Retry-After', apiError.rateLimitInfo.retryAfter.toString());
    }
  }

  // Add request tracking headers
  response.headers.set('X-Request-ID', requestContext.requestId);
  if (requestContext.correlationId) {
    response.headers.set('X-Correlation-ID', requestContext.correlationId);
  }

  return response;
};

/**
 * API Route Error Wrapper
 * Use this to wrap your API route handlers for automatic error handling
 */
export const withErrorHandler = <T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>,
  config?: Partial<ErrorHandlerConfig>
) => {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      // Extract request from args (assuming first argument is NextRequest)
      const request = args[0] as NextRequest;
      return handleApiError(error, request, undefined, config);
    }
  };
};

/**
 * Async Operation Wrapper
 * Use this to wrap async operations that might fail
 */
export const tryCatch = async <T>(
  operation: () => Promise<T>,
  request: NextRequest,
  errorCode?: ApiErrorCode
): Promise<{ success: true; data: T } | { success: false; error: ApiErrorResponse }> => {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    const context = extractRequestContext(request);
    
    let apiError: ApiErrorResponse;
    if (error instanceof Error && errorCode) {
      apiError = createErrorResponse(errorCode, error.message, context, { cause: error });
    } else if (error instanceof z.ZodError) {
      apiError = handleZodError(error, context);
    } else if (error instanceof Error) {
      apiError = handleDatabaseError(error, context);
    } else {
      apiError = createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        'Operation failed',
        context
      );
    }
    
    return { success: false, error: apiError };
  }
};

/**
 * Response Helper Functions
 */
export const respondWithSuccess = <T>(
  data: T,
  request: NextRequest,
  options?: {
    message?: string;
    statusCode?: HttpStatusCode;
    meta?: {
      pagination?: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
      version?: string;
      cached?: boolean;
      executionTime?: number;
    };
  }
): NextResponse<ApiSuccessResponse<T>> => {
  const context = extractRequestContext(request);
  const response = createSuccessResponse(data, context, options);
  
  const nextResponse = NextResponse.json(response, { 
    status: response.statusCode 
  });
  
  // Add tracking headers
  nextResponse.headers.set('X-Request-ID', context.requestId);
  if (context.correlationId) {
    nextResponse.headers.set('X-Correlation-ID', context.correlationId);
  }
  
  return nextResponse;
};

export const respondWithError = (
  code: ApiErrorCode,
  message: string,
  request: NextRequest,
  options?: {
    details?: Record<string, unknown>;
    validationErrors?: ValidationError[];
    retryable?: boolean;
  }
): NextResponse<ApiErrorResponse> => {
  const context = extractRequestContext(request);
  const errorResponse = createErrorResponse(code, message, context, options);
  
  const nextResponse = NextResponse.json(errorResponse, { 
    status: errorResponse.statusCode 
  });
  
  // Add tracking headers
  nextResponse.headers.set('X-Request-ID', context.requestId);
  if (context.correlationId) {
    nextResponse.headers.set('X-Correlation-ID', context.correlationId);
  }
  
  return nextResponse;
};