/**
 * CMS Schedule API
 * 
 * @route GET/POST /api/cms/schedules
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import schedulingService, { type ScheduleType } from '@/lib/cms/scheduling-service';
import auditService from '@/lib/cms/audit-service';
import { createAuditContext } from '@/lib/cms/audit-context';
import { z } from 'zod';

// ============================================================================
// Validation Schemas
// ============================================================================

const createScheduleSchema = z.object({
  pageId: z.string().uuid(),
  scheduleType: z.enum(['publish', 'unpublish', 'update']),
  scheduledFor: z.string().datetime(),
  timezone: z.string().optional().default('UTC'),
  contentSnapshot: z.record(z.unknown()).optional(),
});

const querySchedulesSchema = z.object({
  pageId: z.string().uuid().optional(),
  scheduleType: z.enum(['publish', 'unpublish', 'update']).optional(),
  status: z.enum(['pending', 'executed', 'failed', 'cancelled']).optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  timezone: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  orderBy: z.enum(['scheduledFor', 'createdAt']).optional(),
  orderDirection: z.enum(['asc', 'desc']).optional(),
});

// ============================================================================
// GET - List schedules
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

    // Only Super Admin can access schedules
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse and validate query params
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const validatedQuery = querySchedulesSchema.parse(searchParams);

    // List schedules
    const result = await schedulingService.listSchedules({
      pageId: validatedQuery.pageId,
      scheduleType: validatedQuery.scheduleType as ScheduleType | undefined,
      status: validatedQuery.status,
      fromDate: validatedQuery.fromDate ? new Date(validatedQuery.fromDate) : undefined,
      toDate: validatedQuery.toDate ? new Date(validatedQuery.toDate) : undefined,
      timezone: validatedQuery.timezone,
      page: validatedQuery.page,
      limit: validatedQuery.limit,
      orderBy: validatedQuery.orderBy,
      orderDirection: validatedQuery.orderDirection,
    });

    return NextResponse.json({
      success: true,
      data: result.schedules,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });

  } catch (error) {
    console.error('CMS Schedules GET Error:', error);
    
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
        message: 'Failed to fetch schedules',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Create schedule
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only Super Admin can create schedules
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createScheduleSchema.parse(body);

    // Create schedule
    const schedule = await schedulingService.createSchedule({
      pageId: validatedData.pageId,
      scheduleType: validatedData.scheduleType,
      scheduledFor: new Date(validatedData.scheduledFor),
      timezone: validatedData.timezone,
      contentSnapshot: validatedData.contentSnapshot,
      createdBy: session.user.id,
    });

    // Log activity
    const auditContext = await createAuditContext(request);
    await auditService.logAudit({
      action: 'create_page',
      entityType: 'schedule',
      entityId: schedule.id,
      metadata: {
        pageId: validatedData.pageId,
        scheduleType: validatedData.scheduleType,
        scheduledFor: schedule.scheduledFor,
        timezone: validatedData.timezone,
      },
      context: {
        userId: session.user.id,
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Schedule created successfully',
      data: schedule,
    }, { status: 201 });

  } catch (error) {
    console.error('CMS Schedule POST Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation Error',
          message: 'Invalid schedule data',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes('future')) {
      return NextResponse.json(
        { error: 'Bad Request', message: error.message },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Not Found', message: error.message },
        { status: 404 }
      );
    }

    if (error instanceof Error && error.message.includes('already')) {
      return NextResponse.json(
        { error: 'Conflict', message: error.message },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to create schedule',
      },
      { status: 500 }
    );
  }
}
