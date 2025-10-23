/**
 * Dashboard & Analytics Cache Manager
 * 
 * Handles caching for:
 * - User dashboard overview (stats, widgets, activity)
 * - Project analytics (progress, velocity, budget)
 * - User activity logs (recent actions, audit trail)
 * - System-wide statistics (platform metrics)
 * - Client analytics (project stats, billing)
 * - Time-based analytics (daily, weekly, monthly)
 * 
 * Features:
 * - Multi-level caching (L1 Memory + L2 Redis)
 * - Smart TTL based on data volatility (1min to 1hr)
 * - Pre-calculated aggregations
 * - Real-time activity tracking
 * - Pattern-based invalidation
 */

import { 
  getMultiLevelCache, 
  type MultiLevelCache 
} from '../multi-level-cache'
import { CacheNamespace } from '../cache-keys'
import { prisma } from '@/lib/prisma'
import type { 
  Project, 
  Task, 
  ActivityLog
} from '@prisma/client'

/**
 * TTL Configuration for Dashboard & Analytics Caching
 */
export const DASHBOARD_CACHE_TTL = {
  OVERVIEW: 300,          // 5 minutes - Dashboard overview
  STATS: 120,             // 2 minutes - Dashboard statistics
  ACTIVITY: 60,           // 1 minute - Recent activity
  WIDGETS: 600,           // 10 minutes - Dashboard widgets
  ANALYTICS: 1800,        // 30 minutes - Analytics data
  PLATFORM_STATS: 3600,   // 1 hour - Platform-wide stats
  CLIENT_STATS: 1800,     // 30 minutes - Client statistics
  PROJECT_ANALYTICS: 600, // 10 minutes - Project analytics
  TIME_ANALYTICS: 21600,  // 6 hours - Time-based analytics (historical)
  
  // L1 (Memory) Cache TTL - Shorter for real-time data
  L1: {
    OVERVIEW: 60,         // 1 minute
    STATS: 30,            // 30 seconds
    ACTIVITY: 30,         // 30 seconds (highly volatile)
    WIDGETS: 120,         // 2 minutes
  }
} as const

/**
 * Dashboard overview type
 */
type DashboardOverview = {
  user: {
    id: string
    name: string
    email: string
    role: string
  }
  stats: {
    activeProjects: number
    completedProjects: number
    activeTasks: number
    completedTasks: number
    overdueTasks: number
    unreadMessages: number
    unreadNotifications: number
  }
  recentActivity: ActivityLog[]
  activeProjects: Array<Project & { 
    taskCount: number
    completedTaskCount: number
    progress: number
  }>
  activeTasks: Array<Task & {
    project: Pick<Project, 'id' | 'name'>
  }>
}

/**
 * Project analytics type
 */
type ProjectAnalytics = {
  projectId: string
  projectName: string
  overview: {
    status: string
    progress: number
    health: 'on_track' | 'at_risk' | 'delayed'
  }
  budget: {
    allocated: number
    spent: number
    remaining: number
    percentUsed: number
  }
  hours: {
    estimated: number
    actual: number
    remaining: number
    percentUsed: number
  }
  tasks: {
    total: number
    completed: number
    inProgress: number
    overdue: number
    completionRate: number
  }
  team: {
    size: number
    activeMembers: number
  }
  velocity: {
    tasksPerWeek: number
    hoursPerWeek: number
  }
  timeline: {
    startDate: Date | null
    endDate: Date | null
    daysElapsed: number
    daysRemaining: number
    percentComplete: number
  }
}

/**
 * User activity analytics type
 */
type UserActivityAnalytics = {
  userId: string
  period: {
    start: Date
    end: Date
  }
  summary: {
    totalActions: number
    uniqueDays: number
    avgActionsPerDay: number
  }
  byAction: Record<string, number>
  byEntityType: Record<string, number>
  timeline: Array<{
    date: string
    count: number
  }>
  recentActivities: ActivityLog[]
}

/**
 * Platform statistics type
 */
