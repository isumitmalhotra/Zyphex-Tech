/**
 * API Documentation Routes Tests
 * 
 * Tests for the /api/docs and /api/docs/swagger-ui endpoints
 */

import { GET as getDocsSpec, OPTIONS as optionsDocsSpec } from '@/app/api/docs/route';
import { GET as getSwaggerUI, OPTIONS as optionsSwaggerUI } from '@/app/api/docs/swagger-ui/route';

describe('API Documentation Routes', () => {
  describe('GET /api/docs', () => {
    it('should return 200 status', async () => {
      const response = await getDocsSpec();
      
      expect(response.status).toBe(200);
    });

    it('should return JSON content type', async () => {
      const response = await getDocsSpec();
      
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('should return valid OpenAPI spec', async () => {
      const response = await getDocsSpec();
      const text = await response.text();
      const spec = JSON.parse(text);
      
      expect(spec.openapi).toBe('3.0.0');
      expect(spec.info).toBeDefined();
      expect(spec.info.title).toBe('Zyphex Tech API');
      expect(spec.info.version).toBe('1.0.0');
    });

    it('should include paths', async () => {
      const response = await getDocsSpec();
      const text = await response.text();
      const spec = JSON.parse(text);
      
      expect(spec.paths).toBeDefined();
      expect(typeof spec.paths).toBe('object');
    });

    it('should include components', async () => {
      const response = await getDocsSpec();
      const text = await response.text();
      const spec = JSON.parse(text);
      
      expect(spec.components).toBeDefined();
      expect(spec.components.schemas).toBeDefined();
    });

    it('should include security schemes', async () => {
      const response = await getDocsSpec();
      const text = await response.text();
      const spec = JSON.parse(text);
      
      expect(spec.components.securitySchemes).toBeDefined();
      expect(spec.components.securitySchemes.bearerAuth).toBeDefined();
    });

    it('should include servers', async () => {
      const response = await getDocsSpec();
      const text = await response.text();
      const spec = JSON.parse(text);
      
      expect(spec.servers).toBeDefined();
      expect(Array.isArray(spec.servers)).toBe(true);
      expect(spec.servers.length).toBeGreaterThan(0);
    });

    it('should include development server', async () => {
      const response = await getDocsSpec();
      const text = await response.text();
      const spec = JSON.parse(text);
      
      const devServer = spec.servers.find((s: { url: string }) => 
        s.url.includes('localhost')
      );
      
      expect(devServer).toBeDefined();
      expect(devServer.description).toContain('Development');
    });

    it('should include production server', async () => {
      const response = await getDocsSpec();
      const text = await response.text();
      const spec = JSON.parse(text);
      
      const prodServer = spec.servers.find((s: { url: string }) => 
        s.url.includes('api.zyphextech.com')
      );
      
      expect(prodServer).toBeDefined();
      expect(prodServer.description).toContain('Production');
    });

    it('should include staging server', async () => {
      const response = await getDocsSpec();
      const text = await response.text();
      const spec = JSON.parse(text);
      
      const stagingServer = spec.servers.find((s: { url: string }) => 
        s.url.includes('staging')
      );
      
      expect(stagingServer).toBeDefined();
      expect(stagingServer.description).toContain('Staging');
    });

    it('should include contact information', async () => {
      const response = await getDocsSpec();
      const text = await response.text();
      const spec = JSON.parse(text);
      
      expect(spec.info.contact).toBeDefined();
      expect(spec.info.contact.name).toBe('Zyphex Tech API Support');
      expect(spec.info.contact.email).toBe('support@zyphextech.com');
    });

    it('should include license information', async () => {
      const response = await getDocsSpec();
      const text = await response.text();
      const spec = JSON.parse(text);
      
      expect(spec.info.license).toBeDefined();
      expect(spec.info.license.name).toBe('MIT');
    });

    it('should include description', async () => {
      const response = await getDocsSpec();
      const text = await response.text();
      const spec = JSON.parse(text);
      
      expect(spec.info.description).toBeDefined();
      expect(spec.info.description).toContain('Zyphex Tech');
    });

    it('should include rate limiting info in description', async () => {
      const response = await getDocsSpec();
      const text = await response.text();
      const spec = JSON.parse(text);
      
      expect(spec.info.description).toContain('Rate Limit');
    });

    it('should include response format info in description', async () => {
      const response = await getDocsSpec();
      const text = await response.text();
      const spec = JSON.parse(text);
      
      expect(spec.info.description).toContain('Response Format');
    });

    it('should include error codes info in description', async () => {
      const response = await getDocsSpec();
      const text = await response.text();
      const spec = JSON.parse(text);
      
      expect(spec.info.description).toContain('Error Codes');
    });

    it('should set cache control headers', async () => {
      const response = await getDocsSpec();
      
      const cacheControl = response.headers.get('Cache-Control');
      expect(cacheControl).toBeDefined();
      expect(cacheControl).toContain('max-age');
    });

    it('should set CORS headers', async () => {
      const response = await getDocsSpec();
      
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET');
    });

    it('should return valid JSON', async () => {
      const response = await getDocsSpec();
      const text = await response.text();
      
      expect(() => JSON.parse(text)).not.toThrow();
    });
  });

  describe('OPTIONS /api/docs', () => {
    it('should return 204 status', async () => {
      const response = await optionsDocsSpec();
      
      expect(response.status).toBe(204);
    });

    it('should include CORS headers', async () => {
      const response = await optionsDocsSpec();
      
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('OPTIONS');
    });

    it('should include max age header', async () => {
      const response = await optionsDocsSpec();
      
      expect(response.headers.get('Access-Control-Max-Age')).toBe('86400');
    });
  });

  describe('GET /api/docs/swagger-ui', () => {
    it('should return 200 status', async () => {
      const response = await getSwaggerUI();
      
      expect(response.status).toBe(200);
    });

    it('should return HTML content type', async () => {
      const response = await getSwaggerUI();
      
      expect(response.headers.get('Content-Type')).toContain('text/html');
    });

    it('should return valid HTML', async () => {
      const response = await getSwaggerUI();
      const html = await response.text();
      
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html');
      expect(html).toContain('</html>');
    });

    it('should include Swagger UI scripts', async () => {
      const response = await getSwaggerUI();
      const html = await response.text();
      
      expect(html).toContain('swagger-ui-bundle.js');
      expect(html).toContain('swagger-ui-standalone-preset.js');
    });

    it('should include Swagger UI CSS', async () => {
      const response = await getSwaggerUI();
      const html = await response.text();
      
      expect(html).toContain('swagger-ui.css');
    });

    it('should include page title', async () => {
      const response = await getSwaggerUI();
      const html = await response.text();
      
      expect(html).toContain('<title>');
      expect(html).toContain('API Documentation');
    });

    it('should include custom header', async () => {
      const response = await getSwaggerUI();
      const html = await response.text();
      
      expect(html).toContain('Zyphex Tech API Documentation');
    });

    it('should include swagger-ui div', async () => {
      const response = await getSwaggerUI();
      const html = await response.text();
      
      expect(html).toContain('id="swagger-ui"');
    });

    it('should initialize SwaggerUIBundle', async () => {
      const response = await getSwaggerUI();
      const html = await response.text();
      
      expect(html).toContain('SwaggerUIBundle');
      expect(html).toContain('window.ui');
    });

    it('should reference OpenAPI spec URL', async () => {
      const response = await getSwaggerUI();
      const html = await response.text();
      
      expect(html).toContain('/api/docs');
    });

    it('should include authentication info', async () => {
      const response = await getSwaggerUI();
      const html = await response.text();
      
      expect(html).toContain('Authentication');
      expect(html).toContain('Bearer');
    });

    it('should include rate limiting info', async () => {
      const response = await getSwaggerUI();
      const html = await response.text();
      
      expect(html).toContain('Rate Limiting');
    });

    it('should include validation info', async () => {
      const response = await getSwaggerUI();
      const html = await response.text();
      
      expect(html).toContain('Validation');
    });

    it('should include response format info', async () => {
      const response = await getSwaggerUI();
      const html = await response.text();
      
      expect(html).toContain('Response Format');
    });

    it('should set cache control headers', async () => {
      const response = await getSwaggerUI();
      
      const cacheControl = response.headers.get('Cache-Control');
      expect(cacheControl).toBeDefined();
      expect(cacheControl).toContain('max-age');
    });

    it('should set security headers', async () => {
      const response = await getSwaggerUI();
      
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
      expect(response.headers.get('X-XSS-Protection')).toContain('1');
    });

    it('should include custom styling', async () => {
      const response = await getSwaggerUI();
      const html = await response.text();
      
      expect(html).toContain('<style>');
      expect(html).toContain('.custom-header');
    });

    it('should include gradient background', async () => {
      const response = await getSwaggerUI();
      const html = await response.text();
      
      expect(html).toContain('linear-gradient');
    });

    it('should include info cards', async () => {
      const response = await getSwaggerUI();
      const html = await response.text();
      
      expect(html).toContain('info-card');
    });

    it('should enable deep linking', async () => {
      const response = await getSwaggerUI();
      const html = await response.text();
      
      expect(html).toContain('deepLinking: true');
    });

    it('should enable try it out', async () => {
      const response = await getSwaggerUI();
      const html = await response.text();
      
      expect(html).toContain('tryItOutEnabled: true');
    });

    it('should enable filtering', async () => {
      const response = await getSwaggerUI();
      const html = await response.text();
      
      expect(html).toContain('filter: true');
    });

    it('should persist authorization', async () => {
      const response = await getSwaggerUI();
      const html = await response.text();
      
      expect(html).toContain('persistAuthorization: true');
    });

    it('should enable request snippets', async () => {
      const response = await getSwaggerUI();
      const html = await response.text();
      
      expect(html).toContain('requestSnippetsEnabled: true');
    });
  });

  describe('OPTIONS /api/docs/swagger-ui', () => {
    it('should return 204 status', async () => {
      const response = await optionsSwaggerUI();
      
      expect(response.status).toBe(204);
    });

    it('should include CORS headers', async () => {
      const response = await optionsSwaggerUI();
      
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET');
    });

    it('should include max age header', async () => {
      const response = await optionsSwaggerUI();
      
      expect(response.headers.get('Access-Control-Max-Age')).toBe('86400');
    });
  });
});
