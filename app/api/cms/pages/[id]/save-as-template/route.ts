/**
 * CMS Save Page as Template API Route
 * Save a page as a reusable template
 * 
 * @route POST /api/cms/pages/[id]/save-as-template
 * @access Protected - Requires CMS permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const saveAsTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(500).nullable().optional(),
  category: z.enum(['landing', 'blog', 'marketing', 'ecommerce', 'portfolio', 'corporate', 'other']),
  thumbnailUrl: z.string().url().nullable().optional(),
});

interface RouteParams {
  params: {
    id: string;
  };
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

    // Get page with sections
    const page = await prisma.cmsPage.findFirst({
      where: {
        id: pageId,
        deletedAt: null,
      },
      include: {
        sections: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!page) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Page not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = saveAsTemplateSchema.parse(body);

    // Build template structure from page sections
    const templateStructure = {
      sections: page.sections.map((section) => ({
        sectionKey: section.sectionKey,
        sectionType: section.sectionType,
        title: section.title,
        subtitle: section.subtitle,
        content: section.content,
        order: section.order,
      })),
    };

    // Create template
    const template = await prisma.cmsTemplate.create({
      data: {
        ...validatedData,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        templateStructure: templateStructure as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        defaultContent: null as any,
        isActive: true,
        isSystem: false,
        order: 0,
      },
    });

    // Fetch complete template
    const completeTemplate = await prisma.cmsTemplate.findUnique({
      where: { id: template.id },
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
        action: 'save_page_as_template',
        entityType: 'template',
        entityId: template.id,
        changes: {
          pageId,
          pageTitle: page.pageTitle,
          templateName: validatedData.name,
          sectionsCount: page.sections.length,
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Page saved as template successfully',
      data: completeTemplate,
    });

  } catch (error) {
    console.error('CMS Save as Template Error:', error);
    
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
        message: 'Failed to save page as template',
      },
      { status: 500 }
    );
  }
}
