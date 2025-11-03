/**
 * CMS API Documentation Individual Endpoint
 * Task #27: API Documentation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiDocsService } from '@/lib/cms/api-docs-service';

/**
 * GET /api/cms/docs/[id]
 * Get specific API documentation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const doc = await apiDocsService.getDocumentation(params.id);

    if (!doc) {
      return NextResponse.json(
        {
          success: false,
          error: 'Documentation not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: doc,
    });
  } catch (error) {
    console.error('Error fetching documentation:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch documentation',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cms/docs/[id]
 * Delete API documentation (Super Admin only)
 */
export async function DELETE(
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

    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Super Admin access required' },
        { status: 403 }
      );
    }

    await apiDocsService.deleteDocumentation(params.id);

    return NextResponse.json({
      success: true,
      message: 'Documentation deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting documentation:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete documentation',
      },
      { status: 500 }
    );
  }
}
