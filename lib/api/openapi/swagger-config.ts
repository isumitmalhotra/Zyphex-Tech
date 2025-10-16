/**
 * Swagger UI Configuration
 * 
 * Configures the Swagger UI interface for interactive API documentation.
 * This includes theme settings, plugins, and UI customization.
 */

export interface SwaggerUIConfig {
  /**
   * URL to fetch the OpenAPI spec from
   */
  url?: string;
  
  /**
   * OpenAPI spec object (alternative to url)
   */
  spec?: Record<string, unknown>;
  
  /**
   * DOM element ID to render Swagger UI into
   */
  domId?: string;
  
  /**
   * Deep linking enabled
   */
  deepLinking?: boolean;
  
  /**
   * Display operation ID in the UI
   */
  displayOperationId?: boolean;
  
  /**
   * Default models expand depth
   */
  defaultModelsExpandDepth?: number;
  
  /**
   * Default model expand depth
   */
  defaultModelExpandDepth?: number;
  
  /**
   * Models expand depth
   */
  docExpansion?: 'list' | 'full' | 'none';
  
  /**
   * Filter by tag enabled
   */
  filter?: boolean;
  
  /**
   * Show extensions
   */
  showExtensions?: boolean;
  
  /**
   * Show common extensions
   */
  showCommonExtensions?: boolean;
  
  /**
   * Supported submit methods
   */
  supportedSubmitMethods?: string[];
  
  /**
   * Try it out enabled by default
   */
  tryItOutEnabled?: boolean;
  
  /**
   * Request snippets enabled
   */
  requestSnippetsEnabled?: boolean;
  
  /**
   * Persist authorization
   */
  persistAuthorization?: boolean;
  
  /**
   * Syntax highlighting theme
   */
  syntaxHighlight?: {
    activate?: boolean;
    theme?: 'agate' | 'arta' | 'monokai' | 'nord' | 'obsidian' | 'tomorrow-night';
  };
}

/**
 * Default Swagger UI configuration
 */
export const defaultSwaggerConfig: SwaggerUIConfig = {
  url: '/api/docs',
  domId: '#swagger-ui',
  deepLinking: true,
  displayOperationId: false,
  defaultModelsExpandDepth: 1,
  defaultModelExpandDepth: 1,
  docExpansion: 'list',
  filter: true,
  showExtensions: true,
  showCommonExtensions: true,
  supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
  tryItOutEnabled: true,
  requestSnippetsEnabled: true,
  persistAuthorization: true,
  syntaxHighlight: {
    activate: true,
    theme: 'monokai',
  },
};

/**
 * Swagger UI HTML template
 * 
 * Generates the HTML page that hosts the Swagger UI interface.
 * This includes the necessary CSS and JavaScript to render the UI.
 */