type PlatformStats = {
  users: {
    total: number
    active: number
    byRole: Record<string, number>
  }
  projects: {
    total: number
    active: number
    completed: number
    byStatus: Record<string, number>
  }
  tasks: {
    total: number
    completed: number
    overdue: number
    byStatus: Record<string, number>
  }
  clients: {
    total: number
    active: number
  }
  invoices: {
    total: number
    paid: number
    pending: number
    overdue: number
    totalAmount: number
    paidAmount: number
  }
  timeTracking: {
    totalHours: number
    billableHours: number
    averageHoursPerUser: number
  }
}

/**
 * Client analytics type
 */
type ClientAnalytics = {
  clientId: string
  clientName: string
  projects: {
    total: number
    active: number
    completed: number
  }
  financials: {
    totalBilled: number
    totalPaid: number
    outstanding: number
    overdueAmount: number
  }
  hours: {
    total: number
    billable: number
  }
  recentProjects: Array<Pick<Project, 'id' | 'name' | 'status' | 'startDate' | 'endDate'>>
}

/**
 * Dashboard Cache Manager
 * Singleton for managing dashboard and analytics caching
 */
export class DashboardCacheManager {
  private static instance: DashboardCacheManager | null = null
  private cache: MultiLevelCache

  private constructor() {
    this.cache = getMultiLevelCache()
  }

  /**
   * Get singleton instance
   */
  static getInstance(): DashboardCacheManager {
    if (!DashboardCacheManager.instance) {
      DashboardCacheManager.instance = new DashboardCacheManager()
    }
    return DashboardCacheManager.instance
  }

  /**
   * DASHBOARD CACHING METHODS
   */

  /**
   * Get complete dashboard overview for user
   * TTL: L1: 1min, L2: 5min
   */
  async getDashboardOverview(userId: string): Promise<DashboardOverview> {
    const cacheKey = `${CacheNamespace.DASHBOARD}:overview:${userId}`
    
    // Try cache first
    const cached = await this.cache.get<DashboardOverview>(cacheKey)
    if (cached) return cached
    
    // Fetch all dashboard data in parallel
    const [user, stats, recentActivity, activeProjects, activeTasks] = await Promise.all([
      // User info
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        }
      }),
      
      // Dashboard statistics
      this.getUserDashboardStats(userId),
      
      // Recent activity (last 10)
      prisma.activityLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      
      // Active projects with task counts
      prisma.project.findMany({
        where: {
          OR: [
            { managerId: userId },
            { users: { some: { id: userId } } },
          ],
          status: { in: ['PLANNING', 'IN_PROGRESS'] },
          deletedAt: null,
        },
        include: {
          tasks: {
            where: { deletedAt: null },
            select: {
              id: true,
              status: true,
            }
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),
      
      // Active tasks
      prisma.task.findMany({
        where: {
          assigneeId: userId,
          status: { in: ['TODO', 'IN_PROGRESS', 'REVIEW'] },
          deletedAt: null,
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
            }
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      }),
    ])
    
    if (!user) {
      throw new Error('User not found')
    }
    
    // Calculate project progress
    const projectsWithProgress = activeProjects.map(project => {
      const taskCount = project.tasks.length
      const completedTaskCount = project.tasks.filter(t => t.status === 'DONE').length
      const progress = taskCount > 0 ? (completedTaskCount / taskCount) * 100 : 0
      
      return {
        ...project,
        taskCount,
        completedTaskCount,
        progress: Math.round(progress),
      }
    })
    
    const overview: DashboardOverview = {
      user: {
        id: user.id,
        name: user.name || 'Unknown',
        email: user.email,
        role: user.role,
      },
      stats,
      recentActivity,
      activeProjects: projectsWithProgress,
      activeTasks,
    }
    
    // Cache and return
    await this.cache.set(cacheKey, overview, {
      l1Ttl: DASHBOARD_CACHE_TTL.L1.OVERVIEW,
      l2Ttl: DASHBOARD_CACHE_TTL.OVERVIEW,
    })
    
    return overview
  }

