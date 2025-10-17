/**
 * Task Query Library
 * 
 * Optimized queries for Task model with proper indexing and N+1 prevention
 */

import { prisma } from '@/lib/prisma';
import {
  TaskFilter,
  TaskMinimal,
  TaskWithAssignee,
  TaskFull,
  taskSelectMinimal,
  taskSelectWithAssignee,
  taskSelectFull,
  PaginationInput,
  PaginatedResponse,
} from './types';
import {
  buildSoftDeleteWhere,
  calculatePagination,
  buildPaginatedResponse,
  buildSearchConditions,
  buildStatusFilter,
  buildDateRangeFilter,
  withQueryMetrics,
  batchLoadByIds,
  batchLoadByForeignKey,
} from './common';
import { Prisma } from '@prisma/client';

// ============================================================================
// Single Task Queries
// ============================================================================

/**
 * Get task by ID (minimal fields)
 * Uses: Task_id_deletedAt_idx
 */
export async function getTaskById(
  id: string,
  includeDeleted: boolean = false
): Promise<TaskMinimal | null> {
  return withQueryMetrics('getTaskById', async () => {
    return prisma.task.findFirst({
      where: {
        id,
        ...buildSoftDeleteWhere({ includeDeleted }),
      },
      select: taskSelectMinimal,
    });
  });
}

/**
 * Get task by ID with assignee and project
 * Uses: Task_id_deletedAt_idx
 */
export async function getTaskWithAssignee(
  id: string,
  includeDeleted: boolean = false
): Promise<TaskWithAssignee | null> {
  return withQueryMetrics('getTaskWithAssignee', async () => {
    return prisma.task.findFirst({
      where: {
        id,
        ...buildSoftDeleteWhere({ includeDeleted }),
      },
      select: taskSelectWithAssignee,
    });
  });
}

/**
 * Get task by ID (full fields)
 * Uses: Task_id_deletedAt_idx
 */
export async function getTaskByIdFull(
  id: string,
  includeDeleted: boolean = false
): Promise<TaskFull | null> {
  return withQueryMetrics('getTaskByIdFull', async () => {
    return prisma.task.findFirst({
      where: {
        id,
        ...buildSoftDeleteWhere({ includeDeleted }),
      },
      select: taskSelectFull,
    });
  });
}

// ============================================================================
// List/Search Queries
// ============================================================================

/**
 * Get tasks with filtering and pagination
 * Uses: Various indexes depending on filter
 * - status: Task_status_deletedAt_idx
 * - priority: Task_priority_deletedAt_idx
 * - projectId: Task_projectId_status_idx
 * - assigneeId: Task_assigneeId_status_idx, Task_assigneeId_dueDate_status_idx
 * - dueDate: Task_dueDate_status_idx
 */
export async function getTasks(
  filter?: TaskFilter,
  pagination?: PaginationInput
): Promise<PaginatedResponse<TaskWithAssignee>> {
  return withQueryMetrics('getTasks', async () => {
    const { skip, take, page, limit } = calculatePagination(pagination);

    // Build where clause
    const where: Prisma.TaskWhereInput = {
      ...buildSoftDeleteWhere(filter),
    };

    // Add status filter
    if (filter?.status) {
      where.status = buildStatusFilter(filter.status);
    }

    // Add priority filter
    if (filter?.priority) {
      where.priority = buildStatusFilter(filter.priority);
    }

    // Add project filter
    if (filter?.projectId) {
      where.projectId = filter.projectId;
    }

    // Add assignee filter
    if (filter?.assigneeId) {
      where.assigneeId = filter.assigneeId;
    }

    // Add creator filter
    if (filter?.createdBy) {
      where.createdBy = filter.createdBy;
    }

    // Add search filter
    if (filter?.search) {
      const searchConditions = buildSearchConditions(filter.search, ['title', 'description']);
      if (searchConditions) {
        where.OR = searchConditions;
      }
    }

    // Add due date filter
    if (filter?.dueDate) {
      const dueDateFilter = buildDateRangeFilter(filter.dueDate);
      if (dueDateFilter) {
        where.dueDate = dueDateFilter;
      }
    }

    // Add overdue filter
    if (filter?.overdue) {
      where.dueDate = { lt: new Date() };
      where.status = { notIn: ['COMPLETED', 'CANCELLED'] };
    }

    // Execute query with count
    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        select: taskSelectWithAssignee,
        skip,
        take,
        orderBy: [
          { priority: 'desc' },
          { dueDate: 'asc' },
          { createdAt: 'desc' },
        ],
      }),
      prisma.task.count({ where }),
    ]);

    return buildPaginatedResponse(tasks, total, { page, limit });
  });
}

