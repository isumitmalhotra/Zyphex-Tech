/**
 * CMS Audit Logging Service
 * Comprehensive activity tracking for all CMS operations
 * 
 * Features:
 * - Automatic change detection (before/after values)
 * - IP address and user agent tracking
 * - Session context integration
 * - Structured metadata
 * - Query helpers for audit reports
 * - Automatic cleanup of old logs
 */

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// Types & Interfaces
// ============================================================================

export type AuditAction = 
  // Page Actions
  | 'create_page'
  | 'update_page'
  | 'delete_page'
  | 'publish_page'
  | 'unpublish_page'
  | 'archive_page'
  | 'restore_page'
  | 'duplicate_page'
  | 'restore_version'
  
  // Section Actions
  | 'create_section'
  | 'update_section'
  | 'delete_section'
  | 'reorder_sections'
  | 'duplicate_section'
  
  // Template Actions
  | 'create_template'
  | 'update_template'
  | 'delete_template'
  | 'apply_template'
  
  // Media Actions
  | 'upload_media'
  | 'update_media'
  | 'delete_media'
  | 'organize_media'
  
  // Workflow Actions
  | 'create_workflow'
  | 'update_workflow'
  | 'delete_workflow'
  | 'transition_state'
  
  // Schedule Actions
  | 'create_schedule'
  | 'update_schedule'
  | 'cancel_schedule'
  
  // Bulk Actions
  | 'bulk_update'
  | 'bulk_delete'
  | 'bulk_publish';

export type EntityType = 
  | 'page'
  | 'section'
  | 'template'
  | 'media'
  | 'workflow'
  | 'schedule'
  | 'bulk';

export interface AuditContext {
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  requestId?: string;
}

export interface AuditMetadata {
  [key: string]: unknown;
  duration?: number;
  errorMessage?: string;
  bulkCount?: number;
  affectedIds?: string[];
}

export interface AuditLogEntry {
  action: AuditAction;
  entityType: EntityType;
  entityId: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
  metadata?: AuditMetadata;
  context: AuditContext;
}

export interface AuditQueryOptions {
  userId?: string;
  action?: AuditAction | AuditAction[];
  entityType?: EntityType | EntityType[];
  entityId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

// ============================================================================
// Core Audit Functions
// ============================================================================

/**
 * Log a single audit entry
 */
export async function logAudit(entry: AuditLogEntry): Promise<void> {
  try {
    await prisma.cmsActivityLog.create({
      data: {
        userId: entry.context.userId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        changes: (entry.changes ?? null) as Prisma.InputJsonValue,
        metadata: {
          ...entry.metadata,
          sessionId: entry.context.sessionId,
          requestId: entry.context.requestId,
        } as Prisma.InputJsonValue,
        ipAddress: entry.context.ipAddress,
        userAgent: entry.context.userAgent,
      },
    });

    console.log(`📝 Audit logged: ${entry.action} on ${entry.entityType}:${entry.entityId}`);
  } catch (error) {
    console.error('❌ Failed to log audit entry:', error);
    // Don't throw - audit logging should not break the main flow
  }
}

/**
 * Log multiple audit entries (bulk operations)
 */
export async function logAuditBatch(entries: AuditLogEntry[]): Promise<void> {
  try {
    await prisma.cmsActivityLog.createMany({
      data: entries.map(entry => ({
        userId: entry.context.userId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        changes: (entry.changes ?? null) as Prisma.InputJsonValue,
        metadata: {
          ...entry.metadata,
          sessionId: entry.context.sessionId,
          requestId: entry.context.requestId,
        } as Prisma.InputJsonValue,
        ipAddress: entry.context.ipAddress,
        userAgent: entry.context.userAgent,
      })),
    });

    console.log(`📝 Batch audit logged: ${entries.length} entries`);
  } catch (error) {
    console.error('❌ Failed to log batch audit entries:', error);
  }
}

// ============================================================================
// Change Detection Helpers
// ============================================================================

/**
 * Detect changes between old and new objects
 */
export function detectChanges<T extends Record<string, unknown>>(
  oldData: T,
  newData: T,
  excludeFields: string[] = ['updatedAt', 'createdAt', 'id']
): Record<string, { old: unknown; new: unknown }> {
  const changes: Record<string, { old: unknown; new: unknown }> = {};

  // Check all keys in newData
  for (const key in newData) {
    if (excludeFields.includes(key)) continue;
    
    const oldValue = oldData[key];
    const newValue = newData[key];

    // Deep comparison for objects and arrays
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes[key] = {
        old: oldValue,
        new: newValue,
      };
    }
  }

  // Check for removed keys
  for (const key in oldData) {
    if (excludeFields.includes(key)) continue;
    if (!(key in newData)) {
      changes[key] = {
        old: oldData[key],
        new: undefined,
      };
    }
  }

  return changes;
}

/**
 * Create a sanitized snapshot of an object (removes sensitive data)
 */
export function createSnapshot<T extends Record<string, unknown>>(
  data: T,
  excludeFields: string[] = []
): Record<string, unknown> {
  const snapshot: Record<string, unknown> = {};

  for (const key in data) {
    if (excludeFields.includes(key)) continue;
    snapshot[key] = data[key];
  }

  return snapshot;
}

