/**
 * Cache Module - Main Entry Point
 * 
 * Exports:
 * - Multi-level cache (L1 Memory + L2 Redis)
 * - Cache service (Redis operations)
 * - Memory cache (L1 operations)
 * - Cache keys (type-safe key generators)
 * - Caching patterns (cache-aside, write-through, etc.)
 * - Legacy cache manager (for backwards compatibility)
 */

// Multi-Level Cache (NEW - Production Ready)
export { 
  MultiLevelCache,
  getMultiLevelCache,
  createMultiLevelCache,
  CacheLevel,
} from './multi-level-cache'

// Memory Cache (L1)
export {
  MemoryCache,
  getMemoryCache,
  createMemoryCache,
} from './memory-cache'

// Cache Service (L2 - Redis)
export {
  cacheService,
  CacheService,
  DEFAULT_TTL,
} from './cache-service'

// Cache Keys (Type-safe key generators)
export {
  CacheNamespace,
  UserCacheKeys,
  ClientCacheKeys,
  ProjectCacheKeys,
  TaskCacheKeys,
  InvoiceCacheKeys,
  SessionCacheKeys,
  DashboardCacheKeys,
  StatsCacheKeys,
  ListCacheKeys,
  SearchCacheKeys,
  generateCacheKey,
  parseCacheKey,
  getCacheKeyPattern,
} from './cache-keys'

// Cache Managers
export {
  UserCacheManager,
  getUserCacheManager,
  USER_CACHE_TTL,
  getUserProfile,
  getUserWithProjects,
  getUserPermissions,
  getUserTasksCount,
  getUserUnreadCount,
  searchUsers,
  invalidateUserCache,
  invalidateUserProfile,
  invalidateUserProjects,
  warmUserCache,
} from './managers/user-cache'

export {
  ProjectCacheManager,
  getProjectCacheManager,
  PROJECT_CACHE_TTL,
  getProject,
  getProjectWithTasks,
  getProjectTeam,
  getProjectStats,
  getProjectTimeline,
  searchProjects,
  getClientProjects,
  getManagerProjects,
  getActiveProjects,
  invalidateProjectCache,
  invalidateProject,
  invalidateProjectTasks,
  invalidateProjectStats,
  invalidateClientProjects,
  invalidateManagerProjects,
  warmProjectCache,
} from './managers/project-cache'

export {
  TaskCacheManager,
  getTaskCacheManager,
  TASK_CACHE_TTL,
  getTask,
  getTaskWithTimeEntries,
  getTaskDependencies,
  getTaskActivity,
  getUserTasks,
  getProjectTasks,
  getOverdueTasks,
  searchTasks,
  getUserTaskStats,
  getProjectTaskStats,
  invalidateTaskCache,
  invalidateTask,
  invalidateUserTasks,
  invalidateProjectTasks as invalidateTasksByProject,
  invalidateTaskTimeEntries,
  invalidateTaskActivity,
  warmTaskCache,
} from './managers/task-cache'

export {
  MessageCacheManager,
  getMessageCacheManager,
  MESSAGE_CACHE_TTL,
  getMessage,
  getMessageThread,
  getChannelMessages,
  getDirectMessages,
  getUserUnreadMessageCount,
  getUserUnreadMessages,
  searchMessages,
  getUserMessageStats,
  getNotification,
  getUserNotifications,
  getUserUnreadNotificationCount,
  getUserNotificationsByType,
  getUserNotificationStats,
  invalidateMessage,
  invalidateChannelMessages,
  invalidateDirectMessages,
  invalidateUserUnreadMessages,
  invalidateUserMessageSearch,
  invalidateNotification,
  invalidateUserNotifications,
  warmMessageCache,
  warmNotificationCache,
} from './managers/message-cache'

export {
  DashboardCacheManager,
  getDashboardCacheManager,
  DASHBOARD_CACHE_TTL,
  getDashboardOverview,
  getUserDashboardStats,
  getUserRecentActivity,
  getProjectAnalytics,
  getUserActivityAnalytics,
  getPlatformStats,
  getClientAnalytics,
  invalidateUserDashboard,
  invalidateProjectAnalytics,
  invalidateClientAnalytics,
  invalidatePlatformStats,
  invalidateUserActivity,
  warmDashboardCache,
} from './managers/dashboard-cache'

