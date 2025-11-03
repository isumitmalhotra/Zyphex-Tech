/**
 * CMS SEO Score API
 * 
 * @route GET /api/cms/seo/[pageId]/score
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import seoService from '@/lib/cms/seo-service';

// ============================================================================
// GET - Calculate SEO score for a page
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

    // Only Super Admin can access SEO scores
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { pageId } = params;

    // Calculate SEO score
    const score = await seoService.calculateSeoScore(pageId);

    return NextResponse.json({
      success: true,
      data: score,
    });

  } catch (error) {
    console.error('CMS SEO Score Error:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Not Found', message: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to calculate SEO score',
      },
      { status: 500 }
    );
  }
}
