/**
 * CMS Page Schedules API Route
 * List and create schedules for a page
 * 
 * @route GET/POST /api/cms/pages/[id]/schedules
 * @access Protected - Requires CMS permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createScheduleSchema = z.object({
  scheduleType: z.enum(['publish', 'unpublish', 'update']),
  scheduledFor: z.string().datetime(),
  timezone: z.string().default('UTC'),
  notes: z.string().optional(),
  contentSnapshot: z.any().optional(),
});

interface RouteParams {
  params: {
    id: string;
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

    const { id: pageId } = params;

    // Get page to verify it exists
    const page = await prisma.cmsPage.findFirst({
      where: {
        id: pageId,
        deletedAt: null,
      },
    });

    if (!page) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Page not found' },
        { status: 404 }
      );
    }

    // Get all schedules for this page
    const schedules = await prisma.cmsSchedule.findMany({
      where: {
        pageId: pageId,
      },
      orderBy: [
        { status: 'asc' }, // pending first
        { scheduledFor: 'asc' },
      ],
    });

    return NextResponse.json({
      success: true,
      data: schedules,
    });

  } catch (error) {
    console.error('CMS Schedules GET Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to fetch schedules',
      },
      { status: 500 }
    );
  }
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

    const { id: pageId } = params;

    // Get page to verify it exists
    const page = await prisma.cmsPage.findFirst({
      where: {
        id: pageId,
        deletedAt: null,
      },
    });

    if (!page) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Page not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = createScheduleSchema.parse(body);

    // Validate scheduled time is in the future
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

    // Create schedule
    const schedule = await prisma.cmsSchedule.create({
      data: {
        pageId: pageId,
        scheduleType: validatedData.scheduleType,
        scheduledFor: scheduledDate,
        status: 'pending',
        timezone: validatedData.timezone,
        contentSnapshot: validatedData.contentSnapshot,
        createdBy: session.user.id,
      },
    });

    // Log activity
    await prisma.cmsActivityLog.create({
      data: {
        userId: session.user.id,
        action: 'create_schedule',
        entityType: 'page',
        entityId: pageId,
        changes: {
          scheduleType: validatedData.scheduleType,
          scheduledFor: validatedData.scheduledFor,
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Schedule created successfully',
      data: schedule,
    }, { status: 201 });

  } catch (error) {
    console.error('CMS Schedules POST Error:', error);
    
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
        message: 'Failed to create schedule',
      },
      { status: 500 }
    );
  }
}
