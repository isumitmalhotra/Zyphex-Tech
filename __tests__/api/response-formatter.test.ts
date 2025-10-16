/**
 * Response Formatter Test Suite
 * Tests for standardized API response formatting utilities
 */

import {
  generateRequestId,
  createMetadata,
  createSuccessResponse,
  createErrorResponse,
  createPaginatedResponse,
  createValidationErrorResponse,
  createNotFoundResponse,
  createUnauthorizedResponse,
  createForbiddenResponse,
  createRateLimitResponse,
  createInternalErrorResponse,
  createConflictResponse,
  extractRequestContext,
  formatAsNextResponse,
  calculateOffset,
  validatePaginationParams,
  createResponseFormatter,
} from '@/lib/api/response-formatter';
import { API_ERROR_CODES } from '@/lib/api/error-codes';

describe('Response Formatter', () => {
  describe('generateRequestId', () => {
    it('should generate a unique request ID with req_ prefix', () => {
      const id1 = generateRequestId();
      const id2 = generateRequestId();
      
      expect(id1).toMatch(/^req_/);
      expect(id2).toMatch(/^req_/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('createMetadata', () => {
    it('should create metadata with requestId and timestamp', () => {
      const requestId = 'req_test123';
      const metadata = createMetadata(requestId);
      
      expect(metadata.requestId).toBe(requestId);
      expect(metadata.timestamp).toBeDefined();
      expect(metadata.version).toBe('v1');
      expect(metadata.pagination).toBeUndefined();
    });

    it('should include pagination metadata when provided', () => {
      const requestId = 'req_test123';
      const pagination = {
        page: 1,
        limit: 20,
        total: 100,
        totalPages: 5,
        hasNextPage: true,
        hasPreviousPage: false,
      };
      
      const metadata = createMetadata(requestId, pagination);
      
      expect(metadata.pagination).toEqual(pagination);
    });
  });

  describe('createSuccessResponse', () => {
    it('should create a success response with data', () => {
      const data = { id: 1, name: 'Test' };
      const requestId = 'req_test123';
      
      const response = createSuccessResponse(data, requestId);
      
      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
      expect(response.meta.requestId).toBe(requestId);
      expect(response.error).toBeUndefined();
    });
  });

  describe('createErrorResponse', () => {
    it('should create an error response', () => {
      const requestId = 'req_test123';
      const error = {
        code: API_ERROR_CODES.RESOURCE_NOT_FOUND,
        message: 'Resource not found',
        timestamp: new Date().toISOString(),
        requestId,
        path: '/api/test',
      };
      
      const response = createErrorResponse(error, requestId);
      
      expect(response.success).toBe(false);
      expect(response.error).toEqual(error);
      expect(response.meta.requestId).toBe(requestId);
      expect(response.data).toBeUndefined();
    });
  });

  describe('createPaginatedResponse', () => {
    it('should create a paginated response with correct metadata', () => {
      const data = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const requestId = 'req_test123';
      const page = 2;
      const limit = 3;
      const total = 10;
      
      const response = createPaginatedResponse(data, page, limit, total, requestId);
      
      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
      expect(response.meta.pagination).toEqual({
        page: 2,
        limit: 3,
        total: 10,
        totalPages: 4,
        hasNextPage: true,
        hasPreviousPage: true,
      });
    });

    it('should handle first page correctly', () => {
      const data = [{ id: 1 }];
      const requestId = 'req_test123';
      
      const response = createPaginatedResponse(data, 1, 10, 20, requestId);
      
      expect(response.meta.pagination?.hasPreviousPage).toBe(false);
      expect(response.meta.pagination?.hasNextPage).toBe(true);
    });

    it('should handle last page correctly', () => {
      const data = [{ id: 1 }];
      const requestId = 'req_test123';
      
      const response = createPaginatedResponse(data, 2, 10, 11, requestId);
      
      expect(response.meta.pagination?.hasPreviousPage).toBe(true);
      expect(response.meta.pagination?.hasNextPage).toBe(false);
    });
  });

  describe('createValidationErrorResponse', () => {
    it('should create a validation error response', () => {
      const requestId = 'req_test123';
      const path = '/api/test';
      const validationErrors = [
        {
          field: 'email',
          message: 'Invalid email format',
          code: 'VAL_007',
        },
      ];
      
      const response = createValidationErrorResponse(validationErrors, requestId, path);
      
      expect(response.success).toBe(false);
      expect(response.error?.code).toBe(API_ERROR_CODES.VALIDATION_FAILED);
      expect(response.error?.validationErrors).toEqual(validationErrors);
      expect(response.error?.path).toBe(path);
    });
  });

  describe('createNotFoundResponse', () => {
    it('should create a not found response', () => {
      const requestId = 'req_test123';
      const path = '/api/users/123';
      
      const response = createNotFoundResponse('User', '123', requestId, path);
      
      expect(response.success).toBe(false);
      expect(response.error?.code).toBe(API_ERROR_CODES.RESOURCE_NOT_FOUND);
      expect(response.error?.message).toBeDefined();
      expect(response.error?.path).toBe(path);
    });
  });

  describe('createUnauthorizedResponse', () => {
    it('should create an unauthorized response', () => {
      const requestId = 'req_test123';
      const path = '/api/protected';
      
      const response = createUnauthorizedResponse(requestId, path);
      
      expect(response.success).toBe(false);
      expect(response.error?.code).toBe(API_ERROR_CODES.TOKEN_MISSING);
    });
  });

  describe('createForbiddenResponse', () => {
    it('should create a forbidden response', () => {
      const requestId = 'req_test123';
      const path = '/api/admin';
      
      const response = createForbiddenResponse(requestId, path);
      
      expect(response.success).toBe(false);
      expect(response.error?.code).toBe(API_ERROR_CODES.INSUFFICIENT_PERMISSIONS);
    });
  });

  describe('createRateLimitResponse', () => {
    it('should create a rate limit response', () => {
      const requestId = 'req_test123';
      const path = '/api/test';
      const retryAfter = 60;
      
      const response = createRateLimitResponse(requestId, path, retryAfter);
      
      expect(response.success).toBe(false);
      expect(response.error?.code).toBe(API_ERROR_CODES.RATE_LIMIT_EXCEEDED);
      expect(response.error?.details).toBeDefined();
    });
  });

  describe('createInternalErrorResponse', () => {
    it('should create an internal error response', () => {
      const requestId = 'req_test123';
      const path = '/api/test';
      const error = new Error('Test error');
      
      const response = createInternalErrorResponse(requestId, path, error);
      
      expect(response.success).toBe(false);
      expect(response.error?.code).toBe(API_ERROR_CODES.INTERNAL_SERVER_ERROR);
      expect(response.error).toBeDefined();
    });
  });

  describe('createConflictResponse', () => {
    it('should create a conflict response', () => {
      const requestId = 'req_test123';
      const path = '/api/users';
      
      const response = createConflictResponse('User', requestId, path, 'Email already exists');
      
      expect(response.success).toBe(false);
      expect(response.error?.code).toBe(API_ERROR_CODES.RESOURCE_CONFLICT);
      expect(response.error?.message).toBeDefined();
      expect(response.error?.details).toBeDefined();
    });
  });

  describe('extractRequestContext', () => {
    it('should extract context from Request object', () => {
      const request = new Request('http://localhost:3000/api/test?param=value', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
      });
      
      const context = extractRequestContext(request);
      
      expect(context.requestId).toMatch(/^req_/);
      expect(context.path).toBe('/api/test');
      expect(context.method).toBe('POST');
      expect(context.timestamp).toBeDefined();
    });
  });

  describe('formatAsNextResponse', () => {
    it('should convert ApiResponse to Next.js Response', async () => {
      const apiResponse = createSuccessResponse({ id: 1 }, 'req_test123');
      const response = formatAsNextResponse(apiResponse, 200);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('x-request-id')).toBe('req_test123');
      expect(response.headers.get('x-api-version')).toBe('v1');
      
      const json = await response.json();
      expect(json).toEqual(apiResponse);
    });
  });

  describe('calculateOffset', () => {
    it('should calculate correct offset for pagination', () => {
      expect(calculateOffset(1, 10)).toBe(0);
      expect(calculateOffset(2, 10)).toBe(10);
      expect(calculateOffset(3, 20)).toBe(40);
      expect(calculateOffset(5, 25)).toBe(100);
    });
  });

  describe('validatePaginationParams', () => {
    it('should use default values when no params provided', () => {
      const { page, limit } = validatePaginationParams();
      
      expect(page).toBe(1);
      expect(limit).toBe(20);
    });

    it('should enforce minimum page value', () => {
      const { page } = validatePaginationParams(0, 10);
      expect(page).toBe(1);
      
      const { page: page2 } = validatePaginationParams(-5, 10);
      expect(page2).toBe(1);
    });

    it('should enforce minimum limit value', () => {
      // 0 is falsy, so it uses default (20)
      const { limit } = validatePaginationParams(1, 0);
      expect(limit).toBe(20); 
      
      // Negative values are normalized to 1 by Math.max(1, -10)
      const { limit: limit2 } = validatePaginationParams(1, -10);
      expect(limit2).toBe(1);
      
      // Very small positive values are normalized to 1
      const { limit: limit3 } = validatePaginationParams(1, 0.5);
      expect(limit3).toBe(1);
    });

    it('should enforce maximum limit value', () => {
      const { limit } = validatePaginationParams(1, 200);
      expect(limit).toBe(100);
    });
  });

  describe('ResponseFormatter class', () => {
    let formatter: ReturnType<typeof createResponseFormatter>;
    let mockRequest: Request;

    beforeEach(() => {
      mockRequest = new Request('http://localhost:3000/api/test', {
        method: 'GET',
      });
      formatter = createResponseFormatter(mockRequest);
    });

    describe('success', () => {
      it('should create success Response with data', async () => {
        const data = { id: 1, name: 'Test' };
        const response = formatter.success(data);
        
        expect(response.status).toBe(200);
        
        const json = await response.json();
        expect(json.success).toBe(true);
        expect(json.data).toEqual(data);
      });

      it('should support custom status code', async () => {
        const response = formatter.success({ id: 1 }, 201);
        expect(response.status).toBe(201);
      });
    });

    describe('paginated', () => {
      it('should create paginated Response', async () => {
        const data = [{ id: 1 }, { id: 2 }];
        const response = formatter.paginated(data, 1, 10, 50);
        
        expect(response.status).toBe(200);
        
        const json = await response.json();
        expect(json.success).toBe(true);
        expect(json.data).toEqual(data);
        expect(json.meta.pagination).toBeDefined();
        expect(json.meta.pagination?.total).toBe(50);
      });
    });

    describe('error', () => {
      it('should create error Response', async () => {
        const error = {
          code: API_ERROR_CODES.RESOURCE_NOT_FOUND,
          message: 'Not found',
          timestamp: new Date().toISOString(),
          path: '/api/test',
        };
        
        const response = formatter.error(error, 404);
        
        expect(response.status).toBe(404);
        
        const json = await response.json();
        expect(json.success).toBe(false);
        expect(json.error?.code).toBe(error.code);
        expect(json.error?.message).toBe(error.message);
        expect(json.error?.path).toBe(error.path);
      });
    });

    describe('notFound', () => {
      it('should create 404 Response', async () => {
        const response = formatter.notFound('User', '123');
        
        expect(response.status).toBe(404);
        
        const json = await response.json();
        expect(json.success).toBe(false);
        expect(json.error?.code).toBe(API_ERROR_CODES.RESOURCE_NOT_FOUND);
      });
    });

    describe('unauthorized', () => {
      it('should create 401 Response', async () => {
        const response = formatter.unauthorized();
        
        expect(response.status).toBe(401);
        
        const json = await response.json();
        expect(json.success).toBe(false);
        expect(json.error?.code).toBe(API_ERROR_CODES.TOKEN_MISSING);
      });
    });

    describe('forbidden', () => {
      it('should create 403 Response', async () => {
        const response = formatter.forbidden();
        
        expect(response.status).toBe(403);
        
        const json = await response.json();
        expect(json.success).toBe(false);
        expect(json.error?.code).toBe(API_ERROR_CODES.INSUFFICIENT_PERMISSIONS);
      });
    });

    describe('validationError', () => {
      it('should create 422 Response with validation errors', async () => {
        const validationErrors = [
          {
            field: 'email',
            message: 'Invalid email',
            code: 'VAL_007',
          },
        ];
        
        const response = formatter.validationError(validationErrors);
        
        expect(response.status).toBe(422);
        
        const json = await response.json();
        expect(json.success).toBe(false);
        expect(json.error?.validationErrors).toEqual(validationErrors);
      });
    });

    describe('rateLimit', () => {
      it('should create 429 Response', async () => {
        const response = formatter.rateLimit(60);
        
        expect(response.status).toBe(429);
        
        const json = await response.json();
        expect(json.success).toBe(false);
        expect(json.error?.code).toBe(API_ERROR_CODES.RATE_LIMIT_EXCEEDED);
      });
    });

    describe('internalError', () => {
      it('should create 500 Response', async () => {
        const error = new Error('Test error');
        const response = formatter.internalError(error);
        
        expect(response.status).toBe(500);
        
        const json = await response.json();
        expect(json.success).toBe(false);
        expect(json.error?.code).toBe(API_ERROR_CODES.INTERNAL_SERVER_ERROR);
      });
    });

    describe('conflict', () => {
      it('should create 409 Response', async () => {
        const response = formatter.conflict('User');
        
        expect(response.status).toBe(409);
        
        const json = await response.json();
        expect(json.success).toBe(false);
        expect(json.error?.code).toBe(API_ERROR_CODES.RESOURCE_CONFLICT);
      });
    });

    describe('badRequest', () => {
      it('should create 400 Response', async () => {
        const response = formatter.badRequest('Invalid parameters');
        
        expect(response.status).toBe(400);
        
        const json = await response.json();
        expect(json.success).toBe(false);
        expect(json.error?.code).toBe(API_ERROR_CODES.VALIDATION_FAILED);
      });
    });

    describe('methodNotAllowed', () => {
      it('should create 405 Response', async () => {
        const response = formatter.methodNotAllowed('POST');
        
        expect(response.status).toBe(405);
        
        const json = await response.json();
        expect(json.success).toBe(false);
        expect(json.error?.code).toBe(API_ERROR_CODES.METHOD_NOT_ALLOWED);
      });
    });
  });
});