// ============================================================================
// High-Level Audit Wrappers
// ============================================================================

/**
 * Log page creation
 */
export async function logPageCreated(
  pageId: string,
  pageData: Record<string, unknown>,
  context: AuditContext
): Promise<void> {
  await logAudit({
    action: 'create_page',
    entityType: 'page',
    entityId: pageId,
    changes: {
      created: { old: null, new: createSnapshot(pageData) },
    },
    metadata: {
      pageType: pageData.pageType,
      status: pageData.status,
    },
    context,
  });
}

/**
 * Log page update with automatic change detection
 */
export async function logPageUpdated(
  pageId: string,
  oldData: Record<string, unknown>,
  newData: Record<string, unknown>,
  context: AuditContext
): Promise<void> {
  const changes = detectChanges(oldData, newData);

  if (Object.keys(changes).length === 0) {
    console.log('⚠️  No changes detected, skipping audit log');
    return;
  }

  await logAudit({
    action: 'update_page',
    entityType: 'page',
    entityId: pageId,
    changes,
    metadata: {
      fieldsChanged: Object.keys(changes),
      changeCount: Object.keys(changes).length,
    },
    context,
  });
}

/**
 * Log page deletion
 */
export async function logPageDeleted(
  pageId: string,
  pageData: Record<string, unknown>,
  context: AuditContext,
  isSoftDelete: boolean = true
): Promise<void> {
  await logAudit({
    action: 'delete_page',
    entityType: 'page',
    entityId: pageId,
    changes: {
      deleted: { old: createSnapshot(pageData), new: null },
    },
    metadata: {
      softDelete: isSoftDelete,
      pageTitle: pageData.pageTitle,
      slug: pageData.slug,
    },
    context,
  });
}

/**
 * Log page publish
 */
export async function logPagePublished(
  pageId: string,
  context: AuditContext,
  scheduledPublish: boolean = false
): Promise<void> {
  await logAudit({
    action: 'publish_page',
    entityType: 'page',
    entityId: pageId,
    metadata: {
      scheduledPublish,
      publishedAt: new Date().toISOString(),
    },
    context,
  });
}

/**
 * Log page unpublish
 */
export async function logPageUnpublished(
  pageId: string,
  context: AuditContext
): Promise<void> {
  await logAudit({
    action: 'unpublish_page',
    entityType: 'page',
    entityId: pageId,
    metadata: {
      unpublishedAt: new Date().toISOString(),
    },
    context,
  });
}

/**
 * Log version restore
 */
export async function logVersionRestored(
  pageId: string,
  versionNumber: number,
  context: AuditContext
): Promise<void> {
  await logAudit({
    action: 'restore_version',
    entityType: 'page',
    entityId: pageId,
    metadata: {
      restoredFromVersion: versionNumber,
      restoredAt: new Date().toISOString(),
    },
    context,
  });
}

/**
 * Log section creation
 */
export async function logSectionCreated(
  sectionId: string,
  pageId: string,
  sectionData: Record<string, unknown>,
  context: AuditContext
): Promise<void> {
  await logAudit({
    action: 'create_section',
    entityType: 'section',
    entityId: sectionId,
    changes: {
      created: { old: null, new: createSnapshot(sectionData) },
    },
    metadata: {
      pageId,
      sectionKey: sectionData.sectionKey,
      sectionType: sectionData.sectionType,
    },
    context,
  });
}

/**
 * Log section update
 */
export async function logSectionUpdated(
  sectionId: string,
  oldData: Record<string, unknown>,
  newData: Record<string, unknown>,
  context: AuditContext
): Promise<void> {
  const changes = detectChanges(oldData, newData);

  if (Object.keys(changes).length === 0) {
    return;
  }

  await logAudit({
    action: 'update_section',
    entityType: 'section',
    entityId: sectionId,
    changes,
    metadata: {
      pageId: newData.pageId,
      fieldsChanged: Object.keys(changes),
    },
    context,
  });
}

/**
 * Log section deletion
 */
export async function logSectionDeleted(
  sectionId: string,
  sectionData: Record<string, unknown>,
  context: AuditContext
): Promise<void> {
  await logAudit({
    action: 'delete_section',
    entityType: 'section',
    entityId: sectionId,
    changes: {
      deleted: { old: createSnapshot(sectionData), new: null },
    },
    metadata: {
      pageId: sectionData.pageId,
      sectionKey: sectionData.sectionKey,
    },
    context,
  });
}

/**
 * Log section reorder
 */
export async function logSectionsReordered(
  pageId: string,
  oldOrder: Array<{ id: string; order: number }>,
  newOrder: Array<{ id: string; order: number }>,
  context: AuditContext
): Promise<void> {
  await logAudit({
    action: 'reorder_sections',
    entityType: 'section',
    entityId: pageId,
    changes: {
      order: { old: oldOrder, new: newOrder },
    },
    metadata: {
      affectedSections: newOrder.map(s => s.id),
      sectionCount: newOrder.length,
    },
    context,
  });
}

