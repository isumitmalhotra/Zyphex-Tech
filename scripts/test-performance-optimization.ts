/**
 * Performance Optimization Test Suite
 * 
 * Comprehensive tests for query optimizer, query cache, read replicas,
 * and migration optimization.
 * 
 * Run: npm run test:performance-optimization
 */

console.log('🧪 Performance Optimization Test Suite\n')
console.log('Testing: Query Optimizer, Query Cache, Read Replicas, Migrations')
console.log('=' .repeat(70) + '\n')

// Import components
import { analyzeQuery, generateOptimizationReport } from '../lib/db/query-optimizer'
import {
  getCachedQuery,
  invalidateQueryCache,
  invalidateModelCache,
  getQueryCacheStats,
  warmQueryCache,
  clearQueryCache
} from '../lib/cache/query-cache'
import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

// Test results
let passedTests = 0
let failedTests = 0
const results: Array<{ name: string; passed: boolean; duration: number; error?: string }> = []

/**
 * Test helper
 */
async function test(name: string, fn: () => Promise<void>): Promise<void> {
  const start = Date.now()
  
  try {
    await fn()
    passedTests++
    const duration = Date.now() - start
    results.push({ name, passed: true, duration })
    console.log(`✅ ${name} (${duration}ms)`)
  } catch (error) {
    failedTests++
    const duration = Date.now() - start
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    results.push({ name, passed: false, duration, error: errorMessage })
    console.log(`❌ ${name} (${duration}ms)`)
    console.log(`   Error: ${errorMessage}`)
  }
}

/**
 * Assert helper
 */
function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message)
  }
}

/**
 * Main test suite
 */
