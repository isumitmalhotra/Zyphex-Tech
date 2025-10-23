/**
 * In-Memory Cache (L1) with LRU Eviction
 * 
 * Production-grade memory cache implementation with:
 * - LRU (Least Recently Used) eviction policy
 * - TTL (Time To Live) support with automatic expiration
 * - Configurable max size (default: 50MB)
 * - Hit/miss rate tracking and metrics
 * - Type-safe operations
 * - Thread-safe design for Node.js
 * 
 * Use Cases:
 * - Ultra-fast access for hot data (<1ms)
 * - Frequently accessed user sessions
 * - Active user profiles (current request)
 * - Hot configuration data
 * 
 * Performance Targets:
 * - Access time: <1ms
 * - Hit rate: >30% (L1 layer)
 * - Memory usage: <50MB (configurable)
 */

/**
 * Cache entry with metadata
 */
interface CacheEntry<T> {
  value: T
  expiresAt: number
  size: number // Size in bytes (approximate)
  accessCount: number
  createdAt: number
  lastAccessedAt: number
}

/**
 * Cache statistics
 */
interface MemoryCacheStats {
  hits: number
  misses: number
  evictions: number
  expirations: number
  sets: number
  deletes: number
  totalOperations: number
  hitRate: number
  currentSize: number
  maxSize: number
  itemCount: number
  averageItemSize: number
  oldestEntry: number | null
  newestEntry: number | null
}

/**
 * Configuration options
 */
interface MemoryCacheOptions {
  maxSize?: number // Max size in bytes (default: 50MB)
  defaultTTL?: number // Default TTL in seconds (default: 300s = 5min)
  cleanupInterval?: number // Cleanup interval in ms (default: 60000ms = 1min)
  enableMetrics?: boolean // Enable hit/miss tracking (default: true)
}

/**
 * In-Memory LRU Cache with TTL support
 */
export class MemoryCache {
  private cache: Map<string, CacheEntry<unknown>>
  private maxSize: number
  private currentSize: number
  private defaultTTL: number
  private cleanupInterval: number
  private enableMetrics: boolean
  private cleanupTimer: NodeJS.Timeout | null
  
  // Statistics
  private stats: MemoryCacheStats
  
  constructor(options: MemoryCacheOptions = {}) {
    this.cache = new Map()
    this.maxSize = options.maxSize || 50 * 1024 * 1024 // 50MB default
    this.currentSize = 0
    this.defaultTTL = options.defaultTTL || 300 // 5 minutes default
    this.cleanupInterval = options.cleanupInterval || 60000 // 1 minute default
    this.enableMetrics = options.enableMetrics !== false
    this.cleanupTimer = null
    
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      expirations: 0,
      sets: 0,
      deletes: 0,
      totalOperations: 0,
      hitRate: 0,
      currentSize: 0,
      maxSize: this.maxSize,
      itemCount: 0,
      averageItemSize: 0,
      oldestEntry: null,
      newestEntry: null,
    }
    
