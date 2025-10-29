/**
 * CMS Page Duplicate API Route
 * Duplicate a page with all its sections
 * 
 * @route POST /api/cms/pages/[id]/duplicate
 * @access Protected - Requires cms.pages.create permission
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

interface RouteParams {
  params: {
    id: string;
  };
}

// ============================================================================
// POST - Duplicate a page
// ============================================================================

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

    // Validate page ID
    if (!z.string().uuid().safeParse(params.id).success) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Invalid page ID format' },
        { status: 400 }
      );
    }

    // Get original page with sections
    const originalPage = await prisma.cmsPage.findFirst({
      where: {
        id: params.id,
        deletedAt: null,
      },
      include: {
        sections: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!originalPage) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Page not found' },
        { status: 404 }
      );
    }

    // Generate unique slug and page key
    let duplicateCount = 1;
    let newSlug = `${originalPage.slug}-copy`;
    let newPageKey = `${originalPage.pageKey}-copy`;

    // Find next available slug/key
    while (true) {
      const existing = await prisma.cmsPage.findFirst({
        where: {
          OR: [
            { slug: newSlug },
            { pageKey: newPageKey },
          ],
          deletedAt: null,
        },
      });

      if (!existing) break;

      duplicateCount++;
      newSlug = `${originalPage.slug}-copy-${duplicateCount}`;
      newPageKey = `${originalPage.pageKey}-copy-${duplicateCount}`;
    }

    // Create duplicated page
    const duplicatedPage = await prisma.cmsPage.create({
      data: {
        pageKey: newPageKey,
        pageTitle: `${originalPage.pageTitle} (Copy)`,
        slug: newSlug,
        pageType: originalPage.pageType,
        status: 'draft', // Always start as draft
        authorId: session.user.id,
        lastEditedBy: session.user.id,
        
        // Copy template
        templateId: originalPage.templateId,
        
        // Copy SEO metadata
        metaTitle: originalPage.metaTitle,
        metaDescription: originalPage.metaDescription,
        metaKeywords: originalPage.metaKeywords,
        ogImage: originalPage.ogImage,
        ogTitle: originalPage.ogTitle,
        ogDescription: originalPage.ogDescription,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        structuredData: originalPage.structuredData as any,
        
        // Copy settings
        isPublic: originalPage.isPublic,
        requiresAuth: originalPage.requiresAuth,
        allowComments: originalPage.allowComments,
        layout: originalPage.layout,
        
        // Reset publishing data
        publishedAt: null,
        scheduledPublishAt: null,
        scheduledUnpublishAt: null,
        
        // Initial SEO score
        seoScore: originalPage.seoScore,
      },
    });

    // Duplicate all sections
    const sectionPromises = originalPage.sections.map((section) => {
      return prisma.cmsPageSection.create({
        data: {
          pageId: duplicatedPage.id,
          sectionKey: section.sectionKey,
          sectionType: section.sectionType,
          title: section.title,
          subtitle: section.subtitle,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          content: section.content as any,
          order: section.order,
          isVisible: section.isVisible,
          showOnDesktop: section.showOnDesktop,
          showOnTablet: section.showOnTablet,
          showOnMobile: section.showOnMobile,
          cssClasses: section.cssClasses,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          customStyles: section.customStyles as any,
        },
      });
    });

    await Promise.all(sectionPromises);

    // Create initial version
    const duplicatedPageWithSections = await prisma.cmsPage.findUnique({
      where: { id: duplicatedPage.id },
      include: {
        sections: {
          orderBy: { order: 'asc' },
        },
      },
    });

    await prisma.cmsPageVersion.create({
      data: {
        pageId: duplicatedPage.id,
        versionNumber: 1,
        pageSnapshot: JSON.parse(JSON.stringify(duplicatedPageWithSections)),
        sectionsSnapshot: JSON.parse(JSON.stringify(duplicatedPageWithSections?.sections || [])),
        createdBy: session.user.id,
        changeDescription: `Duplicated from page "${originalPage.pageTitle}"`,
        isPublished: false,
      },
    });

    // Log activity
    await prisma.cmsActivityLog.create({
      data: {
        userId: session.user.id,
        action: 'duplicate_page',
        entityType: 'page',
        entityId: duplicatedPage.id,
        changes: {
          originalPageId: originalPage.id,
          originalPageTitle: originalPage.pageTitle,
          newPageTitle: duplicatedPage.pageTitle,
          sectionsCount: originalPage.sections.length,
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Page duplicated successfully',
      data: {
        id: duplicatedPage.id,
        pageKey: duplicatedPage.pageKey,
        pageTitle: duplicatedPage.pageTitle,
        slug: duplicatedPage.slug,
        sectionsCount: originalPage.sections.length,
      },
    });

  } catch (error) {
    console.error('CMS Page Duplicate Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to duplicate page',
      },
      { status: 500 }
    );
  }
}
