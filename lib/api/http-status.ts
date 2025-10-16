/**
 * HTTP Status Codes
 * Standard HTTP status codes used throughout the API
 */

/**
 * HTTP Status Code constants
 * Provides semantic names for HTTP status codes
 */
export const HTTP_STATUS = {
  // 2xx Success
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,

  // 3xx Redirection
  MOVED_PERMANENTLY: 301,
  FOUND: 302,
  NOT_MODIFIED: 304,
  TEMPORARY_REDIRECT: 307,
  PERMANENT_REDIRECT: 308,

  // 4xx Client Errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  PAYMENT_REQUIRED: 402,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  NOT_ACCEPTABLE: 406,
  REQUEST_TIMEOUT: 408,
  CONFLICT: 409,
  GONE: 410,
  LENGTH_REQUIRED: 411,
  PRECONDITION_FAILED: 412,
  PAYLOAD_TOO_LARGE: 413,
  URI_TOO_LONG: 414,
  UNSUPPORTED_MEDIA_TYPE: 415,
  RANGE_NOT_SATISFIABLE: 416,
  EXPECTATION_FAILED: 417,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,

  // 5xx Server Errors
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
  HTTP_VERSION_NOT_SUPPORTED: 505,
} as const;

/**
 * HTTP Status Code type
 * Union type of all HTTP status codes
 */
export type HttpStatusCode = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];

/**
 * Status Code Categories
 * Categorizes status codes by their first digit
 */
export const STATUS_CATEGORIES = {
  INFORMATIONAL: '1xx',
  SUCCESS: '2xx',
  REDIRECTION: '3xx',
  CLIENT_ERROR: '4xx',
  SERVER_ERROR: '5xx',
} as const;

/**
 * HTTP Status Messages
 * Human-readable messages for each status code
 */
export const HTTP_STATUS_MESSAGES: Record<number, string> = {
  // 2xx Success
  200: 'OK',
  201: 'Created',
  202: 'Accepted',
  204: 'No Content',

  // 3xx Redirection
  301: 'Moved Permanently',
  302: 'Found',
  304: 'Not Modified',
  307: 'Temporary Redirect',
  308: 'Permanent Redirect',

  // 4xx Client Errors
  400: 'Bad Request',
  401: 'Unauthorized',
  402: 'Payment Required',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  406: 'Not Acceptable',
  408: 'Request Timeout',
  409: 'Conflict',
  410: 'Gone',
  411: 'Length Required',
  412: 'Precondition Failed',
  413: 'Payload Too Large',
  414: 'URI Too Long',
  415: 'Unsupported Media Type',
  416: 'Range Not Satisfiable',
  417: 'Expectation Failed',
  422: 'Unprocessable Entity',
  429: 'Too Many Requests',

  // 5xx Server Errors
  500: 'Internal Server Error',
  501: 'Not Implemented',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
  505: 'HTTP Version Not Supported',
};

/**
 * Get status message
 * Returns the human-readable message for a status code
 */
export function getStatusMessage(statusCode: number): string {
  return HTTP_STATUS_MESSAGES[statusCode] || 'Unknown Status';
}

/**
 * Get status category
 * Returns the category (1xx, 2xx, etc.) for a status code
 */
export function getStatusCategory(
  statusCode: number
): (typeof STATUS_CATEGORIES)[keyof typeof STATUS_CATEGORIES] | 'Unknown' {
  const firstDigit = Math.floor(statusCode / 100);
  switch (firstDigit) {
    case 1:
      return STATUS_CATEGORIES.INFORMATIONAL;
    case 2:
      return STATUS_CATEGORIES.SUCCESS;
    case 3:
      return STATUS_CATEGORIES.REDIRECTION;
    case 4:
      return STATUS_CATEGORIES.CLIENT_ERROR;
    case 5:
      return STATUS_CATEGORIES.SERVER_ERROR;
    default:
      return 'Unknown';
  }
}

/**
 * Check if status code is success
 * Returns true if status code is in 2xx range
 */
export function isSuccessStatus(statusCode: number): boolean {
  return statusCode >= 200 && statusCode < 300;
}

/**
 * Check if status code is client error
 * Returns true if status code is in 4xx range
 */
export function isClientError(statusCode: number): boolean {
  return statusCode >= 400 && statusCode < 500;
}

/**
 * Check if status code is server error
 * Returns true if status code is in 5xx range
 */
export function isServerError(statusCode: number): boolean {
  return statusCode >= 500 && statusCode < 600;
}

/**
 * Check if status code is error
 * Returns true if status code is 4xx or 5xx
 */
export function isErrorStatus(statusCode: number): boolean {
  return isClientError(statusCode) || isServerError(statusCode);
}

/**
 * Check if status code is redirect
 * Returns true if status code is in 3xx range
 */
export function isRedirectStatus(statusCode: number): boolean {
  return statusCode >= 300 && statusCode < 400;
}

/**
 * Status Code Usage Guide
 * Documentation for when to use each status code
 */
export const STATUS_CODE_USAGE = {
  // Success codes
  200: {
    usage: 'Successful GET, PUT, PATCH, or DELETE request',
    example: 'User retrieved successfully',
  },
  201: {
    usage: 'Successful POST request that creates a resource',
    example: 'User created successfully',
  },
  204: {
    usage: 'Successful request with no content to return',
    example: 'User deleted successfully',
  },

  // Client error codes
  400: {
    usage: 'Invalid request data or malformed syntax',
    example: 'Invalid JSON in request body',
  },
  401: {
    usage: 'Authentication required or failed',
    example: 'Missing or invalid authentication token',
  },
  403: {
    usage: 'Authenticated but not authorized for the resource',
    example: 'User does not have permission to access this resource',
  },
  404: {
    usage: 'Resource not found',
    example: 'User with ID 123 not found',
  },
  405: {
    usage: 'HTTP method not supported for this endpoint',
    example: 'POST method not allowed for /api/users/:id',
  },
  409: {
    usage: 'Conflict with current state of resource',
    example: 'User with email already exists',
  },
  422: {
    usage: 'Request is well-formed but has validation errors',
    example: 'Email field must be a valid email address',
  },
  429: {
    usage: 'Too many requests - rate limit exceeded',
    example: 'Rate limit of 100 requests per minute exceeded',
  },

  // Server error codes
  500: {
    usage: 'Unexpected server error',
    example: 'Database connection failed',
  },
  503: {
    usage: 'Service temporarily unavailable',
    example: 'System is under maintenance',
  },
} as const;

/**
 * Get status code usage
 * Returns usage guide for a status code
 */
export function getStatusCodeUsage(statusCode: number): {
  usage: string;
  example: string;
} | null {
  return STATUS_CODE_USAGE[statusCode as keyof typeof STATUS_CODE_USAGE] || null;
}