    // Start automatic cleanup
    this.startCleanup()
    
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[MemoryCache] Initialized with maxSize: ${this.formatBytes(this.maxSize)}, TTL: ${this.defaultTTL}s`)
    }
  }
  
  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    this.stats.totalOperations++
    
    const entry = this.cache.get(key) as CacheEntry<T> | undefined
    
    if (!entry) {
      this.stats.misses++
      this.updateHitRate()
      return null
    }
    
    // Check if expired
    if (this.isExpired(entry)) {
      this.delete(key)
      this.stats.misses++
      this.stats.expirations++
      this.updateHitRate()
      return null
    }
    
    // Update access metadata (LRU tracking)
    entry.accessCount++
    entry.lastAccessedAt = Date.now()
    
    // Move to end (most recently used)
    this.cache.delete(key)
    this.cache.set(key, entry)
    
    this.stats.hits++
    this.updateHitRate()
    
    return entry.value
  }
  
  /**
   * Set value in cache with optional TTL
   */
  set<T>(key: string, value: T, ttl?: number): boolean {
    try {
      this.stats.totalOperations++
      this.stats.sets++
      
      // Calculate size
      const size = this.estimateSize(value)
      
      // Check if we need to evict
      const existingEntry = this.cache.get(key)
      const existingSize = existingEntry ? existingEntry.size : 0
      const requiredSpace = size - existingSize
      
      if (requiredSpace > 0 && this.currentSize + requiredSpace > this.maxSize) {
        this.evictLRU(requiredSpace)
      }
      
      // Remove old entry if exists
      if (existingEntry) {
        this.currentSize -= existingEntry.size
      }
      
      // Create new entry
      const now = Date.now()
      const expiresAt = now + ((ttl || this.defaultTTL) * 1000)
      
      const entry: CacheEntry<T> = {
        value,
        expiresAt,
        size,
        accessCount: 0,
        createdAt: now,
        lastAccessedAt: now,
      }
      
      // Add to cache
      this.cache.set(key, entry as CacheEntry<unknown>)
      this.currentSize += size
      
      this.updateStats()
      return true
    } catch (error) {
      console.error('[MemoryCache] Error setting key:', error)
      return false
    }
  }
  
  /**
   * Delete key from cache
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return false
    }
    
    this.cache.delete(key)
    this.currentSize -= entry.size
    this.stats.deletes++
    this.stats.totalOperations++
    this.updateStats()
    
    return true
  }
  
  /**
   * Check if key exists (without updating access time)
   */
  has(key: string): boolean {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return false
    }
    
    if (this.isExpired(entry)) {
      this.delete(key)
      return false
    }
    
    return true
  }
  
  /**
   * Get multiple keys
   */
  mget<T>(keys: string[]): (T | null)[] {
    return keys.map(key => this.get<T>(key))
  }
  
  /**
   * Set multiple key-value pairs
   */
  mset<T>(entries: Array<{ key: string; value: T; ttl?: number }>): boolean {
    let success = true
    
    for (const { key, value, ttl } of entries) {
      if (!this.set(key, value, ttl)) {
        success = false
      }
    }
    
    return success
  }
  
  /**
   * Delete multiple keys
   */
  mdelete(keys: string[]): number {
    let deleted = 0
    
    for (const key of keys) {
      if (this.delete(key)) {
        deleted++
      }
    }
    
    return deleted
  }
  
  /**
   * Clear all entries
   */
  clear(): void {
    this.cache.clear()
    this.currentSize = 0
    this.updateStats()
    
    if (process.env.NODE_ENV !== 'test') {
      console.log('[MemoryCache] Cache cleared')
    }
  }
  
  /**
   * Get all keys (for debugging/testing)
   */
  keys(): string[] {
    return Array.from(this.cache.keys())
  }
  
  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size
  }
  
  /**
   * Get current memory usage
   */
  getMemoryUsage(): number {
    return this.currentSize
  }
  
  /**
   * Get cache statistics
   */
  getStats(): MemoryCacheStats {
    return { ...this.stats }
  }
  
  /**
   * Reset statistics (for testing)
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      expirations: 0,
      sets: 0,
      deletes: 0,
      totalOperations: 0,
      hitRate: 0,
      currentSize: this.currentSize,
      maxSize: this.maxSize,
      itemCount: this.cache.size,
      averageItemSize: this.cache.size > 0 ? this.currentSize / this.cache.size : 0,
      oldestEntry: this.getOldestEntry(),
      newestEntry: this.getNewestEntry(),
    }
  }
  
  /**
   * Check if entry is expired
   */
  private isExpired(entry: CacheEntry<unknown>): boolean {
    return Date.now() > entry.expiresAt
  }
  
  /**
   * Evict least recently used entries to free space
   */
  private evictLRU(requiredSpace: number): void {
    let freedSpace = 0
    const keysToDelete: string[] = []
    
    // Iterate through cache (oldest first due to Map insertion order)
    for (const [key, entry] of this.cache.entries()) {
      if (freedSpace >= requiredSpace) {
        break
      }
      
      keysToDelete.push(key)
      freedSpace += entry.size
    }
    
    // Delete identified keys
    for (const key of keysToDelete) {
      const entry = this.cache.get(key)
      if (entry) {
        this.cache.delete(key)
        this.currentSize -= entry.size
        this.stats.evictions++
      }
    }
    
    if (process.env.NODE_ENV !== 'test' && keysToDelete.length > 0) {
      console.log(`[MemoryCache] Evicted ${keysToDelete.length} entries, freed ${this.formatBytes(freedSpace)}`)
    }
  }
  
  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        keysToDelete.push(key)
      }
    }
    
    for (const key of keysToDelete) {
      this.delete(key)
      this.stats.expirations++
    }
    
    if (process.env.NODE_ENV !== 'test' && keysToDelete.length > 0) {
      console.log(`[MemoryCache] Cleaned up ${keysToDelete.length} expired entries`)
    }
    
    this.updateStats()
  }
  
  /**
   * Start automatic cleanup timer
   */
  private startCleanup(): void {
    if (this.cleanupTimer) {
      return
    }
    
    this.cleanupTimer = setInterval(() => {
      this.cleanup()
    }, this.cleanupInterval)
    
    // Prevent timer from keeping process alive
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref()
    }
  }
  
  /**
   * Stop automatic cleanup timer
   */
  stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
  }
  
  /**
   * Estimate size of value in bytes
   */
  private estimateSize(value: unknown): number {
    try {
      const json = JSON.stringify(value)
      // Rough estimate: 2 bytes per character (UTF-16)
      return json.length * 2
    } catch {
      // If can't stringify, return rough estimate
      return 1024 // 1KB default
    }
  }
  
  /**
   * Update hit rate
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0
  }
  
  /**
   * Update statistics
   */
  private updateStats(): void {
    this.stats.currentSize = this.currentSize
    this.stats.itemCount = this.cache.size
    this.stats.averageItemSize = this.cache.size > 0 ? this.currentSize / this.cache.size : 0
    this.stats.oldestEntry = this.getOldestEntry()
    this.stats.newestEntry = this.getNewestEntry()
  }
  
  /**
   * Get timestamp of oldest entry
   */
  private getOldestEntry(): number | null {
    const firstEntry = this.cache.values().next().value as CacheEntry<unknown> | undefined
    return firstEntry ? firstEntry.createdAt : null
  }
  
  /**
   * Get timestamp of newest entry
   */
  private getNewestEntry(): number | null {
    let newest: CacheEntry<unknown> | null = null
    
    for (const entry of this.cache.values()) {
      if (!newest || entry.createdAt > newest.createdAt) {
        newest = entry
      }
    }
    
    return newest ? newest.createdAt : null
  }
  
  /**
   * Format bytes to human-readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }
  
  /**
   * Log cache statistics
   */
  logStats(): void {
    const stats = this.getStats()
    console.log('📊 Memory Cache Statistics:')
    console.log(`   Items: ${stats.itemCount}`)
    console.log(`   Size: ${this.formatBytes(stats.currentSize)} / ${this.formatBytes(stats.maxSize)}`)
    console.log(`   Hit Rate: ${stats.hitRate.toFixed(2)}%`)
    console.log(`   Hits: ${stats.hits}, Misses: ${stats.misses}`)
    console.log(`   Sets: ${stats.sets}, Deletes: ${stats.deletes}`)
    console.log(`   Evictions: ${stats.evictions}, Expirations: ${stats.expirations}`)
    console.log(`   Avg Item Size: ${this.formatBytes(stats.averageItemSize)}`)
  }
  
  /**
   * Destroy cache and cleanup resources
   */
  destroy(): void {
    this.stopCleanup()
    this.clear()
    
    if (process.env.NODE_ENV !== 'test') {
      console.log('[MemoryCache] Cache destroyed')
    }
  }
}

/**
 * Singleton instance for default usage
 */
let defaultInstance: MemoryCache | null = null

/**
 * Get default memory cache instance
 */
export function getMemoryCache(): MemoryCache {
  if (!defaultInstance) {
    defaultInstance = new MemoryCache({
      maxSize: 50 * 1024 * 1024, // 50MB
      defaultTTL: 300, // 5 minutes
      cleanupInterval: 60000, // 1 minute
      enableMetrics: true,
    })
  }
  
  return defaultInstance
}

/**
 * Create a new memory cache instance with custom options
 */
export function createMemoryCache(options: MemoryCacheOptions): MemoryCache {
  return new MemoryCache(options)
}

/**
 * Destroy default instance (for testing)
 */
export function destroyDefaultInstance(): void {
  if (defaultInstance) {
    defaultInstance.destroy()
    defaultInstance = null
  }
}

// Graceful shutdown
if (process.env.NODE_ENV !== 'test') {
  process.on('SIGINT', () => {
    if (defaultInstance) {
      defaultInstance.destroy()
    }
  })
  
  process.on('SIGTERM', () => {
    if (defaultInstance) {
      defaultInstance.destroy()
    }
  })
}

export default MemoryCache
