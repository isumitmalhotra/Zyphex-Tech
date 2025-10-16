/**
 * Swagger UI Configuration Tests
 * 
 * Tests for Swagger UI configuration and HTML generation
 */

import {
  generateSwaggerHTML,
  generateCustomSwaggerHTML,
  defaultSwaggerConfig,
  type SwaggerUIConfig,
  type SwaggerUIOptions,
} from '@/lib/api/openapi/swagger-config';

describe('Swagger UI Configuration', () => {
  describe('defaultSwaggerConfig', () => {
    it('should have correct default URL', () => {
      expect(defaultSwaggerConfig.url).toBe('/api/docs');
    });

    it('should have correct DOM ID', () => {
      expect(defaultSwaggerConfig.domId).toBe('#swagger-ui');
    });

    it('should enable deep linking by default', () => {
      expect(defaultSwaggerConfig.deepLinking).toBe(true);
    });

    it('should enable try it out by default', () => {
      expect(defaultSwaggerConfig.tryItOutEnabled).toBe(true);
    });

    it('should persist authorization by default', () => {
      expect(defaultSwaggerConfig.persistAuthorization).toBe(true);
    });

    it('should enable filtering', () => {
      expect(defaultSwaggerConfig.filter).toBe(true);
    });

    it('should enable request snippets', () => {
      expect(defaultSwaggerConfig.requestSnippetsEnabled).toBe(true);
    });

    it('should have correct doc expansion', () => {
      expect(defaultSwaggerConfig.docExpansion).toBe('list');
    });

    it('should have correct syntax highlight theme', () => {
      expect(defaultSwaggerConfig.syntaxHighlight?.theme).toBe('monokai');
    });

    it('should support all HTTP methods', () => {
      expect(defaultSwaggerConfig.supportedSubmitMethods).toContain('get');
      expect(defaultSwaggerConfig.supportedSubmitMethods).toContain('post');
      expect(defaultSwaggerConfig.supportedSubmitMethods).toContain('put');
      expect(defaultSwaggerConfig.supportedSubmitMethods).toContain('delete');
      expect(defaultSwaggerConfig.supportedSubmitMethods).toContain('patch');
    });
  });

  describe('generateSwaggerHTML', () => {
    it('should generate valid HTML', () => {
      const html = generateSwaggerHTML();
      
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html lang="en">');
      expect(html).toContain('</html>');
    });

    it('should include Swagger UI scripts', () => {
      const html = generateSwaggerHTML();
      
      expect(html).toContain('swagger-ui-bundle.js');
      expect(html).toContain('swagger-ui-standalone-preset.js');
    });

    it('should include Swagger UI CSS', () => {
      const html = generateSwaggerHTML();
      
      expect(html).toContain('swagger-ui.css');
    });

    it('should include page title', () => {
      const html = generateSwaggerHTML();
      
      expect(html).toContain('<title>Zyphex Tech API Documentation</title>');
    });

    it('should include custom header', () => {
      const html = generateSwaggerHTML();
      
      expect(html).toContain('Zyphex Tech API Documentation');
      expect(html).toContain('Interactive API documentation');
    });

    it('should include authentication info', () => {
      const html = generateSwaggerHTML();
      
      expect(html).toContain('Authentication');
      expect(html).toContain('Bearer JWT');
    });

    it('should include rate limiting info', () => {
      const html = generateSwaggerHTML();
      
      expect(html).toContain('Rate Limiting');
      expect(html).toContain('Guest:');
      expect(html).toContain('User:');
      expect(html).toContain('Admin:');
      expect(html).toContain('Super Admin:');
    });

    it('should include validation info', () => {
      const html = generateSwaggerHTML();
      
      expect(html).toContain('Validation');
      expect(html).toContain('Zod schemas');
    });

    it('should include response format info', () => {
      const html = generateSwaggerHTML();
      
      expect(html).toContain('Response Format');
      expect(html).toContain('success');
      expect(html).toContain('data');
      expect(html).toContain('error');
      expect(html).toContain('meta');
    });

    it('should include swagger-ui div', () => {
      const html = generateSwaggerHTML();
      
      expect(html).toContain('<div id="swagger-ui"></div>');
    });

    it('should initialize SwaggerUIBundle', () => {
      const html = generateSwaggerHTML();
      
      expect(html).toContain('SwaggerUIBundle');
      expect(html).toContain('window.ui =');
    });

    it('should use default config URL', () => {
      const html = generateSwaggerHTML();
      
      expect(html).toContain('"/api/docs"');
    });

    it('should use custom URL when provided', () => {
      const html = generateSwaggerHTML({ url: '/custom/spec.json' });
      
      expect(html).toContain('"/custom/spec.json"');
    });

    it('should use custom DOM ID when provided', () => {
      const html = generateSwaggerHTML({ domId: '#custom-ui' });
      
      expect(html).toContain('"#custom-ui"');
    });

    it('should respect deepLinking setting', () => {
      const html = generateSwaggerHTML({ deepLinking: false });
      
      expect(html).toContain('deepLinking: false');
    });

    it('should respect tryItOutEnabled setting', () => {
      const html = generateSwaggerHTML({ tryItOutEnabled: false });
      
      expect(html).toContain('tryItOutEnabled: false');
    });

    it('should respect filter setting', () => {
      const html = generateSwaggerHTML({ filter: false });
      
      expect(html).toContain('filter: false');
    });

    it('should respect docExpansion setting', () => {
      const html = generateSwaggerHTML({ docExpansion: 'full' });
      
      expect(html).toContain('"full"');
    });

    it('should include custom CSS styles', () => {
      const html = generateSwaggerHTML();
      
      expect(html).toContain('<style>');
      expect(html).toContain('.custom-header');
      expect(html).toContain('.info-card');
    });

    it('should include gradient header background', () => {
      const html = generateSwaggerHTML();
      
      expect(html).toContain('linear-gradient');
      expect(html).toContain('#667eea');
      expect(html).toContain('#764ba2');
    });

    it('should include badges', () => {
      const html = generateSwaggerHTML();
      
      expect(html).toContain('OpenAPI 3.0');
      expect(html).toContain('187 Tests Passing');
      expect(html).toContain('Enterprise-Grade');
    });

    it('should hide default topbar', () => {
      const html = generateSwaggerHTML();
      
      expect(html).toContain('.swagger-ui .topbar');
      expect(html).toContain('display: none');
    });

    it('should include console log on complete', () => {
      const html = generateSwaggerHTML();
      
      expect(html).toContain('onComplete');
      expect(html).toContain('Swagger UI loaded successfully');
    });

    it('should include presets', () => {
      const html = generateSwaggerHTML();
      
      expect(html).toContain('presets');
      expect(html).toContain('SwaggerUIBundle.presets.apis');
      expect(html).toContain('SwaggerUIStandalonePreset');
    });

    it('should include plugins', () => {
      const html = generateSwaggerHTML();
      
      expect(html).toContain('plugins');
      expect(html).toContain('SwaggerUIBundle.plugins.DownloadUrl');
    });

    it('should use StandaloneLayout', () => {
      const html = generateSwaggerHTML();
      
      expect(html).toContain('layout: "StandaloneLayout"');
    });
  });

  describe('generateCustomSwaggerHTML', () => {
    it('should use default config when no options provided', () => {
      const html = generateCustomSwaggerHTML();
      
      expect(html).toContain('Zyphex Tech API Documentation');
    });

    it('should use custom title when provided', () => {
      const html = generateCustomSwaggerHTML(
        {},
        { title: 'Custom API Documentation' }
      );
      
      expect(html).toContain('<title>Custom API Documentation</title>');
      expect(html).not.toContain('<title>Zyphex Tech API Documentation</title>');
    });

    it('should preserve other content when changing title', () => {
      const html = generateCustomSwaggerHTML(
        {},
        { title: 'Custom Title' }
      );
      
      expect(html).toContain('swagger-ui-bundle.js');
      expect(html).toContain('SwaggerUIBundle');
    });

    it('should support custom config and options together', () => {
      const html = generateCustomSwaggerHTML(
        { url: '/custom/spec.json' },
        { title: 'Custom Title' }
      );
      
      expect(html).toContain('<title>Custom Title</title>');
      expect(html).toContain('"/custom/spec.json"');
    });
  });

  describe('SwaggerUIConfig type', () => {
    it('should accept all valid config properties', () => {
      const config: SwaggerUIConfig = {
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
        supportedSubmitMethods: ['get', 'post'],
        tryItOutEnabled: true,
        requestSnippetsEnabled: true,
        persistAuthorization: true,
        syntaxHighlight: {
          activate: true,
          theme: 'monokai',
        },
      };

      expect(config).toBeDefined();
    });

    it('should accept spec instead of url', () => {
      const config: SwaggerUIConfig = {
        spec: { openapi: '3.0.0' },
      };

      expect(config).toBeDefined();
    });

    it('should accept different docExpansion values', () => {
      const configs: SwaggerUIConfig[] = [
        { docExpansion: 'list' },
        { docExpansion: 'full' },
        { docExpansion: 'none' },
      ];

      expect(configs).toHaveLength(3);
    });

    it('should accept different syntax highlight themes', () => {
      const themes: Array<SwaggerUIConfig['syntaxHighlight']> = [
        { theme: 'agate' },
        { theme: 'arta' },
        { theme: 'monokai' },
        { theme: 'nord' },
        { theme: 'obsidian' },
        { theme: 'tomorrow-night' },
      ];

      expect(themes).toHaveLength(6);
    });
  });

  describe('SwaggerUIOptions type', () => {
    it('should accept all valid option properties', () => {
      const options: SwaggerUIOptions = {
        title: 'Custom Title',
        description: 'Custom Description',
        showTopbar: false,
        customCSS: 'body { background: red; }',
        customJS: 'console.log("custom");',
        oauth: {
          clientId: 'client-123',
          clientSecret: 'secret',
          realm: 'realm',
          appName: 'My App',
          scopeSeparator: ',',
          scopes: ['read', 'write'],
          additionalQueryStringParams: { foo: 'bar' },
          useBasicAuthenticationWithAccessCodeGrant: false,
          usePkceWithAuthorizationCodeGrant: true,
        },
      };

      expect(options).toBeDefined();
    });

    it('should accept partial options', () => {
      const options: SwaggerUIOptions = {
        title: 'Custom Title',
      };

      expect(options).toBeDefined();
    });

    it('should accept empty options', () => {
      const options: SwaggerUIOptions = {};

      expect(options).toBeDefined();
    });
  });
});
