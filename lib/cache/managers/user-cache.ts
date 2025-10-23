/**
 * User Cache Manager - Simplified Production Version
 * 
 * Caching strategy for user data with multi-level cache:
 * - User profiles (30min TTL)
 * - User permissions (30min TTL)
 * - User projects list (30min TTL)
 * - Automatic invalidation
 * 
 * Uses existing Prisma schema fields (no avatar, no isActive)
 */

import { getMultiLevelCache } from '../multi-level-cache'
import { UserCacheKeys } from '../cache-keys'
import { prisma } from '@/lib/prisma'

/**
 * TTL constants (in seconds)
 */
export const USER_CACHE_TTL = {
  PROFILE: 1800,      // 30 minutes
  PERMISSIONS: 1800,  // 30 minutes
  PROJECTS: 1800,     // 30 minutes
  TASKS: 900,         // 15 minutes
  UNREAD: 60,         // 1 minute
  SEARCH: 600,        // 10 minutes
} as const

/**
 * User Cache Manager
 */
export class UserCacheManager {
  private cache = getMultiLevelCache()
  
  /**
   * Get user profile (cached)
   */
  async getUserProfile(userId: string) {
    const cacheKey = UserCacheKeys.profile(userId)
    
    // Try cache first
    const cached = await this.cache.get(cacheKey)
    if (cached) return cached
    
    // Fetch from database
    const user = await prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        emailVerified: true,
      },
    })
    
    if (!user) return null
    
    // Cache and return
    await this.cache.set(cacheKey, user, {
      l1Ttl: USER_CACHE_TTL.PROFILE,
      l2Ttl: USER_CACHE_TTL.PROFILE,
    })
    
    return user
  }
  
  /**
   * Get user with projects (cached)
   */
  async getUserWithProjects(userId: string) {
    const cacheKey = UserCacheKeys.projects(userId)
    
    // Try cache
    const cached = await this.cache.get(cacheKey)
    if (cached) return cached
    
    // Fetch from database
    const user = await prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        image: true,
        projects: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            status: true,
          },
          orderBy: { updatedAt: 'desc' },
          take: 50,
        },
      },
    })
    
    if (!user) return null
    
    // Cache and return
    await this.cache.set(cacheKey, user, {
      l1Ttl: 180, // 3 min in L1 (shorter due to size)
      l2Ttl: USER_CACHE_TTL.PROJECTS,
    })
    
    return user
  }
  
  /**
   * Get user permissions (cached)
   */
  async getUserPermissions(userId: string) {
    const cacheKey = `${UserCacheKeys.profile(userId)}:permissions`
    
    // Try cache
    const cached = await this.cache.get(cacheKey)
    if (cached) return cached
    
    // Fetch user role
    const user = await prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: { id: true, role: true },
    })
    
    if (!user) return null
    
    // Calculate permissions based on role
    const permissions = this.calculatePermissions(user.role)
    
    const result = {
      userId: user.id,
      role: user.role,
      ...permissions,
    }
    
    // Cache and return
    await this.cache.set(cacheKey, result, {
      l1Ttl: USER_CACHE_TTL.PERMISSIONS,
      l2Ttl: USER_CACHE_TTL.PERMISSIONS,
    })
    
    return result
  }
  
  /**
   * Get user tasks count (cached)
   */
  async getUserTasksCount(userId: string) {
    const cacheKey = `${UserCacheKeys.tasks(userId)}:count`
    
    // Try cache
    const cached = await this.cache.get<number>(cacheKey)
    if (cached !== null) return cached
    
    // Count tasks
    const count = await prisma.task.count({
      where: {
        assigneeId: userId,
        status: {
          in: ['TODO', 'IN_PROGRESS', 'REVIEW'],
        },
        deletedAt: null,
      },
    })
    
    // Cache and return
    await this.cache.set(cacheKey, count, {
      l1Ttl: USER_CACHE_TTL.TASKS,
      l2Ttl: USER_CACHE_TTL.TASKS,
    })
    
    return count
  }
  
  /**
   * Get user unread messages count (cached)
   */
  async getUserUnreadCount(userId: string) {
    const cacheKey = UserCacheKeys.unreadCount(userId)
    
    // Try cache
    const cached = await this.cache.get<number>(cacheKey)
    if (cached !== null) return cached
    
    // Count unread messages
    const count = await prisma.message.count({
      where: {
        receiverId: userId,
        reads: {
          none: {
            userId: userId,
          },
        },
      },
    })
    
    // Cache and return
    await this.cache.set(cacheKey, count, {
      l1Ttl: USER_CACHE_TTL.UNREAD,
      l2Ttl: USER_CACHE_TTL.UNREAD,
    })
    
    return count
  }
  
  /**
   * Search users (cached)
   */
  async searchUsers(query: string, limit: number = 20) {
    const cacheKey = UserCacheKeys.search(query, limit)
    
    // Try cache
    const cached = await this.cache.get(cacheKey)
    if (cached) return cached
    
    // Search users
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        image: true,
      },
      take: limit,
      orderBy: { name: 'asc' },
    })
    
    // Cache and return
    await this.cache.set(cacheKey, users, {
      l1Ttl: USER_CACHE_TTL.SEARCH,
      l2Ttl: USER_CACHE_TTL.SEARCH,
    })
    
    return users
  }
  
  /**
   * Invalidate all user caches
   */
  async invalidateUserCache(userId: string) {
    try {
      await this.cache.invalidatePattern(UserCacheKeys.allForUser(userId))
      console.log(`[UserCache] Invalidated cache for user: ${userId}`)
    } catch (error) {
      console.error('[UserCache] Error invalidating cache:', error)
    }
  }
  
  /**
   * Invalidate specific user profile
   */
  async invalidateUserProfile(userId: string) {
    try {
      await this.cache.delete(UserCacheKeys.profile(userId))
      console.log(`[UserCache] Invalidated profile for: ${userId}`)
    } catch (error) {
      console.error('[UserCache] Error:', error)
    }
  }
  
  /**
   * Invalidate user projects
   */
  async invalidateUserProjects(userId: string) {
    try {
      await this.cache.delete(UserCacheKeys.projects(userId))
      console.log(`[UserCache] Invalidated projects for: ${userId}`)
    } catch (error) {
      console.error('[UserCache] Error:', error)
    }
  }
  
  /**
   * Warm cache for multiple users
   */
  async warmUserCache(userIds: string[]) {
    console.log(`[UserCache] Warming cache for ${userIds.length} users...`)
    
    const promises = userIds.map(async (userId) => {
      try {
        await this.getUserProfile(userId)
        await this.getUserPermissions(userId)
        await this.getUserTasksCount(userId)
      } catch (error) {
        console.error(`[UserCache] Error warming cache for ${userId}:`, error)
      }
    })
    
    await Promise.allSettled(promises)
    console.log(`[UserCache] Cache warming complete`)
  }
  
  /**
   * Calculate permissions based on role
   */
  private calculatePermissions(role: string) {
    switch (role) {
      case 'SUPER_ADMIN':
        return {
          permissions: ['*'],
          canCreateProjects: true,
          canManageUsers: true,
          canAccessAdmin: true,
          canManageSettings: true,
        }
      
      case 'ADMIN':
        return {
          permissions: ['projects:*', 'users:read', 'users:update'],
          canCreateProjects: true,
          canManageUsers: true,
          canAccessAdmin: true,
          canManageSettings: false,
        }
      
      case 'PROJECT_MANAGER':
        return {
          permissions: ['projects:create', 'projects:read', 'projects:update', 'tasks:*'],
          canCreateProjects: true,
          canManageUsers: false,
          canAccessAdmin: false,
          canManageSettings: false,
        }
      
      case 'TEAM_MEMBER':
        return {
          permissions: ['projects:read', 'tasks:read', 'tasks:update'],
          canCreateProjects: false,
          canManageUsers: false,
          canAccessAdmin: false,
          canManageSettings: false,
        }
      
      case 'CLIENT':
        return {
          permissions: ['projects:read', 'invoices:read'],
          canCreateProjects: false,
          canManageUsers: false,
          canAccessAdmin: false,
          canManageSettings: false,
        }
      
      default:
        return {
          permissions: [],
          canCreateProjects: false,
          canManageUsers: false,
          canAccessAdmin: false,
          canManageSettings: false,
        }
    }
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
let instance: UserCacheManager | null = null

export function getUserCacheManager(): UserCacheManager {
  if (!instance) {
    instance = new UserCacheManager()
  }
  return instance
}

/**
 * Convenience functions
 */
export const getUserProfile = (userId: string) => 
  getUserCacheManager().getUserProfile(userId)

export const getUserWithProjects = (userId: string) => 
  getUserCacheManager().getUserWithProjects(userId)

export const getUserPermissions = (userId: string) => 
  getUserCacheManager().getUserPermissions(userId)

export const getUserTasksCount = (userId: string) => 
  getUserCacheManager().getUserTasksCount(userId)

export const getUserUnreadCount = (userId: string) => 
  getUserCacheManager().getUserUnreadCount(userId)

export const searchUsers = (query: string, limit?: number) => 
  getUserCacheManager().searchUsers(query, limit)

export const invalidateUserCache = (userId: string) => 
  getUserCacheManager().invalidateUserCache(userId)

export const invalidateUserProfile = (userId: string) => 
  getUserCacheManager().invalidateUserProfile(userId)

export const invalidateUserProjects = (userId: string) => 
  getUserCacheManager().invalidateUserProjects(userId)

export const warmUserCache = (userIds: string[]) => 
  getUserCacheManager().warmUserCache(userIds)

export default UserCacheManager
