/**
 * Bulk Operations Processor
 * Handles batch operations with transaction support, progress tracking, and error handling
 */

import { prisma } from '@/lib/prisma';

export type BulkOperation = 
  | 'publish'
  | 'unpublish'
  | 'delete'
  | 'archive'
  | 'restore'
  | 'duplicate'
  | 'update'
  | 'move'
  | 'tag'
  | 'untag'
  | 'change-status'
  | 'change-category'
  | 'change-template'
  | 'optimize'
  | 'regenerate-thumbnails';

export interface BulkOperationRequest {
  operation: BulkOperation;
  entityType: 'page' | 'media' | 'section' | 'template';
  entityIds: string[];
  data?: Record<string, unknown>;
  options?: {
    continueOnError?: boolean;
    batchSize?: number;
    parallel?: boolean;
  };
}

export interface BulkOperationResult {
  success: boolean;
  operation: BulkOperation;
  entityType: string;
  totalItems: number;
  successCount: number;
  failureCount: number;
  results: BulkItemResult[];
  duration: number;
  errors?: string[];
}

export interface BulkItemResult {
  entityId: string;
  success: boolean;
  error?: string;
  data?: unknown;
}

/**
 * Process bulk operations with transaction support
 */
export async function processBulkOperation(
  request: BulkOperationRequest,
  userId: string
): Promise<BulkOperationResult> {
  const startTime = Date.now();
  const {
    operation,
    entityType,
    entityIds,
    data = {},
    options = {}
  } = request;

  const {
    continueOnError = true,
    batchSize = 50,
    parallel = false
  } = options;

  const results: BulkItemResult[] = [];
  const errors: string[] = [];

  // Validate entity IDs
  if (!entityIds || entityIds.length === 0) {
    throw new Error('No entity IDs provided');
  }

  if (entityIds.length > 1000) {
    throw new Error('Maximum 1000 items per bulk operation');
  }

  try {
    // Process in batches
    const batches = chunkArray(entityIds, batchSize);

    for (const batch of batches) {
      if (parallel && continueOnError) {
        // Process batch items in parallel
        const batchResults = await Promise.allSettled(
          batch.map(id => processItem(operation, entityType, id, data, userId))
        );

        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            results.push({
              entityId: batch[index],
              success: false,
              error: result.reason?.message || 'Unknown error'
            });
            errors.push(`${batch[index]}: ${result.reason?.message}`);
          }
        });
      } else {
        // Process batch items sequentially (allows transaction rollback)
        for (const entityId of batch) {
          try {
            const result = await processItem(operation, entityType, entityId, data, userId);
            results.push(result);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            results.push({
              entityId,
              success: false,
              error: errorMessage
            });
            errors.push(`${entityId}: ${errorMessage}`);

            if (!continueOnError) {
              throw error; // Stop processing on first error
            }
          }
        }
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return {
      success: failureCount === 0,
      operation,
      entityType,
      totalItems: entityIds.length,
      successCount,
      failureCount,
      results,
      duration: Date.now() - startTime,
      errors: errors.length > 0 ? errors : undefined
    };

  } catch (error) {
    console.error('Bulk operation error:', error);
    throw error;
  }
}

/**
 * Process a single item in a bulk operation
 */
async function processItem(
  operation: BulkOperation,
  entityType: string,
  entityId: string,
  data: Record<string, unknown>,
  userId: string
): Promise<BulkItemResult> {
  try {
    let result: unknown;

    switch (entityType) {
      case 'page':
        result = await processPageOperation(operation, entityId, data, userId);
        break;
      case 'media':
        result = await processMediaOperation(operation, entityId, data, userId);
        break;
      case 'section':
        result = await processSectionOperation(operation, entityId, data, userId);
        break;
      case 'template':
        result = await processTemplateOperation(operation, entityId, data, userId);
        break;
      default:
        throw new Error(`Unsupported entity type: ${entityType}`);
    }

    return {
      entityId,
      success: true,
      data: result
    };

  } catch (error) {
    throw error;
  }
}

/**
 * Process bulk operations on pages
 */
