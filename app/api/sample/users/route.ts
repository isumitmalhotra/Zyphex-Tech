/**
 * Sample API Route with Standardized Error Handling
 * 
 * Demonstrates the new error handling system implementation
 * This serves as a template for migrating existing API routes
 * 
 * @route POST /api/sample/users
 * @author Zyphex Tech Development Team
 * @version 1.0.0
 * @created 2025-10-11
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { 
  withErrorHandler,
  respondWithSuccess,
  respondWithError,
  tryCatch
} from '@/lib/api/error-handler';
import { 
  ApiErrorCode,
  HttpStatusCode 
} from '@/lib/api/error-types';
import { 
  validateRequiredFields,
  getPaginationParams,
  createPaginatedResponseV2
} from '@/lib/api-utils';

// Request validation schemas
const CreateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: z.string().email('Invalid email format'),
  role: z.enum(['user', 'admin'], { required_error: 'Role is required' }),
  phone: z.string().optional(),
  company: z.string().optional(),
});

const UpdateUserSchema = CreateUserSchema.partial();

/**
 * GET /api/sample/users - List users with pagination
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  // Extract pagination parameters
  const { searchParams } = new URL(request.url);
  const { skip, take, page, limit } = getPaginationParams(searchParams);
  
  // Optional: Check authentication
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return respondWithError(
      ApiErrorCode.AUTH_TOKEN_MISSING,
      'Authentication required to access user data',
      request
    );
  }

  // Simulate database operation with error handling
  const result = await tryCatch(
    async () => {
      // Simulate potential database error
      if (Math.random() < 0.1) { // 10% chance of error for demo
        throw new Error('Database connection timeout');
      }

      // Mock user data
      const users = Array.from({ length: 50 }, (_, i) => ({
        id: `user_${i + 1}`,
        name: `User ${i + 1}`,
        email: `user${i + 1}@example.com`,
        role: i % 5 === 0 ? 'admin' : 'user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      const paginatedUsers = users.slice(skip, skip + take);
      const total = users.length;

      return { users: paginatedUsers, total };
    },
    request,
    ApiErrorCode.DATABASE_QUERY_ERROR
  );

  if (!result.success) {
    return respondWithError(
      result.error.code,
      result.error.message,
      request,
      { details: result.error.details }
    );
  }

  // Return paginated response
  return createPaginatedResponseV2(
    result.data.users,
    result.data.total,
    page,
    limit,
    request
  );
});

/**
 * POST /api/sample/users - Create new user
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  // Parse request body
  let body;
  try {
    body = await request.json();
  } catch (_error) {
    return respondWithError(
      ApiErrorCode.VALIDATION_INVALID_FORMAT,
      'Invalid JSON in request body',
      request
    );
  }

  // Validate required fields (legacy approach)
  const validationErrors = validateRequiredFields(body, ['name', 'email', 'role']);
  if (validationErrors.length > 0) {
    return respondWithError(
      ApiErrorCode.VALIDATION_REQUIRED_FIELD,
      'Missing required fields',
      request,
      { validationErrors }
    );
  }

  // Validate with Zod schema
  const validation = CreateUserSchema.safeParse(body);
  if (!validation.success) {
    return respondWithError(
      ApiErrorCode.VALIDATION_SCHEMA_MISMATCH,
      'Request validation failed',
      request,
      { 
        validationErrors: validation.error.errors.map(err => ({
          field: err.path.join('.'),
          code: ApiErrorCode.VALIDATION_INVALID_FORMAT,
          message: err.message,
          value: body[err.path[0] as string],
        }))
      }
    );
  }

  // Check for duplicate email (simulate)
  const result = await tryCatch(
    async () => {
      // Simulate checking for existing user
      if (validation.data.email === 'existing@example.com') {
        throw new Error('User with this email already exists');
      }

      // Simulate database insert
      const newUser = {
        id: `user_${Date.now()}`,
        ...validation.data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return newUser;
    },
    request,
    ApiErrorCode.VALIDATION_DUPLICATE_VALUE
  );

  if (!result.success) {
    return respondWithError(
      result.error.code,
      result.error.message,
      request
    );
  }

  // Return created user
  return respondWithSuccess(
    result.data,
    request,
    {
      message: 'User created successfully',
      statusCode: HttpStatusCode.CREATED
    }
  );
});

/**
 * PUT /api/sample/users/[id] - Update user
 */
