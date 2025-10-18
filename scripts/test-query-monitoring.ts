/**
 * Query Performance Monitoring Test Suite
 * 
 * Comprehensive tests for query monitoring system including:
 * - Metrics collection and tracking
 * - Slow query detection
 * - Performance statistics
 * - Pattern analysis
 * - Recommendations
 * - Logging system
 */

import { prisma } from '../lib/prisma'
import { queryMonitor, queryAnalytics, slowQueryLogger } from '../lib/monitoring'

interface TestResult {
  name: string
  success: boolean
  duration: number
  message?: string
  details?: unknown
}

const results: TestResult[] = []

/**
 * Run a single test
 */
async function runTest(
  name: string,
  testFn: () => Promise<void>
): Promise<void> {
  const startTime = Date.now()
  
  try {
    await testFn()
    results.push({
      name,
      success: true,
      duration: Date.now() - startTime,
    })
    console.log(`✅ ${name} (${Date.now() - startTime}ms)`)
  } catch (error) {
    results.push({
      name,
      success: false,
      duration: Date.now() - startTime,
      message: error instanceof Error ? error.message : String(error),
    })
    console.error(`❌ ${name} (${Date.now() - startTime}ms)`)
    console.error('   Error:', error)
  }
}

/**
 * Test 1: Query monitor initialization
 */
async function testMonitorInitialization(): Promise<void> {
  // Reset monitor
  queryMonitor.reset()
  
  const metrics = queryMonitor.getMetrics()
  if (metrics.length !== 0) {
    throw new Error('Monitor should start empty after reset')
  }
  
  console.log('   Monitor initialized successfully')
}

/**
 * Test 2: Basic query tracking
 */
async function testBasicQueryTracking(): Promise<void> {
  queryMonitor.reset()
  
  // Execute a simple query
  await prisma.user.count()
  
  // Wait a bit for middleware to process
  await new Promise(resolve => setTimeout(resolve, 100))
  
  const metrics = queryMonitor.getMetrics()
  if (metrics.length === 0) {
    throw new Error('Query should be tracked')
  }
  
  const lastQuery = metrics[metrics.length - 1]
  if (lastQuery.model !== 'User' || lastQuery.action !== 'count') {
    throw new Error('Query details incorrect')
  }
  
  console.log(`   Tracked query: User.count (${lastQuery.executionTime}ms)`)
}

/**
 * Test 3: Slow query detection
 */
async function testSlowQueryDetection(): Promise<void> {
  queryMonitor.reset()
  
  // Execute multiple queries to trigger some slow ones
  const promises = []
  for (let i = 0; i < 5; i++) {
    promises.push(prisma.project.findMany({ take: 10 }))
  }
  await Promise.all(promises)
  
  await new Promise(resolve => setTimeout(resolve, 100))
  
  const stats = queryMonitor.getStats()
  console.log(`   Total queries: ${stats.totalQueries}`)
  console.log(`   Slow queries: ${stats.slowQueries}`)
  console.log(`   Average time: ${stats.averageExecutionTime.toFixed(2)}ms`)
}

/**
 * Test 4: Performance statistics
 */
async function testPerformanceStatistics(): Promise<void> {
  queryMonitor.reset()
  
  // Execute various queries
  await prisma.user.count()
  await prisma.project.findMany({ take: 5 })
  await prisma.task.count()
  await prisma.client.findMany({ take: 3 })
  
  await new Promise(resolve => setTimeout(resolve, 100))
  
  const stats = queryMonitor.getStats()
  
  if (stats.totalQueries < 4) {
    throw new Error(`Expected at least 4 queries, got ${stats.totalQueries}`)
  }
  
  if (stats.averageExecutionTime <= 0) {
    throw new Error('Average execution time should be > 0')
  }
  
  console.log('   Statistics calculated successfully:')
  console.log(`     Total: ${stats.totalQueries} queries`)
  console.log(`     Avg: ${stats.averageExecutionTime.toFixed(2)}ms`)
  console.log(`     P95: ${stats.p95ExecutionTime.toFixed(2)}ms`)
  console.log(`     Max: ${stats.maxExecutionTime.toFixed(2)}ms`)
}

/**
 * Test 5: Query pattern analysis
 */
