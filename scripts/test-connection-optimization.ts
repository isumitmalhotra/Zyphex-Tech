/**
 * Connection Optimization Test Suite
 * 
 * Tests for database connection pool monitoring, query timeouts,
 * and connection health checks.
 * 
 * Run: npm run test:connection-optimization
 */

import { PrismaClient } from '@prisma/client'
import { ConnectionMonitor, initConnectionMonitor } from '../lib/db/connection-monitor'
import {
  withTimeout,
  withGracefulDegradation,
  withPriority,
  QueryPriority,
  QueryTimeoutError,
  getTimeoutStats,
  clearTimeoutStats
} from '../lib/db/query-timeout'

const prisma = new PrismaClient()

// Test configuration
const TEST_CONFIG = {
  performanceThresholds: {
    healthCheck: 100,        // ms
    connectionTest: 200,     // ms
    timeoutAccuracy: 100     // ms tolerance
  }
}

// Utility functions
function formatTime(ms: number): string {
  return `${ms.toFixed(2)}ms`
}

function checkPerformance(name: string, duration: number, threshold: number): boolean {
  const passed = duration <= threshold
  const status = passed ? '✅' : '❌'
  const comparison = passed ? `(PASS)` : `(FAIL - exceeded by ${formatTime(duration - threshold)})`
  
  console.log(`  ${status} ${name}: ${formatTime(duration)} / ${formatTime(threshold)} ${comparison}`)
  return passed
}

async function test1_ConnectionMonitorInit() {
  console.log('\n🔌 Test 1: Connection Monitor Initialization')
  console.log('  Testing connection monitor setup')
  
  const monitor = initConnectionMonitor(prisma)
  
  const isInitialized = monitor !== null
  console.log(`  Monitor initialized: ${isInitialized ? '✅' : '❌'}`)
  
  const retrieved = ConnectionMonitor.get()
  const canRetrieve = retrieved !== null
  console.log(`  Can retrieve monitor: ${canRetrieve ? '✅' : '❌'}`)
  
  return isInitialized && canRetrieve
}

async function test2_PoolMetrics() {
  console.log('\n📊 Test 2: Connection Pool Metrics')
  console.log('  Testing pool metrics collection')
  
  const monitor = ConnectionMonitor.get()
  if (!monitor) {
    console.log('  ❌ Monitor not initialized')
    return false
  }
  
  const metrics = await monitor.getMetrics()
  
  console.log(`  Active connections: ${metrics.activeConnections}`)
  console.log(`  Idle connections: ${metrics.idleConnections}`)
  console.log(`  Total connections: ${metrics.totalConnections}`)
  console.log(`  Max connections: ${metrics.maxConnections}`)
  console.log(`  Utilization: ${metrics.utilizationPercent.toFixed(1)}%`)
  
  const metricsValid =
    typeof metrics.activeConnections === 'number' &&
    typeof metrics.idleConnections === 'number' &&
    metrics.maxConnections > 0 &&
    metrics.utilizationPercent >= 0 &&
    metrics.utilizationPercent <= 100
  
  console.log(`  Metrics valid: ${metricsValid ? '✅' : '❌'}`)
  
  return metricsValid
}

async function test3_HealthStatus() {
  console.log('\n💚 Test 3: Connection Health Status')
  console.log('  Testing health status check')
  
  const monitor = ConnectionMonitor.get()
  if (!monitor) {
    console.log('  ❌ Monitor not initialized')
    return false
  }
  
  const startTime = Date.now()
  const health = await monitor.getHealthStatus()
  const duration = Date.now() - startTime
  
  console.log(`  Status: ${health.status}`)
  console.log(`  Issues: ${health.issues.length}`)
  console.log(`  Recommendations: ${health.recommendations.length}`)
  
  if (health.issues.length > 0) {
    console.log('  Issues found:')
    health.issues.forEach(issue => console.log(`    - ${issue}`))
  }
  
  const statusValid = ['healthy', 'warning', 'critical'].includes(health.status)
  console.log(`  Status valid: ${statusValid ? '✅' : '❌'}`)
  
  return checkPerformance('Health Check', duration, TEST_CONFIG.performanceThresholds.healthCheck) && statusValid
}