/**
 * Get tasks by project
 * Uses: Task_projectId_status_idx
 */
export async function getTasksByProject(
  projectId: string,
  pagination?: PaginationInput
): Promise<PaginatedResponse<TaskWithAssignee>> {
  return getTasks({ projectId }, pagination);
}

/**
 * Get tasks by assignee
 * Uses: Task_assigneeId_status_idx
 */
export async function getTasksByAssignee(
  assigneeId: string,
  pagination?: PaginationInput
): Promise<PaginatedResponse<TaskWithAssignee>> {
  return getTasks({ assigneeId }, pagination);
}

/**
 * Get tasks by status
 * Uses: Task_status_deletedAt_idx
 */
export async function getTasksByStatus(
  status: string | string[],
  pagination?: PaginationInput
): Promise<PaginatedResponse<TaskWithAssignee>> {
  return getTasks({ status: status as 'TODO' }, pagination);
}

/**
 * Get overdue tasks
 * Uses: Task_dueDate_status_idx
 */
export async function getOverdueTasks(
  pagination?: PaginationInput
): Promise<PaginatedResponse<TaskWithAssignee>> {
  return getTasks({ overdue: true }, pagination);
}

/**
 * Get tasks with upcoming deadlines
 * Uses: Task_dueDate_status_idx
 */
export async function getUpcomingTasks(
  days: number = 7,
  pagination?: PaginationInput
): Promise<PaginatedResponse<TaskWithAssignee>> {
  const now = new Date();
  const future = new Date();
  future.setDate(future.getDate() + days);

  return getTasks({
    dueDate: { from: now, to: future },
    status: ['TODO', 'IN_PROGRESS', 'IN_REVIEW'],
  }, pagination);
}

/**
 * Get user's tasks (assigned or created)
 * Uses: Task_assigneeId_status_idx, Task_createdBy_idx
 */
export async function getUserTasks(
  userId: string,
  pagination?: PaginationInput
): Promise<PaginatedResponse<TaskWithAssignee>> {
  return withQueryMetrics('getUserTasks', async () => {
    const { skip, take, page, limit } = calculatePagination(pagination);

    const where: Prisma.TaskWhereInput = {
      deletedAt: null,
      OR: [
        { assigneeId: userId },
        { createdBy: userId },
      ],
    };

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        select: taskSelectWithAssignee,
        skip,
        take,
        orderBy: [
          { priority: 'desc' },
          { dueDate: 'asc' },
        ],
      }),
      prisma.task.count({ where }),
    ]);

    return buildPaginatedResponse(tasks, total, { page, limit });
  });
}

/**
 * Search tasks by title or description
 * Uses: Task_title_idx
 */
export async function searchTasks(
  search: string,
  pagination?: PaginationInput
): Promise<PaginatedResponse<TaskWithAssignee>> {
  return getTasks({ search }, pagination);
}

// ============================================================================
// Batch Queries (N+1 Prevention)
// ============================================================================

/**
 * Batch load tasks by IDs
 * Prevents N+1 queries when loading multiple tasks
 */
export async function batchGetTasksByIds(
  ids: string[]
): Promise<Map<string, TaskMinimal>> {
  return withQueryMetrics('batchGetTasksByIds', async () => {
    return batchLoadByIds<TaskMinimal>(
      prisma.task,
      ids,
      taskSelectMinimal
    );
  });
}

/**
 * Batch load tasks by IDs with assignee
 */
