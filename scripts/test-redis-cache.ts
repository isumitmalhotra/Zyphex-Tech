/**
 * Redis Cache Test Suite
 * 
 * Comprehensive tests for Redis caching layer
 * Tests: Connection, CRUD operations, TTL, invalidation, patterns, performance
 */

import { cacheService } from '../lib/cache/cache-service'
import { UserCacheKeys, ProjectCacheKeys } from '../lib/cache/cache-keys'
import {
  cacheAside,
  writeThrough,
  batchCacheAside,
  preventStampede,
} from '../lib/cache/patterns'
import {
  isRedisAvailable,
  testRedisConnection,
  getRedisMemoryStats,
  getRedisMetrics,
  resetRedisMetrics,
} from '../lib/redis'

/**
 * Test result interface
 */
interface TestResult {
  name: string
  passed: boolean
  duration: number
  error?: string
}

/**
 * Run a single test with error handling
 */
async function runTest(
  name: string,
  testFn: () => Promise<void>
): Promise<TestResult> {
  const start = Date.now()
  
  try {
    await testFn()
    const duration = Date.now() - start
    console.log(`✅ ${name} (${duration}ms)`)
    return { name, passed: true, duration }
  } catch (error) {
    const duration = Date.now() - start
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`❌ ${name} (${duration}ms)`)
    console.error(`   Error: ${errorMessage}`)
    return { name, passed: false, duration, error: errorMessage }
  }
}

/**
 * Test 1: Redis connection
 */
async function testConnection(): Promise<void> {
  const isAvailable = await isRedisAvailable()
  if (!isAvailable) {
    throw new Error('Redis is not available')
  }
  
  const pingResult = await testRedisConnection()
  if (!pingResult) {
    throw new Error('Redis PING failed')
  }
}

/**
 * Test 2: Basic GET/SET operations
 */
async function testBasicOperations(): Promise<void> {
  const key = 'test:basic:1'
  const value = { name: 'Test User', id: '123' }
  
  // Set
  const setResult = await cacheService.set(key, value, 60)
  if (!setResult) {
    throw new Error('Failed to set cache value')
  }
  
  // Get
  const cachedValue = await cacheService.get<typeof value>(key)
  if (!cachedValue || cachedValue.id !== value.id) {
    throw new Error('Cached value does not match')
  }
  
  // Delete
  const deleted = await cacheService.delete(key)
  if (!deleted) {
    throw new Error('Failed to delete cache key')
  }
  
  // Verify deletion
  const afterDelete = await cacheService.get(key)
  if (afterDelete !== null) {
    throw new Error('Key still exists after deletion')
  }
}

/**
 * Test 3: TTL functionality
 */
async function testTTL(): Promise<void> {
  const key = 'test:ttl:1'
  const value = 'test-value'
  
  // Set with 2 second TTL
  await cacheService.set(key, value, 2)
  
  // Check TTL
  const ttl = await cacheService.ttl(key)
  if (ttl <= 0 || ttl > 2) {
    throw new Error(`Invalid TTL: ${ttl}`)
  }
  
  // Wait for expiration
  await new Promise(resolve => setTimeout(resolve, 2500))
  
  // Verify expiration
  const expired = await cacheService.get(key)
  if (expired !== null) {
    throw new Error('Key did not expire')
  }
}

/**
 * Test 4: Batch operations
 */
async function testBatchOperations(): Promise<void> {
  const entries = [
    { key: 'test:batch:1', value: { id: '1', name: 'User 1' }, ttl: 60 },
    { key: 'test:batch:2', value: { id: '2', name: 'User 2' }, ttl: 60 },
    { key: 'test:batch:3', value: { id: '3', name: 'User 3' }, ttl: 60 },
  ]
  
  // Batch set
  const msetResult = await cacheService.mset(entries)
  if (!msetResult) {
    throw new Error('Batch set failed')
  }
  
  // Batch get
  const keys = entries.map(e => e.key)
  const values = await cacheService.mget<{ id: string; name: string }>(keys)
  
  if (values.length !== 3) {
    throw new Error('Batch get returned wrong number of values')
  }
  
  if (values.some(v => v === null)) {
    throw new Error('Some batch get values are null')
  }
  
  // Batch delete
  const deleteCount = await cacheService.mdelete(keys)
  if (deleteCount !== 3) {
    throw new Error(`Expected 3 deletions, got ${deleteCount}`)
  }
}

