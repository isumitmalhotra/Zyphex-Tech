/**
 * CMS Error Handling Service
 * 
 * Provides comprehensive error tracking and handling:
 * - Error logging and categorization
 * - Error recovery mechanisms
 * - Error analytics and trends
 * - User-friendly error messages
 * - Error notifications
 * - Automatic error grouping
 */

import { prisma } from '@/lib/prisma';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface ErrorLog {
  id: string;
  errorType: ErrorType;
  severity: ErrorSeverity;
  message: string;
  stackTrace?: string;
  context?: Record<string, unknown>;
  userId?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  userAgent?: string;
  ipAddress?: string;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  occurrences: number;
  firstOccurrence: Date;
  lastOccurrence: Date;
  tags?: string[];
}

export type ErrorType =
  | 'validation_error'
  | 'authentication_error'
  | 'authorization_error'
  | 'not_found_error'
  | 'database_error'
  | 'network_error'
  | 'timeout_error'
  | 'rate_limit_error'
  | 'internal_server_error'
  | 'external_api_error'
  | 'business_logic_error'
  | 'unknown_error';

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface LogErrorInput {
  errorType: ErrorType;
  severity: ErrorSeverity;
  message: string;
  stackTrace?: string;
  context?: Record<string, unknown>;
  userId?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  userAgent?: string;
  ipAddress?: string;
  tags?: string[];
}

export interface ErrorStats {
  totalErrors: number;
  errorsByType: Record<ErrorType, number>;
  errorsBySeverity: Record<ErrorSeverity, number>;
  resolvedErrors: number;
  unresolvedErrors: number;
  topErrors: Array<{
    message: string;
    occurrences: number;
    lastOccurrence: Date;
  }>;
  errorRate: number; // errors per hour
  trend: 'increasing' | 'stable' | 'decreasing';
}

export interface ErrorRecoveryStrategy {
  errorType: ErrorType;
  strategy: 'retry' | 'fallback' | 'ignore' | 'escalate';
  maxRetries?: number;
  retryDelay?: number;
  fallbackAction?: string;
  notification?: boolean;
}

// ============================================================================
// Error Logging
// ============================================================================

/**
 * Log an error
 */
export async function logError(input: LogErrorInput): Promise<ErrorLog> {
  // Check if similar error exists (within last hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  const existingError = await prisma.cmsErrorLog.findFirst({
    where: {
      message: input.message,
      errorType: input.errorType,
      lastOccurrence: {
        gte: oneHourAgo,
      },
    },
  });

  let error;

  if (existingError) {
    // Update existing error (increment occurrences)
    error = await prisma.cmsErrorLog.update({
      where: { id: existingError.id },
      data: {
        occurrences: { increment: 1 },
        lastOccurrence: new Date(),
        context: input.context || {},
      },
    });
  } else {
    // Create new error log
    error = await prisma.cmsErrorLog.create({
      data: {
        errorType: input.errorType,
        severity: input.severity,
        message: input.message,
        stackTrace: input.stackTrace,
        context: input.context || {},
        userId: input.userId,
        endpoint: input.endpoint,
        method: input.method,
        statusCode: input.statusCode,
        userAgent: input.userAgent,
        ipAddress: input.ipAddress,
        resolved: false,
        occurrences: 1,
        firstOccurrence: new Date(),
        lastOccurrence: new Date(),
        tags: input.tags || [],
      },
    });
  }

  // Trigger notifications for critical errors
  if (input.severity === 'critical') {
    await notifyCriticalError(error);
  }

  return mapToErrorLog(error);
}

/**
 * Get error logs with filters
 */
