/**
 * Route Extractor Tests
 * Tests for route metadata extraction and documentation generation
 */

import {
  RouteExtractor,
  RouteBuilder,
  route,
  createRouteExtractor,
  type RouteMetadata
} from '../../../lib/api/openapi/route-extractor';

describe('RouteExtractor', () => {
  let extractor: RouteExtractor;

  beforeEach(() => {
    extractor = new RouteExtractor();
  });

  describe('RouteBuilder', () => {
    it('should build a basic route', () => {
      const metadata = route('/api/test', 'GET')
        .summary('Test endpoint')
        .response({ status: 200, description: 'Success' })
        .build();

      expect(metadata.path).toBe('/api/test');
      expect(metadata.method).toBe('GET');
      expect(metadata.summary).toBe('Test endpoint');
      expect(metadata.responses).toHaveLength(1);
    });

    it('should build a route with all properties', () => {
      const metadata = route('/api/users/:id', 'POST')
        .summary('Create user')
        .description('Creates a new user in the system')
        .tags('Users', 'Admin')
        .operationId('createUser')
        .auth(true, ['admin'])
        .rateLimit(true, { guest: 0, user: 0, admin: 5 })
        .parameter({
          name: 'id',
          in: 'path',
          description: 'User ID',
          required: true,
          type: 'string'
        })
        .requestBody({
          description: 'User data',
          required: true,
          contentType: 'application/json'
        })
        .response({ status: 201, description: 'Created' })
        .response({ status: 400, description: 'Bad Request' })
        .deprecated(true)
        .externalDocs('User Guide', 'https://docs.example.com')
        .build();

      expect(metadata.summary).toBe('Create user');
      expect(metadata.description).toBe('Creates a new user in the system');
      expect(metadata.tags).toEqual(['Users', 'Admin']);
      expect(metadata.operationId).toBe('createUser');
      expect(metadata.auth?.required).toBe(true);
      expect(metadata.auth?.roles).toEqual(['admin']);
      expect(metadata.rateLimit?.enabled).toBe(true);
      expect(metadata.parameters).toHaveLength(1);
      expect(metadata.requestBody?.required).toBe(true);
      expect(metadata.responses).toHaveLength(2);
      expect(metadata.deprecated).toBe(true);
      expect(metadata.externalDocs).toBeDefined();
    });

    it('should throw error if summary is missing', () => {
      const builder = route('/api/test', 'GET');
      expect(() => builder.build()).toThrow('Route must have a summary');
    });

    it('should throw error if no responses', () => {
      const builder = route('/api/test', 'GET').summary('Test');
      builder['metadata'].responses = [];
      expect(() => builder.build()).toThrow('Route must have at least one response');
    });
  });

  describe('addRoute', () => {
    it('should add a single route', () => {
      const metadata: RouteMetadata = {
        path: '/api/test',
        method: 'GET',
        summary: 'Test',
        responses: [{ status: 200, description: 'Success' }]
      };

      extractor.addRoute(metadata);
      expect(extractor.getRoutes()).toHaveLength(1);
    });

    it('should add multiple routes to same path', () => {
      extractor.addRoute({
        path: '/api/test',
        method: 'GET',
        summary: 'Get test',
        responses: [{ status: 200, description: 'Success' }]
      });

      extractor.addRoute({
        path: '/api/test',
        method: 'POST',
        summary: 'Create test',
        responses: [{ status: 201, description: 'Created' }]
      });

      expect(extractor.getRoutesByPath('/api/test')).toHaveLength(2);
    });
  });

  describe('addRoutes', () => {
    it('should add multiple routes at once', () => {
      const routes: RouteMetadata[] = [
        {
          path: '/api/test1',
          method: 'GET',
          summary: 'Test 1',
          responses: [{ status: 200, description: 'Success' }]
        },
        {
          path: '/api/test2',
          method: 'POST',
          summary: 'Test 2',
          responses: [{ status: 201, description: 'Created' }]
        }
      ];

      extractor.addRoutes(routes);
      expect(extractor.getRoutes()).toHaveLength(2);
    });
  });

  describe('getRoutesByTag', () => {
    beforeEach(() => {
      extractor.addRoutes([
        {
          path: '/api/users',
          method: 'GET',
          summary: 'Get users',
          tags: ['Users', 'Public'],
          responses: [{ status: 200, description: 'Success' }]
        },
        {
          path: '/api/posts',
          method: 'GET',
          summary: 'Get posts',
          tags: ['Posts', 'Public'],
          responses: [{ status: 200, description: 'Success' }]
        },
        {
          path: '/api/admin',
          method: 'GET',
          summary: 'Admin endpoint',
          tags: ['Admin'],
          responses: [{ status: 200, description: 'Success' }]
        }
      ]);
    });

    it('should get routes by tag', () => {
      const publicRoutes = extractor.getRoutesByTag('Public');
      expect(publicRoutes).toHaveLength(2);
    });

    it('should return empty array for non-existent tag', () => {
      const routes = extractor.getRoutesByTag('NonExistent');
      expect(routes).toHaveLength(0);
    });
  });

  describe('getRoutesByMethod', () => {
    beforeEach(() => {
      extractor.addRoutes([
        {
          path: '/api/test1',
          method: 'GET',
          summary: 'Test 1',
          responses: [{ status: 200, description: 'Success' }]
        },
        {
          path: '/api/test2',
          method: 'GET',
          summary: 'Test 2',
          responses: [{ status: 200, description: 'Success' }]
        },
        {
          path: '/api/test3',
          method: 'POST',
          summary: 'Test 3',
          responses: [{ status: 201, description: 'Created' }]
        }
      ]);
    });

    it('should get routes by method', () => {
      const getRoutes = extractor.getRoutesByMethod('GET');
      expect(getRoutes).toHaveLength(2);
    });

    it('should return empty array for unused method', () => {
      const deleteRoutes = extractor.getRoutesByMethod('DELETE');
      expect(deleteRoutes).toHaveLength(0);
    });
  });

  describe('toMarkdown', () => {
    beforeEach(() => {
      extractor.addRoutes([
        {
          path: '/api/users',
          method: 'GET',
          summary: 'Get all users',
          description: 'Retrieves a paginated list of users',
          tags: ['Users'],
          auth: { required: false },
          rateLimit: { enabled: true, multiplier: { guest: 1, user: 2 } },
          parameters: [
            {
              name: 'page',
              in: 'query',
              description: 'Page number',
              required: false,
              type: 'number',
              example: 1
            }
          ],
          responses: [
            { status: 200, description: 'Success', contentType: 'application/json' },
            { status: 400, description: 'Bad Request' }
          ]
        },
        {
          path: '/api/users',
          method: 'POST',
          summary: 'Create user',
          description: 'Creates a new user',
          tags: ['Users'],
          auth: { required: true, roles: ['admin'] },
          rateLimit: { enabled: true },
          requestBody: {
            description: 'User data',
            required: true,
            contentType: 'application/json'
          },
          responses: [
            { status: 201, description: 'Created' },
            { status: 401, description: 'Unauthorized' }
          ],
          deprecated: true
        }
      ]);
    });

    it('should generate markdown documentation', () => {
      const markdown = extractor.toMarkdown();

      expect(markdown).toContain('# API Routes Documentation');
      expect(markdown).toContain('## Users');
      expect(markdown).toContain('### GET /api/users');
      expect(markdown).toContain('### POST /api/users');
    });

    it('should include route summaries', () => {
      const markdown = extractor.toMarkdown();

      expect(markdown).toContain('**Get all users**');
      expect(markdown).toContain('**Create user**');
    });

    it('should include descriptions', () => {
      const markdown = extractor.toMarkdown();

      expect(markdown).toContain('Retrieves a paginated list of users');
      expect(markdown).toContain('Creates a new user');
    });

    it('should include authentication info', () => {
      const markdown = extractor.toMarkdown();

      expect(markdown).toContain('**Authentication**: Not required');
      expect(markdown).toContain('**Authentication**: Required (admin)');
    });

    it('should include rate limiting info', () => {
      const markdown = extractor.toMarkdown();

      expect(markdown).toContain('**Rate Limiting**');
      expect(markdown).toContain('Guest: 1x');
      expect(markdown).toContain('User: 2x');
    });

    it('should include parameters', () => {
      const markdown = extractor.toMarkdown();

      expect(markdown).toContain('**Parameters**');
      expect(markdown).toContain('`page`');
      expect(markdown).toContain('Page number');
      expect(markdown).toContain('Example: `1`');
    });

    it('should include request body', () => {
      const markdown = extractor.toMarkdown();

      expect(markdown).toContain('**Request Body**: (required)');
      expect(markdown).toContain('User data');
      expect(markdown).toContain('Content-Type: `application/json`');
    });

    it('should include responses', () => {
      const markdown = extractor.toMarkdown();

      expect(markdown).toContain('**Responses**');
      expect(markdown).toContain('`200`: Success');
      expect(markdown).toContain('`201`: Created');
      expect(markdown).toContain('`400`: Bad Request');
      expect(markdown).toContain('`401`: Unauthorized');
    });

    it('should mark deprecated endpoints', () => {
      const markdown = extractor.toMarkdown();

      expect(markdown).toContain('⚠️ **DEPRECATED**');
    });

    it('should include total route count', () => {
      const markdown = extractor.toMarkdown();

      expect(markdown).toContain('**Total Routes**: 2');
    });

    it('should include timestamp', () => {
      const markdown = extractor.toMarkdown();

      expect(markdown).toContain('**Last Generated**:');
      expect(markdown).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('groups', () => {
    it('should create a group', () => {
      extractor.createGroup('Auth', 'Authentication endpoints');
      const group = extractor.getGroup('Auth');

      expect(group).toBeDefined();
      expect(group?.name).toBe('Auth');
      expect(group?.description).toBe('Authentication endpoints');
      expect(group?.routes).toHaveLength(0);
    });

    it('should add routes to a group', () => {
      extractor.createGroup('Users');
      extractor.addToGroup('Users', [
        {
          path: '/api/users',
          method: 'GET',
          summary: 'Get users',
          responses: [{ status: 200, description: 'Success' }]
        }
      ]);

      const group = extractor.getGroup('Users');
      expect(group?.routes).toHaveLength(1);
    });

    it('should create group if it does not exist', () => {
      extractor.addToGroup('NewGroup', [
        {
          path: '/api/test',
          method: 'GET',
          summary: 'Test',
          responses: [{ status: 200, description: 'Success' }]
        }
      ]);

      const group = extractor.getGroup('NewGroup');
      expect(group).toBeDefined();
    });

    it('should get all groups', () => {
      extractor.createGroup('Group1');
      extractor.createGroup('Group2');

      const groups = extractor.getGroups();
      expect(groups).toHaveLength(2);
    });
  });

  describe('clear', () => {
    it('should clear all routes and groups', () => {
      extractor.addRoute({
        path: '/api/test',
        method: 'GET',
        summary: 'Test',
        responses: [{ status: 200, description: 'Success' }]
      });
      extractor.createGroup('Test');

      extractor.clear();

      expect(extractor.getRoutes()).toHaveLength(0);
      expect(extractor.getGroups()).toHaveLength(0);
    });
  });
});

describe('Helper functions', () => {
  it('should create route extractor', () => {
    const extractor = createRouteExtractor();
    expect(extractor).toBeInstanceOf(RouteExtractor);
  });

  it('should create route builder', () => {
    const builder = route('/api/test', 'GET');
    expect(builder).toBeInstanceOf(RouteBuilder);
  });
});
