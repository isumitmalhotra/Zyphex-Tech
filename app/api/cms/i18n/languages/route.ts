/**
 * CMS Languages API
 * 
 * @route GET /api/cms/i18n/languages
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import i18nService from '@/lib/cms/i18n-service';

// ============================================================================
// GET - Get supported languages
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

    // Only Super Admin can access language settings
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const languages = i18nService.getSupportedLanguages();
    const defaultLanguage = i18nService.getDefaultLanguage();

    return NextResponse.json({
      success: true,
      data: {
        languages,
        default: defaultLanguage,
      },
    });

  } catch (error) {
    console.error('CMS Languages Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to fetch languages',
      },
      { status: 500 }
    );
  }
}