export async function getErrorLogs(filters: {
  errorType?: ErrorType;
  severity?: ErrorSeverity;
  resolved?: boolean;
  userId?: string;
  endpoint?: string;
  startDate?: Date;
  endDate?: Date;
  tags?: string[];
  limit?: number;
} = {}): Promise<ErrorLog[]> {
  const where: Record<string, unknown> = {};

  if (filters.errorType) {
    where.errorType = filters.errorType;
  }

  if (filters.severity) {
    where.severity = filters.severity;
  }

  if (filters.resolved !== undefined) {
    where.resolved = filters.resolved;
  }

  if (filters.userId) {
    where.userId = filters.userId;
  }

  if (filters.endpoint) {
    where.endpoint = filters.endpoint;
  }

  if (filters.startDate || filters.endDate) {
    where.lastOccurrence = {} as Record<string, unknown>;
    if (filters.startDate) {
      (where.lastOccurrence as Record<string, unknown>).gte = filters.startDate;
    }
    if (filters.endDate) {
      (where.lastOccurrence as Record<string, unknown>).lte = filters.endDate;
    }
  }

  if (filters.tags && filters.tags.length > 0) {
    where.tags = {
      hasSome: filters.tags,
    };
  }

  const errors = await prisma.cmsErrorLog.findMany({
    where,
    orderBy: { lastOccurrence: 'desc' },
    take: filters.limit || 100,
  });

  return errors.map(mapToErrorLog);
}

/**
 * Get a single error log
 */
export async function getErrorLog(id: string): Promise<ErrorLog | null> {
  const error = await prisma.cmsErrorLog.findUnique({
    where: { id },
  });

  if (!error) {
    return null;
  }

  return mapToErrorLog(error);
}

/**
 * Resolve an error
 */
export async function resolveError(
  id: string,
  resolvedBy: string
): Promise<ErrorLog> {
  const error = await prisma.cmsErrorLog.update({
    where: { id },
    data: {
      resolved: true,
      resolvedAt: new Date(),
      resolvedBy,
    },
  });

  return mapToErrorLog(error);
}

/**
 * Bulk resolve errors
 */
export async function resolveErrorsBulk(
  errorIds: string[],
  resolvedBy: string
): Promise<number> {
  const result = await prisma.cmsErrorLog.updateMany({
    where: {
      id: {
        in: errorIds,
      },
    },
    data: {
      resolved: true,
      resolvedAt: new Date(),
      resolvedBy,
    },
  });

  return result.count;
}

/**
 * Delete old error logs
 */
export async function cleanupOldErrors(olderThanDays: number = 90): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  const result = await prisma.cmsErrorLog.deleteMany({
    where: {
      resolved: true,
      resolvedAt: {
        not: null,
        lt: cutoffDate,
      },
    },
  });

  return result.count;
}

// ============================================================================
// Error Analytics
// ============================================================================

/**
 * Get error statistics
 */
