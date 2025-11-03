import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getApprovalRequest,
  approveStep,
  rejectApproval,
  delegateApproval,
  cancelApproval,
  getApprovalHistory,
} from '@/lib/cms/approval-service';
import { z } from 'zod';

const approveSchema = z.object({
  stepNumber: z.number().int().positive(),
  comments: z.string().optional(),
});

const rejectSchema = z.object({
  stepNumber: z.number().int().positive().optional(),
  reason: z.string().min(1),
});

const delegateSchema = z.object({
  stepNumber: z.number().int().positive(),
  delegatedTo: z.string(),
  delegatedToName: z.string(),
  delegatedToEmail: z.string().email(),
  reason: z.string().optional(),
});

/**
 * GET /api/cms/approvals/[id]
 * Get approval request details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const includeHistory = searchParams.get('includeHistory') === 'true';

    const approval = await getApprovalRequest(params.id);

    if (!approval) {
      return NextResponse.json(
        { success: false, error: 'Approval request not found' },
        { status: 404 }
      );
    }

    let history;
    if (includeHistory) {
      history = await getApprovalHistory(params.id);
    }

    return NextResponse.json({
      success: true,
      data: {
        approval,
        history,
      },
    });
  } catch (error) {
    console.error('Error fetching approval:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch approval',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cms/approvals/[id]
 * Perform approval actions (approve, reject, delegate, cancel)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const action = body.action;

    let result;
    let message;

    switch (action) {
      case 'approve':
        const approveData = approveSchema.parse(body);
        result = await approveStep(params.id, approveData.stepNumber, {
          approverId: session.user.id,
          approverName: session.user.name || 'Unknown',
          approverEmail: session.user.email || '',
          comments: approveData.comments,
        });
        message = 'Approval step completed successfully';
        break;

      case 'reject':
        const rejectData = rejectSchema.parse(body);
        result = await rejectApproval(params.id, {
          rejectedBy: session.user.id,
          rejectedByName: session.user.name || 'Unknown',
          rejectedByEmail: session.user.email || '',
          reason: rejectData.reason,
          stepNumber: rejectData.stepNumber,
        });
        message = 'Approval request rejected';
        break;

      case 'delegate':
        const delegateData = delegateSchema.parse(body);
        result = await delegateApproval(params.id, {
          delegatedBy: session.user.id,
          delegatedTo: delegateData.delegatedTo,
          delegatedToName: delegateData.delegatedToName,
          delegatedToEmail: delegateData.delegatedToEmail,
          reason: delegateData.reason,
          stepNumber: delegateData.stepNumber,
        });
        message = 'Approval delegated successfully';
        break;

      case 'cancel':
        result = await cancelApproval(
          params.id,
          session.user.id,
          body.reason
        );
        message = 'Approval request cancelled';
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result,
      message,
    });
  } catch (error) {
    console.error('Error performing approval action:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to perform action',
      },
      { status: 500 }
    );
  }
}
