import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { MeetingType, MeetingStatus } from '@prisma/client';
import logger from '@/lib/logger';

// Validation schema for update
const updateMeetingSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  duration: z.number().min(1).optional(),
  type: z.enum(['IN_PERSON', 'VIDEO_CALL', 'PHONE_CALL', 'CONFERENCE']).optional(),
  location: z.string().optional(),
  status: z.enum(['SCHEDULED', 'CANCELLED', 'COMPLETED', 'IN_PROGRESS', 'RESCHEDULED', 'NO_SHOW']).optional(),
  notes: z.string().optional(),
  recordingUrl: z.string().url().optional(),
  agenda: z.array(z.object({
    id: z.string(),
    title: z.string(),
    duration: z.number().optional(),
    presenter: z.string().optional(),
    notes: z.string().optional(),
  })).optional(),
});

/**
 * GET /api/meetings/[id]
 * Get a specific meeting
 */
// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const meeting = await prisma.meeting.findUnique({
      where: { id: params.id },
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
          orderBy: {
            createdAt: 'desc',
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!meeting) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      );
    }

    // Check if user has access (organizer, attendee, or admin)
    const isOrganizer = meeting.organizerId === session.user.id;
    const isAttendee = meeting.attendees.some(a => a.userId === session.user.id);
    const isAdmin = session.user.role === 'ADMIN';

    if (!isOrganizer && !isAttendee && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have access to this meeting' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      meeting: {
        ...meeting,
        agenda: meeting.agenda ? JSON.parse(meeting.agenda) : null,
        attachments: meeting.attachments ? JSON.parse(meeting.attachments) : null,
      },
    });
  } catch (error) {
    logger.error('Error fetching meeting:', { error, meetingId: params.id });
    return NextResponse.json(
      { error: 'Failed to fetch meeting' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/meetings/[id]
 * Update a meeting
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if meeting exists and user is organizer
    const existingMeeting = await prisma.meeting.findUnique({
      where: { id: params.id },
      include: {
        attendees: true,
      },
    });

    if (!existingMeeting) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      );
    }

    if (existingMeeting.organizerId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Only the organizer can update this meeting' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateMeetingSchema.parse(body);

    // Build update data
    const updateData: any = {};

    if (validatedData.title) updateData.title = validatedData.title;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.duration) updateData.duration = validatedData.duration;
    if (validatedData.type) updateData.type = validatedData.type as MeetingType;
    if (validatedData.location !== undefined) updateData.location = validatedData.location;
    if (validatedData.status) updateData.status = validatedData.status as MeetingStatus;
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes;
    if (validatedData.recordingUrl !== undefined) updateData.recordingUrl = validatedData.recordingUrl;
    if (validatedData.agenda) updateData.agenda = JSON.stringify(validatedData.agenda);

    // Handle time updates
    if (validatedData.startTime && validatedData.endTime) {
      const startTime = new Date(validatedData.startTime);
      const endTime = new Date(validatedData.endTime);

      if (endTime <= startTime) {
        return NextResponse.json(
          { error: 'End time must be after start time' },
          { status: 400 }
        );
      }

      updateData.startTime = startTime;
      updateData.endTime = endTime;

      // If rescheduling, update status
      if (startTime.getTime() !== existingMeeting.startTime.getTime()) {
        updateData.status = 'RESCHEDULED';
      }
    }

    // Update meeting
    const meeting = await prisma.meeting.update({
      where: { id: params.id },
      data: updateData,
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
        actionItems: true,
      },
    });

    // TODO: Send update notifications if time or location changed
    // if (updateData.startTime || updateData.location) {
    //   await sendMeetingUpdateNotifications(meeting, existingMeeting);
    // }

    return NextResponse.json({
      meeting: {
        ...meeting,
        agenda: meeting.agenda ? JSON.parse(meeting.agenda) : null,
        attachments: meeting.attachments ? JSON.parse(meeting.attachments) : null,
      },
      message: 'Meeting updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Error updating meeting:', { error, meetingId: params.id });
    return NextResponse.json(
      { error: 'Failed to update meeting' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/meetings/[id]
 * Cancel/delete a meeting
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if meeting exists and user is organizer
    const meeting = await prisma.meeting.findUnique({
      where: { id: params.id },
      include: {
        attendees: {
          include: {
            user: {
              select: {
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!meeting) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      );
    }

    if (meeting.organizerId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Only the organizer can cancel this meeting' },
        { status: 403 }
      );
    }

    // Soft delete - update status to CANCELLED instead of deleting
    const cancelledMeeting = await prisma.meeting.update({
      where: { id: params.id },
      data: {
        status: 'CANCELLED',
      },
    });

    // TODO: Send cancellation emails to all attendees
    // await sendMeetingCancellationNotifications(meeting);

    return NextResponse.json({
      message: 'Meeting cancelled successfully',
      meeting: cancelledMeeting,
    });
  } catch (error) {
    logger.error('Error cancelling meeting:', { error, meetingId: params.id });
    return NextResponse.json(
      { error: 'Failed to cancel meeting' },
      { status: 500 }
    );
  }
}
