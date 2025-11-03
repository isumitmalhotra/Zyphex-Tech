/**
 * Performance Alerts API
 * 
 * GET /api/cms/performance/alerts - Get active alerts
 * POST /api/cms/performance/alerts - Create an alert
 * DELETE /api/cms/performance/alerts - Cleanup old alerts
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import {
  createAlert,
  getActiveAlerts,
  cleanupOldAlerts,
  type AlertSeverity,
  type MetricType,
} from '@/lib/cms/performance-service';

// ============================================================================
// Validation Schemas
// ============================================================================

const createAlertSchema = z.object({
  alertType: z.enum(['threshold_exceeded', 'anomaly_detected', 'degradation', 'outage']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  message: z.string().min(1),
  metricType: z.enum([
    'api_response_time',
    'page_load_time',
    'database_query_time',
    'cache_hit_rate',
    'memory_usage',
    'cpu_usage',
    'error_rate',
    'throughput',
    'custom',
  ]),
  threshold: z.number(),
  currentValue: z.number(),
  context: z.record(z.unknown()).optional(),
});

// ============================================================================
// GET - Get Active Alerts
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

    // Only Super Admin can view alerts
    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Super Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const severity = searchParams.get('severity') as AlertSeverity | null;
    const metricType = searchParams.get('metricType') as MetricType | null;

    const alerts = await getActiveAlerts({
      severity: severity || undefined,
      metricType: metricType || undefined,
    });

    return NextResponse.json({
      success: true,
      data: alerts,
      count: alerts.length,
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch alerts',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Create Alert
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

    // Only Super Admin can create alerts
    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Super Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createAlertSchema.parse(body);

    const alert = await createAlert(validatedData);

    return NextResponse.json({
      success: true,
      message: 'Alert created successfully',
      data: alert,
    });
  } catch (error) {
    console.error('Error creating alert:', error);

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
        error: error instanceof Error ? error.message : 'Failed to create alert',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Cleanup Old Alerts
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

    // Only Super Admin can cleanup alerts
    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Super Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const days = searchParams.get('days');

    const deletedCount = await cleanupOldAlerts(
      days ? parseInt(days) : undefined
    );

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${deletedCount} old alerts`,
      deletedCount,
    });
  } catch (error) {
    console.error('Error cleaning up alerts:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cleanup alerts',
      },
      { status: 500 }
    );
  }
}
