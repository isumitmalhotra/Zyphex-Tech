/**
 * Legacy Cache Adapter
 * Simple cache interface for backwards compatibility
 */

import { getMultiLevelCache } from './multi-level-cache'

class LegacyCacheAdapter {
  async get<T>(key: string): Promise<T | null> {
    try {
      const cache = getMultiLevelCache()
      return await cache.get<T>(key)
    } catch {
      return null
    }
  }

  async set<T>(key: string, value: T, ttl: number = 300): Promise<boolean> {
    try {
      const cache = getMultiLevelCache()
      await cache.set(key, value, { l1Ttl: ttl, l2Ttl: ttl })
      return true
    } catch {
      return false
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const cache = getMultiLevelCache()
      await cache.delete(key)
      return true
    } catch {
      return false
    }
  }

  async deletePattern(_pattern: string): Promise<boolean> {
    // Pattern deletion not supported in MultiLevelCache
    // Return true to avoid breaking legacy code
    return true
  }

  async clear(): Promise<boolean> {
    // Clear not supported in MultiLevelCache
    // Return true to avoid breaking legacy code
    return true
  }
}

export const cache = new LegacyCacheAdapter()
