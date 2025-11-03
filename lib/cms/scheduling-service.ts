/**
 * CMS Scheduling Service
 * 
 * Manages scheduled publishing, unpublishing, and updates:
 * - Schedule pages to publish at specific date/time
 * - Schedule automatic unpublishing
 * - Timezone support
 * - Recurring schedules (future enhancement)
 * - Schedule execution and monitoring
 * 
 * @module lib/cms/scheduling-service
 */

import { prisma } from '@/lib/prisma';

// ============================================================================
// Types & Enums
// ============================================================================

export type ScheduleType = 'publish' | 'unpublish' | 'update';
export type ScheduleStatus = 'pending' | 'executed' | 'failed' | 'cancelled';

export interface CreateScheduleInput {
  pageId: string;
  scheduleType: ScheduleType;
  scheduledFor: Date;
  timezone?: string;
  contentSnapshot?: Record<string, unknown>;
  createdBy: string;
}

export interface ScheduleFilters {
  pageId?: string;
  scheduleType?: ScheduleType;
  status?: ScheduleStatus;
  fromDate?: Date;
  toDate?: Date;
  timezone?: string;
}

export interface ScheduleQueryOptions extends ScheduleFilters {
  page?: number;
  limit?: number;
  orderBy?: 'scheduledFor' | 'createdAt';
  orderDirection?: 'asc' | 'desc';
}

export interface ScheduleStats {
  pending: number;
  executed: number;
  failed: number;
  cancelled: number;
  total: number;
  upcomingToday: number;
  upcomingWeek: number;
}

// ============================================================================
// Schedule CRUD Operations
// ============================================================================

/**
 * Create a new schedule
 */
export async function createSchedule(
  input: CreateScheduleInput
): Promise<{ id: string; scheduledFor: Date }> {
  // Validate future date
  if (input.scheduledFor <= new Date()) {
    throw new Error('Scheduled date must be in the future');
  }

  // Validate page exists
  const page = await prisma.cmsPage.findUnique({
    where: { id: input.pageId },
    select: { id: true, status: true },
  });

  if (!page) {
    throw new Error('Page not found');
  }

  // Validate schedule type
  if (input.scheduleType === 'publish' && page.status === 'published') {
    throw new Error('Page is already published');
  }

  if (input.scheduleType === 'unpublish' && page.status !== 'published') {
    throw new Error('Only published pages can be scheduled for unpublishing');
  }

  // Create schedule
  const schedule = await prisma.cmsSchedule.create({
    data: {
      pageId: input.pageId,
      scheduleType: input.scheduleType,
      scheduledFor: input.scheduledFor,
      timezone: input.timezone || 'UTC',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      contentSnapshot: (input.contentSnapshot as any) || null,
      createdBy: input.createdBy,
      status: 'pending',
    },
    select: {
      id: true,
      scheduledFor: true,
    },
  });

  return schedule;
}

/**
 * Get schedule by ID
 */
export async function getScheduleById(id: string) {
  const schedule = await prisma.cmsSchedule.findUnique({
    where: { id },
    include: {
      page: {
        select: {
          id: true,
          pageTitle: true,
          slug: true,
          status: true,
        },
      },
    },
  });

  return schedule;
}

/**
 * List schedules with filters and pagination
 */
