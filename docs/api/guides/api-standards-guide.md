# API Standards Guide

## Overview

This guide explains how to use the standardized API response format across all API endpoints in the Zyphex Tech platform.

## Quick Start

```typescript
import { createResponseFormatter } from '@/lib/api/response-formatter';
import { HTTP_STATUS } from '@/lib/api/http-status';

export async function GET(request: Request) {
  const formatter = createResponseFormatter(request);
  
  try {
    const data = await fetchData();
    return formatter.success(data);
  } catch (error) {
    return formatter.internalError(error);
  }
}
```

## Response Format

All API responses follow a standardized format:

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2025-01-11T10:00:00.000Z",
    "version": "v1"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "RES_001",
    "message": "Resource not found",
    "timestamp": "2025-01-11T10:00:00.000Z",
    "requestId": "req_abc123",
    "path": "/api/users/123"
  },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2025-01-11T10:00:00.000Z",
    "version": "v1"
  }
}
```

### Paginated Response

```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2025-01-11T10:00:00.000Z",
    "version": "v1",
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

## Using ResponseFormatter Class

### Basic Usage

```typescript
import { createResponseFormatter } from '@/lib/api/response-formatter';
import { HTTP_STATUS } from '@/lib/api/http-status';

export async function GET(request: Request) {
  const formatter = createResponseFormatter(request);
  
  const user = await getUserById(id);
  
  if (!user) {
    return formatter.notFound('User', id);
  }
  
  return formatter.success(user);
}
```

### Success Responses

```typescript
// Simple success response (200)
return formatter.success({ id: 1, name: 'John' });

// Created response (201)
return formatter.success({ id: 1, name: 'John' }, HTTP_STATUS.CREATED);

// No content response (204)
return formatter.success(null, HTTP_STATUS.NO_CONTENT);
```

### Paginated Responses

```typescript
export async function GET(request: Request) {
  const formatter = createResponseFormatter(request);
  const url = new URL(request.url);
  
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '20');
  
  const users = await getUsers(page, limit);
  const total = await getUserCount();
  
  return formatter.paginated(users, page, limit, total);
}
```

### Error Responses

```typescript
// 404 Not Found
return formatter.notFound('User', userId);

// 401 Unauthorized
return formatter.unauthorized('Invalid token');

// 403 Forbidden
return formatter.forbidden('Insufficient permissions');

// 400 Bad Request
return formatter.badRequest('Invalid parameters');

// 409 Conflict
return formatter.conflict('User', 'Email already exists');

// 422 Validation Error
return formatter.validationError([
  {
    field: 'email',
    message: 'Invalid email format',
    code: 'VAL_007'
  }
]);

// 429 Rate Limit
return formatter.rateLimit(60); // Retry after 60 seconds

// 500 Internal Error
return formatter.internalError(error);
```

## Error Codes

All errors use standardized error codes:

### Authentication (AUTH_xxx)
- `AUTH_001`: Token missing
- `AUTH_002`: Token invalid
- `AUTH_003`: Token expired
- `AUTH_005`: Invalid credentials
- `AUTH_011`: Account locked
- `AUTH_012`: Account disabled

### Authorization (AUTHZ_xxx)
- `AUTHZ_001`: Insufficient permissions
- `AUTHZ_002`: Resource access denied
- `AUTHZ_004`: Ownership required
- `AUTHZ_007`: Subscription required

### Validation (VAL_xxx)
- `VAL_001`: Validation failed
- `VAL_002`: Required field missing
- `VAL_003`: Invalid format
- `VAL_007`: Invalid email
- `VAL_017`: Invalid file type
- `VAL_018`: File too large

### Resources (RES_xxx)
- `RES_001`: Resource not found
- `RES_002`: Resource already exists
- `RES_003`: Resource conflict
- `RES_009`: Resource limit exceeded

### Rate Limiting (RATE_xxx)
- `RATE_001`: Rate limit exceeded
- `RATE_002`: Quota exceeded

### System (SYS_xxx)
- `SYS_001`: Database error
- `SYS_002`: External service error
- `SYS_003`: Internal server error
- `SYS_004`: Method not allowed

## HTTP Status Codes

Use semantic HTTP status codes:

```typescript
import { HTTP_STATUS } from '@/lib/api/http-status';

// 2xx Success
HTTP_STATUS.OK                  // 200 - Request successful
HTTP_STATUS.CREATED            // 201 - Resource created
HTTP_STATUS.ACCEPTED           // 202 - Request accepted
HTTP_STATUS.NO_CONTENT         // 204 - No content to return

// 4xx Client Errors
HTTP_STATUS.BAD_REQUEST        // 400 - Invalid request
HTTP_STATUS.UNAUTHORIZED       // 401 - Authentication required
HTTP_STATUS.FORBIDDEN          // 403 - Access denied
HTTP_STATUS.NOT_FOUND          // 404 - Resource not found
HTTP_STATUS.CONFLICT           // 409 - Resource conflict
HTTP_STATUS.UNPROCESSABLE_ENTITY // 422 - Validation error
HTTP_STATUS.TOO_MANY_REQUESTS  // 429 - Rate limit exceeded

// 5xx Server Errors
HTTP_STATUS.INTERNAL_SERVER_ERROR // 500 - Server error
HTTP_STATUS.SERVICE_UNAVAILABLE   // 503 - Service unavailable
```