  /**
   * Get user dashboard statistics
   * TTL: L1: 30sec, L2: 2min
   */
  async getUserDashboardStats(userId: string): Promise<DashboardOverview['stats']> {
    const cacheKey = `${CacheNamespace.DASHBOARD}:stats:${userId}`
    
    // Try cache first
    const cached = await this.cache.get<DashboardOverview['stats']>(cacheKey)
    if (cached) return cached
    
    // Fetch statistics in parallel
    const [
      activeProjects,
      completedProjects,
      activeTasks,
      completedTasks,
      overdueTasks,
      unreadMessages,
      unreadNotifications,
    ] = await Promise.all([
      // Active projects
      prisma.project.count({
        where: {
          OR: [
            { managerId: userId },
            { users: { some: { id: userId } } },
          ],
          status: { in: ['PLANNING', 'IN_PROGRESS'] },
          deletedAt: null,
        }
      }),
      // Completed projects
      prisma.project.count({
        where: {
          OR: [
            { managerId: userId },
            { users: { some: { id: userId } } },
          ],
          status: 'COMPLETED',
          deletedAt: null,
        }
      }),
      // Active tasks
      prisma.task.count({
        where: {
          assigneeId: userId,
          status: { in: ['TODO', 'IN_PROGRESS', 'REVIEW'] },
          deletedAt: null,
        }
      }),
      // Completed tasks
      prisma.task.count({
        where: {
          assigneeId: userId,
          status: 'DONE',
          deletedAt: null,
        }
      }),
      // Overdue tasks
      prisma.task.count({
        where: {
          assigneeId: userId,
          dueDate: { lt: new Date() },
          status: { not: 'DONE' },
          deletedAt: null,
        }
      }),
      // Unread messages
      prisma.message.count({
        where: {
          receiverId: userId,
          readAt: null,
          senderId: { not: userId },
        }
      }),
      // Unread notifications
      prisma.notification.count({
        where: {
          userId,
          read: false,
        }
      }),
    ])
    
    const stats = {
      activeProjects,
      completedProjects,
      activeTasks,
      completedTasks,
      overdueTasks,
      unreadMessages,
      unreadNotifications,
    }
    
    // Cache and return
    await this.cache.set(cacheKey, stats, {
      l1Ttl: DASHBOARD_CACHE_TTL.L1.STATS,
      l2Ttl: DASHBOARD_CACHE_TTL.STATS,
    })
    
    return stats
  }

  /**
   * Get user recent activity
   * TTL: L1: 30sec, L2: 1min
   */
  async getUserRecentActivity(userId: string, limit: number = 20): Promise<ActivityLog[]> {
    const cacheKey = `${CacheNamespace.DASHBOARD}:activity:${userId}:${limit}`
    
    // Try cache first
    const cached = await this.cache.get<ActivityLog[]>(cacheKey)
    if (cached) return cached
    
    // Fetch from database
    const activities = await prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    
    // Cache and return
    await this.cache.set(cacheKey, activities, {
      l1Ttl: DASHBOARD_CACHE_TTL.L1.ACTIVITY,
      l2Ttl: DASHBOARD_CACHE_TTL.ACTIVITY,
    })
    
    return activities
  }

  /**
   * PROJECT ANALYTICS METHODS
   */

