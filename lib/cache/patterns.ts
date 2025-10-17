import { cacheService, DEFAULT_TTL } from './cache-service'

/**
 * Production-grade caching patterns
 * 
 * Implements common caching strategies:
 * 1. Cache-Aside (Lazy Loading) - Most common pattern
 * 2. Write-Through - Update cache when writing to database
 * 3. Write-Behind (Write-Back) - Async write to database
 * 4. Refresh-Ahead - Proactive cache refresh
 * 5. Cache Invalidation - Remove stale data
 */

/**
 * Cache-Aside Pattern (Lazy Loading)
 * 
 * Flow:
 * 1. Try to get data from cache
 * 2. If cache miss, fetch from database
 * 3. Store result in cache
 * 4. Return data
 * 
 * Best for: Read-heavy workloads
 */
export async function cacheAside<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = DEFAULT_TTL.STANDARD
): Promise<T> {
  // Try cache first
  const cached = await cacheService.get<T>(key)
  if (cached !== null) {
    return cached
  }
  
  // Cache miss - fetch from source
  const data = await fetchFn()
  
  // Store in cache for next time
  if (data !== null && data !== undefined) {
    await cacheService.set(key, data, ttl)
  }
  
  return data
}

/**
 * Cache-Aside with Stale-While-Revalidate
 * 
 * Returns stale data immediately while fetching fresh data in background
 * Good for improving perceived performance
 */
export async function cacheAsideStale<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = DEFAULT_TTL.STANDARD,
  staleTtl: number = DEFAULT_TTL.MEDIUM
): Promise<T> {
  const cached = await cacheService.get<T>(key)
  const remainingTtl = await cacheService.ttl(key)
  
  // If cache is fresh, return it
  if (cached !== null && remainingTtl > staleTtl) {
    return cached
  }
  
  // If cache is stale, return it but refresh in background
  if (cached !== null && remainingTtl > 0) {
    // Async refresh (fire and forget)
    fetchFn().then(data => {
      if (data !== null && data !== undefined) {
        cacheService.set(key, data, ttl)
      }
    }).catch(err => {
      console.error('[Cache] Background refresh failed:', err)
    })
    
    return cached
  }
  
  // Cache miss or expired - fetch synchronously
  const data = await fetchFn()
  if (data !== null && data !== undefined) {
    await cacheService.set(key, data, ttl)
  }
  
  return data
}

/**
 * Write-Through Pattern
 * 
 * Flow:
 * 1. Write data to cache
 * 2. Write data to database
 * 3. Return success
 * 
 * Best for: Write-heavy workloads where cache must be consistent
 */
export async function writeThrough<T>(
  key: string,
  data: T,
  writeFn: (data: T) => Promise<void>,
  ttl: number = DEFAULT_TTL.STANDARD
): Promise<void> {
  // Write to cache first (fast)
  await cacheService.set(key, data, ttl)
  
  // Then write to database
  await writeFn(data)
}

/**
 * Write-Behind (Write-Back) Pattern
 * 
 * Flow:
 * 1. Write data to cache immediately
 * 2. Queue database write for later
 * 3. Return success immediately
 * 
 * Best for: High write volume, can tolerate eventual consistency
 */
export async function writeBehind<T>(
  key: string,
  data: T,
  writeFn: (data: T) => Promise<void>,
  ttl: number = DEFAULT_TTL.STANDARD
): Promise<void> {
  // Write to cache immediately
  await cacheService.set(key, data, ttl)
  
  // Queue database write (fire and forget)
  writeFn(data).catch(err => {
    console.error('[Cache] Async database write failed:', err)
    // In production, you might want to:
    // 1. Retry the write
    // 2. Add to a dead letter queue
    // 3. Alert monitoring system
  })
}

/**
 * Refresh-Ahead Pattern
 * 
 * Proactively refresh cache before it expires
 * Best for: Frequently accessed data with expensive computation
 */
export async function refreshAhead<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = DEFAULT_TTL.STANDARD,
  refreshThreshold: number = 0.2 // Refresh when 20% TTL remaining
): Promise<T> {
  const cached = await cacheService.get<T>(key)
  const remainingTtl = await cacheService.ttl(key)
  
  // If cache is fresh and not near expiry, return it
  if (cached !== null && remainingTtl > ttl * refreshThreshold) {
    return cached
  }
  
  // If cache exists but near expiry, refresh it
  if (cached !== null && remainingTtl > 0) {
    // Async refresh
    fetchFn().then(data => {
      if (data !== null && data !== undefined) {
        cacheService.set(key, data, ttl)
      }
    }).catch(err => {
      console.error('[Cache] Proactive refresh failed:', err)
    })
    
    return cached
  }
  
  // Cache miss - fetch and store
  const data = await fetchFn()
  if (data !== null && data !== undefined) {
    await cacheService.set(key, data, ttl)
  }
  
  return data
}

/**
 * Batch Cache-Aside
 * 
 * Efficiently fetch multiple items with cache support
 * Minimizes database queries
 */
