/**
 * CMS Page Version Stats API Route
 * Get version statistics for a page
 * 
 * @route GET /api/cms/pages/[id]/versions/stats
 * @access Protected - Requires CMS permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getVersionStats } from '@/lib/cms/version-service';

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

    // Get stats using version service
    const stats = await getVersionStats(pageId);

    return NextResponse.json({
      success: true,
      data: stats,
    });

  } catch (error) {
    console.error('CMS Page Version Stats Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to fetch version stats',
      },
      { status: 500 }
    );
  }
}
