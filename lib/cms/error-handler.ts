import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

/**
 * CMS API Error Handler
 * Centralized error handling for consistent API responses
 */

export interface ApiError {
  error: string;
  message: string;
  details?: unknown;
  statusCode: number;
}

/**
 * Standard API error response structure
 */
export class CmsApiError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(message: string, statusCode: number = 500, details?: unknown) {
    super(message);
    this.name = 'CmsApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Error response builder
 */
export function createErrorResponse(
  error: unknown,
  defaultMessage: string = 'An error occurred'
): NextResponse<ApiError> {
  // Handle CmsApiError
  if (error instanceof CmsApiError) {
    return NextResponse.json(
      {
        error: error.name,
        message: error.message,
        details: error.details,
        statusCode: error.statusCode,
      },
      { status: error.statusCode }
    );
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'Validation Error',
        message: 'Invalid data provided',
        details: error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
          code: err.code,
        })),
        statusCode: 400,
      },
      { status: 400 }
    );
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        // Unique constraint violation
        return NextResponse.json(
          {
            error: 'Conflict',
            message: 'A resource with this value already exists',
            details: {
              field: error.meta?.target,
              code: error.code,
            },
            statusCode: 409,
          },
          { status: 409 }
        );

      case 'P2025':
        // Record not found
        return NextResponse.json(
          {
            error: 'Not Found',
            message: 'Resource not found',
            details: {
              code: error.code,
            },
            statusCode: 404,
          },
          { status: 404 }
        );

      case 'P2003':
        // Foreign key constraint failed
        return NextResponse.json(
          {
            error: 'Bad Request',
            message: 'Invalid reference - related resource does not exist',
            details: {
              field: error.meta?.field_name,
              code: error.code,
            },
            statusCode: 400,
          },
          { status: 400 }
        );

      case 'P2014':
        // Required relation violation
        return NextResponse.json(
          {
            error: 'Bad Request',
            message: 'Cannot delete - resource has dependent records',
            details: {
              code: error.code,
            },
            statusCode: 400,
          },
          { status: 400 }
        );

      default:
        return NextResponse.json(
          {
            error: 'Database Error',
            message: 'A database error occurred',
            details: {
              code: error.code,
            },
            statusCode: 500,
          },
          { status: 500 }
        );
    }
  }

  // Handle Prisma validation errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    return NextResponse.json(
      {
        error: 'Validation Error',
        message: 'Invalid data structure',
        statusCode: 400,
      },
      { status: 400 }
    );
  }

  // Handle generic errors
  if (error instanceof Error) {
    return NextResponse.json(
      {
        error: error.name,
        message: error.message,
        statusCode: 500,
      },
      { status: 500 }
    );
  }

  // Fallback for unknown errors
  return NextResponse.json(
    {
      error: 'Internal Server Error',
      message: defaultMessage,
      statusCode: 500,
    },
    { status: 500 }
  );
}

/**
 * Success response builder
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      ...(message && { message }),
      data,
    },
    { status }
  );
}

/**
 * Pagination response builder
 */
export function createPaginatedResponse<T>(
  data: T[],
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  },
  filters?: Record<string, unknown>
): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    pagination: {
      ...pagination,
      hasNextPage: pagination.page < pagination.totalPages,
      hasPrevPage: pagination.page > 1,
    },
    ...(filters && { filters }),
  });
}

/**
 * HTTP Status Code Constants
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;

/**
 * Error message templates
 */
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'You must be logged in to perform this action',
  FORBIDDEN: 'You do not have permission to perform this action',
  NOT_FOUND: 'Resource not found',
  ALREADY_EXISTS: 'Resource already exists',
  INVALID_DATA: 'Invalid data provided',
  SERVER_ERROR: 'An internal server error occurred',
  PAGE_NOT_FOUND: 'Page not found',
  SECTION_NOT_FOUND: 'Section not found',
  TEMPLATE_NOT_FOUND: 'Template not found',
  VERSION_NOT_FOUND: 'Version not found',
  INVALID_UUID: 'Invalid ID format',
  DUPLICATE_KEY: 'A resource with this key already exists',
  DUPLICATE_SLUG: 'A page with this slug already exists',
  INVALID_STATUS_TRANSITION: 'Invalid status transition',
  CANNOT_DELETE_PUBLISHED: 'Cannot delete a published page',
} as const;

/**
 * Validation helpers
 */
export function validateUuid(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Async error handler wrapper for API routes
 * Catches errors and returns proper error responses
 */
export function withErrorHandler<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error('API Error:', error);
      return createErrorResponse(error);
    }
  };
}