export {
  InvoiceCacheManager,
  getInvoiceCacheManager,
  INVOICE_CACHE_TTL,
  getInvoice,
  getClientInvoices,
  getProjectInvoices,
  getInvoicesByStatus,
  getOverdueInvoices,
  getInvoiceStats,
  searchInvoices,
  invalidateInvoice,
  invalidateClientInvoices,
  invalidateProjectInvoices,
  invalidateInvoiceStats,
  invalidateClientInvoiceCaches,
  warmInvoiceCache,
} from './managers/invoice-cache'

export {
  ClientCacheManager,
  getClientCacheManager,
  CLIENT_CACHE_TTL,
  getClient,
  getClientWithProjects,
  getClientWithInvoices,
  getClientStats,
  getActiveClients,
  searchClients,
  getAllClients,
  invalidateClient,
  invalidateClientStats,
  invalidateClientLists,
  invalidateAllClientCaches,
  warmClientCache,
} from './managers/client-cache'

export {
  TimeEntryCacheManager,
  getTimeEntryCacheManager,
  TIMEENTRY_CACHE_TTL,
  getTimeEntry,
  getUserTimeEntries,
  getProjectTimeEntries,
  getTaskTimeEntries,
  getUserDailyEntries,
  getTimeEntryStats,
  getBillableHours,
  invalidateTimeEntry,
  invalidateUserTimeEntries,
  invalidateProjectTimeEntries,
  invalidateTaskTimeEntries as invalidateTaskTimeEntriesCache,
  invalidateTimeEntryStats,
  invalidateBillableHours,
  invalidateAllUserTimeEntryCaches,
  invalidateAllProjectTimeEntryCaches,
  warmTimeEntryCache,
} from './managers/timeentry-cache'

// Caching Patterns
export {
  cacheAside,
  cacheAsideStale,
  writeThrough,
  writeBehind,
  refreshAhead,
  batchCacheAside,
  preventStampede,
  multiTierCache,
  invalidateRelated,
} from './patterns'

// Query Cache
export {
  getCachedQuery,
  invalidateQueryCache,
} from './query-cache'

// Search Cache
export {
  getCachedSearchResults,
  getCachedSuggestions,
} from './search-cache'

