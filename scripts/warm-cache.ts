/**
 * Cache warming utility
 * 
 * Preloads frequently accessed data into Redis cache
 * Run this script:
 * - After deployment
 * - After cache flush
 * - On application startup (optional)
 * - As a scheduled job (e.g., daily at low-traffic hours)
 */

import { prisma } from '../lib/prisma'
import { cacheService, DEFAULT_TTL } from '../lib/cache/cache-service'
import { UserCacheKeys, ProjectCacheKeys, DashboardCacheKeys } from '../lib/cache/cache-keys'

/**
 * Warm cache for active users
 */
async function warmUserCache(): Promise<number> {
  console.log('[Cache Warm] Starting user cache warming...')
  
  try {
    // Get recently active users (last 7 days)
    const activeUsers = await prisma.user.findMany({
      where: {
        deletedAt: null,
        lastLoginAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
      },
      take: 100, // Limit to top 100 active users
    })
    
    console.log(`[Cache Warm] Found ${activeUsers.length} active users`)
    
    // Cache user profiles
    const cacheEntries = activeUsers.map((user: {id: string}) => ({
      key: UserCacheKeys.profile(user.id),
      value: user,
      ttl: DEFAULT_TTL.LONG, // 1 hour
    }))
    
    await cacheService.mset(cacheEntries)
    
    console.log(`[Cache Warm] ✅ Cached ${activeUsers.length} user profiles`)
    return activeUsers.length
  } catch (error) {
    console.error('[Cache Warm] Error warming user cache:', error)
    return 0
  }
}

/**
 * Warm cache for active projects
 */
async function warmProjectCache(): Promise<number> {
  console.log('[Cache Warm] Starting project cache warming...')
  
  try {
    // Get active projects (not completed/cancelled)
    const activeProjects = await prisma.project.findMany({
      where: {
        deletedAt: null,
        status: {
          notIn: ['COMPLETED', 'CANCELLED'],
        },
      },
      include: {
        client: {
          select: {
            id: true,
            companyName: true,
            contactName: true,
          },
        },
        projectManager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      take: 50, // Limit to top 50 active projects
    })
    
    console.log(`[Cache Warm] Found ${activeProjects.length} active projects`)
    
    // Cache project details
    const cacheEntries = activeProjects.map((project: {id: string}) => ({
      key: ProjectCacheKeys.details(project.id),
      value: project,
      ttl: DEFAULT_TTL.LONG, // 1 hour
    }))
    
    await cacheService.mset(cacheEntries)
    
    console.log(`[Cache Warm] ✅ Cached ${activeProjects.length} projects`)
    return activeProjects.length
  } catch (error) {
    console.error('[Cache Warm] Error warming project cache:', error)
    return 0
  }
}

/**
 * Warm cache for user dashboards
 */
async function warmDashboardCache(): Promise<number> {
  console.log('[Cache Warm] Starting dashboard cache warming...')
  
  try {
    // Get recent active users
    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
        lastLoginAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      select: {
        id: true,
        role: true,
      },
      take: 50, // Top 50 most recent logins
    })
    
    console.log(`[Cache Warm] Found ${users.length} recent users for dashboard`)
    
    let cachedCount = 0
    
    // Cache dashboard data for each user
    for (const user of users) {
      try {
        // Get user's project count
        const projectCount = await prisma.project.count({
          where: {
            deletedAt: null,
            OR: [
              { projectManagerId: user.id },
              { teamMembers: { some: { userId: user.id } } },
            ],
          },
        })
        
        // Get user's pending tasks count
        const pendingTasksCount = await prisma.task.count({
          where: {
            deletedAt: null,
            assigneeId: user.id,
            status: {
              notIn: ['DONE', 'CANCELLED'],
            },
          },
        })
        
        // Get user's overdue tasks count
        const overdueTasksCount = await prisma.task.count({
          where: {
            deletedAt: null,
            assigneeId: user.id,
            status: {
              notIn: ['DONE', 'CANCELLED'],
            },
            dueDate: {
              lt: new Date(),
            },
          },
        })
        
        const dashboardData = {
          userId: user.id,
          projectCount,
          pendingTasksCount,
          overdueTasksCount,
          cachedAt: new Date().toISOString(),
        }
        
        await cacheService.set(
          DashboardCacheKeys.stats(user.id),
          dashboardData,
          DEFAULT_TTL.MEDIUM // 5 minutes
        )
        
        cachedCount++
      } catch (error) {
        console.error(`[Cache Warm] Error caching dashboard for user ${user.id}:`, error)
      }
    }
    
    console.log(`[Cache Warm] ✅ Cached ${cachedCount} dashboard stats`)
    return cachedCount
  } catch (error) {
    console.error('[Cache Warm] Error warming dashboard cache:', error)
    return 0
  }
}

/**
 * Warm frequently accessed statistics
 */
async function warmStatsCache(): Promise<number> {
  console.log('[Cache Warm] Starting stats cache warming...')
  
  try {
    // Platform-wide statistics
    const [
      totalUsers,
      totalProjects,
      activeProjects,
      totalTasks,
      completedTasks,
    ] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.project.count({ where: { deletedAt: null } }),
      prisma.project.count({
        where: {
          deletedAt: null,
          status: { notIn: ['COMPLETED', 'CANCELLED'] },
        },
      }),
      prisma.task.count({ where: { deletedAt: null } }),
      prisma.task.count({
        where: {
          deletedAt: null,
          status: 'DONE',
        },
      }),
    ])
    
    const platformStats = {
      totalUsers,
      totalProjects,
      activeProjects,
      totalTasks,
      completedTasks,
      completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      cachedAt: new Date().toISOString(),
    }
    
    await cacheService.set(
      'stats:platform',
      platformStats,
      DEFAULT_TTL.VERY_LONG // 24 hours
    )
    
    console.log('[Cache Warm] ✅ Cached platform statistics')
    return 1
  } catch (error) {
    console.error('[Cache Warm] Error warming stats cache:', error)
    return 0
  }
}

/**
 * Main cache warming function
 */
async function warmCache(): Promise<void> {
  console.log('🔥 Starting cache warming process...')
  console.log('============================================================\n')
  
  const startTime = Date.now()
  
  try {
    const [userCount, projectCount, dashboardCount, statsCount] = await Promise.all([
      warmUserCache(),
      warmProjectCache(),
      warmDashboardCache(),
      warmStatsCache(),
    ])
    
    const totalCached = userCount + projectCount + dashboardCount + statsCount
    const duration = Date.now() - startTime
    
    console.log('\n============================================================')
    console.log('📊 Cache Warming Summary:')
    console.log(`   Users cached: ${userCount}`)
    console.log(`   Projects cached: ${projectCount}`)
    console.log(`   Dashboards cached: ${dashboardCount}`)
    console.log(`   Stats cached: ${statsCount}`)
    console.log(`   Total entries: ${totalCached}`)
    console.log(`   Duration: ${duration}ms`)
    console.log('============================================================\n')
    
    console.log('✅ Cache warming completed successfully')
  } catch (error) {
    console.error('❌ Cache warming failed:', error)
    throw error
  }
}

/**
 * Run cache warming if called directly
 */
if (require.main === module) {
  warmCache()
    .then(() => {
      console.log('Exiting...')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Fatal error:', error)
      process.exit(1)
    })
}

export { warmCache, warmUserCache, warmProjectCache, warmDashboardCache, warmStatsCache }
