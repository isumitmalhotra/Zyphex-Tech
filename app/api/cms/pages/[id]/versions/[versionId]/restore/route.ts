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
import { restoreVersion } from '@/lib/cms/version-service';

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

    // Restore version using version service
    const newVersion = await restoreVersion(versionId, session.user.id);

    return NextResponse.json({
      success: true,
      message: `Successfully restored to version ${newVersion.versionNumber - 1}`,
      data: {
        newVersion,
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
