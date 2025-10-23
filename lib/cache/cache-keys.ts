/**
 * Type-safe cache key generators
 * 
 * Provides consistent, collision-free cache keys for different data types.
 * All keys follow the pattern: namespace:entity:identifier[:subkey]
 * 
 * Examples:
 * - user:profile:123
 * - project:details:456
 * - session:data:abc123
 * - dashboard:stats:user:789
 */

/**
 * Cache key namespaces to prevent collisions
 */
export enum CacheNamespace {
  USER = 'user',
  CLIENT = 'client',
  PROJECT = 'project',
  TASK = 'task',
  INVOICE = 'invoice',
  MESSAGE = 'message',
  SESSION = 'session',
  DASHBOARD = 'dashboard',
  STATS = 'stats',
  LIST = 'list',
  SEARCH = 'search',
}

/**
 * User-related cache keys
 */
export const UserCacheKeys = {
  /**
   * User profile data (includes all user fields)
   * TTL: 1 hour
   */
  profile: (userId: string) => `${CacheNamespace.USER}:profile:${userId}`,
  
  /**
   * User with all relations (projects, tasks, etc.)
   * TTL: 5 minutes
   */
  full: (userId: string) => `${CacheNamespace.USER}:full:${userId}`,
  
  /**
   * User's active projects list
   * TTL: 15 minutes
   */
  projects: (userId: string) => `${CacheNamespace.USER}:projects:${userId}`,
  
  /**
   * User's pending tasks
   * TTL: 5 minutes
   */
  tasks: (userId: string) => `${CacheNamespace.USER}:tasks:${userId}`,
  
  /**
   * User's unread messages count
   * TTL: 1 minute
   */
  unreadCount: (userId: string) => `${CacheNamespace.USER}:unread:${userId}`,
  
  /**
   * User's dashboard data
   * TTL: 5 minutes
   */
  dashboard: (userId: string) => `${CacheNamespace.USER}:dashboard:${userId}`,
  
  /**
   * User search results
   * TTL: 10 minutes
   */
  search: (query: string, limit: number) => 
    `${CacheNamespace.USER}:search:${encodeURIComponent(query)}:${limit}`,
  
  /**
   * All user cache keys for a specific user (for invalidation)
   */
  allForUser: (userId: string) => `${CacheNamespace.USER}:*:${userId}*`,
}

/**
 * Client-related cache keys
 */
export const ClientCacheKeys = {
  /**
   * Client profile data
   * TTL: 1 hour
   */
  profile: (clientId: string) => `${CacheNamespace.CLIENT}:profile:${clientId}`,
  
  /**
   * Client with all projects
   * TTL: 15 minutes
   */
  withProjects: (clientId: string) => `${CacheNamespace.CLIENT}:projects:${clientId}`,
  
  /**
   * Client's active projects list
   * TTL: 15 minutes
   */
  activeProjects: (clientId: string) => `${CacheNamespace.CLIENT}:active:${clientId}`,
  
  /**
   * Client statistics
   * TTL: 1 hour
   */
  stats: (clientId: string) => `${CacheNamespace.CLIENT}:stats:${clientId}`,
  
  /**
   * All client cache keys for a specific client (for invalidation)
   */
  allForClient: (clientId: string) => `${CacheNamespace.CLIENT}:*:${clientId}*`,
}

/**
 * Project-related cache keys
 */
export const ProjectCacheKeys = {
  /**
   * Project details with basic relations
   * TTL: 30 minutes
   */
  details: (projectId: string) => `${CacheNamespace.PROJECT}:details:${projectId}`,
  
  /**
   * Project with all tasks and team members
   * TTL: 5 minutes
   */
  full: (projectId: string) => `${CacheNamespace.PROJECT}:full:${projectId}`,
  
  /**
   * Project tasks list
   * TTL: 5 minutes
   */
  tasks: (projectId: string) => `${CacheNamespace.PROJECT}:tasks:${projectId}`,
  
  /**
   * Project team members
   * TTL: 1 hour
   */
  team: (projectId: string) => `${CacheNamespace.PROJECT}:team:${projectId}`,
  
  /**
   * Project statistics (progress, completion, etc.)
   * TTL: 15 minutes
   */
  stats: (projectId: string) => `${CacheNamespace.PROJECT}:stats:${projectId}`,
  
  /**
   * Project milestones
   * TTL: 1 hour
   */
  milestones: (projectId: string) => `${CacheNamespace.PROJECT}:milestones:${projectId}`,
  
  /**
   * Active projects list for a user
   * TTL: 15 minutes
   */
  activeList: (userId: string) => `${CacheNamespace.PROJECT}:active:user:${userId}`,
  
  /**
   * Projects by client
   * TTL: 10 minutes
   */
  byClient: (clientId: string) => `${CacheNamespace.PROJECT}:client:${clientId}`,
  
  /**
   * Project search results
   * TTL: 10 minutes
   */
  search: (query: string, limit: number) => `${CacheNamespace.PROJECT}:search:${query}:${limit}`,
  
  /**
   * All project cache keys for a specific project (for invalidation)
   */
  allForProject: (projectId: string) => `${CacheNamespace.PROJECT}:*:${projectId}*`,
}

