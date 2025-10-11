/**
 * API Error Type System
 * 
 * Comprehensive TypeScript types for standardized API error responses
 * Provides consistent error handling across all API endpoints
 * 
 * @author Zyphex Tech Development Team
 * @version 1.0.0
 * @created 2025-10-11
 */

/**
 * Standard HTTP Status Codes for API Responses
 */
export enum HttpStatusCode {
  // Success
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,
  
  // Redirection
  MOVED_PERMANENTLY = 301,
  FOUND = 302,
  NOT_MODIFIED = 304,
  
  // Client Errors
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  NOT_ACCEPTABLE = 406,
  CONFLICT = 409,
  GONE = 410,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  
  // Server Errors
  INTERNAL_SERVER_ERROR = 500,
  NOT_IMPLEMENTED = 501,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
}

/**
 * Standardized API Error Codes
 * Provides specific, actionable error identification
 */
export enum ApiErrorCode {
  // Authentication & Authorization
  AUTH_TOKEN_MISSING = 'AUTH_TOKEN_MISSING',
  AUTH_TOKEN_INVALID = 'AUTH_TOKEN_INVALID',
  AUTH_TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',
  AUTH_INSUFFICIENT_PERMISSIONS = 'AUTH_INSUFFICIENT_PERMISSIONS',
  AUTH_SESSION_EXPIRED = 'AUTH_SESSION_EXPIRED',
  AUTH_ACCOUNT_LOCKED = 'AUTH_ACCOUNT_LOCKED',
  AUTH_ACCOUNT_SUSPENDED = 'AUTH_ACCOUNT_SUSPENDED',
  
  // Validation Errors
  VALIDATION_REQUIRED_FIELD = 'VALIDATION_REQUIRED_FIELD',
  VALIDATION_INVALID_FORMAT = 'VALIDATION_INVALID_FORMAT',
  VALIDATION_OUT_OF_RANGE = 'VALIDATION_OUT_OF_RANGE',
  VALIDATION_DUPLICATE_VALUE = 'VALIDATION_DUPLICATE_VALUE',
  VALIDATION_INVALID_TYPE = 'VALIDATION_INVALID_TYPE',
  VALIDATION_SCHEMA_MISMATCH = 'VALIDATION_SCHEMA_MISMATCH',
  
  // Resource Errors
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  RESOURCE_LOCKED = 'RESOURCE_LOCKED',
  RESOURCE_DELETED = 'RESOURCE_DELETED',
  RESOURCE_ACCESS_DENIED = 'RESOURCE_ACCESS_DENIED',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  CONCURRENT_REQUEST_LIMIT = 'CONCURRENT_REQUEST_LIMIT',
  
  // Database Errors
  DATABASE_CONNECTION_ERROR = 'DATABASE_CONNECTION_ERROR',
  DATABASE_QUERY_ERROR = 'DATABASE_QUERY_ERROR',
  DATABASE_CONSTRAINT_VIOLATION = 'DATABASE_CONSTRAINT_VIOLATION',
  DATABASE_TIMEOUT = 'DATABASE_TIMEOUT',
  DATABASE_TRANSACTION_FAILED = 'DATABASE_TRANSACTION_FAILED',
  
  // External Service Errors
  EXTERNAL_SERVICE_UNAVAILABLE = 'EXTERNAL_SERVICE_UNAVAILABLE',
  EXTERNAL_SERVICE_TIMEOUT = 'EXTERNAL_SERVICE_TIMEOUT',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  PAYMENT_GATEWAY_ERROR = 'PAYMENT_GATEWAY_ERROR',
  EMAIL_SERVICE_ERROR = 'EMAIL_SERVICE_ERROR',
  
  // File & Upload Errors
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  FILE_INVALID_TYPE = 'FILE_INVALID_TYPE',
  FILE_UPLOAD_FAILED = 'FILE_UPLOAD_FAILED',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  FILE_PROCESSING_ERROR = 'FILE_PROCESSING_ERROR',
  
  // Business Logic Errors
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',
  FEATURE_DISABLED = 'FEATURE_DISABLED',
  MAINTENANCE_MODE = 'MAINTENANCE_MODE',
  
