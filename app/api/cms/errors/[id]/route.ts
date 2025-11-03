/**
 * Individual Error Operations API
 * 
 * GET /api/cms/errors/[id] - Get error log details
 * PATCH /api/cms/errors/[id] - Resolve error or bulk resolve
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import {
  getErrorLog,
  resolveError,
  resolveErrorsBulk,
} from '@/lib/cms/error-service';

// ============================================================================
// Validation Schemas
// ============================================================================

const resolveSchema = z.object({
  action: z.literal('resolve'),
});

const bulkResolveSchema = z.object({
  action: z.literal('bulkResolve'),
  errorIds: z.array(z.string()).min(1),
});

// ============================================================================
// GET - Get Error Log
// ============================================================================

export async function GET(
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

    // Only Super Admin can view error details
    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Super Admin access required' },
        { status: 403 }
      );
    }

    const error = await getErrorLog(params.id);

    if (!error) {
      return NextResponse.json(
        { success: false, error: 'Error log not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: error,
    });
  } catch (error) {
    console.error('Error fetching error log:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch error log',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH - Resolve Error(s)
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

    // Only Super Admin can resolve errors
    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Super Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const action = body.action;

    if (action === 'resolve') {
      resolveSchema.parse(body);
      const error = await resolveError(params.id, session.user.id);

      return NextResponse.json({
        success: true,
        message: 'Error resolved successfully',
        data: error,
      });
    } else if (action === 'bulkResolve') {
      const validatedData = bulkResolveSchema.parse(body);
      const resolvedCount = await resolveErrorsBulk(
        validatedData.errorIds,
        session.user.id
      );

      return NextResponse.json({
        success: true,
        message: `${resolvedCount} errors resolved successfully`,
        resolvedCount,
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Use "resolve" or "bulkResolve"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error resolving error:', error);

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
        error: error instanceof Error ? error.message : 'Failed to resolve error',
      },
      { status: 500 }
    );
  }
}
