/**
 * API Error Codes
 * Standardized error codes for all API errors
 * Format: CATEGORY_NUMBER (e.g., AUTH_001)
 */

/**
 * Authentication Error Codes (AUTH_xxx)
 * Errors related to authentication
 */
export const AUTH_ERROR_CODES = {
  TOKEN_MISSING: 'AUTH_001',
  TOKEN_INVALID: 'AUTH_002',
  TOKEN_EXPIRED: 'AUTH_003',
  TOKEN_MALFORMED: 'AUTH_004',
  CREDENTIALS_INVALID: 'AUTH_005',
  SESSION_EXPIRED: 'AUTH_006',
  SESSION_INVALID: 'AUTH_007',
  MFA_REQUIRED: 'AUTH_008',
  MFA_INVALID: 'AUTH_009',
  PASSWORD_INCORRECT: 'AUTH_010',
  ACCOUNT_LOCKED: 'AUTH_011',
  ACCOUNT_DISABLED: 'AUTH_012',
  REFRESH_TOKEN_INVALID: 'AUTH_013',
  REFRESH_TOKEN_EXPIRED: 'AUTH_014',
} as const;

/**
 * Authorization Error Codes (AUTHZ_xxx)
 * Errors related to permissions and access control
 */
export const AUTHZ_ERROR_CODES = {
  INSUFFICIENT_PERMISSIONS: 'AUTHZ_001',
  RESOURCE_ACCESS_DENIED: 'AUTHZ_002',
  ROLE_REQUIRED: 'AUTHZ_003',
  OWNERSHIP_REQUIRED: 'AUTHZ_004',
  ORGANIZATION_ACCESS_DENIED: 'AUTHZ_005',
  FEATURE_NOT_AVAILABLE: 'AUTHZ_006',
  SUBSCRIPTION_REQUIRED: 'AUTHZ_007',
  TRIAL_EXPIRED: 'AUTHZ_008',
} as const;

/**
 * Validation Error Codes (VAL_xxx)
 * Errors related to input validation
 */
export const VALIDATION_ERROR_CODES = {
  VALIDATION_FAILED: 'VAL_001',
  REQUIRED_FIELD_MISSING: 'VAL_002',
  INVALID_FIELD_FORMAT: 'VAL_003',
  FIELD_TOO_SHORT: 'VAL_004',
  FIELD_TOO_LONG: 'VAL_005',
  FIELD_OUT_OF_RANGE: 'VAL_006',
  INVALID_EMAIL: 'VAL_007',
  INVALID_PHONE: 'VAL_008',
  INVALID_URL: 'VAL_009',
  INVALID_DATE: 'VAL_010',
  INVALID_ENUM_VALUE: 'VAL_011',
  INVALID_UUID: 'VAL_012',
  INVALID_JSON: 'VAL_013',
  ARRAY_TOO_SHORT: 'VAL_014',
  ARRAY_TOO_LONG: 'VAL_015',
  DUPLICATE_VALUE: 'VAL_016',
  INVALID_FILE_TYPE: 'VAL_017',
  FILE_TOO_LARGE: 'VAL_018',
  INVALID_QUERY_PARAMETER: 'VAL_019',
  INVALID_PATH_PARAMETER: 'VAL_020',
} as const;

/**
 * Resource Error Codes (RES_xxx)
 * Errors related to resources and CRUD operations
 */
export const RESOURCE_ERROR_CODES = {
  RESOURCE_NOT_FOUND: 'RES_001',
  RESOURCE_ALREADY_EXISTS: 'RES_002',
  RESOURCE_CONFLICT: 'RES_003',
  RESOURCE_DELETED: 'RES_004',
  RESOURCE_LOCKED: 'RES_005',
  RESOURCE_EXPIRED: 'RES_006',
  PARENT_RESOURCE_NOT_FOUND: 'RES_007',
  CHILD_RESOURCES_EXIST: 'RES_008',
  RESOURCE_LIMIT_EXCEEDED: 'RES_009',
  RESOURCE_VERSION_MISMATCH: 'RES_010',
  CIRCULAR_DEPENDENCY: 'RES_011',
  INVALID_RESOURCE_STATE: 'RES_012',
} as const;

/**
 * Rate Limiting Error Codes (RATE_xxx)
 * Errors related to rate limiting
 */
export const RATE_LIMIT_ERROR_CODES = {
  RATE_LIMIT_EXCEEDED: 'RATE_001',
  QUOTA_EXCEEDED: 'RATE_002',
  CONCURRENT_REQUEST_LIMIT: 'RATE_003',
  BANDWIDTH_LIMIT_EXCEEDED: 'RATE_004',
  API_CALL_LIMIT_EXCEEDED: 'RATE_005',
} as const;

