import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { MeetingType, MeetingStatus, RecurrenceFrequency } from '@prisma/client';

// Validation schema
const createMeetingSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  duration: z.number().min(1),
  type: z.enum(['IN_PERSON', 'VIDEO_CALL', 'PHONE_CALL', 'CONFERENCE']),
  location: z.string().optional(),
  timezone: z.string().default('UTC'),
  projectId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  isRecurring: z.boolean().default(false),
  recurrenceFreq: z.enum(['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']).optional(),
  recurrenceEnd: z.string().datetime().optional(),
  agenda: z.array(z.object({
    id: z.string(),
    title: z.string(),
    duration: z.number().optional(),
    presenter: z.string().optional(),
    notes: z.string().optional(),
  })).optional(),
  attendees: z.array(z.object({
    userId: z.string().uuid().optional(),
    clientId: z.string().uuid().optional(),
    email: z.string().email().optional(),
    name: z.string().optional(),
    isRequired: z.boolean().default(true),
  })).min(1, 'At least one attendee is required'),
});

/**
 * GET /api/meetings
 * List meetings with filters
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only PROJECT_MANAGER and ADMIN can access meetings
    if (session.user.role !== 'PROJECT_MANAGER' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Project Manager or Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const projectId = searchParams.get('projectId');
    const clientId = searchParams.get('clientId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status as MeetingStatus;
    }

    if (type) {
      where.type = type as MeetingType;
    }

    if (projectId) {
      where.projectId = projectId;
    }

    if (clientId) {
      where.clientId = clientId;
    }

    if (startDate && endDate) {
      where.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      where.startTime = {
        gte: new Date(startDate),
      };
    } else if (endDate) {
      where.startTime = {
        lte: new Date(endDate),
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Fetch meetings
    const meetings = await prisma.meeting.findMany({
      where,
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        attendees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
            client: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        actionItems: {
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    // Parse JSON fields
    const formattedMeetings = meetings.map(meeting => ({
      ...meeting,
      agenda: meeting.agenda ? JSON.parse(meeting.agenda) : null,
      attachments: meeting.attachments ? JSON.parse(meeting.attachments) : null,
    }));

    return NextResponse.json({
      meetings: formattedMeetings,
      total: meetings.length,
    });
  } catch (error) {
    console.error('Error fetching meetings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meetings' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/meetings
 * Create a new meeting
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only PROJECT_MANAGER and ADMIN can create meetings
    if (session.user.role !== 'PROJECT_MANAGER' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Project Manager or Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createMeetingSchema.parse(body);

    // Validate date range
    const startTime = new Date(validatedData.startTime);
    const endTime = new Date(validatedData.endTime);

    if (endTime <= startTime) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      );
    }

    // Check for conflicts
    const conflicts = await prisma.meeting.findMany({
      where: {
        organizerId: session.user.id,
        status: {
          not: 'CANCELLED',
        },
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } },
            ],
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } },
            ],
          },
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } },
            ],
          },
        ],
      },
    });

    if (conflicts.length > 0) {
      return NextResponse.json(
        { 
          error: 'Meeting conflict detected',
          conflicts: conflicts.map(m => ({
            id: m.id,
            title: m.title,
            startTime: m.startTime,
            endTime: m.endTime,
          })),
        },
        { status: 409 }
      );
    }

    // Create meeting
    const meeting = await prisma.meeting.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        startTime,
        endTime,
        duration: validatedData.duration,
        type: validatedData.type as MeetingType,
        location: validatedData.location,
        timezone: validatedData.timezone,
        organizerId: session.user.id,
        projectId: validatedData.projectId,
        clientId: validatedData.clientId,
        isRecurring: validatedData.isRecurring,
        recurrenceFreq: validatedData.recurrenceFreq as RecurrenceFrequency | undefined,
        recurrenceEnd: validatedData.recurrenceEnd ? new Date(validatedData.recurrenceEnd) : undefined,
        agenda: validatedData.agenda ? JSON.stringify(validatedData.agenda) : null,
        attendees: {
          create: validatedData.attendees.map(attendee => ({
            userId: attendee.userId,
            clientId: attendee.clientId,
            email: attendee.email,
            name: attendee.name,
            isRequired: attendee.isRequired,
            status: 'INVITED',
          })),
        },
      },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        attendees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
            client: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // TODO: Send meeting invitation emails to all attendees
    // This would be implemented using the email service
    // await sendMeetingInvitations(meeting);

    return NextResponse.json({
      meeting: {
        ...meeting,
        agenda: meeting.agenda ? JSON.parse(meeting.agenda) : null,
      },
      message: 'Meeting created successfully',
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating meeting:', error);
    return NextResponse.json(
      { error: 'Failed to create meeting' },
      { status: 500 }
    );
  }
}
