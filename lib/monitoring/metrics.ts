import { Logger } from '@/lib/logger';

/**
 * Business metrics tracking system
 * Track key business KPIs and custom metrics
 */
export class BusinessMetrics {
  private static metrics = new Map<string, number[]>();

  /**
   * Track a metric value
   */
  static track(metric: string, value: number, tags?: Record<string, string>) {
    // Store the value
    const values = this.metrics.get(metric) || [];
    values.push(value);
    this.metrics.set(metric, values);

    // Log the metric
    Logger.logBusinessMetric(metric, value, tags);
  }

  /**
   * Increment a counter
   */
  static increment(metric: string, tags?: Record<string, string>) {
    this.track(metric, 1, tags);
  }

  /**
   * Get metric statistics
   */
  static getStats(metric: string) {
    const values = this.metrics.get(metric) || [];
    if (values.length === 0) return null;

    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);

    return {
      count: values.length,
      sum,
      avg,
      max,
      min,
    };
  }

  /**
   * Clear metrics
   */
  static clear(metric?: string) {
    if (metric) {
      this.metrics.delete(metric);
    } else {
      this.metrics.clear();
    }
  }
}

/**
 * User metrics tracking
 */
export class UserMetrics {
  /**
   * Track user registration
   */
  static trackRegistration(userId: string, method: 'email' | 'oauth', provider?: string) {
    BusinessMetrics.increment('user.registration', {
      method,
      provider: provider || 'none',
    });

    Logger.logUserAction(userId, 'registered', undefined, {
      method,
      provider,
    });
  }

  /**
   * Track user login
   */
  static trackLogin(userId: string, method: 'email' | 'oauth', provider?: string) {
    BusinessMetrics.increment('user.login', {
      method,
      provider: provider || 'none',
    });

    Logger.logAuthEvent('login', userId, {
      method,
      provider,
    });
  }

  /**
   * Track user logout
   */
  static trackLogout(userId: string) {
    BusinessMetrics.increment('user.logout');
    Logger.logAuthEvent('logout', userId);
  }

  /**
   * Track failed login attempt
   */
  static trackFailedLogin(email: string, reason: string) {
    BusinessMetrics.increment('user.failed_login', {
      reason,
    });

    Logger.logAuthEvent('failed_login', undefined, {
      email: email.split('@')[1], // Only domain for privacy
      reason,
    });
  }

  /**
   * Track user session duration
   */
  static trackSessionDuration(userId: string, duration: number) {
    BusinessMetrics.track('user.session_duration', duration);
    
    Logger.logBusinessMetric('user.session_duration', duration, {
      userId,
    });
  }
}

/**
 * Project metrics tracking
 */
export class ProjectMetrics {
  /**
   * Track project creation
   */
  static trackCreation(projectId: string, userId: string) {
    BusinessMetrics.increment('project.created');
    
    Logger.logUserAction(userId, 'project_created', projectId);
  }

  /**
   * Track project update
   */
  static trackUpdate(projectId: string, userId: string, fields: string[]) {
    BusinessMetrics.increment('project.updated');
    
    Logger.logUserAction(userId, 'project_updated', projectId, {
      fields,
    });
  }

  /**
   * Track project completion
   */
  static trackCompletion(projectId: string, duration: number) {
    BusinessMetrics.track('project.completion_time', duration);
    
    Logger.logBusinessMetric('project.completion_time', duration, {
      projectId,
    });
  }

  /**
   * Track project status change
   */
  static trackStatusChange(
    projectId: string,
    userId: string,
    from: string,
    to: string
  ) {
    BusinessMetrics.increment('project.status_change', {
      from,
      to,
    });
    
    Logger.logUserAction(userId, 'project_status_changed', projectId, {
      from,
      to,
    });
  }
}

/**
 * Payment metrics tracking
 */
export class PaymentMetrics {
  /**
   * Track payment attempt
   */
  static trackAttempt(
    amount: number,
    currency: string,
    paymentMethod: string
  ) {
    BusinessMetrics.increment('payment.attempted', {
      currency,
      paymentMethod,
    });
    BusinessMetrics.track('payment.amount_attempted', amount, {
      currency,
    });
  }

  /**
   * Track successful payment
   */
  static trackSuccess(
    transactionId: string,
    amount: number,
    currency: string,
    paymentMethod: string
  ) {
    BusinessMetrics.increment('payment.success', {
      currency,
      paymentMethod,
    });
    BusinessMetrics.track('payment.amount_received', amount, {
      currency,
    });

    Logger.logPaymentEvent('success', amount, currency, transactionId, {
      paymentMethod,
    });
  }

  /**
   * Track failed payment
   */
  static trackFailure(
    transactionId: string,
    amount: number,
    currency: string,
    reason: string
  ) {
    BusinessMetrics.increment('payment.failed', {
      currency,
      reason,
    });

    Logger.logPaymentEvent('failed', amount, currency, transactionId, {
      reason,
    });
  }

  /**
   * Track refund
   */
  static trackRefund(
    transactionId: string,
    amount: number,
    currency: string,
    reason: string
  ) {
    BusinessMetrics.increment('payment.refunded', {
      currency,
      reason,
    });
    BusinessMetrics.track('payment.amount_refunded', amount, {
      currency,
    });

    Logger.logPaymentEvent('refunded', amount, currency, transactionId, {
      reason,
    });
  }