/**
 * System Error Codes (SYS_xxx)
 * Errors related to system operations
 */
export const SYSTEM_ERROR_CODES = {
  DATABASE_ERROR: 'SYS_001',
  EXTERNAL_SERVICE_ERROR: 'SYS_002',
  INTERNAL_SERVER_ERROR: 'SYS_003',
  METHOD_NOT_ALLOWED: 'SYS_004',
  SERVICE_UNAVAILABLE: 'SYS_005',
  TIMEOUT: 'SYS_006',
  CONFIGURATION_ERROR: 'SYS_007',
  FEATURE_NOT_IMPLEMENTED: 'SYS_008',
  MAINTENANCE_MODE: 'SYS_009',
  STORAGE_ERROR: 'SYS_010',
  CACHE_ERROR: 'SYS_011',
  QUEUE_ERROR: 'SYS_012',
  EMAIL_ERROR: 'SYS_013',
  SMS_ERROR: 'SYS_014',
  PAYMENT_GATEWAY_ERROR: 'SYS_015',
} as const;

/**
 * Business Logic Error Codes (BIZ_xxx)
 * Errors related to business rules and logic
 */
export const BUSINESS_ERROR_CODES = {
  BUSINESS_RULE_VIOLATION: 'BIZ_001',
  INVALID_OPERATION: 'BIZ_002',
  OPERATION_NOT_ALLOWED: 'BIZ_003',
  PREREQUISITE_NOT_MET: 'BIZ_004',
  WORKFLOW_ERROR: 'BIZ_005',
  STATE_TRANSITION_INVALID: 'BIZ_006',
  DEADLINE_PASSED: 'BIZ_007',
  SCHEDULE_CONFLICT: 'BIZ_008',
  BUDGET_EXCEEDED: 'BIZ_009',
  CAPACITY_EXCEEDED: 'BIZ_010',
} as const;

/**
 * All API Error Codes
 * Combined object of all error codes
 */
export const API_ERROR_CODES = {
  ...AUTH_ERROR_CODES,
  ...AUTHZ_ERROR_CODES,
  ...VALIDATION_ERROR_CODES,
  ...RESOURCE_ERROR_CODES,
  ...RATE_LIMIT_ERROR_CODES,
  ...SYSTEM_ERROR_CODES,
  ...BUSINESS_ERROR_CODES,
} as const;

/**
 * API Error Code type
 * Union type of all error codes
 */
export type ApiErrorCode = (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];

/**
 * Error Code Messages
 * Default messages for each error code
 */
