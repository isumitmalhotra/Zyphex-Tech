/**
 * TimeEntry Cache Manager
 * 
 * Handles caching for:
 * - Time entry details
 * - User time entries and hours
 * - Project time tracking
 * - Task time tracking
 * - Billable hours calculations
 * - Time entry statistics
 * 
 * Features:
 * - Multi-level caching (L1 Memory + L2 Redis)
 * - Smart TTL based on time entry status
 * - Automatic invalidation on updates
 * - Aggregated hours calculations
 */

import { 
  getMultiLevelCache, 
  type MultiLevelCache 
} from '../multi-level-cache'
import { CacheNamespace } from '../cache-keys'
import { prisma } from '@/lib/prisma'
import type { TimeEntry, TimeEntryStatus } from '@prisma/client'

/**
 * TTL Configuration for TimeEntry Caching
 */
export const TIMEENTRY_CACHE_TTL = {
  DETAILS: 300,           // 5 minutes - Time entry details
  USER_ENTRIES: 180,      // 3 minutes - User time entries
  PROJECT_ENTRIES: 180,   // 3 minutes - Project time entries
  TASK_ENTRIES: 180,      // 3 minutes - Task time entries
  STATS: 300,             // 5 minutes - Time entry statistics
  BILLABLE: 300,          // 5 minutes - Billable hours
  DAILY: 120,             // 2 minutes - Daily entries (more volatile)
  
  // L1 (Memory) Cache TTL
  L1: {
    DETAILS: 60,          // 1 minute
    LISTS: 30,            // 30 seconds
    STATS: 60,            // 1 minute
  }
} as const

/**
 * TimeEntry with relations type
 */
type TimeEntryWithRelations = TimeEntry & {
  user: {
    id: string
    name: string | null
    email: string
  }
  project?: {
    id: string
    name: string
  } | null
  task?: {
    id: string
    title: string
  } | null
}

/**
 * Time entry statistics type
 */
type TimeEntryStats = {
  totalHours: number
  billableHours: number
  nonBillableHours: number
  totalEntries: number
  byStatus: Record<string, number>
  byUser?: Record<string, number>
  averageHoursPerDay: number
}

/**
 * Date range type
 */
type DateRange = {
  start: Date
  end: Date
}

/**
 * TimeEntry Cache Manager
 * Singleton pattern for efficient cache management
 */
export class TimeEntryCacheManager {
  private static instance: TimeEntryCacheManager
  private cache: MultiLevelCache

  private constructor() {
    this.cache = getMultiLevelCache()
  }

  public static getInstance(): TimeEntryCacheManager {
    if (!TimeEntryCacheManager.instance) {
      TimeEntryCacheManager.instance = new TimeEntryCacheManager()
    }
    return TimeEntryCacheManager.instance
  }

  /**
   * TIMEENTRY QUERY METHODS
   */

  /**
   * Get time entry by ID with relations
   * TTL: L1: 1min, L2: 5min
   */
  async getTimeEntry(entryId: string): Promise<TimeEntryWithRelations | null> {
    const cacheKey = `${CacheNamespace.STATS}:timeentry:${entryId}`
    
    // Try cache first
    const cached = await this.cache.get<TimeEntryWithRelations>(cacheKey)
    if (cached) return cached
    
    // Fetch from database
    const entry = await prisma.timeEntry.findUnique({
      where: { id: entryId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        project: {
          select: {
            id: true,
            name: true,
          }
        },
        task: {
          select: {
            id: true,
            title: true,
          }
        }
      }
    })
    
    if (!entry) return null
    
    // Cache and return
    await this.cache.set(cacheKey, entry, {
      l1Ttl: TIMEENTRY_CACHE_TTL.L1.DETAILS,
      l2Ttl: TIMEENTRY_CACHE_TTL.DETAILS,
    })
    
    return entry as TimeEntryWithRelations
  }

