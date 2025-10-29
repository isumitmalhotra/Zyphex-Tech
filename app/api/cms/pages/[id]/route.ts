/**
 * CMS Single Page API Route
 * Handles operations for a specific CMS page
 * 
 * @route /api/cms/pages/[id]
 * @access Protected - Requires CMS permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { cmsCache, cacheKeys, cacheTTL } from '@/lib/cache/redis';
import { invalidatePageCache } from '@/lib/cache/invalidation';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const updatePageSchema = z.object({
  pageKey: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
  pageTitle: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-\/]+$/).optional(),
  pageType: z.enum(['standard', 'landing', 'blog', 'custom']).optional(),
  templateId: z.string().uuid().nullable().optional(),
  
  // SEO Metadata
  metaTitle: z.string().max(60).nullable().optional(),
  metaDescription: z.string().max(160).nullable().optional(),
  metaKeywords: z.string().max(255).nullable().optional(),
  ogImage: z.string().url().nullable().optional(),
  ogTitle: z.string().max(60).nullable().optional(),
  ogDescription: z.string().max(160).nullable().optional(),
  structuredData: z.record(z.any()).nullable().optional(),
  
  // Status & Publishing
  status: z.enum(['draft', 'review', 'scheduled', 'published', 'archived']).optional(),
  scheduledPublishAt: z.string().datetime().nullable().optional(),
  scheduledUnpublishAt: z.string().datetime().nullable().optional(),
  
  // Settings
  isPublic: z.boolean().optional(),
  requiresAuth: z.boolean().optional(),
  allowComments: z.boolean().optional(),
  layout: z.string().nullable().optional(),
  seoScore: z.number().min(0).max(100).nullable().optional(),
});

// ============================================================================
// GET - Fetch a specific page by ID
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

    // Validate UUID
    if (!z.string().uuid().safeParse(id).success) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Invalid page ID format' },
        { status: 400 }
      );
    }

    // Try to get from cache first
    const page = await cmsCache(
      cacheKeys.cmsPage(id),
      cacheTTL.contentType, // 1 hour
      async () => {
        return await prisma.cmsPage.findFirst({
          where: {
            id,
            deletedAt: null,
          },
          include: {
            template: true,
            sections: {
              where: { isVisible: true },
              orderBy: { order: 'asc' },
            },
            versions: {
              orderBy: { versionNumber: 'desc' },
              take: 5, // Get last 5 versions
              select: {
                id: true,
                versionNumber: true,
                changeDescription: true,
                createdBy: true,
                createdAt: true,
                isPublished: true,
              },
            },
            _count: {
              select: {
                sections: true,
                versions: true,
                workflows: true,
                schedules: true,
              },
            },
          },
        });
      }
    );

    if (!page) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Page not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: page,
    });

  } catch (error) {
    console.error('CMS Page GET Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to fetch page',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH - Update a specific page
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

    const { id } = params;

    // Validate UUID
    if (!z.string().uuid().safeParse(id).success) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Invalid page ID format' },
        { status: 400 }
      );
    }

    // Check if page exists
    const existingPage = await prisma.cmsPage.findFirst({
      where: { id, deletedAt: null },
      include: { sections: true },
    });

    if (!existingPage) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Page not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = updatePageSchema.parse(body);

    // Check for unique constraint violations
    if (validatedData.pageKey || validatedData.slug) {
      const conflicts = await prisma.cmsPage.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            { deletedAt: null },
            {
              OR: [
                validatedData.pageKey ? { pageKey: validatedData.pageKey } : {},
                validatedData.slug ? { slug: validatedData.slug } : {},
              ].filter(obj => Object.keys(obj).length > 0),
            },
          ],
        },
      });

      if (conflicts) {
        return NextResponse.json(
          {
            error: 'Conflict',
            message: 'Page key or slug already exists',
          },
          { status: 409 }
        );
      }
    }

    // Handle status changes
    const updateData: Record<string, unknown> = {
      ...validatedData,
      lastEditedBy: session.user.id,
      updatedAt: new Date(),
    };

    // If publishing, set publishedAt
    if (validatedData.status === 'published' && existingPage.status !== 'published') {
      updateData.publishedAt = new Date();
    }

    // Update the page
    const updatedPage = await prisma.cmsPage.update({
      where: { id },
      data: updateData,
      include: {
        template: true,
        sections: {
          orderBy: { order: 'asc' },
        },
      },
    });

    // Create new version
    const latestVersion = await prisma.cmsPageVersion.findFirst({
      where: { pageId: id },
      orderBy: { versionNumber: 'desc' },
    });

    await prisma.cmsPageVersion.create({
      data: {
        pageId: id,
        versionNumber: (latestVersion?.versionNumber || 0) + 1,
        pageSnapshot: JSON.parse(JSON.stringify(updatedPage)),
        sectionsSnapshot: JSON.parse(JSON.stringify(updatedPage.sections)),
        createdBy: session.user.id,
        changeDescription: body.changeDescription || 'Updated page',
        isPublished: validatedData.status === 'published',
        publishedAt: validatedData.status === 'published' ? new Date() : null,
      },
    });

    // Log activity
    await prisma.cmsActivityLog.create({
      data: {
        userId: session.user.id,
        action: 'update_page',
        entityType: 'page',
        entityId: id,
        changes: validatedData,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
      },
    });

    // Invalidate cache for this page and all page lists
    await invalidatePageCache(id);

    return NextResponse.json({
      success: true,
      message: 'Page updated successfully',
      data: updatedPage,
    });

  } catch (error) {
    console.error('CMS Page PATCH Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation Error',
          message: 'Invalid page data',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to update page',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Soft delete a page
// ============================================================================

export async function DELETE(
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

    // Validate UUID
    if (!z.string().uuid().safeParse(id).success) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Invalid page ID format' },
        { status: 400 }
      );
    }

    // Check if page exists
    const existingPage = await prisma.cmsPage.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existingPage) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Page not found' },
        { status: 404 }
      );
    }

    // Soft delete the page
    await prisma.cmsPage.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        lastEditedBy: session.user.id,
      },
    });

    // Log activity
    await prisma.cmsActivityLog.create({
      data: {
        userId: session.user.id,
        action: 'delete_page',
        entityType: 'page',
        entityId: id,
        changes: {
          pageKey: existingPage.pageKey,
          pageTitle: existingPage.pageTitle,
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
      },
    });

    // Invalidate cache for this page and all page lists
    await invalidatePageCache(id);

    return NextResponse.json({
      success: true,
      message: 'Page deleted successfully',
    });

  } catch (error) {
    console.error('CMS Page DELETE Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to delete page',
      },
      { status: 500 }
    );
  }
}
