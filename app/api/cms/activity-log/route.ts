/**
 * CMS Activity Log API Route
 * Retrieve activity logs with filtering and pagination
 * 
 * @route GET /api/cms/activity-log
 * @access Protected - Requires CMS permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  getActivityLogs, 
  getActivityStats,
  exportActivityLogs,
  ActivityLogFilters 
} from '@/lib/cms/activity-log';
import { z } from 'zod';

const querySchema = z.object({
  // Filters
  userId: z.string().optional(),
  action: z.union([z.string(), z.array(z.string())]).optional(),
  entityType: z.union([z.string(), z.array(z.string())]).optional(),
  entityId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  ipAddress: z.string().optional(),
  search: z.string().optional(),
  
  // Pagination
  page: z.string().transform(Number).pipe(z.number().int().min(1)).optional(),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).optional(),
  
  // Sorting
  sortBy: z.enum(['createdAt', 'action', 'entityType']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  
  // Options
  includeUser: z.string().transform(val => val === 'true').optional(),
  
  // Special modes
  mode: z.enum(['list', 'stats', 'export']).optional()
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in' },
        { status: 401 }
      );
    }

    // Check CMS permissions
    const userRole = session.user.role;
    const canViewLogs = ['admin', 'super_admin'].includes(userRole);

    if (!canViewLogs) {
      return NextResponse.json(
        { 
          error: 'Forbidden',
          message: 'You do not have permission to view activity logs'
        },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryObject: Record<string, string | string[]> = {};
    
    searchParams.forEach((value, key) => {
      const existing = queryObject[key];
      if (existing) {
        queryObject[key] = Array.isArray(existing) 
          ? [...existing, value] 
          : [existing, value];
      } else {
        queryObject[key] = value;
      }
    });

    const validatedQuery = querySchema.parse(queryObject);

    // Build filters
    const filters: ActivityLogFilters = {};
    if (validatedQuery.userId) filters.userId = validatedQuery.userId;
    if (validatedQuery.action) filters.action = validatedQuery.action;
    if (validatedQuery.entityType) filters.entityType = validatedQuery.entityType;
    if (validatedQuery.entityId) filters.entityId = validatedQuery.entityId;
    if (validatedQuery.startDate) filters.startDate = new Date(validatedQuery.startDate);
    if (validatedQuery.endDate) filters.endDate = new Date(validatedQuery.endDate);
    if (validatedQuery.ipAddress) filters.ipAddress = validatedQuery.ipAddress;
    if (validatedQuery.search) filters.search = validatedQuery.search;

    const mode = validatedQuery.mode || 'list';

    // Handle different modes
    switch (mode) {
      case 'stats':
        const stats = await getActivityStats(filters);
        return NextResponse.json({
          success: true,
          data: stats
        });

      case 'export':
        const exportData = await exportActivityLogs(filters);
        return NextResponse.json({
          success: true,
          data: exportData,
          count: exportData.length
        });

      case 'list':
      default:
        const result = await getActivityLogs(filters, {
          page: validatedQuery.page,
          limit: validatedQuery.limit,
          sortBy: validatedQuery.sortBy,
          sortOrder: validatedQuery.sortOrder,
          includeUser: validatedQuery.includeUser
        });

        return NextResponse.json({
          success: true,
          data: result.logs,
          pagination: result.pagination,
          filters: result.filters
        });
    }

  } catch (error) {
    console.error('CMS Activity Log Error:', error);
    
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

    if (error instanceof Error) {
      return NextResponse.json(
        { 
          error: 'Internal Server Error',
          message: error.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to retrieve activity logs'
      },
      { status: 500 }
    );
  }
}
