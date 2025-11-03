/**
 * CMS Page Version Cleanup API Route
 * Delete old versions beyond retention limit
 * 
 * @route DELETE /api/cms/pages/[id]/versions/cleanup
 * @access Protected - Requires CMS permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { cleanupOldVersions } from '@/lib/cms/version-service';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function DELETE(
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
    const keepCount = parseInt(searchParams.get('keep') || '50', 10);

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

    // Cleanup old versions using version service
    const result = await cleanupOldVersions(pageId, keepCount);

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${result} old version(s)`,
      data: { count: result },
    });

  } catch (error) {
    console.error('CMS Page Version Cleanup Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to cleanup versions',
      },
      { status: 500 }
    );
  }
}
