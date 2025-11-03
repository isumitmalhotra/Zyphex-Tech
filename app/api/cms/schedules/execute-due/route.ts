/**
 * CMS Execute Due Schedules API (Cron Job Endpoint)
 * 
 * This endpoint should be called by a cron job or scheduled task
 * to execute all schedules that are due.
 * 
 * Example cron setup:
 * - Every 5 minutes: `curl -X POST https://your-domain.com/api/cms/schedules/execute-due -H "Authorization: Bearer YOUR_CRON_SECRET"`
 * 
 * @route POST /api/cms/schedules/execute-due
 */

import { NextRequest, NextResponse } from 'next/server';
import schedulingService from '@/lib/cms/scheduling-service';

// ============================================================================
// POST - Execute all due schedules (Cron Job)
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // If cron secret is configured, verify it
    if (cronSecret) {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Missing authorization token' },
          { status: 401 }
        );
      }

      const token = authHeader.substring(7);
      if (token !== cronSecret) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Invalid authorization token' },
          { status: 401 }
        );
      }
    } else {
      console.warn('CRON_SECRET not configured - allowing unauthenticated access to execute-due endpoint');
    }

    // Execute all due schedules
    const executionResult = await schedulingService.executeDueSchedules();

    // Build response
    const response = {
      success: true,
      message: `Executed ${executionResult.results.length} schedules`,
      stats: {
        total: executionResult.results.length,
        successful: executionResult.executed,
        failed: executionResult.failed,
      },
      results: executionResult.results.map(r => ({
        scheduleId: r.id,
        success: r.success,
        error: r.error,
      })),
    };

    // Log summary
    console.log('Execute Due Schedules:', {
      total: executionResult.results.length,
      successful: executionResult.executed,
      failed: executionResult.failed,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('CMS Execute Due Schedules Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to execute due schedules',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Allow GET for health check
export async function GET() {
  return NextResponse.json({
    message: 'CMS Schedule Executor Endpoint',
    status: 'active',
    timestamp: new Date().toISOString(),
  });
}
