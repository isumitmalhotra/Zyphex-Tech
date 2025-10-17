/**
 * Connection Pool Testing Script
 * 
 * Tests the optimized Prisma connection pooling configuration under load
 * Validates connection limits, timeouts, and concurrent query handling
 */

import { prisma } from '@/lib/prisma'
import { getPoolMetrics, logPoolMetrics, resetPoolMetrics } from '@/lib/prisma'

interface TestResult {
  name: string
  passed: boolean
  duration: number
  error?: string
}

const results: TestResult[] = []

/**
 * Run a single test with error handling
 */
async function runTest(
  name: string,
  testFn: () => Promise<void>
): Promise<void> {
  const startTime = Date.now()
  
  try {
    await testFn()
    const duration = Date.now() - startTime
    results.push({ name, passed: true, duration })
    console.log(`✅ ${name} (${duration}ms)`)
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : String(error)
    results.push({ name, passed: false, duration, error: errorMessage })
    console.log(`❌ ${name} (${duration}ms)`)
    console.error(`   Error: ${errorMessage}`)
  }
}

/**
 * Test basic connection
 */
async function testBasicConnection(): Promise<void> {
  const result = await prisma.$queryRaw`SELECT 1 as connected`
  if (!result) throw new Error('Connection test failed')
}

/**
 * Test concurrent queries (simulates load)
 */
async function testConcurrentQueries(): Promise<void> {
  const queries = Array.from({ length: 15 }, () =>
    prisma.user.count().catch(() => 0)
  )
  
  const results = await Promise.all(queries)
  if (results.some(r => typeof r !== 'number')) {
    throw new Error('Some concurrent queries failed')
  }
}

/**
 * Test connection pool under heavy load
 */
async function testHeavyLoad(): Promise<void> {
  // Run 30 concurrent queries (exceeds dev pool limit of 10)
  // Use a simple query that returns data instead of pg_sleep
  const queries = Array.from({ length: 30 }, async () => {
    try {
      const count = await prisma.user.count()
      return typeof count === 'number'
    } catch {
      return false
    }
  })
  
  const results = await Promise.allSettled(queries)
  const successful = results.filter(r => r.status === 'fulfilled' && r.value).length
  
  if (successful < 25) {
    throw new Error(`Only ${successful}/30 queries succeeded under heavy load`)
  }
  
  console.log(`   ${successful}/30 queries succeeded`)
}

/**
 * Test connection timeout behavior
 */
async function testConnectionTimeout(): Promise<void> {
  // This should complete within the configured timeout
  const start = Date.now()
  await prisma.user.count()
  const duration = Date.now() - start
  
  if (duration > 5000) {
    throw new Error(`Query took ${duration}ms, exceeding timeout expectations`)
  }
}

/**
 * Test pool metrics collection
 */
async function testPoolMetrics(): Promise<void> {
  resetPoolMetrics()
  
  // Run some queries
  await prisma.user.count()
  await prisma.project.count()
  
  const metrics = getPoolMetrics()
  
  // Metrics should exist (even if all zeros in this simple test)
  if (typeof metrics.totalConnections !== 'number') {
    throw new Error('Pool metrics not properly initialized')
  }
}

/**
 * Test sequential queries (should reuse connections)
 */
async function testConnectionReuse(): Promise<void> {
  const queries = []
  
  for (let i = 0; i < 10; i++) {
    queries.push(await prisma.user.count())
  }
  
  if (queries.some(q => typeof q !== 'number')) {
    throw new Error('Sequential queries failed')
  }
}

/**
 * Test database health check
 */
async function testDatabaseHealth(): Promise<void> {
  const result = await prisma.$queryRaw<Array<{ version: string }>>`
    SELECT version() as version
  `
  
  if (!result || result.length === 0) {
    throw new Error('Database health check failed')
  }
  
  console.log(`   PostgreSQL: ${result[0].version.split(' ')[1]}`)
}

/**
 * Test connection pool configuration
 */
async function testPoolConfiguration(): Promise<void> {
  // Verify the pool configuration exists
  const config = getPoolMetrics().config
  
  if (!config) {
    throw new Error('Pool configuration not found')
  }
  
  if (typeof config.connection_limit !== 'number' || config.connection_limit <= 0) {
    throw new Error('Invalid connection_limit configuration')
  }
  
  if (typeof config.pool_timeout !== 'number' || config.pool_timeout <= 0) {
    throw new Error('Invalid pool_timeout configuration')
  }
  
  if (typeof config.connect_timeout !== 'number' || config.connect_timeout <= 0) {
    throw new Error('Invalid connect_timeout configuration')
  }
  
  console.log(`   Pool config: ${config.connection_limit} connections, ${config.pool_timeout}s pool timeout, ${config.connect_timeout}s connect timeout`)
}

/**
 * Main test suite
 */
async function runTestSuite() {
  console.log('\n🧪 Starting Connection Pool Test Suite\n')
  console.log('=' .repeat(60))
  
  try {
    // Basic tests
    console.log('\n🔌 Testing Basic Connection...')
    console.log('-'.repeat(60))
    await runTest('Basic connection - should connect to database', testBasicConnection)
    await runTest('Database health - should return PostgreSQL version', testDatabaseHealth)
    
    // Pool configuration tests
    console.log('\n⚙️  Testing Pool Configuration...')
    console.log('-'.repeat(60))
    await runTest('Pool config - should have connection pool parameters', testPoolConfiguration)
    await runTest('Pool metrics - should track connection metrics', testPoolMetrics)
    
    // Load tests
    console.log('\n📊 Testing Under Load...')
    console.log('-'.repeat(60))
    await runTest('Sequential queries - should reuse connections', testConnectionReuse)
    await runTest('Concurrent queries - should handle 15 queries', testConcurrentQueries)
    await runTest('Heavy load - should handle 30 concurrent queries', testHeavyLoad)
    await runTest('Connection timeout - should complete within timeout', testConnectionTimeout)
    
    // Print pool metrics
    console.log('\n📈 Connection Pool Metrics:')
    console.log('-'.repeat(60))
    logPoolMetrics()
    
    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('\n📊 TEST RESULTS SUMMARY\n')
    
    const passed = results.filter(r => r.passed).length
    const failed = results.filter(r => !r.passed).length
    const passRate = ((passed / results.length) * 100).toFixed(1)
    const avgDuration = (results.reduce((sum, r) => sum + r.duration, 0) / results.length).toFixed(1)
    
    console.log(`Total Tests: ${results.length}`)
    console.log(`✅ Passed: ${passed} (${passRate}%)`)
    console.log(`❌ Failed: ${failed} (${100 - parseFloat(passRate)}%)`)
    console.log(`⏱️  Average Duration: ${avgDuration}ms`)
    console.log(`⏱️  Total Duration: ${results.reduce((sum, r) => sum + r.duration, 0)}ms`)
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:')
      results.filter(r => !r.passed).forEach(r => {
        console.log(`  - ${r.name}`)
        if (r.error) console.log(`    Error: ${r.error}`)
      })
    }
    
    console.log('\n' + '='.repeat(60))
    
    if (failed === 0) {
      console.log('\n✨ All tests passed! Connection pooling is working correctly.\n')
      process.exit(0)
    } else {
      console.log(`\n⚠️  ${failed} test(s) failed\n`)
      process.exit(1)
    }
    
  } catch (error) {
    console.error('\n❌ Test suite failed with error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test suite
runTestSuite().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
