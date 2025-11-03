/**
 * CMS SEO Generate Default API
 * 
 * @route POST /api/cms/seo/[pageId]/generate
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import seoService from '@/lib/cms/seo-service';
import auditService from '@/lib/cms/audit-service';
import { createAuditContext } from '@/lib/cms/audit-context';

// ============================================================================
// POST - Generate default SEO metadata
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { pageId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only Super Admin can generate SEO
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { pageId } = params;

    // Generate default SEO
    const defaultSeo = await seoService.generateDefaultSeo(pageId);

    // Update page with generated SEO
    await seoService.updatePageSeo(pageId, defaultSeo);

    // Log activity
    const auditContext = await createAuditContext(request);
    await auditService.logAudit({
      action: 'update_page',
      entityType: 'page',
      entityId: pageId,
      metadata: {
        action: 'generate_seo',
      },
      context: {
        userId: session.user.id,
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Default SEO metadata generated successfully',
      data: defaultSeo,
    });

  } catch (error) {
    console.error('CMS SEO Generate Error:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Not Found', message: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to generate SEO metadata',
      },
      { status: 500 }
    );
  }
}