export async function listSchedules(options: ScheduleQueryOptions = {}) {
  const page = options.page || 1;
  const limit = options.limit || 20;
  const skip = (page - 1) * limit;

  // Build where clause
  const where: {
    pageId?: string;
    scheduleType?: ScheduleType;
    status?: ScheduleStatus;
    scheduledFor?: { gte?: Date; lte?: Date };
    timezone?: string;
  } = {};

  if (options.pageId) where.pageId = options.pageId;
  if (options.scheduleType) where.scheduleType = options.scheduleType;
  if (options.status) where.status = options.status;
  if (options.timezone) where.timezone = options.timezone;

  if (options.fromDate || options.toDate) {
    where.scheduledFor = {};
    if (options.fromDate) where.scheduledFor.gte = options.fromDate;
    if (options.toDate) where.scheduledFor.lte = options.toDate;
  }

  // Execute queries
  const [schedules, total] = await Promise.all([
    prisma.cmsSchedule.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [options.orderBy || 'scheduledFor']: options.orderDirection || 'asc',
      },
      include: {
        page: {
          select: {
            id: true,
            pageTitle: true,
            slug: true,
            status: true,
          },
        },
      },
    }),
    prisma.cmsSchedule.count({ where }),
  ]);

  return {
    schedules,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Update schedule
 */
export async function updateSchedule(
  id: string,
  data: {
    scheduledFor?: Date;
    timezone?: string;
    contentSnapshot?: Record<string, unknown>;
  }
) {
  const existing = await prisma.cmsSchedule.findUnique({
    where: { id },
    select: { status: true },
  });

  if (!existing) {
    throw new Error('Schedule not found');
  }

  if (existing.status !== 'pending') {
    throw new Error('Only pending schedules can be updated');
  }

  if (data.scheduledFor && data.scheduledFor <= new Date()) {
    throw new Error('Scheduled date must be in the future');
  }

  const schedule = await prisma.cmsSchedule.update({
    where: { id },
    data: {
      scheduledFor: data.scheduledFor,
      timezone: data.timezone,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      contentSnapshot: data.contentSnapshot ? (data.contentSnapshot as any) : undefined,
    },
    include: {
      page: {
        select: {
          id: true,
          pageTitle: true,
          slug: true,
          status: true,
        },
      },
    },
  });

  return schedule;
}

/**
 * Cancel a schedule
 */
export async function cancelSchedule(id: string): Promise<void> {
  const schedule = await prisma.cmsSchedule.findUnique({
    where: { id },
    select: { status: true },
  });

  if (!schedule) {
    throw new Error('Schedule not found');
  }

  if (schedule.status !== 'pending') {
    throw new Error('Only pending schedules can be cancelled');
  }

  await prisma.cmsSchedule.update({
    where: { id },
    data: {
      status: 'cancelled',
    },
  });
}

/**
 * Delete a schedule
 */
export async function deleteSchedule(id: string): Promise<void> {
  await prisma.cmsSchedule.delete({
    where: { id },
  });
}

// ============================================================================
// Schedule Execution
// ============================================================================

/**
 * Get schedules due for execution
 */
export async function getDueSchedules(options: {
  beforeDate?: Date;
  limit?: number;
} = {}) {
  const beforeDate = options.beforeDate || new Date();
  const limit = options.limit || 100;

  const schedules = await prisma.cmsSchedule.findMany({
    where: {
      status: 'pending',
      scheduledFor: {
        lte: beforeDate,
      },
    },
    take: limit,
    orderBy: {
      scheduledFor: 'asc',
    },
    include: {
      page: true,
    },
  });

  return schedules;
}

/**
 * Execute a schedule
 */
export async function executeSchedule(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const schedule = await prisma.cmsSchedule.findUnique({
    where: { id },
    include: {
      page: true,
    },
  });

  if (!schedule) {
    return { success: false, error: 'Schedule not found' };
  }

  if (schedule.status !== 'pending') {
    return { success: false, error: 'Schedule is not pending' };
  }

  try {
    // Execute based on schedule type
    switch (schedule.scheduleType) {
      case 'publish':
        await prisma.cmsPage.update({
          where: { id: schedule.pageId },
          data: {
            status: 'published',
            publishedAt: new Date(),
          },
        });
        break;

      case 'unpublish':
        await prisma.cmsPage.update({
          where: { id: schedule.pageId },
          data: {
            status: 'draft',
            publishedAt: null,
          },
        });
        break;

      case 'update':
        if (schedule.contentSnapshot) {
          // Apply content snapshot
          const snapshot = schedule.contentSnapshot as Record<string, unknown>;
          await prisma.cmsPage.update({
            where: { id: schedule.pageId },
            data: {
              pageTitle: snapshot.pageTitle as string | undefined,
              slug: snapshot.slug as string | undefined,
              metaTitle: snapshot.metaTitle as string | undefined,
              metaDescription: snapshot.metaDescription as string | undefined,
              // Add other fields as needed
            },
          });
        }
        break;
    }

    // Mark as executed
    await prisma.cmsSchedule.update({
      where: { id },
      data: {
        status: 'executed',
        executedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    // Mark as failed
    await prisma.cmsSchedule.update({
      where: { id },
      data: {
        status: 'failed',
        failureReason: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Execute all due schedules (for cron job)
 */
export async function executeDueSchedules(): Promise<{
  executed: number;
  failed: number;
  results: Array<{ id: string; success: boolean; error?: string }>;
}> {
  const dueSchedules = await getDueSchedules();
  const results: Array<{ id: string; success: boolean; error?: string }> = [];
  let executed = 0;
  let failed = 0;

  for (const schedule of dueSchedules) {
    const result = await executeSchedule(schedule.id);
    results.push({ id: schedule.id, ...result });

    if (result.success) {
      executed++;
    } else {
      failed++;
    }
  }

  return { executed, failed, results };
}

/**
 * Retry a failed schedule
 */
export async function retrySchedule(id: string): Promise<void> {
  const schedule = await prisma.cmsSchedule.findUnique({
    where: { id },
    select: { status: true },
  });

  if (!schedule) {
    throw new Error('Schedule not found');
  }

  if (schedule.status !== 'failed') {
    throw new Error('Only failed schedules can be retried');
  }

  await prisma.cmsSchedule.update({
    where: { id },
    data: {
      status: 'pending',
      failureReason: null,
      executedAt: null,
    },
  });
}

// ============================================================================
// Schedule Statistics
// ============================================================================

/**
 * Get schedule statistics
 */
export async function getScheduleStats(): Promise<ScheduleStats> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const weekFromNow = new Date(now);
  weekFromNow.setDate(weekFromNow.getDate() + 7);

  const [statusCounts, upcomingToday, upcomingWeek] = await Promise.all([
    prisma.cmsSchedule.groupBy({
      by: ['status'],
      _count: true,
    }),
    prisma.cmsSchedule.count({
      where: {
        status: 'pending',
        scheduledFor: {
          gte: now,
          lte: today,
        },
      },
    }),
    prisma.cmsSchedule.count({
      where: {
        status: 'pending',
        scheduledFor: {
          gte: now,
          lte: weekFromNow,
        },
      },
    }),
  ]);

  const stats: ScheduleStats = {
    pending: 0,
    executed: 0,
    failed: 0,
    cancelled: 0,
    total: 0,
    upcomingToday,
    upcomingWeek,
  };

  statusCounts.forEach((item) => {
    const status = item.status as ScheduleStatus;
    if (status in stats) {
      stats[status] = item._count;
      stats.total += item._count;
    }
  });

  return stats;
}

/**
 * Get page schedule history
 */
export async function getPageScheduleHistory(pageId: string) {
  const schedules = await prisma.cmsSchedule.findMany({
    where: { pageId },
    orderBy: { scheduledFor: 'desc' },
    include: {
      page: {
        select: {
          id: true,
          pageTitle: true,
          slug: true,
        },
      },
    },
  });

  return schedules;
}

/**
 * Get upcoming schedules
 */
export async function getUpcomingSchedules(options: {
  days?: number;
  limit?: number;
} = {}) {
  const days = options.days || 7;
  const limit = options.limit || 50;
  const now = new Date();
  const futureDate = new Date(now);
  futureDate.setDate(futureDate.getDate() + days);

  const schedules = await prisma.cmsSchedule.findMany({
    where: {
      status: 'pending',
      scheduledFor: {
        gte: now,
        lte: futureDate,
      },
    },
    take: limit,
    orderBy: {
      scheduledFor: 'asc',
    },
    include: {
      page: {
        select: {
          id: true,
          pageTitle: true,
          slug: true,
          status: true,
        },
      },
    },
  });

  return schedules;
}

/**
 * Check if page has pending schedules
 */
export async function hasPagePendingSchedules(pageId: string): Promise<boolean> {
  const count = await prisma.cmsSchedule.count({
    where: {
      pageId,
      status: 'pending',
    },
  });

  return count > 0;
}

/**
 * Get next scheduled action for page
 */
export async function getNextScheduledAction(pageId: string) {
  const schedule = await prisma.cmsSchedule.findFirst({
    where: {
      pageId,
      status: 'pending',
    },
    orderBy: {
      scheduledFor: 'asc',
    },
  });

  return schedule;
}

// ============================================================================
// Bulk Operations
// ============================================================================

/**
 * Cancel all pending schedules for a page
 */
export async function cancelPageSchedules(pageId: string): Promise<number> {
  const result = await prisma.cmsSchedule.updateMany({
    where: {
      pageId,
      status: 'pending',
    },
    data: {
      status: 'cancelled',
    },
  });

  return result.count;
}

/**
 * Delete old schedules
 */
export async function deleteOldSchedules(options: {
  olderThanDays?: number;
  status?: ScheduleStatus[];
} = {}): Promise<number> {
  const days = options.olderThanDays || 90;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const where: {
    createdAt: { lt: Date };
    status?: { in: ScheduleStatus[] };
  } = {
    createdAt: { lt: cutoffDate },
  };

  if (options.status && options.status.length > 0) {
    where.status = { in: options.status };
  }

  const result = await prisma.cmsSchedule.deleteMany({ where });

  return result.count;
}

// ============================================================================
// Export Service
// ============================================================================

const schedulingService = {
  // CRUD
  createSchedule,
  getScheduleById,
  listSchedules,
  updateSchedule,
  cancelSchedule,
  deleteSchedule,

  // Execution
  getDueSchedules,
  executeSchedule,
  executeDueSchedules,
  retrySchedule,

  // Statistics
  getScheduleStats,
  getPageScheduleHistory,
  getUpcomingSchedules,
  hasPagePendingSchedules,
  getNextScheduledAction,

  // Bulk Operations
  cancelPageSchedules,
  deleteOldSchedules,
};

export default schedulingService;
