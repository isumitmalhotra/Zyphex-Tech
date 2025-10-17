/**
 * Project Query Library
 * 
 * Optimized queries for Project model with proper indexing and N+1 prevention
 */

import { prisma } from '@/lib/prisma';
import {
  ProjectFilter,
  ProjectMinimal,
  ProjectWithClient,
  ProjectFull,
  projectSelectMinimal,
  projectSelectWithClient,
  projectSelectFull,
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
import { userSelectMinimal } from './types';

// ============================================================================
// Single Project Queries
// ============================================================================

/**
 * Get project by ID (minimal fields)
 * Uses: Project_id_deletedAt_idx
 */
export async function getProjectById(
  id: string,
  includeDeleted: boolean = false
): Promise<ProjectMinimal | null> {
  return withQueryMetrics('getProjectById', async () => {
    return prisma.project.findFirst({
      where: {
        id,
        ...buildSoftDeleteWhere({ includeDeleted }),
      },
      select: projectSelectMinimal,
    });
  });
}

/**
 * Get project by ID with client
 * Uses: Project_id_deletedAt_idx, Client_id_deletedAt_idx
 */
export async function getProjectWithClient(
  id: string,
  includeDeleted: boolean = false
): Promise<ProjectWithClient | null> {
  return withQueryMetrics('getProjectWithClient', async () => {
    return prisma.project.findFirst({
      where: {
        id,
        ...buildSoftDeleteWhere({ includeDeleted }),
      },
      select: projectSelectWithClient,
    });
  });
}

/**
 * Get project by ID (full fields)
 * Uses: Project_id_deletedAt_idx
 */
export async function getProjectByIdFull(
  id: string,
  includeDeleted: boolean = false
): Promise<ProjectFull | null> {
  return withQueryMetrics('getProjectByIdFull', async () => {
    return prisma.project.findFirst({
      where: {
        id,
        ...buildSoftDeleteWhere({ includeDeleted }),
      },
      select: projectSelectFull,
    });
  });
}

// ============================================================================
// List/Search Queries
// ============================================================================

/**
 * Get projects with filtering and pagination
 * Uses: Various indexes depending on filter
 * - status: Project_status_deletedAt_idx
 * - priority: Project_priority_deletedAt_idx
 * - clientId: Project_clientId_status_idx
 * - managerId: Project_managerId_status_idx
 */
export async function getProjects(
  filter?: ProjectFilter,
  pagination?: PaginationInput
): Promise<PaginatedResponse<ProjectWithClient>> {
  return withQueryMetrics('getProjects', async () => {
    const { skip, take, page, limit } = calculatePagination(pagination);

    // Build where clause
    const where: Prisma.ProjectWhereInput = {
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

    // Add client filter
    if (filter?.clientId) {
      where.clientId = filter.clientId;
    }

    // Add manager filter
    if (filter?.managerId) {
      where.managerId = filter.managerId;
    }

    // Add user access filter
    if (filter?.userId) {
      where.users = {
        some: { id: filter.userId },
      };
    }

    // Add search filter
    if (filter?.search) {
      const searchConditions = buildSearchConditions(filter.search, ['name', 'description']);
      if (searchConditions) {
        where.OR = searchConditions;
      }
    }

    // Add date range filters
    if (filter?.dateRange) {
      const startDateFilter = buildDateRangeFilter({
        from: filter.dateRange.from,
        to: filter.dateRange.to,
      });
      if (startDateFilter) {
        where.startDate = startDateFilter;
      }
    }

    // Execute query with count
    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        select: projectSelectWithClient,
        skip,
        take,
        orderBy: [
          { priority: 'desc' },
          { updatedAt: 'desc' },
        ],
      }),
      prisma.project.count({ where }),
    ]);

    return buildPaginatedResponse(projects, total, { page, limit });
  });
}

/**
 * Get projects by client
 * Uses: Project_clientId_status_idx
 */
export async function getProjectsByClient(
  clientId: string,
  pagination?: PaginationInput
): Promise<PaginatedResponse<ProjectWithClient>> {
  return getProjects({ clientId }, pagination);
}

/**
 * Get projects by manager
 * Uses: Project_managerId_status_idx
 */
export async function getProjectsByManager(
  managerId: string,
  pagination?: PaginationInput
): Promise<PaginatedResponse<ProjectWithClient>> {
  return getProjects({ managerId }, pagination);
}

/**
 * Get projects by status
 * Uses: Project_status_deletedAt_idx
 */