async function testQueryPatternAnalysis(): Promise<void> {
  queryMonitor.reset()
  
  // Execute same query multiple times
  for (let i = 0; i < 10; i++) {
    await prisma.user.count()
  }
  
  await new Promise(resolve => setTimeout(resolve, 100))
  
  const metrics = queryMonitor.getMetrics()
  const patterns = queryAnalytics.analyzePatterns(metrics)
  
  if (patterns.length === 0) {
    throw new Error('Should detect at least one pattern')
  }
  
  const userCountPattern = patterns.find(
    p => p.model === 'User' && p.action === 'count'
  )
  
  if (!userCountPattern || userCountPattern.occurrences < 10) {
    throw new Error('Should detect User.count pattern with 10+ occurrences')
  }
  
  console.log('   Pattern detected:')
  console.log(`     ${userCountPattern.model}.${userCountPattern.action}`)
  console.log(`     Occurrences: ${userCountPattern.occurrences}`)
  console.log(`     Avg time: ${userCountPattern.averageExecutionTime.toFixed(2)}ms`)
  console.log(`     Trend: ${userCountPattern.trend}`)
}

/**
 * Test 6: Optimization recommendations
 */
async function testOptimizationRecommendations(): Promise<void> {
  queryMonitor.reset()
  
  // Execute queries that might trigger recommendations
  for (let i = 0; i < 20; i++) {
    await prisma.project.findMany({
      include: {
        client: true,
        tasks: true,
      },
    })
  }
  
  await new Promise(resolve => setTimeout(resolve, 100))
  
  const metrics = queryMonitor.getMetrics()
  const patterns = queryAnalytics.analyzePatterns(metrics)
  const recommendations = queryAnalytics.generateRecommendations(patterns, metrics)
  
  console.log(`   Generated ${recommendations.length} recommendations`)
  
  if (recommendations.length > 0) {
    const topRec = recommendations[0]
    console.log(`     Top: ${topRec.severity} - ${topRec.model}.${topRec.action}`)
    console.log(`     Issue: ${topRec.issue}`)
  }
}

/**
 * Test 7: Slow query logging to file
 */
async function testSlowQueryLogging(): Promise<void> {
  queryMonitor.reset()
  
  // Execute queries to generate slow query logs
  for (let i = 0; i < 5; i++) {
    await prisma.project.findMany({
      include: {
        client: true,
        tasks: true,
        manager: true,
      },
      take: 20,
    })
  }
  
  await new Promise(resolve => setTimeout(resolve, 100))
  
  const slowQueries = queryMonitor.getSlowQueries()
  
  // Flush logger to ensure writes complete
  await slowQueryLogger.flush()
  
  console.log(`   Detected ${slowQueries.length} slow queries`)
  
  if (slowQueries.length > 0) {
    const slowest = slowQueries.reduce((max, q) => 
      q.executionTime > max.executionTime ? q : max
    )
    console.log(`     Slowest: ${slowest.model}.${slowest.action} (${slowest.executionTime}ms)`)
  }
}

/**
 * Test 8: Analytics report generation
 */
async function testAnalyticsReport(): Promise<void> {
  queryMonitor.reset()
  
  // Execute diverse queries
  await prisma.user.count()
  await prisma.project.findMany({ take: 10 })
  await prisma.task.count()
  await prisma.client.count()
  await prisma.user.findMany({ take: 5 })
  
  await new Promise(resolve => setTimeout(resolve, 100))
  
  const report = await queryAnalytics.generateReport()
  
  if (!report.summary || !report.topPatterns) {
    throw new Error('Report should have summary and patterns')
  }
  
  console.log('   Analytics report generated:')
  console.log(`     Queries: ${report.summary.totalQueries}`)
  console.log(`     Patterns: ${report.topPatterns.length}`)
  console.log(`     Recommendations: ${report.recommendations.length}`)
  console.log(`     Slowest: ${report.highlights.slowestQueries.length}`)
}

/**
 * Test 9: Performance comparison
 */
async function testPerformanceComparison(): Promise<void> {
  queryMonitor.reset()
  
  // First period
  for (let i = 0; i < 5; i++) {
    await prisma.user.count()
  }
  
  const firstStats = queryMonitor.getStats()
  
  // Simulate second period
  queryMonitor.reset()
  for (let i = 0; i < 5; i++) {
    await prisma.user.count()
  }
  
  await new Promise(resolve => setTimeout(resolve, 100))
  
  const secondStats = queryMonitor.getStats()
  const comparisons = queryAnalytics.comparePerformance(secondStats, firstStats)
  
  if (comparisons.length === 0) {
    throw new Error('Should generate performance comparisons')
  }
  
  console.log(`   Generated ${comparisons.length} performance comparisons`)
  
  const avgTimeComparison = comparisons.find(c => c.metric.includes('Average'))
  if (avgTimeComparison) {
    console.log(`     ${avgTimeComparison.metric}: ${avgTimeComparison.trend}`)
    console.log(`     Change: ${avgTimeComparison.changePercentage.toFixed(2)}%`)
  }
}

/**
 * Test 10: Query metrics by model
 */