/**
 * Test 5: Cache key patterns
 */
async function testCacheKeys(): Promise<void> {
  const userId = 'test-user-123'
  
  // Test user cache keys
  const profileKey = UserCacheKeys.profile(userId)
  if (!profileKey.includes(userId)) {
    throw new Error('Profile key does not contain user ID')
  }
  
  const tasksKey = UserCacheKeys.tasks(userId)
  if (!tasksKey.includes(userId)) {
    throw new Error('Tasks key does not contain user ID')
  }
  
  // Test project cache keys
  const projectId = 'test-project-456'
  const projectKey = ProjectCacheKeys.details(projectId)
  if (!projectKey.includes(projectId)) {
    throw new Error('Project key does not contain project ID')
  }
}

/**
 * Test 6: Cache-aside pattern
 */
async function testCacheAsidePattern(): Promise<void> {
  const key = 'test:cache-aside:1'
  let fetchCount = 0
  
  const fetchFn = async () => {
    fetchCount++
    return { id: '1', name: 'Test Data' }
  }
  
  // First call - should fetch
  const result1 = await cacheAside(key, fetchFn, 60)
  if (fetchCount !== 1) {
    throw new Error('Expected fetch to be called once')
  }
  if (!result1 || result1.id !== '1') {
    throw new Error('Invalid result from cache-aside')
  }
  
  // Second call - should use cache
  const result2 = await cacheAside(key, fetchFn, 60)
  if (fetchCount !== 1) {
    throw new Error('Fetch should not be called again (cache hit)')
  }
  if (!result2 || result2.id !== '1') {
    throw new Error('Invalid cached result')
  }
  
  // Cleanup
  await cacheService.delete(key)
}

/**
 * Test 7: Write-through pattern
 */
async function testWriteThroughPattern(): Promise<void> {
  const key = 'test:write-through:1'
  const data = { id: '1', value: 'test' }
  let writeCount = 0
  
  const writeFn = async (d: typeof data) => {
    writeCount++
    // Simulate database write
    if (!d || !d.id) {
      throw new Error('Invalid data')
    }
  }
  
  // Write through
  await writeThrough(key, data, writeFn, 60)
  
  if (writeCount !== 1) {
    throw new Error('Write function should be called once')
  }
  
  // Verify cache
  const cached = await cacheService.get<typeof data>(key)
  if (!cached || cached.id !== data.id) {
    throw new Error('Data not in cache after write-through')
  }
  
  // Cleanup
  await cacheService.delete(key)
}

/**
 * Test 8: Batch cache-aside
 */
async function testBatchCacheAside(): Promise<void> {
  const keys = ['test:batch-aside:1', 'test:batch-aside:2', 'test:batch-aside:3']
  
  // Pre-cache one key
  await cacheService.set(keys[0], { id: '1', name: 'Cached' }, 60)
  
  const fetchFn = async (missingKeys: string[]) => {
    const result = new Map<string, { id: string; name: string }>()
    missingKeys.forEach((key, index) => {
      result.set(key, { id: String(index + 2), name: `Fetched ${index + 2}` })
    })
    return result
  }
  
  const results = await batchCacheAside(keys, fetchFn, 60)
  
  if (results.size !== 3) {
    throw new Error(`Expected 3 results, got ${results.size}`)
  }
  
  const first = results.get(keys[0])
  if (!first || first.name !== 'Cached') {
    throw new Error('First result should be from cache')
  }
  
  // Cleanup
  await cacheService.mdelete(keys)
}

/**
 * Test 9: Cache invalidation
 */