## Request Context

Every request automatically includes:
- `requestId`: Unique identifier for the request
- `timestamp`: ISO 8601 timestamp
- `version`: API version (v1)
- `path`: Request path
- `method`: HTTP method

```typescript
import { extractRequestContext } from '@/lib/api/response-formatter';

const context = extractRequestContext(request);
// {
//   requestId: 'req_abc123',
//   path: '/api/users/123',
//   method: 'GET',
//   timestamp: '2025-01-11T10:00:00.000Z'
// }
```

## Best Practices

### 1. Always Use ResponseFormatter

```typescript
// ❌ Don't
return NextResponse.json({ user }, { status: 200 });

// ✅ Do
const formatter = createResponseFormatter(request);
return formatter.success({ user });
```

### 2. Use Appropriate Error Codes

```typescript
// ❌ Don't use generic errors
return formatter.error({
  code: 'ERROR',
  message: 'Something went wrong'
});

// ✅ Use specific error codes
return formatter.notFound('User', userId);
```

### 3. Include Validation Details

```typescript
// ❌ Don't
return formatter.badRequest('Invalid data');

// ✅ Do
return formatter.validationError([
  { field: 'email', message: 'Required', code: 'VAL_002' },
  { field: 'name', message: 'Too short', code: 'VAL_004' }
]);
```

### 4. Use Pagination for Lists

```typescript
// ❌ Don't return large arrays
return formatter.success(allUsers);

// ✅ Use pagination
return formatter.paginated(users, page, limit, total);
```

### 5. Handle Rate Limits

```typescript
// ✅ Include retry-after in rate limit responses
return formatter.rateLimit(60); // Retry after 60 seconds
```

## Complete Example

```typescript
import { createResponseFormatter } from '@/lib/api/response-formatter';
import { HTTP_STATUS } from '@/lib/api/http-status';
import { API_ERROR_CODES } from '@/lib/api/error-codes';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const formatter = createResponseFormatter(request);
  
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return formatter.unauthorized();
    }
    
    // Fetch resource
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      }
    });
    
    // Check if found
    if (!user) {
      return formatter.notFound('User', params.id);
    }
    
    // Check authorization
    if (user.id !== session.user.id && session.user.role !== 'ADMIN') {
      return formatter.forbidden('You can only view your own profile');
    }
    
    // Return success
    return formatter.success(user);
    
  } catch (error) {
    // Log error and return 500
    console.error('Error fetching user:', error);
    return formatter.internalError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const formatter = createResponseFormatter(request);
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return formatter.unauthorized();
    }
    
    const body = await request.json();
    
    // Validate input
    if (!body.name || body.name.length < 2) {
      return formatter.validationError([
        {
          field: 'name',
          message: 'Name must be at least 2 characters',
          code: 'VAL_004'
        }
      ]);
    }
    
    // Update resource
    const user = await prisma.user.update({
      where: { id: params.id },
      data: { name: body.name },
      select: {
        id: true,
        name: true,
        email: true,
        updatedAt: true,
      }
    });
    
    return formatter.success(user);
    
  } catch (error) {
    if (error.code === 'P2025') {
      return formatter.notFound('User', params.id);
    }
    return formatter.internalError(error);
  }
}
```

## Migration from Old Format

### Before (Old Format)

```typescript
export async function GET(request: Request) {
  try {
    const data = await fetchData();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
```

### After (New Format)

```typescript
import { createResponseFormatter } from '@/lib/api/response-formatter';

export async function GET(request: Request) {
  const formatter = createResponseFormatter(request);
  
  try {
    const data = await fetchData();
    return formatter.success(data);
  } catch (error) {
    return formatter.internalError(error);
  }
}
```

## Testing

```typescript
import { createResponseFormatter } from '@/lib/api/response-formatter';

describe('API Response', () => {
  it('should return standardized success response', async () => {
    const request = new Request('http://localhost/api/test');
    const formatter = createResponseFormatter(request);
    
    const response = formatter.success({ id: 1, name: 'Test' });
    const json = await response.json();
    
    expect(json.success).toBe(true);
    expect(json.data).toEqual({ id: 1, name: 'Test' });
    expect(json.meta.requestId).toBeDefined();
  });
});
```

## Support

For questions or issues with the API standards:
- Documentation: `/docs/api`
- Support: support@zyphextech.com
