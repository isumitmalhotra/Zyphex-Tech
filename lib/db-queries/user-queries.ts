/**
 * User Query Library
 * 
 * Optimized queries for User model with proper indexing and N+1 prevention
 */

import { prisma } from '@/lib/prisma';
import {
  UserFilter,
  UserMinimal,
  UserSafe,
  UserFull,
  userSelectMinimal,
  userSelectSafe,
  userSelectFull,
  PaginationInput,
  PaginatedResponse,
} from './types';
import {
  buildSoftDeleteWhere,
  calculatePagination,
  buildPaginatedResponse,
  buildSearchConditions,
  buildStatusFilter,
  withQueryMetrics,
  batchLoadByIds,
} from './common';
import { Prisma } from '@prisma/client';

// ============================================================================
// Single User Queries
// ============================================================================

/**
 * Get user by ID (minimal fields)
 * Uses: User_id_deletedAt_idx
 */
export async function getUserById(
  id: string,
  includeDeleted: boolean = false
): Promise<UserMinimal | null> {
  return withQueryMetrics('getUserById', async () => {
    return prisma.user.findUnique({
      where: { id },
      select: userSelectMinimal,
      ...(!includeDeleted && {
        where: {
          id,
          deletedAt: null,
        },
      }),
    });
  });
}

/**
 * Get user by ID (safe fields - no password)
 * Uses: User_id_deletedAt_idx
 */
export async function getUserByIdSafe(
  id: string,
  includeDeleted: boolean = false
): Promise<UserSafe | null> {
  return withQueryMetrics('getUserByIdSafe', async () => {
    return prisma.user.findUnique({
      where: { id },
      select: userSelectSafe,
      ...(!includeDeleted && {
        where: {
          id,
          deletedAt: null,
        },
      }),
    });
  });
}

/**
 * Get user by ID (full fields)
 * Uses: User_id_deletedAt_idx
 */
export async function getUserByIdFull(
  id: string,
  includeDeleted: boolean = false
): Promise<UserFull | null> {
  return withQueryMetrics('getUserByIdFull', async () => {
    return prisma.user.findUnique({
      where: { id },
      select: userSelectFull,
      ...(!includeDeleted && {
        where: {
          id,
          deletedAt: null,
        },
      }),
    });
  });
}

/**
 * Get user by email
 * Uses: User_email_deletedAt_idx
 */
export async function getUserByEmail(
  email: string,
  includeDeleted: boolean = false
): Promise<UserFull | null> {
  return withQueryMetrics('getUserByEmail', async () => {
    return prisma.user.findFirst({
      where: {
        email,
        ...buildSoftDeleteWhere({ includeDeleted }),
      },
      select: userSelectFull,
    });
  });
}

/**
 * Get user with authentication data (for login)
 * Uses: User_email_deletedAt_idx
 */
export async function getUserWithAuth(
  email: string
): Promise<(UserFull & { password: string | null }) | null> {
  return withQueryMetrics('getUserWithAuth', async () => {
    return prisma.user.findFirst({
      where: {
        email,
        deletedAt: null,
      },
      select: {
        ...userSelectFull,
        password: true,
      },
    });
  });
}

// ============================================================================
// List/Search Queries
// ============================================================================

/**
 * Get users with filtering and pagination
 * Uses: Various indexes depending on filter
 * - role: User_role_deletedAt_idx
 * - emailVerified: User_emailVerified_deletedAt_idx
 * - search: User_name_idx, User_email_deletedAt_idx
 */
export async function getUsers(
  filter?: UserFilter,
  pagination?: PaginationInput
): Promise<PaginatedResponse<UserSafe>> {
  return withQueryMetrics('getUsers', async () => {
    const { skip, take, page, limit } = calculatePagination(pagination);

    // Build where clause
    const where: Prisma.UserWhereInput = {
      ...buildSoftDeleteWhere(filter),
    };

    // Add role filter
    if (filter?.role) {
      where.role = buildStatusFilter(filter.role);
    }

    // Add email verified filter
    if (filter?.emailVerified !== undefined) {
      where.emailVerified = filter.emailVerified ? { not: null } : null;
    }

    // Add search filter
    if (filter?.search) {
      const searchConditions = buildSearchConditions(filter.search, ['name', 'email']);
      if (searchConditions) {
        where.OR = searchConditions;
      }
    }

    // Add date range filters
    if (filter?.createdAfter) {
      where.createdAt = { ...where.createdAt as object, gte: filter.createdAfter };
    }
    if (filter?.createdBefore) {
      where.createdAt = { ...where.createdAt as object, lte: filter.createdBefore };
    }

    // Execute query with count
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: userSelectSafe,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return buildPaginatedResponse(users, total, { page, limit });
  });
}

/**
 * Get users by role
 * Uses: User_role_deletedAt_idx
 */
export async function getUsersByRole(
  role: string | string[],
  pagination?: PaginationInput
): Promise<PaginatedResponse<UserSafe>> {
  return getUsers({ role: role as 'SUPER_ADMIN' }, pagination);
}