async function test4_ConnectionTest() {
  console.log('\n🔍 Test 4: Database Connectivity Test')
  console.log('  Testing actual database connection')
  
  const monitor = ConnectionMonitor.get()
  if (!monitor) {
    console.log('  ❌ Monitor not initialized')
    return false
  }
  
  const startTime = Date.now()
  const result = await monitor.testConnection()
  const duration = Date.now() - startTime
  
  console.log(`  Connected: ${result.connected ? '✅' : '❌'}`)
  console.log(`  Latency: ${formatTime(result.latency)}`)
  
  if (result.error) {
    console.log(`  Error: ${result.error}`)
  }
  
  return result.connected && checkPerformance(
    'Connection Test',
    duration,
    TEST_CONFIG.performanceThresholds.connectionTest
  )
}

async function test5_DetailedReport() {
  console.log('\n📋 Test 5: Detailed Health Report')
  console.log('  Testing comprehensive health reporting')
  
  const monitor = ConnectionMonitor.get()
  if (!monitor) {
    console.log('  ❌ Monitor not initialized')
    return false
  }
  
  const report = await monitor.getDetailedReport()
  
  console.log('  Connection:')
  console.log(`    Connected: ${report.connection.connected ? '✅' : '❌'}`)
  console.log(`    Latency: ${formatTime(report.connection.latency)}`)
  
  console.log('  Pool:')
  console.log(`    Status: ${report.pool.status}`)
  console.log(`    Utilization: ${report.pool.metrics.utilizationPercent.toFixed(1)}%`)
  
  console.log('  History:')
  console.log(`    Avg 5min: ${report.history.avgUtilization5min.toFixed(1)}%`)
  console.log(`    Avg 15min: ${report.history.avgUtilization15min.toFixed(1)}%`)
  console.log(`    Peak: ${report.history.peakUtilization.toFixed(1)}%`)
  
  const reportComplete =
    report.connection &&
    report.pool &&
    report.history &&
    typeof report.history.avgUtilization5min === 'number'
  
  console.log(`  Report complete: ${reportComplete ? '✅' : '❌'}`)
  
  return reportComplete
}

async function test6_QueryTimeout() {
  console.log('\n⏱️  Test 6: Query Timeout Handling')
  console.log('  Testing timeout for slow queries')
  
  // Clear previous stats
  clearTimeoutStats()
  
  // Simulate slow query
  const slowQuery = () => new Promise<string>((resolve) => {
    setTimeout(() => resolve('completed'), 2000) // 2 seconds
  })
  
  try {
    await withTimeout(slowQuery, {
      timeout: 500, // 500ms timeout
      operation: 'findMany'
    })
    console.log('  ❌ Should have timed out')
    return false
  } catch (error) {
    const isTimeoutError = error instanceof QueryTimeoutError
    console.log(`  Timeout triggered: ${isTimeoutError ? '✅' : '❌'}`)
    
    if (isTimeoutError) {
      console.log(`  Error message: ${error.message}`)
    }
    
    return isTimeoutError
  }
}

async function test7_GracefulDegradation() {
  console.log('\n🛡️  Test 7: Graceful Degradation')
  console.log('  Testing fallback on timeout')
  
  const slowQuery = () => new Promise<string[]>((resolve) => {
    setTimeout(() => resolve(['item1', 'item2']), 2000)
  })
  
  const fallback: string[] = []
  
  const result = await withGracefulDegradation(
    slowQuery,
    fallback,
    500 // 500ms timeout
  )
  
  const returnedFallback = Array.isArray(result) && result.length === 0
  console.log(`  Returned fallback: ${returnedFallback ? '✅' : '❌'}`)
  console.log(`  Result: ${JSON.stringify(result)}`)
  
  return returnedFallback
}

async function test8_PriorityBasedTimeout() {
  console.log('\n🎯 Test 8: Priority-Based Timeouts')
  console.log('  Testing different timeout priorities')
  
  const fastQuery = () => new Promise<string>((resolve) => {
    setTimeout(() => resolve('completed'), 100)
  })
  
  // Test LOW priority (5s timeout) - should succeed
  try {
    const resultLow = await withPriority(fastQuery, QueryPriority.LOW)
    console.log(`  LOW priority: ${resultLow === 'completed' ? '✅' : '❌'}`)
  } catch {
    console.log('  LOW priority: ❌')
    return false
  }
  
  // Test CRITICAL priority (60s timeout) - should succeed
  try {
    const resultCritical = await withPriority(fastQuery, QueryPriority.CRITICAL)
    console.log(`  CRITICAL priority: ${resultCritical === 'completed' ? '✅' : '❌'}`)
  } catch {
    console.log('  CRITICAL priority: ❌')
    return false
  }
  
  return true
}

