/**
 * CMS Page Specific Version API Route
 * Get details of a specific version
 * 
 * @route GET /api/cms/pages/[id]/versions/[versionId]
 * @access Protected - Requires CMS permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getVersion } from '@/lib/cms/version-service';

interface RouteParams {
  params: {
    id: string;
    versionId: string;
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

    const { id: pageId, versionId } = params;

    // Verify page exists
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

    // Get version using version service
    const version = await getVersion(versionId);

    return NextResponse.json({
      success: true,
      data: version,
    });

  } catch (error) {
    console.error('CMS Page Version GET Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to fetch version',
      },
      { status: 500 }
    );
  }
}