  /**
   * Get payment statistics
   */
  static getStats() {
    return {
      attempted: BusinessMetrics.getStats('payment.attempted'),
      success: BusinessMetrics.getStats('payment.success'),
      failed: BusinessMetrics.getStats('payment.failed'),
      refunded: BusinessMetrics.getStats('payment.refunded'),
      totalReceived: BusinessMetrics.getStats('payment.amount_received'),
      totalRefunded: BusinessMetrics.getStats('payment.amount_refunded'),
    };
  }
}

/**
 * Email metrics tracking
 */
export class EmailMetrics {
  /**
   * Track email sent
   */
  static trackSent(recipient: string, template: string) {
    BusinessMetrics.increment('email.sent', {
      template,
    });

    Logger.logEmailEvent('sent', recipient, template);
  }

  /**
   * Track email failure
   */
  static trackFailed(recipient: string, template: string, error: string) {
    BusinessMetrics.increment('email.failed', {
      template,
    });

    Logger.logEmailEvent('failed', recipient, template, {
      error,
    });
  }

  /**
   * Track email queued
   */
  static trackQueued(recipient: string, template: string) {
    BusinessMetrics.increment('email.queued', {
      template,
    });

    Logger.logEmailEvent('queued', recipient, template);
  }

  /**
   * Get email statistics
   */
  static getStats() {
    return {
      sent: BusinessMetrics.getStats('email.sent'),
      failed: BusinessMetrics.getStats('email.failed'),
      queued: BusinessMetrics.getStats('email.queued'),
    };
  }
}

/**
 * File upload metrics tracking
 */
export class FileMetrics {
  /**
   * Track file upload
   */
  static trackUpload(
    userId: string,
    fileName: string,
    fileSize: number,
    mimeType: string,
    success: boolean
  ) {
    BusinessMetrics.increment(success ? 'file.upload_success' : 'file.upload_failed', {
      mimeType,
    });
    BusinessMetrics.track('file.size_uploaded', fileSize, {
      mimeType,
    });

    Logger.logFileUpload(userId, fileName, fileSize, mimeType, success);
  }

  /**
   * Track file download
   */
  static trackDownload(
    userId: string,
    fileName: string,
    fileSize: number,
    mimeType: string
  ) {
    BusinessMetrics.increment('file.download', {
      mimeType,
    });
    BusinessMetrics.track('file.size_downloaded', fileSize, {
      mimeType,
    });

    Logger.logUserAction(userId, 'file_downloaded', fileName, {
      fileSize,
      mimeType,
    });
  }

  /**
   * Track file deletion
   */
  static trackDeletion(userId: string, fileName: string) {
    BusinessMetrics.increment('file.deleted');
    
    Logger.logUserAction(userId, 'file_deleted', fileName);
  }

  /**
   * Get file statistics
   */
  static getStats() {
    return {
      uploadSuccess: BusinessMetrics.getStats('file.upload_success'),
      uploadFailed: BusinessMetrics.getStats('file.upload_failed'),
      download: BusinessMetrics.getStats('file.download'),
      deleted: BusinessMetrics.getStats('file.deleted'),
      totalSizeUploaded: BusinessMetrics.getStats('file.size_uploaded'),
      totalSizeDownloaded: BusinessMetrics.getStats('file.size_downloaded'),
    };
  }
}

/**
 * API metrics tracking
 */
export class APIMetrics {
  /**
   * Track API call
   */
  static trackCall(
    endpoint: string,
    method: string,
    statusCode: number,
    duration: number
  ) {
    BusinessMetrics.increment('api.calls', {
      endpoint,
      method,
      status: statusCode.toString(),
    });
    BusinessMetrics.track('api.duration', duration, {
      endpoint,
      method,
    });

    // Track errors separately
    if (statusCode >= 400) {
      BusinessMetrics.increment('api.errors', {
        endpoint,
        method,
        status: statusCode.toString(),
      });
    }
  }

  /**
   * Get API statistics
   */
  static getStats() {
    return {
      totalCalls: BusinessMetrics.getStats('api.calls'),
      errors: BusinessMetrics.getStats('api.errors'),
      avgDuration: BusinessMetrics.getStats('api.duration'),
    };
  }
}

/**
 * Feature usage metrics
 */
export class FeatureMetrics {
  /**
   * Track feature usage
   */
  static trackUsage(feature: string, userId: string) {
    BusinessMetrics.increment(`feature.${feature}`);
    
    Logger.logUserAction(userId, 'feature_used', feature);
  }

  /**
   * Get feature usage stats
   */
  static getUsageStats(feature: string) {
    return BusinessMetrics.getStats(`feature.${feature}`);
  }
}

/**
 * Generate and log a comprehensive metrics report
 */
export function generateMetricsReport() {
  const report = {
    timestamp: new Date().toISOString(),
    payments: PaymentMetrics.getStats(),
    emails: EmailMetrics.getStats(),
    files: FileMetrics.getStats(),
    api: APIMetrics.getStats(),
  };

  Logger.info('Metrics Report', report);

  return report;
}

// Generate metrics report every hour in production
if (process.env.NODE_ENV === 'production' && typeof setInterval !== 'undefined') {
  setInterval(() => {
    generateMetricsReport();
  }, 3600000); // 1 hour
}