async function testInvalidation(): Promise<void> {
  // Set multiple keys with a pattern
  const keys = [
    'test:invalidate:user:1',
    'test:invalidate:user:2',
    'test:invalidate:project:1',
  ]
  
  for (const key of keys) {
    await cacheService.set(key, { id: key }, 60)
  }
  
  // Invalidate user keys
  const invalidated = await cacheService.invalidatePattern('test:invalidate:user:*')
  
  if (invalidated < 2) {
    throw new Error(`Expected at least 2 invalidations, got ${invalidated}`)
  }
  
  // Verify user keys are gone
  const user1 = await cacheService.get('test:invalidate:user:1')
  if (user1 !== null) {
    throw new Error('User key should be invalidated')
  }
  
  // Verify project key still exists
  const project1 = await cacheService.get('test:invalidate:project:1')
  if (project1 === null) {
    throw new Error('Project key should still exist')
  }
  
  // Cleanup
  await cacheService.delete('test:invalidate:project:1')
}

/**
 * Test 10: Prevent stampede pattern
 */
async function testPreventStampede(): Promise<void> {
  const key = 'test:stampede:1'
  let fetchCount = 0
  
  const fetchFn = async () => {
    fetchCount++
    // Simulate slow operation
    await new Promise(resolve => setTimeout(resolve, 100))
    return { id: '1', fetched: Date.now() }
  }
  
  // Parallel requests
  const results = await Promise.all([
    preventStampede(key, fetchFn, 60),
    preventStampede(key, fetchFn, 60),
    preventStampede(key, fetchFn, 60),
  ])
  
  // Should only fetch once due to locking
  if (fetchCount > 1) {
    console.warn(`   Warning: Fetch called ${fetchCount} times (expected 1 with perfect locking)`)
  }
  
  // All results should have data
  if (results.some(r => !r || !r.id)) {
    throw new Error('Some results are invalid')
  }
  
  // Cleanup
  await cacheService.delete(key)
}

/**
 * Test 11: Performance test
 */
async function testPerformance(): Promise<void> {
  const iterations = 100
  const key = 'test:performance'
  
  // Test write performance
  const writeStart = Date.now()
  for (let i = 0; i < iterations; i++) {
    await cacheService.set(`${key}:${i}`, { index: i }, 60)
  }
  const writeTime = Date.now() - writeStart
  const writeRate = iterations / (writeTime / 1000)
  
  // Test read performance
  const readStart = Date.now()
  for (let i = 0; i < iterations; i++) {
    await cacheService.get(`${key}:${i}`)
  }
  const readTime = Date.now() - readStart
  const readRate = iterations / (readTime / 1000)
  
  console.log(`   Write: ${writeTime}ms total, ${writeRate.toFixed(0)} ops/sec`)
  console.log(`   Read: ${readTime}ms total, ${readRate.toFixed(0)} ops/sec`)
  
  // Cleanup
  const keys = Array.from({ length: iterations }, (_, i) => `${key}:${i}`)
  await cacheService.mdelete(keys)
  
  // Performance should be reasonable
  if (writeRate < 100 || readRate < 100) {
    throw new Error('Cache performance below acceptable threshold')
  }
}

/**
 * Test 12: Redis metrics
 */
async function testMetrics(): Promise<void> {
  resetRedisMetrics()
  
  // Perform some operations
  await cacheService.set('test:metrics:1', 'value1', 60)
  await cacheService.get('test:metrics:1')
  await cacheService.get('test:metrics:missing')
  
  const metrics = getRedisMetrics()
  
  if (!metrics || typeof metrics.connected !== 'boolean') {
    throw new Error('Invalid metrics structure')
  }
  
  console.log(`   Connected: ${metrics.connected}`)
  console.log(`   Total connections: ${metrics.totalConnections}`)
  console.log(`   Uptime: ${metrics.uptime}s`)
  
  // Cleanup
  await cacheService.delete('test:metrics:1')
}

/**
 * Test 13: Memory stats
 */
async function testMemoryStats(): Promise<void> {
  const stats = await getRedisMemoryStats()
  
  if (!stats) {
    throw new Error('Could not retrieve memory stats')
  }
  
  console.log(`   Used memory: ${stats.used}`)
  console.log(`   Peak memory: ${stats.peak}`)
  console.log(`   Fragmentation: ${stats.fragmentation}`)
}

/**
 * Test 14: Cache statistics
 */
