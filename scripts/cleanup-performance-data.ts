import { prisma } from '@/lib/prisma'

/**
 * Automated Data Cleanup Script
 * 
 * This script removes old performance metrics, API logs, and resolved errors
 * to keep the database size manageable and improve query performance.
 * 
 * Run this script:
 * 1. Manually: node scripts/cleanup-performance-data.js
 * 2. Via cron job: Schedule to run daily/weekly
 * 3. Via API: Call /api/admin/cleanup endpoint
 */

interface CleanupConfig {
  performanceMetricsDays: number
  apiMetricsDays: number
  resolvedErrorsDays: number
  unresolvedErrorsDays: number
  databaseQueryLogsDays: number
  healthChecksDays: number
}

const DEFAULT_CONFIG: CleanupConfig = {
  performanceMetricsDays: 90, // Keep 3 months of performance data
  apiMetricsDays: 90, // Keep 3 months of API metrics
  resolvedErrorsDays: 30, // Keep resolved errors for 1 month
  unresolvedErrorsDays: 180, // Keep unresolved errors for 6 months
  databaseQueryLogsDays: 30, // Keep query logs for 1 month
  healthChecksDays: 30, // Keep health checks for 1 month
}

export async function cleanupPerformanceData(config: CleanupConfig = DEFAULT_CONFIG) {
  const results = {
    performanceMetrics: 0,
    apiMetrics: 0,
    resolvedErrors: 0,
    unresolvedErrors: 0,
    queryLogs: 0,
    healthChecks: 0,
    totalRecordsDeleted: 0,
  }

  try {
    console.log('🧹 Starting performance data cleanup...')

    // 1. Clean up old performance metrics
    const performanceDate = new Date()
    performanceDate.setDate(performanceDate.getDate() - config.performanceMetricsDays)
    
    const deletedPerformance = await prisma.performanceMetric.deleteMany({
      where: {
        timestamp: {
          lt: performanceDate,
        },
      },
    })
    results.performanceMetrics = deletedPerformance.count
    console.log(`✅ Deleted ${deletedPerformance.count} old performance metrics`)

    // 2. Clean up old API metrics
    const apiDate = new Date()
    apiDate.setDate(apiDate.getDate() - config.apiMetricsDays)
    
    const deletedApi = await prisma.apiMetric.deleteMany({
      where: {
        timestamp: {
          lt: apiDate,
        },
      },
    })
    results.apiMetrics = deletedApi.count
    console.log(`✅ Deleted ${deletedApi.count} old API metrics`)

    // 3. Clean up resolved errors
    const resolvedErrorsDate = new Date()
    resolvedErrorsDate.setDate(resolvedErrorsDate.getDate() - config.resolvedErrorsDays)
    
    const deletedResolvedErrors = await prisma.errorLog.deleteMany({
      where: {
        resolved: true,
        resolvedAt: {
          lt: resolvedErrorsDate,
        },
      },
    })
    results.resolvedErrors = deletedResolvedErrors.count
    console.log(`✅ Deleted ${deletedResolvedErrors.count} resolved errors`)

    // 4. Clean up old unresolved errors (very old)
    const unresolvedErrorsDate = new Date()
    unresolvedErrorsDate.setDate(unresolvedErrorsDate.getDate() - config.unresolvedErrorsDays)
    
    const deletedUnresolvedErrors = await prisma.errorLog.deleteMany({
      where: {
        resolved: false,
        timestamp: {
          lt: unresolvedErrorsDate,
        },
      },
    })
    results.unresolvedErrors = deletedUnresolvedErrors.count
    console.log(`✅ Deleted ${deletedUnresolvedErrors.count} old unresolved errors`)

    // 5. Clean up database query logs
    const queryLogsDate = new Date()
    queryLogsDate.setDate(queryLogsDate.getDate() - config.databaseQueryLogsDays)
    
    const deletedQueryLogs = await prisma.databaseQueryLog.deleteMany({
      where: {
        timestamp: {
          lt: queryLogsDate,
        },
      },
    })
    results.queryLogs = deletedQueryLogs.count
    console.log(`✅ Deleted ${deletedQueryLogs.count} old query logs`)

    // 6. Clean up health checks
    const healthChecksDate = new Date()
    healthChecksDate.setDate(healthChecksDate.getDate() - config.healthChecksDays)
    
    const deletedHealthChecks = await prisma.healthCheck.deleteMany({
      where: {
        timestamp: {
          lt: healthChecksDate,
        },
      },
    })
    results.healthChecks = deletedHealthChecks.count
    console.log(`✅ Deleted ${deletedHealthChecks.count} old health checks`)

    // Calculate total
    results.totalRecordsDeleted =
      results.performanceMetrics +
      results.apiMetrics +
      results.resolvedErrors +
      results.unresolvedErrors +
      results.queryLogs +
      results.healthChecks

    console.log(`\n✨ Cleanup complete! Total records deleted: ${results.totalRecordsDeleted}`)
    console.log('📊 Breakdown:', results)

    return results
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    throw error
  }
}

// Run if executed directly
if (require.main === module) {
  console.log('🚀 Running performance data cleanup...\n')
  
  cleanupPerformanceData()
    .then((results) => {
      console.log('\n✅ Cleanup completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Cleanup failed:', error)
      process.exit(1)
    })
}
