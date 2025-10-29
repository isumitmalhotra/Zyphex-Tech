/**
 * CMS Cache Management API
 * Provides cache statistics and management operations
 * 
 * @route /api/cms/cache
 * @access Protected - Requires admin permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/cms/authorization';
import { prisma } from '@/lib/prisma';
import { 
  getCacheStats,
  invalidateAllCmsCache,
  cacheDeletePattern,
} from '@/lib/cache/redis';
import { z } from 'zod';

// ============================================================================
// GET - Get cache statistics
// ============================================================================

export async function GET(_request: NextRequest) {
  try {
    // Require admin permission
    await requirePermission('cms.settings.edit');

    // Get cache statistics
    const stats = await getCacheStats();

    return NextResponse.json({
      success: true,
      data: stats,
    });

  } catch (error) {
    console.error('Cache Stats GET Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to fetch cache statistics',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Invalidate cache (selective or all)
// ============================================================================

const invalidateSchema = z.object({
  pattern: z.string().optional(), // e.g., "cms:pages:*" or "cms:template:123"
  scope: z.enum(['all', 'pages', 'templates', 'media', 'search', 'sections']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Require admin permission
    const user = await requirePermission('cms.settings.edit');

    const body = await request.json();
    const { pattern, scope } = invalidateSchema.parse(body);

    let result: { success: boolean; message: string };

    if (pattern) {
      // Invalidate specific pattern
      const success = await cacheDeletePattern(pattern);
      result = {
        success,
        message: success 
          ? `Cache pattern '${pattern}' invalidated successfully`
          : `Failed to invalidate cache pattern '${pattern}'`
      };
    } else if (scope) {
      // Invalidate by scope
      let success = false;
      switch (scope) {
        case 'all':
          await invalidateAllCmsCache();
          success = true;
          break;
        case 'pages':
          success = await cacheDeletePattern('cms:page*');
          break;
        case 'templates':
          success = await cacheDeletePattern('cms:template*');
          break;
        case 'media':
          success = await cacheDeletePattern('cms:media*');
          break;
        case 'search':
          success = await cacheDeletePattern('cms:search:*');
          break;
        case 'sections':
          success = await cacheDeletePattern('cms:section:*');
          break;
      }
      result = {
        success,
        message: success
          ? `${scope} cache invalidated successfully`
          : `Failed to invalidate ${scope} cache`
      };
    } else {
      // Default: invalidate all CMS cache
      await invalidateAllCmsCache();
      result = {
        success: true,
        message: 'All CMS cache invalidated successfully'
      };
    }

    // Log activity
    await prisma.cmsActivityLog.create({
      data: {
        userId: user.id,
        action: 'invalidate_cache',
        entityType: 'system',
        entityId: 'cache',
        changes: {
          pattern: pattern || scope || 'all',
          success: result.success,
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
      },
    });

    return NextResponse.json({
      success: result.success,
      message: result.message,
      data: {
        pattern: pattern || scope || 'all',
      },
    });

  } catch (error) {
    console.error('Cache Invalidation POST Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation Error',
          message: 'Invalid invalidation parameters',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to invalidate cache',
      },
      { status: 500 }
    );
  }
}
