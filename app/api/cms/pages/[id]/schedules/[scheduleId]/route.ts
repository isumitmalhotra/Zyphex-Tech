/**
 * CMS Schedule API Route
 * Update, delete, or cancel individual schedule
 * 
 * @route PATCH/DELETE /api/cms/pages/[id]/schedules/[scheduleId]
 * @access Protected - Requires CMS permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateScheduleSchema = z.object({
  scheduleType: z.enum(['publish', 'unpublish', 'update']).optional(),
  scheduledFor: z.string().datetime().optional(),
  timezone: z.string().optional(),
  contentSnapshot: z.any().optional(),
});

interface RouteParams {
  params: {
    id: string;
    scheduleId: string;
  };
}

export async function PATCH(
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

    const { id: pageId, scheduleId } = params;

    const schedule = await prisma.cmsSchedule.findFirst({
      where: {
        id: scheduleId,
        pageId: pageId,
      },
    });

    if (!schedule) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Schedule not found' },
        { status: 404 }
      );
    }

    if (schedule.status !== 'pending') {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Cannot update a non-pending schedule' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateScheduleSchema.parse(body);

    // Validate scheduled time is in the future if provided
    if (validatedData.scheduledFor) {
      const scheduledDate = new Date(validatedData.scheduledFor);
      if (scheduledDate <= new Date()) {
        return NextResponse.json(
          { 
            error: 'Validation Error',
            message: 'Scheduled time must be in the future',
          },
          { status: 400 }
        );
      }
    }

    const updatedSchedule = await prisma.cmsSchedule.update({
      where: { id: scheduleId },
      data: {
        ...validatedData,
        scheduledFor: validatedData.scheduledFor ? new Date(validatedData.scheduledFor) : undefined,
      },
    });

    // Log activity
    await prisma.cmsActivityLog.create({
      data: {
        userId: session.user.id,
        action: 'update_schedule',
        entityType: 'page',
        entityId: pageId,
        changes: validatedData,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Schedule updated successfully',
      data: updatedSchedule,
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

    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to update schedule',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const { id: pageId, scheduleId } = params;

    const schedule = await prisma.cmsSchedule.findFirst({
      where: {
        id: scheduleId,
        pageId: pageId,
      },
    });

    if (!schedule) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Schedule not found' },
        { status: 404 }
      );
    }

    await prisma.cmsSchedule.delete({
      where: { id: scheduleId },
    });

    // Log activity
    await prisma.cmsActivityLog.create({
      data: {
        userId: session.user.id,
        action: 'delete_schedule',
        entityType: 'page',
        entityId: pageId,
        changes: {
          scheduleType: schedule.scheduleType,
          scheduledFor: schedule.scheduledFor,
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Schedule deleted successfully',
    });

  } catch (error) {
    console.error('CMS Schedule DELETE Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to delete schedule',
      },
      { status: 500 }
    );
  }
}
