/**
 * CMS Page Workflow API
 * 
 * @route GET/POST /api/cms/pages/[id]/workflow
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import workflowService, { type WorkflowStatus } from '@/lib/cms/workflow-service';
import auditService from '@/lib/cms/audit-service';
import { createAuditContext } from '@/lib/cms/audit-context';
import { z } from 'zod';

// ============================================================================
// Validation Schemas
// ============================================================================

const transitionSchema = z.object({
  toStatus: z.enum(['draft', 'review', 'approved', 'published', 'archived']),
  comment: z.string().max(1000).optional(),
  metadata: z.record(z.unknown()).optional(),
});

// ============================================================================
// GET - Get workflow history for a page
// ============================================================================

export async function GET(
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

    // Only Super Admin can access workflow
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = params;

    // Get workflow history
    const history = await workflowService.getPageWorkflowHistory(id);

    // Get allowed transitions
    const page = await workflowService.canPublishPage(id);
    const currentStatus = history[0]?.toStatus || 'draft';
    const allowedTransitions = workflowService.getAllowedTransitions(
      currentStatus as WorkflowStatus,
      session.user.role
    );

    return NextResponse.json({
      success: true,
      data: {
        history,
        currentStatus,
        allowedTransitions,
        validationErrors: await workflowService.getWorkflowValidationErrors(id),
        canPublish: page.canPublish,
        publishReason: page.reason,
      },
    });

  } catch (error) {
    console.error('CMS Workflow GET Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to fetch workflow history',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Transition page workflow status
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

    // Only Super Admin can transition workflow
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = params;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = transitionSchema.parse(body);

    // Transition status
    await workflowService.transitionPageStatus(id, validatedData.toStatus, {
      userId: session.user.id,
      userRole: session.user.role,
      comment: validatedData.comment,
      metadata: validatedData.metadata,
    });

    // Log activity
    const auditContext = await createAuditContext(request);
    await auditService.logAudit({
      action: 'update_page',
      entityType: 'page',
      entityId: id,
      metadata: {
        workflowTransition: true,
        newStatus: validatedData.toStatus,
        comment: validatedData.comment,
      },
      context: {
        userId: session.user.id,
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Page transitioned to ${validatedData.toStatus}`,
    });

  } catch (error) {
    console.error('CMS Workflow POST Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation Error',
          message: 'Invalid transition data',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes('not allowed')) {
      return NextResponse.json(
        { error: 'Forbidden', message: error.message },
        { status: 403 }
      );
    }

    if (error instanceof Error && error.message.includes('required')) {
      return NextResponse.json(
        { error: 'Bad Request', message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to transition workflow status',
      },
      { status: 500 }
    );
  }
}
