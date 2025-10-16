/**
 * API Response Formatter
 * Utilities for creating standardized API responses
 */

import { nanoid } from 'nanoid';
import type {
  ApiResponse,
  ApiSuccessResponse,
  ApiErrorResponse,
  PaginatedResponse,
  ApiMetadata,
  PaginationMetadata,
  ApiError,
  ValidationError,
  ApiRequestContext,
} from './types';

const API_VERSION = 'v1';

/**
 * Generate request ID
 * Creates a unique identifier for each request
 */
export function generateRequestId(): string {
  return `req_${nanoid(21)}`;
}

/**
 * Create API metadata
 * Generates standard metadata for API responses
 */
export function createMetadata(
  requestId: string,
  pagination?: PaginationMetadata
): ApiMetadata {
  return {
    requestId,
    timestamp: new Date().toISOString(),
    version: API_VERSION,
    ...(pagination && { pagination }),
  };
}

/**
 * Create success response
 * Formats a successful API response with data
 */
export function createSuccessResponse<T>(
  data: T,
  requestId: string,
  pagination?: PaginationMetadata
): ApiSuccessResponse<T> {
  return {
    success: true,
    data,
    meta: createMetadata(requestId, pagination),
  };
}

/**
 * Create error response
 * Formats an error API response with error details
 */
export function createErrorResponse(
  error: Omit<ApiError, 'timestamp' | 'requestId'>,
  requestId: string
): ApiErrorResponse {
  return {
    success: false,
    error: {
      ...error,
      timestamp: new Date().toISOString(),
      requestId,
    },
    meta: createMetadata(requestId),
  };
}

/**
 * Create paginated response
 * Formats a paginated list response
 */
export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
  requestId: string
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  const pagination: PaginationMetadata = {
    page,
    limit,
    total,
    totalPages,
    hasNextPage,
    hasPreviousPage,
  };

  return {
    success: true,
    data,
    meta: {
      ...createMetadata(requestId, pagination),
      pagination,
    },
  };
}

/**
 * Create validation error response
 * Formats a response for validation errors
 */
export function createValidationErrorResponse(
  validationErrors: ValidationError[],
  requestId: string,
  path: string
): ApiErrorResponse {
  return createErrorResponse(
    {
      code: 'VAL_001',
      message: 'Validation failed',
      details: `${validationErrors.length} validation error(s) occurred`,
      path,
      validationErrors,
    },
    requestId
  );
}

/**
 * Create not found response
 * Formats a 404 not found response
 */
export function createNotFoundResponse(
  resource: string,
  resourceId: string,
  requestId: string,
  path: string
): ApiErrorResponse {
  return createErrorResponse(
    {
      code: 'RES_001',
      message: 'Resource not found',
      details: `${resource} with ID '${resourceId}' not found`,
      path,
    },
    requestId
  );
}

/**
 * Create unauthorized response
 * Formats a 401 unauthorized response
 */
export function createUnauthorizedResponse(
  requestId: string,
  path: string,
  details?: string
): ApiErrorResponse {
  return createErrorResponse(
    {
      code: 'AUTH_001',
      message: 'Authentication required',
      details: details || 'Valid authentication credentials are required',
      path,
    },
    requestId
  );
}

/**
 * Create forbidden response
 * Formats a 403 forbidden response
 */
export function createForbiddenResponse(
  requestId: string,
  path: string,
  details?: string
): ApiErrorResponse {
  return createErrorResponse(
    {
      code: 'AUTHZ_001',
      message: 'Access denied',
      details: details || 'You do not have permission to access this resource',
      path,
    },
    requestId
  );
}

/**
 * Create rate limit response
 * Formats a 429 rate limit exceeded response
 */
export function createRateLimitResponse(
  requestId: string,
  path: string,
  retryAfter: number
): ApiErrorResponse {
  return createErrorResponse(
    {
      code: 'RATE_001',
      message: 'Rate limit exceeded',
      details: `Too many requests. Please try again in ${retryAfter} seconds`,
      path,
    },
    requestId
  );
}

/**
 * Create internal server error response
 * Formats a 500 internal server error response
 */
export function createInternalErrorResponse(
  requestId: string,
  path: string,
  error?: Error
): ApiErrorResponse {
  return createErrorResponse(
    {
      code: 'SYS_003',
      message: 'Internal server error',
      details:
        process.env.NODE_ENV === 'development'
          ? error?.message || 'An unexpected error occurred'
          : 'An unexpected error occurred. Please try again later',
      path,
    },
    requestId
  );
}

/**
 * Create conflict response
 * Formats a 409 conflict response
 */
export function createConflictResponse(
  resource: string,
  requestId: string,
  path: string,
  details?: string
): ApiErrorResponse {
  return createErrorResponse(
    {
      code: 'RES_003',
      message: 'Resource conflict',
      details: details || `${resource} already exists`,
      path,
    },
    requestId
  );
}

