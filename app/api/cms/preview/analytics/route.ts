/**
 * Preview Analytics API
 * 
 * GET /api/cms/preview/analytics - Get preview usage analytics
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPreviewAnalytics } from '@/lib/cms/preview-service';

// ============================================================================
// GET - Preview Analytics
// ============================================================================

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only Super Admin can view analytics
    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Super Admin access required' },
        { status: 403 }
      );
    }

    const analytics = await getPreviewAnalytics();

    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error('Error getting preview analytics:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get preview analytics',
      },
      { status: 500 }
    );
  }
}
