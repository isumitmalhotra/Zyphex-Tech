/**
 * Client Cache Manager
 * 
 * Handles caching for:
 * - Client details and relationships
 * - Client projects and invoices
 * - Client statistics and metrics
 * - Client search and filtering
 * - Active/inactive client lists
 * 
 * Features:
 * - Multi-level caching (L1 Memory + L2 Redis)
 * - Smart TTL based on data volatility
 * - Automatic invalidation on updates
 * - Relationship pre-loading
 */

import { 
  getMultiLevelCache, 
  type MultiLevelCache 
} from '../multi-level-cache'
import { CacheNamespace } from '../cache-keys'
import { prisma } from '@/lib/prisma'
import type { Client } from '@prisma/client'

/**
 * TTL Configuration for Client Caching
 */
export const CLIENT_CACHE_TTL = {
  DETAILS: 900,           // 15 minutes - Client details
  WITH_RELATIONS: 600,    // 10 minutes - Client with projects/invoices
  STATS: 600,             // 10 minutes - Client statistics
  LIST: 300,              // 5 minutes - Client lists
  SEARCH: 300,            // 5 minutes - Search results
  
  // L1 (Memory) Cache TTL
  L1: {
    DETAILS: 180,         // 3 minutes
    LISTS: 60,            // 1 minute
    STATS: 120,           // 2 minutes
  }
} as const

/**
 * Client with projects type
 */
type ClientWithProjects = Client & {
  projects: Array<{
    id: string
    name: string
    status: string
    completionRate: number
  }>
}

/**
 * Client with invoices type
 */
type ClientWithInvoices = Client & {
  invoices: Array<{
    id: string
    invoiceNumber: string
    total: number
    status: string
    dueDate: Date
  }>
}

/**
 * Client statistics type
 */
type ClientStats = {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  totalInvoices: number
  totalBilled: number
  totalPaid: number
  outstanding: number
  overdueAmount: number
}

/**
 * Client Cache Manager
 * Singleton pattern for efficient cache management
 */
export class ClientCacheManager {
  private static instance: ClientCacheManager
  private cache: MultiLevelCache

  private constructor() {
    this.cache = getMultiLevelCache()
  }

  public static getInstance(): ClientCacheManager {
    if (!ClientCacheManager.instance) {
      ClientCacheManager.instance = new ClientCacheManager()
    }
    return ClientCacheManager.instance
  }

  /**
   * CLIENT QUERY METHODS
   */

