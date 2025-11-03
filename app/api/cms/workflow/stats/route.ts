/**
 * CMS Workflow Statistics API
 * 
 * @route GET /api/cms/workflow/stats
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import workflowService from '@/lib/cms/workflow-service';

// ============================================================================
// GET - Get workflow statistics
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

    // Only Super Admin can access workflow stats
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get workflow statistics
    const stats = await workflowService.getWorkflowStats();

    return NextResponse.json({
      success: true,
      data: stats,
    });

  } catch (error) {
    console.error('CMS Workflow Stats Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to fetch workflow statistics',
      },
      { status: 500 }
    );
  }
}
