/**
 * CMS Templates Overview API
 * 
 * @route GET /api/cms/templates/overview
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import templateService from '@/lib/cms/template-service';

// ============================================================================
// GET - Get templates overview with statistics
// ============================================================================

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only Super Admin can access template overview
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get templates overview
    const overview = await templateService.getTemplatesOverview();

    return NextResponse.json({
      success: true,
      data: overview,
    });

  } catch (error) {
    console.error('CMS Templates Overview Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to fetch templates overview',
      },
      { status: 500 }
    );
  }
}
