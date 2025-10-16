/**
 * API Standard Types
 * Defines TypeScript interfaces for all API responses, errors, and metadata
 */

/**
 * Standard API Response wrapper
 * All API endpoints should return responses conforming to this structure
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMetadata;
}

/**
 * API Error structure
 * Provides detailed error information with consistent formatting
 */
export interface ApiError {
  code: string;
  message: string;
  details?: string;
  timestamp: string;
  requestId: string;
  path: string;
  validationErrors?: ValidationError[];
}

/**
 * Validation Error structure
 * Used for field-level validation errors
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: unknown;
}

/**
 * API Metadata structure
 * Contains request metadata and pagination information
 */
export interface ApiMetadata {
  requestId: string;
  timestamp: string;
  version: string;
  pagination?: PaginationMetadata;
  rateLimit?: RateLimitMetadata;
}

/**
 * Pagination Metadata
 * Standard pagination information for list endpoints
 */
export interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Rate Limit Metadata
 * Rate limiting information for API requests
 */
export interface RateLimitMetadata {
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp
  retryAfter?: number; // Seconds
}

/**
 * Success Response type
 * Represents a successful API response with data
 */
export type ApiSuccessResponse<T = unknown> = {
  success: true;
  data: T;
  error?: never;
  meta: ApiMetadata;
};

/**
 * Error Response type
 * Represents a failed API response with error details
 */
export type ApiErrorResponse = {
  success: false;
  data?: never;
  error: ApiError;
  meta: ApiMetadata;
};

/**
 * Paginated Response type
 * Represents a paginated list response
 */
export interface PaginatedResponse<T = unknown> {
  success: true;
  data: T[];
  error?: never;
  meta: ApiMetadata & {
    pagination: PaginationMetadata;
  };
}

/**
 * API Request Context
 * Information about the current request
 */
export interface ApiRequestContext {
  requestId: string;
  path: string;
  method: string;
  timestamp: Date;
  userId?: string;
  userRole?: string;
  ip?: string;
}

/**
 * List Query Parameters
 * Standard query parameters for list endpoints
 */
export interface ListQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, unknown>;
}

/**
 * API Version
 * Supported API versions
 */
export type ApiVersion = 'v1' | 'v2';

/**
 * HTTP Methods
 * Standard HTTP methods used in API
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * API Endpoint Configuration
 * Configuration for API endpoints
 */
export interface ApiEndpointConfig {
  path: string;
  method: HttpMethod;
  version: ApiVersion;
  authenticated: boolean;
  rateLimit?: {
    windowMs: number;
    maxRequests: number;
  };
  permissions?: string[];
}

/**
 * Field Validation Rule
 * Rules for field validation
 */
export interface FieldValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  min?: number;
  max?: number;
  enum?: readonly unknown[];
  custom?: (value: unknown) => boolean | Promise<boolean>;
}

/**
 * File Upload Options
 * Configuration for file uploads
 */
export interface FileUploadOptions {
  maxSize: number; // in bytes
  allowedTypes: string[]; // MIME types
  required: boolean;
}
