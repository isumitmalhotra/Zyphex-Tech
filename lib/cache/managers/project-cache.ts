/**
 * Project Cache Manager - Production Version
 * 
 * Caching strategy for project data with multi-level cache:
 * - Project details (30min TTL)
 * - Project with tasks (15min TTL)
 * - Project team members (30min TTL)
 * - Project statistics (10min TTL)
 * - Project lists and search (10min TTL)
 * - Automatic invalidation
 * 
 * Uses existing Prisma schema with soft delete support
 */

import { getMultiLevelCache } from '../multi-level-cache'
import { ProjectCacheKeys } from '../cache-keys'
import { prisma } from '@/lib/prisma'

/**
 * TTL constants (in seconds)
 */
export const PROJECT_CACHE_TTL = {
  PROJECT: 1800,       // 30 minutes
  WITH_TASKS: 900,     // 15 minutes
  TEAM: 1800,          // 30 minutes
  STATISTICS: 600,     // 10 minutes
  TIMELINE: 900,       // 15 minutes
  SEARCH: 600,         // 10 minutes
  LIST: 600,           // 10 minutes
} as const

/**
 * Project Cache Manager
 */
export class ProjectCacheManager {
  private cache = getMultiLevelCache()
  
  /**
   * Get project details (cached)
   */
  async getProject(projectId: string) {
    const cacheKey = ProjectCacheKeys.details(projectId)
    
    // Try cache first
    const cached = await this.cache.get(cacheKey)
    if (cached) return cached
    
    // Fetch from database
    const project = await prisma.project.findUnique({
      where: { id: projectId, deletedAt: null },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        priority: true,
        methodology: true,
        budget: true,
        budgetUsed: true,
        hourlyRate: true,
        startDate: true,
        endDate: true,
        estimatedHours: true,
        actualHours: true,
        completionRate: true,
        isClientVisible: true,
        riskTolerance: true,
        createdAt: true,
        updatedAt: true,
        clientId: true,
        managerId: true,
        templateId: true,
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    })
    
    if (!project) return null
    
    // Cache and return
    await this.cache.set(cacheKey, project, {
      l1Ttl: PROJECT_CACHE_TTL.PROJECT,
      l2Ttl: PROJECT_CACHE_TTL.PROJECT,
    })
    
    return project
  }
  
  /**
   * Get project with tasks (cached)
   */
  async getProjectWithTasks(projectId: string, limit: number = 50) {
    const cacheKey = `${ProjectCacheKeys.details(projectId)}:tasks:${limit}`
    
    // Try cache
    const cached = await this.cache.get(cacheKey)
    if (cached) return cached
    
    // Fetch from database
    const project = await prisma.project.findUnique({
      where: { id: projectId, deletedAt: null },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        priority: true,
        completionRate: true,
        startDate: true,
        endDate: true,
        tasks: {
          where: { deletedAt: null },
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            priority: true,
            dueDate: true,
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
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
        },
      },
    })
    
    if (!project) return null
    
    // Cache and return (shorter L1 TTL due to larger size)
    await this.cache.set(cacheKey, project, {
      l1Ttl: 300, // 5 min in L1
      l2Ttl: PROJECT_CACHE_TTL.WITH_TASKS,
    })
    