  // System Errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  DEPENDENCY_ERROR = 'DEPENDENCY_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  MEMORY_ERROR = 'MEMORY_ERROR',
}

/**
 * Error Severity Levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Validation Error Detail
 */
export interface ValidationError {
  field: string;
  code: ApiErrorCode;
  message: string;
  value?: unknown;
  constraints?: Record<string, unknown>;
}

/**
 * Rate Limit Information
 */
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: string; // ISO timestamp
  retryAfter?: number; // seconds
}

/**
 * Request Context Information
 */
export interface RequestContext {
  requestId: string;
  timestamp: string; // ISO timestamp
  method: string;
  path: string;
  userAgent?: string;
  clientIp?: string;
  userId?: string;
  sessionId?: string;
  correlationId?: string;
}

/**
 * Error Stack Trace (Development Only)
 */
export interface ErrorStackTrace {
  message: string;
  stack?: string;
  cause?: unknown;
  fileName?: string;
  lineNumber?: number;
  columnNumber?: string;
}

/**
 * Standardized API Error Response
 */
export interface ApiErrorResponse {
  // Core Error Information
  error: true;
  code: ApiErrorCode;
  message: string;
  statusCode: HttpStatusCode;
  
  // Additional Context
  severity: ErrorSeverity;
  timestamp: string; // ISO timestamp
  requestId: string;
  path: string;
  method: string;
  
  // Optional Details
  details?: Record<string, unknown>;
  validationErrors?: ValidationError[];
  rateLimitInfo?: RateLimitInfo;
  retryable?: boolean;
  retryAfter?: number; // seconds
  
  // Help & Documentation
  documentation?: string;
  supportContact?: string;
  
  // Development Information (excluded in production)
  stack?: ErrorStackTrace;
  debug?: Record<string, unknown>;
}

/**
 * Success Response Wrapper
 */
export interface ApiSuccessResponse<T = unknown> {
  error: false;
  data: T;
  message?: string;
  statusCode: HttpStatusCode;
  timestamp: string;
  requestId: string;
  
  // Optional Metadata
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    version?: string;
    cached?: boolean;
    executionTime?: number; // milliseconds
  };
}

/**
 * API Response Union Type
 */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Error Context for Error Handler
 */
export interface ErrorHandlerContext {
  request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: unknown;
    query?: Record<string, unknown>;
    params?: Record<string, unknown>;
  };
  user?: {
    id: string;
    email: string;
    role: string;
  };
  rateLimitInfo?: RateLimitInfo;
  startTime: number;
}

/**
 * Error Handler Configuration
 */
export interface ErrorHandlerConfig {
  includeStack: boolean;
  includeDebugInfo: boolean;
  logErrors: boolean;
  notifyOnCritical: boolean;
  rateLimitEnabled: boolean;
  corsEnabled: boolean;
  sanitizeOutput: boolean;
}

/**
 * Async Operation Result
 */
export type AsyncResult<T, E = ApiErrorResponse> = Promise<{
  success: boolean;
  data?: T;
  error?: E;
}>;

/**
 * Request Tracking Information
 */
export interface RequestTrackingInfo {
  requestId: string;
  correlationId?: string;
  parentRequestId?: string;
  userId?: string;
  sessionId?: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  statusCode?: number;
  error?: boolean;
  retryCount?: number;
  cached?: boolean;
}

/**
 * Error Metrics for Analytics
 */
export interface ErrorMetrics {
  errorCode: ApiErrorCode;
  count: number;
  lastOccurrence: string;
  averageResponseTime: number;
  statusCode: HttpStatusCode;
  severity: ErrorSeverity;
  affectedUsers: number;
  retrySuccessRate?: number;
}

/**
 * Type Guards
 */
export const isApiErrorResponse = (response: unknown): response is ApiErrorResponse => {
  return typeof response === 'object' && 
         response !== null && 
         'error' in response && 
         (response as ApiErrorResponse).error === true;
};

export const isApiSuccessResponse = <T>(response: unknown): response is ApiSuccessResponse<T> => {
  return typeof response === 'object' && 
         response !== null && 
         'error' in response && 
         (response as ApiSuccessResponse<T>).error === false;
};

