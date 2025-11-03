/**
 * CMS Individual Schedule API
 * 
 * @route GET/PATCH/DELETE /api/cms/schedules/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import schedulingService from '@/lib/cms/scheduling-service';
import auditService from '@/lib/cms/audit-service';
import { createAuditContext } from '@/lib/cms/audit-context';
import { z } from 'zod';

// ============================================================================
// Validation Schema
// ============================================================================

const updateScheduleSchema = z.object({
  scheduledFor: z.string().datetime().optional(),
  timezone: z.string().optional(),
  contentSnapshot: z.record(z.unknown()).optional(),
});

// ============================================================================
// GET - Get schedule by ID
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

    const schedule = await schedulingService.getScheduleById(id);

    if (!schedule) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Schedule not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: schedule,
    });

  } catch (error) {
    console.error('CMS Schedule GET Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to fetch schedule',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH - Update schedule
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only Super Admin can update schedules
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = params;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateScheduleSchema.parse(body);

    // Update schedule
    const schedule = await schedulingService.updateSchedule(id, {
      scheduledFor: validatedData.scheduledFor ? new Date(validatedData.scheduledFor) : undefined,
      timezone: validatedData.timezone,
      contentSnapshot: validatedData.contentSnapshot,
    });

    // Log activity
    const auditContext = await createAuditContext(request);
    await auditService.logAudit({
      action: 'update_page',
      entityType: 'schedule',
      entityId: id,
      metadata: {
        updatedFields: Object.keys(validatedData),
      },
      context: {
        userId: session.user.id,
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Schedule updated successfully',
      data: schedule,
    });

  } catch (error) {
    console.error('CMS Schedule PATCH Error:', error);
    
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

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Not Found', message: error.message },
        { status: 404 }
      );
    }

    if (error instanceof Error && (error.message.includes('pending') || error.message.includes('future'))) {
      return NextResponse.json(
        { error: 'Bad Request', message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to update schedule',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Delete schedule
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only Super Admin can delete schedules
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = params;

    // Get schedule before deletion for audit
    const schedule = await schedulingService.getScheduleById(id);
    if (!schedule) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Schedule not found' },
        { status: 404 }
      );
    }

    // Delete schedule
    await schedulingService.deleteSchedule(id);

    // Log activity
    const auditContext = await createAuditContext(request);
    await auditService.logAudit({
      action: 'delete_page',
      entityType: 'schedule',
      entityId: id,
      metadata: {
        pageId: schedule.pageId,
        scheduleType: schedule.scheduleType,
        scheduledFor: schedule.scheduledFor,
        status: schedule.status,
      },
      context: {
        userId: session.user.id,
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Schedule deleted successfully',
    });

  } catch (error) {
    console.error('CMS Schedule DELETE Error:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Not Found', message: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to delete schedule',
      },
      { status: 500 }
    );
  }
}