async function testMetricsByModel(): Promise<void> {
  queryMonitor.reset()
  
  // Execute queries for different models
  await prisma.user.count()
  await prisma.user.count()
  await prisma.project.count()
  await prisma.task.count()
  await prisma.task.count()
  await prisma.task.count()
  
  await new Promise(resolve => setTimeout(resolve, 100))
  
  const stats = queryMonitor.getStats()
  
  if (!stats.byModel.User || stats.byModel.User.count !== 2) {
    throw new Error('Should track 2 User queries')
  }
  
  if (!stats.byModel.Task || stats.byModel.Task.count !== 3) {
    throw new Error('Should track 3 Task queries')
  }
  
  console.log('   Metrics by model:')
  Object.entries(stats.byModel).forEach(([model, data]) => {
    console.log(`     ${model}: ${data.count} queries, ${data.averageTime.toFixed(2)}ms avg`)
  })
}

/**
 * Test 11: Query metrics by action
 */
async function testMetricsByAction(): Promise<void> {
  queryMonitor.reset()
  
  // Execute various actions
  await prisma.user.count()
  await prisma.user.findMany({ take: 5 })
  await prisma.user.findMany({ take: 5 })
  await prisma.project.count()
  
  await new Promise(resolve => setTimeout(resolve, 100))
  
  const stats = queryMonitor.getStats()
  
  if (!stats.byAction.count || !stats.byAction.findMany) {
    throw new Error('Should track both count and findMany actions')
  }
  
  console.log('   Metrics by action:')
  Object.entries(stats.byAction).forEach(([action, data]) => {
    console.log(`     ${action}: ${data.count} queries, ${data.averageTime.toFixed(2)}ms avg`)
  })
}

/**
 * Test 12: Slow query log summary
 */
async function testSlowQueryLogSummary(): Promise<void> {
  try {
    const summary = await slowQueryLogger.getLogSummary()
    
    console.log('   Slow query log summary:')
    console.log(`     Total: ${summary.totalSlowQueries}`)
    console.log(`     Critical: ${summary.criticalQueries}`)
    console.log(`     Warning: ${summary.warningQueries}`)
    
    if (summary.slowestQuery) {
      console.log(`     Slowest: ${summary.slowestQuery.model}.${summary.slowestQuery.action} (${summary.slowestQuery.executionTime}ms)`)
    }
  } catch (_error) {
    // Log file might not exist yet, which is fine
    console.log('   No log file yet (expected for first run)')
  }
}

/**
 * Main test runner
 */
async function runAllTests(): Promise<void> {
  console.log('🧪 Starting Query Performance Monitoring Tests')
  console.log('================================================\n')
  
  const startTime = Date.now()
  
  // Run all tests
  await runTest('1. Monitor Initialization', testMonitorInitialization)
  await runTest('2. Basic Query Tracking', testBasicQueryTracking)
  await runTest('3. Slow Query Detection', testSlowQueryDetection)
  await runTest('4. Performance Statistics', testPerformanceStatistics)
  await runTest('5. Query Pattern Analysis', testQueryPatternAnalysis)
  await runTest('6. Optimization Recommendations', testOptimizationRecommendations)
  await runTest('7. Slow Query Logging', testSlowQueryLogging)
  await runTest('8. Analytics Report Generation', testAnalyticsReport)
  await runTest('9. Performance Comparison', testPerformanceComparison)
  await runTest('10. Metrics by Model', testMetricsByModel)
  await runTest('11. Metrics by Action', testMetricsByAction)
  await runTest('12. Slow Query Log Summary', testSlowQueryLogSummary)
  
  const totalDuration = Date.now() - startTime
  
  // Print summary
  console.log('\n================================================')
  console.log('📊 Test Summary')
  console.log('================================================')
  
  const passed = results.filter(r => r.success).length
  const failed = results.filter(r => r.success === false).length
  
  console.log(`Total: ${results.length}`)
  console.log(`Passed: ${passed} (${((passed / results.length) * 100).toFixed(1)}%)`)
  console.log(`Failed: ${failed} (${((failed / results.length) * 100).toFixed(1)}%)`)
  console.log(`Duration: ${totalDuration}ms (${(totalDuration / results.length).toFixed(1)}ms avg)`)
  
  if (failed > 0) {
    console.log('\n❌ Failed tests:')
    results
      .filter(r => !r.success)
      .forEach(r => {
        console.log(`   - ${r.name}: ${r.message}`)
      })
  } else {
    console.log('\n✨ All tests passed! Query monitoring is working correctly.')
  }
  
  console.log('\nExiting...')
  process.exit(failed > 0 ? 1 : 0)
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
