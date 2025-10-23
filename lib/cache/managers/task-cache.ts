/**
 * Task Cache Manager - Production Version
 * 
 * Caching strategy for task data with multi-level cache:
 * - Task details (15min TTL)
 * - Task with time entries (10min TTL)
 * - Task dependencies (30min TTL)
 * - Activity logs (5min TTL)
 * - Task lists and search (10min TTL)
 * - Automatic invalidation
 * 
 * Uses existing Prisma schema with soft delete support
 */

import { getMultiLevelCache } from '../multi-level-cache'
import { TaskCacheKeys } from '../cache-keys'
import { prisma } from '@/lib/prisma'

/**
 * TTL constants (in seconds)
 */
export const TASK_CACHE_TTL = {
  TASK: 900,           // 15 minutes
  TIME_ENTRIES: 600,   // 10 minutes
  DEPENDENCIES: 1800,  // 30 minutes
  ACTIVITY: 300,       // 5 minutes
  SEARCH: 600,         // 10 minutes
  LIST: 600,           // 10 minutes
  STATS: 300,          // 5 minutes
} as const

/**
 * Task Cache Manager
 */
export class TaskCacheManager {
  private cache = getMultiLevelCache()
  
  /**
   * Get task details (cached)
   */
  async getTask(taskId: string) {
    const cacheKey = TaskCacheKeys.details(taskId)
    
    // Try cache first
    const cached = await this.cache.get(cacheKey)
    if (cached) return cached
    
    // Fetch from database
    const task = await prisma.task.findUnique({
      where: { id: taskId, deletedAt: null },
      select: {
        id: true,
        projectId: true,
        assigneeId: true,
        createdBy: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        startDate: true,
        completedAt: true,
        estimatedHours: true,
        actualHours: true,
        progress: true,
        tags: true,
        order: true,
        isBlocking: true,
        isMilestone: true,
        createdAt: true,
        updatedAt: true,
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })
    
    if (!task) return null
    
    // Cache and return
    await this.cache.set(cacheKey, task, {
      l1Ttl: TASK_CACHE_TTL.TASK,
      l2Ttl: TASK_CACHE_TTL.TASK,
    })
    
    return task
  }
  
  /**
   * Get task with time entries (cached)
   */
  async getTaskWithTimeEntries(taskId: string) {
    const cacheKey = `${TaskCacheKeys.details(taskId)}:time`
    
    // Try cache
    const cached = await this.cache.get(cacheKey)
    if (cached) return cached
    
    // Fetch from database
    const task = await prisma.task.findUnique({
      where: { id: taskId, deletedAt: null },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        estimatedHours: true,
        actualHours: true,
        assigneeId: true,
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        timeEntries: {
          select: {
            id: true,
            userId: true,
            hours: true,
            date: true,
            description: true,
            billable: true,
            status: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { date: 'desc' },
          take: 50,
        },
      },
    })
    
    if (!task) return null
    
    // Cache and return
    await this.cache.set(cacheKey, task, {
      l1Ttl: 300, // 5 min in L1
      l2Ttl: TASK_CACHE_TTL.TIME_ENTRIES,
    })
    
    return task
  }
  
  /**
   * Get task dependencies (cached)
   */
  async getTaskDependencies(taskId: string) {
    const cacheKey = `${TaskCacheKeys.details(taskId)}:dependencies`
    
    // Try cache
    const cached = await this.cache.get(cacheKey)
    if (cached) return cached
    
    // Fetch dependencies
    const dependencies = await prisma.taskDependency.findMany({
      where: { taskId },
      select: {
        id: true,
        dependsOnTaskId: true,
        dependencyType: true,
        lagDays: true,
        dependsOnTask: {
          select: {
            id: true,
            title: true,
            status: true,
            completedAt: true,
          },
        },
      },
    })
    
    // Cache and return
    await this.cache.set(cacheKey, dependencies, {
      l1Ttl: TASK_CACHE_TTL.DEPENDENCIES,
      l2Ttl: TASK_CACHE_TTL.DEPENDENCIES,
    })
    
    return dependencies
  }
  
  /**
   * Get task activity logs (cached)
   */
  async getTaskActivity(taskId: string, limit: number = 20) {
    const cacheKey = `${TaskCacheKeys.details(taskId)}:activity:${limit}`
    
    // Try cache
    const cached = await this.cache.get(cacheKey)
    if (cached) return cached
    
    // Fetch activity logs
    const activities = await prisma.activityLog.findMany({
      where: {
        entityType: 'TASK',
        entityId: taskId,
      },
      select: {
        id: true,
        userId: true,
        action: true,
        changes: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    
    // Cache and return
    await this.cache.set(cacheKey, activities, {
      l1Ttl: TASK_CACHE_TTL.ACTIVITY,
      l2Ttl: TASK_CACHE_TTL.ACTIVITY,
    })
    
    return activities
  }
  
  /**
   * Get user tasks (cached)
   */
  async getUserTasks(userId: string, status?: string) {
    const cacheKey = status
      ? `task:user:${userId}:${status}`
      : `task:user:${userId}`
    
    // Try cache
    const cached = await this.cache.get(cacheKey)
    if (cached) return cached
    
    // Build where clause
    const where: Record<string, unknown> = {
      assigneeId: userId,
      deletedAt: null,
    }
    
    if (status) {
      where.status = status
    }
    
    // Fetch tasks
    const tasks = await prisma.task.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        estimatedHours: true,
        actualHours: true,
        progress: true,
        isBlocking: true,
        isMilestone: true,
        projectId: true,
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
      ],
      take: 100,
    })
    
    // Cache and return
    await this.cache.set(cacheKey, tasks, {
      l1Ttl: 300, // 5 min in L1
      l2Ttl: TASK_CACHE_TTL.LIST,
    })
    
    return tasks
  }
  
  /**
   * Get project tasks (cached)
   */
  async getProjectTasks(projectId: string, status?: string) {
    const cacheKey = status
      ? TaskCacheKeys.byProject(projectId, status)
      : TaskCacheKeys.byProject(projectId)
    
    // Try cache
    const cached = await this.cache.get(cacheKey)
    if (cached) return cached
    
    // Build where clause
    const where: Record<string, unknown> = {
      projectId,
      deletedAt: null,
    }
    
    if (status) {
      where.status = status
    }
    
    // Fetch tasks
    const tasks = await prisma.task.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        startDate: true,
        estimatedHours: true,
        actualHours: true,
        progress: true,
        isBlocking: true,
        isMilestone: true,
        assigneeId: true,
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: [
        { order: 'asc' },
        { priority: 'desc' },
      ],
      take: 200,
    })
    
