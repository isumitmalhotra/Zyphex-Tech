/**
 * CMS Page Version Comparison API Route
 * Compare two versions to see what changed
 * 
 * @route GET /api/cms/pages/[id]/versions/compare?v1=id1&v2=id2
 * @access Protected - Requires CMS permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { compareVersions } from '@/lib/cms/version-service';

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
    const { searchParams } = new URL(request.url);
    const versionId1 = searchParams.get('v1');
    const versionId2 = searchParams.get('v2');

    if (!versionId1 || !versionId2) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Both v1 and v2 query parameters are required' },
        { status: 400 }
      );
    }

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

    // Compare versions using version service
    const comparison = await compareVersions(versionId1, versionId2);

    return NextResponse.json({
      success: true,
      data: comparison,
    });

  } catch (error) {
    console.error('CMS Page Version Compare Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to compare versions',
      },
      { status: 500 }
    );
  }
}
