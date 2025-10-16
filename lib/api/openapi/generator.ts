/**
 * OpenAPI 3.0 Specification Generator
 * 
 * Generates complete OpenAPI specs from Zod schemas and route metadata.
 */

import { zodSchemasToComponents, createSchemaRef } from './zod-to-openapi';
import * as schemas from '../validation/schemas';
import { DEFAULT_RATE_LIMITS } from '../rate-limit/config';

/**
 * OpenAPI 3.0 Specification
 */
export interface OpenAPISpec {
  openapi: string;
  info: OpenAPIInfo;
  servers?: OpenAPIServer[];
  paths: Record<string, OpenAPIPath>;
  components?: OpenAPIComponents;
  security?: OpenAPISecurity[];
  tags?: OpenAPITag[];
}

export interface OpenAPIInfo {
  title: string;
  version: string;
  description?: string;
  termsOfService?: string;
  contact?: {
    name?: string;
    url?: string;
    email?: string;
  };
  license?: {
    name: string;
    url?: string;
  };
}

export interface OpenAPIServer {
  url: string;
  description?: string;
  variables?: Record<string, { default: string; description?: string }>;
}

export interface OpenAPIPath {
  get?: OpenAPIOperation;
  post?: OpenAPIOperation;
  put?: OpenAPIOperation;
  patch?: OpenAPIOperation;
  delete?: OpenAPIOperation;
}

export interface OpenAPIOperation {
  summary?: string;
  description?: string;
  operationId?: string;
  tags?: string[];
  parameters?: OpenAPIParameter[];
  requestBody?: OpenAPIRequestBody;
  responses: Record<string, OpenAPIResponse>;
  security?: OpenAPISecurity[];
  deprecated?: boolean;
  'x-rate-limit'?: {
    max: number;
    windowMs: number;
    description: string;
  };
}

export interface OpenAPIParameter {
  name: string;
  in: 'query' | 'header' | 'path' | 'cookie';
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  schema: unknown;
  example?: unknown;
}

export interface OpenAPIRequestBody {
  description?: string;
  required?: boolean;
  content: Record<string, {
    schema: unknown;
    example?: unknown;
    examples?: Record<string, { value: unknown; summary?: string }>;
  }>;
}

export interface OpenAPIResponse {
  description?: string;
  content?: Record<string, {
    schema: unknown;
    example?: unknown;
    examples?: Record<string, { value: unknown; summary?: string }>;
  }>;
  headers?: Record<string, {
    description?: string;
    schema: unknown;
  }>;
  $ref?: string;
}

export interface OpenAPIComponents {
  schemas?: Record<string, unknown>;
  responses?: Record<string, OpenAPIResponse>;
  parameters?: Record<string, OpenAPIParameter>;
  requestBodies?: Record<string, OpenAPIRequestBody>;
  headers?: Record<string, unknown>;
  securitySchemes?: Record<string, OpenAPISecurityScheme>;
}

export interface OpenAPISecurityScheme {
  type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';
  description?: string;
  name?: string;
  in?: 'query' | 'header' | 'cookie';
  scheme?: string;
  bearerFormat?: string;
  flows?: unknown;
  openIdConnectUrl?: string;
}

export type OpenAPISecurity = Record<string, string[]>;

export interface OpenAPITag {
  name: string;
  description?: string;
  externalDocs?: {
    description?: string;
    url: string;
  };
}

/**
 * Generator options
 */
export interface OpenAPIGeneratorOptions {
  title: string;
  version: string;
  description?: string;
  servers?: OpenAPIServer[];
  securitySchemes?: Record<string, OpenAPISecurityScheme>;
  tags?: OpenAPITag[];
  contact?: OpenAPIInfo['contact'];
  license?: OpenAPIInfo['license'];
}

/**
 * Generate complete OpenAPI specification
 */