    // Cache and return
    await this.cache.set(cacheKey, tasks, {
      l1Ttl: 300, // 5 min in L1
      l2Ttl: TASK_CACHE_TTL.LIST,
    })
    
    return tasks
  }
  
  /**
   * Get overdue tasks (cached)
   */
  async getOverdueTasks(userId?: string, limit: number = 50) {
    const cacheKey = userId
      ? `task:overdue:user:${userId}:${limit}`
      : `task:overdue:all:${limit}`
    
    // Try cache
    const cached = await this.cache.get(cacheKey)
    if (cached) return cached
    
    // Build where clause
    const where: Record<string, unknown> = {
      dueDate: { lt: new Date() },
      status: { notIn: ['DONE', 'CANCELLED'] },
      deletedAt: null,
    }
    
    if (userId) {
      where.assigneeId = userId
    }
    
    // Fetch overdue tasks
    const tasks = await prisma.task.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        projectId: true,
        assigneeId: true,
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
      take: limit,
    })
    
    // Cache and return
    await this.cache.set(cacheKey, tasks, {
      l1Ttl: 60, // 1 min in L1 (time-sensitive)
      l2Ttl: 300, // 5 min in L2
    })
    
    return tasks
  }
  
  /**
   * Search tasks (cached)
   */
  async searchTasks(query: string, limit: number = 20) {
    const cacheKey = TaskCacheKeys.search(query, limit)
    
    // Try cache
    const cached = await this.cache.get(cacheKey)
    if (cached) return cached
    
    // Search tasks
    const tasks = await prisma.task.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        projectId: true,
        assigneeId: true,
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      take: limit,
      orderBy: { updatedAt: 'desc' },
    })
    
    // Cache and return
    await this.cache.set(cacheKey, tasks, {
      l1Ttl: TASK_CACHE_TTL.SEARCH,
      l2Ttl: TASK_CACHE_TTL.SEARCH,
    })
    
    return tasks
  }
  
  /**
   * Get task statistics for user (cached)
   */
  async getUserTaskStats(userId: string) {
    const cacheKey = `task:stats:user:${userId}`
    
    // Try cache
    const cached = await this.cache.get(cacheKey)
    if (cached) return cached
    
    // Calculate stats
    const [total, todo, inProgress, done, overdue] = await Promise.all([
      prisma.task.count({
        where: { assigneeId: userId, deletedAt: null },
      }),
      prisma.task.count({
        where: { assigneeId: userId, status: 'TODO', deletedAt: null },
      }),
      prisma.task.count({
        where: { assigneeId: userId, status: 'IN_PROGRESS', deletedAt: null },
      }),
      prisma.task.count({
        where: { assigneeId: userId, status: 'DONE', deletedAt: null },
      }),
      prisma.task.count({
        where: {
          assigneeId: userId,
          dueDate: { lt: new Date() },
          status: { notIn: ['DONE', 'CANCELLED'] },
          deletedAt: null,
        },
      }),
    ])
    
    const stats = {
      userId,
      total,
      todo,
      inProgress,
      done,
      overdue,
      completionRate: total > 0 ? (done / total) * 100 : 0,
    }
    
    // Cache and return
    await this.cache.set(cacheKey, stats, {
      l1Ttl: TASK_CACHE_TTL.STATS,
      l2Ttl: TASK_CACHE_TTL.STATS,
    })
    
    return stats
  }
  
  /**
   * Get task statistics for project (cached)
   */
  async getProjectTaskStats(projectId: string) {
    const cacheKey = `task:stats:project:${projectId}`
    
    // Try cache
    const cached = await this.cache.get(cacheKey)
    if (cached) return cached
    
    // Calculate stats
    const [total, todo, inProgress, done, overdue, blocking] = await Promise.all([
      prisma.task.count({
        where: { projectId, deletedAt: null },
      }),
      prisma.task.count({
        where: { projectId, status: 'TODO', deletedAt: null },
      }),
      prisma.task.count({
        where: { projectId, status: 'IN_PROGRESS', deletedAt: null },
      }),
      prisma.task.count({
        where: { projectId, status: 'DONE', deletedAt: null },
      }),
      prisma.task.count({
        where: {
          projectId,
          dueDate: { lt: new Date() },
          status: { notIn: ['DONE', 'CANCELLED'] },
          deletedAt: null,
        },
      }),
      prisma.task.count({
        where: { projectId, isBlocking: true, deletedAt: null },
      }),
    ])
    
    const stats = {
      projectId,
      total,
      todo,
      inProgress,
      done,
      overdue,
      blocking,
      completionRate: total > 0 ? (done / total) * 100 : 0,
    }
    
    // Cache and return
    await this.cache.set(cacheKey, stats, {
      l1Ttl: TASK_CACHE_TTL.STATS,
      l2Ttl: TASK_CACHE_TTL.STATS,
    })
    
    return stats
  }
  
  /**
   * Invalidate all task caches
   */
  async invalidateTaskCache(taskId: string) {
    try {
      await this.cache.invalidatePattern(TaskCacheKeys.allForTask(taskId))
      console.log(`[TaskCache] Invalidated cache for task: ${taskId}`)
    } catch (error) {
      console.error('[TaskCache] Error invalidating cache:', error)
    }
  }
  
  /**
   * Invalidate specific task
   */
  async invalidateTask(taskId: string) {
    try {
      await this.cache.delete(TaskCacheKeys.details(taskId))
      console.log(`[TaskCache] Invalidated task: ${taskId}`)
    } catch (error) {
      console.error('[TaskCache] Error:', error)
    }
  }
  
  /**
   * Invalidate user tasks
   */
  async invalidateUserTasks(userId: string) {
    try {
      await this.cache.invalidatePattern(`task:user:${userId}*`)
      await this.cache.invalidatePattern(`task:stats:user:${userId}`)
      await this.cache.invalidatePattern(`task:overdue:user:${userId}*`)
      console.log(`[TaskCache] Invalidated user tasks: ${userId}`)
    } catch (error) {
      console.error('[TaskCache] Error:', error)
    }
  }
  
  /**
   * Invalidate project tasks
   */
  async invalidateProjectTasks(projectId: string) {
    try {
      await this.cache.invalidatePattern(TaskCacheKeys.byProject(projectId))
      await this.cache.invalidatePattern(`task:stats:project:${projectId}`)
      console.log(`[TaskCache] Invalidated project tasks: ${projectId}`)
    } catch (error) {
      console.error('[TaskCache] Error:', error)
    }
  }
  
  /**
   * Invalidate task time entries
   */
  async invalidateTaskTimeEntries(taskId: string) {
    try {
      await this.cache.delete(`${TaskCacheKeys.details(taskId)}:time`)
      console.log(`[TaskCache] Invalidated time entries for: ${taskId}`)
    } catch (error) {
      console.error('[TaskCache] Error:', error)
    }
  }
  
  /**
   * Invalidate task activity
   */
  async invalidateTaskActivity(taskId: string) {
    try {
      await this.cache.invalidatePattern(`${TaskCacheKeys.details(taskId)}:activity:*`)
      console.log(`[TaskCache] Invalidated activity for: ${taskId}`)
    } catch (error) {
      console.error('[TaskCache] Error:', error)
    }
  }
  
  /**
   * Warm cache for multiple tasks
   */
  async warmTaskCache(taskIds: string[]) {
    console.log(`[TaskCache] Warming cache for ${taskIds.length} tasks...`)
    
    const promises = taskIds.map(async (taskId) => {
      try {
        await this.getTask(taskId)
      } catch (error) {
        console.error(`[TaskCache] Error warming cache for ${taskId}:`, error)
      }
    })
    
    await Promise.allSettled(promises)
    console.log(`[TaskCache] Cache warming complete`)
  }
  
  /**
   * Get cache statistics
   */
  getStats() {
    return this.cache.getStats()
  }
  
  /**
   * Log cache statistics
   */
  logStats() {
    this.cache.logStats()
  }
}

