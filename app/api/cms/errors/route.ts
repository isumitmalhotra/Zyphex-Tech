/**
 * Error Logs API
 * 
 * GET /api/cms/errors - Get error logs
 * POST /api/cms/errors - Log an error
 * DELETE /api/cms/errors - Cleanup old errors
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import {
  logError,
  getErrorLogs,
  cleanupOldErrors,
  type ErrorType,
  type ErrorSeverity,
} from '@/lib/cms/error-service';

// ============================================================================
// Validation Schemas
// ============================================================================

const logErrorSchema = z.object({
  errorType: z.enum([
    'validation_error',
    'authentication_error',
    'authorization_error',
    'not_found_error',
    'database_error',
    'network_error',
    'timeout_error',
    'rate_limit_error',
    'internal_server_error',
    'external_api_error',
    'business_logic_error',
    'unknown_error',
  ]),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  message: z.string().min(1),
  stackTrace: z.string().optional(),
  context: z.record(z.unknown()).optional(),
  userId: z.string().optional(),
  endpoint: z.string().optional(),
  method: z.string().optional(),
  statusCode: z.number().optional(),
  userAgent: z.string().optional(),
  ipAddress: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// ============================================================================
// GET - Get Error Logs
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

    // Only Super Admin can view error logs
    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Super Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const errorType = searchParams.get('errorType') as ErrorType | null;
    const severity = searchParams.get('severity') as ErrorSeverity | null;
    const resolved = searchParams.get('resolved');
    const userId = searchParams.get('userId');
    const endpoint = searchParams.get('endpoint');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const tags = searchParams.get('tags')?.split(',');
    const limit = searchParams.get('limit');

    const errors = await getErrorLogs({
      errorType: errorType || undefined,
      severity: severity || undefined,
      resolved: resolved ? resolved === 'true' : undefined,
      userId: userId || undefined,
      endpoint: endpoint || undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      tags,
      limit: limit ? parseInt(limit) : undefined,
    });

    return NextResponse.json({
      success: true,
      data: errors,
      count: errors.length,
    });
  } catch (error) {
    console.error('Error fetching error logs:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch error logs',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Log Error
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Errors can be logged without authentication (for client-side errors)
    // But if authenticated, attach user info

    const body = await request.json();
    const validatedData = logErrorSchema.parse(body);

    const errorLog = await logError({
      ...validatedData,
      userId: session?.user?.id || validatedData.userId,
    });

    return NextResponse.json({
      success: true,
      message: 'Error logged successfully',
      data: errorLog,
    });
  } catch (error) {
    console.error('Error logging error:', error);

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
        error: error instanceof Error ? error.message : 'Failed to log error',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Cleanup Old Errors
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only Super Admin can cleanup errors
    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Super Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const days = searchParams.get('days');

    const deletedCount = await cleanupOldErrors(
      days ? parseInt(days) : undefined
    );

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${deletedCount} old errors`,
      deletedCount,
    });
  } catch (error) {
    console.error('Error cleaning up errors:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cleanup errors',
      },
      { status: 500 }
    );
  }
}
