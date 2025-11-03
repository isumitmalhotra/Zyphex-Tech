/**
 * CMS Schedule Statistics API
 * 
 * @route GET /api/cms/schedules/stats
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import schedulingService from '@/lib/cms/scheduling-service';

// ============================================================================
// GET - Get schedule statistics
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

    // Only Super Admin can access schedule stats
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get schedule statistics
    const stats = await schedulingService.getScheduleStats();

    return NextResponse.json({
      success: true,
      data: stats,
    });

  } catch (error) {
    console.error('CMS Schedule Stats Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to fetch schedule statistics',
      },
      { status: 500 }
    );
  }
}
