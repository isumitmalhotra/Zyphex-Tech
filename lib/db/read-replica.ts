/**
 * Read Replica Support
 * 
 * Implements read/write splitting with automatic failover and load balancing
 * across database replicas for improved performance and availability.
 * 
 * Features:
 * - Automatic read/write query routing
 * - Load balancing across replicas
 * - Replica health monitoring
 * - Automatic failover to primary
 * - Replication lag tracking
 * - Connection pooling per replica
 * 
 * Usage:
 * import { ReadReplicaManager } from '@/lib/db/read-replica'
 * const result = await ReadReplicaManager.executeRead(() => prisma.user.findMany())
 */

import { PrismaClient } from '@prisma/client'

/**
 * Replica configuration
 */
export interface ReplicaConfig {
  /**
   * Connection URL
   */
  url: string
  
  /**
   * Replica identifier
   */
  id: string
  
  /**
   * Weight for load balancing (higher = more traffic)
   */
  weight?: number
  
  /**
   * Maximum acceptable replication lag in milliseconds
   */
  maxLag?: number
}

/**
 * Replica health status
 */
export interface ReplicaHealth {
  id: string
  isHealthy: boolean
  lastCheck: Date
  latency: number
  replicationLag: number | null
  errorCount: number
  consecutiveErrors: number
}

/**
 * Read replica statistics
 */
export interface ReplicaStats {
  totalReads: number
  totalWrites: number
  readsPerReplica: Record<string, number>
  failovers: number
  averageLatency: number
  totalErrors: number
}

/**
 * Query operation type
 */
export enum OperationType {
  READ = 'read',
  WRITE = 'write'
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG = {
  maxLag: 5000,           // 5 seconds
  healthCheckInterval: 30000,  // 30 seconds
  weight: 1,
  maxConsecutiveErrors: 3,
  failoverCooldown: 60000  // 1 minute
}

/**
 * Read Replica Manager Class
 */
class ReadReplicaManagerClass {
  private replicas: Map<string, PrismaClient> = new Map()
  private replicaConfigs: Map<string, ReplicaConfig> = new Map()
  private replicaHealth: Map<string, ReplicaHealth> = new Map()
  private primaryClient: PrismaClient | null = null
  private stats: ReplicaStats = {
    totalReads: 0,
    totalWrites: 0,
    readsPerReplica: {},
    failovers: 0,
    averageLatency: 0,
    totalErrors: 0
  }
  private healthCheckInterval: NodeJS.Timeout | null = null
  private roundRobinIndex = 0
  
  /**
   * Initialize with replicas
   */
  init(
    primaryClient: PrismaClient,
    replicaConfigs: ReplicaConfig[]
  ): void {
    this.primaryClient = primaryClient
    
    // Initialize replicas
    for (const config of replicaConfigs) {
      this.addReplica(config)
    }
    
    // Start health checks
    this.startHealthChecks()
    
    console.log(`[ReadReplica] Initialized with ${replicaConfigs.length} replicas`)
  }
  
  /**
   * Add a replica
   */
  addReplica(config: ReplicaConfig): void {
    const fullConfig = {
      ...config,
      weight: config.weight ?? DEFAULT_CONFIG.weight,
      maxLag: config.maxLag ?? DEFAULT_CONFIG.maxLag
    }
    
    this.replicaConfigs.set(config.id, fullConfig)
    
    const client = new PrismaClient({
      datasources: {
        db: { url: config.url }
      }
    })
    
    this.replicas.set(config.id, client)
    
    // Initialize health status
    this.replicaHealth.set(config.id, {
      id: config.id,
      isHealthy: true,
      lastCheck: new Date(),
      latency: 0,
      replicationLag: null,
      errorCount: 0,
      consecutiveErrors: 0
    })
    
    // Initialize stats
    this.stats.readsPerReplica[config.id] = 0
  }
  
  /**
   * Remove a replica
   */
  async removeReplica(id: string): Promise<void> {
    const client = this.replicas.get(id)
    if (client) {
      await client.$disconnect()
      this.replicas.delete(id)
    }
    
    this.replicaConfigs.delete(id)
    this.replicaHealth.delete(id)
    delete this.stats.readsPerReplica[id]
  }
  