/**
 * Task-related cache keys
 */
export const TaskCacheKeys = {
  /**
   * Task details
   * TTL: 30 minutes
   */
  details: (taskId: string) => `${CacheNamespace.TASK}:details:${taskId}`,
  
  /**
   * Task with all relations (assignee, project, subtasks)
   * TTL: 5 minutes
   */
  full: (taskId: string) => `${CacheNamespace.TASK}:full:${taskId}`,
  
  /**
   * User's pending tasks
   * TTL: 5 minutes
   */
  userPending: (userId: string) => `${CacheNamespace.TASK}:pending:${userId}`,
  
  /**
   * User's overdue tasks
   * TTL: 1 minute
   */
  userOverdue: (userId: string) => `${CacheNamespace.TASK}:overdue:${userId}`,
  
  /**
   * Project tasks by status
   * TTL: 5 minutes
   */
  byStatus: (projectId: string, status: string) => 
    `${CacheNamespace.TASK}:status:${projectId}:${status}`,
  
  /**
   * Project tasks (all or by status)
   * TTL: 10 minutes
   */
  byProject: (projectId: string, status?: string) => 
    status 
      ? `${CacheNamespace.TASK}:project:${projectId}:${status}`
      : `${CacheNamespace.TASK}:project:${projectId}`,
  
  /**
   * Task search results
   * TTL: 10 minutes
   */
  search: (query: string, limit: number) => 
    `${CacheNamespace.TASK}:search:${query}:${limit}`,
  
  /**
   * All task cache keys for a specific task (for invalidation)
   */
  allForTask: (taskId: string) => `${CacheNamespace.TASK}:*:${taskId}*`,
}

/**
 * Invoice-related cache keys
 */
export const InvoiceCacheKeys = {
  /**
   * Invoice details
   * TTL: 1 hour
   */
  details: (invoiceId: string) => `${CacheNamespace.INVOICE}:details:${invoiceId}`,
  
  /**
   * Invoice with all line items
   * TTL: 1 hour
   */
  full: (invoiceId: string) => `${CacheNamespace.INVOICE}:full:${invoiceId}`,
  
  /**
   * Client invoices list
   * TTL: 30 minutes
   */
  clientList: (clientId: string) => `${CacheNamespace.INVOICE}:client:${clientId}`,
  
  /**
   * Pending invoices for a client
   * TTL: 15 minutes
   */
  pending: (clientId: string) => `${CacheNamespace.INVOICE}:pending:${clientId}`,
  
  /**
   * All invoice cache keys for a specific invoice (for invalidation)
   */
  allForInvoice: (invoiceId: string) => `${CacheNamespace.INVOICE}:*:${invoiceId}*`,
}

/**
 * Session-related cache keys
 */
export const SessionCacheKeys = {
  /**
   * User session data
   * TTL: 24 hours
   */
  data: (sessionId: string) => `${CacheNamespace.SESSION}:data:${sessionId}`,
  
  /**
   * User's active sessions
   * TTL: 1 hour
   */
  userSessions: (userId: string) => `${CacheNamespace.SESSION}:user:${userId}`,
  
  /**
   * Session metadata (last access, IP, etc.)
   * TTL: 24 hours
   */
  metadata: (sessionId: string) => `${CacheNamespace.SESSION}:meta:${sessionId}`,
  
  /**
   * All session cache keys for a specific session (for invalidation)
   */
  allForSession: (sessionId: string) => `${CacheNamespace.SESSION}:*:${sessionId}*`,
}

/**
 * Dashboard-related cache keys
 */
