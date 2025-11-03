/**
 * Automation Execution API
 * 
 * POST /api/cms/automation/execute - Trigger automation execution
 * GET /api/cms/automation/execute - Get execution history
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import {
  triggerAutomation,
  getAutomationExecutions,
  getAutomationStats,
} from '@/lib/cms/automation-service';

// ============================================================================
// Validation Schema
// ============================================================================

const triggerAutomationSchema = z.object({
  ruleId: z.string().min(1, 'Rule ID is required'),
  triggerType: z.string(),
  context: z.object({
    pageId: z.string().optional(),
    sectionId: z.string().optional(),
    userId: z.string().optional(),
    triggerData: z.record(z.unknown()),
    metadata: z.record(z.unknown()).optional(),
  }),
});

// ============================================================================
// POST - Trigger Automation
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only Super Admin can trigger automations
    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Super Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = triggerAutomationSchema.parse(body);

    const execution = await triggerAutomation({
      ...validatedData,
      userId: session.user.id,
      triggerType: validatedData.triggerType as never,
    });

    return NextResponse.json({
      success: true,
      message: 'Automation triggered successfully',
      data: execution,
    });
  } catch (error) {
    console.error('Error triggering automation:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to trigger automation',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET - Get Execution History
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

    // Only Super Admin can view execution history
    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Super Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const ruleId = searchParams.get('ruleId');
    const status = searchParams.get('status');
    const limit = searchParams.get('limit');
    const stats = searchParams.get('stats');

    // Return stats if requested
    if (stats === 'true') {
      const statistics = await getAutomationStats(ruleId || undefined);
      return NextResponse.json({
        success: true,
        data: statistics,
      });
    }

    const filters: Parameters<typeof getAutomationExecutions>[0] = {};

    if (ruleId) filters.ruleId = ruleId;
    if (status) filters.status = status as never;
    if (limit) filters.limit = parseInt(limit);

    const executions = await getAutomationExecutions(filters);

    return NextResponse.json({
      success: true,
      data: executions,
    });
  } catch (error) {
    console.error('Error getting automation executions:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get automation executions',
      },
      { status: 500 }
    );
  }
}
