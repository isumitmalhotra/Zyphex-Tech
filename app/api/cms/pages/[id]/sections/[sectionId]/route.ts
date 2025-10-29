/**
 * CMS Single Section API Route
 * Handles operations for a specific section
 * 
 * @route /api/cms/pages/[id]/sections/[sectionId]
 * @access Protected - Requires CMS permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const updateSectionSchema = z.object({
  sectionKey: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
  sectionType: z.enum(['hero', 'features', 'testimonials', 'cta', 'content', 'gallery', 'faq', 'custom']).optional(),
  title: z.string().max(255).nullable().optional(),
  subtitle: z.string().max(500).nullable().optional(),
  content: z.record(z.unknown()).optional(),
  order: z.number().int().min(0).optional(),
  isVisible: z.boolean().optional(),
  cssClasses: z.string().nullable().optional(),
  customStyles: z.record(z.unknown()).nullable().optional(),
  showOnMobile: z.boolean().optional(),
  showOnTablet: z.boolean().optional(),
  showOnDesktop: z.boolean().optional(),
});

// ============================================================================
// GET - Fetch a specific section
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; sectionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in' },
        { status: 401 }
      );
    }

    const { sectionId } = params;

    const section = await prisma.cmsPageSection.findUnique({
      where: { id: sectionId },
      include: {
        page: {
          select: {
            id: true,
            pageKey: true,
            pageTitle: true,
            status: true,
          },
        },
      },
    });

    if (!section) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Section not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: section,
    });

  } catch (error) {
    console.error('CMS Section GET Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to fetch section',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH - Update a specific section
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; sectionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in' },
        { status: 401 }
      );
    }

    const { id: pageId, sectionId } = params;

    // Check if section exists
    const existingSection = await prisma.cmsPageSection.findFirst({
      where: {
        id: sectionId,
        pageId,
      },
    });

    if (!existingSection) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Section not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = updateSectionSchema.parse(body);

    // Check for sectionKey conflicts if updating key
    if (validatedData.sectionKey && validatedData.sectionKey !== existingSection.sectionKey) {
      const conflict = await prisma.cmsPageSection.findUnique({
        where: {
          pageId_sectionKey: {
            pageId,
            sectionKey: validatedData.sectionKey,
          },
        },
      });

      if (conflict) {
        return NextResponse.json(
          {
            error: 'Conflict',
            message: `Section with key "${validatedData.sectionKey}" already exists on this page`,
          },
          { status: 409 }
        );
      }
    }

    // Update the section
    const updatedSection = await prisma.cmsPageSection.update({
      where: { id: sectionId },
      data: {
        ...validatedData,
        customStyles: validatedData.customStyles ?? undefined,
        updatedAt: new Date(),
      },
    });

    // Update page's lastEditedBy
    await prisma.cmsPage.update({
      where: { id: pageId },
      data: { lastEditedBy: session.user.id },
    });

    // Log activity
    await prisma.cmsActivityLog.create({
      data: {
        userId: session.user.id,
        action: 'update_section',
        entityType: 'section',
        entityId: sectionId,
        changes: validatedData,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Section updated successfully',
      data: updatedSection,
    });

  } catch (error) {
    console.error('CMS Section PATCH Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation Error',
          message: 'Invalid section data',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to update section',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Delete a section
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; sectionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in' },
        { status: 401 }
      );
    }

    const { id: pageId, sectionId } = params;

    // Check if section exists
    const existingSection = await prisma.cmsPageSection.findFirst({
      where: {
        id: sectionId,
        pageId,
      },
    });

    if (!existingSection) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Section not found' },
        { status: 404 }
      );
    }

    // Delete the section
    await prisma.cmsPageSection.delete({
      where: { id: sectionId },
    });

    // Update page's lastEditedBy
    await prisma.cmsPage.update({
      where: { id: pageId },
      data: { lastEditedBy: session.user.id },
    });

    // Log activity
    await prisma.cmsActivityLog.create({
      data: {
        userId: session.user.id,
        action: 'delete_section',
        entityType: 'section',
        entityId: sectionId,
        changes: {
          sectionKey: existingSection.sectionKey,
          sectionType: existingSection.sectionType,
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Section deleted successfully',
    });

  } catch (error) {
    console.error('CMS Section DELETE Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to delete section',
      },
      { status: 500 }
    );
  }
}
