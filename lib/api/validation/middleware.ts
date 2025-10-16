/**
 * API Validation Middleware
 * 
 * Type-safe request validation using Zod schemas.
 * Automatically formats validation errors using Phase 1 response formatters.
 * 
 * @module lib/api/validation/middleware
 */

import { NextRequest, NextResponse } from 'next/server';
import { z, ZodError, ZodSchema } from 'zod';
import { createResponseFormatter } from '../response-formatter';
import type { ValidationError } from '../types';

// ============================================================================
// Types
// ============================================================================

/**
 * Validation target - where to validate data from
 */
export type ValidationTarget = 'body' | 'query' | 'params' | 'headers';

/**
 * Validation options
 */
export interface ValidationOptions {
  /**
   * Whether to strip unknown properties from the validated data
   * @default true
   */
  stripUnknown?: boolean;

  /**
   * Custom error messages for specific fields
   */
  customMessages?: Record<string, string>;

  /**
   * Whether to abort validation on first error
   * @default false (collect all errors)
   */
  abortEarly?: boolean;
}

/**
 * Validated request with typed data
 */
export interface ValidatedRequest<T = unknown> extends NextRequest {
  validatedData: T;
}

/**
 * Route handler with validated data
 */
export type ValidatedRouteHandler<T = unknown> = (
  request: ValidatedRequest<T>,
  context?: { params: Record<string, string> }
) => Promise<NextResponse> | NextResponse;

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Convert Zod validation errors to our ValidationError format
 */
export function formatZodErrors(
  error: ZodError,
  customMessages?: Record<string, string>
): ValidationError[] {
  return error.errors.map((err) => {
    const field = err.path.join('.');
    const customMessage = customMessages?.[field];

    return {
      field,
      message: customMessage || err.message,
      code: determineValidationErrorCode(err),
      value: err.path.length > 0 ? undefined : err.message, // Don't expose sensitive values
    };
  });
}

/**
 * Determine appropriate VAL_* error code based on Zod error type
 */
function determineValidationErrorCode(error: z.ZodIssue): string {
  switch (error.code) {
    case 'invalid_type':
      return 'VAL_003'; // Invalid type
    case 'invalid_string':
      if (error.validation === 'email') {
        return 'VAL_007'; // Invalid email
      }
      if (error.validation === 'url') {
        return 'VAL_008'; // Invalid URL
      }
      if (error.validation === 'uuid') {
        return 'VAL_012'; // Invalid UUID
      }
      return 'VAL_003'; // Invalid format
    case 'too_small':
      if (error.type === 'string') {
        return error.minimum === 1
          ? 'VAL_002' // Required field
          : 'VAL_004'; // Min length
      }
      return 'VAL_010'; // Min value
    case 'too_big':
      if (error.type === 'string') {
        return 'VAL_005'; // Max length
      }
      return 'VAL_011'; // Max value
    case 'invalid_enum_value':
      return 'VAL_013'; // Invalid enum
    case 'invalid_date':
      return 'VAL_009'; // Invalid date
    case 'custom':
      return 'VAL_001'; // General validation error
    default:
      return 'VAL_001'; // General validation error
  }
}

/**
 * Extract data from request based on target
 */
async function extractRequestData(
  request: NextRequest,
  target: ValidationTarget,
  context?: { params: Record<string, string> }
): Promise<unknown> {
  switch (target) {
    case 'body':
      try {
        return await request.json();
      } catch {
        return null; // Will fail validation if required
      }

    case 'query': {
      const searchParams = new URL(request.url).searchParams;
      const query: Record<string, string> = {};
      searchParams.forEach((value, key) => {
        query[key] = value;
      });
      return query;
    }

    case 'params':
      return context?.params || {};

    case 'headers': {
      const headers: Record<string, string> = {};
      request.headers.forEach((value, key) => {
        headers[key] = value;
      });
      return headers;
    }

    default:
      throw new Error(`Invalid validation target: ${target}`);
  }
}

// ============================================================================
// Validation Middleware
// ============================================================================

/**
 * Create a validation middleware that validates request data against a Zod schema
 * 
 * @param schema - Zod schema to validate against
 * @param target - Where to extract data from (body, query, params, headers)
 * @param options - Validation options
 * @returns Middleware function
 * 
 * @example
 * ```typescript
 * import { withValidation } from '@/lib/api/validation/middleware';
 * import { userCreateSchema } from '@/lib/api/validation/schemas';
 * 
 * export const POST = withValidation(
 *   userCreateSchema,
 *   'body'
 * )(async (request) => {
 *   const userData = request.validatedData;
 *   // userData is fully typed and validated
 *   return formatter.success(userData);
 * });
 * ```
 */
