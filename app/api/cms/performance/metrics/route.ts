/**
 * Performance Metrics API
 * 
 * GET /api/cms/performance/metrics - Get performance metrics
 * POST /api/cms/performance/metrics - Record a performance metric
 * DELETE /api/cms/performance/metrics - Cleanup old metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import {
  recordMetric,
  recordMetricsBatch,
  getMetrics,
  cleanupOldMetrics,
  type MetricType,
} from '@/lib/cms/performance-service';

// ============================================================================
// Validation Schemas
// ============================================================================

const recordMetricSchema = z.object({
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
  metricName: z.string().min(1),
  value: z.number(),
  unit: z.string().min(1),
  context: z.record(z.unknown()).optional(),
  tags: z.array(z.string()).optional(),
});

const batchMetricsSchema = z.object({
  metrics: z.array(recordMetricSchema),
});

// ============================================================================
// GET - Get Performance Metrics
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

    // Only Super Admin can view performance metrics
    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Super Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const metricType = searchParams.get('metricType') as MetricType | null;
    const metricName = searchParams.get('metricName');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const tags = searchParams.get('tags')?.split(',');
    const limit = searchParams.get('limit');

    const metrics = await getMetrics({
      metricType: metricType || undefined,
      metricName: metricName || undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      tags,
      limit: limit ? parseInt(limit) : undefined,
    });

    return NextResponse.json({
      success: true,
      data: metrics,
      count: metrics.length,
    });
  } catch (error) {
    console.error('Error fetching performance metrics:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch metrics',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Record Performance Metric(s)
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

    const body = await request.json();

    // Check if it's a batch request
    if (body.metrics && Array.isArray(body.metrics)) {
      const validatedData = batchMetricsSchema.parse(body);

      const metrics = await recordMetricsBatch(
        validatedData.metrics.map(m => ({
          ...m,
          recordedBy: session.user.id,
        }))
      );

      return NextResponse.json({
        success: true,
        message: `${metrics.length} metrics recorded successfully`,
        data: metrics,
      });
    } else {
      // Single metric
      const validatedData = recordMetricSchema.parse(body);

      const metric = await recordMetric({
        ...validatedData,
        recordedBy: session.user.id,
      });

      return NextResponse.json({
        success: true,
        message: 'Metric recorded successfully',
        data: metric,
      });
    }
  } catch (error) {
    console.error('Error recording performance metric:', error);

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
        error: error instanceof Error ? error.message : 'Failed to record metric',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Cleanup Old Metrics
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

    // Only Super Admin can cleanup metrics
    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Super Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const days = searchParams.get('days');

    const deletedCount = await cleanupOldMetrics(
      days ? parseInt(days) : undefined
    );

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${deletedCount} old metrics`,
      deletedCount,
    });
  } catch (error) {
    console.error('Error cleaning up metrics:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cleanup metrics',
      },
      { status: 500 }
    );
  }
}