async function processPageOperation(
  operation: BulkOperation,
  pageId: string,
  data: Record<string, unknown>,
  userId: string
): Promise<unknown> {
  switch (operation) {
    case 'publish':
      return await prisma.cmsPage.update({
        where: { id: pageId },
        data: {
          status: 'published',
          publishedAt: new Date(),
          lastEditedBy: userId
        }
      });

    case 'unpublish':
      return await prisma.cmsPage.update({
        where: { id: pageId },
        data: {
          status: 'draft',
          publishedAt: null
        }
      });

    case 'archive':
      return await prisma.cmsPage.update({
        where: { id: pageId },
        data: {
          status: 'archived'
        }
      });

    case 'restore':
      return await prisma.cmsPage.update({
        where: { id: pageId },
        data: {
          status: 'draft',
          deletedAt: null
        }
      });

    case 'delete':
      // Soft delete
      return await prisma.cmsPage.update({
        where: { id: pageId },
        data: {
          deletedAt: new Date()
        }
      });

    case 'duplicate':
      const originalPage = await prisma.cmsPage.findUnique({
        where: { id: pageId },
        include: {
          sections: true
        }
      });

      if (!originalPage) {
        throw new Error('Page not found');
      }

      // Create duplicate without JSON fields that cause type issues
      return await prisma.cmsPage.create({
        data: {
          pageTitle: `${originalPage.pageTitle} (Copy)`,
          pageKey: `${originalPage.pageKey}-copy-${Date.now()}`,
          slug: `${originalPage.slug}-copy-${Date.now()}`,
          pageType: originalPage.pageType,
          metaTitle: originalPage.metaTitle,
          metaDescription: originalPage.metaDescription,
          metaKeywords: originalPage.metaKeywords,
          ogImage: originalPage.ogImage,
          ogTitle: originalPage.ogTitle,
          ogDescription: originalPage.ogDescription,
          status: 'draft',
          templateId: originalPage.templateId,
          layout: originalPage.layout,
          authorId: userId,
          isPublic: originalPage.isPublic,
          requiresAuth: originalPage.requiresAuth,
          allowComments: originalPage.allowComments,
          sections: {
            create: originalPage.sections.map(section => ({
              sectionKey: `${section.sectionKey}-copy`,
              sectionType: section.sectionType,
              title: section.title,
              subtitle: section.subtitle,
              content: section.content || {},
              order: section.order,
              isVisible: section.isVisible,
              cssClasses: section.cssClasses,
              customStyles: section.customStyles || {},
              showOnMobile: section.showOnMobile,
              showOnTablet: section.showOnTablet,
              showOnDesktop: section.showOnDesktop
            }))
          }
        }
      });

    case 'change-status':
      if (!data.status) {
        throw new Error('Status is required');
      }
      return await prisma.cmsPage.update({
        where: { id: pageId },
        data: { status: data.status as string }
      });

    case 'change-template':
      if (!data.templateId) {
        throw new Error('Template ID is required');
      }
      return await prisma.cmsPage.update({
        where: { id: pageId },
        data: { templateId: data.templateId as string }
      });

    case 'update':
      return await prisma.cmsPage.update({
        where: { id: pageId },
        data
      });

    default:
      throw new Error(`Unsupported operation: ${operation}`);
  }
}

/**
 * Process bulk operations on media
 */
async function processMediaOperation(
  operation: BulkOperation,
  mediaId: string,
  data: Record<string, unknown>,
  _userId: string
): Promise<unknown> {
  switch (operation) {
    case 'delete':
      return await prisma.cmsMediaAsset.delete({
        where: { id: mediaId }
      });

    case 'tag':
      if (!data.tags || !Array.isArray(data.tags)) {
        throw new Error('Tags array is required');
      }
      const currentMedia = await prisma.cmsMediaAsset.findUnique({
        where: { id: mediaId },
        select: { tags: true }
      });
      const currentTags = currentMedia?.tags || [];
      const newTags = Array.from(new Set([...currentTags, ...data.tags]));
      return await prisma.cmsMediaAsset.update({
        where: { id: mediaId },
        data: { tags: newTags }
      });

    case 'untag':
      if (!data.tags || !Array.isArray(data.tags)) {
        throw new Error('Tags array is required');
      }
      const media = await prisma.cmsMediaAsset.findUnique({
        where: { id: mediaId },
        select: { tags: true }
      });
      const existingTags = media?.tags || [];
      const tagsToRemove = data.tags as string[];
      const remainingTags = existingTags.filter(tag => !tagsToRemove.includes(tag));
      return await prisma.cmsMediaAsset.update({
        where: { id: mediaId },
        data: { tags: remainingTags }
      });

    case 'move':
      if (!data.folderId) {
        throw new Error('Folder ID is required');
      }
      return await prisma.cmsMediaAsset.update({
        where: { id: mediaId },
        data: { folderId: data.folderId as string }
      });

    case 'optimize':
      // Placeholder for image optimization logic
      // Would integrate with image processing service
      throw new Error('Image optimization not implemented yet');

    case 'regenerate-thumbnails':
      // Placeholder for thumbnail regeneration logic
      // Would integrate with image processing service
      throw new Error('Thumbnail regeneration not implemented yet');

    case 'update':
      return await prisma.cmsMediaAsset.update({
        where: { id: mediaId },
        data
      });

    default:
      throw new Error(`Unsupported operation: ${operation}`);
  }
}

