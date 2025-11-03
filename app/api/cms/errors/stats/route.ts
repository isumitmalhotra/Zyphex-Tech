/**
 * Error Statistics API
 * 
 * GET /api/cms/errors/stats - Get error statistics and analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getErrorStats,
  getUserFriendlyMessage,
  getRecoveryStrategy,
  type ErrorType,
} from '@/lib/cms/error-service';

// ============================================================================
// GET - Get Error Statistics or Recovery Info
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

    // Only Super Admin can view error stats
    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Super Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'stats', 'recovery', or 'message'
    const errorType = searchParams.get('errorType') as ErrorType | null;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (type === 'recovery' && errorType) {
      const strategy = getRecoveryStrategy(errorType);

      return NextResponse.json({
        success: true,
        data: strategy,
      });
    }

    if (type === 'message' && errorType) {
      const message = getUserFriendlyMessage(errorType);

      return NextResponse.json({
        success: true,
        data: { errorType, message },
      });
    }

    // Get statistics
    const stats = await getErrorStats({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching error statistics:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch error statistics',
      },
      { status: 500 }
    );
  }
}
