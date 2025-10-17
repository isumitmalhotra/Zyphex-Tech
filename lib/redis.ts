import Redis, { RedisOptions } from 'ioredis'

/**
 * Redis client singleton for production-grade caching
 * 
 * Features:
 * - Connection pooling with retry strategy
 * - Health checks and monitoring
 * - Automatic reconnection
 * - Error handling and logging
 * - Graceful shutdown support
 * 
 * Configuration optimized for VPS environment with 2-4GB RAM
 */

// Global Redis instance for singleton pattern
const globalForRedis = global as unknown as {
  redis: Redis | undefined
  redisMetrics: RedisMetrics | undefined
}

/**
 * Redis connection metrics for monitoring
 */
interface RedisMetrics {
  connected: boolean
  totalConnections: number
  failedConnections: number
  commandsSent: number
  commandsFailed: number
  lastError: string | null
  lastErrorTime: Date | null
  averageResponseTime: number
  uptime: number
  startTime: Date
}

// Initialize metrics
let redisMetrics: RedisMetrics = globalForRedis.redisMetrics || {
  connected: false,
  totalConnections: 0,
  failedConnections: 0,
  commandsSent: 0,
  commandsFailed: 0,
  lastError: null,
  lastErrorTime: null,
  averageResponseTime: 0,
  uptime: 0,
  startTime: new Date(),
}

globalForRedis.redisMetrics = redisMetrics

/**
 * Redis configuration optimized for production
 * 
 * Connection pool settings:
 * - maxRetriesPerRequest: 3 (fail fast after 3 retries)
 * - retryStrategy: Exponential backoff up to 10s
 * - reconnectOnError: Retry on common errors
 * - lazyConnect: Don't connect until first command
 */
const REDIS_CONFIG: RedisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0'),
  
  // Connection pool settings
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  enableOfflineQueue: true,
  lazyConnect: false, // Connect immediately to detect issues early
  
  // Retry strategy with exponential backoff
  retryStrategy(times: number) {
    if (times > 10) {
      // Stop retrying after 10 attempts
      console.error('[Redis] Max retry attempts reached, stopping reconnection')
      return null
    }
    
    // Exponential backoff: 50ms, 100ms, 200ms, ..., max 10s
    const delay = Math.min(times * 50, 10000)
    console.log(`[Redis] Retrying connection in ${delay}ms (attempt ${times})`)
    return delay
  },
  
  // Reconnect on specific errors
  reconnectOnError(err: Error) {
    const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT']
    if (targetErrors.some(target => err.message.includes(target))) {
      console.log(`[Redis] Reconnecting due to error: ${err.message}`)
      return true
    }
    return false
  },
}

/**
 * Create Redis client with monitoring and error handling
 */
function createRedisClient(): Redis {
  const client = new Redis(REDIS_CONFIG)
  
  // Connection event handlers
  client.on('connect', () => {
    console.log('[Redis] ✅ Connected to Redis server')
    redisMetrics.connected = true
    redisMetrics.totalConnections++
  })
  
  client.on('ready', () => {
    console.log('[Redis] ✅ Redis client ready')
  })
  
  client.on('error', (error: Error) => {
    console.error('[Redis] ❌ Connection error:', error.message)
    redisMetrics.connected = false
    redisMetrics.failedConnections++
    redisMetrics.lastError = error.message
    redisMetrics.lastErrorTime = new Date()
  })
  
  client.on('close', () => {
    console.log('[Redis] Connection closed')
    redisMetrics.connected = false
  })
  
  client.on('reconnecting', (delay: number) => {
    console.log(`[Redis] Reconnecting in ${delay}ms...`)
  })
  
  client.on('end', () => {
    console.log('[Redis] Connection ended')
    redisMetrics.connected = false
  })
  
  return client
}

/**
 * Get Redis client singleton
 */
export const redis: Redis = globalForRedis.redis ?? createRedisClient()

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis
}

/**
 * Check if Redis is available and connected
 */
export async function isRedisAvailable(): Promise<boolean> {
  try {
    await redis.ping()
    return true
  } catch (error) {
    console.error('[Redis] Health check failed:', error)
    return false
  }
}

/**
 * Get Redis server info
 */
export async function getRedisInfo(): Promise<Record<string, string> | null> {
  try {
    const info = await redis.info()
    const lines = info.split('\r\n')
    const result: Record<string, string> = {}
    
    for (const line of lines) {
      if (line && !line.startsWith('#') && line.includes(':')) {
        const [key, value] = line.split(':')
        result[key] = value
      }
    }
    
    return result
  } catch (error) {
    console.error('[Redis] Failed to get info:', error)
    return null
  }
}

/**
 * Get Redis memory usage statistics
 */
export async function getRedisMemoryStats(): Promise<{
  used: string
  peak: string
  fragmentation: number
} | null> {
  try {
    const info = await getRedisInfo()
    if (!info) return null
    
    return {
      used: info.used_memory_human || '0',
      peak: info.used_memory_peak_human || '0',
      fragmentation: parseFloat(info.mem_fragmentation_ratio || '0'),
    }
  } catch (error) {
    console.error('[Redis] Failed to get memory stats:', error)
    return null
  }
}

/**
 * Get current Redis metrics
 */
export function getRedisMetrics(): RedisMetrics {
  return {
    ...redisMetrics,
    uptime: Math.floor((Date.now() - redisMetrics.startTime.getTime()) / 1000),
  }
}

/**
 * Reset Redis metrics (for testing)
 */
export function resetRedisMetrics(): void {
  redisMetrics = {
    connected: redisMetrics.connected,
    totalConnections: 0,
    failedConnections: 0,
    commandsSent: 0,
    commandsFailed: 0,
    lastError: null,
    lastErrorTime: null,
    averageResponseTime: 0,
    uptime: 0,
    startTime: new Date(),
  }
  globalForRedis.redisMetrics = redisMetrics
}

/**
 * Log Redis metrics to console
 */
export function logRedisMetrics(): void {
  const metrics = getRedisMetrics()
  console.log('📊 Redis Metrics:', JSON.stringify(metrics, null, 2))
}

/**
 * Gracefully close Redis connection
 */
export async function closeRedis(): Promise<void> {
  try {
    await redis.quit()
    console.log('[Redis] Connection closed gracefully')
  } catch (error) {
    console.error('[Redis] Error closing connection:', error)
    // Force disconnect if graceful close fails
    redis.disconnect()
  }
}

/**
 * Test Redis connection
 */
export async function testRedisConnection(): Promise<boolean> {
  try {
    const start = Date.now()
    const result = await redis.ping()
    const duration = Date.now() - start
    
    console.log(`[Redis] PING response: ${result} (${duration}ms)`)
    return result === 'PONG'
  } catch (error) {
    console.error('[Redis] Connection test failed:', error)
    return false
  }
}

/**
 * Flush all Redis data (use with caution!)
 */
export async function flushRedis(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Cannot flush Redis in production')
  }
  
  try {
    await redis.flushdb()
    console.log('[Redis] Database flushed')
  } catch (error) {
    console.error('[Redis] Failed to flush database:', error)
    throw error
  }
}

// Graceful shutdown on process termination
if (process.env.NODE_ENV !== 'test') {
  process.on('SIGINT', async () => {
    console.log('[Redis] Received SIGINT, closing connection...')
    await closeRedis()
    process.exit(0)
  })
  
  process.on('SIGTERM', async () => {
    console.log('[Redis] Received SIGTERM, closing connection...')
    await closeRedis()
    process.exit(0)
  })
}

export default redis
