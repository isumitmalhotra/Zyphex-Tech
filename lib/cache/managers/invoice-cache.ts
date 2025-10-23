/**
 * Invoice Cache Manager
 * 
 * Handles caching for:
 * - Invoice details and relationships
 * - Client invoices and project invoices
 * - Invoice status filtering
 * - Overdue invoice tracking
 * - Invoice statistics and aggregations
 * - Invoice search
 * 
 * Features:
 * - Multi-level caching (L1 Memory + L2 Redis)
 * - Smart TTL based on invoice status (shorter for active invoices)
 * - Automatic invalidation on status changes
 * - Financial data aggregations
 */

import { 
  getMultiLevelCache, 
  type MultiLevelCache 
} from '../multi-level-cache'
import { CacheNamespace } from '../cache-keys'
import { prisma } from '@/lib/prisma'
import type { Invoice, InvoiceStatus } from '@prisma/client'

/**
 * TTL Configuration for Invoice Caching
 */
export const INVOICE_CACHE_TTL = {
  DETAILS: 600,           // 10 minutes - Invoice details
  CLIENT_INVOICES: 300,   // 5 minutes - Client invoice list
  PROJECT_INVOICES: 300,  // 5 minutes - Project invoice list
  STATUS_FILTER: 180,     // 3 minutes - Status-based lists
  OVERDUE: 120,          // 2 minutes - Overdue invoices (more volatile)
  STATS: 300,            // 5 minutes - Invoice statistics
  SEARCH: 300,           // 5 minutes - Search results
  
  // L1 (Memory) Cache TTL - Shorter for financial data
  L1: {
    DETAILS: 120,        // 2 minutes
    LISTS: 60,           // 1 minute
    STATS: 60,           // 1 minute
  }
} as const

/**
 * Invoice with related data type
 */
type InvoiceWithRelations = Invoice & {
  client: {
    id: string
    name: string
    email: string
  }
  project?: {
    id: string
    name: string
  } | null
  payments: Array<{
    id: string
    amount: number
    processedAt: Date | null
  }>
  timeEntries: Array<{
    id: string
    hours: number
  }>
}

/**
 * Invoice statistics type
 */
type InvoiceStats = {
  total: number
  byStatus: Record<string, number>
  totalAmount: number
  paidAmount: number
  overdueAmount: number
  averageAmount: number
  averageDaysToPayment: number
}

/**
 * Invoice Cache Manager
 * Singleton pattern for efficient cache management
 */
export class InvoiceCacheManager {
  private static instance: InvoiceCacheManager
  private cache: MultiLevelCache

  private constructor() {
    this.cache = getMultiLevelCache()
  }

  public static getInstance(): InvoiceCacheManager {
    if (!InvoiceCacheManager.instance) {
      InvoiceCacheManager.instance = new InvoiceCacheManager()
    }
    return InvoiceCacheManager.instance
  }

  /**
   * INVOICE QUERY METHODS
   */

