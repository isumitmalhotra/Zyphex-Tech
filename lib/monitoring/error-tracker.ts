import * as Sentry from '@sentry/nextjs';

export interface ErrorContext {
  user?: {
    id: string;
    email?: string;
    role?: string;
  };
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  level?: 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug';
}

/**
 * Centralized error tracking utility for Sentry integration
 * Provides consistent error tracking across the application
 */
export class ErrorTracker {
  /**
   * Track and log errors to Sentry
   * @param error - The error object to track
   * @param context - Additional context for the error
   */
  static captureError(error: Error, context?: ErrorContext) {
    Sentry.captureException(error, {
      level: context?.level || 'error',
      tags: context?.tags,
      extra: context?.extra,
      user: context?.user,
    });

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorTracker]', error, context);
    }
  }

  /**
   * Track custom messages/events
   * @param message - The message to track
   * @param context - Additional context for the message
   */
  static captureMessage(message: string, context?: ErrorContext) {
    Sentry.captureMessage(message, {
      level: context?.level || 'info',
      tags: context?.tags,
      extra: context?.extra,
      user: context?.user,
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('[ErrorTracker]', message, context);
    }
  }

  /**
   * Set user context for all future errors
   * Call this after user login/authentication
   * @param user - User information to attach to errors
   */
  static setUserContext(user: { id: string; email?: string; role?: string }) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.role,
    });
  }

  /**
   * Clear user context (call on logout)
   */
  static clearUserContext() {
    Sentry.setUser(null);
  }

  /**
   * Add breadcrumb for debugging context
   * Breadcrumbs provide a trail of events leading up to an error
   * @param message - Breadcrumb message
   * @param data - Additional data for the breadcrumb
   */
  static addBreadcrumb(message: string, data?: Record<string, unknown>) {
    Sentry.addBreadcrumb({
      message,
      data,
      timestamp: Date.now() / 1000,
    });
  }

  /**
   * Track API errors with standardized context
   * @param endpoint - API endpoint that failed
   * @param method - HTTP method used
   * @param statusCode - HTTP status code
   * @param error - Error object or message
   */
  static captureAPIError(
    endpoint: string,
    method: string,
    statusCode: number,
    error: Error | string
  ) {
    this.captureError(
      error instanceof Error ? error : new Error(error),
      {
        tags: {
          type: 'api_error',
          endpoint,
          method,
          status_code: statusCode.toString(),
        },
        extra: {
          endpoint,
          method,
          statusCode,
        },
        level: statusCode >= 500 ? 'error' : 'warning',
      }
    );
  }

  /**
   * Track database errors
   * @param operation - Database operation that failed
   * @param error - Error object
   */
  static captureDatabaseError(operation: string, error: Error) {
    this.captureError(error, {
      tags: {
        type: 'database_error',
        operation,
      },
      extra: {
        operation,
        errorCode: (error as { code?: string }).code,
        errorMeta: (error as { meta?: unknown }).meta,
      },
      level: 'error',
    });
  }

  /**
   * Track authentication errors
   * @param type - Type of authentication that failed
   * @param error - Error object
   */
  static captureAuthError(type: 'login' | 'register' | 'oauth' | 'session', error: Error) {
    this.captureError(error, {
      tags: {
        type: 'auth_error',
        auth_type: type,
      },
      level: 'warning',
    });
  }

  /**
   * Track file upload errors
   * @param fileName - Name of the file
   * @param error - Error object
   */
  static captureFileUploadError(fileName: string, error: Error) {
    this.captureError(error, {
      tags: {
        type: 'file_upload_error',
      },
      extra: {
        fileName,
      },
      level: 'warning',
    });
  }

  /**
   * Track payment/transaction errors
   * @param transactionId - Transaction identifier
   * @param error - Error object
   */
  static capturePaymentError(transactionId: string, error: Error) {
    this.captureError(error, {
      tags: {
        type: 'payment_error',
      },
      extra: {
        transactionId,
      },
      level: 'error',
    });
  }

  /**
   * Track email sending errors
   * @param recipient - Email recipient
   * @param templateType - Email template type
   * @param error - Error object
   */
  static captureEmailError(recipient: string, templateType: string, error: Error) {
    this.captureError(error, {
      tags: {
        type: 'email_error',
        template_type: templateType,
      },
      extra: {
        recipient: recipient.split('@')[1], // Only domain for privacy
        templateType,
      },
      level: 'warning',
    });
  }

  /**
   * Track external service errors (third-party APIs)
   * @param serviceName - Name of the external service
   * @param error - Error object
   */
  static captureExternalServiceError(serviceName: string, error: Error) {
    this.captureError(error, {
      tags: {
        type: 'external_service_error',
        service: serviceName,
      },
      extra: {
        serviceName,
      },
      level: 'error',
    });
  }

  /**
   * Track validation errors
   * @param field - Field that failed validation
   * @param error - Error object or message
   */
  static captureValidationError(field: string, error: Error | string) {
    this.captureError(
      error instanceof Error ? error : new Error(error),
      {
        tags: {
          type: 'validation_error',
        },
        extra: {
          field,
        },
        level: 'info',
      }
    );
  }
}