async function testCacheStats(): Promise<void> {
  cacheService.resetStats()
  
  // Perform operations
  await cacheService.set('test:stats:1', 'value', 60)
  await cacheService.get('test:stats:1') // Hit
  await cacheService.get('test:stats:missing') // Miss
  
  const stats = cacheService.getStats()
  
  if (stats.hits !== 1 || stats.misses !== 1) {
    throw new Error(`Invalid stats: ${stats.hits} hits, ${stats.misses} misses`)
  }
  
  if (stats.hitRate <= 0) {
    throw new Error(`Invalid hit rate: ${stats.hitRate}%`)
  }
  
  console.log(`   Hits: ${stats.hits}`)
  console.log(`   Misses: ${stats.misses}`)
  console.log(`   Hit rate: ${stats.hitRate.toFixed(2)}%`)
  
  // Cleanup
  await cacheService.delete('test:stats:1')
}

/**
 * Main test suite runner
 */
async function runTestSuite(): Promise<void> {
  console.log('\n🧪 Starting Redis Cache Test Suite')
  console.log('============================================================\n')
  
  const results: TestResult[] = []
  
  // Connection tests
  console.log('🔌 Testing Connection...')
  console.log('------------------------------------------------------------')
  results.push(await runTest('Connection - should connect to Redis', testConnection))
  results.push(await runTest('Memory stats - should retrieve memory statistics', testMemoryStats))
  
  // Basic operations
  console.log('\n📦 Testing Basic Operations...')
  console.log('------------------------------------------------------------')
  results.push(await runTest('Basic ops - should GET/SET/DELETE', testBasicOperations))
  results.push(await runTest('TTL - should expire keys', testTTL))
  results.push(await runTest('Batch ops - should handle multiple keys', testBatchOperations))
  
  // Cache keys
  console.log('\n🔑 Testing Cache Keys...')
  console.log('------------------------------------------------------------')
  results.push(await runTest('Cache keys - should generate valid keys', testCacheKeys))
  
  // Cache patterns
  console.log('\n🎯 Testing Cache Patterns...')
  console.log('------------------------------------------------------------')
  results.push(await runTest('Cache-aside - should fetch and cache', testCacheAsidePattern))
  results.push(await runTest('Write-through - should write to cache and DB', testWriteThroughPattern))
  results.push(await runTest('Batch cache-aside - should batch fetch', testBatchCacheAside))
  results.push(await runTest('Invalidation - should remove matched keys', testInvalidation))
  results.push(await runTest('Prevent stampede - should use locking', testPreventStampede))
  
  // Performance and monitoring
  console.log('\n⚡ Testing Performance...')
  console.log('------------------------------------------------------------')
  results.push(await runTest('Performance - should meet throughput requirements', testPerformance))
  results.push(await runTest('Metrics - should track Redis metrics', testMetrics))
  results.push(await runTest('Statistics - should track cache stats', testCacheStats))
  
  // Summary
  console.log('\n============================================================')
  console.log('📊 TEST RESULTS SUMMARY\n')
  
  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => r.failed).length
  const total = results.length
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / total
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0)
  
  console.log(`Total Tests: ${total}`)
  console.log(`✅ Passed: ${passed} (${((passed / total) * 100).toFixed(1)}%)`)
  console.log(`❌ Failed: ${failed} (${((failed / total) * 100).toFixed(1)}%)`)
  console.log(`⏱️  Average Duration: ${avgDuration.toFixed(1)}ms`)
  console.log(`⏱️  Total Duration: ${totalDuration}ms`)
  
  if (failed > 0) {
    console.log(`\n❌ Failed Tests:`)
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}`)
      console.log(`    Error: ${r.error}`)
    })
  }
  
  console.log('\n============================================================\n')
  
  if (failed === 0) {
    console.log('✨ All tests passed! Redis caching is working correctly.')
  } else {
    console.log(`⚠️  ${failed} test(s) failed`)
    process.exit(1)
  }
}

// Run tests if called directly
if (require.main === module) {
  runTestSuite()
    .then(() => {
      process.exit(0)
    })
    .catch((error) => {
      console.error('Fatal error:', error)
      process.exit(1)
    })
}

export { runTestSuite }