export function generateOpenAPISpec(options: OpenAPIGeneratorOptions): OpenAPISpec {
  const {
    title,
    version,
    description,
    servers = [
      { url: 'http://localhost:3000/api', description: 'Development' },
      { url: 'https://api.zyphextech.com/api', description: 'Production' },
    ],
    securitySchemes = {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT authentication token',
      },
    },
    tags = [
      { name: 'Authentication', description: 'Authentication and authorization endpoints' },
      { name: 'Users', description: 'User management endpoints' },
      { name: 'Teams', description: 'Team management endpoints' },
      { name: 'Projects', description: 'Project management endpoints' },
      { name: 'Messages', description: 'Messaging endpoints' },
      { name: 'Notifications', description: 'Notification endpoints' },
    ],
    contact,
    license,
  } = options;

  // Generate component schemas from Zod schemas
  const componentSchemas = zodSchemasToComponents({
    // User schemas
    UserCreate: schemas.userCreateSchema,
    UserUpdate: schemas.userUpdateSchema,
    UserProfileUpdate: schemas.userProfileUpdateSchema,
    
    // Team schemas
    TeamCreate: schemas.teamCreateSchema,
    TeamUpdate: schemas.teamUpdateSchema,
    TeamMemberAdd: schemas.teamMemberAddSchema,
    
    // Project schemas
    ProjectCreate: schemas.projectCreateSchema,
    ProjectUpdate: schemas.projectUpdateSchema,
    
    // Auth schemas
    Login: schemas.loginSchema,
    Register: schemas.registerSchema,
    EmailVerification: schemas.emailVerificationSchema,
    
    // Message schemas
    MessageCreate: schemas.messageCreateSchema,
    
    // Common schemas
    PaginationQuery: schemas.paginationQuerySchema,
    
    // File upload schemas
    FileUpload: schemas.fileUploadSchema,
    
    // Search schema
    GlobalSearch: schemas.globalSearchSchema,
  });

  // Add common response schemas
  const responseSchemas = {
    Error: {
      type: 'object',
      required: ['success', 'error'],
      properties: {
        success: { type: 'boolean', enum: [false] },
        error: {
          type: 'object',
          required: ['code', 'message', 'statusCode'],
          properties: {
            code: { type: 'string', description: 'Error code (e.g., VAL_001, RATE_001)' },
            message: { type: 'string', description: 'Human-readable error message' },
            statusCode: { type: 'integer', description: 'HTTP status code' },
            details: {
              type: 'array',
              description: 'Detailed error information (for validation errors)',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' },
                  code: { type: 'string' },
                },
              },
            },
          },
        },
        meta: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', format: 'date-time' },
            path: { type: 'string' },
            requestId: { type: 'string' },
            retryAfter: { type: 'integer', description: 'Seconds until retry (for rate limit errors)' },
          },
        },
      },
    },
    Success: {
      type: 'object',
      required: ['success', 'data'],
      properties: {
        success: { type: 'boolean', enum: [true] },
        data: { description: 'Response data' },
        message: { type: 'string', description: 'Optional success message' },
        meta: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', format: 'date-time' },
            path: { type: 'string' },
            requestId: { type: 'string' },
          },
        },
      },
    },
    PaginatedResponse: {
      type: 'object',
      required: ['success', 'data', 'meta'],
      properties: {
        success: { type: 'boolean', enum: [true] },
        data: {
          type: 'array',
          items: {},
        },
        meta: {
          type: 'object',
          required: ['page', 'limit', 'total', 'totalPages'],
          properties: {
            page: { type: 'integer', minimum: 1 },
            limit: { type: 'integer', minimum: 1 },
            total: { type: 'integer', minimum: 0 },
            totalPages: { type: 'integer', minimum: 0 },
            timestamp: { type: 'string', format: 'date-time' },
            path: { type: 'string' },
            requestId: { type: 'string' },
          },
        },
      },
    },
  };

  // Generate common responses
  const commonResponses = {
    Unauthorized: {
      description: 'Authentication required',
      content: {
        'application/json': {
          schema: createSchemaRef('Error'),
          example: {
            success: false,
            error: {
              code: 'AUTH_001',
              message: 'Authentication required',
              statusCode: 401,
            },
          },
        },
      },
    },
    Forbidden: {
      description: 'Insufficient permissions',
      content: {
        'application/json': {
          schema: createSchemaRef('Error'),
          example: {
            success: false,
            error: {
              code: 'AUTH_002',
              message: 'Insufficient permissions',
              statusCode: 403,
            },
          },
        },
      },
    },
    ValidationError: {
      description: 'Validation failed',
      content: {
        'application/json': {
          schema: createSchemaRef('Error'),
          example: {
            success: false,
            error: {
              code: 'VAL_001',
              message: 'Validation failed',
              statusCode: 400,
              details: [
                {
                  field: 'email',
                  message: 'Invalid email address',
                  code: 'VAL_007',
                },
              ],
            },
          },
        },
      },
    },
    RateLimitExceeded: {
      description: 'Rate limit exceeded',
      content: {
        'application/json': {
          schema: createSchemaRef('Error'),
          example: {
            success: false,
            error: {
              code: 'RATE_001',
              message: 'Rate limit exceeded. Please try again in 5 minutes.',
              statusCode: 429,
            },
            meta: {
              retryAfter: 300,
            },
          },
        },
      },
      headers: {
        'X-RateLimit-Limit': {
          description: 'Maximum requests allowed in window',
          schema: { type: 'integer' },
        },
        'X-RateLimit-Remaining': {
          description: 'Remaining requests in window',
          schema: { type: 'integer' },
        },
        'X-RateLimit-Reset': {
          description: 'Unix timestamp when window resets',
          schema: { type: 'integer' },
        },
        'Retry-After': {
          description: 'Seconds until rate limit resets',
          schema: { type: 'integer' },
        },
      },
    },
    NotFound: {
      description: 'Resource not found',
      content: {
        'application/json': {
          schema: createSchemaRef('Error'),
          example: {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Resource not found',
              statusCode: 404,
            },
          },
        },
      },
    },
    InternalError: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: createSchemaRef('Error'),
          example: {
            success: false,
            error: {
              code: 'INTERNAL_ERROR',
              message: 'An unexpected error occurred',
              statusCode: 500,
            },
          },
        },
      },
    },
  };

  // Build paths (example paths - these would be dynamically generated in production)
  const paths = generateExamplePaths();

  return {
    openapi: '3.0.0',
    info: {
      title,
      version,
      description,
      contact,
      license: license || {
        name: 'MIT',
      },
    },
    servers,
    tags,
    paths,
    components: {
      schemas: {
        ...componentSchemas,
        ...responseSchemas,
      },
      responses: commonResponses,
      securitySchemes,
    },
    security: [{ bearerAuth: [] }],
  };
}