    return project
  }
  
  /**
   * Get project team members (cached)
   */
  async getProjectTeam(projectId: string) {
    const cacheKey = `${ProjectCacheKeys.details(projectId)}:team`
    
    // Try cache
    const cached = await this.cache.get(cacheKey)
    if (cached) return cached
    
    // Fetch team members
    const teamMembers = await prisma.teamMember.findMany({
      where: {
        projectId,
        isActive: true,
      },
      select: {
        id: true,
        role: true,
        hourlyRate: true,
        allocatedHours: true,
        startDate: true,
        endDate: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            image: true,
          },
        },
      },
      orderBy: { startDate: 'desc' },
    })
    
    // Cache and return
    await this.cache.set(cacheKey, teamMembers, {
      l1Ttl: PROJECT_CACHE_TTL.TEAM,
      l2Ttl: PROJECT_CACHE_TTL.TEAM,
    })
    
    return teamMembers
  }
  
  /**
   * Get project statistics (cached)
   */
  async getProjectStats(projectId: string) {
    const cacheKey = `${ProjectCacheKeys.details(projectId)}:stats`
    
    // Try cache
    const cached = await this.cache.get(cacheKey)
    if (cached) return cached
    
    // Fetch project
    const project = await prisma.project.findUnique({
      where: { id: projectId, deletedAt: null },
      select: {
        id: true,
        budget: true,
        budgetUsed: true,
        estimatedHours: true,
        actualHours: true,
        completionRate: true,
      },
    })
    
    if (!project) return null
    
    // Calculate task statistics
    const [totalTasks, completedTasks, inProgressTasks, overdueTasksCount] = await Promise.all([
      prisma.task.count({
        where: { projectId, deletedAt: null },
      }),
      prisma.task.count({
        where: { projectId, status: 'DONE', deletedAt: null },
      }),
      prisma.task.count({
        where: { projectId, status: 'IN_PROGRESS', deletedAt: null },
      }),
      prisma.task.count({
        where: {
          projectId,
          status: { notIn: ['DONE', 'CANCELLED'] },
          dueDate: { lt: new Date() },
          deletedAt: null,
        },
      }),
    ])
    
    // Calculate team size
    const teamSize = await prisma.teamMember.count({
      where: { projectId, isActive: true },
    })
    
    const stats = {
      projectId: project.id,
      budget: {
        total: project.budget,
        used: project.budgetUsed,
        remaining: project.budget - project.budgetUsed,
        percentUsed: (project.budgetUsed / project.budget) * 100,
      },
      hours: {
        estimated: project.estimatedHours || 0,
        actual: project.actualHours || 0,
        remaining: (project.estimatedHours || 0) - (project.actualHours || 0),
        percentUsed: project.estimatedHours 
          ? (project.actualHours || 0) / project.estimatedHours * 100 
          : 0,
      },
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        inProgress: inProgressTasks,
        overdue: overdueTasksCount,
        completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      },
      team: {
        size: teamSize,
      },
      completionRate: project.completionRate,
    }
    
    // Cache and return
    await this.cache.set(cacheKey, stats, {
      l1Ttl: PROJECT_CACHE_TTL.STATISTICS,
      l2Ttl: PROJECT_CACHE_TTL.STATISTICS,
    })
    
    return stats
  }
  
  /**
   * Get project timeline (cached)
   */
  async getProjectTimeline(projectId: string) {
    const cacheKey = `${ProjectCacheKeys.details(projectId)}:timeline`
    
    // Try cache
    const cached = await this.cache.get(cacheKey)
    if (cached) return cached
    
    // Fetch milestones
    const milestones = await prisma.projectMilestone.findMany({
      where: { projectId },
      select: {
        id: true,
        title: true,
        description: true,
        targetDate: true,
        actualDate: true,
        status: true,
        order: true,
        isKey: true,
      },
      orderBy: { order: 'asc' },
    })
    
    // Cache and return
    await this.cache.set(cacheKey, milestones, {
      l1Ttl: PROJECT_CACHE_TTL.TIMELINE,
      l2Ttl: PROJECT_CACHE_TTL.TIMELINE,
    })
    
    return milestones
  }
  
  /**
   * Search projects (cached)
   */
  async searchProjects(query: string, limit: number = 20) {
    const cacheKey = ProjectCacheKeys.search(query, limit)
    
    // Try cache
    const cached = await this.cache.get(cacheKey)
    if (cached) return cached
    
    // Search projects
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        priority: true,
        completionRate: true,
        startDate: true,
        endDate: true,
        clientId: true,
        managerId: true,
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        manager: {
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
    await this.cache.set(cacheKey, projects, {
      l1Ttl: PROJECT_CACHE_TTL.SEARCH,
      l2Ttl: PROJECT_CACHE_TTL.SEARCH,
    })
    
    return projects
  }
  
  /**
   * Get projects by client (cached)
   */
  async getClientProjects(clientId: string, status?: string) {
    const cacheKey = status 
      ? `${ProjectCacheKeys.byClient(clientId)}:${status}`
      : ProjectCacheKeys.byClient(clientId)
    
    // Try cache
    const cached = await this.cache.get(cacheKey)
    if (cached) return cached
    
    // Build where clause
    const where: Record<string, unknown> = {
      clientId,
      deletedAt: null,
    }
    
    if (status) {
      where.status = status
    }
    
    // Fetch projects
    const projects = await prisma.project.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        priority: true,
        completionRate: true,
        budget: true,
        budgetUsed: true,
        startDate: true,
        endDate: true,
        managerId: true,
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })
    
    // Cache and return
    await this.cache.set(cacheKey, projects, {
      l1Ttl: 300, // 5 min in L1
      l2Ttl: PROJECT_CACHE_TTL.LIST,
    })
    
    return projects
  }
  
  /**
   * Get projects by manager (cached)
   */
  async getManagerProjects(managerId: string, status?: string) {
    const cacheKey = status 
      ? `project:manager:${managerId}:${status}`
      : `project:manager:${managerId}`
    
    // Try cache
    const cached = await this.cache.get(cacheKey)
    if (cached) return cached
    
    // Build where clause
    const where: Record<string, unknown> = {
      managerId,
      deletedAt: null,
    }
    
    if (status) {
      where.status = status
    }
    
    // Fetch projects
    const projects = await prisma.project.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        priority: true,
        completionRate: true,
        budget: true,
        budgetUsed: true,
        startDate: true,
        endDate: true,
        clientId: true,
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })
    
    // Cache and return
    await this.cache.set(cacheKey, projects, {
      l1Ttl: 300, // 5 min in L1
      l2Ttl: PROJECT_CACHE_TTL.LIST,
    })
    
    return projects
  }
  
  /**
   * Get active projects (cached)
   */
  async getActiveProjects(limit: number = 50) {
    const cacheKey = `project:active:${limit}`
    
    // Try cache
    const cached = await this.cache.get(cacheKey)
    if (cached) return cached
    
    // Fetch active projects
    const projects = await prisma.project.findMany({
      where: {
        status: { in: ['PLANNING', 'IN_PROGRESS'] },
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        priority: true,
        completionRate: true,
        startDate: true,
        endDate: true,
        clientId: true,
        managerId: true,
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        manager: {
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
    await this.cache.set(cacheKey, projects, {
      l1Ttl: 300, // 5 min in L1
      l2Ttl: PROJECT_CACHE_TTL.LIST,
    })
    
    return projects
  }
  
  /**
   * Invalidate all project caches
   */
  async invalidateProjectCache(projectId: string) {
    try {
      await this.cache.invalidatePattern(ProjectCacheKeys.allForProject(projectId))
      console.log(`[ProjectCache] Invalidated cache for project: ${projectId}`)
    } catch (error) {
      console.error('[ProjectCache] Error invalidating cache:', error)
    }
  }
  
  /**
   * Invalidate specific project
   */
  async invalidateProject(projectId: string) {
    try {
      await this.cache.delete(ProjectCacheKeys.details(projectId))
      console.log(`[ProjectCache] Invalidated project: ${projectId}`)
    } catch (error) {
      console.error('[ProjectCache] Error:', error)
    }
  }
  
  /**
   * Invalidate project tasks
   */
  async invalidateProjectTasks(projectId: string) {
    try {
      await this.cache.invalidatePattern(`${ProjectCacheKeys.details(projectId)}:tasks:*`)
      console.log(`[ProjectCache] Invalidated tasks for: ${projectId}`)
    } catch (error) {
      console.error('[ProjectCache] Error:', error)
    }
  }
  
  /**
   * Invalidate project statistics
   */
  async invalidateProjectStats(projectId: string) {
    try {
      await this.cache.delete(`${ProjectCacheKeys.details(projectId)}:stats`)
      console.log(`[ProjectCache] Invalidated stats for: ${projectId}`)
    } catch (error) {
      console.error('[ProjectCache] Error:', error)
    }
  }
  
  /**
   * Invalidate client projects
   */
  async invalidateClientProjects(clientId: string) {
    try {
      await this.cache.invalidatePattern(ProjectCacheKeys.byClient(clientId))
      console.log(`[ProjectCache] Invalidated client projects: ${clientId}`)
    } catch (error) {
      console.error('[ProjectCache] Error:', error)
    }
  }
  
  /**
   * Invalidate manager projects
   */
  async invalidateManagerProjects(managerId: string) {
    try {
      await this.cache.invalidatePattern(`project:manager:${managerId}*`)
      console.log(`[ProjectCache] Invalidated manager projects: ${managerId}`)
    } catch (error) {
      console.error('[ProjectCache] Error:', error)
    }
  }
  
  /**
   * Warm cache for multiple projects
   */
  async warmProjectCache(projectIds: string[]) {
    console.log(`[ProjectCache] Warming cache for ${projectIds.length} projects...`)
    
    const promises = projectIds.map(async (projectId) => {
      try {
        await this.getProject(projectId)
        await this.getProjectStats(projectId)
        await this.getProjectTeam(projectId)
      } catch (error) {
        console.error(`[ProjectCache] Error warming cache for ${projectId}:`, error)
      }
    })
    
    await Promise.allSettled(promises)
    console.log(`[ProjectCache] Cache warming complete`)
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
let instance: ProjectCacheManager | null = null

export function getProjectCacheManager(): ProjectCacheManager {
  if (!instance) {
    instance = new ProjectCacheManager()
  }
  return instance
}

/**
 * Convenience functions
 */
export const getProject = (projectId: string) => 
  getProjectCacheManager().getProject(projectId)

export const getProjectWithTasks = (projectId: string, limit?: number) => 
  getProjectCacheManager().getProjectWithTasks(projectId, limit)

export const getProjectTeam = (projectId: string) => 
  getProjectCacheManager().getProjectTeam(projectId)

export const getProjectStats = (projectId: string) => 
  getProjectCacheManager().getProjectStats(projectId)

export const getProjectTimeline = (projectId: string) => 
  getProjectCacheManager().getProjectTimeline(projectId)

export const searchProjects = (query: string, limit?: number) => 
  getProjectCacheManager().searchProjects(query, limit)

export const getClientProjects = (clientId: string, status?: string) => 
  getProjectCacheManager().getClientProjects(clientId, status)

export const getManagerProjects = (managerId: string, status?: string) => 
  getProjectCacheManager().getManagerProjects(managerId, status)

export const getActiveProjects = (limit?: number) => 
  getProjectCacheManager().getActiveProjects(limit)

export const invalidateProjectCache = (projectId: string) => 
  getProjectCacheManager().invalidateProjectCache(projectId)

export const invalidateProject = (projectId: string) => 
  getProjectCacheManager().invalidateProject(projectId)

export const invalidateProjectTasks = (projectId: string) => 
  getProjectCacheManager().invalidateProjectTasks(projectId)

export const invalidateProjectStats = (projectId: string) => 
  getProjectCacheManager().invalidateProjectStats(projectId)

export const invalidateClientProjects = (clientId: string) => 
  getProjectCacheManager().invalidateClientProjects(clientId)

export const invalidateManagerProjects = (managerId: string) => 
  getProjectCacheManager().invalidateManagerProjects(managerId)

export const warmProjectCache = (projectIds: string[]) => 
  getProjectCacheManager().warmProjectCache(projectIds)

export default ProjectCacheManager