export async function getErrorStats(
  timeRange?: {
    startDate?: Date;
    endDate?: Date;
  }
): Promise<ErrorStats> {
  const where: Record<string, unknown> = {};

  if (timeRange?.startDate || timeRange?.endDate) {
    where.lastOccurrence = {} as Record<string, unknown>;
    if (timeRange.startDate) {
      (where.lastOccurrence as Record<string, unknown>).gte = timeRange.startDate;
    }
    if (timeRange.endDate) {
      (where.lastOccurrence as Record<string, unknown>).lte = timeRange.endDate;
    }
  }

  const [totalErrors, resolvedErrors, allErrors] = await Promise.all([
    prisma.cmsErrorLog.aggregate({
      where,
      _sum: { occurrences: true },
    }),
    prisma.cmsErrorLog.count({
      where: { ...where, resolved: true },
    }),
    prisma.cmsErrorLog.findMany({
      where,
      select: {
        errorType: true,
        severity: true,
        message: true,
        occurrences: true,
        lastOccurrence: true,
        resolved: true,
      },
    }),
  ]);

  // Group by type
  const errorsByType: Record<ErrorType, number> = {
    validation_error: 0,
    authentication_error: 0,
    authorization_error: 0,
    not_found_error: 0,
    database_error: 0,
    network_error: 0,
    timeout_error: 0,
    rate_limit_error: 0,
    internal_server_error: 0,
    external_api_error: 0,
    business_logic_error: 0,
    unknown_error: 0,
  };

  // Group by severity
  const errorsBySeverity: Record<ErrorSeverity, number> = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };

  allErrors.forEach(error => {
    errorsByType[error.errorType as ErrorType] += error.occurrences;
    errorsBySeverity[error.severity as ErrorSeverity] += error.occurrences;
  });

  // Top errors
  const topErrors = allErrors
    .sort((a, b) => b.occurrences - a.occurrences)
    .slice(0, 10)
    .map(e => ({
      message: e.message,
      occurrences: e.occurrences,
      lastOccurrence: e.lastOccurrence,
    }));

  // Calculate error rate (errors per hour)
  const timeRangeHours = timeRange?.startDate && timeRange?.endDate
    ? (timeRange.endDate.getTime() - timeRange.startDate.getTime()) / (1000 * 60 * 60)
    : 24; // Default to 24 hours

  const errorRate = (totalErrors._sum.occurrences || 0) / timeRangeHours;

  // Calculate trend
  const midPoint = new Date((timeRange?.startDate?.getTime() || Date.now()) + 
    ((timeRange?.endDate?.getTime() || Date.now()) - (timeRange?.startDate?.getTime() || Date.now())) / 2);

  const [recentErrors, olderErrors] = await Promise.all([
    prisma.cmsErrorLog.aggregate({
      where: {
        lastOccurrence: { gte: midPoint },
      },
      _sum: { occurrences: true },
    }),
    prisma.cmsErrorLog.aggregate({
      where: {
        lastOccurrence: { lt: midPoint },
      },
      _sum: { occurrences: true },
    }),
  ]);

  const recentCount = recentErrors._sum.occurrences || 0;
  const olderCount = olderErrors._sum.occurrences || 0;
  
  let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
  if (olderCount > 0) {
    const change = ((recentCount - olderCount) / olderCount) * 100;
    if (change > 10) trend = 'increasing';
    else if (change < -10) trend = 'decreasing';
  }

  return {
    totalErrors: totalErrors._sum.occurrences || 0,
    errorsByType,
    errorsBySeverity,
    resolvedErrors,
    unresolvedErrors: allErrors.filter(e => !e.resolved).length,
    topErrors,
    errorRate,
    trend,
  };
}

// ============================================================================
// Error Recovery
// ============================================================================

/**
 * Get recovery strategy for an error type
 */