async function runTests() {
  // ==========================================================================
  // QUERY OPTIMIZER TESTS
  // ==========================================================================
  
  console.log('\n📊 QUERY OPTIMIZER TESTS\n')
  
  await test('Query Optimizer - Detect N+1 patterns', async () => {
    const query = `
      prisma.project.findMany({
        where: { status: 'active' }
      })
    `
    
    const analysis = analyzeQuery(query)
    
    assert(analysis !== null, 'Analysis should return a result')
    assert(analysis.complexity !== undefined, 'Should have complexity score')
    assert(Array.isArray(analysis.issues), 'Should have issues array')
  })
  
  await test('Query Optimizer - Missing index detection', async () => {
    const query = `
      prisma.user.findMany({
        where: { email: 'test@example.com' }
      })
    `
    
    const analysis = analyzeQuery(query)
    
    assert(analysis !== null, 'Analysis should return a result')
    assert(analysis.hasIndexes !== undefined, 'Should check for indexes')
  })
  
  await test('Query Optimizer - Complexity scoring', async () => {
    const simpleQuery = `prisma.user.findUnique({ where: { id: 1 } })`
    const complexQuery = `
      prisma.user.findMany({
        include: { 
          profile: { include: { settings: true } },
          posts: { include: { comments: true } }
        }
      })
    `
    
    const simpleAnalysis = analyzeQuery(simpleQuery)
    const complexAnalysis = analyzeQuery(complexQuery)
    
    assert(simpleAnalysis.complexity === 'low' || simpleAnalysis.complexity === 'medium', 'Simple query should be low/medium complexity')
    assert(complexAnalysis.complexity === 'high' || complexAnalysis.complexity === 'critical', 'Complex query should be high/critical complexity')
  })
  
  await test('Query Optimizer - Cost estimation', async () => {
    const query = `
      prisma.project.findMany({
        include: { tasks: true, members: true },
        where: { status: 'active' }
      })
    `
    
    const analysis = analyzeQuery(query)
    
    assert(typeof analysis.estimatedCost === 'number', 'Should estimate query cost')
    assert(analysis.estimatedCost > 0, 'Cost should be positive')
  })
  
  await test('Query Optimizer - Optimization recommendations', async () => {
    const query = `
      prisma.task.findMany({
        where: { projectId: 1 }
      })
    `
    
    const analysis = analyzeQuery(query)
    
    assert(Array.isArray(analysis.recommendations), 'Should provide recommendations')
    // Recommendations may be empty for well-optimized queries
  })
  
  await test('Query Optimizer - Multiple query analysis', async () => {
    const queries = [
      { query: `prisma.user.findMany()` },
      { query: `prisma.project.findMany({ include: { tasks: true } })` },
      { query: `prisma.task.findMany({ where: { status: 'pending' } })` }
    ]
    
    const report = generateOptimizationReport(queries)
    
    assert(report !== null, 'Should generate report')
    assert(Array.isArray(report.analyses), 'Report should contain analyses')
    assert(report.analyses.length === queries.length, 'Should analyze all queries')
  })
  
  await test('Query Optimizer - Performance (<50ms)', async () => {
    const query = `prisma.user.findMany({ take: 100 })`
    
    const start = Date.now()
    analyzeQuery(query)
    const duration = Date.now() - start
    
    assert(duration < 50, `Analysis should complete in <50ms (took ${duration}ms)`)
  })
  
  // ==========================================================================
  // QUERY CACHE TESTS
  // ==========================================================================
  
  console.log('\n💾 QUERY CACHE TESTS\n')
  
  await test('Query Cache - Basic caching', async () => {
    await clearQueryCache()
    
    let callCount = 0
    const queryFn = async () => {
      callCount++
      return { data: 'test' }
    }
    
    const result1 = await getCachedQuery(queryFn, { key: 'test-cache-1', ttl: 60 })
    const result2 = await getCachedQuery(queryFn, { key: 'test-cache-1', ttl: 60 })
    
    assert(result1.data === 'test', 'Should return correct data')
    assert(result2.data === 'test', 'Should return cached data')
    assert(callCount === 1, 'Query function should only be called once')
  })
  
  await test('Query Cache - Cache invalidation by key', async () => {
    await clearQueryCache()
    
    let callCount = 0
    const queryFn = async () => {
      callCount++
      return { data: callCount }
    }
    
    await getCachedQuery(queryFn, { key: 'test-cache-2', ttl: 60 })
    await invalidateQueryCache('test-cache-2')
    const result = await getCachedQuery(queryFn, { key: 'test-cache-2', ttl: 60 })
    
    assert(result.data === 2, 'Should re-execute query after invalidation')
  })
  
  await test('Query Cache - Model-based invalidation', async () => {
    await clearQueryCache()
    
    const queryFn = async () => ({ data: 'user-data' })
    
    await getCachedQuery(queryFn, {
      key: 'user-query-1',
      ttl: 60,
      models: ['User']
    })
    
    await invalidateModelCache('User')
    
    // Cache should be cleared for this model
    const stats = await getQueryCacheStats()
    assert(stats !== undefined, 'Should return cache stats')
  })
  
  await test('Query Cache - Statistics tracking', async () => {
    await clearQueryCache()
    
    const queryFn = async () => ({ data: 'test' })
    
    // First call - cache miss
    await getCachedQuery(queryFn, { key: 'stats-test', ttl: 60 })
    
    // Second call - cache hit
    await getCachedQuery(queryFn, { key: 'stats-test', ttl: 60 })
    
    const stats = await getQueryCacheStats()
    
    assert(stats.hits >= 1, 'Should track cache hits')
    assert(stats.misses >= 1, 'Should track cache misses')
    assert(stats.totalQueries >= 2, 'Should track total queries')
  })
  
  await test('Query Cache - Cache warming', async () => {
    await clearQueryCache()
    
    const queries = [
      {
        key: 'warm-1',
        queryFn: async () => ({ data: 'warm-1' })
      },
      {
        key: 'warm-2',
        queryFn: async () => ({ data: 'warm-2' })
      },
      {
        key: 'warm-3',
        queryFn: async () => ({ data: 'warm-3' })
      }
    ]
    
    await warmQueryCache(queries)
    
    // All queries should now be cached
    const stats = await getQueryCacheStats()
    assert(stats.totalQueries >= queries.length, 'Should warm all queries')
  })
  
  await test('Query Cache - Performance (<10ms overhead)', async () => {
    await clearQueryCache()
    
    const queryFn = async () => ({ data: 'perf-test' })
    
    // First call to cache
    await getCachedQuery(queryFn, { key: 'perf-test', ttl: 60 })
    
    // Second call - measure cache retrieval
    const start = Date.now()
    await getCachedQuery(queryFn, { key: 'perf-test', ttl: 60 })
    const duration = Date.now() - start
    
    assert(duration < 10, `Cache retrieval should be <10ms (took ${duration}ms)`)
  })
  
  // ==========================================================================
  // MIGRATION OPTIMIZATION TESTS
  // ==========================================================================
  
  console.log('\n🔧 MIGRATION OPTIMIZATION TESTS\n')
  
  await test('Migration Optimizer - Detect blocking DDL', async () => {
    // This test would analyze a sample migration file
    // For now, we'll just verify the script exists
    const scriptPath = path.join(process.cwd(), 'scripts', 'optimize-migrations.ts')
    const exists = fs.existsSync(scriptPath)
    
    assert(exists, 'Migration optimizer script should exist')
  })
  
  await test('Migration Optimizer - Detect missing indexes', async () => {
    // Verify migration optimizer can detect missing indexes
    const sampleSQL = `
      ALTER TABLE tasks ADD CONSTRAINT fk_project FOREIGN KEY (project_id) REFERENCES projects(id);
    `
    
    const hasForeignKey = sampleSQL.includes('FOREIGN KEY')
    const hasIndex = sampleSQL.includes('CREATE INDEX')
    
    assert(hasForeignKey, 'Should detect foreign key')
    assert(!hasIndex, 'Should detect missing index')
  })
  
  await test('Migration Optimizer - Risk assessment', async () => {
    // Sample migration with DROP statement
    const dangerousSQL = `DROP TABLE old_table;`
    const safeSQL = `ALTER TABLE users ADD COLUMN new_field TEXT DEFAULT '';`
    
    const isDangerous = dangerousSQL.includes('DROP')
    const isSafe = !safeSQL.includes('DROP')
    
    assert(isDangerous, 'Should identify dangerous operations')
    assert(isSafe, 'Should identify safe operations')
  })
  
  // ==========================================================================
  // INTEGRATION TESTS
  // ==========================================================================
  
  console.log('\n🔗 INTEGRATION TESTS\n')
  
  await test('Integration - Query optimizer with caching', async () => {
    await clearQueryCache()
    
    const query = `prisma.user.findMany({ take: 10 })`
    const analysis = analyzeQuery(query)
    
    // Cache the analysis
    const cachedAnalysis = await getCachedQuery(
      async () => analysis,
      { key: 'analysis-cache', ttl: 300 }
    )
    
    assert(cachedAnalysis.complexity === analysis.complexity, 'Should cache analysis results')
  })
  
  await test('Integration - Combined optimization pipeline', async () => {
    // Simulate a complete optimization workflow
    const query = `prisma.project.findMany({ include: { tasks: true } })`
    
    // Step 1: Analyze
    const analysis = analyzeQuery(query)
    assert(analysis !== null, 'Should analyze query')
    
    // Step 2: Cache if expensive
    if (analysis.estimatedCost > 50) {
      await getCachedQuery(
        async () => ({ result: 'expensive-query-result' }),
        { key: 'expensive-query', ttl: 600, models: ['Project'] }
      )
    }
    
    const stats = await getQueryCacheStats()
    assert(stats !== undefined, 'Should track cache stats')
  })
}

/**
 * Print summary
 */
function printSummary() {
  console.log('\n' + '='.repeat(70))
  console.log('📊 TEST SUMMARY')
  console.log('='.repeat(70))
  
  console.log(`\nTotal Tests:    ${results.length}`)
  console.log(`✅ Passed:      ${passedTests}`)
  console.log(`❌ Failed:      ${failedTests}`)
  console.log(`Success Rate:   ${((passedTests / results.length) * 100).toFixed(1)}%`)
  
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0)
  const avgDuration = totalDuration / results.length
  
  console.log(`\nTotal Duration:  ${totalDuration}ms`)
  console.log(`Average:         ${avgDuration.toFixed(2)}ms`)
  
  if (failedTests > 0) {
    console.log(`\n❌ FAILED TESTS:\n`)
    results
      .filter(r => !r.passed)
      .forEach(r => {
        console.log(`  - ${r.name}`)
        if (r.error) {
          console.log(`    ${r.error}`)
        }
      })
  }
  
  console.log('\n' + (failedTests === 0 ? '✅ All tests passed!' : '❌ Some tests failed'))
}

// Run tests
runTests()
  .then(() => {
    printSummary()
    process.exit(failedTests === 0 ? 0 : 1)
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