/**
 * Log bulk operation
 */
export async function logBulkOperation(
  action: 'bulk_update' | 'bulk_delete' | 'bulk_publish',
  entityType: EntityType,
  entityIds: string[],
  context: AuditContext,
  metadata?: AuditMetadata
): Promise<void> {
  await logAudit({
    action,
    entityType,
    entityId: 'bulk',
    metadata: {
      ...metadata,
      affectedIds: entityIds,
      bulkCount: entityIds.length,
    },
    context,
  });
}

// ============================================================================
// Query & Reporting Functions
// ============================================================================

/**
 * Get audit logs with filtering
 */
export async function getAuditLogs(options: AuditQueryOptions = {}) {
  const where: Prisma.CmsActivityLogWhereInput = {};

  if (options.userId) {
    where.userId = options.userId;
  }

  if (options.action) {
    where.action = Array.isArray(options.action)
      ? { in: options.action }
      : options.action;
  }

  if (options.entityType) {
    where.entityType = Array.isArray(options.entityType)
      ? { in: options.entityType }
      : options.entityType;
  }

  if (options.entityId) {
    where.entityId = options.entityId;
  }

  if (options.startDate || options.endDate) {
    where.createdAt = {};
    if (options.startDate) {
      where.createdAt.gte = options.startDate;
    }
    if (options.endDate) {
      where.createdAt.lte = options.endDate;
    }
  }

  const logs = await prisma.cmsActivityLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: options.limit || 100,
    skip: options.offset || 0,
  });

  return logs;
}

/**
 * Get audit log count
 */
export async function getAuditLogCount(options: AuditQueryOptions = {}): Promise<number> {
  const where: Prisma.CmsActivityLogWhereInput = {};

  if (options.userId) where.userId = options.userId;
  if (options.action) {
    where.action = Array.isArray(options.action) ? { in: options.action } : options.action;
  }
  if (options.entityType) {
    where.entityType = Array.isArray(options.entityType) ? { in: options.entityType } : options.entityType;
  }
  if (options.entityId) where.entityId = options.entityId;

  return await prisma.cmsActivityLog.count({ where });
}

/**
 * Get activity timeline for an entity
 */
export async function getEntityTimeline(
  entityType: EntityType,
  entityId: string,
  limit: number = 50
) {
  return await prisma.cmsActivityLog.findMany({
    where: {
      entityType,
      entityId,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Get user activity summary
 */
export async function getUserActivitySummary(
  userId: string,
  startDate?: Date,
  endDate?: Date
) {
  const where: Prisma.CmsActivityLogWhereInput = { userId };

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  const [totalActions, actionBreakdown] = await Promise.all([
    prisma.cmsActivityLog.count({ where }),
    prisma.cmsActivityLog.groupBy({
      by: ['action'],
      where,
      _count: { action: true },
    }),
  ]);

  return {
    userId,
    totalActions,
    actionBreakdown: actionBreakdown.map(group => ({
      action: group.action,
      count: group._count.action,
    })),
  };
}

/**
 * Get recent activity across all entities
 */
export async function getRecentActivity(limit: number = 50) {
  return await prisma.cmsActivityLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

// ============================================================================
// Maintenance Functions
// ============================================================================

/**
 * Clean up old audit logs
 */
export async function cleanupOldAuditLogs(
  daysToKeep: number = 90
): Promise<{ count: number }> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const result = await prisma.cmsActivityLog.deleteMany({
    where: {
      createdAt: {
        lt: cutoffDate,
      },
    },
  });

  console.log(`🧹 Cleaned up ${result.count} audit logs older than ${daysToKeep} days`);

  return { count: result.count };
}

/**
 * Archive old audit logs to external storage
 * (Implementation depends on your archival strategy)
 */
export async function archiveOldAuditLogs(
  daysToKeep: number = 90
): Promise<{ archived: number }> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const logsToArchive = await prisma.cmsActivityLog.findMany({
    where: {
      createdAt: {
        lt: cutoffDate,
      },
    },
  });

  // TODO: Implement actual archival logic (e.g., to S3, file storage, etc.)
  console.log(`📦 Would archive ${logsToArchive.length} audit logs`);

  return { archived: logsToArchive.length };
}

// ============================================================================
// Export All Functions
// ============================================================================

const auditService = {
  // Core functions
  logAudit,
  logAuditBatch,
  
  // Change detection
  detectChanges,
  createSnapshot,
  
  // Page operations
  logPageCreated,
  logPageUpdated,
  logPageDeleted,
  logPagePublished,
  logPageUnpublished,
  logVersionRestored,
  
  // Section operations
  logSectionCreated,
  logSectionUpdated,
  logSectionDeleted,
  logSectionsReordered,
  
  // Bulk operations
  logBulkOperation,
  
  // Query functions
  getAuditLogs,
  getAuditLogCount,
  getEntityTimeline,
  getUserActivitySummary,
  getRecentActivity,
  
  // Maintenance
  cleanupOldAuditLogs,
  archiveOldAuditLogs,
};

export default auditService;
