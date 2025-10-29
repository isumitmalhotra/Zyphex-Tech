/**
 * CMS Apply Template to Page API Route
 * Apply a template to create a new page or replace existing page sections
 * 
 * @route POST /api/cms/pages/apply-template
 * @access Protected - Requires CMS permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const applyTemplateSchema = z.object({
  templateId: z.string().uuid(),
  pageId: z.string().uuid().optional(), // If provided, replace sections; if not, create new page
  // If creating new page, include page details
  pageTitle: z.string().min(1).max(255).optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  metaDescription: z.string().max(160).nullable().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = applyTemplateSchema.parse(body);

    // Get template
    const template = await prisma.cmsTemplate.findFirst({
      where: {
        id: validatedData.templateId,
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Template not found' },
        { status: 404 }
      );
    }

    // Parse template structure for creating sections
    const templateStructure = template.templateStructure as {
      sections?: Array<{
        sectionKey: string;
        sectionType: string;
        title?: string;
        subtitle?: string;
        content?: unknown;
        order: number;
      }>;
    };

    const sections = templateStructure.sections || [];

    let page;
    let action = '';

    if (validatedData.pageId) {
      // Apply to existing page - replace sections
      const existingPage = await prisma.cmsPage.findFirst({
        where: {
          id: validatedData.pageId,
        },
      });

      if (!existingPage) {
        return NextResponse.json(
          { error: 'Not Found', message: 'Page not found' },
          { status: 404 }
        );
      }

      // Delete existing sections and create new ones from template
      await prisma.$transaction(async (tx) => {
        // Delete all existing sections
        await tx.cmsPageSection.deleteMany({
          where: { pageId: validatedData.pageId },
        });

        // Create sections from template structure
        if (sections.length > 0) {
          const sectionPromises = sections.map((section) => {
            return tx.cmsPageSection.create({
              data: {
                pageId: validatedData.pageId!,
                sectionKey: section.sectionKey,
                sectionType: section.sectionType,
                title: section.title,
                subtitle: section.subtitle,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                content: section.content as any || {},
                order: section.order,
                isVisible: true,
                showOnMobile: true,
                showOnTablet: true,
                showOnDesktop: true,
              },
            });
          });

          await Promise.all(sectionPromises);
        }

        // Update page updatedAt
        await tx.cmsPage.update({
          where: { id: validatedData.pageId },
          data: { updatedAt: new Date() },
        });
      });

      page = existingPage;
      action = 'apply_template_to_page';

    } else {
      // Create new page from template
      if (!validatedData.pageTitle || !validatedData.slug) {
        return NextResponse.json(
          { 
            error: 'Validation Error',
            message: 'pageTitle and slug are required when creating a new page',
          },
          { status: 400 }
        );
      }

      // Check for duplicate slug
      const existingSlug = await prisma.cmsPage.findFirst({
        where: {
          slug: validatedData.slug,
        },
      });

      if (existingSlug) {
        return NextResponse.json(
          { 
            error: 'Validation Error',
            message: 'A page with this slug already exists',
          },
          { status: 400 }
        );
      }

      // Create page with sections from template
      page = await prisma.$transaction(async (tx) => {
        const newPage = await tx.cmsPage.create({
          data: {
            pageKey: validatedData.slug!.replace(/-/g, '_'),
            pageTitle: validatedData.pageTitle!,
            slug: validatedData.slug!,
            metaDescription: validatedData.metaDescription,
            status: 'draft',
            authorId: session.user.id,
            templateId: template.id, // Link to template
          },
        });

        // Create sections from template structure
        if (sections.length > 0) {
          const sectionPromises = sections.map((section) => {
            return tx.cmsPageSection.create({
              data: {
                pageId: newPage.id,
                sectionKey: section.sectionKey,
                sectionType: section.sectionType,
                title: section.title,
                subtitle: section.subtitle,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                content: section.content as any || {},
                order: section.order,
                isVisible: true,
                showOnMobile: true,
                showOnTablet: true,
                showOnDesktop: true,
              },
            });
          });

          await Promise.all(sectionPromises);
        }

        return newPage;
      });

      action = 'create_page_from_template';
    }

    // Fetch complete page with sections
    const completePage = await prisma.cmsPage.findUnique({
      where: { id: page.id },
      include: {
        sections: {
          orderBy: { order: 'asc' },
        },
        template: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Log activity
    await prisma.cmsActivityLog.create({
      data: {
        userId: session.user.id,
        action,
        entityType: 'page',
        entityId: page.id,
        changes: {
          templateId: template.id,
          templateName: template.name,
          sectionsCount: sections.length,
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
      },
    });

    return NextResponse.json({
      success: true,
      message: validatedData.pageId 
        ? 'Template applied to page successfully'
        : 'Page created from template successfully',
      data: completePage,
    });

  } catch (error) {
    console.error('CMS Apply Template Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation Error',
          message: 'Invalid data',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to apply template',
      },
      { status: 500 }
    );
  }
}
