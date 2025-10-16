import { NextResponse } from 'next/server';
import { withBodyValidation, withQueryValidation, ValidatedRequest } from '@/lib/api/validation';
import { withRateLimit } from '@/lib/api/rate-limit';
import { z } from 'zod';

// Example schemas
const createItemSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  tags: z.array(z.string()).max(5, 'Maximum 5 tags allowed').optional(),
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
});

/**
 * GET /api/example/items
 * 
 * Example route demonstrating:
 * - Query parameter validation with coercion
 * - Rate limiting with default config
 * - Type-safe validated data access
 */
export const GET = withRateLimit()(
  withQueryValidation(listQuerySchema)(
    async (request: ValidatedRequest<z.infer<typeof listQuerySchema>>) => {
      // Access validated query parameters
      const { page, limit, search } = request.validatedData;

      // Mock data (replace with actual database query)
      const items = [
        { id: 1, title: 'Item 1', priority: 'HIGH' },
        { id: 2, title: 'Item 2', priority: 'MEDIUM' },
        { id: 3, title: 'Item 3', priority: 'LOW' },
      ];

      // Filter by search if provided
      const filteredItems = search
        ? items.filter((item) =>
            item.title.toLowerCase().includes(search.toLowerCase())
          )
        : items;

      // Paginate results
      const start = (page - 1) * limit;
      const paginatedItems = filteredItems.slice(start, start + limit);

      return NextResponse.json({
        success: true,
        data: paginatedItems,
        meta: {
          page,
          limit,
          total: filteredItems.length,
          totalPages: Math.ceil(filteredItems.length / limit),
        },
      });
    }
  )
);

/**
 * POST /api/example/items
 * 
 * Example route demonstrating:
 * - Body validation with complex schema
 * - Custom rate limiting (10 requests per minute)
 * - Automatic validation error responses
 * - Type-safe validated data access
 */
export const POST = withRateLimit({
  config: {
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 requests per minute
  },
})(
  withBodyValidation(createItemSchema)(
    async (request: ValidatedRequest<z.infer<typeof createItemSchema>>) => {
      // Access validated body data
      const { title, description, priority, tags } = request.validatedData;

      // Mock item creation (replace with actual database insert)
      const newItem = {
        id: Math.floor(Math.random() * 10000),
        title,
        description: description || null,
        priority,
        tags: tags || [],
        createdAt: new Date().toISOString(),
      };

      return NextResponse.json(
        {
          success: true,
          data: newItem,
          message: 'Item created successfully',
        },
        { status: 201 }
      );
    }
  )
);
