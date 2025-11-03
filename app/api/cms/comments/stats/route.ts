/**
 * Comment Statistics API
 * 
 * GET /api/cms/comments/stats - Get comment statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCommentStats, getUserCommentActivity } from '@/lib/cms/comment-service';

// ============================================================================
// GET - Get Comment Statistics
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only Super Admin can view statistics
    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Super Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('pageId');
    const userActivity = searchParams.get('userActivity');

    // Get user activity
    if (userActivity === 'true') {
      const activity = await getUserCommentActivity(session.user.id);
      return NextResponse.json({
        success: true,
        data: activity,
      });
    }

    // Get comment stats
    const stats = await getCommentStats(pageId || undefined);

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error getting comment statistics:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get comment statistics',
      },
      { status: 500 }
    );
  }
}
