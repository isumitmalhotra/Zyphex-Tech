/**
 * CMS Global Search API
 * Search across all CMS entities (pages, templates, media, sections)
 * 
 * @route GET /api/cms/search
 * @access Protected - Requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { searchCMS, SearchQuery, SearchFilters } from '@/lib/cms/search-engine';
import { z } from 'zod';
import { cmsCache, cacheKeys, cacheTTL } from '@/lib/cache/redis';

const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  types: z.string().optional(), // Comma-separated: page,template,media,section
  status: z.string().optional(), // Comma-separated status values
  pageType: z.string().optional(),
  assetType: z.string().optional(),
  category: z.string().optional(),
  authorId: z.string().optional(),
  templateId: z.string().optional(),
  folderId: z.string().optional(),
  tags: z.string().optional(),
  publishedAfter: z.string().datetime().optional(),
  publishedBefore: z.string().datetime().optional(),
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
  limit: z.string().optional(),
  offset: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to search' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const validated = searchQuerySchema.parse(searchParams);

    // Build search query
    const query: SearchQuery = {
      query: validated.q,
      entityTypes: validated.types 
        ? validated.types.split(',').filter(t => ['page', 'template', 'media', 'section'].includes(t)) as ('page' | 'template' | 'media' | 'section')[]
        : ['page', 'template', 'media', 'section'],
      filters: buildFilters(validated),
      limit: validated.limit ? parseInt(validated.limit) : 20,
      offset: validated.offset ? parseInt(validated.offset) : 0,
    };

    // Create cache key from query parameters
    const cacheKey = cacheKeys.cmsSearch(JSON.stringify(query));

    // Try to get from cache, or perform search
    const cachedResult = await cmsCache(
      cacheKey,
      cacheTTL.shortTerm, // 5 minutes
      async () => {
        const startTime = Date.now();
        const results = await searchCMS(query);
        const searchTime = Date.now() - startTime;

        return {
          results,
          searchTime,
        };
      }
    );

    return NextResponse.json({
      success: true,
      data: cachedResult?.results || { pages: [], templates: [], media: [], sections: [], total: 0 },
      meta: {
        query: validated.q,
        searchTime: `${cachedResult?.searchTime || 0}ms`,
        total: cachedResult?.results?.total || 0,
        page: Math.floor((query.offset || 0) / (query.limit || 20)) + 1,
        limit: query.limit || 20,
      },
    });

  } catch (error) {
    console.error('CMS Search Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation Error',
          message: 'Invalid search parameters',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to perform search',
      },
      { status: 500 }
    );
  }
}

/**
 * Build search filters from query parameters
 */
function buildFilters(params: z.infer<typeof searchQuerySchema>): SearchFilters {
  const filters: SearchFilters = {};

  // Status filter
  if (params.status) {
    filters.status = params.status.split(',');
  }

  // Type filters
  if (params.pageType) {
    filters.pageType = params.pageType.split(',');
  }

  if (params.assetType) {
    filters.assetType = params.assetType.split(',');
  }

  // Category filter
  if (params.category) {
    filters.category = params.category.split(',');
  }

  // ID filters
  if (params.authorId) {
    filters.authorId = params.authorId;
  }

  if (params.templateId) {
    filters.templateId = params.templateId;
  }

  if (params.folderId) {
    filters.folderId = params.folderId;
  }

  // Tags filter
  if (params.tags) {
    filters.tags = params.tags.split(',');
  }

  // Date filters
  if (params.publishedAfter) {
    filters.publishedAfter = new Date(params.publishedAfter);
  }

  if (params.publishedBefore) {
    filters.publishedBefore = new Date(params.publishedBefore);
  }

  if (params.createdAfter) {
    filters.createdAfter = new Date(params.createdAfter);
  }

  if (params.createdBefore) {
    filters.createdBefore = new Date(params.createdBefore);
  }

  return filters;
}
