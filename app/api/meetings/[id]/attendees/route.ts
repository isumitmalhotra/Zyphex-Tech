import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { AttendeeStatus } from '@prisma/client';

// Validation schema for adding attendee
const addAttendeeSchema = z.object({
  userId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  email: z.string().email().optional(),
  name: z.string().optional(),
  isRequired: z.boolean().default(true),
}).refine(
  (data) => data.userId || data.clientId || data.email,
  { message: 'Either userId, clientId, or email must be provided' }
);

// Validation schema for updating attendee
const updateAttendeeSchema = z.object({
  status: z.enum(['INVITED', 'ACCEPTED', 'DECLINED', 'TENTATIVE', 'NO_RESPONSE']).optional(),
  attended: z.boolean().optional(),
  joinedAt: z.string().datetime().optional(),
  leftAt: z.string().datetime().optional(),
});

/**
 * GET /api/meetings/[id]/attendees
 * Get all attendees for a meeting
 */
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

    // Check if meeting exists
    const meeting = await prisma.meeting.findUnique({
      where: { id: params.id },
    });

    if (!meeting) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      );
    }

    // Fetch attendees
    const attendees = await prisma.meetingAttendee.findMany({
      where: { meetingId: params.id },
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
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return NextResponse.json({ attendees });
  } catch (error) {
    console.error('Error fetching attendees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendees' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/meetings/[id]/attendees
 * Add attendee to meeting
 */
export async function POST(
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
    });

    if (!meeting) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      );
    }

    if (meeting.organizerId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Only the organizer can add attendees' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = addAttendeeSchema.parse(body);

    // Check if attendee already exists
    const existingAttendee = await prisma.meetingAttendee.findFirst({
      where: {
        meetingId: params.id,
        OR: [
          { userId: validatedData.userId },
          { clientId: validatedData.clientId },
          { email: validatedData.email },
        ].filter(condition => Object.values(condition)[0]), // Filter out undefined values
      },
    });

    if (existingAttendee) {
      return NextResponse.json(
        { error: 'Attendee already added to this meeting' },
        { status: 409 }
      );
    }

    // Add attendee
    const attendee = await prisma.meetingAttendee.create({
      data: {
        meetingId: params.id,
        userId: validatedData.userId,
        clientId: validatedData.clientId,
        email: validatedData.email,
        name: validatedData.name,
        isRequired: validatedData.isRequired,
        status: 'INVITED',
      },
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
    });

    // TODO: Send meeting invitation email to new attendee
    // await sendMeetingInvitation(attendee, meeting);

    return NextResponse.json({
      attendee,
      message: 'Attendee added successfully',
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error adding attendee:', error);
    return NextResponse.json(
      { error: 'Failed to add attendee' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/meetings/[id]/attendees/[attendeeId]
 * Update attendee status or attendance
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

    const { searchParams } = new URL(request.url);
    const attendeeId = searchParams.get('attendeeId');

    if (!attendeeId) {
      return NextResponse.json(
        { error: 'Attendee ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateAttendeeSchema.parse(body);

    // Check if attendee exists
    const existingAttendee = await prisma.meetingAttendee.findUnique({
      where: { id: attendeeId },
      include: {
        meeting: true,
      },
    });

    if (!existingAttendee || existingAttendee.meetingId !== params.id) {
      return NextResponse.json(
        { error: 'Attendee not found' },
        { status: 404 }
      );
    }

    // Users can update their own status, organizer can update anyone
    const isOwnAttendance = existingAttendee.userId === session.user.id;
    const isOrganizer = existingAttendee.meeting.organizerId === session.user.id;
    const isAdmin = session.user.role === 'ADMIN';

    if (!isOwnAttendance && !isOrganizer && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - You cannot update this attendee' },
        { status: 403 }
      );
    }

    // Build update data
    const updateData: any = {};

    if (validatedData.status) updateData.status = validatedData.status as AttendeeStatus;
    if (validatedData.attended !== undefined) updateData.attended = validatedData.attended;
    if (validatedData.joinedAt) updateData.joinedAt = new Date(validatedData.joinedAt);
    if (validatedData.leftAt) updateData.leftAt = new Date(validatedData.leftAt);

    // Update attendee
    const attendee = await prisma.meetingAttendee.update({
      where: { id: attendeeId },
      data: updateData,
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
    });

    return NextResponse.json({
      attendee,
      message: 'Attendee updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating attendee:', error);
    return NextResponse.json(
      { error: 'Failed to update attendee' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/meetings/[id]/attendees
 * Remove attendee from meeting
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

    const { searchParams } = new URL(request.url);
    const attendeeId = searchParams.get('attendeeId');

    if (!attendeeId) {
      return NextResponse.json(
        { error: 'Attendee ID is required' },
        { status: 400 }
      );
    }

    // Check if attendee exists
    const attendee = await prisma.meetingAttendee.findUnique({
      where: { id: attendeeId },
      include: {
        meeting: true,
      },
    });

    if (!attendee || attendee.meetingId !== params.id) {
      return NextResponse.json(
        { error: 'Attendee not found' },
        { status: 404 }
      );
    }

    // Only organizer or admin can remove attendees
    if (attendee.meeting.organizerId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Only the organizer can remove attendees' },
        { status: 403 }
      );
    }

    // Remove attendee
    await prisma.meetingAttendee.delete({
      where: { id: attendeeId },
    });

    return NextResponse.json({
      message: 'Attendee removed successfully',
    });
  } catch (error) {
    console.error('Error removing attendee:', error);
    return NextResponse.json(
      { error: 'Failed to remove attendee' },
      { status: 500 }
    );
  }
}
