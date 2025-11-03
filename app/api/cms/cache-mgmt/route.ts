/**
 * CMS Cache Management API
 * 
 * @route GET/DELETE /api/cms/cache-mgmt
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import cacheManager from '@/lib/cms/cache-service';
import auditService from '@/lib/cms/audit-service';
import { createAuditContext } from '@/lib/cms/audit-context';

// ============================================================================
// GET - Get cache statistics
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

    // Only Super Admin can access cache stats
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get cache statistics
    const stats = cacheManager.getStats();
    const redisConnected = cacheManager.isRedisConnected();

    return NextResponse.json({
      success: true,
      data: {
        stats,
        backend: redisConnected ? 'redis+memory' : 'memory',
        redisConnected,
      },
    });

  } catch (error) {
    console.error('CMS Cache Stats Error:', error);
    
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
// DELETE - Clear cache or invalidate by tag
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only Super Admin can clear cache
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = request.nextUrl;
    const tag = searchParams.get('tag');

    let deletedCount = 0;
    let action = '';

    if (tag) {
      // Invalidate by tag
      deletedCount = await cacheManager.deleteByTag(tag);
      action = `clear_tag:${tag}`;
    } else {
      // Clear all cache
      await cacheManager.clear();
      action = 'clear_all';
    }

    // Log activity
    const auditContext = await createAuditContext(request);
    await auditService.logAudit({
      action: 'update_page',
      entityType: 'page',
      entityId: 'cache-system',
      metadata: {
        action,
        deletedCount,
        cacheOperation: 'clear',
      },
      context: {
        userId: session.user.id,
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
      },
    });

    return NextResponse.json({
      success: true,
      message: tag ? `Cache cleared for tag: ${tag}` : 'All cache cleared',
      deletedCount,
    });

  } catch (error) {
    console.error('CMS Cache Clear Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to clear cache',
      },
      { status: 500 }
    );
  }
}