  /**
   * Get user time entries
   * TTL: L1: 30sec, L2: 3min
   */
  async getUserTimeEntries(
    userId: string,
    options?: {
      dateRange?: DateRange
      status?: TimeEntryStatus
      limit?: number
      offset?: number
    }
  ): Promise<TimeEntry[]> {
    const { dateRange, status, limit = 100, offset = 0 } = options || {}
    const dateKey = dateRange 
      ? `${dateRange.start.toISOString()}-${dateRange.end.toISOString()}`
      : 'all'
    const cacheKey = `${CacheNamespace.STATS}:user-entries:${userId}:${dateKey}:${status || 'all'}:${limit}:${offset}`
    
    // Try cache first
    const cached = await this.cache.get<TimeEntry[]>(cacheKey)
    if (cached) return cached
    
    // Fetch from database
    const entries = await prisma.timeEntry.findMany({
      where: {
        userId,
        ...(status && { status }),
        ...(dateRange && {
          date: {
            gte: dateRange.start,
            lte: dateRange.end,
          }
        }),
      },
      orderBy: { date: 'desc' },
      take: limit,
      skip: offset,
    })
    
    // Cache and return
    await this.cache.set(cacheKey, entries, {
      l1Ttl: TIMEENTRY_CACHE_TTL.L1.LISTS,
      l2Ttl: TIMEENTRY_CACHE_TTL.USER_ENTRIES,
    })
    
    return entries
  }

  /**
   * Get project time entries
   * TTL: L1: 30sec, L2: 3min
   */
  async getProjectTimeEntries(
    projectId: string,
    options?: {
      dateRange?: DateRange
      userId?: string
      status?: TimeEntryStatus
      limit?: number
    }
  ): Promise<TimeEntry[]> {
    const { dateRange, userId, status, limit = 200 } = options || {}
    const dateKey = dateRange 
      ? `${dateRange.start.toISOString()}-${dateRange.end.toISOString()}`
      : 'all'
    const cacheKey = `${CacheNamespace.STATS}:project-entries:${projectId}:${userId || 'all'}:${dateKey}:${status || 'all'}:${limit}`
    
    // Try cache first
    const cached = await this.cache.get<TimeEntry[]>(cacheKey)
    if (cached) return cached
    
    // Fetch from database
    const entries = await prisma.timeEntry.findMany({
      where: {
        projectId,
        ...(userId && { userId }),
        ...(status && { status }),
        ...(dateRange && {
          date: {
            gte: dateRange.start,
            lte: dateRange.end,
          }
        }),
      },
      orderBy: { date: 'desc' },
      take: limit,
    })
    
    // Cache and return
    await this.cache.set(cacheKey, entries, {
      l1Ttl: TIMEENTRY_CACHE_TTL.L1.LISTS,
      l2Ttl: TIMEENTRY_CACHE_TTL.PROJECT_ENTRIES,
    })
    
    return entries
  }

  /**
   * Get task time entries
   * TTL: L1: 30sec, L2: 3min
   */
  async getTaskTimeEntries(
    taskId: string,
    options?: {
      userId?: string
      status?: TimeEntryStatus
      limit?: number
    }
  ): Promise<TimeEntry[]> {
    const { userId, status, limit = 100 } = options || {}
    const cacheKey = `${CacheNamespace.STATS}:task-entries:${taskId}:${userId || 'all'}:${status || 'all'}:${limit}`
    
    // Try cache first
    const cached = await this.cache.get<TimeEntry[]>(cacheKey)
    if (cached) return cached
    
    // Fetch from database
    const entries = await prisma.timeEntry.findMany({
      where: {
        taskId,
        ...(userId && { userId }),
        ...(status && { status }),
      },
      orderBy: { date: 'desc' },
      take: limit,
    })
    
    // Cache and return
    await this.cache.set(cacheKey, entries, {
      l1Ttl: TIMEENTRY_CACHE_TTL.L1.LISTS,
      l2Ttl: TIMEENTRY_CACHE_TTL.TASK_ENTRIES,
    })
    
    return entries
  }

