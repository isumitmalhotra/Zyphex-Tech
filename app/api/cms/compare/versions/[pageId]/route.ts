/**
 * Get Versions for Comparison API
 * 
 * GET /api/cms/compare/versions/[pageId] - Get all versions available for comparison
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getVersionsForComparison } from '@/lib/cms/comparison-service';

// ============================================================================
// GET - Get Versions for Comparison
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { pageId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only Super Admin can view versions
    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Super Admin access required' },
        { status: 403 }
      );
    }

    const { pageId } = params;

    const versions = await getVersionsForComparison(pageId);

    return NextResponse.json({
      success: true,
      data: versions,
    });
  } catch (error) {
    console.error('Error getting versions for comparison:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get versions',
      },
      { status: 500 }
    );
  }
}
