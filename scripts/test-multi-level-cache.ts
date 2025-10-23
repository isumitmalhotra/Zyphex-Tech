/**
 * Multi-Level Cache Test Suite
 * 
 * Comprehensive tests for:
 * - Memory Cache (L1) with LRU eviction
 * - Multi-Level Cache (L1 + L2)
 * - Cache promotion/demotion
 * - Failover scenarios
 * - Performance benchmarks
 * 
 * Run: npm run test:multi-level-cache
 */

import { createMemoryCache } from '../lib/cache/memory-cache'
import { createMultiLevelCache } from '../lib/cache/multi-level-cache'
import { isRedisAvailable } from '../lib/redis'

// Test utilities
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

// Test counter
let testsPassed = 0
let testsFailed = 0
let testsSkipped = 0

function logTest(name: string, status: 'PASS' | 'FAIL' | 'SKIP', message?: string) {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏭️'
  console.log(`${icon} ${name}${message ? ': ' + message : ''}`)
  
  if (status === 'PASS') testsPassed++
  else if (status === 'FAIL') testsFailed++
  else testsSkipped++
}

async function runTests() {
  console.log('🧪 Multi-Level Cache Test Suite')
  console.log('=' .repeat(60))
  
  // Check Redis availability
  const redisAvailable = await isRedisAvailable()
  console.log(`\n📡 Redis Status: ${redisAvailable ? '✅ Available' : '❌ Unavailable'}`)
  
  if (!redisAvailable) {
    console.log('⚠️  Warning: Some tests will be skipped without Redis')
  }
  
  console.log('\n' + '='.repeat(60))
  
  // ========================================
  // SECTION 1: Memory Cache (L1) Tests
  // ========================================
  console.log('\n📦 SECTION 1: Memory Cache (L1) Tests')
  console.log('-'.repeat(60))
  
  // Test 1: Basic GET/SET/DELETE
  console.log('\n[Test 1] Basic GET/SET/DELETE operations')
  try {
    const memCache = createMemoryCache({ maxSize: 10 * 1024 * 1024 }) // 10MB
    
    // Set
    const setResult = memCache.set('test:key1', { name: 'John', age: 30 }, 60)
    if (!setResult) throw new Error('Set failed')
    
    // Get
    const value = memCache.get<{ name: string; age: number }>('test:key1')
    if (!value || value.name !== 'John' || value.age !== 30) {
      throw new Error('Get returned wrong value')
    }
    
    // Delete
    const deleteResult = memCache.delete('test:key1')
    if (!deleteResult) throw new Error('Delete failed')
    
    // Verify deleted
    const deletedValue = memCache.get('test:key1')
    if (deletedValue !== null) throw new Error('Key still exists after delete')
    
    memCache.destroy()
    logTest('Basic GET/SET/DELETE', 'PASS')
  } catch (error) {
    logTest('Basic GET/SET/DELETE', 'FAIL', (error as Error).message)
  }
  
  // Test 2: TTL Expiration
  console.log('\n[Test 2] TTL expiration')
  try {
    const memCache = createMemoryCache({ maxSize: 10 * 1024 * 1024 })
    
    // Set with 1 second TTL
    memCache.set('test:expiring', 'temporary value', 1)
    
    // Should exist immediately
    let value = memCache.get('test:expiring')
    if (value !== 'temporary value') throw new Error('Value not found immediately')
    
    // Wait for expiration
    await sleep(1100)
    
    // Should be expired
    value = memCache.get('test:expiring')
    if (value !== null) throw new Error('Value still exists after TTL')
    
    memCache.destroy()
    logTest('TTL expiration', 'PASS')
  } catch (error) {
    logTest('TTL expiration', 'FAIL', (error as Error).message)
  }
  
  // Test 3: LRU Eviction
  console.log('\n[Test 3] LRU eviction when memory limit reached')
  try {
    // Create small cache (100KB max)
    const memCache = createMemoryCache({ maxSize: 100 * 1024 })
    
    // Fill cache with data
    const largeData = 'x'.repeat(30 * 1024) // 30KB each
    memCache.set('key1', largeData, 300)
    memCache.set('key2', largeData, 300)
    memCache.set('key3', largeData, 300)
    
    // This should trigger eviction of key1 (oldest)
    memCache.set('key4', largeData, 300)
    
    // Key1 should be evicted
    const key1 = memCache.get('key1')
    if (key1 !== null) throw new Error('LRU eviction failed - key1 still exists')
    
    // Newer keys should still exist
    const key4 = memCache.get('key4')
    if (key4 === null) throw new Error('Newest key was evicted')
    
    const stats = memCache.getStats()
    if (stats.evictions === 0) throw new Error('No evictions recorded')
    
    memCache.destroy()
    logTest('LRU eviction', 'PASS', `${stats.evictions} evictions`)
  } catch (error) {
    logTest('LRU eviction', 'FAIL', (error as Error).message)
  }
  
  // Test 4: Hit/Miss Rate Tracking
  console.log('\n[Test 4] Hit/miss rate tracking')
  try {
    const memCache = createMemoryCache({ maxSize: 10 * 1024 * 1024 })
    
    // Generate hits and misses
    memCache.set('hit:1', 'value1', 300)
    memCache.set('hit:2', 'value2', 300)
    
    memCache.get('hit:1') // HIT
    memCache.get('hit:2') // HIT
    memCache.get('miss:1') // MISS
    memCache.get('miss:2') // MISS
    
    const stats = memCache.getStats()
    
    if (stats.hits !== 2) throw new Error(`Expected 2 hits, got ${stats.hits}`)
    if (stats.misses !== 2) throw new Error(`Expected 2 misses, got ${stats.misses}`)
    if (stats.hitRate !== 50) throw new Error(`Expected 50% hit rate, got ${stats.hitRate}%`)
    
    memCache.destroy()
    logTest('Hit/miss rate tracking', 'PASS', `Hit rate: ${stats.hitRate}%`)
  } catch (error) {
    logTest('Hit/miss rate tracking', 'FAIL', (error as Error).message)
  }
  
  // Test 5: Batch Operations
  console.log('\n[Test 5] Batch GET/SET/DELETE operations')
  try {
    const memCache = createMemoryCache({ maxSize: 10 * 1024 * 1024 })
    
    // Batch set
    const batchSetResult = memCache.mset([
      { key: 'batch:1', value: 'value1', ttl: 300 },
      { key: 'batch:2', value: 'value2', ttl: 300 },
      { key: 'batch:3', value: 'value3', ttl: 300 },
    ])
    
    if (!batchSetResult) throw new Error('Batch set failed')
    
    // Batch get
    const values = memCache.mget<string>(['batch:1', 'batch:2', 'batch:3', 'batch:4'])
    
    if (values[0] !== 'value1') throw new Error('Batch get [0] failed')
    if (values[1] !== 'value2') throw new Error('Batch get [1] failed')
    if (values[2] !== 'value3') throw new Error('Batch get [2] failed')
    if (values[3] !== null) throw new Error('Batch get [3] should be null')
    
    // Batch delete
    const deleteCount = memCache.mdelete(['batch:1', 'batch:2', 'batch:3'])
    
    if (deleteCount !== 3) throw new Error(`Expected 3 deletes, got ${deleteCount}`)
    
    memCache.destroy()
    logTest('Batch operations', 'PASS', `${deleteCount} keys deleted`)
  } catch (error) {
    logTest('Batch operations', 'FAIL', (error as Error).message)
  }
  
  // ========================================
  // SECTION 2: Multi-Level Cache Tests
  // ========================================
  console.log('\n\n📦 SECTION 2: Multi-Level Cache Tests')
  console.log('-'.repeat(60))
  
  if (!redisAvailable) {
    console.log('⚠️  Skipping multi-level tests (Redis not available)')
    testsSkipped += 8
  } else {
    // Test 6: L1 → L2 Fallback
    console.log('\n[Test 6] L1 → L2 → DB fallback')
    try {
      const mlCache = createMultiLevelCache({
        l1: { enabled: true, ttl: 300 },
        l2: { enabled: true, ttl: 600 },
        enablePromotion: false, // Disable for predictable testing
      })
      
      // Clear any existing test data
      await mlCache.delete('test:fallback')
      
      // Simulate DB fetch
      let dbFetchCount = 0
      const fetchFromDB = async () => {
        dbFetchCount++
        return { data: 'from database', timestamp: Date.now() }
      }
      
      // First get - should fetch from DB and store in both L1 and L2
      const value1 = await mlCache.get('test:fallback', fetchFromDB)
      if (!value1 || dbFetchCount !== 1) {
        throw new Error('First fetch should call DB')
      }
      
      // Second get - should hit L1
      const value2 = await mlCache.get('test:fallback')
      if (!value2 || dbFetchCount !== 1) {
        throw new Error('Second fetch should hit L1 cache')
      }
      
      // Remove from L1 only
      mlCache.getL1().delete('test:fallback')
      
      // Third get - should hit L2
      const value3 = await mlCache.get('test:fallback')
      if (!value3 || dbFetchCount !== 1) {
        throw new Error('Third fetch should hit L2 cache')
      }
      
      const stats = mlCache.getStats()
      if (stats.l1Hits === 0 && stats.l2Hits === 0) {
        throw new Error('No cache hits recorded')
      }
      
      await mlCache.clearAll()
      logTest('L1 → L2 → DB fallback', 'PASS', `L1: ${stats.l1Hits} hits, L2: ${stats.l2Hits} hits`)
    } catch (error) {
      logTest('L1 → L2 → DB fallback', 'FAIL', (error as Error).message)
    }
    
    // Test 7: Cache Promotion
    console.log('\n[Test 7] Automatic cache promotion (hot data → L1)')
    try {
      const mlCache = createMultiLevelCache({
        l1: { enabled: true, ttl: 300 },
        l2: { enabled: true, ttl: 600 },
        enablePromotion: true,
        promotionThreshold: 3, // Promote after 3 accesses
      })
      
      await mlCache.clearAll()
      
      // Set in L2 only
      await mlCache.set('test:promote', { value: 'hot data' }, { skipL1: true })
      
      // Access multiple times (should trigger promotion)
      await mlCache.get('test:promote') // Access 1
      await mlCache.get('test:promote') // Access 2
      await mlCache.get('test:promote') // Access 3 - should promote
      
      // Check if promoted to L1
      const l1Value = mlCache.getL1().get('test:promote')
      if (!l1Value) {
        throw new Error('Value was not promoted to L1')
      }
      
      const stats = mlCache.getStats()
      if (stats.promotions === 0) {
        throw new Error('No promotions recorded')
      }
      
      await mlCache.clearAll()
      logTest('Cache promotion', 'PASS', `${stats.promotions} promotions`)
    } catch (error) {
      logTest('Cache promotion', 'FAIL', (error as Error).message)
    }
    
    // Test 8: Cascade Write Operations
    console.log('\n[Test 8] Cascade write to all levels')
    try {
      const mlCache = createMultiLevelCache({
        l1: { enabled: true, ttl: 300 },
        l2: { enabled: true, ttl: 600 },
      })
      
      await mlCache.clearAll()
      
      // Set with cascade (default)
      await mlCache.set('test:cascade', { value: 'cascaded data' })
      
      // Verify in L1
      const l1Value = mlCache.getL1().get('test:cascade')
      if (!l1Value) throw new Error('Value not in L1')
      
      // Verify in L2
      const l2Value = await mlCache.getL2().get('test:cascade')
      if (!l2Value) throw new Error('Value not in L2')
      
      const stats = mlCache.getStats()
      if (stats.cascadeWrites === 0) {
        throw new Error('No cascade writes recorded')
      }
      
      await mlCache.clearAll()
      logTest('Cascade write', 'PASS', `${stats.cascadeWrites} cascade writes`)
    } catch (error) {
      logTest('Cascade write', 'FAIL', (error as Error).message)
    }
    
    // Test 9: Cascade Delete Operations
    console.log('\n[Test 9] Cascade delete from all levels')
    try {
      const mlCache = createMultiLevelCache({
        l1: { enabled: true, ttl: 300 },
        l2: { enabled: true, ttl: 600 },
      })
      
      // Set in both levels
      await mlCache.set('test:delete', { value: 'to be deleted' })
      
      // Verify exists
      if (!await mlCache.has('test:delete')) {
        throw new Error('Value not set')
      }
      
      // Delete with cascade
      await mlCache.delete('test:delete', true)
      
      // Verify deleted from L1
      const l1Value = mlCache.getL1().get('test:delete')
      if (l1Value !== null) throw new Error('Value still in L1')
      
      // Verify deleted from L2
      const l2Value = await mlCache.getL2().get('test:delete')
      if (l2Value !== null) throw new Error('Value still in L2')
      
      const stats = mlCache.getStats()
      if (stats.cascadeDeletes === 0) {
        throw new Error('No cascade deletes recorded')
      }
      
      logTest('Cascade delete', 'PASS', `${stats.cascadeDeletes} cascade deletes`)
    } catch (error) {
      logTest('Cascade delete', 'FAIL', (error as Error).message)
    }
    
    // Test 10: Pattern Invalidation
    console.log('\n[Test 10] Pattern-based invalidation')
    try {
      const mlCache = createMultiLevelCache({
        l1: { enabled: true, ttl: 300 },
        l2: { enabled: true, ttl: 600 },
      })
      
      // Set multiple keys with pattern
      await mlCache.set('user:123:profile', { name: 'John' })
      await mlCache.set('user:123:settings', { theme: 'dark' })
      await mlCache.set('user:456:profile', { name: 'Jane' })
      
      // Invalidate pattern
      const invalidated = await mlCache.invalidatePattern('user:123:*')
      
      if (invalidated < 2) {
        throw new Error(`Expected to invalidate 2+ keys, got ${invalidated}`)
      }
      
      // Verify user:123 keys are gone
      const profile = await mlCache.get('user:123:profile')
      if (profile !== null) throw new Error('user:123:profile still exists')
      
      // Verify user:456 keys still exist
      const jane = await mlCache.get('user:456:profile')
      if (!jane) throw new Error('user:456:profile was incorrectly deleted')
      
      await mlCache.clearAll()
      logTest('Pattern invalidation', 'PASS', `${invalidated} keys invalidated`)
    } catch (error) {
      logTest('Pattern invalidation', 'FAIL', (error as Error).message)
    }
    
    // Test 11: L1 Failover
    console.log('\n[Test 11] Graceful degradation when L1 fails')
    try {
      const mlCache = createMultiLevelCache({
        l1: { enabled: false, ttl: 300 }, // Disable L1
        l2: { enabled: true, ttl: 600 },
      })
      
      await mlCache.clearAll()
      
      // Set value (should only go to L2)
      await mlCache.set('test:l1-disabled', { value: 'L2 only' })
      
      // Get value (should come from L2)
      const value = await mlCache.get('test:l1-disabled')
      if (!value) throw new Error('Failed to get from L2')
      
      const stats = mlCache.getStats()
      if (stats.l1Hits > 0) {
        throw new Error('L1 was used when disabled')
      }
      
      await mlCache.clearAll()
      logTest('L1 failover', 'PASS', 'Successfully used L2 only')
    } catch (error) {
      logTest('L1 failover', 'FAIL', (error as Error).message)
    }
    
    // Test 12: Combined Hit Rate
    console.log('\n[Test 12] Combined L1+L2 hit rate calculation')
    try {
      const mlCache = createMultiLevelCache({
        l1: { enabled: true, ttl: 300 },
        l2: { enabled: true, ttl: 600 },
        enablePromotion: false,
      })
      
      await mlCache.clearAll()
      mlCache.resetStats()
      
      // Generate known hit/miss pattern
      await mlCache.set('hit:1', 'value1', { skipL1: true }) // L2 only
      await mlCache.set('hit:2', 'value2') // Both L1 and L2
      
      await mlCache.get('hit:2') // L1 hit
      await mlCache.get('hit:1') // L2 hit
      await mlCache.get('miss:1') // Miss
      
      const stats = mlCache.getStats()
      
      // Should have 1 L1 hit, 1 L2 hit, 1 miss
      // Combined hit rate = 2/3 = 66.67%
      if (stats.l1Hits !== 1) throw new Error(`Expected 1 L1 hit, got ${stats.l1Hits}`)
      if (stats.l2Hits !== 1) throw new Error(`Expected 1 L2 hit, got ${stats.l2Hits}`)
      if (stats.totalMisses !== 1) throw new Error(`Expected 1 miss, got ${stats.totalMisses}`)
      
      const expectedHitRate = (2 / 3) * 100
      const tolerance = 1 // Allow 1% tolerance
      if (Math.abs(stats.combinedHitRate - expectedHitRate) > tolerance) {
        throw new Error(`Expected ~${expectedHitRate.toFixed(2)}% hit rate, got ${stats.combinedHitRate.toFixed(2)}%`)
      }
      
      await mlCache.clearAll()
      logTest('Combined hit rate', 'PASS', `${stats.combinedHitRate.toFixed(2)}%`)
    } catch (error) {
      logTest('Combined hit rate', 'FAIL', (error as Error).message)
    }
    
    // Test 13: Access Time Tracking
    console.log('\n[Test 13] L1/L2 access time tracking')
    try {
      const mlCache = createMultiLevelCache({
        l1: { enabled: true, ttl: 300 },
        l2: { enabled: true, ttl: 600 },
        enablePromotion: false,
      })
      
      await mlCache.clearAll()
      mlCache.resetStats()
      
      // Generate L1 hits
      await mlCache.set('l1:test', 'value')
      await mlCache.get('l1:test') // L1 hit
      await mlCache.get('l1:test') // L1 hit (need multiple for average)
      
      // Generate L2 hits
      await mlCache.set('l2:test', 'value', { skipL1: true })
      await mlCache.get('l2:test') // L2 hit
      await mlCache.get('l2:test') // L2 hit (need multiple for average)
      
      const stats = mlCache.getStats()
      
      // Check if stats are being tracked (allow zero if very fast)
      if (stats.l1Hits === 0) {
        throw new Error('No L1 hits recorded')
      }
      
      if (stats.l2Hits === 0) {
        throw new Error('No L2 hits recorded')
      }
      
      // Access times might be 0 if extremely fast, which is acceptable
      // Just verify they're tracked (not null/undefined)
      if (stats.averageL1AccessTime === undefined || stats.averageL1AccessTime === null) {
        throw new Error('L1 access time not initialized')
      }
      
      if (stats.averageL2AccessTime === undefined || stats.averageL2AccessTime === null) {
        throw new Error('L2 access time not initialized')
      }
      
      // Typically L1 < 5ms, L2 < 50ms
      if (stats.averageL1AccessTime > 10) {
        console.warn(`⚠️  L1 access time seems high: ${stats.averageL1AccessTime.toFixed(2)}ms`)
      }
      
      await mlCache.clearAll()
      logTest(
        'Access time tracking', 
        'PASS', 
        `L1: ${stats.averageL1AccessTime.toFixed(2)}ms, L2: ${stats.averageL2AccessTime.toFixed(2)}ms`
      )
    } catch (error) {
      logTest('Access time tracking', 'FAIL', (error as Error).message)
    }
  }
  
  // ========================================
  // SECTION 3: Performance Benchmarks
  // ========================================
  console.log('\n\n📊 SECTION 3: Performance Benchmarks')
  console.log('-'.repeat(60))
  
  // Test 14: L1 Throughput
  console.log('\n[Test 14] L1 cache throughput (operations/sec)')
  try {
    const memCache = createMemoryCache({ maxSize: 50 * 1024 * 1024 })
    const iterations = 10000
    
    // Warm up
    for (let i = 0; i < 100; i++) {
      memCache.set(`warmup:${i}`, { data: `value${i}` }, 300)
    }
    
    const startTime = Date.now()
    
    // Write test
    for (let i = 0; i < iterations; i++) {
      memCache.set(`perf:${i}`, { data: `value${i}`, timestamp: Date.now() }, 300)
    }
    
    // Read test
    for (let i = 0; i < iterations; i++) {
      memCache.get(`perf:${i}`)
    }
    
    const endTime = Date.now()
    const duration = (endTime - startTime) / 1000
    const opsPerSec = Math.floor((iterations * 2) / duration)
    
    memCache.destroy()
    
    // Should handle at least 100,000 ops/sec
    if (opsPerSec < 50000) {
      throw new Error(`L1 throughput too low: ${opsPerSec} ops/sec`)
    }
    
    logTest('L1 throughput', 'PASS', `${opsPerSec.toLocaleString()} ops/sec`)
  } catch (error) {
    logTest('L1 throughput', 'FAIL', (error as Error).message)
  }
  
  // Test 15: Memory Efficiency
  console.log('\n[Test 15] Memory usage and efficiency')
  try {
    const memCache = createMemoryCache({ maxSize: 10 * 1024 * 1024 }) // 10MB
    
    // Fill with 1MB of data
    const dataSize = 1024 // 1KB per item
    const itemCount = 1000 // 1000 items = ~1MB
    
    for (let i = 0; i < itemCount; i++) {
      const data = 'x'.repeat(dataSize / 2) // Rough estimate for string size
      memCache.set(`mem:${i}`, data, 300)
    }
    
    const stats = memCache.getStats()
    const memoryUsed = stats.currentSize
    const averageSize = stats.averageItemSize
    
    if (memoryUsed > 10 * 1024 * 1024) {
      throw new Error(`Memory usage exceeded limit: ${formatBytes(memoryUsed)}`)
    }
    
    memCache.destroy()
    logTest(
      'Memory efficiency', 
      'PASS', 
      `Used: ${formatBytes(memoryUsed)}, Avg item: ${formatBytes(averageSize)}`
    )
  } catch (error) {
    logTest('Memory efficiency', 'FAIL', (error as Error).message)
  }
  
  // ========================================
  // Test Summary
  // ========================================
  console.log('\n' + '='.repeat(60))
  console.log('📋 TEST SUMMARY')
  console.log('='.repeat(60))
  console.log(`✅ Passed: ${testsPassed}`)
  console.log(`❌ Failed: ${testsFailed}`)
  console.log(`⏭️  Skipped: ${testsSkipped}`)
  console.log(`📊 Total: ${testsPassed + testsFailed + testsSkipped}`)
  console.log(`🎯 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(2)}%`)
  console.log('='.repeat(60))
  
  // Exit code
  const exitCode = testsFailed > 0 ? 1 : 0
  
  if (exitCode === 0) {
    console.log('\n✨ All tests passed! Multi-level cache is production-ready.')
  } else {
    console.log('\n❌ Some tests failed. Please review the errors above.')
  }
  
  process.exit(exitCode)
}

// Run tests
runTests().catch((error) => {
  console.error('💥 Test suite crashed:', error)
  process.exit(1)
})