/**
 * Search users by name or email
 * Uses: User_name_idx, User_email_deletedAt_idx
 */
export async function searchUsers(
  search: string,
  pagination?: PaginationInput
): Promise<PaginatedResponse<UserSafe>> {
  return getUsers({ search }, pagination);
}

/**
 * Get recently created users
 * Uses: User_createdAt_idx
 */
export async function getRecentUsers(
  limit: number = 10
): Promise<UserSafe[]> {
  return withQueryMetrics('getRecentUsers', async () => {
    return prisma.user.findMany({
      where: {
        deletedAt: null,
      },
      select: userSelectSafe,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  });
}

// ============================================================================
// Batch Queries (N+1 Prevention)
// ============================================================================

/**
 * Batch load users by IDs
 * Prevents N+1 queries when loading multiple users
 */
export async function batchGetUsersByIds(
  ids: string[]
): Promise<Map<string, UserMinimal>> {
  return withQueryMetrics('batchGetUsersByIds', async () => {
    return batchLoadByIds<UserMinimal>(
      prisma.user,
      ids,
      userSelectMinimal
    );
  });
}

/**
 * Batch load users by IDs (safe fields)
 */
export async function batchGetUsersByIdsSafe(
  ids: string[]
): Promise<Map<string, UserSafe>> {
  return withQueryMetrics('batchGetUsersByIdsSafe', async () => {
    return batchLoadByIds<UserSafe>(
      prisma.user,
      ids,
      userSelectSafe
    );
  });
}

// ============================================================================
// Statistics Queries
// ============================================================================

/**
 * Get user statistics
 * Uses: Multiple indexes
 */
export async function getUserStats() {
  return withQueryMetrics('getUserStats', async () => {
    const [
      total,
      byRole,
      verified,
      recentCount,
    ] = await Promise.all([
      // Total active users
      prisma.user.count({
        where: { deletedAt: null },
      }),

      // Count by role
      prisma.user.groupBy({
        by: ['role'],
        where: { deletedAt: null },
        _count: true,
      }),

      // Verified users count
      prisma.user.count({
        where: {
          deletedAt: null,
          emailVerified: { not: null },
        },
      }),

      // Recent users (last 7 days)
      prisma.user.count({
        where: {
          deletedAt: null,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return {
      total,
      byRole: Object.fromEntries(
        byRole.map((r) => [r.role, r._count])
      ),
      verified,
      verificationRate: total > 0 ? (verified / total) * 100 : 0,
      recentCount,
    };
  });
}

// ============================================================================
// User with Relations
// ============================================================================

/**
 * Get user with projects
 * Optimized with proper select to avoid over-fetching
 */
export async function getUserWithProjects(userId: string) {
  return withQueryMetrics('getUserWithProjects', async () => {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        ...userSelectSafe,
        projects: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            status: true,
            priority: true,
            startDate: true,
            endDate: true,
          },
          orderBy: { updatedAt: 'desc' },
          take: 50,
        },
        _count: {
          select: {
            projects: {
              where: { deletedAt: null },
            },
          },
        },
      },
    });
  });
}

/**
 * Get user with tasks (assigned to them)
 * Optimized with proper select and indexes
 */
export async function getUserWithTasks(userId: string) {
  return withQueryMetrics('getUserWithTasks', async () => {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        ...userSelectSafe,
        assignedTasks: {
          where: { deletedAt: null },
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: [
            { priority: 'desc' },
            { dueDate: 'asc' },
          ],
          take: 50,
        },
        _count: {
          select: {
            assignedTasks: {
              where: { deletedAt: null },
            },
          },
        },
      },
    });
  });
}

/**
 * Get user dashboard data
 * Optimized single query with all necessary data
 */
export async function getUserDashboardData(userId: string) {
  return withQueryMetrics('getUserDashboardData', async () => {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        ...userSelectSafe,
        _count: {
          select: {
            projects: {
              where: {
                deletedAt: null,
                status: { in: ['PLANNING', 'IN_PROGRESS', 'REVIEW'] },
              },
            },
            assignedTasks: {
              where: {
                deletedAt: null,
                status: { not: 'COMPLETED' },
              },
            },
            receivedMessages: {
              where: {
                deletedAt: null,
                readAt: null,
              },
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
 * Update user (safe fields only)
 */
export async function updateUser(
  id: string,
  data: Partial<Pick<UserFull, 'name' | 'email' | 'image' | 'emailVerified'>>
): Promise<UserSafe> {
  return withQueryMetrics('updateUser', async () => {
    return prisma.user.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      select: userSelectSafe,
    });
  });
}

/**
 * Soft delete user
 */
export async function softDeleteUser(id: string): Promise<UserFull> {
  return withQueryMetrics('softDeleteUser', async () => {
    return prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
      select: userSelectFull,
    });
  });
}

/**
 * Restore soft-deleted user
 */
export async function restoreUser(id: string): Promise<UserFull> {
  return withQueryMetrics('restoreUser', async () => {
    return prisma.user.update({
      where: { id },
      data: {
        deletedAt: null,
        updatedAt: new Date(),
      },
      select: userSelectFull,
    });
  });
}