export async function batchGetTasksWithAssignee(
  ids: string[]
): Promise<Map<string, TaskWithAssignee>> {
  return withQueryMetrics('batchGetTasksWithAssignee', async () => {
    return batchLoadByIds<TaskWithAssignee>(
      prisma.task,
      ids,
      taskSelectWithAssignee
    );
  });
}

/**
 * Batch load tasks by project IDs
 * Returns map of projectId -> tasks[]
 */
export async function batchGetTasksByProjectIds(
  projectIds: string[]
): Promise<Map<string, TaskMinimal[]>> {
  return withQueryMetrics('batchGetTasksByProjectIds', async () => {
    return batchLoadByForeignKey<TaskMinimal>(
      prisma.task,
      'projectId',
      projectIds,
      taskSelectMinimal
    );
  });
}

/**
 * Batch load tasks by assignee IDs
 * Returns map of assigneeId -> tasks[]
 */
export async function batchGetTasksByAssigneeIds(
  assigneeIds: string[]
): Promise<Map<string, TaskMinimal[]>> {
  return withQueryMetrics('batchGetTasksByAssigneeIds', async () => {
    return batchLoadByForeignKey<TaskMinimal>(
      prisma.task,
      'assigneeId',
      assigneeIds,
      taskSelectMinimal
    );
  });
}

// ============================================================================
// Statistics Queries
// ============================================================================

/**
 * Get task statistics
 * Uses: Multiple indexes
 */