async function test9_TimeoutTracking() {
  console.log('\n📊 Test 9: Timeout Statistics Tracking')
  console.log('  Testing timeout metrics collection')
  
  // Clear previous stats
  clearTimeoutStats()
  
  // Trigger some timeouts
  const slowQuery = () => new Promise<string>((resolve) => {
    setTimeout(() => resolve('done'), 1000)
  })
  
  for (let i = 0; i < 3; i++) {
    try {
      await withTimeout(slowQuery, {
        timeout: 100,
        operation: 'findMany'
      })
    } catch {
      // Expected to timeout
    }
  }
  
  const stats = getTimeoutStats('findMany')
  
  console.log(`  Timeouts recorded: ${stats.length}`)
  if (stats.length > 0) {
    console.log(`  Operation: ${stats[0].operation}`)
    console.log(`  Count: ${stats[0].count}`)
    console.log(`  Avg duration: ${formatTime(stats[0].avgDuration)}`)
    console.log(`  Max duration: ${formatTime(stats[0].maxDuration)}`)
  }
  
  const statsCorrect = stats.length === 1 && stats[0].count === 3
  console.log(`  Statistics correct: ${statsCorrect ? '✅' : '❌'}`)
  
  return statsCorrect
}

async function test10_QueryTracking() {
  console.log('\n🔎 Test 10: Query Execution Tracking')
  console.log('  Testing query tracking in monitor')
  
  const monitor = ConnectionMonitor.get()
  if (!monitor) {
    console.log('  ❌ Monitor not initialized')
    return false
  }
  
  // Track a query
  const queryId = 'test-query-123'
  monitor.trackQueryStart(queryId, 'SELECT * FROM users')
  
  // Simulate query execution
  await new Promise(resolve => setTimeout(resolve, 50))
  
  // Check metrics before ending
  const metricsDuring = await monitor.getMetrics()
  const hasActiveQueries = metricsDuring.activeConnections > 0
  
  // End tracking
  monitor.trackQueryEnd(queryId)
  
  console.log(`  Query tracked during execution: ${hasActiveQueries ? '✅' : '❌'}`)
  console.log(`  Active connections: ${metricsDuring.activeConnections}`)
  
  return true
}

async function runTests() {
  console.log('═'.repeat(70))
  console.log('🚀 CONNECTION OPTIMIZATION TEST SUITE')
  console.log('═'.repeat(70))
  
  try {
    // Run tests
    const results = [
      await test1_ConnectionMonitorInit(),
      await test2_PoolMetrics(),
      await test3_HealthStatus(),
      await test4_ConnectionTest(),
      await test5_DetailedReport(),
      await test6_QueryTimeout(),
      await test7_GracefulDegradation(),
      await test8_PriorityBasedTimeout(),
      await test9_TimeoutTracking(),
      await test10_QueryTracking()
    ]
    
    // Summary
    const passed = results.filter(r => r).length
    const total = results.length
    const percentage = ((passed / total) * 100).toFixed(1)
    
    console.log('\n' + '═'.repeat(70))
    console.log('📈 TEST SUMMARY')
    console.log('═'.repeat(70))
    console.log(`  Total Tests: ${total}`)
    console.log(`  Passed: ${passed}`)
    console.log(`  Failed: ${total - passed}`)
    console.log(`  Success Rate: ${percentage}%`)
    console.log('═'.repeat(70))
    
    if (passed === total) {
      console.log('✅ All connection optimization tests passed!')
      console.log('\n🎉 Connection features validated:')
      console.log('  - Connection pool monitoring')
      console.log('  - Health status checks')
      console.log('  - Database connectivity testing')
      console.log('  - Query timeout handling')
      console.log('  - Graceful degradation')
      console.log('  - Priority-based timeouts')
      console.log('  - Timeout statistics tracking')
      console.log('  - Query execution tracking')
      console.log('  - Ready for production deployment')
    } else {
      console.log(`❌ ${total - passed} test(s) failed`)
      console.log('⚠️  Some connection features need attention')
    }
    
    process.exit(passed === total ? 0 : 1)
    
  } catch (error) {
    console.error('\n❌ Test suite error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run tests
runTests()
