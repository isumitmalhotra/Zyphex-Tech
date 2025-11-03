import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  createApprovalRequest,
  getPageApprovals,
  getUserPendingApprovals,
  CreateApprovalInput,
} from '@/lib/cms/approval-service';
import { z } from 'zod';

// Validation schemas
const approvalStepSchema = z.object({
  stepNumber: z.number().int().positive(),
  stepName: z.string().min(1),
  approverIds: z.array(z.string()).min(1),
  approverType: z.enum(['any', 'all']),
});

const createApprovalSchema = z.object({
  pageId: z.string(),
  steps: z.array(approvalStepSchema).min(1),
  comments: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * GET /api/cms/approvals
 * List approval requests
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('pageId');
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const pending = searchParams.get('pending') === 'true';

    let approvals;

    if (pending && userId) {
      // Get user's pending approvals
      approvals = await getUserPendingApprovals(userId);
    } else if (pageId) {
      // Get approvals for a specific page
      approvals = await getPageApprovals(pageId, {
        status: status as 'pending' | 'in_progress' | 'approved' | 'rejected' | 'cancelled' | undefined,
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'pageId or userId with pending=true is required' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: approvals,
    });
  } catch (error) {
    console.error('Error fetching approvals:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch approvals',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cms/approvals
 * Create a new approval request
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createApprovalSchema.parse(body);

    const input: CreateApprovalInput = {
      ...validatedData,
      requestedBy: session.user.id,
      requestedByName: session.user.name || 'Unknown',
      requestedByEmail: session.user.email || '',
    };

    const approval = await createApprovalRequest(input);

    return NextResponse.json({
      success: true,
      data: approval,
      message: 'Approval request created successfully',
    });
  } catch (error) {
    console.error('Error creating approval:', error);
    
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
        error: error instanceof Error ? error.message : 'Failed to create approval',
      },
      { status: 500 }
    );
  }
}