  /**
   * Get daily time entries for a user
   * TTL: L1: 30sec, L2: 2min (more volatile)
   */
  async getUserDailyEntries(
    userId: string,
    date: Date
  ): Promise<TimeEntry[]> {
    const dateStr = date.toISOString().split('T')[0]
    const cacheKey = `${CacheNamespace.STATS}:daily-entries:${userId}:${dateStr}`
    
    // Try cache first
    const cached = await this.cache.get<TimeEntry[]>(cacheKey)
    if (cached) return cached
    
    // Fetch from database
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)
    
    const entries = await prisma.timeEntry.findMany({
      where: {
        userId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        }
      },
      orderBy: { createdAt: 'desc' },
    })
    
    // Cache and return
    await this.cache.set(cacheKey, entries, {
      l1Ttl: TIMEENTRY_CACHE_TTL.L1.LISTS,
      l2Ttl: TIMEENTRY_CACHE_TTL.DAILY,
    })
    
    return entries
  }

  /**
   * Get time entry statistics
   * TTL: L1: 1min, L2: 5min
   */
  async getTimeEntryStats(options: {
    userId?: string
    projectId?: string
    dateRange?: DateRange
    groupByUser?: boolean
  }): Promise<TimeEntryStats> {
    const { userId, projectId, dateRange, groupByUser = false } = options
    const dateKey = dateRange 
      ? `${dateRange.start.toISOString()}-${dateRange.end.toISOString()}`
      : 'all'
    const cacheKey = `${CacheNamespace.STATS}:timeentry-stats:${userId || 'all'}:${projectId || 'all'}:${dateKey}:${groupByUser}`
    
    // Try cache first
    const cached = await this.cache.get<TimeEntryStats>(cacheKey)
    if (cached) return cached
    
    // Build where clause
    const where = {
      ...(userId && { userId }),
      ...(projectId && { projectId }),
      ...(dateRange && {
        date: {
          gte: dateRange.start,
          lte: dateRange.end,
        }
      }),
    }
    
    // Fetch statistics in parallel
    const [aggregates, byStatus, byUser] = await Promise.all([
      // Total hours
      prisma.timeEntry.aggregate({
        where,
        _sum: { hours: true },
        _count: true,
      }),
      
      // By status
      prisma.timeEntry.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      
      // By user (if requested)
      groupByUser
        ? prisma.timeEntry.groupBy({
            by: ['userId'],
            where,
            _sum: { hours: true },
          })
        : Promise.resolve([]),
    ])
    
    // Calculate billable/non-billable hours
    const billableAgg = await prisma.timeEntry.aggregate({
      where: { ...where, billable: true },
      _sum: { hours: true },
    })
    
    const totalHours = aggregates._sum.hours || 0
    const billableHours = billableAgg._sum.hours || 0
    const nonBillableHours = totalHours - billableHours
    
    // Calculate average hours per day
    let averageHoursPerDay = 0
    if (dateRange) {
      const days = Math.ceil(
        (dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)
      )
      averageHoursPerDay = days > 0 ? totalHours / days : 0
    }
    
    const stats: TimeEntryStats = {
      totalHours,
      billableHours,
      nonBillableHours,
      totalEntries: aggregates._count,
      byStatus: Object.fromEntries(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        byStatus.map((item: any) => [item.status, item._count])
      ),
      ...(groupByUser && {
        byUser: Object.fromEntries(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          byUser.map((item: any) => [item.userId, item._sum.hours || 0])
        ),
      }),
      averageHoursPerDay,
    }
    
    // Cache and return
    await this.cache.set(cacheKey, stats, {
      l1Ttl: TIMEENTRY_CACHE_TTL.L1.STATS,
      l2Ttl: TIMEENTRY_CACHE_TTL.STATS,
    })
    
    return stats
  }

  /**
   * Get billable hours summary
   * TTL: L1: 1min, L2: 5min
   */
  async getBillableHours(options: {
    userId?: string
    projectId?: string
    clientId?: string
    dateRange?: DateRange
  }): Promise<{
    billableHours: number
    nonBillableHours: number
    totalHours: number
    billablePercentage: number
  }> {
    const { userId, projectId, clientId, dateRange } = options
    const dateKey = dateRange 
      ? `${dateRange.start.toISOString()}-${dateRange.end.toISOString()}`
      : 'all'
    const cacheKey = `${CacheNamespace.STATS}:billable:${userId || 'all'}:${projectId || 'all'}:${clientId || 'all'}:${dateKey}`
    
    // Try cache first
    const cached = await this.cache.get<ReturnType<TimeEntryCacheManager['getBillableHours']>>(cacheKey)
    if (cached) return cached
    
    // Build where clause
    const where = {
      ...(userId && { userId }),
      ...(projectId && { projectId }),
      ...(clientId && { project: { clientId } }),
      ...(dateRange && {
        date: {
          gte: dateRange.start,
          lte: dateRange.end,
        }
      }),
    }
    
    // Fetch aggregates in parallel
    const [totalAgg, billableAgg] = await Promise.all([
      prisma.timeEntry.aggregate({
        where,
        _sum: { hours: true },
      }),
      prisma.timeEntry.aggregate({
        where: { ...where, billable: true },
        _sum: { hours: true },
      }),
    ])
    
    const totalHours = totalAgg._sum.hours || 0
    const billableHours = billableAgg._sum.hours || 0
    const nonBillableHours = totalHours - billableHours
    const billablePercentage = totalHours > 0 ? (billableHours / totalHours) * 100 : 0
    
    const result = {
      billableHours,
      nonBillableHours,
      totalHours,
      billablePercentage: Math.round(billablePercentage * 100) / 100,
    }
    
    // Cache and return
    await this.cache.set(cacheKey, result, {
      l1Ttl: TIMEENTRY_CACHE_TTL.L1.STATS,
      l2Ttl: TIMEENTRY_CACHE_TTL.BILLABLE,
    })
    
    return result
  }

  /**
   * CACHE INVALIDATION METHODS
   */

  /**
   * Invalidate specific time entry cache
   */
  async invalidateTimeEntry(entryId: string): Promise<void> {
    await this.cache.delete(`${CacheNamespace.STATS}:timeentry:${entryId}`)
  }

  /**
   * Invalidate user time entries
   */
  async invalidateUserTimeEntries(userId: string): Promise<void> {
    // Clear common cache keys for user
    const today = new Date().toISOString().split('T')[0]
    await Promise.all([
      this.cache.delete(`${CacheNamespace.STATS}:user-entries:${userId}:all:all:100:0`),
      this.cache.delete(`${CacheNamespace.STATS}:daily-entries:${userId}:${today}`),
    ])
  }

  /**
   * Invalidate project time entries
   */
  async invalidateProjectTimeEntries(projectId: string): Promise<void> {
    // Clear common cache keys for project
    await this.cache.delete(`${CacheNamespace.STATS}:project-entries:${projectId}:all:all:all:200`)
  }

  /**
   * Invalidate task time entries
   */
  async invalidateTaskTimeEntries(taskId: string): Promise<void> {
    await this.cache.delete(`${CacheNamespace.STATS}:task-entries:${taskId}:all:all:100`)
  }

  /**
   * Invalidate time entry statistics
   */
  async invalidateStats(options?: {
    userId?: string
    projectId?: string
  }): Promise<void> {
    const { userId, projectId } = options || {}
    
    // Clear stats cache
    await this.cache.delete(
      `${CacheNamespace.STATS}:timeentry-stats:${userId || 'all'}:${projectId || 'all'}:all:false`
    )
  }

  /**
   * Invalidate billable hours cache
   */
  async invalidateBillableHours(options?: {
    userId?: string
    projectId?: string
  }): Promise<void> {
    const { userId, projectId } = options || {}
    
    await this.cache.delete(
      `${CacheNamespace.STATS}:billable:${userId || 'all'}:${projectId || 'all'}:all:all`
    )
  }

  /**
   * Invalidate all time entry caches for a user
   */
  async invalidateAllUserTimeEntryCaches(userId: string): Promise<void> {
    await Promise.all([
      this.invalidateUserTimeEntries(userId),
      this.invalidateStats({ userId }),
      this.invalidateBillableHours({ userId }),
    ])
  }

  /**
   * Invalidate all time entry caches for a project
   */
  async invalidateAllProjectTimeEntryCaches(projectId: string): Promise<void> {
    await Promise.all([
      this.invalidateProjectTimeEntries(projectId),
      this.invalidateStats({ projectId }),
      this.invalidateBillableHours({ projectId }),
    ])
  }
}

