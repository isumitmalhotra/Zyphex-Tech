import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Tell winston about our colors
winston.addColors(colors);

// Custom format for console output (development)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    let metaString = '';
    
    if (Object.keys(meta).length > 0) {
      metaString = '\n' + JSON.stringify(meta, null, 2);
    }
    
    return `${timestamp} [${level}]: ${message}${metaString}`;
  })
);

// Custom format for file output (production)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create transports
const transports: winston.transport[] = [];

// Console transport (always enabled)
transports.push(
  new winston.transports.Console({
    format: consoleFormat,
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  })
);

// File transports (only in production or when explicitly enabled)
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_FILE_LOGGING === 'true') {
  // Error log file
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  // Combined log file
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  // HTTP log file
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'http.log'),
      level: 'http',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// Create the logger instance
const logger = winston.createLogger({
  levels,
  level: process.env.LOG_LEVEL || 'info',
  format: fileFormat,
  transports,
  exitOnError: false,
});

/**
 * Logger class with structured logging methods
 */
export class Logger {
  /**
   * Log error level message
   */
  static error(message: string, meta?: Record<string, unknown>) {
    logger.error(message, meta);
  }

  /**
   * Log warning level message
   */
  static warn(message: string, meta?: Record<string, unknown>) {
    logger.warn(message, meta);
  }

  /**
   * Log info level message
   */
  static info(message: string, meta?: Record<string, unknown>) {
    logger.info(message, meta);
  }

  /**
   * Log HTTP level message (for requests/responses)
   */
  static http(message: string, meta?: Record<string, unknown>) {
    logger.http(message, meta);
  }

  /**
   * Log debug level message
   */
  static debug(message: string, meta?: Record<string, unknown>) {
    logger.debug(message, meta);
  }

  /**
   * Log API request
   */
  static logAPIRequest(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    meta?: Record<string, unknown>
  ) {
    logger.http('API Request', {
      method,
      path,
      statusCode,
      duration,
      ...meta,
    });
  }

  /**
   * Log database operation
   */
  static logDatabaseOperation(
    operation: string,
    model: string,
    duration: number,
    success: boolean,
    meta?: Record<string, unknown>
  ) {
    const level = success ? 'debug' : 'error';
    logger.log(level, 'Database Operation', {
      operation,
      model,
      duration,
      success,
      ...meta,
    });
  }

  /**
   * Log authentication event
   */
  static logAuthEvent(
    event: 'login' | 'logout' | 'register' | 'oauth' | 'failed_login',
    userId?: string,
    meta?: Record<string, unknown>
  ) {
    logger.info('Authentication Event', {
      event,
      userId,
      ...meta,
    });
  }

  /**
   * Log security event
   */
  static logSecurityEvent(
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    meta?: Record<string, unknown>
  ) {
    const level = severity === 'critical' || severity === 'high' ? 'error' : 'warn';
    logger.log(level, 'Security Event', {
      event,
      severity,
      ...meta,
    });
  }

  /**
   * Log business metric
   */
  static logBusinessMetric(
    metric: string,
    value: number | string,
    meta?: Record<string, unknown>
  ) {
    logger.info('Business Metric', {
      metric,
      value,
      ...meta,
    });
  }

  /**
   * Log user action
   */
  static logUserAction(
    userId: string,
    action: string,
    resource?: string,
    meta?: Record<string, unknown>
  ) {
    logger.info('User Action', {
      userId,
      action,
      resource,
      ...meta,
    });
  }

  /**
   * Log payment event
   */
  static logPaymentEvent(
    event: 'initiated' | 'success' | 'failed' | 'refunded',
    amount: number,
    currency: string,
    transactionId: string,
    meta?: Record<string, unknown>
  ) {
    logger.info('Payment Event', {
      event,
      amount,
      currency,
      transactionId,
      ...meta,
    });
  }

  /**
   * Log email event
   */
  static logEmailEvent(
    event: 'sent' | 'failed' | 'queued',
    recipient: string,
    template: string,
    meta?: Record<string, unknown>
  ) {
    // Only log domain for privacy
    const domain = recipient.split('@')[1] || 'unknown';
    logger.info('Email Event', {
      event,
      recipientDomain: domain,
      template,
      ...meta,
    });
  }

  /**
   * Log file upload event
   */
  static logFileUpload(
    userId: string,
    fileName: string,
    fileSize: number,
    mimeType: string,
    success: boolean,
    meta?: Record<string, unknown>
  ) {
    logger.info('File Upload', {
      userId,
      fileName,
      fileSize,
      mimeType,
      success,
      ...meta,
    });
  }

  /**
   * Log external service call
   */
  static logExternalService(
    service: string,
    operation: string,
    duration: number,
    success: boolean,
    meta?: Record<string, unknown>
  ) {
    const level = success ? 'info' : 'error';
    logger.log(level, 'External Service Call', {
      service,
      operation,
      duration,
      success,
      ...meta,
    });
  }

  /**
   * Log performance metric
   */
  static logPerformance(
    operation: string,
    duration: number,
    threshold: number,
    meta?: Record<string, unknown>
  ) {
    const level = duration > threshold ? 'warn' : 'debug';
    logger.log(level, 'Performance Metric', {
      operation,
      duration,
      threshold,
      exceedsThreshold: duration > threshold,
      ...meta,
    });
  }

  /**
   * Log error with stack trace
   */
  static logError(error: Error, context?: string, meta?: Record<string, unknown>) {
    logger.error('Application Error', {
      message: error.message,
      stack: error.stack,
      context,
      ...meta,
    });
  }

  /**
   * Log system health check
   */
  static logHealthCheck(
    service: string,
    status: 'healthy' | 'degraded' | 'unhealthy',
    responseTime: number,
    meta?: Record<string, unknown>
  ) {
    const level = status === 'healthy' ? 'info' : status === 'degraded' ? 'warn' : 'error';
    logger.log(level, 'Health Check', {
      service,
      status,
      responseTime,
      ...meta,
    });
  }
}

// Export the raw Winston logger for advanced use cases
export const rawLogger = logger;

export default Logger