  /**
   * Get project analytics
   * TTL: L1: 2min, L2: 10min
   */
  async getProjectAnalytics(projectId: string): Promise<ProjectAnalytics> {
    const cacheKey = `${CacheNamespace.STATS}:project:analytics:${projectId}`
    
    // Try cache first
    const cached = await this.cache.get<ProjectAnalytics>(cacheKey)
    if (cached) return cached
    
    // Fetch project with all related data
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: {
          where: { deletedAt: null },
          select: {
            id: true,
            status: true,
            estimatedHours: true,
            actualHours: true,
            dueDate: true,
          }
        },
        teams: {
          select: {
            id: true,
            teamMembers: {
              select: { id: true }
            }
          }
        },
        timeEntries: {
          select: {
            hours: true,
            billable: true,
          }
        }
      }
    })
    
    if (!project) {
      throw new Error('Project not found')
    }
    
    // Calculate task statistics
    const totalTasks = project.tasks.length
    const completedTasks = project.tasks.filter(t => t.status === 'DONE').length
    const inProgressTasks = project.tasks.filter(t => t.status === 'IN_PROGRESS').length
    const overdueTasks = project.tasks.filter(t => 
      t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE'
    ).length
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
    
    // Calculate hours
    const estimatedHours = project.tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0)
    const actualHours = project.tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0)
    const remainingHours = Math.max(0, estimatedHours - actualHours)
    const hoursPercentUsed = estimatedHours > 0 ? (actualHours / estimatedHours) * 100 : 0
    
    // Calculate budget
    const budgetSpent = project.timeEntries.reduce((sum, te) => {
      // Simplified calculation - in production, use hourly rates
      return sum + (te.hours * 100) // Assuming $100/hour
    }, 0)
    const budgetRemaining = Math.max(0, (project.budget || 0) - budgetSpent)
    const budgetPercentUsed = project.budget ? (budgetSpent / project.budget) * 100 : 0
    
    // Calculate timeline
    const now = new Date()
    const startDate = project.startDate ? new Date(project.startDate) : null
    const endDate = project.endDate ? new Date(project.endDate) : null
    const daysElapsed = startDate ? Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) : 0
    const daysRemaining = endDate ? Math.floor((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0
    const totalDays = startDate && endDate ? Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) : 0
    const percentComplete = totalDays > 0 ? (daysElapsed / totalDays) * 100 : 0
    
    // Determine project health
    let health: 'on_track' | 'at_risk' | 'delayed' = 'on_track'
    if (overdueTasks > 0 || budgetPercentUsed > 90 || hoursPercentUsed > 90) {
      health = 'at_risk'
    }
    if (overdueTasks > totalTasks * 0.2 || daysRemaining < 0) {
      health = 'delayed'
    }
    
    // Calculate velocity (last 4 weeks)
    const fourWeeksAgo = new Date()
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)
    
    const recentCompletedTasks = await prisma.task.count({
      where: {
        projectId,
        status: 'DONE',
        completedAt: { gte: fourWeeksAgo },
        deletedAt: null,
      }
    })
    
    const recentHours = await prisma.timeEntry.aggregate({
      where: {
        task: { projectId },
        createdAt: { gte: fourWeeksAgo },
      },
      _sum: { hours: true }
    })
    
    const analytics: ProjectAnalytics = {
      projectId: project.id,
      projectName: project.name,
      overview: {
        status: project.status,
        progress: Math.round(completionRate),
        health,
      },
      budget: {
        allocated: project.budget || 0,
        spent: budgetSpent,
        remaining: budgetRemaining,
        percentUsed: Math.round(budgetPercentUsed),
      },
      hours: {
        estimated: estimatedHours,
        actual: actualHours,
        remaining: remainingHours,
        percentUsed: Math.round(hoursPercentUsed),
      },
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        inProgress: inProgressTasks,
        overdue: overdueTasks,
        completionRate: Math.round(completionRate),
      },
      team: {
        size: project.teams.reduce((sum, team) => sum + team.teamMembers.length, 0),
        activeMembers: project.teams.reduce((sum, team) => sum + team.teamMembers.length, 0),
      },
      velocity: {
        tasksPerWeek: Math.round(recentCompletedTasks / 4),
        hoursPerWeek: Math.round((recentHours._sum.hours || 0) / 4),
      },
      timeline: {
        startDate,
        endDate,
        daysElapsed,
        daysRemaining,
        percentComplete: Math.round(percentComplete),
      }
    }
    
    // Cache and return
    await this.cache.set(cacheKey, analytics, {
      l1Ttl: DASHBOARD_CACHE_TTL.L1.WIDGETS,
      l2Ttl: DASHBOARD_CACHE_TTL.PROJECT_ANALYTICS,
    })
    
    return analytics
  }

  /**
   * USER ACTIVITY ANALYTICS METHODS
   */

  /**
   * Get user activity analytics for a time period
   * TTL: L1: 2min, L2: 30min
   */
  async getUserActivityAnalytics(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<UserActivityAnalytics> {
    const startStr = startDate.toISOString().split('T')[0]
    const endStr = endDate.toISOString().split('T')[0]
    const cacheKey = `${CacheNamespace.STATS}:user:activity:${userId}:${startStr}:${endStr}`
    
    // Try cache first
    const cached = await this.cache.get<UserActivityAnalytics>(cacheKey)
    if (cached) return cached
    
    // Fetch activities
    const activities = await prisma.activityLog.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        }
      },
      orderBy: { createdAt: 'desc' },
    })
    
    // Calculate statistics
    const totalActions = activities.length
    const uniqueDays = new Set(
      activities.map(a => a.createdAt.toISOString().split('T')[0])
    ).size
    const avgActionsPerDay = uniqueDays > 0 ? totalActions / uniqueDays : 0
    
    // Group by action
    const byAction: Record<string, number> = {}
    activities.forEach(a => {
      byAction[a.action] = (byAction[a.action] || 0) + 1
    })
    
    // Group by entity type
    const byEntityType: Record<string, number> = {}
    activities.forEach(a => {
      byEntityType[a.entityType] = (byEntityType[a.entityType] || 0) + 1
    })
    
    // Create timeline
    const dailyCounts: Record<string, number> = {}
    activities.forEach(a => {
      const date = a.createdAt.toISOString().split('T')[0]
      dailyCounts[date] = (dailyCounts[date] || 0) + 1
    })
    
    const timeline = Object.entries(dailyCounts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }))
    
    const analytics: UserActivityAnalytics = {
      userId,
      period: {
        start: startDate,
        end: endDate,
      },
      summary: {
        totalActions,
        uniqueDays,
        avgActionsPerDay: Math.round(avgActionsPerDay * 10) / 10,
      },
      byAction,
      byEntityType,
      timeline,
      recentActivities: activities.slice(0, 20),
    }
    
    // Cache and return
    await this.cache.set(cacheKey, analytics, {
      l1Ttl: DASHBOARD_CACHE_TTL.L1.WIDGETS,
      l2Ttl: DASHBOARD_CACHE_TTL.ANALYTICS,
    })
    
    return analytics
  }

  /**
   * PLATFORM STATISTICS METHODS
   */

  /**
   * Get platform-wide statistics
   * TTL: L1: 5min, L2: 1hr
   */
  async getPlatformStats(): Promise<PlatformStats> {
    const cacheKey = `${CacheNamespace.STATS}:platform:overview`
    
    // Try cache first
    const cached = await this.cache.get<PlatformStats>(cacheKey)
    if (cached) return cached
    
    // Fetch all platform statistics in parallel
    const [
      totalUsers,
      activeUsers,
      usersByRole,
      totalProjects,
      activeProjects,
      completedProjects,
      projectsByStatus,
      totalTasks,
      completedTasks,
      overdueTasks,
      tasksByStatus,
      totalClients,
      activeClients,
      invoiceStats,
      timeEntriesResult,
    ] = await Promise.all([
      // Users
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.groupBy({
        by: ['role'],
        where: { deletedAt: null },
        _count: true,
      }),
      
      // Projects
      prisma.project.count({ where: { deletedAt: null } }),
      prisma.project.count({ 
        where: { 
          status: { in: ['PLANNING', 'IN_PROGRESS'] },
          deletedAt: null 
        } 
      }),
      prisma.project.count({ 
        where: { 
          status: 'COMPLETED',
          deletedAt: null 
        } 
      }),
      prisma.project.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: true,
      }),
      
      // Tasks
      prisma.task.count({ where: { deletedAt: null } }),
      prisma.task.count({ 
        where: { 
          status: 'DONE',
          deletedAt: null 
        } 
      }),
      prisma.task.count({
        where: {
          dueDate: { lt: new Date() },
          status: { not: 'DONE' },
          deletedAt: null,
        }
      }),
      prisma.task.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: true,
      }),
      
      // Clients
      prisma.client.count({ where: { deletedAt: null } }),
      prisma.client.count({ where: { deletedAt: null } }),
      
      // Invoices
      prisma.invoice.aggregate({
        _count: true,
        _sum: { total: true },
      }).then(async (result) => {
        const [paid, sent, overdue, paidAmount] = await Promise.all([
          prisma.invoice.count({ 
            where: { status: 'PAID' } 
          }),
          prisma.invoice.count({ 
            where: { status: 'SENT' } 
          }),
          prisma.invoice.count({
            where: {
              status: { in: ['SENT', 'OVERDUE'] },
              dueDate: { lt: new Date() },
            }
          }),
          prisma.invoice.aggregate({
            where: { status: 'PAID' },
            _sum: { total: true },
          }),
        ])
        
        return {
          total: result._count,
          paid,
          pending: sent,
          overdue,
          totalAmount: result._sum.total || 0,
          paidAmount: paidAmount._sum.total || 0,
        }
      }),
      
      // Time tracking
      prisma.timeEntry.aggregate({
        _sum: { hours: true },
        _count: true,
      }),
    ])
    
    // Calculate time tracking stats (needs totalUsers from above)
    const billableHoursResult = await prisma.timeEntry.aggregate({
      where: { billable: true },
      _sum: { hours: true },
    })
    
    const timeTrackingStats = {
      totalHours: timeEntriesResult._sum.hours || 0,
      billableHours: billableHoursResult._sum.hours || 0,
      averageHoursPerUser: totalUsers > 0 ? (timeEntriesResult._sum.hours || 0) / totalUsers : 0,
    }
    
    const stats: PlatformStats = {
      users: {
        total: totalUsers,
        active: activeUsers,
        byRole: Object.fromEntries(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          usersByRole.map((item: any) => [item.role, item._count])
        ),
      },
      projects: {
        total: totalProjects,
        active: activeProjects,
        completed: completedProjects,
        byStatus: Object.fromEntries(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          projectsByStatus.map((item: any) => [item.status, item._count])
        ),
      },
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        overdue: overdueTasks,
        byStatus: Object.fromEntries(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tasksByStatus.map((item: any) => [item.status, item._count])
        ),
      },
      clients: {
        total: totalClients,
        active: activeClients,
      },
      invoices: invoiceStats,
      timeTracking: timeTrackingStats,
    }
    
    // Cache and return (longer TTL for platform stats)
    await this.cache.set(cacheKey, stats, {
      l1Ttl: 300, // 5 minutes
      l2Ttl: DASHBOARD_CACHE_TTL.PLATFORM_STATS,
    })
    
    return stats
  }

  /**
   * CLIENT ANALYTICS METHODS
   */

  /**
   * Get client analytics
   * TTL: L1: 2min, L2: 30min
   */
  async getClientAnalytics(clientId: string): Promise<ClientAnalytics> {
    const cacheKey = `${CacheNamespace.STATS}:client:analytics:${clientId}`
    
    // Try cache first
    const cached = await this.cache.get<ClientAnalytics>(cacheKey)
    if (cached) return cached
    
    // Fetch client with related data
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        projects: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            status: true,
            startDate: true,
            endDate: true,
            budget: true,
            timeEntries: {
              select: {
                hours: true,
                billable: true,
              }
            }
          }
        },
        invoices: {
          select: {
            total: true,
            status: true,
            dueDate: true,
          }
        }
      }
    })
    
    if (!client) {
      throw new Error('Client not found')
    }
    
    // Calculate project statistics
    const totalProjects = client.projects.length
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const activeProjects = client.projects.filter((p: any) => 
      p.status === 'IN_PROGRESS' || p.status === 'PLANNING'
    ).length
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const completedProjects = client.projects.filter((p: any) => p.status === 'COMPLETED').length
    
    // Calculate financials
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalBilled = client.invoices.reduce((sum: number, inv: any) => sum + inv.total, 0)
    const totalPaid = client.invoices
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((inv: any) => inv.status === 'PAID')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .reduce((sum: number, inv: any) => sum + inv.total, 0)
    const outstanding = totalBilled - totalPaid
    const overdueAmount = client.invoices
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((inv: any) => 
        (inv.status === 'SENT' || inv.status === 'OVERDUE') &&
        inv.dueDate && new Date(inv.dueDate) < new Date()
      )
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .reduce((sum: number, inv: any) => sum + inv.total, 0)
    
    // Calculate hours
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalHours = client.projects.reduce((sum: number, project: any) => 
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sum + project.timeEntries.reduce((pSum: number, te: any) => pSum + te.hours, 0), 0
    )
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const billableHours = client.projects.reduce((sum: number, project: any) => 
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sum + project.timeEntries.filter((te: any) => te.billable).reduce((pSum: number, te: any) => pSum + te.hours, 0), 0
    )
    
    // Get recent projects
    const recentProjects = client.projects
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .sort((a: any, b: any) => {
        const aDate = a.startDate || new Date(0)
        const bDate = b.startDate || new Date(0)
        return bDate.getTime() - aDate.getTime()
      })
      .slice(0, 5)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((p: any) => ({
        id: p.id,
        name: p.name,
        status: p.status,
        startDate: p.startDate,
        endDate: p.endDate,
      }))
    
    const analytics: ClientAnalytics = {
      clientId: client.id,
      clientName: client.name,
      projects: {
        total: totalProjects,
        active: activeProjects,
        completed: completedProjects,
      },
      financials: {
        totalBilled,
        totalPaid,
        outstanding,
        overdueAmount,
      },
      hours: {
        total: totalHours,
        billable: billableHours,
      },
      recentProjects,
    }
    
    // Cache and return
    await this.cache.set(cacheKey, analytics, {
      l1Ttl: DASHBOARD_CACHE_TTL.L1.WIDGETS,
      l2Ttl: DASHBOARD_CACHE_TTL.CLIENT_STATS,
    })
    
    return analytics
  }

  /**
   * CACHE INVALIDATION METHODS
   */

  /**
   * Invalidate user dashboard caches
   */
  async invalidateUserDashboard(userId: string): Promise<void> {
    await this.cache.invalidatePattern(
      `${CacheNamespace.DASHBOARD}:*:${userId}*`
    )
  }

  /**
   * Invalidate project analytics
   */
  async invalidateProjectAnalytics(projectId: string): Promise<void> {
    await this.cache.delete(
      `${CacheNamespace.STATS}:project:analytics:${projectId}`
    )
  }

  /**
   * Invalidate client analytics
   */
  async invalidateClientAnalytics(clientId: string): Promise<void> {
    await this.cache.delete(
      `${CacheNamespace.STATS}:client:analytics:${clientId}`
    )
  }

  /**
   * Invalidate platform statistics
   */
  async invalidatePlatformStats(): Promise<void> {
    await this.cache.delete(
      `${CacheNamespace.STATS}:platform:overview`
    )
  }

  /**
   * Invalidate user activity analytics
   */
  async invalidateUserActivity(userId: string): Promise<void> {
    await this.cache.invalidatePattern(
      `${CacheNamespace.STATS}:user:activity:${userId}*`
    )
  }

  /**
   * Warm dashboard cache for user
   */
  async warmDashboardCache(userId: string): Promise<void> {
    await Promise.all([
      this.getDashboardOverview(userId),
      this.getUserDashboardStats(userId),
      this.getUserRecentActivity(userId, 20),
    ])
  }
}

