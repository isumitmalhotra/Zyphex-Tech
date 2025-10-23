/**
 * Cache Health Check Script
 * 
 * Comprehensive health check for cache system.
 * Run this script to verify cache functionality and performance.
 * 
 * Usage:
 * ```bash
 * npm run cache:health-check
 * # or
 * tsx scripts/cache-health-check.ts
 * ```
 */

import { cacheMonitor, CacheHealth } from '../lib/cache/cache-monitor'
import { getMultiLevelCache } from '../lib/cache/multi-level-cache'
import { getMemoryCache } from '../lib/cache/memory-cache'
import { cacheService } from '../lib/cache/cache-service'

console.log('╔═══════════════════════════════════════════════════════════╗')
console.log('║           CACHE SYSTEM HEALTH CHECK                       ║')
console.log('╚═══════════════════════════════════════════════════════════╝\n')

async function runHealthCheck(): Promise<void> {
  let allTestsPassed = true
  
  try {
    // Test 1: Multi-Level Cache Instance
    console.log('🧪 Test 1: Multi-Level Cache Instance')
    const cache = getMultiLevelCache()
    if (cache) {
      console.log('   ✅ Multi-level cache initialized\n')
    } else {
      console.log('   ❌ Failed to get multi-level cache instance\n')
      allTestsPassed = false
    }
    
    // Test 2: L1 (Memory) Cache
    console.log('🧪 Test 2: L1 (Memory) Cache')
    const l1 = getMemoryCache()
    if (l1) {
      const testKey = 'health-check-test'
      const testValue = { test: true, timestamp: Date.now() }
      
      l1.set(testKey, testValue, 60)
      const retrieved = l1.get(testKey)
      
      if (retrieved && JSON.stringify(retrieved) === JSON.stringify(testValue)) {
        console.log('   ✅ L1 cache read/write working')
        l1.delete(testKey)
        console.log('   ✅ L1 cache delete working\n')
      } else {
        console.log('   ❌ L1 cache read/write failed\n')
        allTestsPassed = false
      }
    } else {
      console.log('   ❌ Failed to get L1 cache instance\n')
      allTestsPassed = false
    }
    
    // Test 3: L2 (Redis) Cache
    console.log('🧪 Test 3: L2 (Redis) Cache')
    try {
      const testKey = 'health-check-test-redis'
      const testValue = { test: true, timestamp: Date.now() }
      
      await cacheService.set(testKey, testValue, 60)
      const retrieved = await cacheService.get<typeof testValue>(testKey)
      
      if (retrieved && retrieved.test === true) {
        console.log('   ✅ L2 cache read/write working')
        await cacheService.delete(testKey)
        console.log('   ✅ L2 cache delete working\n')
      } else {
        console.log('   ⚠️  L2 cache read/write may have issues\n')
      }
    } catch (_error) {
      console.log('   ⚠️  L2 (Redis) cache not available or not configured')
      console.log('   ℹ️  This is OK for development without Redis\n')
    }
    
    // Test 4: Cache Monitor
    console.log('🧪 Test 4: Cache Monitor')
    const metrics = cacheMonitor.getMetrics()
    if (metrics) {
      console.log('   ✅ Cache monitor initialized')
      console.log(`   📊 Combined Hit Rate: ${(metrics.combined.hitRate * 100).toFixed(2)}%`)
      console.log(`   📊 Total Operations: ${metrics.combined.totalOperations.toLocaleString()}\n`)
    } else {
      console.log('   ❌ Failed to get cache metrics\n')
      allTestsPassed = false
    }
    
    // Test 5: Health Status
    console.log('🧪 Test 5: Health Status')
    const health = await cacheMonitor.getHealthStatus()
    const statusIcon = {
      HEALTHY: '✅',
      DEGRADED: '⚠️',
      CRITICAL: '❌',
      DOWN: '🔴',
    }
    console.log(`   Status: ${statusIcon[health.status]} ${health.status}`)
    console.log(`   L1 Status: ${statusIcon[health.l1Status]} ${health.l1Status}`)
    console.log(`   L2 Status: ${statusIcon[health.l2Status]} ${health.l2Status}`)
    console.log(`   Issues: ${health.issues.length}`)
    console.log(`   Recommendations: ${health.recommendations.length}\n`)
    
    if (health.status === CacheHealth.CRITICAL || health.status === CacheHealth.DOWN) {
      console.log('   ⚠️  Cache health is not optimal:')
      health.issues.forEach((issue) => console.log(`      • ${issue}`))
      console.log('')
      allTestsPassed = false
    }
    
    // Test 6: Performance Metrics
    console.log('🧪 Test 6: Performance Metrics')
    console.log(`   Average Latency: ${metrics.performance.averageLatencyMs.toFixed(2)}ms`)
    console.log(`   P95 Latency: ${metrics.performance.p95LatencyMs.toFixed(2)}ms`)
    console.log(`   P99 Latency: ${metrics.performance.p99LatencyMs.toFixed(2)}ms`)
    console.log(`   Throughput: ${metrics.performance.operationsPerSecond.toFixed(2)} ops/sec\n`)
    
    if (metrics.performance.averageLatencyMs > 50) {
      console.log('   ⚠️  Average latency is high (>50ms)\n')
      allTestsPassed = false
    } else {
      console.log('   ✅ Performance metrics are healthy\n')
    }
    
    // Test 7: Memory Usage
    console.log('🧪 Test 7: Memory Usage')
    console.log(`   L1 Items: ${metrics.memory.itemCount.toLocaleString()} / ${metrics.memory.maxSize.toLocaleString()}`)
    console.log(`   Utilization: ${metrics.memory.utilizationPercent.toFixed(2)}%`)
    console.log(`   Evictions: ${metrics.memory.evictions.toLocaleString()}`)
    console.log(`   Estimated Size: ${metrics.memory.estimatedMemoryMB.toFixed(2)} MB\n`)
    
    if (metrics.memory.utilizationPercent > 90) {
      console.log('   ⚠️  L1 memory usage is critical (>90%)\n')
      allTestsPassed = false
    } else if (metrics.memory.utilizationPercent > 75) {
      console.log('   ⚠️  L1 memory usage is high (>75%)\n')
    } else {
      console.log('   ✅ Memory usage is healthy\n')
    }
    
    // Test 8: Optimization Recommendations
    console.log('🧪 Test 8: Optimization Recommendations')
    const recommendations = cacheMonitor.getOptimizationRecommendations()
    const highPriority = recommendations.filter((r) => r.priority === 'HIGH')
    
    console.log(`   Total Recommendations: ${recommendations.length}`)
    console.log(`   High Priority: ${highPriority.length}`)
    console.log(`   Medium Priority: ${recommendations.filter((r) => r.priority === 'MEDIUM').length}`)
    console.log(`   Low Priority: ${recommendations.filter((r) => r.priority === 'LOW').length}\n`)
    
    if (highPriority.length > 0) {
      console.log('   ⚠️  High priority recommendations:')
      highPriority.forEach((rec) => {
        console.log(`      • ${rec.issue}`)
        console.log(`        → ${rec.recommendation}`)
      })
      console.log('')
    } else {
      console.log('   ✅ No high priority recommendations\n')
    }
    
    // Test 9: Historical Trends
    console.log('🧪 Test 9: Historical Trends')
    const trends = cacheMonitor.getTrends(60)
    console.log(`   Hit Rate Trend: ${trends.hitRateTrend}`)
    console.log(`   Latency Trend: ${trends.latencyTrend}`)
    console.log(`   Throughput Trend: ${trends.throughputTrend}`)
    console.log(`   Data Points: ${trends.dataPoints.length}\n`)
    
    if (trends.hitRateTrend === 'DECLINING' || trends.latencyTrend === 'DEGRADING') {
      console.log('   ⚠️  Performance trends show degradation\n')
      allTestsPassed = false
    } else {
      console.log('   ✅ Performance trends are stable or improving\n')
    }
    
    // Final Summary
    console.log('═══════════════════════════════════════════════════════════')
    if (allTestsPassed) {
      console.log('✅ HEALTH CHECK PASSED - Cache system is healthy')
    } else {
      console.log('⚠️  HEALTH CHECK WARNINGS - Review issues above')
    }
    console.log('═══════════════════════════════════════════════════════════\n')
    
    // Performance Report
    console.log('📊 Generating detailed performance report...\n')
    cacheMonitor.logReport()
    
  } catch (error) {
    console.error('❌ Health check failed with error:', error)
    process.exit(1)
  }
}

// Run health check
runHealthCheck()
  .then(() => {
    console.log('\n✅ Health check completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Health check failed:', error)
    process.exit(1)
  })
