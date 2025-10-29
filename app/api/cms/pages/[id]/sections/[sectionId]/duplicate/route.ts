/**
 * CMS Section Duplicate API Route
 * Duplicates a section
 * 
 * @route POST /api/cms/pages/[id]/sections/[sectionId]/duplicate
 * @access Protected - Requires CMS permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: {
    id: string;
    sectionId: string;
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

    const { id: pageId, sectionId } = params;

    // Get original section
    const originalSection = await prisma.cmsPageSection.findFirst({
      where: {
        id: sectionId,
        pageId,
      },
    });

    if (!originalSection) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Section not found' },
        { status: 404 }
      );
    }

    // Generate unique section key
    let duplicateCount = 1;
    let newSectionKey = `${originalSection.sectionKey}-copy`;

    while (true) {
      const existing = await prisma.cmsPageSection.findFirst({
        where: {
          pageId,
          sectionKey: newSectionKey,
        },
      });

      if (!existing) break;

      duplicateCount++;
      newSectionKey = `${originalSection.sectionKey}-copy-${duplicateCount}`;
    }

    // Get max order
    const maxOrder = await prisma.cmsPageSection.findFirst({
      where: { pageId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    // Create duplicated section
    const duplicatedSection = await prisma.cmsPageSection.create({
      data: {
        pageId,
        sectionKey: newSectionKey,
        sectionType: originalSection.sectionType,
        title: originalSection.title ? `${originalSection.title} (Copy)` : null,
        subtitle: originalSection.subtitle,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        content: originalSection.content as any,
        order: (maxOrder?.order || 0) + 1,
        isVisible: originalSection.isVisible,
        showOnMobile: originalSection.showOnMobile,
        showOnTablet: originalSection.showOnTablet,
        showOnDesktop: originalSection.showOnDesktop,
        cssClasses: originalSection.cssClasses,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        customStyles: originalSection.customStyles as any,
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
        action: 'duplicate_section',
        entityType: 'section',
        entityId: duplicatedSection.id,
        changes: {
          originalSectionId: sectionId,
          originalSectionKey: originalSection.sectionKey,
          newSectionKey,
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Section duplicated successfully',
      data: duplicatedSection,
    });

  } catch (error) {
    console.error('CMS Section Duplicate Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to duplicate section',
      },
      { status: 500 }
    );
  }
}
