/**
 * CMS Page Versions API Route
 * List all versions and create new versions
 * 
 * @route GET /api/cms/pages/[id]/versions - List all versions
 * @route POST /api/cms/pages/[id]/versions - Create new version manually
 * @access Protected - Requires CMS permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getPageVersions, createVersion, getVersionStats } from '@/lib/cms/version-service';

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

    // Get all versions using version service
    const versions = await getPageVersions(pageId);

    // Get version statistics
    const stats = await getVersionStats(pageId);

    return NextResponse.json({
      success: true,
      data: {
        versions,
        stats,
      },
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

/**
 * Create a new version manually
 */
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

    // Parse request body
    const body = await request.json();
    const { changeDescription, tags } = body;

    // Create version using version service
    const version = await createVersion(pageId, {
      changedBy: session.user.id,
      changeDescription: changeDescription || 'Manual version save',
      tags: tags || ['manual'],
    });

    return NextResponse.json({
      success: true,
      message: 'Version created successfully',
      data: version,
    });

  } catch (error) {
    console.error('CMS Page Versions POST Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to create version',
      },
      { status: 500 }
    );
  }
}
