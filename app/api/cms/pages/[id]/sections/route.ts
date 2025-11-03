/**
 * CMS Page Sections API Route
 * Handles CRUD operations for page sections
 * 
 * @route /api/cms/pages/[id]/sections
 * @access Protected - Requires CMS permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import auditService from '@/lib/cms/audit-service';
import { createAuditContext } from '@/lib/cms/audit-context';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createSectionSchema = z.object({
  sectionKey: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  sectionType: z.enum(['hero', 'features', 'testimonials', 'cta', 'content', 'gallery', 'faq', 'custom']),
  title: z.string().max(255).nullable().optional(),
  subtitle: z.string().max(500).nullable().optional(),
  content: z.record(z.any()), // Flexible JSON content
  order: z.number().int().min(0).default(0),
  isVisible: z.boolean().default(true),
  cssClasses: z.string().nullable().optional(),
  customStyles: z.record(z.any()).nullable().optional(),
  showOnMobile: z.boolean().default(true),
  showOnTablet: z.boolean().default(true),
  showOnDesktop: z.boolean().default(true),
});

// Export for use in other route files
export const updateSectionSchema = createSectionSchema.partial();

const reorderSchema = z.object({
  sectionIds: z.array(z.string().uuid()),
});

// ============================================================================
// GET - List all sections for a page
// ============================================================================

export async function GET(
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

    const { id } = params;

    // Validate page exists
    const page = await prisma.cmsPage.findFirst({
      where: { id, deletedAt: null },
    });

    if (!page) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Page not found' },
        { status: 404 }
      );
    }

    const sections = await prisma.cmsPageSection.findMany({
      where: { pageId: id },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: sections,
      count: sections.length,
    });

  } catch (error) {
    console.error('CMS Sections GET Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to fetch sections',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Create a new section for a page
// ============================================================================

export async function POST(
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
    const validatedData = createSectionSchema.parse(body);

    // Check if sectionKey already exists on this page
    const existing = await prisma.cmsPageSection.findUnique({
      where: {
        pageId_sectionKey: {
          pageId,
          sectionKey: validatedData.sectionKey,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: 'Conflict',
          message: `Section with key "${validatedData.sectionKey}" already exists on this page`,
        },
        { status: 409 }
      );
    }

    // If order not specified, append to end
    if (validatedData.order === 0) {
      const maxOrder = await prisma.cmsPageSection.findFirst({
        where: { pageId },
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      validatedData.order = (maxOrder?.order || 0) + 1;
    }

    // Create the section
    const section = await prisma.cmsPageSection.create({
      data: {
        ...validatedData,
        customStyles: validatedData.customStyles ?? undefined,
        pageId,
      },
    });

    // Update page's lastEditedBy
    await prisma.cmsPage.update({
      where: { id: pageId },
      data: { lastEditedBy: session.user.id },
    });

    // Log activity with enhanced audit service
    const auditContext = await createAuditContext(request);
    await auditService.logAudit({
      action: 'create_section',
      entityType: 'section',
      entityId: section.id,
      metadata: {
        pageId,
        sectionKey: validatedData.sectionKey,
        sectionType: validatedData.sectionType,
        title: validatedData.title,
      },
      context: {
        userId: session.user.id,
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Section created successfully',
        data: section,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('CMS Sections POST Error:', error);
    
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
        message: 'Failed to create section',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH - Reorder sections
// ============================================================================

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

    // Log activity with enhanced audit service
    const auditContext = await createAuditContext(request);
    await auditService.logAudit({
      action: 'reorder_sections',
      entityType: 'section',
      entityId: pageId,
      metadata: {
        pageId,
        sectionIds: validatedData.sectionIds,
        sectionCount: validatedData.sectionIds.length,
      },
      context: {
        userId: session.user.id,
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Sections reordered successfully',
    });

  } catch (error) {
    console.error('CMS Sections PATCH Error:', error);
    
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
