/**
 * CMS Activity Logs API Route
 * Query and retrieve audit trail for CMS operations
 * 
 * @route /api/cms/activity-logs
 * @access Protected - Requires Super Admin
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/cms/authorization';
import { 
  getAuditLogs,
  getAuditLogCount,
  getEntityTimeline,
  getUserActivitySummary,
  getRecentActivity,
  type AuditAction,
  type EntityType,
} from '@/lib/cms/audit-service';
import { z } from 'zod';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const querySchema = z.object({
  // Filters
  userId: z.string().optional(),
  action: z.string().or(z.array(z.string())).optional(),
  entityType: z.string().or(z.array(z.string())).optional(),
  entityId: z.string().optional(),
  
  // Date range
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  
  // Pagination
  page: z.string().transform(Number).pipe(z.number().int().positive()).optional(),
  limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional(),
  
  // Query type
  queryType: z.enum(['list', 'count', 'timeline', 'summary', 'recent']).optional().default('list'),
});

// ============================================================================
// GET - Query audit logs
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Require activity view permission
    await requirePermission('cms.activity.view');

    const searchParams = request.nextUrl.searchParams;
    const rawParams = Object.fromEntries(searchParams.entries());
    
    const validated = querySchema.parse(rawParams);

    // Calculate offset from page number
    const limit = validated.limit || 50;
    const page = validated.page || 1;
    const offset = (page - 1) * limit;

    // Parse date strings
    const startDate = validated.startDate ? new Date(validated.startDate) : undefined;
    const endDate = validated.endDate ? new Date(validated.endDate) : undefined;

    // Parse action and entityType (can be comma-separated strings)
    let action: AuditAction | AuditAction[] | undefined;
    if (validated.action) {
      if (Array.isArray(validated.action)) {
        action = validated.action as AuditAction[];
      } else if (typeof validated.action === 'string' && validated.action.includes(',')) {
        action = validated.action.split(',') as AuditAction[];
      } else {
        action = validated.action as AuditAction;
      }
    }

    let entityType: EntityType | EntityType[] | undefined;
    if (validated.entityType) {
      if (Array.isArray(validated.entityType)) {
        entityType = validated.entityType as EntityType[];
      } else if (typeof validated.entityType === 'string' && validated.entityType.includes(',')) {
        entityType = validated.entityType.split(',') as EntityType[];
      } else {
        entityType = validated.entityType as EntityType;
      }
    }

    // Handle different query types
    switch (validated.queryType) {
      case 'count': {
        const count = await getAuditLogCount({
          userId: validated.userId,
          action,
          entityType,
          entityId: validated.entityId,
          startDate,
          endDate,
        });

        return NextResponse.json({
          success: true,
          data: { count },
        });
      }

      case 'timeline': {
        if (!validated.entityType || !validated.entityId) {
          return NextResponse.json(
            { 
              error: 'Bad Request',
              message: 'entityType and entityId are required for timeline query',
            },
            { status: 400 }
          );
        }

        const timeline = await getEntityTimeline(
          validated.entityType as EntityType,
          validated.entityId,
          limit
        );

        return NextResponse.json({
          success: true,
          data: timeline,
        });
      }

      case 'summary': {
        if (!validated.userId) {
          return NextResponse.json(
            { 
              error: 'Bad Request',
              message: 'userId is required for summary query',
            },
            { status: 400 }
          );
        }

        const summary = await getUserActivitySummary(
          validated.userId,
          startDate,
          endDate
        );

        return NextResponse.json({
          success: true,
          data: summary,
        });
      }

      case 'recent': {
        const recent = await getRecentActivity(limit);

        return NextResponse.json({
          success: true,
          data: recent,
        });
      }

      case 'list':
      default: {
        const [logs, totalCount] = await Promise.all([
          getAuditLogs({
            userId: validated.userId,
            action,
            entityType,
            entityId: validated.entityId,
            startDate,
            endDate,
            limit,
            offset,
          }),
          getAuditLogCount({
            userId: validated.userId,
            action,
            entityType,
            entityId: validated.entityId,
            startDate,
            endDate,
          }),
        ]);

        const totalPages = Math.ceil(totalCount / limit);

        return NextResponse.json({
          success: true,
          data: logs,
          pagination: {
            page,
            limit,
            totalCount,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
          },
        });
      }
    }

  } catch (error) {
    console.error('Activity Logs GET Error:', error);
    
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
        message: 'Failed to fetch activity logs',
      },
      { status: 500 }
    );
  }
}
