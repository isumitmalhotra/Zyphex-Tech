/**
 * Individual Alert Operations API
 * 
 * PATCH /api/cms/performance/alerts/[id] - Acknowledge or resolve an alert
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import {
  acknowledgeAlert,
  resolveAlert,
} from '@/lib/cms/performance-service';

// ============================================================================
// Validation Schemas
// ============================================================================

const acknowledgeSchema = z.object({
  action: z.literal('acknowledge'),
});

const resolveSchema = z.object({
  action: z.literal('resolve'),
});

// ============================================================================
// PATCH - Acknowledge or Resolve Alert
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only Super Admin can manage alerts
    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Super Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const action = body.action;

    let alert;

    if (action === 'acknowledge') {
      acknowledgeSchema.parse(body);
      alert = await acknowledgeAlert(params.id, session.user.id);

      return NextResponse.json({
        success: true,
        message: 'Alert acknowledged successfully',
        data: alert,
      });
    } else if (action === 'resolve') {
      resolveSchema.parse(body);
      alert = await resolveAlert(params.id);

      return NextResponse.json({
        success: true,
        message: 'Alert resolved successfully',
        data: alert,
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Use "acknowledge" or "resolve"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error managing alert:', error);

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
        error: error instanceof Error ? error.message : 'Failed to manage alert',
      },
      { status: 500 }
    );
  }
}
