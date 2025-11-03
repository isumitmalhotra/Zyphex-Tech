/**
 * CMS Pages API Route
 * Handles CRUD operations for CMS pages
 * 
 * @route /api/cms/pages
 * @access Protected - Requires CMS permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { 
  requirePermission, 
  userHasPermission,
} from '@/lib/cms/authorization';
import { CmsApiError } from '@/lib/cms/error-handler';
import { buildPageFilters, parseFilterParams } from '@/lib/cms/filter-builder';
import { cmsCache, cacheKeys, cacheTTL } from '@/lib/cache/redis';
import { invalidatePageCache } from '@/lib/cache/invalidation';
import { logPageCreated } from '@/lib/cms/audit-service';
import { createAuditContext } from '@/lib/cms/audit-context';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createPageSchema = z.object({
  pageKey: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  pageTitle: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-\/]+$/),
  pageType: z.enum(['standard', 'landing', 'blog', 'custom']).default('standard'),
  templateId: z.string().uuid().optional(),
  
  // SEO Metadata
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
  metaKeywords: z.string().max(255).optional(),
  ogImage: z.string().url().optional(),
  ogTitle: z.string().max(60).optional(),
  ogDescription: z.string().max(160).optional(),
  structuredData: z.record(z.any()).optional(),
  
  // Settings
  isPublic: z.boolean().default(true),
  requiresAuth: z.boolean().default(false),
  allowComments: z.boolean().default(false),
  layout: z.string().optional(),
});

// Export for use in other route files
export const updatePageSchema = createPageSchema.partial().extend({
  status: z.enum(['draft', 'review', 'scheduled', 'published', 'archived']).optional(),
  scheduledPublishAt: z.string().datetime().optional(),
  scheduledUnpublishAt: z.string().datetime().optional(),
});

// ============================================================================
// GET - List all pages with filtering and pagination
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Require view permission
    const user = await requirePermission('cms.pages.view');

    // Parse filter parameters from query string
    const filterOptions = parseFilterParams(request.nextUrl.searchParams);
    
    // Build Prisma query with filters
    const { where, orderBy, take, skip } = buildPageFilters(filterOptions);

    // Content editors can only see their own drafts unless they have higher permissions
    if (!userHasPermission(user, 'cms.pages.edit')) {
      // Add permission-based filter
      const permissionFilter = {
        OR: [
          { status: { not: 'draft' } }, // Can see all published/scheduled pages
          { authorId: user.id }, // Can see own drafts
        ],
      };
      
      // Merge with existing where clause
      Object.assign(where, {
        AND: [
          where,
          permissionFilter,
        ],
      });
    }

    // Create cache key based on filters and user permissions
    const cacheKey = cacheKeys.cmsPageList(JSON.stringify({ 
      where, 
      skip, 
      take, 
      orderBy,
      userId: user.id // Include user ID for permission-based caching
    }));

    // Try to get from cache, or fetch from database
    const cachedResult = await cmsCache(
      cacheKey,
      cacheTTL.shortTerm, // 5 minutes
      async () => {
        // Execute queries in parallel
        const [pages, totalCount] = await Promise.all([
          prisma.cmsPage.findMany({
            where,
            skip,
            take,
            orderBy,
            include: {
              template: {
                select: {
                  id: true,
                  name: true,
                  category: true,
                },
              },
              _count: {
                select: {
                  sections: true,
                  versions: true,
                },
              },
            },
          }),
          prisma.cmsPage.count({ where }),
        ]);

        // Calculate pagination metadata
        const page = filterOptions.page || 1;
        const limit = filterOptions.limit || 20;
        const totalPages = Math.ceil(totalCount / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        return {
          pages,
          pagination: {
            page,
            limit,
            totalCount,
            totalPages,
            hasNextPage,
            hasPrevPage,
          },
        };
      }
    );

    return NextResponse.json({
      success: true,
      data: cachedResult?.pages || [],
      pagination: cachedResult?.pagination || {
        page: 1,
        limit: 20,
        totalCount: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      },
      filters: filterOptions,
    });

  } catch (error) {
    console.error('CMS Pages GET Error:', error);
    
    if (error instanceof CmsApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
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
        message: 'Failed to fetch CMS pages',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Create a new CMS page
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Require create permission
    const user = await requirePermission('cms.pages.create');

    const body = await request.json();
    const validatedData = createPageSchema.parse(body);

    // Check if pageKey or slug already exists
    const existing = await prisma.cmsPage.findFirst({
      where: {
        OR: [
          { pageKey: validatedData.pageKey },
          { slug: validatedData.slug },
        ],
        deletedAt: null,
      },
    });

    if (existing) {
      throw new CmsApiError(
        existing.pageKey === validatedData.pageKey
          ? `Page with key "${validatedData.pageKey}" already exists`
          : `Page with slug "${validatedData.slug}" already exists`,
        409
      );
    }

    // Create the page
    const page = await prisma.cmsPage.create({
      data: {
        ...validatedData,
        authorId: user.id,
        lastEditedBy: user.id,
        status: 'draft',
      },
      include: {
        template: true,
      },
    });

    // Create initial version
    await prisma.cmsPageVersion.create({
      data: {
        pageId: page.id,
        versionNumber: 1,
        pageSnapshot: JSON.parse(JSON.stringify(page)),
        sectionsSnapshot: [],
        createdBy: user.id,
        changeDescription: 'Initial version',
      },
    });

    // Log activity with comprehensive audit service
    const auditContext = await createAuditContext(request, user.id);
    await logPageCreated(page.id, page as unknown as Record<string, unknown>, auditContext);

    // Invalidate page list cache
    await invalidatePageCache(page.id);

    return NextResponse.json(
      {
        success: true,
        message: 'Page created successfully',
        data: page,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('CMS Pages POST Error:', error);
    
    if (error instanceof CmsApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation Error',
          message: 'Invalid page data',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to create page',
      },
      { status: 500 }
    );
  }
}