// Legacy support (for backwards compatibility) - Keeping existing CacheManager
// Note: Consider migrating to MultiLevelCache for new code
  // Cache manager that uses Redis with memory fallback class CacheManager {   private primaryCache: CacheAdapter | null = null;   private fallbackCache: CacheAdapter = memoryCacheAdapter;    async getCache(): Promise<CacheAdapter> {     // Try to use Redis first     const redis = getRedisClient();     if (redis && await this.isRedisHealthy()) {       return this.getRedisAdapter();     }          // Fallback to memory cache     return this.fallbackCache;   }    private async isRedisHealthy(): Promise<boolean> {     try {       const redis = getRedisClient();       if (!redis) return false;              await redis.ping();       return true;     } catch {       return false;     }   }    private getRedisAdapter(): CacheAdapter {     const redis = getRedisClient();     if (!redis) throw new Error('Redis client not available');      return {       async get<T>(key: string): Promise<T | null> {         try {           const result = await redis.get(key);           return result ? JSON.parse(result) : null;         } catch {           return null;         }       },        async set<T>(key: string, value: T, ttl: number = 300): Promise<boolean> {         try {           await redis.setex(key, ttl, JSON.stringify(value));           return true;         } catch {           return false;         }       },        async delete(key: string): Promise<boolean> {         try {           await redis.del(key);           return true;         } catch {           return false;         }       },        async deletePattern(pattern: string): Promise<boolean> {         try {           const keys = await redis.keys(pattern);           if (keys.length > 0) {             await redis.del(...keys);           }           return true;         } catch {           return false;         }       },        async clear(): Promise<boolean> {         try {           await redis.flushdb();           return true;         } catch {           return false;         }       },        async isHealthy(): Promise<boolean> {         try {           await redis.ping();           return true;         } catch {           return false;         }       }     };   }    // High-level cache operations   async get<T>(key: string): Promise<T | null> {     const cache = await this.getCache();     return cache.get<T>(key);   }    async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {     const cache = await this.getCache();     return cache.set(key, value, ttl);   }    async delete(key: string): Promise<boolean> {     // Try to delete from both caches     const cache = await this.getCache();     const primaryResult = await cache.delete(key);          // Also delete from fallback if we're using Redis     if (cache !== this.fallbackCache) {       await this.fallbackCache.delete(key);     }          return primaryResult;   }    async deletePattern(pattern: string): Promise<boolean> {     const cache = await this.getCache();     const primaryResult = await cache.deletePattern(pattern);          // Also delete from fallback if we're using Redis     if (cache !== this.fallbackCache) {       await this.fallbackCache.deletePattern(pattern);     }          return primaryResult;   }    async clear(): Promise<boolean> {     const cache = await this.getCache();     const primaryResult = await cache.clear();          // Also clear fallback     await this.fallbackCache.clear();          return primaryResult;   }    async getStatus(): Promise<{     primary: { type: 'redis' | 'memory'; healthy: boolean };     fallback: { type: 'memory'; healthy: boolean };   }> {     const redisHealthy = await this.isRedisHealthy();     const memoryHealthy = await this.fallbackCache.isHealthy();          return {       primary: {         type: redisHealthy ? 'redis' : 'memory',         healthy: redisHealthy || memoryHealthy       },       fallback: {         type: 'memory',         healthy: memoryHealthy       }     };   } }  // Singleton instance export const cacheManager = new CacheManager();  // Content-specific cache functions using the manager export async function cacheContentType(contentType: unknown): Promise<void> {   const key = cacheKeys.contentType((contentType as { id: string }).id);   await cacheManager.set(key, contentType, cacheTTL.contentType); }  export async function getCachedContentType(id: string): Promise<unknown | null> {   const key = cacheKeys.contentType(id);   return await cacheManager.get(key); }  export async function cacheContentTypes(contentTypes: unknown[]): Promise<void> {   const key = cacheKeys.contentTypes();   await cacheManager.set(key, contentTypes, cacheTTL.contentTypes); }  export async function getCachedContentTypes(): Promise<unknown[] | null> {   const key = cacheKeys.contentTypes();   return await cacheManager.get(key); }  export async function cacheDynamicContent(typeId: string, items: unknown[]): Promise<void> {   const key = cacheKeys.dynamicContent(typeId);   await cacheManager.set(key, items, cacheTTL.dynamicContent); }  export async function getCachedDynamicContent(typeId: string): Promise<unknown[] | null> {   const key = cacheKeys.dynamicContent(typeId);   return await cacheManager.get(key); }  export async function cacheDynamicContentItem(item: unknown): Promise<void> {   const key = cacheKeys.dynamicContentItem((item as { id: string }).id);   await cacheManager.set(key, item, cacheTTL.dynamicContent); }  export async function getCachedDynamicContentItem(id: string): Promise<unknown | null> {   const key = cacheKeys.dynamicContentItem(id);   return await cacheManager.get(key); }  // Cache invalidation functions export async function invalidateContentTypeCache(id?: string): Promise<void> {   if (id) {     await cacheManager.delete(cacheKeys.contentType(id));   }      // Always invalidate the list cache when any content type changes   await cacheManager.delete(cacheKeys.contentTypes()); }  export async function invalidateDynamicContentCache(typeId?: string, itemId?: string): Promise<void> {   if (typeId) {     await cacheManager.delete(cacheKeys.dynamicContent(typeId));   }      if (itemId) {     await cacheManager.delete(cacheKeys.dynamicContentItem(itemId));   } }  export async function invalidateAllContentCache(): Promise<void> {   await cacheManager.deletePattern('content*'); }  // Export cache manager for direct access
export { cacheManager } from './legacy-cache-manager'

// Legacy cache adapter (backwards compatibility)
export { cache } from './legacy-cache-adapter'

// Cache Monitoring & Performance (NEW)
export {
  CacheMonitor,
  getCacheMonitor,
  cacheMonitor,
  CacheHealth,
  type CacheMetricsSnapshot,
} from './cache-monitor'
