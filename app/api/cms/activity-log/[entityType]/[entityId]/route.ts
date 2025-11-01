/**
 * CMS Entity Activity Log API Route
 * Retrieve activity logs for a specific entity
 * 
 * @route GET /api/cms/activity-log/[entityType]/[entityId]
 * @access Protected - Requires CMS permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getEntityActivityLogs, ActivityEntityType } from '@/lib/cms/activity-log';
import { z } from 'zod';

const paramsSchema = z.object({
  entityType: z.enum(['page', 'section', 'template', 'media', 'category', 'workflow', 'schedule', 'user', 'system']),
  entityId: z.string()
});

const querySchema = z.object({
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).optional(),
  includeUser: z.string().transform(val => val === 'true').optional()
});

interface RouteParams {
  params: {
    entityType: string;
    entityId: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
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
    const canViewLogs = userRole === 'super-admin';

    if (!canViewLogs) {
      return NextResponse.json(
        { 
          error: 'Forbidden',
          message: 'You do not have permission to view activity logs'
        },
        { status: 403 }
      );
    }

    // Validate params
    const validatedParams = paramsSchema.parse(params);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const validatedQuery = querySchema.parse({
      limit: searchParams.get('limit') || undefined,
      includeUser: searchParams.get('includeUser') || undefined
    });

    // Get entity activity logs
    const logs = await getEntityActivityLogs(
      validatedParams.entityType as ActivityEntityType,
      validatedParams.entityId,
      {
        limit: validatedQuery.limit,
        includeUser: validatedQuery.includeUser
      }
    );

    return NextResponse.json({
      success: true,
      data: logs,
      count: logs.length,
      entityType: validatedParams.entityType,
      entityId: validatedParams.entityId
    });

  } catch (error) {
    console.error('CMS Entity Activity Log Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation Error',
          message: 'Invalid parameters',
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
        message: 'Failed to retrieve entity activity logs'
      },
      { status: 500 }
    );
  }
}