/**
 * Generate example API paths
 * In production, this would scan route files
 */
function generateExamplePaths(): Record<string, OpenAPIPath> {
  return {
    '/auth/login': {
      post: {
        summary: 'User login',
        description: 'Authenticate user and receive JWT token',
        tags: ['Authentication'],
        operationId: 'login',
        security: [], // Public endpoint
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: createSchemaRef('Login'),
              example: {
                email: 'user@example.com',
                password: 'password123',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    createSchemaRef('Success'),
                    {
                      type: 'object',
                      properties: {
                        data: {
                          type: 'object',
                          properties: {
                            token: { type: 'string' },
                            user: { type: 'object' },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          '400': {
            $ref: '#/components/responses/ValidationError',
          },
          '429': {
            $ref: '#/components/responses/RateLimitExceeded',
          },
        },
        'x-rate-limit': {
          max: DEFAULT_RATE_LIMITS.auth.max,
          windowMs: DEFAULT_RATE_LIMITS.auth.windowMs,
          description: `${DEFAULT_RATE_LIMITS.auth.max} requests per ${DEFAULT_RATE_LIMITS.auth.windowMs / 60000} minutes`,
        },
      },
    },
    '/users': {
      get: {
        summary: 'List users',
        description: 'Get paginated list of users',
        tags: ['Users'],
        operationId: 'listUsers',
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          },
          {
            name: 'search',
            in: 'query',
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: createSchemaRef('PaginatedResponse'),
              },
            },
          },
          '401': {
            $ref: '#/components/responses/Unauthorized',
          },
          '429': {
            $ref: '#/components/responses/RateLimitExceeded',
          },
        },
        'x-rate-limit': {
          max: DEFAULT_RATE_LIMITS.api.max,
          windowMs: DEFAULT_RATE_LIMITS.api.windowMs,
          description: `${DEFAULT_RATE_LIMITS.api.max} requests per ${DEFAULT_RATE_LIMITS.api.windowMs / 60000} minutes`,
        },
      },
      post: {
        summary: 'Create user',
        description: 'Create a new user',
        tags: ['Users'],
        operationId: 'createUser',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: createSchemaRef('UserCreate'),
            },
          },
        },
        responses: {
          '201': {
            description: 'User created',
            content: {
              'application/json': {
                schema: createSchemaRef('Success'),
              },
            },
          },
          '400': {
            $ref: '#/components/responses/ValidationError',
          },
          '401': {
            $ref: '#/components/responses/Unauthorized',
          },
          '429': {
            $ref: '#/components/responses/RateLimitExceeded',
          },
        },
        'x-rate-limit': {
          max: DEFAULT_RATE_LIMITS.api.max,
          windowMs: DEFAULT_RATE_LIMITS.api.windowMs,
          description: `${DEFAULT_RATE_LIMITS.api.max} requests per ${DEFAULT_RATE_LIMITS.api.windowMs / 60000} minutes`,
        },
      },
    },
  };
}

/**
 * Export OpenAPI spec to JSON
 */
export function exportOpenAPISpec(spec: OpenAPISpec): string {
  return JSON.stringify(spec, null, 2);
}

/**
 * Export OpenAPI spec to YAML (requires yaml library)
 */
export function exportOpenAPISpecYAML(spec: OpenAPISpec): string {
  // For now, return JSON. In production, use a YAML library
  return exportOpenAPISpec(spec);
}
