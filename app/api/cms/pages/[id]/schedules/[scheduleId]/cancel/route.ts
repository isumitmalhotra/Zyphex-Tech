/**
 * CMS Schedule Cancel API Route
 * Cancel a pending schedule
 * 
 * @route POST /api/cms/pages/[id]/schedules/[scheduleId]/cancel
 * @access Protected - Requires CMS permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: {
    id: string;
    scheduleId: string;
  };
}

export async function POST(
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
        { error: 'Validation Error', message: 'Can only cancel pending schedules' },
        { status: 400 }
      );
    }

    const updatedSchedule = await prisma.cmsSchedule.update({
      where: { id: scheduleId },
      data: {
        status: 'cancelled',
      },
    });

    // Log activity
    await prisma.cmsActivityLog.create({
      data: {
        userId: session.user.id,
        action: 'cancel_schedule',
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
      message: 'Schedule cancelled successfully',
      data: updatedSchedule,
    });

  } catch (error) {
    console.error('CMS Schedule Cancel Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to cancel schedule',
      },
      { status: 500 }
    );
  }
}