export function getRecoveryStrategy(errorType: ErrorType): ErrorRecoveryStrategy {
  const strategies: Record<ErrorType, ErrorRecoveryStrategy> = {
    validation_error: {
      errorType: 'validation_error',
      strategy: 'ignore',
      notification: false,
    },
    authentication_error: {
      errorType: 'authentication_error',
      strategy: 'escalate',
      notification: true,
    },
    authorization_error: {
      errorType: 'authorization_error',
      strategy: 'escalate',
      notification: true,
    },
    not_found_error: {
      errorType: 'not_found_error',
      strategy: 'ignore',
      notification: false,
    },
    database_error: {
      errorType: 'database_error',
      strategy: 'retry',
      maxRetries: 3,
      retryDelay: 1000,
      notification: true,
    },
    network_error: {
      errorType: 'network_error',
      strategy: 'retry',
      maxRetries: 3,
      retryDelay: 2000,
      notification: false,
    },
    timeout_error: {
      errorType: 'timeout_error',
      strategy: 'retry',
      maxRetries: 2,
      retryDelay: 3000,
      notification: true,
    },
    rate_limit_error: {
      errorType: 'rate_limit_error',
      strategy: 'fallback',
      fallbackAction: 'queue_request',
      notification: false,
    },
    internal_server_error: {
      errorType: 'internal_server_error',
      strategy: 'escalate',
      notification: true,
    },
    external_api_error: {
      errorType: 'external_api_error',
      strategy: 'retry',
      maxRetries: 3,
      retryDelay: 5000,
      notification: true,
    },
    business_logic_error: {
      errorType: 'business_logic_error',
      strategy: 'ignore',
      notification: false,
    },
    unknown_error: {
      errorType: 'unknown_error',
      strategy: 'escalate',
      notification: true,
    },
  };

  return strategies[errorType];
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(errorType: ErrorType): string {
  const messages: Record<ErrorType, string> = {
    validation_error: 'Please check your input and try again.',
    authentication_error: 'Please log in to continue.',
    authorization_error: 'You don\'t have permission to perform this action.',
    not_found_error: 'The requested resource was not found.',
    database_error: 'We\'re experiencing technical difficulties. Please try again later.',
    network_error: 'Connection error. Please check your internet connection.',
    timeout_error: 'The request took too long. Please try again.',
    rate_limit_error: 'Too many requests. Please wait a moment and try again.',
    internal_server_error: 'Something went wrong on our end. We\'re working to fix it.',
    external_api_error: 'A third-party service is unavailable. Please try again later.',
    business_logic_error: 'This action cannot be completed.',
    unknown_error: 'An unexpected error occurred. Please try again.',
  };

  return messages[errorType];
}

// ============================================================================
// Notifications
// ============================================================================

/**
 * Notify about critical errors
 */
async function notifyCriticalError(error: Record<string, unknown>): Promise<void> {
  // In a real application, this would:
  // - Send email to admins
  // - Post to Slack/Teams
  // - Create incident ticket
  // - Trigger PagerDuty/OpsGenie
  
  console.error('CRITICAL ERROR:', {
    id: error.id,
    type: error.errorType,
    message: error.message,
    occurrences: error.occurrences,
    endpoint: error.endpoint,
    timestamp: error.lastOccurrence,
  });

  // TODO: Implement actual notification system
  // await sendEmailNotification(error);
  // await postToSlack(error);
}

// ============================================================================
// Helper Functions
// ============================================================================

function mapToErrorLog(error: Record<string, unknown>): ErrorLog {
  return {
    id: error.id as unknown as string,
    errorType: error.errorType as ErrorType,
    severity: error.severity as ErrorSeverity,
    message: error.message as unknown as string,
    stackTrace: (error.stackTrace as unknown as string | null) || undefined,
    context: error.context as Record<string, unknown> | undefined,
    userId: (error.userId as unknown as string | null) || undefined,
    endpoint: (error.endpoint as unknown as string | null) || undefined,
    method: (error.method as unknown as string | null) || undefined,
    statusCode: (error.statusCode as unknown as number | null) || undefined,
    userAgent: (error.userAgent as unknown as string | null) || undefined,
    ipAddress: (error.ipAddress as unknown as string | null) || undefined,
    resolved: error.resolved as unknown as boolean,
    resolvedAt: (error.resolvedAt as unknown as Date | null) || undefined,
    resolvedBy: (error.resolvedBy as unknown as string | null) || undefined,
    occurrences: error.occurrences as unknown as number,
    firstOccurrence: error.firstOccurrence as unknown as Date,
    lastOccurrence: error.lastOccurrence as unknown as Date,
    tags: error.tags as unknown as string[] | undefined,
  };
}

/**
 * Error handling middleware utility
 */
export function withErrorHandling<T>(
  fn: () => Promise<T>,
  context: {
    errorType?: ErrorType;
    userId?: string;
    endpoint?: string;
    method?: string;
  }
): Promise<T> {
  return fn().catch(async (error: Error) => {
    await logError({
      errorType: context.errorType || 'unknown_error',
      severity: 'high',
      message: error.message,
      stackTrace: error.stack,
      context: {
        originalError: error.name,
      },
      userId: context.userId,
      endpoint: context.endpoint,
      method: context.method,
    });

    throw error;
  });
}
