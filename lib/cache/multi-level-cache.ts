/**
 * Multi-Level Cache Manager
 * 
 * Production-grade hierarchical caching with automatic promotion/demotion:
 * - L1: In-memory cache (ultra-fast, <1ms, 50MB max)
 * - L2: Redis cache (fast, <5ms, distributed)
 * - L3: Database (source of truth)
 * 
 * Features:
 * - Automatic cache promotion (hot data moves to L1)
 * - Automatic cache demotion (cold data stays in L2)
 * - Cascading operations (set/delete propagates to all levels)
 * - Intelligent TTL management per level
 * - Graceful degradation (L1 fails → use L2 → use DB)
 * - Comprehensive metrics tracking
 * - Type-safe operations
 * 
 * Cache Strategy:
 * - L1 (Memory): Hot data, short TTL (30s-5min), LRU eviction
 * - L2 (Redis): Warm data, longer TTL (5min-7days), distributed
 * - L3 (Database): Cold data, permanent storage
 * 
 * Performance Targets:
 * - L1 hit rate: >30%
 * - L1+L2 combined hit rate: >80%
 * - L1 access time: <1ms
 * - L2 access time: <5ms
 */

import { MemoryCache, getMemoryCache } from './memory-cache'
import { cacheService } from './cache-service'
import { DEFAULT_TTL } from './cache-service'

/**
 * Cache level enum
 */
export enum CacheLevel {
  L1_MEMORY = 'L1_MEMORY',
  L2_REDIS = 'L2_REDIS',
  L3_DATABASE = 'L3_DATABASE',
}

/**
 * Multi-level cache statistics
 */
interface MultiLevelStats {
  l1Hits: number
  l2Hits: number
  l3Hits: number
  totalMisses: number
  totalOperations: number
  l1HitRate: number
  l2HitRate: number
  combinedHitRate: number
  promotions: number
  demotions: number
  cascadeWrites: number
  cascadeDeletes: number
  errors: number
  averageL1AccessTime: number
  averageL2AccessTime: number
}

/**
 * Cache configuration per level
 */
interface LevelConfig {
  enabled: boolean
  ttl: number
}

/**
 * Multi-level cache options
 */
interface MultiLevelCacheOptions {
  l1?: LevelConfig
  l2?: LevelConfig
  enablePromotion?: boolean // Auto-promote hot data to L1
  promotionThreshold?: number // Access count before promotion
  enableMetrics?: boolean
}

/**
 * Multi-Level Cache Manager
 */
export class MultiLevelCache {
  private l1: MemoryCache
  private l2: typeof cacheService
  private options: Required<MultiLevelCacheOptions>
  private stats: MultiLevelStats
  private accessCounts: Map<string, number> // Track access frequency for promotion
  
  constructor(options: MultiLevelCacheOptions = {}) {
    this.l1 = getMemoryCache()
    this.l2 = cacheService
    
    this.options = {
      l1: {
        enabled: true,
        ttl: 300, // 5 minutes
        ...(options.l1 || {}),
      },
      l2: {
        enabled: true,
        ttl: DEFAULT_TTL.LONG, // 1 hour
        ...(options.l2 || {}),
      },
      enablePromotion: options.enablePromotion !== false,
      promotionThreshold: options.promotionThreshold || 3,
      enableMetrics: options.enableMetrics !== false,
    }
    
    this.accessCounts = new Map()
    
    this.stats = {
      l1Hits: 0,
      l2Hits: 0,
      l3Hits: 0,
      totalMisses: 0,
      totalOperations: 0,
      l1HitRate: 0,
      l2HitRate: 0,
      combinedHitRate: 0,
      promotions: 0,
      demotions: 0,
      cascadeWrites: 0,
      cascadeDeletes: 0,
      errors: 0,
      averageL1AccessTime: 0,
      averageL2AccessTime: 0,
    }
    
    if (process.env.NODE_ENV !== 'test') {
      console.log('[MultiLevelCache] Initialized with L1 + L2 caching')
    }
  }
  