  /**
   * Get client by ID
   * TTL: L1: 3min, L2: 15min
   */
  async getClient(clientId: string): Promise<Client | null> {
    const cacheKey = `${CacheNamespace.CLIENT}:details:${clientId}`
    
    // Try cache first
    const cached = await this.cache.get<Client>(cacheKey)
    if (cached) return cached
    
    // Fetch from database
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    })
    
    if (!client) return null
    
    // Cache and return
    await this.cache.set(cacheKey, client, {
      l1Ttl: CLIENT_CACHE_TTL.L1.DETAILS,
      l2Ttl: CLIENT_CACHE_TTL.DETAILS,
    })
    
    return client
  }

  /**
   * Get client with projects
   * TTL: L1: 2min, L2: 10min
   */
  async getClientWithProjects(clientId: string): Promise<ClientWithProjects | null> {
    const cacheKey = `${CacheNamespace.CLIENT}:with-projects:${clientId}`
    
    // Try cache first
    const cached = await this.cache.get<ClientWithProjects>(cacheKey)
    if (cached) return cached
    
    // Fetch from database
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        projects: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            status: true,
            completionRate: true,
          },
          orderBy: { updatedAt: 'desc' },
          take: 50,
        }
      }
    })
    
    if (!client) return null
    
    // Cache and return
    await this.cache.set(cacheKey, client, {
      l1Ttl: CLIENT_CACHE_TTL.L1.STATS,
      l2Ttl: CLIENT_CACHE_TTL.WITH_RELATIONS,
    })
    
    return client as ClientWithProjects
  }

  /**
   * Get client with invoices
   * TTL: L1: 2min, L2: 10min
   */
  async getClientWithInvoices(clientId: string): Promise<ClientWithInvoices | null> {
    const cacheKey = `${CacheNamespace.CLIENT}:with-invoices:${clientId}`
    
    // Try cache first
    const cached = await this.cache.get<ClientWithInvoices>(cacheKey)
    if (cached) return cached
    
    // Fetch from database
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            total: true,
            status: true,
            dueDate: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        }
      }
    })
    
    if (!client) return null
    
    // Cache and return
    await this.cache.set(cacheKey, client, {
      l1Ttl: CLIENT_CACHE_TTL.L1.STATS,
      l2Ttl: CLIENT_CACHE_TTL.WITH_RELATIONS,
    })
    
    return client as ClientWithInvoices
  }

  /**
   * Get client statistics
   * TTL: L1: 2min, L2: 10min
   */
  async getClientStats(clientId: string): Promise<ClientStats> {
    const cacheKey = `${CacheNamespace.CLIENT}:stats:${clientId}`
    
    // Try cache first
    const cached = await this.cache.get<ClientStats>(cacheKey)
    if (cached) return cached
    
    // Fetch statistics in parallel
    const [
      totalProjects,
      activeProjects,
      completedProjects,
      totalInvoices,
      invoiceAggregates,
      overdueInvoices,
    ] = await Promise.all([
      // Total projects
      prisma.project.count({
        where: { 
          clientId,
          deletedAt: null 
        }
      }),
      
      // Active projects
      prisma.project.count({
        where: {
          clientId,
          status: { in: ['PLANNING', 'IN_PROGRESS'] },
          deletedAt: null
        }
      }),
      
      // Completed projects
      prisma.project.count({
        where: {
          clientId,
          status: 'COMPLETED',
          deletedAt: null
        }
      }),
      
      // Total invoices
      prisma.invoice.count({
        where: { clientId }
      }),
      
      // Invoice aggregates
      prisma.invoice.aggregate({
        where: { clientId },
        _sum: { total: true }
      }),
      
      // Overdue invoices
      prisma.invoice.findMany({
        where: {
          clientId,
          status: { in: ['SENT', 'OVERDUE'] },
          dueDate: { lt: new Date() }
        },
        select: { total: true }
      }),
    ])
    
    // Calculate paid amount
    const paidInvoices = await prisma.invoice.findMany({
      where: {
        clientId,
        status: 'PAID'
      },
      select: { total: true }
    })
    const totalPaid = paidInvoices.reduce((sum, inv) => sum + inv.total, 0)
    
    const totalBilled = invoiceAggregates._sum.total || 0
    const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.total, 0)
    
    const stats: ClientStats = {
      totalProjects,
      activeProjects,
      completedProjects,
      totalInvoices,
      totalBilled,
      totalPaid,
      outstanding: totalBilled - totalPaid,
      overdueAmount,
    }
    
    // Cache and return
    await this.cache.set(cacheKey, stats, {
      l1Ttl: CLIENT_CACHE_TTL.L1.STATS,
      l2Ttl: CLIENT_CACHE_TTL.STATS,
    })
    
    return stats
  }

  /**
   * Get active clients (not soft-deleted)
   * TTL: L1: 1min, L2: 5min
   */
  async getActiveClients(options?: {
    limit?: number
    offset?: number
  }): Promise<Client[]> {
    const { limit = 100, offset = 0 } = options || {}
    const cacheKey = `${CacheNamespace.CLIENT}:active:${limit}:${offset}`
    
    // Try cache first
    const cached = await this.cache.get<Client[]>(cacheKey)
    if (cached) return cached
    
    // Fetch from database
    const clients = await prisma.client.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
      take: limit,
      skip: offset,
    })
    
    // Cache and return
    await this.cache.set(cacheKey, clients, {
      l1Ttl: CLIENT_CACHE_TTL.L1.LISTS,
      l2Ttl: CLIENT_CACHE_TTL.LIST,
    })
    
    return clients
  }

  /**
   * Search clients by name, email, or company
   * TTL: L1: 1min, L2: 5min
   */
  async searchClients(
    query: string,
    options?: {
      limit?: number
      includeDeleted?: boolean
    }
  ): Promise<Client[]> {
    const { limit = 50, includeDeleted = false } = options || {}
    const cacheKey = `${CacheNamespace.CLIENT}:search:${query}:${limit}:${includeDeleted}`
    
    // Try cache first
    const cached = await this.cache.get<Client[]>(cacheKey)
    if (cached) return cached
    
    // Fetch from database
    const clients = await prisma.client.findMany({
      where: {
        ...(!includeDeleted && { deletedAt: null }),
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { company: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { name: 'asc' },
      take: limit,
    })
    
    // Cache and return
    await this.cache.set(cacheKey, clients, {
      l1Ttl: CLIENT_CACHE_TTL.L1.LISTS,
      l2Ttl: CLIENT_CACHE_TTL.SEARCH,
    })
    
    return clients
  }

  /**
   * Get all clients (with pagination)
   * TTL: L1: 1min, L2: 5min
   */
  async getAllClients(options?: {
    limit?: number
    offset?: number
    includeDeleted?: boolean
  }): Promise<Client[]> {
    const { limit = 100, offset = 0, includeDeleted = false } = options || {}
    const cacheKey = `${CacheNamespace.CLIENT}:all:${limit}:${offset}:${includeDeleted}`
    
    // Try cache first
    const cached = await this.cache.get<Client[]>(cacheKey)
    if (cached) return cached
    
    // Fetch from database
    const clients = await prisma.client.findMany({
      where: includeDeleted ? undefined : { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })
    
    // Cache and return
    await this.cache.set(cacheKey, clients, {
      l1Ttl: CLIENT_CACHE_TTL.L1.LISTS,
      l2Ttl: CLIENT_CACHE_TTL.LIST,
    })
    
    return clients
  }

  /**
   * CACHE INVALIDATION METHODS
   */

  /**
   * Invalidate specific client cache
   */
  async invalidateClient(clientId: string): Promise<void> {
    await Promise.all([
      this.cache.delete(`${CacheNamespace.CLIENT}:details:${clientId}`),
      this.cache.delete(`${CacheNamespace.CLIENT}:with-projects:${clientId}`),
      this.cache.delete(`${CacheNamespace.CLIENT}:with-invoices:${clientId}`),
      this.cache.delete(`${CacheNamespace.CLIENT}:stats:${clientId}`),
    ])
  }

  /**
   * Invalidate client statistics
   */
  async invalidateClientStats(clientId: string): Promise<void> {
    await this.cache.delete(`${CacheNamespace.CLIENT}:stats:${clientId}`)
  }

  /**
   * Invalidate client lists (active, all)
   */
  async invalidateClientLists(): Promise<void> {
    // Clear common list cache keys
    await Promise.all([
      this.cache.delete(`${CacheNamespace.CLIENT}:active:100:0`),
      this.cache.delete(`${CacheNamespace.CLIENT}:active:50:0`),
      this.cache.delete(`${CacheNamespace.CLIENT}:all:100:0:false`),
      this.cache.delete(`${CacheNamespace.CLIENT}:all:50:0:false`),
    ])
  }

  /**
   * Invalidate all client caches
   */
  async invalidateAllClientCaches(clientId: string): Promise<void> {
    await Promise.all([
      this.invalidateClient(clientId),
      this.invalidateClientLists(),
    ])
  }
}

/**
 * Get Client Cache Manager instance
 */
export function getClientCacheManager(): ClientCacheManager {
  return ClientCacheManager.getInstance()
}

/**
 * CONVENIENCE FUNCTIONS
 * Direct access to cache manager methods
 */

export async function getClient(clientId: string) {
  return getClientCacheManager().getClient(clientId)
}

export async function getClientWithProjects(clientId: string) {
  return getClientCacheManager().getClientWithProjects(clientId)
}

export async function getClientWithInvoices(clientId: string) {
  return getClientCacheManager().getClientWithInvoices(clientId)
}

export async function getClientStats(clientId: string) {
  return getClientCacheManager().getClientStats(clientId)
}

export async function getActiveClients(
  options?: Parameters<ClientCacheManager['getActiveClients']>[0]
) {
  return getClientCacheManager().getActiveClients(options)
}

export async function searchClients(
  query: string,
  options?: Parameters<ClientCacheManager['searchClients']>[1]
) {
  return getClientCacheManager().searchClients(query, options)
}

export async function getAllClients(
  options?: Parameters<ClientCacheManager['getAllClients']>[0]
) {
  return getClientCacheManager().getAllClients(options)
}

export async function invalidateClient(clientId: string) {
  return getClientCacheManager().invalidateClient(clientId)
}

export async function invalidateClientStats(clientId: string) {
  return getClientCacheManager().invalidateClientStats(clientId)
}

export async function invalidateClientLists() {
  return getClientCacheManager().invalidateClientLists()
}

export async function invalidateAllClientCaches(clientId: string) {
  return getClientCacheManager().invalidateAllClientCaches(clientId)
}

/**
 * CACHE WARMING
 * Pre-load frequently accessed client data
 */
export async function warmClientCache(clientId: string): Promise<void> {
  const manager = getClientCacheManager()
  
  // Warm most common queries
  await Promise.all([
    manager.getClient(clientId),
    manager.getClientWithProjects(clientId),
    manager.getClientStats(clientId),
  ])
}
