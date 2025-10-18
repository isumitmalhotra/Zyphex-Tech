/**
 * Monitoring Dashboard Test Suite
 * 
 * Tests for performance monitoring dashboard, metrics collection,
 * and alerting system.
 * 
 * Run: npm run test:monitoring-dashboard
 */

console.log('🧪 Monitoring Dashboard Test Suite\n')
console.log('Testing: Metrics Collection, Alerts, Dashboard Functionality')
console.log('=' .repeat(70) + '\n')

// Import components
import { PerformanceDashboard } from '../lib/monitoring/performance-dashboard'

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
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Main test suite
 */
async function runTests() {
  // ==========================================================================
  // METRICS COLLECTION TESTS
  // ==========================================================================
  
  console.log('\n📊 METRICS COLLECTION TESTS\n')
  
  await test('Metrics - Get current metrics', async () => {
    const metrics = await PerformanceDashboard.getMetrics()
    
    assert(metrics !== undefined, 'Should return metrics')
    assert(metrics.timestamp instanceof Date, 'Should have timestamp')
    assert(metrics.database !== undefined, 'Should have database metrics')
    assert(metrics.cache !== undefined, 'Should have cache metrics')
    assert(metrics.queries !== undefined, 'Should have query metrics')
    assert(metrics.replicas !== undefined, 'Should have replica metrics')
    assert(metrics.system !== undefined, 'Should have system metrics')
  })
  
  await test('Metrics - Database metrics structure', async () => {
    const metrics = await PerformanceDashboard.getMetrics()
    const db = metrics.database
    
    assert(typeof db.activeConnections === 'number', 'Should have active connections')
    assert(typeof db.idleConnections === 'number', 'Should have idle connections')
    assert(typeof db.totalConnections === 'number', 'Should have total connections')
    assert(typeof db.utilization === 'number', 'Should have utilization')
    assert(['healthy', 'warning', 'critical'].includes(db.health), 'Should have valid health status')
    assert(typeof db.averageQueryTime === 'number', 'Should have average query time')
    assert(typeof db.slowQueries === 'number', 'Should have slow query count')
  })
  
  await test('Metrics - Cache metrics structure', async () => {
    const metrics = await PerformanceDashboard.getMetrics()
    const cache = metrics.cache
    
    assert(typeof cache.hits === 'number', 'Should have cache hits')
    assert(typeof cache.misses === 'number', 'Should have cache misses')
    assert(typeof cache.hitRate === 'number', 'Should have hit rate')
    assert(typeof cache.memoryUsed === 'number', 'Should have memory used')
    assert(typeof cache.keysCount === 'number', 'Should have keys count')
  })
  
  await test('Metrics - Query metrics structure', async () => {
    const metrics = await PerformanceDashboard.getMetrics()
    const queries = metrics.queries
    
    assert(typeof queries.totalQueries === 'number', 'Should have total queries')
    assert(typeof queries.slowQueries === 'number', 'Should have slow queries')
    assert(typeof queries.failedQueries === 'number', 'Should have failed queries')
    assert(typeof queries.averageExecutionTime === 'number', 'Should have avg execution time')
  })
  
  await test('Metrics - System metrics structure', async () => {
    const metrics = await PerformanceDashboard.getMetrics()
    const system = metrics.system
    
    assert(typeof system.uptime === 'number', 'Should have uptime')
    assert(system.memoryUsage !== undefined, 'Should have memory usage')
    assert(system.cpuUsage !== undefined, 'Should have CPU usage')
    assert(typeof system.memoryUsage.heapUsed === 'number', 'Should have heap used')
  })
  
  await test('Metrics - Performance (<100ms)', async () => {
    const start = Date.now()
    await PerformanceDashboard.getMetrics()
    const duration = Date.now() - start
    
    assert(duration < 100, `Metrics collection should be <100ms (took ${duration}ms)`)
  })
  
  await test('Metrics - History tracking', async () => {
    PerformanceDashboard.reset()
    
    // Start monitoring
    PerformanceDashboard.startMonitoring(100) // 100ms interval
    
    // Wait for a few collections
    await sleep(350)
    
    // Stop monitoring
    PerformanceDashboard.stopMonitoring()
    
    const history = PerformanceDashboard.getMetricsHistory()
    
    assert(history.length > 0, 'Should collect metrics history')
    assert(history.every(m => m.timestamp instanceof Date), 'All entries should have timestamps')
  })
  
  // ==========================================================================
  // ALERT SYSTEM TESTS
  // ==========================================================================
  
  console.log('\n🚨 ALERT SYSTEM TESTS\n')
  
  await test('Alerts - Track slow queries', async () => {
    PerformanceDashboard.reset()
    PerformanceDashboard.configureAlerts({ enabled: true, slowQueryThreshold: 1000 })
    
    // Track a slow query
    PerformanceDashboard.trackQuery(1500, 'SELECT * FROM users')
    
    const alerts = PerformanceDashboard.getAlerts()
    
    assert(alerts.length > 0, 'Should generate alert for slow query')
    assert(alerts[0].type === 'slow-query', 'Should be slow-query alert')
    assert(['warning', 'critical'].includes(alerts[0].severity), 'Should have appropriate severity')
  })
  
  await test('Alerts - Track query failures', async () => {
    PerformanceDashboard.reset()
    PerformanceDashboard.configureAlerts({ enabled: true })
    
    // Track a failed query
    PerformanceDashboard.trackQueryFailure(new Error('Connection lost'), 'SELECT * FROM projects')
    
    const alerts = PerformanceDashboard.getAlerts()
    
    assert(alerts.length > 0, 'Should generate alert for query failure')
    assert(alerts[0].type === 'query-failure', 'Should be query-failure alert')
    assert(alerts[0].severity === 'critical', 'Should have critical severity')
  })
  
  await test('Alerts - Filter by severity', async () => {
    PerformanceDashboard.reset()
    PerformanceDashboard.configureAlerts({ enabled: true, slowQueryThreshold: 1000 })
    
    // Generate different severity alerts
    PerformanceDashboard.trackQuery(1200, 'SELECT * FROM users') // Warning
    PerformanceDashboard.trackQuery(3000, 'SELECT * FROM projects') // Critical
    PerformanceDashboard.trackQueryFailure(new Error('Test'), 'SELECT 1') // Critical
    
    const allAlerts = PerformanceDashboard.getAlerts()
    const criticalAlerts = PerformanceDashboard.getAlerts('critical')
    const warningAlerts = PerformanceDashboard.getAlerts('warning')
    
    assert(allAlerts.length >= 3, 'Should have multiple alerts')
    assert(criticalAlerts.length >= 2, 'Should have critical alerts')
    assert(warningAlerts.length >= 1, 'Should have warning alerts')
  })
  
  await test('Alerts - Clear alerts', async () => {
    PerformanceDashboard.reset()
    PerformanceDashboard.configureAlerts({ enabled: true })
    
    // Generate some alerts
    PerformanceDashboard.trackQuery(2000, 'SELECT * FROM users')
    
    let alerts = PerformanceDashboard.getAlerts()
    assert(alerts.length > 0, 'Should have alerts before clearing')
    
    // Clear alerts
    PerformanceDashboard.clearAlerts()
    
    alerts = PerformanceDashboard.getAlerts()
    assert(alerts.length === 0, 'Should have no alerts after clearing')
  })
  
  await test('Alerts - Configuration', async () => {
    PerformanceDashboard.configureAlerts({
      slowQueryThreshold: 500,
      highUtilizationThreshold: 85,
      lowHitRateThreshold: 75,
      highReplicationLag: 10000,
      enabled: true
    })
    
    // Track a query that exceeds new threshold
    PerformanceDashboard.trackQuery(600, 'SELECT * FROM tasks')
    
    const alerts = PerformanceDashboard.getAlerts()
    
    // Alert should be generated with new threshold
    assert(alerts.some(a => a.type === 'slow-query'), 'Should respect configured threshold')
  })
  
  // ==========================================================================
  // DASHBOARD FUNCTIONALITY TESTS
  // ==========================================================================
  
  console.log('\n📈 DASHBOARD FUNCTIONALITY TESTS\n')
  
  await test('Dashboard - Performance trends', async () => {
    PerformanceDashboard.reset()
    
    // Track some queries
    for (let i = 0; i < 10; i++) {
      PerformanceDashboard.trackQuery(100 + i * 10, `SELECT ${i}`)
    }
    
    // Start monitoring to collect history
    PerformanceDashboard.startMonitoring(100)
    await sleep(350)
    PerformanceDashboard.stopMonitoring()
    
    const trend = PerformanceDashboard.getPerformanceTrends('queries.averageExecutionTime', 1)
    
    // May return null if insufficient data
    if (trend) {
      assert(Array.isArray(trend.dataPoints), 'Should have data points')
      assert(['improving', 'stable', 'degrading'].includes(trend.trend), 'Should have valid trend')
      assert(typeof trend.changePercentage === 'number', 'Should have change percentage')
    }
  })
  
  await test('Dashboard - Comprehensive report', async () => {
    PerformanceDashboard.reset()
    PerformanceDashboard.configureAlerts({ enabled: true })
    
    // Generate some activity
    PerformanceDashboard.trackQuery(1500, 'SELECT * FROM users')
    PerformanceDashboard.trackQuery(200, 'SELECT * FROM projects')
    
    const report = await PerformanceDashboard.getComprehensiveReport()
    
    assert(report !== undefined, 'Should generate report')
    assert(report.metrics !== undefined, 'Should include current metrics')
    assert(Array.isArray(report.alerts), 'Should include alerts')
    assert(Array.isArray(report.trends), 'Should include trends')
    assert(report.summary !== undefined, 'Should include summary')
    assert(['healthy', 'warning', 'critical'].includes(report.summary.overallHealth), 'Should have valid overall health')
  })
  
  await test('Dashboard - Reset functionality', async () => {
    PerformanceDashboard.reset()
    
    // Add some data
    PerformanceDashboard.trackQuery(1000, 'SELECT 1')
    PerformanceDashboard.trackQuery(2000, 'SELECT 2')
    
    // Reset
    PerformanceDashboard.reset()
    
    const alerts = PerformanceDashboard.getAlerts()
    const history = PerformanceDashboard.getMetricsHistory()
    
    assert(alerts.length === 0, 'Should clear alerts on reset')
    assert(history.length === 0, 'Should clear history on reset')
  })
  
  await test('Dashboard - Monitoring start/stop', async () => {
    PerformanceDashboard.reset()
    
    // Start monitoring
    PerformanceDashboard.startMonitoring(100)
    
    // Let it collect some metrics
    await sleep(250)
    
    const historyDuringMonitoring = PerformanceDashboard.getMetricsHistory()
    
    // Stop monitoring
    PerformanceDashboard.stopMonitoring()
    
    // Wait a bit
    await sleep(250)
    
    const historyAfterStopping = PerformanceDashboard.getMetricsHistory()
    
    assert(historyDuringMonitoring.length > 0, 'Should collect metrics while monitoring')
    assert(historyAfterStopping.length === historyDuringMonitoring.length, 'Should not collect after stopping')
  })
  
  // ==========================================================================
  // INTEGRATION TESTS
  // ==========================================================================
  
  console.log('\n🔗 INTEGRATION TESTS\n')
  
  await test('Integration - Query tracking with metrics', async () => {
    PerformanceDashboard.reset()
    
    // Track various queries
    PerformanceDashboard.trackQuery(50, 'SELECT * FROM users LIMIT 10')
    PerformanceDashboard.trackQuery(150, 'SELECT * FROM projects WHERE status = ?')
    PerformanceDashboard.trackQuery(1500, 'SELECT * FROM tasks JOIN projects ON ...')
    
    const metrics = await PerformanceDashboard.getMetrics()
    
    assert(metrics.queries.totalQueries === 3, 'Should track all queries')
    assert(metrics.queries.slowQueries === 1, 'Should identify slow queries')
    assert(metrics.queries.averageExecutionTime > 0, 'Should calculate average')
  })
  
  await test('Integration - End-to-end monitoring workflow', async () => {
    PerformanceDashboard.reset()
    PerformanceDashboard.configureAlerts({ enabled: true, slowQueryThreshold: 1000 })
    
    // Start monitoring
    PerformanceDashboard.startMonitoring(100)
    
    // Simulate application activity
    PerformanceDashboard.trackQuery(50, 'Fast query')
    await sleep(150)
    
    PerformanceDashboard.trackQuery(1200, 'Slow query')
    await sleep(150)
    
    PerformanceDashboard.trackQueryFailure(new Error('Test error'), 'Failed query')
    await sleep(150)
    
    // Stop monitoring
    PerformanceDashboard.stopMonitoring()
    
    // Get comprehensive report
    const report = await PerformanceDashboard.getComprehensiveReport()
    
    assert(report.metrics.queries.totalQueries >= 2, 'Should track queries')
    assert(report.alerts.length >= 2, 'Should have alerts for slow query and failure')
    assert(report.metrics.queries.slowQueries >= 1, 'Should identify slow queries')
    assert(report.metrics.queries.failedQueries >= 1, 'Should track failed queries')
    assert(report.summary.activeAlerts >= 2, 'Should count active alerts')
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