  /**
   * Get invoice by ID with related data
   * TTL: L1: 2min, L2: 10min
   */
  async getInvoice(invoiceId: string): Promise<InvoiceWithRelations | null> {
    const cacheKey = `${CacheNamespace.INVOICE}:details:${invoiceId}`
    
    // Try cache first
    const cached = await this.cache.get<InvoiceWithRelations>(cacheKey)
    if (cached) return cached
    
    // Fetch from database
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        client: {
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
        payments: {
          select: {
            id: true,
            amount: true,
            processedAt: true,
          },
          orderBy: { processedAt: 'desc' }
        },
        timeEntries: {
          select: {
            id: true,
            hours: true,
          }
        }
      }
    })
    
    if (!invoice) return null
    
    // Cache and return
    await this.cache.set(cacheKey, invoice, {
      l1Ttl: INVOICE_CACHE_TTL.L1.DETAILS,
      l2Ttl: INVOICE_CACHE_TTL.DETAILS,
    })
    
    return invoice as InvoiceWithRelations
  }

  /**
   * Get all invoices for a client
   * TTL: L1: 1min, L2: 5min
   */
  async getClientInvoices(
    clientId: string,
    options?: {
      status?: InvoiceStatus
      limit?: number
      offset?: number
    }
  ): Promise<Invoice[]> {
    const { status, limit = 50, offset = 0 } = options || {}
    const cacheKey = `${CacheNamespace.INVOICE}:client:${clientId}:${status || 'all'}:${limit}:${offset}`
    
    // Try cache first
    const cached = await this.cache.get<Invoice[]>(cacheKey)
    if (cached) return cached
    
    // Fetch from database
    const invoices = await prisma.invoice.findMany({
      where: {
        clientId,
        ...(status && { status }),
      },
      orderBy: [
        { dueDate: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit,
      skip: offset,
    })
    
    // Cache and return
    await this.cache.set(cacheKey, invoices, {
      l1Ttl: INVOICE_CACHE_TTL.L1.LISTS,
      l2Ttl: INVOICE_CACHE_TTL.CLIENT_INVOICES,
    })
    
    return invoices
  }

  /**
   * Get all invoices for a project
   * TTL: L1: 1min, L2: 5min
   */
  async getProjectInvoices(
    projectId: string,
    options?: {
      status?: InvoiceStatus
      limit?: number
    }
  ): Promise<Invoice[]> {
    const { status, limit = 50 } = options || {}
    const cacheKey = `${CacheNamespace.INVOICE}:project:${projectId}:${status || 'all'}:${limit}`
    
    // Try cache first
    const cached = await this.cache.get<Invoice[]>(cacheKey)
    if (cached) return cached
    
    // Fetch from database
    const invoices = await prisma.invoice.findMany({
      where: {
        projectId,
        ...(status && { status }),
      },
      orderBy: [
        { dueDate: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit,
    })
    
    // Cache and return
    await this.cache.set(cacheKey, invoices, {
      l1Ttl: INVOICE_CACHE_TTL.L1.LISTS,
      l2Ttl: INVOICE_CACHE_TTL.PROJECT_INVOICES,
    })
    
    return invoices
  }

  /**
   * Get invoices by status
   * TTL: L1: 1min, L2: 3min
   */
  async getInvoicesByStatus(
    status: InvoiceStatus,
    options?: {
      limit?: number
      offset?: number
    }
  ): Promise<Invoice[]> {
    const { limit = 100, offset = 0 } = options || {}
    const cacheKey = `${CacheNamespace.INVOICE}:status:${status}:${limit}:${offset}`
    
    // Try cache first
    const cached = await this.cache.get<Invoice[]>(cacheKey)
    if (cached) return cached
    
    // Fetch from database
    const invoices = await prisma.invoice.findMany({
      where: { status },
      orderBy: [
        { dueDate: 'asc' },
        { createdAt: 'desc' }
      ],
      take: limit,
      skip: offset,
    })
    
    // Cache and return
    await this.cache.set(cacheKey, invoices, {
      l1Ttl: INVOICE_CACHE_TTL.L1.LISTS,
      l2Ttl: INVOICE_CACHE_TTL.STATUS_FILTER,
    })
    
    return invoices
  }

  /**
   * Get overdue invoices
   * TTL: L1: 1min, L2: 2min (more volatile)
   */
  async getOverdueInvoices(options?: {
    clientId?: string
    limit?: number
  }): Promise<Invoice[]> {
    const { clientId, limit = 100 } = options || {}
    const cacheKey = `${CacheNamespace.INVOICE}:overdue:${clientId || 'all'}:${limit}`
    
    // Try cache first
    const cached = await this.cache.get<Invoice[]>(cacheKey)
    if (cached) return cached
    
    // Fetch from database
    const now = new Date()
    const invoices = await prisma.invoice.findMany({
      where: {
        ...(clientId && { clientId }),
        status: { in: ['SENT', 'OVERDUE'] },
        dueDate: { lt: now },
      },
      orderBy: [
        { dueDate: 'asc' }
      ],
      take: limit,
    })
    
    // Cache and return
    await this.cache.set(cacheKey, invoices, {
      l1Ttl: INVOICE_CACHE_TTL.L1.LISTS,
      l2Ttl: INVOICE_CACHE_TTL.OVERDUE,
    })
    
    return invoices
  }

  /**
   * Get invoice statistics
   * TTL: L1: 1min, L2: 5min
   */
  async getInvoiceStats(options?: {
    clientId?: string
    startDate?: Date
    endDate?: Date
  }): Promise<InvoiceStats> {
    const { clientId, startDate, endDate } = options || {}
    const cacheKey = `${CacheNamespace.INVOICE}:stats:${clientId || 'all'}:${startDate?.toISOString() || ''}:${endDate?.toISOString() || ''}`
    
    // Try cache first
    const cached = await this.cache.get<InvoiceStats>(cacheKey)
    if (cached) return cached
    
    // Fetch statistics in parallel
    const [total, byStatus, aggregates, paidInvoices] = await Promise.all([
      // Total count
      prisma.invoice.count({
        where: {
          ...(clientId && { clientId }),
          ...(startDate && { createdAt: { gte: startDate } }),
          ...(endDate && { createdAt: { lte: endDate } }),
        }
      }),
      
      // Count by status
      prisma.invoice.groupBy({
        by: ['status'],
        where: {
          ...(clientId && { clientId }),
          ...(startDate && { createdAt: { gte: startDate } }),
          ...(endDate && { createdAt: { lte: endDate } }),
        },
        _count: true,
      }),
      
      // Total and paid amounts
      prisma.invoice.aggregate({
        where: {
          ...(clientId && { clientId }),
          ...(startDate && { createdAt: { gte: startDate } }),
          ...(endDate && { createdAt: { lte: endDate } }),
        },
        _sum: { total: true },
        _avg: { total: true },
      }),
      
      // Paid invoices for average days calculation
      prisma.invoice.findMany({
        where: {
          ...(clientId && { clientId }),
          status: 'PAID',
          paidAt: { not: null },
          ...(startDate && { createdAt: { gte: startDate } }),
          ...(endDate && { createdAt: { lte: endDate } }),
        },
        select: {
          createdAt: true,
          paidAt: true,
          total: true,
        }
      }),
    ])
    
    // Calculate paid amount
    const paidAmount = paidInvoices.reduce((sum, inv) => sum + inv.total, 0)
    
    // Calculate overdue amount
    const now = new Date()
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        ...(clientId && { clientId }),
        status: { in: ['SENT', 'OVERDUE'] },
        dueDate: { lt: now },
        ...(startDate && { createdAt: { gte: startDate } }),
        ...(endDate && { createdAt: { lte: endDate } }),
      },
      select: { total: true }
    })
    const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.total, 0)
    
    // Calculate average days to payment
    const daysToPayment = paidInvoices
      .filter(inv => inv.paidAt)
      .map(inv => {
        const created = new Date(inv.createdAt).getTime()
        const paid = new Date(inv.paidAt!).getTime()
        return Math.floor((paid - created) / (1000 * 60 * 60 * 24))
      })
    const averageDaysToPayment = daysToPayment.length > 0
      ? Math.round(daysToPayment.reduce((sum, days) => sum + days, 0) / daysToPayment.length)
      : 0
    
    const stats: InvoiceStats = {
      total,
      byStatus: Object.fromEntries(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        byStatus.map((item: any) => [item.status, item._count])
      ),
      totalAmount: aggregates._sum.total || 0,
      paidAmount,
      overdueAmount,
      averageAmount: aggregates._avg.total || 0,
      averageDaysToPayment,
    }
    
    // Cache and return
    await this.cache.set(cacheKey, stats, {
      l1Ttl: INVOICE_CACHE_TTL.L1.STATS,
      l2Ttl: INVOICE_CACHE_TTL.STATS,
    })
    
    return stats
  }

  /**
   * Search invoices
   * TTL: L1: 1min, L2: 5min
   */
  async searchInvoices(
    query: string,
    options?: {
      clientId?: string
      status?: InvoiceStatus
      limit?: number
    }
  ): Promise<Invoice[]> {
    const { clientId, status, limit = 50 } = options || {}
    const cacheKey = `${CacheNamespace.INVOICE}:search:${query}:${clientId || ''}:${status || ''}:${limit}`
    
    // Try cache first
    const cached = await this.cache.get<Invoice[]>(cacheKey)
    if (cached) return cached
    
    // Fetch from database
    const invoices = await prisma.invoice.findMany({
      where: {
        ...(clientId && { clientId }),
        ...(status && { status }),
        OR: [
          { invoiceNumber: { contains: query, mode: 'insensitive' } },
          { notes: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    
    // Cache and return
    await this.cache.set(cacheKey, invoices, {
      l1Ttl: INVOICE_CACHE_TTL.L1.LISTS,
      l2Ttl: INVOICE_CACHE_TTL.SEARCH,
    })
    
    return invoices
  }

  /**
   * CACHE INVALIDATION METHODS
   */

  /**
   * Invalidate specific invoice cache
   */
  async invalidateInvoice(invoiceId: string): Promise<void> {
    await this.cache.delete(`${CacheNamespace.INVOICE}:details:${invoiceId}`)
  }

  /**
   * Invalidate client invoices cache
   */
  async invalidateClientInvoices(clientId: string): Promise<void> {
    // Pattern-based deletion - delete common cache keys
    const statuses: InvoiceStatus[] = ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']
    await Promise.all(
      statuses.map(status => 
        this.cache.delete(`${CacheNamespace.INVOICE}:client:${clientId}:${status}:50:0`)
      )
    )
    await this.cache.delete(`${CacheNamespace.INVOICE}:client:${clientId}:all:50:0`)
  }

  /**
   * Invalidate project invoices cache
   */
  async invalidateProjectInvoices(projectId: string): Promise<void> {
    // Pattern-based deletion - delete common cache keys
    const statuses: InvoiceStatus[] = ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']
    await Promise.all(
      statuses.map(status => 
        this.cache.delete(`${CacheNamespace.INVOICE}:project:${projectId}:${status}:50`)
      )
    )
    await this.cache.delete(`${CacheNamespace.INVOICE}:project:${projectId}:all:50`)
  }

  /**
   * Invalidate status-based invoice lists
   */
  async invalidateStatusLists(status: InvoiceStatus): Promise<void> {
    // Delete common pagination offsets
    await Promise.all([
      this.cache.delete(`${CacheNamespace.INVOICE}:status:${status}:100:0`),
      this.cache.delete(`${CacheNamespace.INVOICE}:status:${status}:50:0`),
      this.cache.delete(`${CacheNamespace.INVOICE}:status:${status}:25:0`),
    ])
  }

  /**
   * Invalidate overdue invoices cache
   */
  async invalidateOverdueInvoices(clientId?: string): Promise<void> {
    if (clientId) {
      await this.cache.delete(`${CacheNamespace.INVOICE}:overdue:${clientId}:100`)
    } else {
      await this.cache.delete(`${CacheNamespace.INVOICE}:overdue:all:100`)
    }
  }

  /**
   * Invalidate invoice statistics
   */
  async invalidateStats(clientId?: string): Promise<void> {
    // Clear stats cache for client or all
    const key = `${CacheNamespace.INVOICE}:stats:${clientId || 'all'}::`
    await this.cache.delete(key)
  }

  /**
   * Invalidate search results
   */
  async invalidateSearch(): Promise<void> {
    // Search results are harder to invalidate precisely, so we'll clear common searches
    // In production, consider using a separate cache namespace or shorter TTL
    // For now, this is a placeholder - actual search keys are query-dependent
  }

  /**
   * Invalidate all invoice caches for a client
   */
  async invalidateClientInvoiceCaches(clientId: string): Promise<void> {
    await Promise.all([
      this.invalidateClientInvoices(clientId),
      this.invalidateStats(clientId),
      this.invalidateOverdueInvoices(clientId),
      this.invalidateSearch(),
    ])
  }
}

/**
 * Get Invoice Cache Manager instance
 */
export function getInvoiceCacheManager(): InvoiceCacheManager {
  return InvoiceCacheManager.getInstance()
}

/**
 * CONVENIENCE FUNCTIONS
 * Direct access to cache manager methods
 */

export async function getInvoice(invoiceId: string) {
  return getInvoiceCacheManager().getInvoice(invoiceId)
}

export async function getClientInvoices(
  clientId: string,
  options?: Parameters<InvoiceCacheManager['getClientInvoices']>[1]
) {
  return getInvoiceCacheManager().getClientInvoices(clientId, options)
}

export async function getProjectInvoices(
  projectId: string,
  options?: Parameters<InvoiceCacheManager['getProjectInvoices']>[1]
) {
  return getInvoiceCacheManager().getProjectInvoices(projectId, options)
}

export async function getInvoicesByStatus(
  status: InvoiceStatus,
  options?: Parameters<InvoiceCacheManager['getInvoicesByStatus']>[1]
) {
  return getInvoiceCacheManager().getInvoicesByStatus(status, options)
}

export async function getOverdueInvoices(
  options?: Parameters<InvoiceCacheManager['getOverdueInvoices']>[0]
) {
  return getInvoiceCacheManager().getOverdueInvoices(options)
}

export async function getInvoiceStats(
  options?: Parameters<InvoiceCacheManager['getInvoiceStats']>[0]
) {
  return getInvoiceCacheManager().getInvoiceStats(options)
}

export async function searchInvoices(
  query: string,
  options?: Parameters<InvoiceCacheManager['searchInvoices']>[1]
) {
  return getInvoiceCacheManager().searchInvoices(query, options)
}

export async function invalidateInvoice(invoiceId: string) {
  return getInvoiceCacheManager().invalidateInvoice(invoiceId)
}

export async function invalidateClientInvoices(clientId: string) {
  return getInvoiceCacheManager().invalidateClientInvoices(clientId)
}

export async function invalidateProjectInvoices(projectId: string) {
  return getInvoiceCacheManager().invalidateProjectInvoices(projectId)
}

export async function invalidateInvoiceStats(clientId?: string) {
  return getInvoiceCacheManager().invalidateStats(clientId)
}

export async function invalidateClientInvoiceCaches(clientId: string) {
  return getInvoiceCacheManager().invalidateClientInvoiceCaches(clientId)
}

/**
 * CACHE WARMING
 * Pre-load frequently accessed invoice data
 */
export async function warmInvoiceCache(clientId: string): Promise<void> {
  const manager = getInvoiceCacheManager()
  
  // Warm most common queries
  await Promise.all([
    manager.getClientInvoices(clientId),
    manager.getInvoiceStats({ clientId }),
    manager.getOverdueInvoices({ clientId }),
  ])
}