/**
 * Get TimeEntry Cache Manager instance
 */
export function getTimeEntryCacheManager(): TimeEntryCacheManager {
  return TimeEntryCacheManager.getInstance()
}

/**
 * CONVENIENCE FUNCTIONS
 * Direct access to cache manager methods
 */

export async function getTimeEntry(entryId: string) {
  return getTimeEntryCacheManager().getTimeEntry(entryId)
}

export async function getUserTimeEntries(
  userId: string,
  options?: Parameters<TimeEntryCacheManager['getUserTimeEntries']>[1]
) {
  return getTimeEntryCacheManager().getUserTimeEntries(userId, options)
}

export async function getProjectTimeEntries(
  projectId: string,
  options?: Parameters<TimeEntryCacheManager['getProjectTimeEntries']>[1]
) {
  return getTimeEntryCacheManager().getProjectTimeEntries(projectId, options)
}

export async function getTaskTimeEntries(
  taskId: string,
  options?: Parameters<TimeEntryCacheManager['getTaskTimeEntries']>[1]
) {
  return getTimeEntryCacheManager().getTaskTimeEntries(taskId, options)
}

export async function getUserDailyEntries(userId: string, date: Date) {
  return getTimeEntryCacheManager().getUserDailyEntries(userId, date)
}

export async function getTimeEntryStats(
  options: Parameters<TimeEntryCacheManager['getTimeEntryStats']>[0]
) {
  return getTimeEntryCacheManager().getTimeEntryStats(options)
}