  /**
   * Get value from cache with L1 → L2 → DB fallback
   */
  async get<T>(
    key: string,
    fetchFn?: () => Promise<T>,
    options?: {
      l1Ttl?: number
      l2Ttl?: number
      skipL1?: boolean
      skipL2?: boolean
    }
  ): Promise<T | null> {
    this.stats.totalOperations++
    
    try {
      // Try L1 (Memory) first
      if (this.options.l1.enabled && !options?.skipL1) {
        const l1Start = Date.now()
        const l1Value = this.l1.get<T>(key)
        this.updateL1AccessTime(Date.now() - l1Start)
        
        if (l1Value !== null) {
          this.stats.l1Hits++
          this.updateHitRates()
          this.trackAccess(key)
          return l1Value
        }
      }
      
      // Try L2 (Redis) next
      if (this.options.l2.enabled && !options?.skipL2) {
        const l2Start = Date.now()
        const l2Value = await this.l2.get<T>(key)
        this.updateL2AccessTime(Date.now() - l2Start)
        
        if (l2Value !== null) {
          this.stats.l2Hits++
          this.updateHitRates()
          this.trackAccess(key)
          
          // Promote to L1 if frequently accessed
          if (this.shouldPromote(key)) {
            await this.promoteToL1(key, l2Value, options?.l1Ttl)
          }
          
          return l2Value
        }
      }
      
      // Cache miss - fetch from database if fetchFn provided
      if (fetchFn) {
        const value = await fetchFn()
        
        if (value !== null && value !== undefined) {
          this.stats.l3Hits++
          
          // Store in both L2 and potentially L1
          await this.set(key, value, {
            l1Ttl: options?.l1Ttl,
            l2Ttl: options?.l2Ttl,
          })
          
          return value
        }
      }
      
      // Complete miss
      this.stats.totalMisses++
      this.updateHitRates()
      return null
    } catch (error) {
      console.error('[MultiLevelCache] Error in get:', error)
      this.stats.errors++
      
      // Try to return stale data if available
      if (this.options.l1.enabled) {
        const l1Value = this.l1.get<T>(key)
        if (l1Value !== null) {
          return l1Value
        }
      }
      
      return null
    }
  }
  
  /**
   * Set value in cache with cascade to all levels
   */
  async set<T>(
    key: string,
    value: T,
    options?: {
      l1Ttl?: number
      l2Ttl?: number
      skipL1?: boolean
      skipL2?: boolean
      cascade?: boolean
    }
  ): Promise<boolean> {
    const cascade = options?.cascade !== false
    let success = true
    
    try {
      // Set in L2 (Redis) first for persistence
      if (this.options.l2.enabled && !options?.skipL2) {
        const l2Ttl = options?.l2Ttl || this.options.l2.ttl
        const l2Success = await this.l2.set(key, value, l2Ttl)
        
        if (!l2Success) {
          success = false
        }
        
        if (cascade) {
          this.stats.cascadeWrites++
        }
      }
      
      // Set in L1 (Memory) if hot data
      if (this.options.l1.enabled && !options?.skipL1) {
        const l1Ttl = options?.l1Ttl || this.options.l1.ttl
        const l1Success = this.l1.set(key, value, l1Ttl)
        
        if (!l1Success) {
          success = false
        }
        
        if (cascade) {
          this.stats.cascadeWrites++
        }
      }
      
      return success
    } catch (error) {
      console.error('[MultiLevelCache] Error in set:', error)
      this.stats.errors++
      return false
    }
  }
  
  /**
   * Delete key from all cache levels
   */
  async delete(key: string, cascade: boolean = true): Promise<boolean> {
    let success = true
    
    try {
      // Delete from L1
      if (this.options.l1.enabled) {
        const l1Success = this.l1.delete(key)
        if (!l1Success) {
          success = false
        }
        
        if (cascade) {
          this.stats.cascadeDeletes++
        }
      }
      
      // Delete from L2
      if (this.options.l2.enabled) {
        const l2Success = await this.l2.delete(key)
        if (!l2Success) {
          success = false
        }
        
        if (cascade) {
          this.stats.cascadeDeletes++
        }
      }
      
      // Remove from access tracking
      this.accessCounts.delete(key)
      
      return success
    } catch (error) {
      console.error('[MultiLevelCache] Error in delete:', error)
      this.stats.errors++
      return false
    }
  }
  