export async function getTaskStats(filter?: { projectId?: string; assigneeId?: string }) {
  return withQueryMetrics('getTaskStats', async () => {
    const where: Prisma.TaskWhereInput = {
      deletedAt: null,
      ...(filter?.projectId && { projectId: filter.projectId }),
      ...(filter?.assigneeId && { assigneeId: filter.assigneeId }),
    };

    const [
      total,
      byStatus,
      byPriority,
      completedCount,
      overdueCount,
      dueThisWeek,
    ] = await Promise.all([
      // Total tasks
      prisma.task.count({ where }),

      // Count by status
      prisma.task.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),

      // Count by priority
      prisma.task.groupBy({
        by: ['priority'],
        where,
        _count: true,
      }),

      // Completed tasks
      prisma.task.count({
        where: {
          ...where,
          status: 'COMPLETED',
        },
      }),

      // Overdue tasks
      prisma.task.count({
        where: {
          ...where,
          status: { notIn: ['COMPLETED', 'CANCELLED'] },
          dueDate: { lt: new Date() },
        },
      }),

      // Due this week
      prisma.task.count({
        where: {
          ...where,
          status: { notIn: ['COMPLETED', 'CANCELLED'] },
          dueDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return {
      total,
      byStatus: Object.fromEntries(
        byStatus.map((s) => [s.status, s._count])
      ),
      byPriority: Object.fromEntries(
        byPriority.map((p) => [p.priority, p._count])
      ),
      completedCount,
      overdueCount,
      dueThisWeek,
      completionRate: total > 0 ? (completedCount / total) * 100 : 0,
    };
  });
}

/**
 * Get task time summary
 */
export async function getTaskTimeSummary(filter?: { projectId?: string; assigneeId?: string }) {
  return withQueryMetrics('getTaskTimeSummary', async () => {
    const where: Prisma.TaskWhereInput = {
      deletedAt: null,
      ...(filter?.projectId && { projectId: filter.projectId }),
      ...(filter?.assigneeId && { assigneeId: filter.assigneeId }),
    };

    const [estimatedHours, actualHours] = await Promise.all([
      prisma.task.aggregate({
        where: {
          ...where,
          estimatedHours: { not: null },
        },
        _sum: {
          estimatedHours: true,
        },
        _avg: {
          estimatedHours: true,
        },
      }),
      prisma.timeEntry.aggregate({
        where: {
          deletedAt: null,
          task: where,
        },
        _sum: {
          hours: true,
        },
      }),
    ]);

    return {
      estimatedTotal: estimatedHours._sum.estimatedHours || 0,
      estimatedAverage: estimatedHours._avg.estimatedHours || 0,
      actualTotal: actualHours._sum.hours || 0,
      efficiency: estimatedHours._sum.estimatedHours && actualHours._sum.hours
        ? (estimatedHours._sum.estimatedHours / actualHours._sum.hours) * 100
        : 0,
    };
  });
}

// ============================================================================
// Task with Relations
// ============================================================================

/**
 * Get task with time entries
 * Optimized with proper select
 */
export async function getTaskWithTimeEntries(taskId: string) {
  return withQueryMetrics('getTaskWithTimeEntries', async () => {
    return prisma.task.findFirst({
      where: {
        id: taskId,
        deletedAt: null,
      },
      select: {
        ...taskSelectWithAssignee,
        timeEntries: {
          where: { deletedAt: null },
          select: {
            id: true,
            hours: true,
            date: true,
            description: true,
            billable: true,
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { date: 'desc' },
          take: 100,
        },
        _count: {
          select: {
            timeEntries: {
              where: { deletedAt: null },
            },
          },
        },
      },
    });
  });
}

/**
 * Get task with comments
 * Optimized with proper select and ordering
 */
export async function getTaskWithComments(taskId: string) {
  return withQueryMetrics('getTaskWithComments', async () => {
    return prisma.task.findFirst({
      where: {
        id: taskId,
        deletedAt: null,
      },
      select: {
        ...taskSelectWithAssignee,
        comments: {
          where: { deletedAt: null },
          select: {
            id: true,
            content: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        _count: {
          select: {
            comments: {
              where: { deletedAt: null },
            },
          },
        },
      },
    });
  });
}

// ============================================================================
// Update Queries
// ============================================================================

/**
 * Update task
 */
export async function updateTask(
  id: string,
  data: Partial<Omit<TaskFull, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>>
): Promise<TaskFull> {
  return withQueryMetrics('updateTask', async () => {
    return prisma.task.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      select: taskSelectFull,
    });
  });
}

/**
 * Update task status
 * Optimized for status-only updates
 */
export async function updateTaskStatus(
  id: string,
  status: string
): Promise<TaskMinimal> {
  return withQueryMetrics('updateTaskStatus', async () => {
    return prisma.task.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date(),
      },
      select: taskSelectMinimal,
    });
  });
}

/**
 * Assign task to user
 * Optimized for assignment updates
 */
export async function assignTask(
  id: string,
  assigneeId: string
): Promise<TaskMinimal> {
  return withQueryMetrics('assignTask', async () => {
    return prisma.task.update({
      where: { id },
      data: {
        assigneeId,
        updatedAt: new Date(),
      },
      select: taskSelectMinimal,
    });
  });
}

/**
 * Soft delete task
 */
export async function softDeleteTask(id: string): Promise<TaskFull> {
  return withQueryMetrics('softDeleteTask', async () => {
    return prisma.task.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
      select: taskSelectFull,
    });
  });
}

/**
 * Restore soft-deleted task
 */
export async function restoreTask(id: string): Promise<TaskFull> {
  return withQueryMetrics('restoreTask', async () => {
    return prisma.task.update({
      where: { id },
      data: {
        deletedAt: null,
        updatedAt: new Date(),
      },
      select: taskSelectFull,
    });
  });
}

// ============================================================================
// Bulk Operations
// ============================================================================

/**
 * Bulk update task status
 * Uses transaction for consistency
 */
export async function bulkUpdateTaskStatus(
  taskIds: string[],
  status: string
): Promise<{ count: number }> {
  return withQueryMetrics('bulkUpdateTaskStatus', async () => {
    return prisma.task.updateMany({
      where: {
        id: { in: taskIds },
        deletedAt: null,
      },
      data: {
        status,
        updatedAt: new Date(),
      },
    });
  });
}

/**
 * Bulk assign tasks
 * Uses transaction for consistency
 */
export async function bulkAssignTasks(
  taskIds: string[],
  assigneeId: string
): Promise<{ count: number }> {
  return withQueryMetrics('bulkAssignTasks', async () => {
    return prisma.task.updateMany({
      where: {
        id: { in: taskIds },
        deletedAt: null,
      },
      data: {
        assigneeId,
        updatedAt: new Date(),
      },
    });
  });
}