export function withValidation<T extends ZodSchema>(
  schema: T,
  target: ValidationTarget = 'body',
  options: ValidationOptions = {}
) {
  return function (handler: ValidatedRouteHandler<z.infer<T>>) {
    return async function (
      request: NextRequest,
      context?: { params: Record<string, string> }
    ): Promise<NextResponse> {
      const formatter = createResponseFormatter(request);

      try {
        // Extract data from request
        const data = await extractRequestData(request, target, context);

        // Parse options
        const { stripUnknown = true, customMessages, abortEarly = false } = options;

        // Validate with Zod
        const parseOptions = {
          path: [target],
        };

        let validatedData: z.infer<T>;

        try {
          if (stripUnknown) {
            validatedData = schema.parse(data, parseOptions);
          } else {
            validatedData = schema.strict().parse(data, parseOptions);
          }
        } catch (error) {
          if (error instanceof ZodError) {
            const validationErrors = formatZodErrors(error, customMessages);

            // If abortEarly, only return first error
            const errors = abortEarly ? [validationErrors[0]] : validationErrors;

            return formatter.validationError(errors);
          }
          throw error; // Re-throw non-Zod errors
        }

        // Attach validated data to request
        (request as ValidatedRequest<z.infer<T>>).validatedData = validatedData;

        // Call the actual handler
        return await handler(request as ValidatedRequest<z.infer<T>>, context);
      } catch (error) {
        console.error('Validation middleware error:', error);
        return formatter.internalError(error as Error);
      }
    };
  };
}

/**
 * Validate multiple targets at once
 * 
 * @example
 * ```typescript
 * export const POST = withMultiValidation({
 *   body: userCreateSchema,
 *   query: paginationQuerySchema,
 *   params: userIdParamSchema,
 * })(async (request) => {
 *   const { body, query, params } = request.validatedData;
 *   // All data is typed and validated
 * });
 * ```
 */
export function withMultiValidation<
  TBody extends ZodSchema = ZodSchema,
  TQuery extends ZodSchema = ZodSchema,
  TParams extends ZodSchema = ZodSchema,
  THeaders extends ZodSchema = ZodSchema
>(schemas: {
  body?: TBody;
  query?: TQuery;
  params?: TParams;
  headers?: THeaders;
}) {
  return function (
    handler: ValidatedRouteHandler<{
      body?: z.infer<TBody>;
      query?: z.infer<TQuery>;
      params?: z.infer<TParams>;
      headers?: z.infer<THeaders>;
    }>
  ) {
    return async function (
      request: NextRequest,
      context?: { params: Record<string, string> }
    ): Promise<NextResponse> {
      const formatter = createResponseFormatter(request);

      try {
        const validatedData: Record<string, unknown> = {};
        const allErrors: ValidationError[] = [];

        // Validate each target
        for (const [target, schema] of Object.entries(schemas)) {
          if (!schema) continue;

          try {
            const data = await extractRequestData(
              request,
              target as ValidationTarget,
              context
            );
            validatedData[target] = schema.parse(data);
          } catch (error) {
            if (error instanceof ZodError) {
              allErrors.push(...formatZodErrors(error));
            } else {
              throw error;
            }
          }
        }

        // If any validation errors, return them all
        if (allErrors.length > 0) {
          return formatter.validationError(allErrors);
        }

        // Attach validated data to request
        (request as ValidatedRequest).validatedData = validatedData;

        // Call the actual handler
        return await handler(request as ValidatedRequest, context);
      } catch (error) {
        console.error('Multi-validation middleware error:', error);
        return formatter.internalError(error as Error);
      }
    };
  };
}

/**
 * Validate query parameters (convenience wrapper)
 */
export function withQueryValidation<T extends ZodSchema>(schema: T) {
  return withValidation(schema, 'query');
}

/**
 * Validate route parameters (convenience wrapper)
 */
export function withParamsValidation<T extends ZodSchema>(schema: T) {
  return withValidation(schema, 'params');
}

/**
 * Validate request body (convenience wrapper)
 */
export function withBodyValidation<T extends ZodSchema>(schema: T) {
  return withValidation(schema, 'body');
}

/**
 * Standalone validation function (for use outside middleware)
 * 
 * @example
 * ```typescript
 * const result = await validateData(userCreateSchema, userData);
 * if (!result.success) {
 *   return formatter.validationError(result.errors);
 * }
 * const validUser = result.data;
 * ```
 */
export async function validateData<T extends ZodSchema>(
  schema: T,
  data: unknown,
  options: ValidationOptions = {}
): Promise<
  | { success: true; data: z.infer<T> }
  | { success: false; errors: ValidationError[] }
> {
  const { stripUnknown = true, customMessages } = options;

  try {
    const validatedData = stripUnknown ? schema.parse(data) : schema.strict().parse(data);

    return {
      success: true,
      data: validatedData,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        errors: formatZodErrors(error, customMessages),
      };
    }
    throw error; // Re-throw non-Zod errors
  }
}

/**
 * Check if data is valid without throwing
 * 
 * @example
 * ```typescript
 * if (!isValid(emailSchema, userEmail)) {
 *   return formatter.validationError([{
 *     field: 'email',
 *     message: 'Invalid email',
 *     code: 'VAL_007'
 *   }]);
 * }
 * ```
 */
export function isValid<T extends ZodSchema>(schema: T, data: unknown): boolean {
  const result = schema.safeParse(data);
  return result.success;
}
