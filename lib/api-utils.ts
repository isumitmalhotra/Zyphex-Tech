import { NextRequest, NextResponse } from 'next/server'
import { 
  handleApiError as handleStandardizedError,
  createSuccessResponse,
  extractRequestContext,
  generateRequestId,
  respondWithSuccess,
  respondWithError
} from './api/error-handler'
import { 
  ApiErrorCode,
  HttpStatusCode,
  type ApiSuccessResponse, 
  type ValidationError 
} from './api/error-types'

export interface PaginationParams {
  page?: number
  limit?: number
}

export interface PaginationResult {
  total: number
  page: number
  limit: number
  totalPages: number
}

export function getPaginationParams(searchParams: URLSearchParams): { skip: number; take: number; page: number; limit: number } {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')))
  const skip = (page - 1) * limit
  
  return { skip, take: limit, page, limit }
}

export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
) {
  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  }
}

/**
 * Enhanced API Error Handler (Legacy Support)
 * @deprecated Use handleStandardizedError from api/error-handler.ts instead
 */
export function handleApiError(error: unknown, context: string = 'API Error') {
  console.error(`${context}:`, error)
  
  // Type guard for Prisma errors
  const prismaError = error as { code?: string }
  
  if (prismaError.code === 'P2002') {
    return NextResponse.json(
      { 
        error: true,
        code: 'VALIDATION_DUPLICATE_VALUE',
        message: 'A record with this information already exists',
        statusCode: 409,
        timestamp: new Date().toISOString(),
        requestId: generateRequestId()
      },
      { status: 409 }
    )
  }
  
  if (prismaError.code === 'P2025') {
    return NextResponse.json(
      { 
        error: true,
        code: 'RESOURCE_NOT_FOUND',
        message: 'Record not found',
        statusCode: 404,
        timestamp: new Date().toISOString(),
        requestId: generateRequestId()
      },
      { status: 404 }
    )
  }
  
  return NextResponse.json(
    { 
      error: true,
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
      statusCode: 500,
      timestamp: new Date().toISOString(),
      requestId: generateRequestId()
    },
    { status: 500 }
  )
}

/**
 * Enhanced Error Handler using Standardized System
 */
export async function handleApiErrorV2(
  error: unknown, 
  request: NextRequest, 
  _context?: string
): Promise<NextResponse> {
  return handleStandardizedError(error, request);
}

/**
 * Enhanced Field Validation with Standardized Errors
 */
export function validateRequiredFields(
  data: Record<string, unknown>, 
  requiredFields: string[]
): ValidationError[] {
  const errors: ValidationError[] = [];
  
  for (const field of requiredFields) {
    if (!data[field] || data[field] === '' || data[field] === null || data[field] === undefined) {
      errors.push({
        field,
        code: ApiErrorCode.VALIDATION_REQUIRED_FIELD,
        message: `${field} is required`,
        value: data[field],
      });
    }
  }
  
  return errors;
}

/**
 * Legacy validation function for backward compatibility
 * @deprecated Use validateRequiredFields instead
 */
export function validateRequiredFieldsLegacy(
  data: Record<string, unknown>, 
  requiredFields: string[]
): string | null {
  for (const field of requiredFields) {
    if (!data[field]) {
      return `${field} is required`
    }
  }
  return null
}

/**
 * Enhanced API Response Helpers
 */
export function createSuccessResponseV2<T>(
  data: T,
  request: NextRequest,
  options?: {
    message?: string;
    statusCode?: HttpStatusCode;
    pagination?: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  }
): NextResponse<ApiSuccessResponse<T>> {
  const context = extractRequestContext(request);
  const successResponse = createSuccessResponse(data, context, {
    message: options?.message,
    statusCode: options?.statusCode,
    meta: options?.pagination ? { pagination: options.pagination } : undefined
  });
  
  return NextResponse.json(successResponse, { 
    status: successResponse.statusCode 
  });
}

/**
 * Enhanced Pagination Response
 */
export function createPaginatedResponseV2<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
  request: NextRequest
): NextResponse<ApiSuccessResponse<T[]>> {
  const totalPages = Math.ceil(total / limit);
  
  return createSuccessResponseV2(data, request, {
    statusCode: HttpStatusCode.OK,
    pagination: {
      total,
      page,
      limit,
      pages: totalPages
    }
  });
}

/**
 * Request ID Middleware Helper
 */
export function addRequestId(response: NextResponse, requestId?: string): NextResponse {
  const id = requestId || generateRequestId();
  response.headers.set('X-Request-ID', id);
  return response;
}

/**
 * Timestamp Helper
 */
export function addTimestamp(): string {
  return new Date().toISOString();
}