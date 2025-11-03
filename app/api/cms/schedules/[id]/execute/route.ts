/**
 * CMS Schedule Execute API
 * 
 * @route POST /api/cms/schedules/[id]/execute
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import schedulingService from '@/lib/cms/scheduling-service';
import auditService from '@/lib/cms/audit-service';
import { createAuditContext } from '@/lib/cms/audit-context';

// ============================================================================
// POST - Execute schedule manually
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

    // Only Super Admin can execute schedules
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = params;

    // Execute schedule
    const result = await schedulingService.executeSchedule(id);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Execution Failed', message: result.error },
        { status: 400 }
      );
    }

    // Log activity
    const auditContext = await createAuditContext(request);
    await auditService.logAudit({
      action: 'update_page',
      entityType: 'schedule',
      entityId: id,
      metadata: {
        action: 'manual_execution',
      },
      context: {
        userId: session.user.id,
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Schedule executed successfully',
    });

  } catch (error) {
    console.error('CMS Schedule Execute Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to execute schedule',
      },
      { status: 500 }
    );
  }
}
