/**
 * Performance Statistics and Health API
 * 
 * GET /api/cms/performance/stats - Get performance statistics
 * GET /api/cms/performance/health - Get system health status
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getPerformanceStats,
  getSystemHealth,
  type MetricType,
} from '@/lib/cms/performance-service';

// ============================================================================
// GET - Get Performance Statistics or System Health
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

    // Only Super Admin can view performance stats
    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Super Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'stats' or 'health'
    const metricType = searchParams.get('metricType') as MetricType | null;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (type === 'health') {
      const health = await getSystemHealth();

      return NextResponse.json({
        success: true,
        data: health,
      });
    }

    // Get statistics
    if (!metricType) {
      return NextResponse.json(
        { success: false, error: 'metricType is required for stats' },
        { status: 400 }
      );
    }

    const stats = await getPerformanceStats(metricType, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching performance data:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch performance data',
      },
      { status: 500 }
    );
  }
}
