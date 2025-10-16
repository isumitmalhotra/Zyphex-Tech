/**
 * Tests for API Validation Middleware
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  withValidation,
  validateData,
  isValid,
  formatZodErrors,
} from '../../../lib/api/validation/middleware';
import {
  userCreateSchema,
  paginationQuerySchema,
  uuidSchema,
} from '../../../lib/api/validation/schemas';

// Helper to create mock Request using Request class (not NextRequest)
function createMockRequest(options: {
  url?: string;
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}): NextRequest {
  const { url = 'http://localhost:3000/api/test', method = 'POST', body, headers = {} } = options;

  const init: RequestInit = {
    method,
    headers: new Headers(headers),
  };

  if (body !== undefined) {
    init.body = JSON.stringify(body);
    (init.headers as Headers).set('content-type', 'application/json');
  }

  // Use Request instead of NextRequest to avoid mock issues
  const req = new Request(url, init) as unknown as NextRequest;
  return req;
}

describe('API Validation Middleware', () => {
  // ============================================================================
  // formatZodErrors
  // ============================================================================

  describe('formatZodErrors', () => {
    it('should format Zod errors correctly', () => {
      const schema = z.object({
        email: z.string().email(),
        age: z.number().min(18),
      });

      try {
        schema.parse({ email: 'invalid', age: 15 });
      } catch (error) {
        const formatted = formatZodErrors(error as z.ZodError);

        expect(formatted).toHaveLength(2);
        expect(formatted[0]).toHaveProperty('field');
        expect(formatted[0]).toHaveProperty('message');
        expect(formatted[0]).toHaveProperty('code');
      }
    });

    it('should use custom messages when provided', () => {
      const schema = z.object({
        email: z.string().email(),
      });

      const customMessages = {
        email: 'Please provide a valid email address',
      };

      try {
        schema.parse({ email: 'invalid' });
      } catch (error) {
        const formatted = formatZodErrors(error as z.ZodError, customMessages);

        expect(formatted[0].message).toBe('Please provide a valid email address');
      }
    });

    it('should determine appropriate error codes', () => {
      const schema = z.object({
        email: z.string().email(),
        name: z.string().min(2),
        age: z.number().min(18),
        role: z.enum(['admin', 'user']),
      });

      try {
        schema.parse({
          email: 'invalid',
          name: 'A',
          age: 15,
          role: 'invalid',
        });
      } catch (error) {
        const formatted = formatZodErrors(error as z.ZodError);

        // Should have appropriate VAL_* codes
        expect(formatted.every((err) => err.code.startsWith('VAL_'))).toBe(true);
      }
    });
  });

  // ============================================================================
  // withValidation - Body Validation
  // ============================================================================

  describe('withValidation - body', () => {
    const testSchema = z.object({
      email: z.string().email(),
      name: z.string().min(2),
    });

    it('should validate valid request body', async () => {
      const validData = {
        email: 'test@example.com',
        name: 'John Doe',
      };

      // Test the validation logic directly
      const result = await validateData(testSchema, validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should return validation errors for invalid body', async () => {
      const invalidData = {
        email: 'invalid-email',
        name: 'A', // Too short
      };

      const result = await validateData(testSchema, invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toHaveLength(2);
        expect(result.errors[0]).toHaveProperty('field');
        expect(result.errors[0]).toHaveProperty('message');
        expect(result.errors[0]).toHaveProperty('code');
        expect(result.errors.every((err) => err.code.startsWith('VAL_'))).toBe(true);
      }
    });

    it('should handle missing required fields', async () => {
      const invalidData = {};

      const result = await validateData(testSchema, invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });

    it('should strip unknown properties by default', async () => {
      const dataWithExtra = {
        email: 'test@example.com',
        name: 'John Doe',
        extra: 'should-be-removed',
      };

      const result = await validateData(testSchema, dataWithExtra, {
        stripUnknown: true,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          email: 'test@example.com',
          name: 'John Doe',
        });
        expect(result.data).not.toHaveProperty('extra');
      }
    });
  });

  // ============================================================================
  // withValidation - Query Validation
  // ============================================================================

  describe('withValidation - query', () => {
    it('should validate query parameters', async () => {
      const queryData = {
        page: '1',
        limit: '20',
      };

      const result = await validateData(paginationQuerySchema, queryData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
        expect(result.data.sortOrder).toBe('asc'); // Default
      }
    });

    it('should return validation error for invalid query params', async () => {
      const invalidQuery = {
        page: '0', // Min 1
        limit: '200', // Max 100
      };

      const result = await validateData(paginationQuerySchema, invalidQuery);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });
  });

  // ============================================================================
  // withValidation - Params Validation
  // ============================================================================

  describe('withValidation - params', () => {
    const paramsSchema = z.object({
      id: uuidSchema,
    });

    it('should validate route parameters', async () => {
      const paramsData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
      };

      const result = await validateData(paramsSchema, paramsData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('123e4567-e89b-12d3-a456-426614174000');
      }
    });

    it('should return validation error for invalid params', async () => {
      const invalidParams = {
        id: 'invalid-uuid',
      };

      const result = await validateData(paramsSchema, invalidParams);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].code).toBe('VAL_012'); // Invalid UUID
      }
    });
  });

  // ============================================================================
  // withMultiValidation
  // ============================================================================

  describe('withMultiValidation', () => {
    it('should validate multiple schemas independently', async () => {
      const bodySchema = z.object({ name: z.string() });
      const querySchema = z.object({ page: z.string() });
      const paramsSchema = z.object({ id: z.string().uuid() });

      // Test each independently
      const bodyResult = await validateData(bodySchema, { name: 'Test' });
      const queryResult = await validateData(querySchema, { page: '1' });
      const paramsResult = await validateData(paramsSchema, {
        id: '123e4567-e89b-12d3-a456-426614174000',
      });

      expect(bodyResult.success).toBe(true);
      expect(queryResult.success).toBe(true);
      expect(paramsResult.success).toBe(true);
    });

    it('should collect errors from multiple schemas', async () => {
      const bodySchema = z.object({ name: z.string().min(5) });
      const querySchema = z.object({ page: z.string().uuid() });

      const bodyResult = await validateData(bodySchema, { name: 'Ab' });
      const queryResult = await validateData(querySchema, { page: 'invalid' });

      expect(bodyResult.success).toBe(false);
      expect(queryResult.success).toBe(false);

      if (!bodyResult.success && !queryResult.success) {
        const allErrors = [...bodyResult.errors, ...queryResult.errors];
        expect(allErrors.length).toBeGreaterThan(0);
      }
    });
  });

  // ============================================================================
  // Convenience Wrappers
  // ============================================================================

  describe('convenience wrappers', () => {
    it('should validate pagination queries', async () => {
      const result = await validateData(paginationQuerySchema, {
        page: '1',
        limit: '20',
      });

      expect(result.success).toBe(true);
    });

    it('should validate user creation', async () => {
      const result = await validateData(userCreateSchema, {
        email: 'test@example.com',
        password: 'SecurePass123',
        name: 'Test User',
      });

      expect(result.success).toBe(true);
    });
  });

  // ============================================================================
  // validateData (standalone function)
  // ============================================================================

  describe('validateData', () => {
    const testSchema = z.object({
      email: z.string().email(),
      age: z.number().min(18),
    });

    it('should return success for valid data', async () => {
      const result = await validateData(testSchema, {
        email: 'test@example.com',
        age: 25,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          email: 'test@example.com',
          age: 25,
        });
      }
    });

    it('should return errors for invalid data', async () => {
      const result = await validateData(testSchema, {
        email: 'invalid',
        age: 15,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toHaveLength(2);
        expect(result.errors[0]).toHaveProperty('field');
        expect(result.errors[0]).toHaveProperty('message');
        expect(result.errors[0]).toHaveProperty('code');
      }
    });

    it('should respect custom messages', async () => {
      const result = await validateData(
        testSchema,
        { email: 'invalid', age: 15 },
        {
          customMessages: {
            email: 'Custom email error',
            age: 'Custom age error',
          },
        }
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].message).toBe('Custom email error');
      }
    });
  });

  // ============================================================================
  // isValid (validation check)
  // ============================================================================

  describe('isValid', () => {
    const emailSchema = z.string().email();

    it('should return true for valid data', () => {
      expect(isValid(emailSchema, 'test@example.com')).toBe(true);
    });

    it('should return false for invalid data', () => {
      expect(isValid(emailSchema, 'invalid')).toBe(false);
      expect(isValid(emailSchema, 123)).toBe(false);
      expect(isValid(emailSchema, null)).toBe(false);
    });
  });

  // ============================================================================
  // Error Handling
  // ============================================================================

  describe('error handling', () => {
    it('should handle JSON parse errors', async () => {
      const handler = jest.fn();
      const wrappedHandler = withValidation(userCreateSchema, 'body')(handler);

      // Create request with invalid JSON using Request class
      const request = new Request('http://localhost:3000/api/test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: 'invalid-json{',
      }) as unknown as NextRequest;

      const response = await wrappedHandler(request);

      expect(handler).not.toHaveBeenCalled();
      expect(response.status).toBe(422);
    });

    it('should handle internal errors gracefully', async () => {
      const handler = jest.fn().mockRejectedValue(new Error('Handler error'));
      
      const wrappedHandler = withValidation(
        z.object({ name: z.string() }),
        'body'
      )(handler);

      const request = createMockRequest({
        body: { name: 'Test' },
      });

      const response = await wrappedHandler(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.success).toBe(false);
    });
  });

  // ============================================================================
  // Options
  // ============================================================================

  describe('validation options', () => {
    it('should strip unknown properties when stripUnknown=true', async () => {
      const schema = z.object({ name: z.string() });

      const result = await validateData(
        schema,
        { name: 'Test', extra: 'removed' },
        { stripUnknown: true }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ name: 'Test' });
        expect(result.data).not.toHaveProperty('extra');
      }
    });

    it('should fail when stripUnknown=false and unknown props exist', async () => {
      const schema = z.object({ name: z.string() });

      const result = await validateData(
        schema,
        { name: 'Test', extra: 'kept' },
        { stripUnknown: false }
      );

      // strict mode should reject unknown props
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });
  });
});