export async function getProjectsByStatus(
  status: string | string[],
  pagination?: PaginationInput
): Promise<PaginatedResponse<ProjectWithClient>> {
  return getProjects({ status: status as 'PLANNING' }, pagination);
}

/**
 * Get active projects (PLANNING, IN_PROGRESS, REVIEW)
 * Uses: Project_status_deletedAt_idx
 */
export async function getActiveProjects(
  pagination?: PaginationInput
): Promise<PaginatedResponse<ProjectWithClient>> {
  return getProjects({
    status: ['PLANNING', 'IN_PROGRESS', 'REVIEW'],
  }, pagination);
}

/**
 * Get projects user has access to
 * Uses: Project team member relations
 */
export async function getUserProjects(
  userId: string,
  pagination?: PaginationInput
): Promise<PaginatedResponse<ProjectWithClient>> {
  return getProjects({ userId }, pagination);
}

/**
 * Search projects by name or description
 * Uses: Project_name_idx
 */
export async function searchProjects(
  search: string,
  pagination?: PaginationInput
): Promise<PaginatedResponse<ProjectWithClient>> {
  return getProjects({ search }, pagination);
}

// ============================================================================
// Batch Queries (N+1 Prevention)
// ============================================================================

/**
 * Batch load projects by IDs
 * Prevents N+1 queries when loading multiple projects
 */
export async function batchGetProjectsByIds(
  ids: string[]
): Promise<Map<string, ProjectMinimal>> {
  return withQueryMetrics('batchGetProjectsByIds', async () => {
    return batchLoadByIds<ProjectMinimal>(
      prisma.project,
      ids,
      projectSelectMinimal
    );
  });
}

/**
 * Batch load projects by IDs with client
 */
export async function batchGetProjectsWithClient(
  ids: string[]
): Promise<Map<string, ProjectWithClient>> {
  return withQueryMetrics('batchGetProjectsWithClient', async () => {
    return batchLoadByIds<ProjectWithClient>(
      prisma.project,
      ids,
      projectSelectWithClient
    );
  });
}

/**
 * Batch load projects by client IDs
 * Returns map of clientId -> projects[]
 */
export async function batchGetProjectsByClientIds(
  clientIds: string[]
): Promise<Map<string, ProjectMinimal[]>> {
  return withQueryMetrics('batchGetProjectsByClientIds', async () => {
    return batchLoadByForeignKey<ProjectMinimal>(
      prisma.project,
      'clientId',
      clientIds,
      projectSelectMinimal
    );
  });
}

/**
 * Batch load projects by manager IDs
 * Returns map of managerId -> projects[]
 */
export async function batchGetProjectsByManagerIds(
  managerIds: string[]
): Promise<Map<string, ProjectMinimal[]>> {
  return withQueryMetrics('batchGetProjectsByManagerIds', async () => {
    return batchLoadByForeignKey<ProjectMinimal>(
      prisma.project,
      'managerId',
      managerIds,
      projectSelectMinimal
    );
  });
}

// ============================================================================
// Statistics Queries
// ============================================================================

/**
 * Get project statistics
 * Uses: Multiple indexes
 */
