import {
  generateOpenAPISpec,
  exportOpenAPISpec,
  OpenAPISpec,
} from '@/lib/api/openapi/generator';

describe('generateOpenAPISpec', () => {
  it('should generate basic spec', () => {
    const spec = generateOpenAPISpec({
      title: 'Test API',
      version: '1.0.0',
    });

    expect(spec.openapi).toBe('3.0.0');
    expect(spec.info.title).toBe('Test API');
    expect(spec.info.version).toBe('1.0.0');
  });

  it('should include description', () => {
    const spec = generateOpenAPISpec({
      title: 'Test API',
      version: '1.0.0',
      description: 'This is a test API',
    });

    expect(spec.info.description).toBe('This is a test API');
  });

  it('should include default servers', () => {
    const spec = generateOpenAPISpec({
      title: 'Test API',
      version: '1.0.0',
    });

    expect(spec.servers).toBeDefined();
    expect(spec.servers).toHaveLength(2);
    expect(spec.servers?.[0].url).toBe('http://localhost:3000/api');
    expect(spec.servers?.[1].url).toBe('https://api.zyphextech.com/api');
  });

  it('should accept custom servers', () => {
    const spec = generateOpenAPISpec({
      title: 'Test API',
      version: '1.0.0',
      servers: [
        { url: 'https://custom.example.com/api', description: 'Custom Server' },
      ],
    });

    expect(spec.servers).toHaveLength(1);
    expect(spec.servers?.[0].url).toBe('https://custom.example.com/api');
  });

  it('should include default security schemes', () => {
    const spec = generateOpenAPISpec({
      title: 'Test API',
      version: '1.0.0',
    });

    expect(spec.components?.securitySchemes).toBeDefined();
    expect(spec.components?.securitySchemes?.bearerAuth).toEqual({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'JWT authentication token',
    });
  });

  it('should accept custom security schemes', () => {
    const spec = generateOpenAPISpec({
      title: 'Test API',
      version: '1.0.0',
      securitySchemes: {
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
        },
      },
    });

    expect(spec.components?.securitySchemes?.apiKey).toEqual({
      type: 'apiKey',
      in: 'header',
      name: 'X-API-Key',
    });
  });

  it('should include default tags', () => {
    const spec = generateOpenAPISpec({
      title: 'Test API',
      version: '1.0.0',
    });

    expect(spec.tags).toBeDefined();
    expect(spec.tags?.length).toBeGreaterThan(0);
    
    const tagNames = spec.tags?.map((t) => t.name);
    expect(tagNames).toContain('Authentication');
    expect(tagNames).toContain('Users');
    expect(tagNames).toContain('Teams');
    expect(tagNames).toContain('Projects');
  });

  it('should include component schemas', () => {
    const spec = generateOpenAPISpec({
      title: 'Test API',
      version: '1.0.0',
    });

    expect(spec.components?.schemas).toBeDefined();
    expect(spec.components?.schemas).toHaveProperty('UserCreate');
    expect(spec.components?.schemas).toHaveProperty('TeamCreate');
    expect(spec.components?.schemas).toHaveProperty('ProjectCreate');
    expect(spec.components?.schemas).toHaveProperty('Login');
  });

  it('should include common response schemas', () => {
    const spec = generateOpenAPISpec({
      title: 'Test API',
      version: '1.0.0',
    });

    expect(spec.components?.schemas).toHaveProperty('Error');
    expect(spec.components?.schemas).toHaveProperty('Success');
    expect(spec.components?.schemas).toHaveProperty('PaginatedResponse');
  });

  it('should include common responses', () => {
    const spec = generateOpenAPISpec({
      title: 'Test API',
      version: '1.0.0',
    });

    expect(spec.components?.responses).toBeDefined();
    expect(spec.components?.responses).toHaveProperty('Unauthorized');
    expect(spec.components?.responses).toHaveProperty('Forbidden');
    expect(spec.components?.responses).toHaveProperty('ValidationError');
    expect(spec.components?.responses).toHaveProperty('RateLimitExceeded');
    expect(spec.components?.responses).toHaveProperty('NotFound');
    expect(spec.components?.responses).toHaveProperty('InternalError');
  });

  it('should include example paths', () => {
    const spec = generateOpenAPISpec({
      title: 'Test API',
      version: '1.0.0',
    });

    expect(spec.paths).toBeDefined();
    expect(spec.paths).toHaveProperty('/auth/login');
    expect(spec.paths).toHaveProperty('/users');
  });

  it('should include rate limit information in operations', () => {
    const spec = generateOpenAPISpec({
      title: 'Test API',
      version: '1.0.0',
    });

    const loginOp = spec.paths['/auth/login']?.post;
    expect(loginOp).toBeDefined();
    expect(loginOp?.['x-rate-limit']).toBeDefined();
    expect(loginOp?.['x-rate-limit']?.max).toBeDefined();
    expect(loginOp?.['x-rate-limit']?.windowMs).toBeDefined();
  });

  it('should set global security', () => {
    const spec = generateOpenAPISpec({
      title: 'Test API',
      version: '1.0.0',
    });

    expect(spec.security).toBeDefined();
    expect(spec.security).toEqual([{ bearerAuth: [] }]);
  });

  it('should allow public endpoints without security', () => {
    const spec = generateOpenAPISpec({
      title: 'Test API',
      version: '1.0.0',
    });

    const loginOp = spec.paths['/auth/login']?.post;
    expect(loginOp?.security).toEqual([]);
  });

  it('should include contact information', () => {
    const spec = generateOpenAPISpec({
      title: 'Test API',
      version: '1.0.0',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
        url: 'https://example.com/support',
      },
    });

    expect(spec.info.contact).toEqual({
      name: 'API Support',
      email: 'support@example.com',
      url: 'https://example.com/support',
    });
  });

  it('should include license information', () => {
    const spec = generateOpenAPISpec({
      title: 'Test API',
      version: '1.0.0',
      license: {
        name: 'Apache 2.0',
        url: 'https://www.apache.org/licenses/LICENSE-2.0.html',
      },
    });

    expect(spec.info.license).toEqual({
      name: 'Apache 2.0',
      url: 'https://www.apache.org/licenses/LICENSE-2.0.html',
    });
  });

  it('should include default MIT license', () => {
    const spec = generateOpenAPISpec({
      title: 'Test API',
      version: '1.0.0',
    });

    expect(spec.info.license).toEqual({
      name: 'MIT',
    });
  });
});

describe('exportOpenAPISpec', () => {
  it('should export spec as JSON string', () => {
    const spec: OpenAPISpec = {
      openapi: '3.0.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {},
    };

    const json = exportOpenAPISpec(spec);
    const parsed = JSON.parse(json);

    expect(parsed.openapi).toBe('3.0.0');
    expect(parsed.info.title).toBe('Test API');
  });

  it('should format JSON with indentation', () => {
    const spec: OpenAPISpec = {
      openapi: '3.0.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {},
    };

    const json = exportOpenAPISpec(spec);

    // Check for indentation (2 spaces)
    expect(json).toContain('  "openapi"');
    expect(json).toContain('  "info"');
  });
});
