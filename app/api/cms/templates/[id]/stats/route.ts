/**
 * CMS Template Statistics API
 * 
 * @route GET /api/cms/templates/[id]/stats
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import templateService from '@/lib/cms/template-service';

// ============================================================================
// GET - Get template statistics
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only Super Admin can access template statistics
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = params;

    // Get template stats
    const stats = await templateService.getTemplateStats(id);

    return NextResponse.json({
      success: true,
      data: stats,
    });

  } catch (error) {
    console.error('CMS Template Stats Error:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Not Found', message: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to fetch template statistics',
      },
      { status: 500 }
    );
  }
}
