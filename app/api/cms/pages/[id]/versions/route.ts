/**
 * CMS Page Versions API Route
 * List all versions of a page
 * 
 * @route GET /api/cms/pages/[id]/versions
 * @access Protected - Requires CMS permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: {
    id: string;
  };
}

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

    const { id: pageId } = params;

    // Get page to verify it exists
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

    // Get all versions
    const versions = await prisma.cmsPageVersion.findMany({
      where: {
        pageId,
      },
      orderBy: {
        versionNumber: 'desc',
      },
    });

    // Format versions for response
    const versionsWithMeta = versions.map(version => ({
      ...version,
      isCurrent: version.isPublished, // Published versions are considered "current"
    }));

    return NextResponse.json({
      success: true,
      data: versionsWithMeta,
    });

  } catch (error) {
    console.error('CMS Page Versions GET Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to fetch page versions',
      },
      { status: 500 }
    );
  }
}
