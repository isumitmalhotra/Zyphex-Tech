/**
 * CMS Schedule Cancel API
 * 
 * @route POST /api/cms/schedules/[id]/cancel
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import schedulingService from '@/lib/cms/scheduling-service';
import auditService from '@/lib/cms/audit-service';
import { createAuditContext } from '@/lib/cms/audit-context';

// ============================================================================
// POST - Cancel schedule
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only Super Admin can cancel schedules
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = params;

    // Cancel schedule
    await schedulingService.cancelSchedule(id);

    // Log activity
    const auditContext = await createAuditContext(request);
    await auditService.logAudit({
      action: 'update_page',
      entityType: 'schedule',
      entityId: id,
      metadata: {
        action: 'cancel',
      },
      context: {
        userId: session.user.id,
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Schedule cancelled successfully',
    });

  } catch (error) {
    console.error('CMS Schedule Cancel Error:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Not Found', message: error.message },
        { status: 404 }
      );
    }

    if (error instanceof Error && error.message.includes('pending')) {
      return NextResponse.json(
        { error: 'Bad Request', message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to cancel schedule',
      },
      { status: 500 }
    );
  }
}