  /**
   * Delete multiple keys from all levels
   */
  async mdelete(keys: string[], cascade: boolean = true): Promise<number> {
    let deleted = 0
    
    for (const key of keys) {
      if (await this.delete(key, cascade)) {
        deleted++
      }
    }
    
    return deleted
  }
  
  /**
   * Check if key exists in any cache level
   */
  async has(key: string): Promise<boolean> {
    // Check L1 first
    if (this.options.l1.enabled && this.l1.has(key)) {
      return true
    }
    
    // Check L2
    if (this.options.l2.enabled) {
      return await this.l2.exists(key)
    }
    
    return false
  }
  
  /**
   * Invalidate cache by pattern across all levels
   */
  async invalidatePattern(pattern: string): Promise<number> {
    let invalidated = 0
    
    try {
      // Get keys matching pattern from L2 (Redis supports pattern matching)
      if (this.options.l2.enabled) {
        const keys = await this.l2.scanPattern(pattern)
        invalidated = await this.mdelete(keys, true)
      }
      
      // For L1, we need to check all keys (no pattern matching in memory)
      if (this.options.l1.enabled) {
        const l1Keys = this.l1.keys()
        const matchingKeys = l1Keys.filter(key => this.matchPattern(key, pattern))
        
        for (const key of matchingKeys) {
          this.l1.delete(key)
          invalidated++
        }
      }
      
      return invalidated
    } catch (error) {
      console.error('[MultiLevelCache] Error in invalidatePattern:', error)
      this.stats.errors++
      return invalidated
    }
  }
  
  /**
   * Promote value to L1 (for hot data)
   */
  private async promoteToL1<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const l1Ttl = ttl || this.options.l1.ttl
      this.l1.set(key, value, l1Ttl)
      this.stats.promotions++
      