/**
 * Error Code to HTTP Status Code Mapping
 */
export const ERROR_CODE_TO_STATUS: Record<ApiErrorCode, HttpStatusCode> = {
  // Authentication & Authorization - 401/403
  [ApiErrorCode.AUTH_TOKEN_MISSING]: HttpStatusCode.UNAUTHORIZED,
  [ApiErrorCode.AUTH_TOKEN_INVALID]: HttpStatusCode.UNAUTHORIZED,
  [ApiErrorCode.AUTH_TOKEN_EXPIRED]: HttpStatusCode.UNAUTHORIZED,
  [ApiErrorCode.AUTH_INSUFFICIENT_PERMISSIONS]: HttpStatusCode.FORBIDDEN,
  [ApiErrorCode.AUTH_SESSION_EXPIRED]: HttpStatusCode.UNAUTHORIZED,
  [ApiErrorCode.AUTH_ACCOUNT_LOCKED]: HttpStatusCode.FORBIDDEN,
  [ApiErrorCode.AUTH_ACCOUNT_SUSPENDED]: HttpStatusCode.FORBIDDEN,
  
  // Validation Errors - 400/422
  [ApiErrorCode.VALIDATION_REQUIRED_FIELD]: HttpStatusCode.UNPROCESSABLE_ENTITY,
  [ApiErrorCode.VALIDATION_INVALID_FORMAT]: HttpStatusCode.UNPROCESSABLE_ENTITY,
  [ApiErrorCode.VALIDATION_OUT_OF_RANGE]: HttpStatusCode.UNPROCESSABLE_ENTITY,
  [ApiErrorCode.VALIDATION_DUPLICATE_VALUE]: HttpStatusCode.CONFLICT,
  [ApiErrorCode.VALIDATION_INVALID_TYPE]: HttpStatusCode.UNPROCESSABLE_ENTITY,
  [ApiErrorCode.VALIDATION_SCHEMA_MISMATCH]: HttpStatusCode.BAD_REQUEST,
  
  // Resource Errors - 404/409/423
  [ApiErrorCode.RESOURCE_NOT_FOUND]: HttpStatusCode.NOT_FOUND,
  [ApiErrorCode.RESOURCE_ALREADY_EXISTS]: HttpStatusCode.CONFLICT,
  [ApiErrorCode.RESOURCE_CONFLICT]: HttpStatusCode.CONFLICT,
  [ApiErrorCode.RESOURCE_LOCKED]: HttpStatusCode.FORBIDDEN,
  [ApiErrorCode.RESOURCE_DELETED]: HttpStatusCode.GONE,
  [ApiErrorCode.RESOURCE_ACCESS_DENIED]: HttpStatusCode.FORBIDDEN,
  
  // Rate Limiting - 429
  [ApiErrorCode.RATE_LIMIT_EXCEEDED]: HttpStatusCode.TOO_MANY_REQUESTS,
  [ApiErrorCode.QUOTA_EXCEEDED]: HttpStatusCode.TOO_MANY_REQUESTS,
  [ApiErrorCode.CONCURRENT_REQUEST_LIMIT]: HttpStatusCode.TOO_MANY_REQUESTS,
  
  // Database Errors - 500/503
  [ApiErrorCode.DATABASE_CONNECTION_ERROR]: HttpStatusCode.SERVICE_UNAVAILABLE,
  [ApiErrorCode.DATABASE_QUERY_ERROR]: HttpStatusCode.INTERNAL_SERVER_ERROR,
  [ApiErrorCode.DATABASE_CONSTRAINT_VIOLATION]: HttpStatusCode.CONFLICT,
  [ApiErrorCode.DATABASE_TIMEOUT]: HttpStatusCode.GATEWAY_TIMEOUT,
  [ApiErrorCode.DATABASE_TRANSACTION_FAILED]: HttpStatusCode.INTERNAL_SERVER_ERROR,
  
  // External Service Errors - 502/503/504
  [ApiErrorCode.EXTERNAL_SERVICE_UNAVAILABLE]: HttpStatusCode.SERVICE_UNAVAILABLE,
  [ApiErrorCode.EXTERNAL_SERVICE_TIMEOUT]: HttpStatusCode.GATEWAY_TIMEOUT,
  [ApiErrorCode.EXTERNAL_SERVICE_ERROR]: HttpStatusCode.BAD_GATEWAY,
  [ApiErrorCode.PAYMENT_GATEWAY_ERROR]: HttpStatusCode.BAD_GATEWAY,
  [ApiErrorCode.EMAIL_SERVICE_ERROR]: HttpStatusCode.SERVICE_UNAVAILABLE,
  
  // File & Upload Errors - 400/413/415
  [ApiErrorCode.FILE_TOO_LARGE]: HttpStatusCode.UNPROCESSABLE_ENTITY,
  [ApiErrorCode.FILE_INVALID_TYPE]: HttpStatusCode.UNPROCESSABLE_ENTITY,
  [ApiErrorCode.FILE_UPLOAD_FAILED]: HttpStatusCode.INTERNAL_SERVER_ERROR,
  [ApiErrorCode.FILE_NOT_FOUND]: HttpStatusCode.NOT_FOUND,
  [ApiErrorCode.FILE_PROCESSING_ERROR]: HttpStatusCode.INTERNAL_SERVER_ERROR,
  
  // Business Logic Errors - 400/402/405
  [ApiErrorCode.BUSINESS_RULE_VIOLATION]: HttpStatusCode.BAD_REQUEST,
  [ApiErrorCode.INSUFFICIENT_FUNDS]: HttpStatusCode.UNPROCESSABLE_ENTITY,
  [ApiErrorCode.OPERATION_NOT_ALLOWED]: HttpStatusCode.METHOD_NOT_ALLOWED,
  [ApiErrorCode.FEATURE_DISABLED]: HttpStatusCode.SERVICE_UNAVAILABLE,
  [ApiErrorCode.MAINTENANCE_MODE]: HttpStatusCode.SERVICE_UNAVAILABLE,
  
  // System Errors - 500
  [ApiErrorCode.INTERNAL_ERROR]: HttpStatusCode.INTERNAL_SERVER_ERROR,
  [ApiErrorCode.CONFIGURATION_ERROR]: HttpStatusCode.INTERNAL_SERVER_ERROR,
  [ApiErrorCode.DEPENDENCY_ERROR]: HttpStatusCode.SERVICE_UNAVAILABLE,
  [ApiErrorCode.TIMEOUT_ERROR]: HttpStatusCode.GATEWAY_TIMEOUT,
  [ApiErrorCode.MEMORY_ERROR]: HttpStatusCode.INTERNAL_SERVER_ERROR,
};

