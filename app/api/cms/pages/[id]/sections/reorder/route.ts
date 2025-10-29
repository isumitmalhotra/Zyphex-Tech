/**
 * CMS Page Sections Reorder API Route
 * Handles reordering sections for a page
 * 
 * @route PATCH /api/cms/pages/[id]/sections/reorder
 * @access Protected - Requires CMS permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const reorderSchema = z.object({
  sectionIds: z.array(z.string().uuid()),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Validate page exists
    const page = await prisma.cmsPage.findFirst({
      where: { id: pageId, deletedAt: null },
    });

    if (!page) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Page not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = reorderSchema.parse(body);

    // Update all sections in a transaction
    await prisma.$transaction(
      validatedData.sectionIds.map((id, index) =>
        prisma.cmsPageSection.update({
          where: { id },
          data: { order: index },
        })
      )
    );

    // Update page's lastEditedBy
    await prisma.cmsPage.update({
      where: { id: pageId },
      data: { lastEditedBy: session.user.id },
    });

    // Log activity
    await prisma.cmsActivityLog.create({
      data: {
        userId: session.user.id,
        action: 'reorder_sections',
        entityType: 'section',
        entityId: pageId,
        changes: { sectionIds: validatedData.sectionIds },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Sections reordered successfully',
    });

  } catch (error) {
    console.error('CMS Sections Reorder Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation Error',
          message: 'Invalid reorder data',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to reorder sections',
      },
      { status: 500 }
    );
  }
}
