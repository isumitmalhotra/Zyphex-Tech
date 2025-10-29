/**
 * CMS Cache Invalidation Service
 * Smart cache busting based on entity relationships
 */

import {
  invalidateCmsPageCache,
  invalidateCmsTemplateCache,
  invalidateCmsMediaCache,
  invalidateCmsSearchCache,
  cacheDeletePattern
} from '@/lib/cache/redis';

/**
 * Invalidate cache when a page is modified
 */
export async function invalidatePageCache(pageId: string): Promise<void> {
  // Invalidate specific page
  await invalidateCmsPageCache(pageId);
  
  // Invalidate all page lists (they might include this page)
  await cacheDeletePattern('cms:pages:*');
  
  // Invalidate search results (page might appear in search)
  await invalidateCmsSearchCache();
  
  // Invalidate related sections
  await cacheDeletePattern(`cms:section:*:page:${pageId}`);
}

/**
 * Invalidate cache when a template is modified
 */
export async function invalidateTemplateCache(templateId: string): Promise<void> {
  // Invalidate specific template
  await invalidateCmsTemplateCache(templateId);
  
  // Invalidate all template lists
  await cacheDeletePattern('cms:templates:*');
  
  // Invalidate all pages using this template
  // (They need to be re-rendered with new template)
  await cacheDeletePattern('cms:pages:*');
  
  // Invalidate search
  await invalidateCmsSearchCache();
}

/**
 * Invalidate cache when media is modified
 */
export async function invalidateMediaCache(mediaId: string): Promise<void> {
  // Invalidate specific media
  await invalidateCmsMediaCache(mediaId);
  
  // Invalidate all media lists
  await cacheDeletePattern('cms:media:*');
  
  // Invalidate search
  await invalidateCmsSearchCache();
}

/**
 * Invalidate cache when a section is modified
 */
export async function invalidateSectionCache(sectionId: string, pageId?: string): Promise<void> {
  // Invalidate section cache
  await cacheDeletePattern(`cms:section:${sectionId}*`);
  
  // If we know the page, invalidate it
  if (pageId) {
    await invalidatePageCache(pageId);
  } else {
    // Otherwise invalidate all pages (safer but less efficient)
    await cacheDeletePattern('cms:pages:*');
  }
}

/**
 * Invalidate cache for bulk operations
 */
export async function invalidateBulkCache(
  entityType: 'page' | 'media' | 'section' | 'template',
  entityIds: string[]
): Promise<void> {
  switch (entityType) {
    case 'page':
      // Invalidate all affected pages
      for (const id of entityIds) {
        await invalidatePageCache(id);
      }
      break;
      
    case 'template':
      // Invalidate all affected templates
      for (const id of entityIds) {
        await invalidateTemplateCache(id);
      }
      break;
      
    case 'media':
      // Invalidate all affected media
      for (const id of entityIds) {
        await invalidateMediaCache(id);
      }
      break;
      
    case 'section':
      // Invalidate all affected sections
      for (const id of entityIds) {
        await invalidateSectionCache(id);
      }
      break;
  }
  
  // Always invalidate search after bulk operations
  await invalidateCmsSearchCache();
}

/**
 * Invalidate cache when publishing/unpublishing
 */
export async function invalidatePublishCache(
  entityType: 'page',
  entityId: string
): Promise<void> {
  // Publish state changes affect lists and search heavily
  await invalidatePageCache(entityId);
  await cacheDeletePattern('cms:pages:*');
  await invalidateCmsSearchCache();
  
  // Also invalidate stats (published count changes)
  await cacheDeletePattern('cms:stats:*');
}

/**
 * Invalidate cache when schedule is created/modified
 */
export async function invalidateScheduleCache(pageId: string): Promise<void> {
  // Schedules don't affect current state, but invalidate the page's schedule list
  await cacheDeletePattern(`cms:page:${pageId}:schedules`);
}

/**
 * Invalidate all activity log cache
 */
export async function invalidateActivityLogCache(): Promise<void> {
  await cacheDeletePattern('cms:activity:*');
}

/**
 * Invalidate stats cache
 */
export async function invalidateStatsCache(statType?: string): Promise<void> {
  if (statType) {
    await cacheDeletePattern(`cms:stats:${statType}*`);
  } else {
    await cacheDeletePattern('cms:stats:*');
  }
}

/**
 * Smart invalidation based on action type
 */
export async function smartInvalidate(
  action: string,
  entityType: 'page' | 'section' | 'template' | 'media',
  entityId: string,
  metadata?: { pageId?: string }
): Promise<void> {
  // Determine what to invalidate based on action
  const isDestructive = ['delete', 'archive'].includes(action);
  const isPublish = ['publish', 'unpublish'].includes(action);
  const isBulk = action.startsWith('bulk_');
  
  if (isBulk) {
    // Bulk operations need broad invalidation
    await cacheDeletePattern('cms:*');
    return;
  }
  
  if (isPublish && entityType === 'page') {
    await invalidatePublishCache('page', entityId);
    return;
  }
  
  if (isDestructive) {
    // Destructive actions affect lists heavily
    switch (entityType) {
      case 'page':
        await invalidatePageCache(entityId);
        break;
      case 'template':
        await invalidateTemplateCache(entityId);
        break;
      case 'media':
        await invalidateMediaCache(entityId);
        break;
      case 'section':
        await invalidateSectionCache(entityId, metadata?.pageId);
        break;
    }
    await invalidateStatsCache();
    return;
  }
  
  // Default: invalidate the specific entity
  switch (entityType) {
    case 'page':
      await invalidatePageCache(entityId);
      break;
    case 'template':
      await invalidateTemplateCache(entityId);
      break;
    case 'media':
      await invalidateMediaCache(entityId);
      break;
    case 'section':
      await invalidateSectionCache(entityId, metadata?.pageId);
      break;
  }
}