export async function getProjectStats(filter?: { clientId?: string; managerId?: string }) {
  return withQueryMetrics('getProjectStats', async () => {
    const where: Prisma.ProjectWhereInput = {
      deletedAt: null,
      ...(filter?.clientId && { clientId: filter.clientId }),
      ...(filter?.managerId && { managerId: filter.managerId }),
    };

    const [
      total,
      byStatus,
      byPriority,
      activeCount,
      completedCount,
      overdueCount,
    ] = await Promise.all([
      // Total projects
      prisma.project.count({ where }),

      // Count by status
      prisma.project.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),

      // Count by priority
      prisma.project.groupBy({
        by: ['priority'],
        where,
        _count: true,
      }),

      // Active projects
      prisma.project.count({
        where: {
          ...where,
          status: { in: ['PLANNING', 'IN_PROGRESS', 'REVIEW'] },
        },
      }),

      // Completed projects
      prisma.project.count({
        where: {
          ...where,
          status: 'COMPLETED',
        },
      }),

      // Overdue projects (endDate passed, not completed)
      prisma.project.count({
        where: {
          ...where,
          status: { not: 'COMPLETED' },
          endDate: { lt: new Date() },
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
      activeCount,
      completedCount,
      overdueCount,
      completionRate: total > 0 ? (completedCount / total) * 100 : 0,
    };
  });
}

/**
 * Get project budget summary
 */
export async function getProjectBudgetSummary(filter?: { clientId?: string }) {
  return withQueryMetrics('getProjectBudgetSummary', async () => {
    const where: Prisma.ProjectWhereInput = {
      deletedAt: null,
      ...(filter?.clientId && { clientId: filter.clientId }),
    };

    const result = await prisma.project.aggregate({
      where,
      _sum: {
        budget: true,
      },
      _avg: {
        budget: true,
      },
      _count: true,
    });

    return {
      totalBudget: result._sum.budget || 0,
      averageBudget: result._avg.budget || 0,
      projectCount: result._count,
    };
  });
}

// ============================================================================
// Project with Relations
// ============================================================================

/**
 * Get project with team members
 * Optimized with proper select
 */
export async function getProjectWithTeam(projectId: string) {
  return withQueryMetrics('getProjectWithTeam', async () => {
    return prisma.project.findFirst({
      where: {
        id: projectId,
        deletedAt: null,
      },
      select: {
        ...projectSelectWithClient,
        manager: {
          select: userSelectMinimal,
        },
        users: {
          where: { deletedAt: null },
          select: userSelectMinimal,
          take: 100,
        },
        _count: {
          select: {
            users: {
              where: { deletedAt: null },
            },
            tasks: {
              where: { deletedAt: null },
            },
          },
        },
      },
    });
  });
}

/**
 * Get project with tasks summary
 * Optimized with proper select and aggregation
 */
export async function getProjectWithTasksSummary(projectId: string) {
  return withQueryMetrics('getProjectWithTasksSummary', async () => {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        deletedAt: null,
      },
      select: projectSelectWithClient,
    });

    if (!project) return null;

    // Get task statistics
    const [taskCounts, totalHours] = await Promise.all([
      prisma.task.groupBy({
        by: ['status'],
        where: {
          projectId,
          deletedAt: null,
        },
        _count: true,
      }),
      prisma.timeEntry.aggregate({
        where: {
          projectId,
          deletedAt: null,
        },
        _sum: {
          hours: true,
        },
      }),
    ]);

    return {
      ...project,
      taskStats: {
        byStatus: Object.fromEntries(
          taskCounts.map((t) => [t.status, t._count])
        ),
        totalHours: totalHours._sum.hours || 0,
      },
    };
  });
}

/**
 * Get project with recent activity
 * Optimized with limit and proper ordering
 */
export async function getProjectWithActivity(projectId: string) {
  return withQueryMetrics('getProjectWithActivity', async () => {
    return prisma.project.findFirst({
      where: {
        id: projectId,
        deletedAt: null,
      },
      select: {
        ...projectSelectWithClient,
        tasks: {
          where: { deletedAt: null },
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            updatedAt: true,
            assignee: {
              select: userSelectMinimal,
            },
          },
          orderBy: { updatedAt: 'desc' },
          take: 10,
        },
        messages: {
          where: { deletedAt: null },
          select: {
            id: true,
            content: true,
            createdAt: true,
            sender: {
              select: userSelectMinimal,
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
  });
}

// ============================================================================
// Update Queries
// ============================================================================

/**
 * Update project
 */
export async function updateProject(
  id: string,
  data: Partial<Omit<ProjectFull, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>>
): Promise<ProjectFull> {
  return withQueryMetrics('updateProject', async () => {
    return prisma.project.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      select: projectSelectFull,
    });
  });
}

/**
 * Update project status
 * Optimized for status-only updates
 */
export async function updateProjectStatus(
  id: string,
  status: string
): Promise<ProjectMinimal> {
  return withQueryMetrics('updateProjectStatus', async () => {
    return prisma.project.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date(),
      },
      select: projectSelectMinimal,
    });
  });
}

/**
 * Soft delete project
 */
export async function softDeleteProject(id: string): Promise<ProjectFull> {
  return withQueryMetrics('softDeleteProject', async () => {
    return prisma.project.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
      select: projectSelectFull,
    });
  });
}

/**
 * Restore soft-deleted project
 */
export async function restoreProject(id: string): Promise<ProjectFull> {
  return withQueryMetrics('restoreProject', async () => {
    return prisma.project.update({
      where: { id },
      data: {
        deletedAt: null,
        updatedAt: new Date(),
      },
      select: projectSelectFull,
    });
  });
}