export const ERROR_CODE_MESSAGES: Record<string, string> = {
  // Authentication
  AUTH_001: 'Authentication token is missing',
  AUTH_002: 'Authentication token is invalid',
  AUTH_003: 'Authentication token has expired',
  AUTH_004: 'Authentication token is malformed',
  AUTH_005: 'Invalid credentials provided',
  AUTH_006: 'Session has expired',
  AUTH_007: 'Session is invalid',
  AUTH_008: 'Multi-factor authentication is required',
  AUTH_009: 'Invalid multi-factor authentication code',
  AUTH_010: 'Password is incorrect',
  AUTH_011: 'Account has been locked',
  AUTH_012: 'Account has been disabled',
  AUTH_013: 'Refresh token is invalid',
  AUTH_014: 'Refresh token has expired',

  // Authorization
  AUTHZ_001: 'Insufficient permissions to perform this action',
  AUTHZ_002: 'Access to this resource is denied',
  AUTHZ_003: 'Required role is missing',
  AUTHZ_004: 'Resource ownership is required',
  AUTHZ_005: 'Organization access is denied',
  AUTHZ_006: 'Feature is not available for your plan',
  AUTHZ_007: 'Active subscription is required',
  AUTHZ_008: 'Trial period has expired',

  // Validation
  VAL_001: 'Validation failed',
  VAL_002: 'Required field is missing',
  VAL_003: 'Invalid field format',
  VAL_004: 'Field value is too short',
  VAL_005: 'Field value is too long',
  VAL_006: 'Field value is out of range',
  VAL_007: 'Invalid email address',
  VAL_008: 'Invalid phone number',
  VAL_009: 'Invalid URL',
  VAL_010: 'Invalid date format',
  VAL_011: 'Invalid enum value',
  VAL_012: 'Invalid UUID format',
  VAL_013: 'Invalid JSON format',
  VAL_014: 'Array is too short',
  VAL_015: 'Array is too long',
  VAL_016: 'Duplicate value detected',
  VAL_017: 'Invalid file type',
  VAL_018: 'File size exceeds maximum allowed',
  VAL_019: 'Invalid query parameter',
  VAL_020: 'Invalid path parameter',

  // Resources
  RES_001: 'Resource not found',
  RES_002: 'Resource already exists',
  RES_003: 'Resource conflict detected',
  RES_004: 'Resource has been deleted',
  RES_005: 'Resource is locked',
  RES_006: 'Resource has expired',
  RES_007: 'Parent resource not found',
  RES_008: 'Cannot delete resource with existing children',
  RES_009: 'Resource limit exceeded',
  RES_010: 'Resource version mismatch',
  RES_011: 'Circular dependency detected',
  RES_012: 'Invalid resource state',

  // Rate Limiting
  RATE_001: 'Rate limit exceeded',
  RATE_002: 'Quota exceeded',
  RATE_003: 'Concurrent request limit exceeded',
  RATE_004: 'Bandwidth limit exceeded',
  RATE_005: 'API call limit exceeded',

  // System
  SYS_001: 'Database error occurred',
  SYS_002: 'External service error',
  SYS_003: 'Internal server error',
  SYS_004: 'HTTP method not allowed',
  SYS_005: 'Service temporarily unavailable',
  SYS_006: 'Request timeout',
  SYS_007: 'Configuration error',
  SYS_008: 'Feature not implemented',
  SYS_009: 'System is in maintenance mode',
  SYS_010: 'Storage error occurred',
  SYS_011: 'Cache error occurred',
  SYS_012: 'Queue error occurred',
  SYS_013: 'Email service error',
  SYS_014: 'SMS service error',
  SYS_015: 'Payment gateway error',

  // Business Logic
  BIZ_001: 'Business rule violation',
  BIZ_002: 'Invalid operation',
  BIZ_003: 'Operation not allowed',
  BIZ_004: 'Prerequisite not met',
  BIZ_005: 'Workflow error',
  BIZ_006: 'Invalid state transition',
  BIZ_007: 'Deadline has passed',
  BIZ_008: 'Schedule conflict',
  BIZ_009: 'Budget exceeded',
  BIZ_010: 'Capacity exceeded',
};

/**
 * Get error message
 * Returns the default message for an error code
 */
export function getErrorMessage(errorCode: string): string {
  return ERROR_CODE_MESSAGES[errorCode] || 'Unknown error occurred';
}

/**
 * Get error category
 * Returns the category (AUTH, AUTHZ, etc.) from an error code
 */
export function getErrorCategory(errorCode: string): string {
  const parts = errorCode.split('_');
  return parts[0] || 'UNKNOWN';
}

/**
 * Check if error code is authentication error
 */
export function isAuthError(errorCode: string): boolean {
  return errorCode.startsWith('AUTH_');
}

/**
 * Check if error code is authorization error
 */
export function isAuthzError(errorCode: string): boolean {
  return errorCode.startsWith('AUTHZ_');
}

/**
 * Check if error code is validation error
 */
export function isValidationError(errorCode: string): boolean {
  return errorCode.startsWith('VAL_');
}

/**
 * Check if error code is resource error
 */
export function isResourceError(errorCode: string): boolean {
  return errorCode.startsWith('RES_');
}

/**
 * Check if error code is rate limit error
 */
export function isRateLimitError(errorCode: string): boolean {
  return errorCode.startsWith('RATE_');
}

/**
 * Check if error code is system error
 */
export function isSystemError(errorCode: string): boolean {
  return errorCode.startsWith('SYS_');
}

/**
 * Check if error code is business error
 */
export function isBusinessError(errorCode: string): boolean {
  return errorCode.startsWith('BIZ_');
}

/**
 * Error Code Documentation
 * Provides detailed documentation for error codes
 */
export interface ErrorCodeDocumentation {
  code: string;
  message: string;
  category: string;
  httpStatus: number;
  description: string;
  resolution: string;
  example: string;
}

/**
 * Get error code documentation
 * Returns full documentation for an error code
 */
export function getErrorCodeDocumentation(errorCode: string): ErrorCodeDocumentation | null {
  // This would be populated with full documentation
  // For now, return basic info
  const message = getErrorMessage(errorCode);
  const category = getErrorCategory(errorCode);

  if (!message) return null;

  return {
    code: errorCode,
    message,
    category,
    httpStatus: 500, // Default, should be mapped properly
    description: message,
    resolution: 'Contact support if this error persists',
    example: `Error ${errorCode}: ${message}`,
  };
}
