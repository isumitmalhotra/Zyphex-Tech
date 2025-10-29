/**
 * CMS Media Library API Route
 * Handles CRUD operations for media files
 * 
 * @route /api/cms/media
 * @access Protected - Requires CMS media permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { 
  requirePermission,
  userHasPermission,
  requireOwnerOrPermission,
} from '@/lib/cms/authorization';
import { CmsApiError } from '@/lib/cms/error-handler';
import { deleteFile } from '@/lib/cms/file-storage';
import { buildMediaFilters, parseFilterParams } from '@/lib/cms/filter-builder';
import { cmsCache, cacheKeys, cacheTTL } from '@/lib/cache/redis';
import { invalidateMediaCache } from '@/lib/cache/invalidation';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const updateMediaSchema = z.object({
  altText: z.string().max(255).optional(),
  caption: z.string().max(500).optional(),
  description: z.string().max(1000).optional(),
  folderId: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
});

// ============================================================================
// GET - List media files with filtering and pagination
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Require view permission
    await requirePermission('cms.media.view');

    // Parse filter parameters from query string
    const filterOptions = parseFilterParams(request.nextUrl.searchParams);
    
    // Build Prisma query with filters
    const { where, orderBy, take, skip } = buildMediaFilters(filterOptions);

    // Create cache key based on filters
    const cacheKey = cacheKeys.cmsMediaList(JSON.stringify({ 
      where, 
      skip, 
      take, 
      orderBy
    }));

    // Try to get from cache, or fetch from database
    const cachedResult = await cmsCache(
      cacheKey,
      cacheTTL.dynamicContent, // 30 minutes
      async () => {
        // Execute queries in parallel
        const [mediaFiles, totalCount] = await Promise.all([
          prisma.cmsMediaAsset.findMany({
            where,
            skip,
            take,
            orderBy,
            select: {
              id: true,
              filename: true,
              originalName: true,
              filePath: true,
              fileUrl: true,
              mimeType: true,
              fileSize: true,
              assetType: true,
              folderId: true,
              altText: true,
              caption: true,
              description: true,
              width: true,
              height: true,
              aspectRatio: true,
              thumbnailUrl: true,
              optimizedUrl: true,
              tags: true,
              categories: true,
              uploadedBy: true,
              createdAt: true,
              updatedAt: true,
            },
          }),
          prisma.cmsMediaAsset.count({ where }),
        ]);

        // Calculate pagination metadata
        const page = filterOptions.page || 1;
        const limit = filterOptions.limit || 20;
        const totalPages = Math.ceil(totalCount / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        return {
          mediaFiles,
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
      data: cachedResult?.mediaFiles || [],
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
    console.error('CMS Media GET Error:', error);
    
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
        message: 'Failed to fetch media files',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH - Update media file metadata
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const mediaId = searchParams.get('id');

    if (!mediaId) {
      throw new CmsApiError('Media file ID is required', 400);
    }

    // Get media file
    const mediaFile = await prisma.cmsMediaAsset.findUnique({
      where: { id: mediaId },
    });

    if (!mediaFile) {
      throw new CmsApiError('Media file not found', 404);
    }

    // Check permissions (owner or edit permission)
    const user = await requireOwnerOrPermission(
      mediaFile.uploadedBy,
      'cms.media.edit'
    );

    // Parse and validate body
    const body = await request.json();
    const validatedData = updateMediaSchema.parse(body);

    // Update media file
    const updatedMedia = await prisma.cmsMediaAsset.update({
      where: { id: mediaId },
      data: validatedData,
    });

    // Log activity
    await prisma.cmsActivityLog.create({
      data: {
        userId: user.id,
        action: 'update_media',
        entityType: 'media',
        entityId: mediaFile.id,
        changes: validatedData,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
      },
    });

    // Invalidate media cache
    await invalidateMediaCache(mediaId);

    return NextResponse.json({
      success: true,
      message: 'Media file updated successfully',
      data: updatedMedia,
    });

  } catch (error) {
    console.error('CMS Media PATCH Error:', error);
    
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
          message: 'Invalid media data',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to update media file',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Delete media file
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const mediaId = searchParams.get('id');

    if (!mediaId) {
      throw new CmsApiError('Media file ID is required', 400);
    }

    // Get media file
    const mediaFile = await prisma.cmsMediaAsset.findUnique({
      where: { id: mediaId },
    });

    if (!mediaFile) {
      throw new CmsApiError('Media file not found', 404);
    }

    // Check permissions (owner or delete permission)
    const user = await requireOwnerOrPermission(
      mediaFile.uploadedBy,
      'cms.media.delete'
    );

    // Check if file is being used
    const usageCount = await prisma.cmsPageSection.count({
      where: {
        content: {
          path: ['$'],
          string_contains: mediaFile.filePath,
        },
      },
    });

    if (usageCount > 0 && !userHasPermission(user, 'cms.media.delete')) {
      throw new CmsApiError(
        `Cannot delete media file. It is being used in ${usageCount} section(s)`,
        409
      );
    }

    // Delete physical file
    try {
      await deleteFile(mediaFile.filePath);
      
      // Delete thumbnails if they exist
      if (mediaFile.thumbnailUrl) {
        await deleteFile(mediaFile.thumbnailUrl).catch(console.error);
      }
      if (mediaFile.optimizedUrl) {
        await deleteFile(mediaFile.optimizedUrl).catch(console.error);
      }
    } catch (error) {
      console.error('Error deleting physical file:', error);
      // Continue with database deletion even if file deletion fails
    }

    // Soft delete from database
    await prisma.cmsMediaAsset.update({
      where: { id: mediaId },
      data: {
        deletedAt: new Date(),
      },
    });

    // Log activity
    await prisma.cmsActivityLog.create({
      data: {
        userId: user.id,
        action: 'delete_media',
        entityType: 'media',
        entityId: mediaFile.id,
        changes: {
          filename: mediaFile.filename,
          filePath: mediaFile.filePath,
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
      },
    });

    // Invalidate media cache
    await invalidateMediaCache(mediaId);

    return NextResponse.json({
      success: true,
      message: 'Media file deleted successfully',
    });

  } catch (error) {
    console.error('CMS Media DELETE Error:', error);
    
    if (error instanceof CmsApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to delete media file',
      },
      { status: 500 }
    );
  }
}
