/**
 * CMS Page Version Restore API Route
 * Restore a specific page version
 * 
 * @route POST /api/cms/pages/[id]/versions/[versionId]/restore
 * @access Protected - Requires CMS permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: {
    id: string;
    versionId: string;
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

    const { id: pageId, versionId } = params;

    // Get the version to restore
    const versionToRestore = await prisma.cmsPageVersion.findFirst({
      where: {
        id: versionId,
        pageId,
      },
    });

    if (!versionToRestore) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Version not found' },
        { status: 404 }
      );
    }

    // Get the page
    const page = await prisma.cmsPage.findFirst({
      where: {
        id: pageId,
        deletedAt: null,
      },
    });

    if (!page) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Page not found' },
        { status: 404 }
      );
    }

    // Get the highest version number
    const latestVersion = await prisma.cmsPageVersion.findFirst({
      where: { pageId },
      orderBy: { versionNumber: 'desc' },
    });

    const nextVersionNumber = (latestVersion?.versionNumber || 0) + 1;

    // Parse the page snapshot from the version
    const pageSnapshot = versionToRestore.pageSnapshot as {
      pageTitle?: string;
      slug?: string;
      pageKey?: string;
      status?: string;
      pageType?: string;
      metaTitle?: string;
      metaDescription?: string;
      metaKeywords?: string;
      ogTitle?: string;
      ogDescription?: string;
      ogImage?: string;
      isPublic?: boolean;
      requiresAuth?: boolean;
      allowComments?: boolean;
      layout?: string;
      structuredData?: unknown;
    };

    // Create a new version from the restored version
    await prisma.cmsPageVersion.create({
      data: {
        pageId,
        versionNumber: nextVersionNumber,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        pageSnapshot: versionToRestore.pageSnapshot as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sectionsSnapshot: versionToRestore.sectionsSnapshot as any,
        changeDescription: `Restored from version ${versionToRestore.versionNumber}`,
        createdBy: session.user.id,
      },
    });

    // Update the page with restored data
    await prisma.cmsPage.update({
      where: { id: pageId },
      data: {
        pageTitle: pageSnapshot.pageTitle || page.pageTitle,
        slug: pageSnapshot.slug || page.slug,
        pageKey: pageSnapshot.pageKey || page.pageKey,
        status: pageSnapshot.status || page.status,
        pageType: pageSnapshot.pageType || page.pageType,
        metaTitle: pageSnapshot.metaTitle,
        metaDescription: pageSnapshot.metaDescription,
        metaKeywords: pageSnapshot.metaKeywords,
        ogTitle: pageSnapshot.ogTitle,
        ogDescription: pageSnapshot.ogDescription,
        ogImage: pageSnapshot.ogImage,
        isPublic: pageSnapshot.isPublic ?? page.isPublic,
        requiresAuth: pageSnapshot.requiresAuth ?? page.requiresAuth,
        allowComments: pageSnapshot.allowComments ?? page.allowComments,
        layout: pageSnapshot.layout,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        structuredData: pageSnapshot.structuredData as any,
        lastEditedBy: session.user.id,
      },
    });

    // Log activity
    await prisma.cmsActivityLog.create({
      data: {
        userId: session.user.id,
        action: 'restore_version',
        entityType: 'page',
        entityId: pageId,
        changes: {
          restoredFromVersion: versionToRestore.versionNumber,
          newVersion: nextVersionNumber,
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Restored to version ${versionToRestore.versionNumber}`,
      data: {
        restoredVersion: versionToRestore.versionNumber,
        newVersion: nextVersionNumber,
      },
    });

  } catch (error) {
    console.error('CMS Page Version Restore Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to restore version',
      },
      { status: 500 }
    );
  }
}
