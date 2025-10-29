/**
 * CMS Activity Log Service
 * Tracks and retrieves all CMS actions for audit trail
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export type ActivityAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'publish'
  | 'unpublish'
  | 'archive'
  | 'restore'
  | 'duplicate'
  | 'schedule'
  | 'update_schedule'
  | 'delete_schedule'
  | 'bulk_publish'
  | 'bulk_unpublish'
  | 'bulk_delete'
  | 'bulk_archive'
  | 'bulk_restore'
  | 'bulk_duplicate'
  | 'bulk_update'
  | 'bulk_tag'
  | 'bulk_untag'
  | 'bulk_move'
  | 'upload'
  | 'replace'
  | 'optimize'
  | 'login'
  | 'logout'
  | 'permission_change';

export type ActivityEntityType =
  | 'page'
  | 'section'
  | 'template'
  | 'media'
  | 'category'
  | 'workflow'
  | 'schedule'
  | 'user'
  | 'system';

export interface ActivityLogEntry {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  changes: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  // User data fetched separately
  user?: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

export interface ActivityLogFilters {
  userId?: string;
  action?: string | string[];
  entityType?: string | string[];
  entityId?: string;
  startDate?: Date;
  endDate?: Date;
  ipAddress?: string;
  search?: string;
}

export interface ActivityLogOptions {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'action' | 'entityType';
  sortOrder?: 'asc' | 'desc';
  includeUser?: boolean;
}

export interface ActivityLogResponse {
  logs: ActivityLogEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    summary: string;
    active: number;
  };
}

/**
 * Log a CMS activity
 */
export async function logActivity(
  userId: string,
  action: ActivityAction,
  entityType: ActivityEntityType,
  entityId: string,
  changes?: Record<string, unknown>,
  metadata?: {
    ipAddress?: string | null;
    userAgent?: string | null;
  }
): Promise<void> {
  try {
    await prisma.cmsActivityLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        changes: changes || {},
        ipAddress: metadata?.ipAddress || null,
        userAgent: metadata?.userAgent || null
      }
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
    // Don't throw - logging failures shouldn't break the main operation
  }
}

/**
 * Get activity logs with filtering and pagination
 */
export async function getActivityLogs(
  filters: ActivityLogFilters = {},
  options: ActivityLogOptions = {}
): Promise<ActivityLogResponse> {
  const {
    page = 1,
    limit = 50,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    includeUser = true
  } = options;

  const skip = (page - 1) * limit;

  // Build where clause
  const where: Prisma.CmsActivityLogWhereInput = {};

  if (filters.userId) {
    where.userId = filters.userId;
  }

  if (filters.action) {
    where.action = Array.isArray(filters.action)
      ? { in: filters.action }
      : filters.action;
  }

  if (filters.entityType) {
    where.entityType = Array.isArray(filters.entityType)
      ? { in: filters.entityType }
      : filters.entityType;
  }

  if (filters.entityId) {
    where.entityId = filters.entityId;
  }

  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.createdAt.lte = filters.endDate;
    }
  }

  if (filters.ipAddress) {
    where.ipAddress = { contains: filters.ipAddress };
  }

  if (filters.search) {
    where.OR = [
      { action: { contains: filters.search, mode: 'insensitive' } },
      { entityType: { contains: filters.search, mode: 'insensitive' } },
      { entityId: { contains: filters.search, mode: 'insensitive' } }
    ];
  }

  // Get total count
  const total = await prisma.cmsActivityLog.count({ where });

  // Get logs
  const logs = await prisma.cmsActivityLog.findMany({
    where,
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder }
  });

  // Fetch user data if requested
  let logsWithUsers: ActivityLogEntry[] = logs as ActivityLogEntry[];
  
  if (includeUser) {
    const userIds = Array.from(new Set(logs.map(log => log.userId)));
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        email: true,
        image: true
      }
    });
    
    const userMap = new Map(users.map(u => [u.id, u]));
    logsWithUsers = logs.map(log => ({
      ...log,
      user: userMap.get(log.userId)
    })) as ActivityLogEntry[];
  }

  // Count active filters
  const activeFilters = Object.keys(filters).filter(key => {
    const value = filters[key as keyof ActivityLogFilters];
    return value !== undefined && value !== null;
  }).length;

  // Generate filter summary
  const filterSummary = generateFilterSummary(filters);

  return {
    logs: logsWithUsers,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    },
    filters: {
      summary: filterSummary,
      active: activeFilters
    }
  };
}

