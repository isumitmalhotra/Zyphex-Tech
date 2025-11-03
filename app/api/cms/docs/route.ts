/**
 * CMS API Documentation Endpoints
 * Task #27: Enhanced API Documentation with database-backed specs
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiDocsService } from '@/lib/cms/api-docs-service';
import { cmsApiSpec } from '@/lib/cms/api-spec';
import { z } from 'zod';

// Validation schemas
const upsertDocSchema = z.object({
  endpoint: z.string(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
  category: z.string(),
  title: z.string(),
  description: z.string(),
  requestSchema: z.any().optional(),
  requestExample: z.any().optional(),
  queryParameters: z.any().optional(),
  pathParameters: z.any().optional(),
  headers: z.any().optional(),
  responseSchema: z.any().optional(),
  responseExample: z.any().optional(),
  errorResponses: z.any().optional(),
  version: z.string().default('1.0.0'),
  deprecated: z.boolean().default(false),
  requiresAuth: z.boolean().default(true),
  requiredRoles: z.array(z.string()).default([]),
  rateLimits: z.any().optional(),
  tags: z.array(z.string()).default([]),
});

const bulkImportSchema = z.object({
  docs: z.array(upsertDocSchema),
});

/**
 * GET /api/cms/docs
 * Get API documentation with filters or OpenAPI spec
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');

    // If format=openapi, return OpenAPI spec
    if (format === 'openapi') {
      try {
        const spec = await apiDocsService.generateOpenApiSpec();
        return NextResponse.json(spec, {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      } catch (_error) {
        // Fallback to static spec if dynamic generation fails
        return NextResponse.json(cmsApiSpec, {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
    }

    // If format=stats, return statistics
    if (format === 'stats') {
      const stats = await apiDocsService.getStatistics();
      return NextResponse.json({
        success: true,
        data: stats,
      });
    }

    // Otherwise, return documentation list
    const category = searchParams.get('category') || undefined;
    const deprecated = searchParams.get('deprecated') === 'true' ? true : 
                       searchParams.get('deprecated') === 'false' ? false : undefined;
    const requiresAuth = searchParams.get('requiresAuth') === 'true' ? true :
                        searchParams.get('requiresAuth') === 'false' ? false : undefined;
    const tags = searchParams.get('tags')?.split(',').filter(Boolean);
    const search = searchParams.get('search') || undefined;
    const grouped = searchParams.get('grouped') === 'true';

    if (grouped) {
      const categories = await apiDocsService.getDocumentationByCategory();
      return NextResponse.json({
        success: true,
        data: categories,
      });
    } else {
      const docs = await apiDocsService.getAllDocumentation({
        category,
        deprecated,
        requiresAuth,
        tags,
        search,
      });

      return NextResponse.json({
        success: true,
        data: docs,
      });
    }
  } catch (error) {
    console.error('Error fetching API documentation:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch API documentation',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cms/docs
 * Create or update API documentation (Super Admin only)
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();

    // Check if this is a bulk import
    if (body.docs && Array.isArray(body.docs)) {
      const validated = bulkImportSchema.parse(body);
      const result = await apiDocsService.bulkImport(
        validated.docs,
        session.user.id
      );

      return NextResponse.json({
        success: true,
        data: result,
        message: `Imported ${result.imported} new docs, updated ${result.updated} existing docs`,
      });
    } else {
      const validated = upsertDocSchema.parse(body);
      const doc = await apiDocsService.upsertDocumentation(
        validated,
        session.user.id
      );

      return NextResponse.json({
        success: true,
        data: doc,
      });
    }
  } catch (error) {
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

    console.error('Error creating/updating API documentation:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create/update API documentation',
      },
      { status: 500 }
    );
  }
}

