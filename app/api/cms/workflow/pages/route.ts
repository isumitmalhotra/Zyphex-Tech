/**
 * CMS Workflow Pages API
 * Get pages by workflow status
 * 
 * @route GET /api/cms/workflow/pages
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import workflowService, { type WorkflowStatus } from '@/lib/cms/workflow-service';
import { z } from 'zod';

// ============================================================================
// Validation Schema
// ============================================================================

const querySchema = z.object({
  status: z.enum(['draft', 'review', 'approved', 'published', 'archived']),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  orderBy: z.enum(['createdAt', 'updatedAt', 'title']).optional(),
  orderDirection: z.enum(['asc', 'desc']).optional(),
});

// ============================================================================
// GET - Get pages by workflow status
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only Super Admin can access workflow pages
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse and validate query params
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const validatedQuery = querySchema.parse(searchParams);

    // Get pages by status
    const result = await workflowService.getPagesByStatus(
      validatedQuery.status as WorkflowStatus,
      {
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        orderBy: validatedQuery.orderBy,
        orderDirection: validatedQuery.orderDirection,
      }
    );

    return NextResponse.json({
      success: true,
      data: result.pages,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });

  } catch (error) {
    console.error('CMS Workflow Pages Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation Error',
          message: 'Invalid query parameters',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to fetch workflow pages',
      },
      { status: 500 }
    );
  }
}