/**
 * Create bad request response
 * Formats a 400 bad request response
 */
export function createBadRequestResponse(
  requestId: string,
  path: string,
  details: string
): ApiErrorResponse {
  return createErrorResponse(
    {
      code: 'VAL_001',
      message: 'Bad request',
      details,
      path,
    },
    requestId
  );
}

/**
 * Create method not allowed response
 * Formats a 405 method not allowed response
 */
export function createMethodNotAllowedResponse(
  method: string,
  requestId: string,
  path: string
): ApiErrorResponse {
  return createErrorResponse(
    {
      code: 'SYS_004',
      message: 'Method not allowed',
      details: `HTTP method '${method}' is not allowed for this endpoint`,
      path,
    },
    requestId
  );
}

/**
 * Extract request context from Next.js request
 * Extracts common information from the request
 */
export function extractRequestContext(request: Request): ApiRequestContext {
  const url = new URL(request.url);
  const requestId = generateRequestId();

  return {
    requestId,
    path: url.pathname,
    method: request.method,
    timestamp: new Date(),
  };
}

/**
 * Format API response as Next.js Response
 * Converts ApiResponse to Next.js Response object
 */
export function formatAsNextResponse(
  apiResponse: ApiResponse,
  statusCode: number
): Response {
  return new Response(JSON.stringify(apiResponse), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': apiResponse.meta?.requestId || '',
      'X-API-Version': API_VERSION,
    },
  });
}

/**
 * Calculate pagination offset
 * Calculates database offset from page number
 */
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Validate pagination parameters
 * Ensures pagination parameters are valid
 */
export function validatePaginationParams(
  page?: number,
  limit?: number
): { page: number; limit: number } {
  const validatedPage = Math.max(1, page || 1);
  const validatedLimit = Math.min(100, Math.max(1, limit || 20));

  return {
    page: validatedPage,
    limit: validatedLimit,
  };
}

/**
 * Response formatter class
 * Provides a class-based API for creating responses
 */
export class ResponseFormatter {
  private requestId: string;
  private path: string;

  constructor(requestId: string, path: string) {
    this.requestId = requestId;
    this.path = path;
  }

  success<T>(data: T, statusCode = 200): Response {
    const response = createSuccessResponse(data, this.requestId);
    return formatAsNextResponse(response, statusCode);
  }

  paginated<T>(
    data: T[],
    page: number,
    limit: number,
    total: number,
    statusCode = 200
  ): Response {
    const response = createPaginatedResponse(
      data,
      page,
      limit,
      total,
      this.requestId
    );
    return formatAsNextResponse(response, statusCode);
  }

  error(error: Omit<ApiError, 'timestamp' | 'requestId'>, statusCode: number): Response {
    const response = createErrorResponse(error, this.requestId);
    return formatAsNextResponse(response, statusCode);
  }

  notFound(resource: string, resourceId: string): Response {
    const response = createNotFoundResponse(
      resource,
      resourceId,
      this.requestId,
      this.path
    );
    return formatAsNextResponse(response, 404);
  }

  unauthorized(details?: string): Response {
    const response = createUnauthorizedResponse(
      this.requestId,
      this.path,
      details
    );
    return formatAsNextResponse(response, 401);
  }

  forbidden(details?: string): Response {
    const response = createForbiddenResponse(
      this.requestId,
      this.path,
      details
    );
    return formatAsNextResponse(response, 403);
  }

  validationError(validationErrors: ValidationError[]): Response {
    const response = createValidationErrorResponse(
      validationErrors,
      this.requestId,
      this.path
    );
    return formatAsNextResponse(response, 422);
  }

  rateLimit(retryAfter: number): Response {
    const response = createRateLimitResponse(
      this.requestId,
      this.path,
      retryAfter
    );
    return formatAsNextResponse(response, 429);
  }

  internalError(error?: Error): Response {
    const response = createInternalErrorResponse(
      this.requestId,
      this.path,
      error
    );
    return formatAsNextResponse(response, 500);
  }

  conflict(resource: string, details?: string): Response {
    const response = createConflictResponse(
      resource,
      this.requestId,
      this.path,
      details
    );
    return formatAsNextResponse(response, 409);
  }

  badRequest(details: string): Response {
    const response = createBadRequestResponse(
      this.requestId,
      this.path,
      details
    );
    return formatAsNextResponse(response, 400);
  }

  methodNotAllowed(method: string): Response {
    const response = createMethodNotAllowedResponse(
      method,
      this.requestId,
      this.path
    );
    return formatAsNextResponse(response, 405);
  }
}

/**
 * Create response formatter
 * Factory function to create a ResponseFormatter instance
 */
export function createResponseFormatter(request: Request): ResponseFormatter {
  const context = extractRequestContext(request);
  return new ResponseFormatter(context.requestId, context.path);
}
