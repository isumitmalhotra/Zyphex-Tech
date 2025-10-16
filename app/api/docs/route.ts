/**
 * OpenAPI Specification Endpoint
 * 
 * Serves the OpenAPI 3.0 specification JSON for the API.
 * This endpoint is consumed by Swagger UI and other API documentation tools.
 * 
 * @route GET /api/docs
 */

import { NextResponse } from 'next/server';
import { generateOpenAPISpec, exportOpenAPISpec } from '@/lib/api/openapi';

/**
 * GET /api/docs
 * 
 * Returns the OpenAPI 3.0 specification for the entire API.
 * This includes all schemas, paths, security definitions, and documentation.
 * 
 * @returns OpenAPI specification JSON
 */
export async function GET() {
  try {
    // Generate the OpenAPI specification
    const spec = generateOpenAPISpec({
      title: 'Zyphex Tech API',
      version: '1.0.0',
      description: `
# Zyphex Tech IT Services Platform API

Complete API documentation for the Zyphex Tech IT Services Platform.

## Features

- **🔐 Authentication**: Secure JWT-based authentication with role-based access control
- **✅ Validation**: Type-safe request validation using Zod schemas
- **⚡ Rate Limiting**: Role-based rate limiting with configurable limits
- **📊 Monitoring**: Comprehensive error tracking and performance metrics
- **🔄 Real-time**: WebSocket support for real-time updates
- **📧 Notifications**: Email and in-app notification system

## Getting Started

1. **Register**: Create an account at \`POST /api/auth/register\`
2. **Login**: Get your access token at \`POST /api/auth/login\`
3. **Authorize**: Click the "Authorize" button above and enter your token
4. **Try it out**: Use the "Try it out" button on any endpoint to test it

## Rate Limits

Rate limits are applied based on your user role:

| Role | Multiplier | Example (100 req/min base) |
|------|------------|---------------------------|
| Guest | 1x | 100 requests/min |
| User | 2x | 200 requests/min |
| Admin | 5x | 500 requests/min |
| Super Admin | 10x | 1000 requests/min |

Rate limit information is included in response headers:
- \`X-RateLimit-Limit\`: Maximum requests allowed in the window
- \`X-RateLimit-Remaining\`: Remaining requests in current window
- \`X-RateLimit-Reset\`: Unix timestamp when the limit resets

## Response Format

All API endpoints return responses in the following format:

\`\`\`json
{
  "success": true,
  "data": {
    // Response data here
  },
  "error": null,
  "meta": {
    "timestamp": "2025-10-16T12:00:00.000Z",
    "requestId": "req_abc123",
    "version": "1.0.0"
  }
}
\`\`\`

### Error Response

\`\`\`json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "field": "email",
      "issue": "Invalid email format"
    }
  },
  "meta": {
    "timestamp": "2025-10-16T12:00:00.000Z",
    "requestId": "req_abc123",
    "version": "1.0.0"
  }
}
\`\`\`

## Error Codes

Common error codes you may encounter:

- \`VALIDATION_ERROR\`: Request validation failed
- \`AUTHENTICATION_ERROR\`: Invalid or missing authentication
- \`AUTHORIZATION_ERROR\`: Insufficient permissions
- \`NOT_FOUND\`: Resource not found
- \`RATE_LIMIT_EXCEEDED\`: Too many requests
- \`INTERNAL_ERROR\`: Internal server error

## Support

For support, please contact:
- **Email**: support@zyphextech.com
- **Documentation**: https://docs.zyphextech.com
- **Status Page**: https://status.zyphextech.com
      `.trim(),
      contact: {
        name: 'Zyphex Tech API Support',
        email: 'support@zyphextech.com',
        url: 'https://zyphextech.com/support',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
      servers: [
        {
          url: 'http://localhost:3000/api',
          description: 'Local Development Server',
        },
        {
          url: 'https://api.zyphextech.com/api',
          description: 'Production Server',
        },
        {
          url: 'https://staging-api.zyphextech.com/api',
          description: 'Staging Server',
        },
      ],
    });

    // Export as JSON string
    const jsonSpec = exportOpenAPISpec(spec);

    // Return the spec with proper headers
    return new NextResponse(jsonSpec, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, s-maxage=600', // Cache for 5 minutes
        'Access-Control-Allow-Origin': '*', // Allow CORS for documentation tools
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Error generating OpenAPI spec:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to generate OpenAPI specification',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/docs
 * 
 * Handle CORS preflight requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  });
}
