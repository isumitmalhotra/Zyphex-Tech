/**
 * CMS Translation Status API (Single Page)
 * 
 * @route GET /api/cms/i18n/status/[pageId]
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import i18nService from '@/lib/cms/i18n-service';

// ============================================================================
// GET - Get translation status for specific page
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { pageId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only Super Admin can access translation status
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { pageId } = params;

    // Get translation status for specific page
    const status = await i18nService.getTranslationStatus(pageId);

    return NextResponse.json({
      success: true,
      data: status,
    });

  } catch (error) {
    console.error('CMS Translation Status Error:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Not Found', message: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to fetch translation status',
      },
      { status: 500 }
    );
  }
}
