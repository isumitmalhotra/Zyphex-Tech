# API Routes Documentation

This document shows example API routes with their metadata, authentication requirements, and rate limits.

## Example Routes Documentation

Below are examples of how to document your API routes using the route extractor:

```typescript
import { route, createRouteExtractor } from '@/lib/api/openapi';

// Create extractor
const extractor = createRouteExtractor();

// Example 1: Public endpoint
const getUsersRoute = route('/api/users', 'GET')
  .summary('Get all users')
  .description('Retrieves a paginated list of all users in the system')
  .tags('Users', 'Public')
  .auth(false)
  .rateLimit(true, {
    guest: 1,
    user: 2,
    admin: 5,
    super_admin: 10
  })
  .parameter({
    name: 'page',
    in: 'query',
    description: 'Page number for pagination',
    required: false,
    type: 'number',
    example: 1
  })
  .parameter({
    name: 'limit',
    in: 'query',
    description: 'Number of items per page',
    required: false,
    type: 'number',
    example: 10
  })
  .response({
    status: 200,
    description: 'Successfully retrieved users',
    contentType: 'application/json'
  })
  .response({
    status: 400,
    description: 'Invalid request parameters'
  })
  .build();

// Example 2: Authenticated endpoint
const createUserRoute = route('/api/users', 'POST')
  .summary('Create a new user')
  .description('Creates a new user account. Requires admin privileges.')
  .tags('Users', 'Admin')
  .auth(true, ['admin', 'super_admin'])
  .rateLimit(true, {
    guest: 0,
    user: 0,
    admin: 5,
    super_admin: 10
  })
  .requestBody({
    description: 'User creation data',
    required: true,
    contentType: 'application/json'
  })
  .response({
    status: 201,
    description: 'User created successfully',
    contentType: 'application/json'
  })
  .response({
    status: 400,
    description: 'Invalid user data'
  })
  .response({
    status: 401,
    description: 'Unauthorized - authentication required'
  })
  .response({
    status: 403,
    description: 'Forbidden - insufficient permissions'
  })
  .build();

// Example 3: Deprecated endpoint
const oldApiRoute = route('/api/v1/legacy', 'GET')
  .summary('Legacy API endpoint')
  .description('This endpoint is deprecated. Use /api/v2/users instead.')
  .tags('Legacy')
  .deprecated(true)
  .auth(false)
  .rateLimit(true)
  .response({
    status: 200,
    description: 'Legacy response'
  })
  .externalDocs('Migration Guide', 'https://docs.example.com/migration')
  .build();

// Add routes to extractor
extractor.addRoutes([getUsersRoute, createUserRoute, oldApiRoute]);

// Generate markdown documentation
const markdown = extractor.toMarkdown();
console.log(markdown);
```

## Generated Documentation Output

The above code would generate markdown documentation like this:

---

### GET /api/users

**Get all users**

Retrieves a paginated list of all users in the system

**Authentication**: Not required

**Rate Limiting**: Guest: 1x, User: 2x, Admin: 5x, Super Admin: 10x

**Parameters**:
- `page` (query) (optional) `number`: Page number for pagination Example: `1`
- `limit` (query) (optional) `number`: Number of items per page Example: `10`

**Responses**:
- `200`: Successfully retrieved users (application/json)
- `400`: Invalid request parameters

---

### POST /api/users

**Create a new user**

Creates a new user account. Requires admin privileges.

**Authentication**: Required (admin, super_admin)

**Rate Limiting**: Guest: 0x, User: 0x, Admin: 5x, Super Admin: 10x

**Request Body**: (required)
User creation data
Content-Type: `application/json`

**Responses**:
- `201`: User created successfully (application/json)
- `400`: Invalid user data
- `401`: Unauthorized - authentication required
- `403`: Forbidden - insufficient permissions

---

### GET /api/v1/legacy

**Legacy API endpoint**

This endpoint is deprecated. Use /api/v2/users instead.

> ⚠️ **DEPRECATED**: This endpoint is deprecated and may be removed in future versions.

**Authentication**: Not required

**Rate Limiting**: Enabled

**Responses**:
- `200`: Legacy response

**More Info**: [Migration Guide](https://docs.example.com/migration)

---

## Usage in Your Project

1. **Document your routes**: Use the fluent API to describe each endpoint
2. **Generate documentation**: Run the extractor to create markdown docs
3. **Keep it updated**: Regenerate docs when routes change
4. **Share with team**: Commit the generated docs to your repository

## Benefits

- ✅ **Type-safe**: Full TypeScript support
- ✅ **Centralized**: Single source of truth for API docs
- ✅ **Automated**: Generate docs from code
- ✅ **Consistent**: Standardized format across all endpoints
- ✅ **Version control**: Track API changes over time