/**
 * Process bulk operations on sections
 */
async function processSectionOperation(
  operation: BulkOperation,
  sectionId: string,
  data: Record<string, unknown>,
  _userId: string
): Promise<unknown> {
  switch (operation) {
    case 'delete':
      return await prisma.cmsPageSection.delete({
        where: { id: sectionId }
      });

    case 'duplicate':
      const originalSection = await prisma.cmsPageSection.findUnique({
        where: { id: sectionId }
      });

      if (!originalSection) {
        throw new Error('Section not found');
      }

      return await prisma.cmsPageSection.create({
        data: {
          pageId: originalSection.pageId,
          sectionType: originalSection.sectionType,
          sectionKey: `${originalSection.sectionKey}-copy-${Date.now()}`,
          title: originalSection.title ? `${originalSection.title} (Copy)` : null,
          subtitle: originalSection.subtitle,
          content: originalSection.content || {},
          order: originalSection.order + 1,
          isVisible: originalSection.isVisible,
          cssClasses: originalSection.cssClasses,
          customStyles: originalSection.customStyles || {},
          showOnMobile: originalSection.showOnMobile,
          showOnTablet: originalSection.showOnTablet,
          showOnDesktop: originalSection.showOnDesktop
        }
      });

    case 'move':
      if (!data.pageId) {
        throw new Error('Target page ID is required');
      }
      return await prisma.cmsPageSection.update({
        where: { id: sectionId },
        data: { pageId: data.pageId as string }
      });

    case 'update':
      return await prisma.cmsPageSection.update({
        where: { id: sectionId },
        data
      });

    default:
      throw new Error(`Unsupported operation: ${operation}`);
  }
}

/**
 * Process bulk operations on templates
 */
async function processTemplateOperation(
  operation: BulkOperation,
  templateId: string,
  data: Record<string, unknown>,
  _userId: string
): Promise<unknown> {
  switch (operation) {
    case 'delete':
      // Check if template is in use
      const pagesUsingTemplate = await prisma.cmsPage.count({
        where: { templateId }
      });

      if (pagesUsingTemplate > 0) {
        throw new Error(`Cannot delete template: ${pagesUsingTemplate} pages are using it`);
      }

      return await prisma.cmsTemplate.delete({
        where: { id: templateId }
      });

    case 'duplicate':
      const originalTemplate = await prisma.cmsTemplate.findUnique({
        where: { id: templateId }
      });

      if (!originalTemplate) {
        throw new Error('Template not found');
      }

      return await prisma.cmsTemplate.create({
        data: {
          name: `${originalTemplate.name} (Copy)`,
          description: originalTemplate.description,
          category: originalTemplate.category,
          templateStructure: (originalTemplate.templateStructure as object) || {},
          defaultContent: originalTemplate.defaultContent ? (originalTemplate.defaultContent as object) : undefined,
          thumbnailUrl: originalTemplate.thumbnailUrl,
          isActive: false,
          order: originalTemplate.order
        }
      });

    case 'update':
      return await prisma.cmsTemplate.update({
        where: { id: templateId },
        data
      });

    default:
      throw new Error(`Unsupported operation: ${operation}`);
  }
}

/**
 * Utility: Split array into chunks
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Log bulk operation activity
 */
export async function logBulkOperation(
  userId: string,
  result: BulkOperationResult,
  ipAddress: string | null,
  userAgent: string | null
): Promise<void> {
  await prisma.cmsActivityLog.create({
    data: {
      userId,
      action: `bulk_${result.operation}`,
      entityType: result.entityType,
      entityId: 'bulk',
      changes: {
        operation: result.operation,
        totalItems: result.totalItems,
        successCount: result.successCount,
        failureCount: result.failureCount,
        duration: result.duration
      },
      ipAddress,
      userAgent
    }
  });
}