      if (process.env.NODE_ENV !== 'test') {
        console.log(`[MultiLevelCache] Promoted key to L1: ${key}`)
      }
    } catch (error) {
      console.error('[MultiLevelCache] Error promoting to L1:', error)
      this.stats.errors++
    }
  }
  
  /**
   * Demote value from L1 (keep only in L2)
   */
  demoteFromL1(key: string): void {
    try {
      this.l1.delete(key)
      this.stats.demotions++
      
      if (process.env.NODE_ENV !== 'test') {
        console.log(`[MultiLevelCache] Demoted key from L1: ${key}`)
      }
    } catch (error) {
      console.error('[MultiLevelCache] Error demoting from L1:', error)
      this.stats.errors++
    }
  }
  
  /**
   * Track access frequency for promotion decisions
   */
  private trackAccess(key: string): void {
    if (!this.options.enablePromotion) {
      return
    }
    
    const count = this.accessCounts.get(key) || 0
    this.accessCounts.set(key, count + 1)
  }
  
  /**
   * Check if key should be promoted to L1
   */
  private shouldPromote(key: string): boolean {
    if (!this.options.enablePromotion) {
      return false
    }
    
    const accessCount = this.accessCounts.get(key) || 0
    return accessCount >= this.options.promotionThreshold
  }
  
  /**
   * Match key against pattern (simple glob matching)
   */
  private matchPattern(key: string, pattern: string): boolean {
    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.')
    
    const regex = new RegExp(`^${regexPattern}$`)
    return regex.test(key)
  }
  
  /**
   * Update L1 access time average
   */
  private updateL1AccessTime(duration: number): void {
    if (!this.options.enableMetrics) {
      return
    }
    
    const count = this.stats.l1Hits + 1
    this.stats.averageL1AccessTime = 
      (this.stats.averageL1AccessTime * (count - 1) + duration) / count
  }
  
  /**
   * Update L2 access time average
   */
  private updateL2AccessTime(duration: number): void {
    if (!this.options.enableMetrics) {
      return
    }
    
    const count = this.stats.l2Hits + 1
    this.stats.averageL2AccessTime = 
      (this.stats.averageL2AccessTime * (count - 1) + duration) / count
  }
  
  /**
   * Update hit rates
   */
  private updateHitRates(): void {
    const total = this.stats.totalOperations
    
    if (total === 0) {
      return
    }
    
    this.stats.l1HitRate = (this.stats.l1Hits / total) * 100
    this.stats.l2HitRate = (this.stats.l2Hits / total) * 100
    this.stats.combinedHitRate = 
      ((this.stats.l1Hits + this.stats.l2Hits) / total) * 100
  }
  
  /**
   * Get cache statistics
   */
  getStats(): MultiLevelStats {
    return { ...this.stats }
  }
  
  /**
   * Reset statistics (for testing)
   */
  resetStats(): void {
    this.stats = {
      l1Hits: 0,
      l2Hits: 0,
      l3Hits: 0,
      totalMisses: 0,
      totalOperations: 0,
      l1HitRate: 0,
      l2HitRate: 0,
      combinedHitRate: 0,
      promotions: 0,
      demotions: 0,
      cascadeWrites: 0,
      cascadeDeletes: 0,
      errors: 0,
      averageL1AccessTime: 0,
      averageL2AccessTime: 0,
    }
    
    this.accessCounts.clear()
    this.l1.resetStats()
  }
  
  /**
   * Log cache statistics
   */
  logStats(): void {
    const stats = this.getStats()
    console.log('📊 Multi-Level Cache Statistics:')
    console.log('   Hit Rates:')
    console.log(`     L1: ${stats.l1HitRate.toFixed(2)}% (${stats.l1Hits} hits)`)
    console.log(`     L2: ${stats.l2HitRate.toFixed(2)}% (${stats.l2Hits} hits)`)
    console.log(`     Combined: ${stats.combinedHitRate.toFixed(2)}%`)
    console.log(`     L3 (DB): ${stats.l3Hits} fetches`)
    console.log(`     Misses: ${stats.totalMisses}`)
    console.log('   Performance:')
    console.log(`     L1 Avg Access: ${stats.averageL1AccessTime.toFixed(2)}ms`)
    console.log(`     L2 Avg Access: ${stats.averageL2AccessTime.toFixed(2)}ms`)
    console.log('   Operations:')
    console.log(`     Promotions: ${stats.promotions}`)
    console.log(`     Demotions: ${stats.demotions}`)
    console.log(`     Cascade Writes: ${stats.cascadeWrites}`)
    console.log(`     Cascade Deletes: ${stats.cascadeDeletes}`)
    console.log(`     Errors: ${stats.errors}`)
    console.log(`     Total Operations: ${stats.totalOperations}`)
    
    // Also log L1 details
    console.log('\n📊 L1 (Memory) Cache Details:')
    this.l1.logStats()
  }
  
  /**
   * Clear all cache levels
   */
  async clearAll(): Promise<void> {
    // Clear L1
    if (this.options.l1.enabled) {
      this.l1.clear()
    }
    
    // Clear L2 (only in non-production)
    if (this.options.l2.enabled && process.env.NODE_ENV !== 'production') {
      await this.l2.flush()
    }
    
    // Clear access tracking
    this.accessCounts.clear()
    
    if (process.env.NODE_ENV !== 'test') {
      console.log('[MultiLevelCache] All cache levels cleared')
    }
  }
  
  /**
   * Get L1 (Memory) cache instance
   */
  getL1(): MemoryCache {
    return this.l1
  }
  
  /**
   * Get L2 (Redis) cache instance
   */
  getL2(): typeof cacheService {
    return this.l2
  }
}

/**
 * Singleton instance
 */
let defaultInstance: MultiLevelCache | null = null

/**
 * Get default multi-level cache instance
 */
export function getMultiLevelCache(): MultiLevelCache {
  if (!defaultInstance) {
    defaultInstance = new MultiLevelCache({
      l1: {
        enabled: true,
        ttl: 300, // 5 minutes
      },
      l2: {
        enabled: true,
        ttl: DEFAULT_TTL.LONG, // 1 hour
      },
      enablePromotion: true,
      promotionThreshold: 3,
      enableMetrics: true,
    })
  }
  
  return defaultInstance
}

/**
 * Create a new multi-level cache instance
 */
export function createMultiLevelCache(options: MultiLevelCacheOptions): MultiLevelCache {
  return new MultiLevelCache(options)
}

/**
 * Destroy default instance (for testing)
 */
export function destroyDefaultInstance(): void {
  defaultInstance = null
}

export default MultiLevelCache