export const DashboardCacheKeys = {
  /**
   * User dashboard overview data
   * TTL: 5 minutes
   */
  overview: (userId: string) => `${CacheNamespace.DASHBOARD}:overview:${userId}`,
  
  /**
   * Dashboard statistics (counts, progress, etc.)
   * TTL: 2 minutes
   */
  stats: (userId: string) => `${CacheNamespace.DASHBOARD}:stats:${userId}`,
  
  /**
   * Recent activity feed
   * TTL: 1 minute
   */
  activity: (userId: string, limit: number = 10) => 
    `${CacheNamespace.DASHBOARD}:activity:${userId}:${limit}`,
  
  /**
   * Recent activity feed (alternative spelling)
   * TTL: 1 minute
   */
  recentActivity: (userId: string, limit: number = 10) => 
    `${CacheNamespace.DASHBOARD}:activity:${userId}:${limit}`,
  
  /**
   * Active projects list
   * TTL: 5 minutes
   */
  activeProjects: (userId: string, limit: number | string = 10) => 
    `${CacheNamespace.DASHBOARD}:active-projects:${userId}:${limit}`,
  
  /**
   * Active tasks list
   * TTL: 3 minutes
   */
  activeTasks: (userId: string, limit: number | string = 20) => 
    `${CacheNamespace.DASHBOARD}:active-tasks:${userId}:${limit}`,
  
  /**
   * Overdue tasks list
   * TTL: 5 minutes
   */
  overdueTasks: (userId: string, limit: number | string = 10) => 
    `${CacheNamespace.DASHBOARD}:overdue-tasks:${userId}:${limit}`,
  
  /**
   * Notifications list
   * TTL: 30 seconds
   */
  notifications: (userId: string, limit: number | string = 50) => 
    `${CacheNamespace.DASHBOARD}:notifications:${userId}:${limit}`,
  
  /**
   * Complete dashboard data
   * TTL: 2 minutes
   */
  complete: (userId: string) => `${CacheNamespace.DASHBOARD}:complete:${userId}`,
  
  /**
   * Dashboard widgets data
   * TTL: 10 minutes
   */
  widgets: (userId: string) => `${CacheNamespace.DASHBOARD}:widgets:${userId}`,
  
  /**
   * All dashboard cache keys for a specific user (for invalidation)
   */
  allForUser: (userId: string) => `${CacheNamespace.DASHBOARD}:*:${userId}*`,
}

/**
 * Statistics and aggregation cache keys
 */
export const StatsCacheKeys = {
  /**
   * Platform-wide statistics
   * TTL: 1 hour
   */
  platform: () => `${CacheNamespace.STATS}:platform`,
  
  /**
   * User statistics
   * TTL: 1 hour
   */
  user: (userId: string) => `${CacheNamespace.STATS}:user:${userId}`,
  
  /**
   * Project statistics
   * TTL: 30 minutes
   */
  project: (projectId: string) => `${CacheNamespace.STATS}:project:${projectId}`,
  
  /**
   * Client statistics
   * TTL: 1 hour
   */
  client: (clientId: string) => `${CacheNamespace.STATS}:client:${clientId}`,
  
  /**
   * Date-based statistics (daily, weekly, monthly)
   * TTL: 6 hours
   */
  dateRange: (startDate: string, endDate: string) => 
    `${CacheNamespace.STATS}:range:${startDate}:${endDate}`,
}

/**
 * List and pagination cache keys
 */
export const ListCacheKeys = {
  /**
   * Paginated list of entities
   * TTL: 10 minutes
   */
  paginated: (entity: string, page: number, limit: number, filters: string = '') => 
    `${CacheNamespace.LIST}:${entity}:${page}:${limit}:${filters}`,
  
  /**
   * Filtered list
   * TTL: 10 minutes
   */
  filtered: (entity: string, filters: Record<string, unknown>) => 
    `${CacheNamespace.LIST}:${entity}:${JSON.stringify(filters)}`,
  
  /**
   * Sorted list
   * TTL: 10 minutes
   */
  sorted: (entity: string, sortBy: string, order: 'asc' | 'desc') => 
    `${CacheNamespace.LIST}:${entity}:sort:${sortBy}:${order}`,
}

/**
 * Search cache keys
 */
export const SearchCacheKeys = {
  /**
   * General search results
   * TTL: 30 minutes
   */
  results: (query: string, entity: string, limit: number = 20) => 
    `${CacheNamespace.SEARCH}:${entity}:${encodeURIComponent(query)}:${limit}`,
  
  /**
   * Advanced search with filters
   * TTL: 30 minutes
   */
  advanced: (query: string, entity: string, filters: Record<string, unknown>) => 
    `${CacheNamespace.SEARCH}:${entity}:${encodeURIComponent(query)}:${JSON.stringify(filters)}`,
  
  /**
   * Search suggestions/autocomplete
   * TTL: 1 hour
   */
  suggestions: (query: string, limit: number = 10) => 
    `${CacheNamespace.SEARCH}:suggestions:${encodeURIComponent(query)}:${limit}`,
}

/**
 * Helper function to generate a custom cache key
 */
export function generateCacheKey(
  namespace: CacheNamespace | string,
  ...parts: (string | number)[]
): string {
  return [namespace, ...parts.map(p => String(p))].join(':')
}

/**
 * Parse cache key into components
 */
export function parseCacheKey(key: string): {
  namespace: string
  parts: string[]
} {
  const [namespace, ...parts] = key.split(':')
  return { namespace, parts }
}

/**
 * Get all cache keys matching a pattern
 * Note: Use with caution in production (KEYS command can be slow)
 */
export function getCacheKeyPattern(pattern: string): string {
  return pattern.replace(/\*/g, '*')
}