/**
 * Get activity logs for a specific entity
 */
export async function getEntityActivityLogs(
  entityType: ActivityEntityType,
  entityId: string,
  options: ActivityLogOptions = {}
): Promise<ActivityLogEntry[]> {
  const { limit = 50, includeUser = true } = options;

  const logs = await prisma.cmsActivityLog.findMany({
    where: {
      entityType,
      entityId
    },
    take: limit,
    orderBy: { createdAt: 'desc' }
  });

  // Fetch user data if requested
  if (includeUser) {
    const userIds = Array.from(new Set(logs.map(log => log.userId)));
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        email: true,
        image: true
      }
    });
    
    const userMap = new Map(users.map(u => [u.id, u]));
    return logs.map(log => ({
      ...log,
      user: userMap.get(log.userId)
    })) as ActivityLogEntry[];
  }

  return logs as ActivityLogEntry[];
}

/**
 * Get activity logs for a specific user
 */
export async function getUserActivityLogs(
  userId: string,
  options: ActivityLogOptions = {}
): Promise<ActivityLogEntry[]> {
  const { limit = 50, includeUser = false } = options;

  const logs = await prisma.cmsActivityLog.findMany({
    where: { userId },
    take: limit,
    orderBy: { createdAt: 'desc' }
  });

  // Fetch user data if requested
  if (includeUser) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true
      }
    });
    
    if (user) {
      return logs.map(log => ({
        ...log,
        user
      })) as ActivityLogEntry[];
    }
  }

  return logs as ActivityLogEntry[];
}

/**
 * Get activity statistics
 */
export async function getActivityStats(
  filters: ActivityLogFilters = {}
): Promise<{
  totalActivities: number;
  activitiesByAction: Record<string, number>;
  activitiesByEntityType: Record<string, number>;
  activitiesByUser: Array<{ userId: string; count: number; userName: string | null }>;
  recentActivity: ActivityLogEntry[];
}> {
  const where: Prisma.CmsActivityLogWhereInput = {};

  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.createdAt.lte = filters.endDate;
    }
  }

  // Total activities
  const totalActivities = await prisma.cmsActivityLog.count({ where });

  // Activities by action
  const actionGroups = await prisma.cmsActivityLog.groupBy({
    by: ['action'],
    where,
    _count: { action: true }
  });

  const activitiesByAction: Record<string, number> = {};
  actionGroups.forEach(group => {
    activitiesByAction[group.action] = group._count.action;
  });

  // Activities by entity type
  const entityTypeGroups = await prisma.cmsActivityLog.groupBy({
    by: ['entityType'],
    where,
    _count: { entityType: true }
  });

  const activitiesByEntityType: Record<string, number> = {};
  entityTypeGroups.forEach(group => {
    activitiesByEntityType[group.entityType] = group._count.entityType;
  });

  // Activities by user
  const userGroups = await prisma.cmsActivityLog.groupBy({
    by: ['userId'],
    where,
    _count: { userId: true },
    orderBy: { _count: { userId: 'desc' } },
    take: 10
  });

  const topUserIds = userGroups.map(g => g.userId);
  const topUsers = await prisma.user.findMany({
    where: { id: { in: topUserIds } },
    select: { id: true, name: true }
  });

  const topUserMap = new Map(topUsers.map(u => [u.id, u.name]));

  const activitiesByUser = userGroups.map(group => ({
    userId: group.userId,
    count: group._count.userId,
    userName: topUserMap.get(group.userId) || null
  }));

  // Recent activity
  const recentActivity = await prisma.cmsActivityLog.findMany({
    where,
    take: 10,
    orderBy: { createdAt: 'desc' }
  });

  // Fetch user data for recent activity
  const recentUserIds = Array.from(new Set(recentActivity.map(log => log.userId)));
  const recentUsers = await prisma.user.findMany({
    where: { id: { in: recentUserIds } },
    select: {
      id: true,
      name: true,
      email: true,
      image: true
    }
  });
  
  const recentUserMap = new Map(recentUsers.map(u => [u.id, u]));
  const recentActivityWithUsers = recentActivity.map(log => ({
    ...log,
    user: recentUserMap.get(log.userId)
  })) as ActivityLogEntry[];

  return {
    totalActivities,
    activitiesByAction,
    activitiesByEntityType,
    activitiesByUser,
    recentActivity: recentActivityWithUsers
  };
}