/**
 * Singleton instance
 */
let instance: TaskCacheManager | null = null

export function getTaskCacheManager(): TaskCacheManager {
  if (!instance) {
    instance = new TaskCacheManager()
  }
  return instance
}

/**
 * Convenience functions
 */
export const getTask = (taskId: string) => 
  getTaskCacheManager().getTask(taskId)

export const getTaskWithTimeEntries = (taskId: string) => 
  getTaskCacheManager().getTaskWithTimeEntries(taskId)

export const getTaskDependencies = (taskId: string) => 
  getTaskCacheManager().getTaskDependencies(taskId)

export const getTaskActivity = (taskId: string, limit?: number) => 
  getTaskCacheManager().getTaskActivity(taskId, limit)

export const getUserTasks = (userId: string, status?: string) => 
  getTaskCacheManager().getUserTasks(userId, status)

export const getProjectTasks = (projectId: string, status?: string) => 
  getTaskCacheManager().getProjectTasks(projectId, status)

export const getOverdueTasks = (userId?: string, limit?: number) => 
  getTaskCacheManager().getOverdueTasks(userId, limit)

export const searchTasks = (query: string, limit?: number) => 
  getTaskCacheManager().searchTasks(query, limit)

export const getUserTaskStats = (userId: string) => 
  getTaskCacheManager().getUserTaskStats(userId)

export const getProjectTaskStats = (projectId: string) => 
  getTaskCacheManager().getProjectTaskStats(projectId)

export const invalidateTaskCache = (taskId: string) => 
  getTaskCacheManager().invalidateTaskCache(taskId)

export const invalidateTask = (taskId: string) => 
  getTaskCacheManager().invalidateTask(taskId)

export const invalidateUserTasks = (userId: string) => 
  getTaskCacheManager().invalidateUserTasks(userId)

export const invalidateProjectTasks = (projectId: string) => 
  getTaskCacheManager().invalidateProjectTasks(projectId)

export const invalidateTaskTimeEntries = (taskId: string) => 
  getTaskCacheManager().invalidateTaskTimeEntries(taskId)

export const invalidateTaskActivity = (taskId: string) => 
  getTaskCacheManager().invalidateTaskActivity(taskId)

export const warmTaskCache = (taskIds: string[]) => 
  getTaskCacheManager().warmTaskCache(taskIds)

export default TaskCacheManager