export async function getBillableHours(
  options: Parameters<TimeEntryCacheManager['getBillableHours']>[0]
) {
  return getTimeEntryCacheManager().getBillableHours(options)
}

export async function invalidateTimeEntry(entryId: string) {
  return getTimeEntryCacheManager().invalidateTimeEntry(entryId)
}

export async function invalidateUserTimeEntries(userId: string) {
  return getTimeEntryCacheManager().invalidateUserTimeEntries(userId)
}

export async function invalidateProjectTimeEntries(projectId: string) {
  return getTimeEntryCacheManager().invalidateProjectTimeEntries(projectId)
}

export async function invalidateTaskTimeEntries(taskId: string) {
  return getTimeEntryCacheManager().invalidateTaskTimeEntries(taskId)
}

export async function invalidateTimeEntryStats(options?: {
  userId?: string
  projectId?: string
}) {
  return getTimeEntryCacheManager().invalidateStats(options)
}

export async function invalidateBillableHours(options?: {
  userId?: string
  projectId?: string
}) {
  return getTimeEntryCacheManager().invalidateBillableHours(options)
}

export async function invalidateAllUserTimeEntryCaches(userId: string) {
  return getTimeEntryCacheManager().invalidateAllUserTimeEntryCaches(userId)
}

export async function invalidateAllProjectTimeEntryCaches(projectId: string) {
  return getTimeEntryCacheManager().invalidateAllProjectTimeEntryCaches(projectId)
}

/**
 * CACHE WARMING
 * Pre-load frequently accessed time entry data
 */
export async function warmTimeEntryCache(userId: string, projectId?: string): Promise<void> {
  const manager = getTimeEntryCacheManager()
  const today = new Date()
  
  // Warm most common queries
  await Promise.all([
    manager.getUserDailyEntries(userId, today),
    manager.getUserTimeEntries(userId, { limit: 20 }),
    ...(projectId ? [manager.getProjectTimeEntries(projectId, { userId, limit: 50 })] : []),
  ])
}