/**
 * Get DashboardCacheManager singleton instance
 */
export function getDashboardCacheManager(): DashboardCacheManager {
  return DashboardCacheManager.getInstance()
}

/**
 * Convenience functions for direct access
 */

// Dashboard functions
export const getDashboardOverview = (userId: string) => 
  getDashboardCacheManager().getDashboardOverview(userId)

export const getUserDashboardStats = (userId: string) => 
  getDashboardCacheManager().getUserDashboardStats(userId)

export const getUserRecentActivity = (userId: string, limit?: number) => 
  getDashboardCacheManager().getUserRecentActivity(userId, limit)

// Analytics functions
export const getProjectAnalytics = (projectId: string) => 
  getDashboardCacheManager().getProjectAnalytics(projectId)

export const getUserActivityAnalytics = (userId: string, startDate: Date, endDate: Date) => 
  getDashboardCacheManager().getUserActivityAnalytics(userId, startDate, endDate)

export const getPlatformStats = () => 
  getDashboardCacheManager().getPlatformStats()

export const getClientAnalytics = (clientId: string) => 
  getDashboardCacheManager().getClientAnalytics(clientId)

// Invalidation functions
export const invalidateUserDashboard = (userId: string) => 
  getDashboardCacheManager().invalidateUserDashboard(userId)

export const invalidateProjectAnalytics = (projectId: string) => 
  getDashboardCacheManager().invalidateProjectAnalytics(projectId)

export const invalidateClientAnalytics = (clientId: string) => 
  getDashboardCacheManager().invalidateClientAnalytics(clientId)

export const invalidatePlatformStats = () => 
  getDashboardCacheManager().invalidatePlatformStats()

export const invalidateUserActivity = (userId: string) => 
  getDashboardCacheManager().invalidateUserActivity(userId)

// Cache warming functions
export const warmDashboardCache = (userId: string) => 
  getDashboardCacheManager().warmDashboardCache(userId)
