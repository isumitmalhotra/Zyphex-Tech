/**
 * CMS Upcoming Schedules API
 * 
 * @route GET /api/cms/schedules/upcoming
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import schedulingService from '@/lib/cms/scheduling-service';
import { z } from 'zod';

// ============================================================================
// Validation Schema
// ============================================================================

const querySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

// ============================================================================
// GET - Get upcoming schedules
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only Super Admin can access schedules
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse and validate query params
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const validatedQuery = querySchema.parse(searchParams);

    // Get upcoming schedules
    const schedules = await schedulingService.getUpcomingSchedules({
      days: validatedQuery.days,
      limit: validatedQuery.limit,
    });

    return NextResponse.json({
      success: true,
      data: schedules,
    });

  } catch (error) {
    console.error('CMS Upcoming Schedules Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation Error',
          message: 'Invalid query parameters',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to fetch upcoming schedules',
      },
      { status: 500 }
    );
  }
}