/**
 * Error Severity Mapping
 */
export const ERROR_CODE_TO_SEVERITY: Record<ApiErrorCode, ErrorSeverity> = {
  // Authentication & Authorization - Medium to High
  [ApiErrorCode.AUTH_TOKEN_MISSING]: ErrorSeverity.MEDIUM,
  [ApiErrorCode.AUTH_TOKEN_INVALID]: ErrorSeverity.MEDIUM,
  [ApiErrorCode.AUTH_TOKEN_EXPIRED]: ErrorSeverity.LOW,
  [ApiErrorCode.AUTH_INSUFFICIENT_PERMISSIONS]: ErrorSeverity.MEDIUM,
  [ApiErrorCode.AUTH_SESSION_EXPIRED]: ErrorSeverity.LOW,
  [ApiErrorCode.AUTH_ACCOUNT_LOCKED]: ErrorSeverity.HIGH,
  [ApiErrorCode.AUTH_ACCOUNT_SUSPENDED]: ErrorSeverity.HIGH,
  
  // Validation Errors - Low to Medium
  [ApiErrorCode.VALIDATION_REQUIRED_FIELD]: ErrorSeverity.LOW,
  [ApiErrorCode.VALIDATION_INVALID_FORMAT]: ErrorSeverity.LOW,
  [ApiErrorCode.VALIDATION_OUT_OF_RANGE]: ErrorSeverity.LOW,
  [ApiErrorCode.VALIDATION_DUPLICATE_VALUE]: ErrorSeverity.MEDIUM,
  [ApiErrorCode.VALIDATION_INVALID_TYPE]: ErrorSeverity.LOW,
  [ApiErrorCode.VALIDATION_SCHEMA_MISMATCH]: ErrorSeverity.MEDIUM,
  
  // Resource Errors - Low to Medium
  [ApiErrorCode.RESOURCE_NOT_FOUND]: ErrorSeverity.LOW,
  [ApiErrorCode.RESOURCE_ALREADY_EXISTS]: ErrorSeverity.MEDIUM,
  [ApiErrorCode.RESOURCE_CONFLICT]: ErrorSeverity.MEDIUM,
  [ApiErrorCode.RESOURCE_LOCKED]: ErrorSeverity.MEDIUM,
  [ApiErrorCode.RESOURCE_DELETED]: ErrorSeverity.MEDIUM,
  [ApiErrorCode.RESOURCE_ACCESS_DENIED]: ErrorSeverity.MEDIUM,
  
  // Rate Limiting - Medium to High
  [ApiErrorCode.RATE_LIMIT_EXCEEDED]: ErrorSeverity.MEDIUM,
  [ApiErrorCode.QUOTA_EXCEEDED]: ErrorSeverity.HIGH,
  [ApiErrorCode.CONCURRENT_REQUEST_LIMIT]: ErrorSeverity.HIGH,
  
  // Database Errors - High to Critical
  [ApiErrorCode.DATABASE_CONNECTION_ERROR]: ErrorSeverity.CRITICAL,
  [ApiErrorCode.DATABASE_QUERY_ERROR]: ErrorSeverity.HIGH,
  [ApiErrorCode.DATABASE_CONSTRAINT_VIOLATION]: ErrorSeverity.MEDIUM,
  [ApiErrorCode.DATABASE_TIMEOUT]: ErrorSeverity.HIGH,
  [ApiErrorCode.DATABASE_TRANSACTION_FAILED]: ErrorSeverity.HIGH,
  
  // External Service Errors - Medium to High
  [ApiErrorCode.EXTERNAL_SERVICE_UNAVAILABLE]: ErrorSeverity.HIGH,
  [ApiErrorCode.EXTERNAL_SERVICE_TIMEOUT]: ErrorSeverity.MEDIUM,
  [ApiErrorCode.EXTERNAL_SERVICE_ERROR]: ErrorSeverity.MEDIUM,
  [ApiErrorCode.PAYMENT_GATEWAY_ERROR]: ErrorSeverity.HIGH,
  [ApiErrorCode.EMAIL_SERVICE_ERROR]: ErrorSeverity.MEDIUM,
  
  // File & Upload Errors - Low to Medium
  [ApiErrorCode.FILE_TOO_LARGE]: ErrorSeverity.LOW,
  [ApiErrorCode.FILE_INVALID_TYPE]: ErrorSeverity.LOW,
  [ApiErrorCode.FILE_UPLOAD_FAILED]: ErrorSeverity.MEDIUM,
  [ApiErrorCode.FILE_NOT_FOUND]: ErrorSeverity.LOW,
  [ApiErrorCode.FILE_PROCESSING_ERROR]: ErrorSeverity.MEDIUM,
  
  // Business Logic Errors - Low to High
  [ApiErrorCode.BUSINESS_RULE_VIOLATION]: ErrorSeverity.MEDIUM,
  [ApiErrorCode.INSUFFICIENT_FUNDS]: ErrorSeverity.MEDIUM,
  [ApiErrorCode.OPERATION_NOT_ALLOWED]: ErrorSeverity.MEDIUM,
  [ApiErrorCode.FEATURE_DISABLED]: ErrorSeverity.LOW,
  [ApiErrorCode.MAINTENANCE_MODE]: ErrorSeverity.HIGH,
  
  // System Errors - High to Critical
  [ApiErrorCode.INTERNAL_ERROR]: ErrorSeverity.CRITICAL,
  [ApiErrorCode.CONFIGURATION_ERROR]: ErrorSeverity.CRITICAL,
  [ApiErrorCode.DEPENDENCY_ERROR]: ErrorSeverity.HIGH,
  [ApiErrorCode.TIMEOUT_ERROR]: ErrorSeverity.MEDIUM,
  [ApiErrorCode.MEMORY_ERROR]: ErrorSeverity.CRITICAL,
};