export async function batchCacheAside<T>(
  keys: string[],
  fetchFn: (missingKeys: string[]) => Promise<Map<string, T>>,
  ttl: number = DEFAULT_TTL.STANDARD
): Promise<Map<string, T>> {
  if (keys.length === 0) {
    return new Map()
  }
  
  // Try to get all from cache
  const cached = await cacheService.mget<T>(keys)
  const result = new Map<string, T>()
  const missingKeys: string[] = []
  
  // Separate cached and missing
  keys.forEach((key, index) => {
    if (cached[index] !== null) {
      result.set(key, cached[index]!)
    } else {
      missingKeys.push(key)
    }
  })
  
  // If all cached, return immediately
  if (missingKeys.length === 0) {
    return result
  }
  
  // Fetch missing data
  const fetchedData = await fetchFn(missingKeys)
  
  // Store fetched data in cache
  const cacheEntries = Array.from(fetchedData.entries()).map(([key, value]) => ({
    key,
    value,
    ttl,
  }))
  
  if (cacheEntries.length > 0) {
    await cacheService.mset(cacheEntries)
  }
  
  // Merge with cached results
  fetchedData.forEach((value, key) => {
    result.set(key, value)
  })
  
  return result
}

/**
 * Cache Invalidation Patterns
 */

/**
 * Invalidate specific entity cache
 */
export async function invalidateEntity(
  entityType: string,
  entityId: string
): Promise<number> {
  const pattern = `${entityType}:*:${entityId}*`
  return await cacheService.invalidatePattern(pattern)
}

/**
 * Invalidate related caches
 * 
 * Example: When updating a project, invalidate:
 * - Project cache
 * - Client's projects cache
 * - Team members' dashboard cache
 */
export async function invalidateRelated(
  patterns: string[]
): Promise<number> {
  let totalInvalidated = 0
  
  for (const pattern of patterns) {
    const count = await cacheService.invalidatePattern(pattern)
    totalInvalidated += count
  }
  
  return totalInvalidated
}

/**
 * Time-based invalidation
 * 
 * Invalidate cache based on time windows
 * Useful for time-sensitive data (e.g., daily reports)
 */
export async function invalidateTimeWindow(
  pattern: string,
  olderThan: number // seconds
): Promise<number> {
  const keys = await cacheService.scanPattern(pattern)
  let invalidated = 0
  
  for (const key of keys) {
    const ttl = await cacheService.ttl(key)
    
    // If key was set more than olderThan seconds ago
    if (ttl > 0) {
      const keyAge = DEFAULT_TTL.STANDARD - ttl // Approximate age
      if (keyAge > olderThan) {
        await cacheService.delete(key)
        invalidated++
      }
    }
  }
  
  return invalidated
}

/**
 * Conditional cache update
 * 
 * Only update cache if certain conditions are met
 * Prevents cache stampede
 */
export async function conditionalUpdate<T>(
  key: string,
  condition: () => Promise<boolean>,
  fetchFn: () => Promise<T>,
  ttl: number = DEFAULT_TTL.STANDARD
): Promise<T | null> {
  // Check condition first
  const shouldUpdate = await condition()
  if (!shouldUpdate) {
    return await cacheService.get<T>(key)
  }
  
  // Fetch and update
  const data = await fetchFn()
  if (data !== null && data !== undefined) {
    await cacheService.set(key, data, ttl)
  }
  
  return data
}

/**
 * Distributed lock pattern
 * 
 * Prevents multiple processes from executing the same expensive operation
 * Uses SETNX for distributed locking
 */
export async function withLock<T>(
  lockKey: string,
  fn: () => Promise<T>,
  lockTtl: number = 10 // Lock expires after 10 seconds
): Promise<T | null> {
  // Try to acquire lock
  const acquired = await cacheService.setnx(lockKey, '1', lockTtl)
  
  if (!acquired) {
    console.log(`[Cache] Could not acquire lock: ${lockKey}`)
    return null
  }
  
  try {
    // Execute function with lock held
    const result = await fn()
    return result
  } finally {
    // Always release lock
    await cacheService.delete(lockKey)
  }
}

/**
 * Cache stampede prevention
 * 
 * When cache expires, only one process fetches new data
 * Others wait for the result
 */
export async function preventStampede<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = DEFAULT_TTL.STANDARD,
  lockTtl: number = 10
): Promise<T> {
  // Try cache first
  const cached = await cacheService.get<T>(key)
  if (cached !== null) {
    return cached
  }
  
  // Try to acquire lock to fetch data
  const lockKey = `lock:${key}`
  const acquired = await cacheService.setnx(lockKey, '1', lockTtl)
  
  if (acquired) {
    try {
      // We got the lock - fetch and cache data
      const data = await fetchFn()
      if (data !== null && data !== undefined) {
        await cacheService.set(key, data, ttl)
      }
      return data
    } finally {
      await cacheService.delete(lockKey)
    }
  } else {
    // Someone else is fetching - wait a bit and try cache again
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const retryCache = await cacheService.get<T>(key)
    if (retryCache !== null) {
      return retryCache
    }
    
    // Still no cache - fetch ourselves as fallback
    return await fetchFn()
  }
}

/**
 * Multi-tier cache pattern
 * 
 * Use Redis as L1 cache and database as L2
 * Automatically promote frequently accessed data
 */
export async function multiTierCache<T>(
  key: string,
  l1Ttl: number,
  l2FetchFn: () => Promise<T>
): Promise<T> {
  // Try L1 (Redis) first
  const l1Data = await cacheService.get<T>(key)
  if (l1Data !== null) {
    // L1 hit - extend TTL to keep hot data
    await cacheService.expire(key, l1Ttl)
    return l1Data
  }
  
  // L1 miss - fetch from L2 (database)
  const l2Data = await l2FetchFn()
  
  // Promote to L1
  if (l2Data !== null && l2Data !== undefined) {
    await cacheService.set(key, l2Data, l1Ttl)
  }
  
  return l2Data
}