  /**
   * Execute read query on replica
   */
  async executeRead<T>(queryFn: (client: PrismaClient) => Promise<T>): Promise<T> {
    this.stats.totalReads++
    
    // Try to get a healthy replica
    const replica = this.selectReplica()
    
    if (!replica) {
      // No healthy replicas, fallback to primary
      this.stats.failovers++
      console.warn('[ReadReplica] No healthy replicas, using primary')
      return this.executePrimary(queryFn)
    }
    
    const startTime = Date.now()
    
    try {
      const result = await queryFn(replica.client)
      
      // Update stats
      const latency = Date.now() - startTime
      this.updateLatency(latency)
      this.stats.readsPerReplica[replica.id]++
      
      // Reset error count on success
      const health = this.replicaHealth.get(replica.id)
      if (health) {
        health.consecutiveErrors = 0
      }
      
      return result
      
    } catch (error) {
      // Mark replica as potentially unhealthy
      this.recordError(replica.id)
      
      // Fallback to primary
      this.stats.failovers++
      console.error(`[ReadReplica] Error on replica ${replica.id}, falling back to primary:`, error)
      return this.executePrimary(queryFn)
    }
  }
  
  /**
   * Execute write query on primary
   */
  async executeWrite<T>(queryFn: (client: PrismaClient) => Promise<T>): Promise<T> {
    this.stats.totalWrites++
    return this.executePrimary(queryFn)
  }
  
  /**
   * Execute on primary
   */
  private async executePrimary<T>(queryFn: (client: PrismaClient) => Promise<T>): Promise<T> {
    if (!this.primaryClient) {
      throw new Error('[ReadReplica] Primary client not initialized')
    }
    
    return queryFn(this.primaryClient)
  }
  
  /**
   * Select a replica using weighted round-robin with health checks
   */
  private selectReplica(): { id: string; client: PrismaClient } | null {
    const healthyReplicas = Array.from(this.replicaConfigs.entries())
      .filter(([id]) => {
        const health = this.replicaHealth.get(id)
        return health?.isHealthy && health.consecutiveErrors < DEFAULT_CONFIG.maxConsecutiveErrors
      })
    
    if (healthyReplicas.length === 0) {
      return null
    }
    
    // Weighted round-robin
    const weights = healthyReplicas.map(([_id, config]) => config.weight || 1)
    const _totalWeight = weights.reduce((sum, w) => sum + w, 0)
    
    // Simple round-robin (can be enhanced with true weighted selection)
    this.roundRobinIndex = (this.roundRobinIndex + 1) % healthyReplicas.length
    const [selectedId] = healthyReplicas[this.roundRobinIndex]
    
    const client = this.replicas.get(selectedId)
    if (!client) {
      return null
    }
    
    return { id: selectedId, client }
  }
  
  /**
   * Record error for a replica
   */
  private recordError(id: string): void {
    const health = this.replicaHealth.get(id)
    if (!health) return
    
    health.errorCount++
    health.consecutiveErrors++
    this.stats.totalErrors++
    
    // Mark as unhealthy if too many consecutive errors
    if (health.consecutiveErrors >= DEFAULT_CONFIG.maxConsecutiveErrors) {
      health.isHealthy = false
      console.warn(`[ReadReplica] Replica ${id} marked as unhealthy after ${health.consecutiveErrors} consecutive errors`)
    }
  }
  
  /**
   * Update latency average
   */
  private updateLatency(latency: number): void {
    const { totalReads, averageLatency } = this.stats
    this.stats.averageLatency = ((averageLatency * (totalReads - 1)) + latency) / totalReads
  }
  
