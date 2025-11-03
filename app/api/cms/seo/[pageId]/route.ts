/**
 * CMS SEO Metadata API
 * 
 * @route GET/PUT /api/cms/seo/[pageId]
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import seoService from '@/lib/cms/seo-service';
import auditService from '@/lib/cms/audit-service';
import { createAuditContext } from '@/lib/cms/audit-context';
import { z } from 'zod';

// ============================================================================
// Validation Schema
// ============================================================================

const updateSeoSchema = z.object({
  metaTitle: z.string().min(10).max(70).optional(),
  metaDescription: z.string().min(50).max(200).optional(),
  metaKeywords: z.string().optional(),
  canonicalUrl: z.string().url().optional(),
  robots: z.string().optional(),
  
  ogType: z.string().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().url().optional(),
  ogImageWidth: z.number().optional(),
  ogImageHeight: z.number().optional(),
  ogUrl: z.string().url().optional(),
  ogSiteName: z.string().optional(),
  ogLocale: z.string().optional(),
  
  twitterCard: z.enum(['summary', 'summary_large_image', 'app', 'player']).optional(),
  twitterSite: z.string().optional(),
  twitterCreator: z.string().optional(),
  twitterTitle: z.string().optional(),
  twitterDescription: z.string().optional(),
  twitterImage: z.string().url().optional(),
  
  structuredData: z.record(z.unknown()).optional(),
});

// ============================================================================
// GET - Get SEO metadata for a page
// ============================================================================

export async function GET(
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

    // Only Super Admin can access SEO data
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { pageId } = params;

    // Get SEO metadata
    const seoData = await seoService.getPageSeo(pageId);

    if (!seoData) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Page not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: seoData,
    });

  } catch (error) {
    console.error('CMS SEO Get Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to fetch SEO metadata',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT - Update SEO metadata for a page
// ============================================================================

export async function PUT(
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

    // Only Super Admin can update SEO data
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { pageId } = params;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateSeoSchema.parse(body);

    // Validate SEO metadata
    const validation = seoService.validateSeoMetadata(validatedData);
    if (!validation.valid) {
      return NextResponse.json(
        { 
          error: 'Validation Error',
          message: 'Invalid SEO metadata',
          details: validation.errors 
        },
        { status: 400 }
      );
    }

    // Update SEO metadata
    await seoService.updatePageSeo(pageId, validatedData);

    // Log activity
    const auditContext = await createAuditContext(request);
    await auditService.logAudit({
      action: 'update_page',
      entityType: 'page',
      entityId: pageId,
      metadata: {
        action: 'update_seo',
        fields: Object.keys(validatedData),
      },
      context: {
        userId: session.user.id,
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'SEO metadata updated successfully',
    });

  } catch (error) {
    console.error('CMS SEO Update Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation Error',
          message: 'Invalid request data',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Not Found', message: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to update SEO metadata',
      },
      { status: 500 }
    );
  }
}