export function generateSwaggerHTML(config: SwaggerUIConfig = {}): string {
  const finalConfig = { ...defaultSwaggerConfig, ...config };
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Zyphex Tech API Documentation</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.10.0/swagger-ui.css" />
  <link rel="icon" type="image/png" href="/favicon.ico" />
  <style>
    html {
      box-sizing: border-box;
      overflow: -moz-scrollbars-vertical;
      overflow-y: scroll;
    }
    
    *,
    *:before,
    *:after {
      box-sizing: inherit;
    }
    
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    }
    
    .swagger-ui .topbar {
      display: none;
    }
    
    .custom-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 2rem;
      text-align: center;
    }
    
    .custom-header h1 {
      margin: 0 0 0.5rem 0;
      font-size: 2rem;
      font-weight: 700;
    }
    
    .custom-header p {
      margin: 0;
      font-size: 1.1rem;
      opacity: 0.95;
    }
    
    .custom-header .badge {
      display: inline-block;
      background: rgba(255, 255, 255, 0.2);
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      margin: 0.5rem 0.25rem 0 0.25rem;
      font-size: 0.875rem;
    }
    
    .info-section {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
      background: #f8f9fa;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-top: 1rem;
    }
    
    .info-card {
      background: white;
      border-radius: 0.5rem;
      padding: 1.5rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .info-card h3 {
      margin: 0 0 0.5rem 0;
      font-size: 1.1rem;
      color: #667eea;
    }
    
    .info-card p {
      margin: 0;
      color: #666;
      line-height: 1.6;
    }
    
    .info-card ul {
      margin: 0.5rem 0 0 0;
      padding-left: 1.25rem;
      color: #666;
    }
    
    .info-card li {
      margin: 0.25rem 0;
    }
  </style>
</head>

<body>
  <div class="custom-header">
    <h1>🚀 Zyphex Tech API Documentation</h1>
    <p>Interactive API documentation with real-time testing capabilities</p>
    <div>
      <span class="badge">OpenAPI 3.0</span>
      <span class="badge">187 Tests Passing</span>
      <span class="badge">Enterprise-Grade</span>
    </div>
  </div>
  
  <div class="info-section">
    <div class="info-grid">
      <div class="info-card">
        <h3>🔐 Authentication</h3>
        <p>This API uses Bearer JWT authentication. Click "Authorize" button and enter your token:</p>
        <ul>
          <li>Format: <code>Bearer YOUR_TOKEN</code></li>
          <li>Get token from <code>/api/auth/login</code></li>
          <li>Token persists across sessions</li>
        </ul>
      </div>
      
      <div class="info-card">
        <h3>⚡ Rate Limiting</h3>
        <p>Rate limits apply per user role:</p>
        <ul>
          <li><strong>Guest:</strong> 1x base limit</li>
          <li><strong>User:</strong> 2x base limit</li>
          <li><strong>Admin:</strong> 5x base limit</li>
          <li><strong>Super Admin:</strong> 10x base limit</li>
        </ul>
        <p style="margin-top: 0.5rem; font-size: 0.9rem;">Check <code>X-RateLimit-*</code> headers in responses</p>
      </div>
      
      <div class="info-card">
        <h3>✅ Validation</h3>
        <p>All requests are validated using Zod schemas:</p>
        <ul>
          <li>Type-safe request bodies</li>
          <li>Detailed validation errors</li>
          <li>Automatic type inference</li>
          <li>Business rule validation</li>
        </ul>
      </div>
      
      <div class="info-card">
        <h3>📊 Response Format</h3>
        <p>All endpoints return standardized responses:</p>
        <ul>
          <li><code>success</code>: Boolean status</li>
          <li><code>data</code>: Response payload</li>
          <li><code>error</code>: Error details (if any)</li>
          <li><code>meta</code>: Metadata (timestamp, version)</li>
        </ul>
      </div>
    </div>
  </div>

  <div id="swagger-ui"></div>

  <script src="https://unpkg.com/swagger-ui-dist@5.10.0/swagger-ui-bundle.js" charset="UTF-8"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.10.0/swagger-ui-standalone-preset.js" charset="UTF-8"></script>
  <script>
    window.onload = function() {
      window.ui = SwaggerUIBundle({
        url: ${JSON.stringify(finalConfig.url)},
        dom_id: ${JSON.stringify(finalConfig.domId)},
        deepLinking: ${finalConfig.deepLinking},
        displayOperationId: ${finalConfig.displayOperationId},
        defaultModelsExpandDepth: ${finalConfig.defaultModelsExpandDepth},
        defaultModelExpandDepth: ${finalConfig.defaultModelExpandDepth},
        docExpansion: ${JSON.stringify(finalConfig.docExpansion)},
        filter: ${finalConfig.filter},
        showExtensions: ${finalConfig.showExtensions},
        showCommonExtensions: ${finalConfig.showCommonExtensions},
        supportedSubmitMethods: ${JSON.stringify(finalConfig.supportedSubmitMethods)},
        tryItOutEnabled: ${finalConfig.tryItOutEnabled},
        requestSnippetsEnabled: ${finalConfig.requestSnippetsEnabled},
        persistAuthorization: ${finalConfig.persistAuthorization},
        syntaxHighlight: ${JSON.stringify(finalConfig.syntaxHighlight)},
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout",
        onComplete: function() {
          console.log('Swagger UI loaded successfully');
        }
      });
    };
  </script>
</body>
</html>`;
}

/**
 * Configuration options for Swagger UI customization
 */
export interface SwaggerUIOptions {
  /**
   * Custom title for the documentation page
   */
  title?: string;
  
  /**
   * Custom description
   */
  description?: string;
  
  /**
   * Show/hide the topbar
   */
  showTopbar?: boolean;
  
  /**
   * Custom CSS styles
   */
  customCSS?: string;
  
  /**
   * Custom JavaScript
   */
  customJS?: string;
  
  /**
   * OAuth configuration
   */
  oauth?: {
    clientId?: string;
    clientSecret?: string;
    realm?: string;
    appName?: string;
    scopeSeparator?: string;
    scopes?: string[];
    additionalQueryStringParams?: Record<string, string>;
    useBasicAuthenticationWithAccessCodeGrant?: boolean;
    usePkceWithAuthorizationCodeGrant?: boolean;
  };
}

/**
 * Generate Swagger UI with custom options
 */
export function generateCustomSwaggerHTML(
  config: SwaggerUIConfig = {},
  options: SwaggerUIOptions = {}
): string {
  const html = generateSwaggerHTML(config);
  
  // Add custom title if provided
  if (options.title) {
    return html.replace(
      '<title>Zyphex Tech API Documentation</title>',
      `<title>${options.title}</title>`
    );
  }
  
  return html;
}