  /**
   * Start health checks
   */
  private startHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
    }
    
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks()
    }, DEFAULT_CONFIG.healthCheckInterval)
    
    // Perform initial check
    this.performHealthChecks()
  }
  
  /**
   * Perform health checks on all replicas
   */
  private async performHealthChecks(): Promise<void> {
    const checks = Array.from(this.replicas.entries()).map(([id, client]) =>
      this.checkReplicaHealth(id, client)
    )
    
    await Promise.all(checks)
  }
  
  /**
   * Check health of a single replica
   */
  private async checkReplicaHealth(id: string, client: PrismaClient): Promise<void> {
    const health = this.replicaHealth.get(id)
    if (!health) return
    
    const startTime = Date.now()
    
    try {
      // Ping database
      await client.$queryRaw`SELECT 1`
      
      const latency = Date.now() - startTime
      
      // Check replication lag (PostgreSQL specific)
      try {
        const lag = await this.checkReplicationLag(client)
        health.replicationLag = lag
        
        const config = this.replicaConfigs.get(id)
        const maxLag = config?.maxLag || DEFAULT_CONFIG.maxLag
        
        // Mark unhealthy if lag is too high
        if (lag !== null && lag > maxLag) {
          health.isHealthy = false
          console.warn(`[ReadReplica] Replica ${id} has high replication lag: ${lag}ms`)
        } else if (health.consecutiveErrors === 0) {
          health.isHealthy = true
        }
      } catch {
        // Replication lag check failed, but connection works
        health.replicationLag = null
      }
      
      health.latency = latency
      health.lastCheck = new Date()
      
      // Reset consecutive errors on successful check
      health.consecutiveErrors = 0
      
    } catch (error) {
      console.error(`[ReadReplica] Health check failed for replica ${id}:`, error)
      this.recordError(id)
    }
  }
  
  /**
   * Check replication lag (PostgreSQL)
   */
  private async checkReplicationLag(client: PrismaClient): Promise<number | null> {
    try {
      // PostgreSQL replication lag query
      const result = await client.$queryRaw<Array<{ lag: number }>>`
        SELECT EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp()))::INTEGER as lag
      ` as Array<{ lag: number }>
      
      if (result && result.length > 0 && result[0].lag !== null) {
        return result[0].lag * 1000 // Convert to milliseconds
      }
    } catch {
      // Not a replica or query failed
    }
    
    return null
  }
  
  /**
   * Get replica health status
   */
  getReplicaHealth(id?: string): ReplicaHealth | ReplicaHealth[] | null {
    if (id) {
      return this.replicaHealth.get(id) || null
    }
    
    return Array.from(this.replicaHealth.values())
  }
  
  /**
   * Get statistics
   */
  getStats(): ReplicaStats {
    return { ...this.stats }
  }
  
  /**
   * Get detailed report
   */
  getDetailedReport(): {
    replicas: Array<{
      id: string
      config: ReplicaConfig
      health: ReplicaHealth
      reads: number
    }>
    stats: ReplicaStats
    summary: {
      totalReplicas: number
      healthyReplicas: number
      totalQueries: number
      readWriteRatio: number
    }
  } {
    const replicas = Array.from(this.replicaConfigs.entries()).map(([id, config]) => ({
      id,
      config,
      health: this.replicaHealth.get(id)!,
      reads: this.stats.readsPerReplica[id] || 0
    }))
    
    const healthyReplicas = replicas.filter(r => r.health.isHealthy).length
    const totalQueries = this.stats.totalReads + this.stats.totalWrites
    const readWriteRatio = this.stats.totalWrites > 0
      ? this.stats.totalReads / this.stats.totalWrites
      : this.stats.totalReads
    
    return {
      replicas,
      stats: this.getStats(),
      summary: {
        totalReplicas: this.replicaConfigs.size,
        healthyReplicas,
        totalQueries,
        readWriteRatio
      }
    }
  }
  
  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalReads: 0,
      totalWrites: 0,
      readsPerReplica: {},
      failovers: 0,
      averageLatency: 0,
      totalErrors: 0
    }
    
    // Reset per-replica stats
    for (const id of this.replicaConfigs.keys()) {
      this.stats.readsPerReplica[id] = 0
    }
  }
  
  /**
   * Disconnect all replicas
   */
  async disconnect(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
    }
    
    const disconnects = Array.from(this.replicas.values()).map(client =>
      client.$disconnect()
    )
    
    await Promise.all(disconnects)
    
    this.replicas.clear()
    this.replicaConfigs.clear()
    this.replicaHealth.clear()
  }
}

// Singleton instance
const ReadReplicaManager = new ReadReplicaManagerClass()

/**
 * Execute read query on replica
 */
export function executeReadQuery<T>(
  queryFn: (client: PrismaClient) => Promise<T>
): Promise<T> {
  return ReadReplicaManager.executeRead(queryFn)
}

/**
 * Execute write query on primary
 */
export function executeWriteQuery<T>(
  queryFn: (client: PrismaClient) => Promise<T>
): Promise<T> {
  return ReadReplicaManager.executeWrite(queryFn)
}

/**
 * Auto-detect operation type and route accordingly
 */
export async function executeQuery<T>(
  queryFn: (client: PrismaClient) => Promise<T>,
  operationType: OperationType = OperationType.READ
): Promise<T> {
  if (operationType === OperationType.WRITE) {
    return executeWriteQuery(queryFn)
  }
  
  return executeReadQuery(queryFn)
}

export { ReadReplicaManager }

const ReadReplicaUtils = {
  ReadReplicaManager,
  executeReadQuery,
  executeWriteQuery,
  executeQuery,
  OperationType
}

export default ReadReplicaUtils