export const PUT = withErrorHandler(async (request: NextRequest) => {
  // Extract user ID from URL
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/');
  const userId = pathSegments[pathSegments.length - 1];

  if (!userId) {
    return respondWithError(
      ApiErrorCode.VALIDATION_REQUIRED_FIELD,
      'User ID is required',
      request
    );
  }

  // Parse request body
  let body;
  try {
    body = await request.json();
  } catch (_error) {
    return respondWithError(
      ApiErrorCode.VALIDATION_INVALID_FORMAT,
      'Invalid JSON in request body',
      request
    );
  }

  // Validate with Zod schema
  const validation = UpdateUserSchema.safeParse(body);
  if (!validation.success) {
    return respondWithError(
      ApiErrorCode.VALIDATION_SCHEMA_MISMATCH,
      'Request validation failed',
      request,
      { 
        validationErrors: validation.error.errors.map(err => ({
          field: err.path.join('.'),
          code: ApiErrorCode.VALIDATION_INVALID_FORMAT,
          message: err.message,
          value: body[err.path[0] as string],
        }))
      }
    );
  }

  // Update user
  const result = await tryCatch(
    async () => {
      // Simulate user not found
      if (userId === 'nonexistent') {
        throw new Error('User not found');
      }

      // Simulate successful update
      const updatedUser = {
        id: userId,
        name: 'Updated User',
        email: 'updated@example.com',
        role: 'user' as const,
        ...validation.data,
        updatedAt: new Date().toISOString(),
      };

      return updatedUser;
    },
    request,
    ApiErrorCode.RESOURCE_NOT_FOUND
  );

  if (!result.success) {
    return respondWithError(
      result.error.code,
      result.error.message,
      request
    );
  }

  return respondWithSuccess(
    result.data,
    request,
    { message: 'User updated successfully' }
  );
});

/**
 * DELETE /api/sample/users/[id] - Delete user
 */
export const DELETE = withErrorHandler(async (request: NextRequest) => {
  // Check authentication and permissions
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return respondWithError(
      ApiErrorCode.AUTH_TOKEN_MISSING,
      'Authentication required',
      request
    );
  }

  // Mock permission check
  const hasAdminPermission = true; // This would be extracted from JWT
  if (!hasAdminPermission) {
    return respondWithError(
      ApiErrorCode.AUTH_INSUFFICIENT_PERMISSIONS,
      'Admin permissions required to delete users',
      request
    );
  }

  // Extract user ID
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/');
  const userId = pathSegments[pathSegments.length - 1];

  if (!userId) {
    return respondWithError(
      ApiErrorCode.VALIDATION_REQUIRED_FIELD,
      'User ID is required',
      request
    );
  }

  // Delete user
  const result = await tryCatch(
    async () => {
      // Simulate user not found
      if (userId === 'nonexistent') {
        throw new Error('User not found');
      }

      // Simulate successful deletion
      return { deleted: true, userId };
    },
    request,
    ApiErrorCode.RESOURCE_NOT_FOUND
  );

  if (!result.success) {
    return respondWithError(
      result.error.code,
      result.error.message,
      request
    );
  }

  return respondWithSuccess(
    { message: 'User deleted successfully' },
    request,
    { statusCode: HttpStatusCode.NO_CONTENT }
  );
});

/**
 * OPTIONS - CORS handling
 */
export const OPTIONS = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
};