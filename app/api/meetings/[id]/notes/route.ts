import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Priority } from '@prisma/client';

// Validation schema for saving notes
const saveNotesSchema = z.object({
  notes: z.string(),
  recordingUrl: z.string().url().optional(),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
    size: z.number().optional(),
    type: z.string().optional(),
  })).optional(),
  attendance: z.array(z.object({
    attendeeId: z.string().uuid(),
    attended: z.boolean(),
    joinedAt: z.string().datetime().optional(),
    leftAt: z.string().datetime().optional(),
  })).optional(),
  actionItems: z.array(z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    assigneeId: z.string().uuid().optional(),
    dueDate: z.string().datetime().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  })).optional(),
});

/**
 * GET /api/meetings/[id]/notes
 * Get meeting notes and action items
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

    // Get meeting with notes and action items
    const meeting = await prisma.meeting.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        title: true,
        notes: true,
        recordingUrl: true,
        attachments: true,
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
      },
    });

    if (!meeting) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      notes: meeting.notes,
      recordingUrl: meeting.recordingUrl,
      attachments: meeting.attachments ? JSON.parse(meeting.attachments) : [],
      attendance: meeting.attendees,
      actionItems: meeting.actionItems,
    });
  } catch (error) {
    console.error('Error fetching meeting notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meeting notes' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/meetings/[id]/notes
 * Save meeting notes and action items
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

    // Check if meeting exists
    const meeting = await prisma.meeting.findUnique({
      where: { id: params.id },
      include: {
        attendees: true,
      },
    });

    if (!meeting) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      );
    }

    // Only organizer or attendees can add notes
    const isOrganizer = meeting.organizerId === session.user.id;
    const isAttendee = meeting.attendees.some(a => a.userId === session.user.id);
    const isAdmin = session.user.role === 'ADMIN';

    if (!isOrganizer && !isAttendee && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - Only organizer or attendees can add notes' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = saveNotesSchema.parse(body);

    // Update meeting notes
    const updateData: any = {
      notes: validatedData.notes,
    };

    if (validatedData.recordingUrl) {
      updateData.recordingUrl = validatedData.recordingUrl;
    }

    if (validatedData.attachments && validatedData.attachments.length > 0) {
      updateData.attachments = JSON.stringify(validatedData.attachments);
    }

    // Update meeting
    const updatedMeeting = await prisma.meeting.update({
      where: { id: params.id },
      data: updateData,
    });

    // Update attendance records if provided
    if (validatedData.attendance && validatedData.attendance.length > 0) {
      await Promise.all(
        validatedData.attendance.map(async (record) => {
          const updateData: any = {
            attended: record.attended,
          };

          if (record.joinedAt) {
            updateData.joinedAt = new Date(record.joinedAt);
          }

          if (record.leftAt) {
            updateData.leftAt = new Date(record.leftAt);
          }

          return prisma.meetingAttendee.update({
            where: { id: record.attendeeId },
            data: updateData,
          });
        })
      );
    }

    // Create action items if provided
    let actionItems: any[] = [];
    if (validatedData.actionItems && validatedData.actionItems.length > 0) {
      actionItems = await Promise.all(
        validatedData.actionItems.map(async (item) => {
          return prisma.meetingActionItem.create({
            data: {
              meetingId: params.id,
              title: item.title,
              description: item.description,
              assigneeId: item.assigneeId,
              dueDate: item.dueDate ? new Date(item.dueDate) : undefined,
              priority: item.priority as Priority,
            },
            include: {
              assignee: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          });
        })
      );
    }

    return NextResponse.json({
      message: 'Meeting notes saved successfully',
      notes: updatedMeeting.notes,
      actionItems,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error saving meeting notes:', error);
    return NextResponse.json(
      { error: 'Failed to save meeting notes' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/meetings/[id]/notes
 * Update existing meeting notes
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

    // Check if meeting exists
    const meeting = await prisma.meeting.findUnique({
      where: { id: params.id },
      include: {
        attendees: true,
      },
    });

    if (!meeting) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      );
    }

    // Only organizer or attendees can update notes
    const isOrganizer = meeting.organizerId === session.user.id;
    const isAttendee = meeting.attendees.some(a => a.userId === session.user.id);
    const isAdmin = session.user.role === 'ADMIN';

    if (!isOrganizer && !isAttendee && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - Only organizer or attendees can update notes' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = saveNotesSchema.parse(body);

    // Update meeting notes
    const updateData: any = {
      notes: validatedData.notes,
    };

    if (validatedData.recordingUrl !== undefined) {
      updateData.recordingUrl = validatedData.recordingUrl;
    }

    if (validatedData.attachments) {
      updateData.attachments = JSON.stringify(validatedData.attachments);
    }

    const updatedMeeting = await prisma.meeting.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({
      message: 'Meeting notes updated successfully',
      notes: updatedMeeting.notes,
      recordingUrl: updatedMeeting.recordingUrl,
      attachments: updatedMeeting.attachments ? JSON.parse(updatedMeeting.attachments) : [],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating meeting notes:', error);
    return NextResponse.json(
      { error: 'Failed to update meeting notes' },
      { status: 500 }
    );
  }
}
