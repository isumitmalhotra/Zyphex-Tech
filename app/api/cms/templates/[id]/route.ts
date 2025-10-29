/**
 * CMS Single Template API Route
 * Get, update, or delete a specific template
 * 
 * @route /api/cms/templates/[id]
 * @access Protected - Requires CMS permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { cmsCache, cacheKeys, cacheTTL } from '@/lib/cache/redis';
import { invalidateTemplateCache } from '@/lib/cache/invalidation';

const updateTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(500).nullable().optional(),
  category: z.enum(['landing', 'blog', 'marketing', 'ecommerce', 'portfolio', 'corporate', 'other']).optional(),
  thumbnailUrl: z.string().url().nullable().optional(),
  templateStructure: z.any().optional(),
  defaultContent: z.any().optional(),
});

interface RouteParams {
  params: {
    id: string;
  };
}

// ============================================================================
// GET - Get single template
// ============================================================================

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

    const template = await cmsCache(
      cacheKeys.cmsTemplate(params.id),
      cacheTTL.contentTypes, // 30 minutes
      async () => {
        return await prisma.cmsTemplate.findFirst({
          where: {
            id: params.id,
          },
          include: {
            _count: {
              select: {
                pages: true,
              },
            },
          },
        });
      }
    );

    if (!template) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: template,
    });

  } catch (error) {
    console.error('CMS Template GET Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to fetch template',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH - Update template
// ============================================================================

export async function PATCH(
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

    const template = await prisma.cmsTemplate.findFirst({
      where: {
        id: params.id,
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Template not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = updateTemplateSchema.parse(body);

    const updatedTemplate = await prisma.cmsTemplate.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        _count: {
          select: {
            pages: true,
          },
        },
      },
    });

    // Log activity
    await prisma.cmsActivityLog.create({
      data: {
        userId: session.user.id,
        action: 'update_template',
        entityType: 'template',
        entityId: template.id,
        changes: validatedData,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
      },
    });

    // Invalidate template cache and all pages using this template
    await invalidateTemplateCache(params.id);

    return NextResponse.json({
      success: true,
      message: 'Template updated successfully',
      data: updatedTemplate,
    });

  } catch (error) {
    console.error('CMS Template PATCH Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation Error',
          message: 'Invalid template data',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to update template',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Delete template
// ============================================================================

export async function DELETE(
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

    const template = await prisma.cmsTemplate.findFirst({
      where: {
        id: params.id,
      },
      include: {
        _count: {
          select: {
            pages: true,
          },
        },
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Template not found' },
        { status: 404 }
      );
    }

    // Delete template (hard delete since no deletedAt field)
    await prisma.cmsTemplate.delete({
      where: { id: params.id },
    });

    // Log activity
    await prisma.cmsActivityLog.create({
      data: {
        userId: session.user.id,
        action: 'delete_template',
        entityType: 'template',
        entityId: template.id,
        changes: {
          name: template.name,
          category: template.category,
          pagesUsing: template._count.pages,
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
      },
    });

    // Invalidate template cache and all pages using this template
    await invalidateTemplateCache(params.id);

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully',
    });

  } catch (error) {
    console.error('CMS Template DELETE Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to delete template',
      },
      { status: 500 }
    );
  }
}
