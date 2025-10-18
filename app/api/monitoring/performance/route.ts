/**
 * Query Performance Monitoring API
 * 
 * Provides REST endpoints for accessing query performance metrics,
 * analysis data, and monitoring configuration.
 * 
 * GET /api/monitoring/performance - Get performance metrics
 * GET /api/monitoring/performance/queries - Get recent queries
 * GET /api/monitoring/performance/issues - Get detected issues
 * GET /api/monitoring/performance/patterns - Get query patterns
 * GET /api/monitoring/performance/models - Get model performance
 * POST /api/monitoring/performance/analyze - Trigger analysis
 * POST /api/monitoring/performance/reset - Reset monitoring data
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/options'
import {
  queryMonitor,
  performanceAnalyzer,
  getMonitoringStatus,
  IssueSeverity,
} from '@/lib/monitoring'

/**
 * GET /api/monitoring/performance
 * Get comprehensive performance monitoring data
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const view = searchParams.get('view') || 'overview'

    let data

    switch (view) {
      case 'queries':
        {
          const limit = parseInt(searchParams.get('limit') || '50')
          const model = searchParams.get('model')
          const action = searchParams.get('action')

          let queries = queryMonitor.getQueries(limit)

          if (model) {
            queries = queryMonitor.getQueriesByModel(model)
          } else if (action) {
            queries = queryMonitor.getQueriesByAction(action)
          }

          data = {
            queries,
            total: queries.length,
          }
        }
        break

      case 'slow-queries':
        {
          const limit = parseInt(searchParams.get('limit') || '50')
          const slowQueries = queryMonitor.getSlowQueries(limit)
          data = {
            queries: slowQueries,
            total: slowQueries.length,
          }
        }
        break

      case 'issues':
        {
          const severity = searchParams.get('severity') as IssueSeverity | null
          const issues = severity
            ? performanceAnalyzer.getIssues(severity)
            : performanceAnalyzer.getIssues()

          data = {
            issues,
            counts: {
              critical: performanceAnalyzer.getIssues(IssueSeverity.CRITICAL).length,
              high: performanceAnalyzer.getIssues(IssueSeverity.HIGH).length,
              medium: performanceAnalyzer.getIssues(IssueSeverity.MEDIUM).length,
              low: performanceAnalyzer.getIssues(IssueSeverity.LOW).length,
            },
          }
        }
        break

      case 'patterns':
        {
          const patterns = performanceAnalyzer.analyzeQueryPatterns()
          const limit = parseInt(searchParams.get('limit') || '20')
          
          data = {
            patterns: patterns.slice(0, limit),
            total: patterns.length,
          }
        }
        break

      case 'models':
        {
          const models = performanceAnalyzer.analyzeModelPerformance()
          const limit = parseInt(searchParams.get('limit') || '20')
          
          data = {
            models: models.slice(0, limit),
            total: models.length,
          }
        }
        break

      case 'n1-queries':
        {
          const timeWindow = parseInt(searchParams.get('timeWindow') || '1000')
          const n1Queries = queryMonitor.detectN1Queries(timeWindow)
          
          data = {
            n1Queries,
            total: n1Queries.length,
          }
        }
        break

      case 'summary':
        data = {
          summary: queryMonitor.getSummary(),
        }
        break

      default:
        // Overview - comprehensive status
        data = getMonitoringStatus()
    }

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Performance API] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/monitoring/performance
 * Trigger actions (analyze, reset, configure)
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action, config } = body

    let result

    switch (action) {
      case 'analyze':
        {
          const issues = await performanceAnalyzer.runAnalysis()
          result = {
            message: `Analysis complete: ${issues.length} issues detected`,
            issues,
            counts: {
              critical: issues.filter((i) => i.severity === IssueSeverity.CRITICAL).length,
              high: issues.filter((i) => i.severity === IssueSeverity.HIGH).length,
              medium: issues.filter((i) => i.severity === IssueSeverity.MEDIUM).length,
              low: issues.filter((i) => i.severity === IssueSeverity.LOW).length,
            },
          }
        }
        break

      case 'reset':
        queryMonitor.reset()
        performanceAnalyzer.clearIssues()
        result = {
          message: 'Monitoring data reset successfully',
        }
        break

      case 'configure':
        if (config?.monitor) {
          queryMonitor.updateConfig(config.monitor)
        }
        if (config?.analyzer) {
          performanceAnalyzer.updateConfig(config.analyzer)
        }
        result = {
          message: 'Configuration updated successfully',
          config: {
            monitor: queryMonitor.getConfig(),
            analyzer: performanceAnalyzer.getConfig(),
          },
        }
        break

      case 'enable':
        queryMonitor.setEnabled(true)
        result = {
          message: 'Query monitoring enabled',
        }
        break

      case 'disable':
        queryMonitor.setEnabled(false)
        result = {
          message: 'Query monitoring disabled',
        }
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported: analyze, reset, configure, enable, disable' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Performance API] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
