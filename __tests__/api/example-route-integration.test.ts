import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/example/items/route';

describe('/api/example/items', () => {
  describe('GET /api/example/items', () => {
    it('should return items with default pagination', async () => {
      const request = new NextRequest('http://localhost:3000/api/example/items');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeInstanceOf(Array);
      expect(data.meta).toEqual({
        page: 1,
        limit: 10,
        total: expect.any(Number),
        totalPages: expect.any(Number),
      });
    });

    it('should validate and coerce page query parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/example/items?page=2');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.meta.page).toBe(2);
    });

    it('should validate and coerce limit query parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/example/items?limit=5');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.meta.limit).toBe(5);
    });

    it('should reject invalid page parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/example/items?page=0');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VAL_001'); // Validation failed
    });

    it('should reject limit exceeding maximum', async () => {
      const request = new NextRequest('http://localhost:3000/api/example/items?limit=200');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VAL_001');
    });

    it('should filter items by search query', async () => {
      const request = new NextRequest('http://localhost:3000/api/example/items?search=Item%201');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].title).toContain('Item 1');
    });

    it('should include rate limit headers', async () => {
      const request = new NextRequest('http://localhost:3000/api/example/items');
      const response = await GET(request);

      expect(response.headers.has('X-RateLimit-Limit')).toBe(true);
      expect(response.headers.has('X-RateLimit-Remaining')).toBe(true);
      expect(response.headers.has('X-RateLimit-Reset')).toBe(true);
    });
  });

  describe('POST /api/example/items', () => {
    it('should create item with valid data', async () => {
      const validData = {
        title: 'New Item',
        description: 'Test description',
        priority: 'HIGH',
        tags: ['test', 'example'],
      };

      const request = new NextRequest('http://localhost:3000/api/example/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.title).toBe(validData.title);
      expect(data.data.description).toBe(validData.description);
      expect(data.data.priority).toBe(validData.priority);
      expect(data.data.tags).toEqual(validData.tags);
      expect(data.message).toBe('Item created successfully');
    });

    it('should create item without optional fields', async () => {
      const minimalData = {
        title: 'Minimal Item',
        priority: 'MEDIUM',
      };

      const request = new NextRequest('http://localhost:3000/api/example/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(minimalData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.description).toBeNull();
      expect(data.data.tags).toEqual([]);
    });

    it('should reject title shorter than 3 characters', async () => {
      const invalidData = {
        title: 'AB',
        priority: 'HIGH',
      };

      const request = new NextRequest('http://localhost:3000/api/example/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VAL_001');
      expect(data.error.details).toBeDefined();
      expect(data.error.details[0].field).toBe('title');
      expect(data.error.details[0].message).toContain('at least 3 characters');
    });

    it('should reject missing required fields', async () => {
      const invalidData = {
        description: 'Only description',
      };

      const request = new NextRequest('http://localhost:3000/api/example/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.details).toHaveLength(2); // title and priority missing
    });

    it('should reject invalid priority value', async () => {
      const invalidData = {
        title: 'Test Item',
        priority: 'INVALID',
      };

      const request = new NextRequest('http://localhost:3000/api/example/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.details[0].field).toBe('priority');
    });

    it('should reject more than 5 tags', async () => {
      const invalidData = {
        title: 'Test Item',
        priority: 'HIGH',
        tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6'],
      };

      const request = new NextRequest('http://localhost:3000/api/example/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.details[0].message).toContain('Maximum 5 tags allowed');
    });

    it('should include custom rate limit headers (10 req/min)', async () => {
      const validData = {
        title: 'Test Item',
        priority: 'HIGH',
      };

      const request = new NextRequest('http://localhost:3000/api/example/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validData),
      });

      const response = await POST(request);

      expect(response.headers.get('X-RateLimit-Limit')).toBe('10');
      expect(response.headers.has('X-RateLimit-Remaining')).toBe(true);
      expect(response.headers.has('X-RateLimit-Reset')).toBe(true);
    });

    it('should enforce rate limit (11th request should fail)', async () => {
      const validData = {
        title: 'Test Item',
        priority: 'HIGH',
      };

      // Make 10 requests (using up the limit)
      for (let i = 0; i < 10; i++) {
        const request = new NextRequest('http://localhost:3000/api/example/items', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-forwarded-for': 'test-ip',
          },
          body: JSON.stringify(validData),
        });

        await POST(request);
      }

      // 11th request should be rate limited
      const request = new NextRequest('http://localhost:3000/api/example/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': 'test-ip',
        },
        body: JSON.stringify(validData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('RATE_001');
      expect(response.headers.has('Retry-After')).toBe(true);
    });
  });
});
