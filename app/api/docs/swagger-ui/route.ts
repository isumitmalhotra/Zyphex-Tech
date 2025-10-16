/**
 * Swagger UI Interface
 * 
 * Serves the interactive Swagger UI documentation interface.
 * This provides a user-friendly way to explore and test the API.
 * 
 * @route GET /api/docs/swagger-ui
 */

import { NextResponse } from 'next/server';
import { generateSwaggerHTML } from '@/lib/api/openapi/swagger-config';

/**
 * GET /api/docs/swagger-ui
 * 
 * Returns the Swagger UI HTML page.
 * This is an interactive documentation interface that allows users to:
 * - View all API endpoints
 * - Test endpoints with the "Try it out" feature
 * - View request/response schemas
 * - Test authentication
 * - View examples
 * 
 * @returns HTML page with Swagger UI
 */
export async function GET() {
  try {
    // Generate the Swagger UI HTML
    const html = generateSwaggerHTML({
      url: '/api/docs',
      deepLinking: true,
      displayOperationId: false,
      defaultModelsExpandDepth: 1,
      defaultModelExpandDepth: 1,
      docExpansion: 'list',
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      tryItOutEnabled: true,
      requestSnippetsEnabled: true,
      persistAuthorization: true,
      syntaxHighlight: {
        activate: true,
        theme: 'monokai',
      },
    });

    // Return the HTML with proper headers
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
      },
    });
  } catch (error) {
    console.error('Error generating Swagger UI:', error);
    
    // Return error page
    const errorHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error - API Documentation</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .error-container {
      background: white;
      padding: 3rem;
      border-radius: 1rem;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      text-align: center;
      max-width: 500px;
    }
    h1 {
      color: #e53e3e;
      margin: 0 0 1rem 0;
      font-size: 2rem;
    }
    p {
      color: #666;
      margin: 0 0 1.5rem 0;
      line-height: 1.6;
    }
    .error-details {
      background: #f7fafc;
      padding: 1rem;
      border-radius: 0.5rem;
      font-family: monospace;
      font-size: 0.875rem;
      color: #e53e3e;
      margin-bottom: 1.5rem;
      word-break: break-word;
    }
    a {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      text-decoration: none;
      transition: background 0.2s;
    }
    a:hover {
      background: #5a67d8;
    }
  </style>
</head>
<body>
  <div class="error-container">
    <h1>⚠️ Error Loading Documentation</h1>
    <p>We encountered an error while loading the API documentation interface.</p>
    <div class="error-details">
      ${error instanceof Error ? error.message : 'Unknown error occurred'}
    </div>
    <a href="/api/docs">View Raw OpenAPI Spec</a>
  </div>
</body>
</html>`;

    return new NextResponse(errorHTML, {
      status: 500,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  }
}

/**
 * OPTIONS /api/docs/swagger-ui
 * 
 * Handle CORS preflight requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  });
}
