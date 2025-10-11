# API Error Standardization - Implementation Guide

## 🎯 Overview

This document provides a comprehensive guide for implementing the standardized API error handling system across all Zyphex Tech API routes. The system provides consistent error responses, enhanced monitoring, and improved developer experience.

## 📋 Table of Contents

1. [Core Components](#core-components)
2. [Quick Start Guide](#quick-start-guide)
3. [Migration Strategy](#migration-strategy)
4. [API Route Implementation](#api-route-implementation)
5. [Error Handling Patterns](#error-handling-patterns)
6. [Testing Guidelines](#testing-guidelines)
7. [Monitoring & Analytics](#monitoring--analytics)

## 🏗️ Core Components

### 1. Error Type System (`lib/api/error-types.ts`)

**Features:**
- ✅ 60+ standardized error codes with proper categorization
- ✅ HTTP status code mapping for consistent responses
- ✅ Error severity levels (LOW, MEDIUM, HIGH, CRITICAL)
- ✅ TypeScript interfaces for complete type safety
- ✅ Validation error structures with field-level details
- ✅ Rate limiting information interfaces
- ✅ Request tracking and context types

**Key Types:**
```typescript
// Standardized error response
interface ApiErrorResponse {
  error: true;
  code: ApiErrorCode;
  message: string;
  statusCode: HttpStatusCode;
  severity: ErrorSeverity;
  timestamp: string;
  requestId: string;
  path: string;
  method: string;
  // ... additional fields
}

// Success response wrapper
interface ApiSuccessResponse<T> {
  error: false;
  data: T;
  statusCode: HttpStatusCode;
  timestamp: string;
  requestId: string;
  // ... metadata
}
```

### 2. Error Handler Utility (`lib/api/error-handler.ts`)

**Features:**
- ✅ Centralized error processing with intelligent error type detection
- ✅ Automatic Sentry integration for error tracking
- ✅ Request context extraction (IP, User-Agent, User ID, etc.)
- ✅ Rate limiting support with proper headers
- ✅ CORS handling and security headers
- ✅ Development vs production error detail filtering
- ✅ Critical error notification system
- ✅ Request ID generation and correlation tracking

**Key Functions:**
```typescript
// Main error handler
handleApiError(error: unknown, request: NextRequest): Promise<NextResponse>

// Route wrapper for automatic error handling
withErrorHandler(handler: Function, config?: ErrorHandlerConfig)

// Response helpers
respondWithSuccess<T>(data: T, request: NextRequest, options?)
respondWithError(code: ApiErrorCode, message: string, request: NextRequest, options?)

// Async operation wrapper
tryCatch<T>(operation: () => Promise<T>, request: NextRequest): Promise<Result<T>>
```

### 3. Enhanced API Utilities (`lib/api-utils.ts`)

**Features:**
- ✅ Enhanced field validation with standardized error structures
- ✅ Improved pagination with proper response formatting
- ✅ Request ID middleware integration
- ✅ Legacy function support for gradual migration
- ✅ TypeScript-first approach with complete type safety

## 🚀 Quick Start Guide

### Step 1: Import Required Functions

```typescript
import { 
  withErrorHandler,
  respondWithSuccess,
  respondWithError,
  tryCatch
} from '@/lib/api/error-handler';
import { ApiErrorCode, HttpStatusCode } from '@/lib/api/error-types';
```

### Step 2: Wrap Your Route Handler

```typescript
export const GET = withErrorHandler(async (request: NextRequest) => {
  // Your route logic here
  const data = await fetchData();
  
  return respondWithSuccess(data, request, {
    message: 'Data retrieved successfully'
  });
});
```

### Step 3: Handle Errors Properly

```typescript
export const POST = withErrorHandler(async (request: NextRequest) => {
  // Parse and validate request
  const body = await request.json().catch(() => {
    throw new Error('Invalid JSON');
  });

  // Use tryCatch for operations that might fail
  const result = await tryCatch(
    () => database.create(body),
    request,
    ApiErrorCode.DATABASE_QUERY_ERROR
  );

  if (!result.success) {
    return respondWithError(
      result.error.code,
      result.error.message,
      request
    );
  }

  return respondWithSuccess(result.data, request, {
    statusCode: HttpStatusCode.CREATED
  });
});
```

## 📈 Migration Strategy

### Phase 1: High-Traffic Routes (Priority)
1. **Authentication routes** (`/api/auth/*`)
2. **User management** (`/api/users/*`)
3. **Project operations** (`/api/projects/*`)
4. **File uploads** (`/api/upload/*`)

### Phase 2: Business Logic Routes
1. **Client management** (`/api/clients/*`)
2. **Invoice operations** (`/api/invoices/*`)
3. **Payment processing** (`/api/payments/*`)
4. **Reporting endpoints** (`/api/reports/*`)

### Phase 3: Supporting Routes
1. **Analytics endpoints** (`/api/analytics/*`)
2. **Integration webhooks** (`/api/webhooks/*`)
3. **Health checks** (`/api/health/*`)
4. **Utility endpoints** (`/api/utils/*`)

### Migration Checklist

For each route migration, ensure:

- [ ] Import new error handling utilities
- [ ] Wrap route handler with `withErrorHandler`
- [ ] Replace manual error responses with `respondWithError`
- [ ] Replace success responses with `respondWithSuccess`
- [ ] Use `tryCatch` for database operations
- [ ] Add proper request validation
- [ ] Update error codes to use `ApiErrorCode` enum
- [ ] Add appropriate status codes using `HttpStatusCode` enum
- [ ] Test error scenarios thoroughly
- [ ] Update API documentation

## 🛠️ API Route Implementation Patterns

### 1. Basic CRUD Operations

```typescript
// GET - List with pagination
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const { skip, take, page, limit } = getPaginationParams(searchParams);
  
  const result = await tryCatch(
    () => database.findMany({ skip, take }),
    request,
    ApiErrorCode.DATABASE_QUERY_ERROR
  );

  if (!result.success) {
    return respondWithError(result.error.code, result.error.message, request);
  }

  return createPaginatedResponseV2(result.data, total, page, limit, request);
});

// POST - Create with validation
export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json().catch(() => {
    throw new Error('Invalid JSON');
  });

  // Validate required fields
  const validationErrors = validateRequiredFields(body, ['name', 'email']);
  if (validationErrors.length > 0) {
    return respondWithError(
      ApiErrorCode.VALIDATION_REQUIRED_FIELD,
      'Missing required fields',
      request,
      { validationErrors }
    );
  }

  // Use Zod for schema validation
  const validation = Schema.safeParse(body);
  if (!validation.success) {
    return respondWithError(
      ApiErrorCode.VALIDATION_SCHEMA_MISMATCH,
      'Invalid request format',
      request,
      { validationErrors: formatZodErrors(validation.error) }
    );
  }

  const result = await tryCatch(
    () => database.create(validation.data),
    request,
    ApiErrorCode.DATABASE_QUERY_ERROR
  );

  if (!result.success) {
    return respondWithError(result.error.code, result.error.message, request);
  }

  return respondWithSuccess(result.data, request, {
    statusCode: HttpStatusCode.CREATED,
    message: 'Resource created successfully'
  });
});
```

### 2. Authentication & Authorization

```typescript
export const GET = withErrorHandler(async (request: NextRequest) => {
  // Check authentication
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return respondWithError(
      ApiErrorCode.AUTH_TOKEN_MISSING,
      'Authentication required',
      request
    );
  }

  // Validate token
  const user = await validateToken(authHeader);
  if (!user) {
    return respondWithError(
      ApiErrorCode.AUTH_TOKEN_INVALID,
      'Invalid authentication token',
      request
    );
  }

  // Check permissions
  if (!hasPermission(user, 'read:users')) {
    return respondWithError(
      ApiErrorCode.AUTH_INSUFFICIENT_PERMISSIONS,
      'Insufficient permissions',
      request
    );
  }

  // Continue with authorized operation...
});
```

### 3. File Upload Handling

```typescript
export const POST = withErrorHandler(async (request: NextRequest) => {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return respondWithError(
      ApiErrorCode.VALIDATION_REQUIRED_FIELD,
      'File is required',
      request
    );
  }

  // Check file size
  if (file.size > 10 * 1024 * 1024) { // 10MB
    return respondWithError(
      ApiErrorCode.FILE_TOO_LARGE,
      'File size exceeds 10MB limit',
      request,
      { details: { maxSize: '10MB', actualSize: `${(file.size / 1024 / 1024).toFixed(2)}MB` } }
    );
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (!allowedTypes.includes(file.type)) {
    return respondWithError(
      ApiErrorCode.FILE_INVALID_TYPE,
      'Invalid file type',
      request,
      { details: { allowedTypes, actualType: file.type } }
    );
  }

  const result = await tryCatch(
    () => uploadFile(file),
    request,
    ApiErrorCode.FILE_UPLOAD_FAILED
  );

  if (!result.success) {
    return respondWithError(result.error.code, result.error.message, request);
  }

  return respondWithSuccess(result.data, request, {
    statusCode: HttpStatusCode.CREATED,
    message: 'File uploaded successfully'
  });
});
```

## 🧪 Testing Guidelines

### 1. Error Response Testing

```typescript
// Test error response format
describe('API Error Responses', () => {
  it('should return standardized error format', async () => {
    const response = await fetch('/api/test/error');
    const error = await response.json();

    expect(error).toMatchObject({
      error: true,
      code: expect.any(String),
      message: expect.any(String),
      statusCode: expect.any(Number),
      severity: expect.any(String),
      timestamp: expect.any(String),
      requestId: expect.any(String),
      path: expect.any(String),
      method: expect.any(String)
    });
  });

  it('should include validation errors when appropriate', async () => {
    const response = await fetch('/api/test/validation', {
      method: 'POST',
      body: JSON.stringify({ invalid: 'data' })
    });
    
    const error = await response.json();
    expect(error.validationErrors).toBeInstanceOf(Array);
    expect(error.validationErrors[0]).toMatchObject({
      field: expect.any(String),
      code: expect.any(String),
      message: expect.any(String)
    });
  });
});
```

### 2. Success Response Testing

```typescript
describe('API Success Responses', () => {
  it('should return standardized success format', async () => {
    const response = await fetch('/api/test/success');
    const success = await response.json();

    expect(success).toMatchObject({
      error: false,
      data: expect.anything(),
      statusCode: expect.any(Number),
      timestamp: expect.any(String),
      requestId: expect.any(String)
    });
  });
});
```

## 📊 Monitoring & Analytics

### 1. Error Tracking

The system automatically integrates with:
- **Sentry**: For error tracking and performance monitoring
- **Console Logging**: Development-friendly error output
- **Request Tracking**: Correlation IDs for distributed tracing

### 2. Metrics Collection

Key metrics tracked:
- Error frequency by code
- Error severity distribution
- Response time correlation
- User impact analysis
- Retry success rates

### 3. Critical Error Notifications

Configure notifications for critical errors:
```typescript
const config: ErrorHandlerConfig = {
  notifyOnCritical: true,
  // Configure notification channels
};
```

## 🔧 Configuration Options

### Environment Variables

```bash
# Development vs Production behavior
NODE_ENV=production

# Sentry integration
SENTRY_DSN=your-sentry-dsn

# Notification settings
SLACK_WEBHOOK_URL=your-slack-webhook
PAGERDUTY_API_KEY=your-pagerduty-key
```

### Error Handler Configuration

```typescript
const config: ErrorHandlerConfig = {
  includeStack: process.env.NODE_ENV === 'development',
  includeDebugInfo: false,
  logErrors: true,
  notifyOnCritical: true,
  rateLimitEnabled: true,
  corsEnabled: true,
  sanitizeOutput: true
};
```

## 📚 Best Practices

### 1. Error Code Selection
- Use specific error codes over generic ones
- Choose appropriate severity levels
- Include helpful error messages
- Add documentation links for complex errors

### 2. Request Validation
- Validate early and return clear error messages
- Use Zod schemas for comprehensive validation
- Provide field-level error details
- Include example valid requests in documentation

### 3. Database Operations
- Always wrap database calls with `tryCatch`
- Handle specific Prisma errors appropriately
- Implement proper retry logic for transient failures
- Log database performance metrics

### 4. Security Considerations
- Sanitize error output in production
- Don't expose sensitive information in error messages
- Implement proper rate limiting
- Use correlation IDs for secure debugging

## 🚀 Next Steps

1. **Immediate Actions**:
   - Review and test the sample implementation
   - Begin migration of high-priority routes
   - Set up monitoring dashboards
   - Configure notification channels

2. **Week 1**:
   - Migrate authentication routes
   - Implement comprehensive testing
   - Set up error analytics dashboard
   - Document API changes

3. **Week 2-4**:
   - Complete remaining route migrations
   - Performance optimization
   - Team training and documentation
   - Production deployment

---

## 📞 Support & Questions

For implementation questions or issues:
- **Technical Lead**: Review migration checklist
- **Documentation**: Check `/docs/api/errors`
- **Monitoring**: Check Sentry dashboard
- **Emergency**: Use critical error notification system

---

**Version**: 1.0.0  
**Last Updated**: October 11, 2025  
**Next Review**: October 25, 2025