/**
 * Delete old activity logs (data retention)
 */
export async function cleanupOldLogs(daysToKeep: number = 90): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const result = await prisma.cmsActivityLog.deleteMany({
    where: {
      createdAt: { lt: cutoffDate }
    }
  });

  return result.count;
}

/**
 * Export activity logs to JSON
 */
export async function exportActivityLogs(
  filters: ActivityLogFilters = {}
): Promise<ActivityLogEntry[]> {
  const where: Prisma.CmsActivityLogWhereInput = {};

  if (filters.userId) where.userId = filters.userId;
  if (filters.action) {
    where.action = Array.isArray(filters.action) ? { in: filters.action } : filters.action;
  }
  if (filters.entityType) {
    where.entityType = Array.isArray(filters.entityType) 
      ? { in: filters.entityType } 
      : filters.entityType;
  }
  if (filters.entityId) where.entityId = filters.entityId;
  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = filters.startDate;
    if (filters.endDate) where.createdAt.lte = filters.endDate;
  }

  const logs = await prisma.cmsActivityLog.findMany({
    where,
    orderBy: { createdAt: 'desc' }
  });

  // Fetch user data
  const userIds = Array.from(new Set(logs.map(log => log.userId)));
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      name: true,
      email: true,
      image: true
    }
  });
  
  const userMap = new Map(users.map(u => [u.id, u]));
  const logsWithUsers = logs.map(log => ({
    ...log,
    user: userMap.get(log.userId)
  })) as ActivityLogEntry[];

  return logsWithUsers;
}

/**
 * Generate human-readable filter summary
 */
function generateFilterSummary(filters: ActivityLogFilters): string {
  const parts: string[] = [];

  if (filters.userId) parts.push('filtered by user');
  if (filters.action) {
    const actions = Array.isArray(filters.action) ? filters.action.length : 1;
    parts.push(`${actions} action${actions > 1 ? 's' : ''}`);
  }
  if (filters.entityType) {
    const types = Array.isArray(filters.entityType) ? filters.entityType.length : 1;
    parts.push(`${types} entity type${types > 1 ? 's' : ''}`);
  }
  if (filters.entityId) parts.push('specific entity');
  if (filters.startDate || filters.endDate) parts.push('date range');
  if (filters.ipAddress) parts.push('IP address');
  if (filters.search) parts.push(`search: "${filters.search}"`);

  return parts.length > 0 ? parts.join(', ') : 'no filters';
}

/**
 * Get action display name
 */
export function getActionDisplayName(action: string): string {
  const displayNames: Record<string, string> = {
    create: 'Created',
    update: 'Updated',
    delete: 'Deleted',
    publish: 'Published',
    unpublish: 'Unpublished',
    archive: 'Archived',
    restore: 'Restored',
    duplicate: 'Duplicated',
    schedule: 'Scheduled',
    update_schedule: 'Updated Schedule',
    delete_schedule: 'Deleted Schedule',
    bulk_publish: 'Bulk Published',
    bulk_unpublish: 'Bulk Unpublished',
    bulk_delete: 'Bulk Deleted',
    bulk_archive: 'Bulk Archived',
    bulk_restore: 'Bulk Restored',
    bulk_duplicate: 'Bulk Duplicated',
    bulk_update: 'Bulk Updated',
    bulk_tag: 'Bulk Tagged',
    bulk_untag: 'Bulk Untagged',
    bulk_move: 'Bulk Moved',
    upload: 'Uploaded',
    replace: 'Replaced',
    optimize: 'Optimized',
    login: 'Logged In',
    logout: 'Logged Out',
    permission_change: 'Permission Changed'
  };

  return displayNames[action] || action;
}

/**
 * Get entity type display name
 */
export function getEntityTypeDisplayName(entityType: string): string {
  const displayNames: Record<string, string> = {
    page: 'Page',
    section: 'Section',
    template: 'Template',
    media: 'Media',
    category: 'Category',
    workflow: 'Workflow',
    schedule: 'Schedule',
    user: 'User',
    system: 'System'
  };

  return displayNames[entityType] || entityType;
}
