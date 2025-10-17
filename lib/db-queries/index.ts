/**
 * Database Query Library - Main Export
 * 
 * Production-ready query optimization library for Zyphex Tech platform
 * 
 * Features:
 * - Type-safe queries with minimal field selection
 * - N+1 query prevention with batch loading
 * - Cursor and offset-based pagination
 * - Performance monitoring and metrics
 * - Soft-delete handling
 * - Proper index utilization
 * 
 * @example
 * ```typescript
 * import { getUserById, getProjects, batchGetTasksByProjectIds } from '@/lib/db-queries';
 * 
 * // Get user with minimal fields
 * const user = await getUserById('user-id');
 * 
 * // Get projects with pagination
 * const projects = await getProjects({ status: 'IN_PROGRESS' }, { page: 1, limit: 20 });
 * 
 * // Batch load tasks (prevents N+1)
 * const tasksByProject = await batchGetTasksByProjectIds(projectIds);
 * ```
 */

// ============================================================================
// Type Exports
// ============================================================================

export * from './types';

// ============================================================================
// Common Utilities
// ============================================================================

export {
  // Soft delete
  buildSoftDeleteWhere,
  
  // Pagination
  calculatePagination,
  buildPaginatedResponse,
  calculateCursorPagination,
  buildCursorPaginatedResponse,
  
  // Search & filters
  buildSearchConditions,
  buildDateRangeFilter,
  buildStatusFilter,
  buildNumericRangeFilter,
  combineWhereConditions,
  buildOrderBy,
  
  // Performance monitoring
  withQueryMetrics,
  getQueryMetrics,
  clearQueryMetrics,
  getSlowQueries,
  getAverageQueryDuration,
  
  // Batch loading (N+1 prevention)
  batchLoadByIds,
  batchLoadByForeignKey,
  
  // Transactions
  withTransaction,
} from './common';

// ============================================================================
// User Queries
// ============================================================================

export {
  // Single user
  getUserById,
  getUserByIdSafe,
  getUserByIdFull,
  getUserByEmail,
  getUserWithAuth,
  
  // List/search
  getUsers,
  getUsersByRole,
  searchUsers,
  getRecentUsers,
  
  // Batch queries
  batchGetUsersByIds,
  batchGetUsersByIdsSafe,
  
  // Statistics
  getUserStats,
  
  // With relations
  getUserWithProjects,
  getUserWithTasks,
  getUserDashboardData,
  
  // Updates
  updateUser,
  softDeleteUser,
  restoreUser,
} from './user-queries';

// ============================================================================
// Project Queries
// ============================================================================

export {
  // Single project
  getProjectById,
  getProjectWithClient,
  getProjectByIdFull,
  
  // List/search
  getProjects,
  getProjectsByClient,
  getProjectsByManager,
  getProjectsByStatus,
  getActiveProjects,
  getUserProjects,
  searchProjects,
  
  // Batch queries
  batchGetProjectsByIds,
  batchGetProjectsWithClient,
  batchGetProjectsByClientIds,
  batchGetProjectsByManagerIds,
  
  // Statistics
  getProjectStats,
  getProjectBudgetSummary,
  
  // With relations
  getProjectWithTeam,
  getProjectWithTasksSummary,
  getProjectWithActivity,
  
  // Updates
  updateProject,
  updateProjectStatus,
  softDeleteProject,
  restoreProject,
} from './project-queries';

// ============================================================================
// Task Queries
// ============================================================================

export {
  // Single task
  getTaskById,
  getTaskWithAssignee,
  getTaskByIdFull,
  
  // List/search
  getTasks,
  getTasksByProject,
  getTasksByAssignee,
  getTasksByStatus,
  getOverdueTasks,
  getUpcomingTasks,
  getUserTasks,
  searchTasks,
  
  // Batch queries
  batchGetTasksByIds,
  batchGetTasksWithAssignee,
  batchGetTasksByProjectIds,
  batchGetTasksByAssigneeIds,
  
  // Statistics
  getTaskStats,
  getTaskTimeSummary,
  
  // With relations
  getTaskWithTimeEntries,
  getTaskWithComments,
  
  // Updates
  updateTask,
  updateTaskStatus,
  assignTask,
  softDeleteTask,
  restoreTask,
  
  // Bulk operations
  bulkUpdateTaskStatus,
  bulkAssignTasks,
} from './task-queries';

// ============================================================================
// Invoice & Message Queries
// ============================================================================

export {
  // Invoices
  getInvoiceById,
  getInvoiceWithClient,
  getInvoices,
  getInvoicesByClient,
  getInvoicesByStatus,
  getOverdueInvoices,
  batchGetInvoicesByProjectIds,
  getInvoiceStats,
  updateInvoiceStatus,
  
  // Messages
  getMessageById,
  getMessageWithUsers,
  getMessages,
  getConversation,
  getUnreadMessages,
  getUnreadMessageCount,
  markMessageAsRead,
  markAllMessagesAsRead,
  batchGetMessagesByChannelIds,
  getMessageStats,
} from './invoice-message-queries';
