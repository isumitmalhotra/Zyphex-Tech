/**
 * CMS Translation Status API
 * 
 * @route GET /api/cms/i18n/status
 * @route GET /api/cms/i18n/status/[pageId]
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import i18nService from '@/lib/cms/i18n-service';

// ============================================================================
// GET - Get translation status for all pages or specific page
// ============================================================================

export async function GET() {
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

    // Get all pages translation status
    const statuses = await i18nService.getAllPagesTranslationStatus();

    return NextResponse.json({
      success: true,
      data: statuses,
    });

  } catch (error) {
    console.error('CMS Translation Status Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to fetch translation status',
      },
      { status: 500 }
    );
  }
}
