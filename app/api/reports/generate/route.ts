// POST /api/reports/generate - Generate a new report

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { reportService } from '@/lib/services/report-service'
import { z } from 'zod'

const generateReportSchema = z.object({
  name: z.string().min(1, 'Report name is required'),
  description: z.string().optional(),
  type: z.enum([
    'PROJECT_STATUS',
    'PROJECT_TIMELINE',
    'TASK_COMPLETION',
    'RESOURCE_ALLOCATION',
    'RISK_ASSESSMENT',
    'REVENUE_BY_PROJECT',
    'PROFITABILITY_ANALYSIS',
    'BUDGET_VS_ACTUAL',
    'INVOICE_STATUS',
    'PAYMENT_COLLECTION',
    'TEAM_PRODUCTIVITY',
    'INDIVIDUAL_PERFORMANCE',
    'TIME_TRACKING',
    'WORKLOAD_DISTRIBUTION',
    'SKILL_UTILIZATION',
    'CLIENT_SATISFACTION',
    'PROJECT_DELIVERABLES',
    'COMMUNICATION_LOGS',
    'SERVICE_LEVEL',
    'CUSTOM'
  ]),
  templateId: z.string().optional(),
  config: z.object({
    filters: z.array(z.object({
      field: z.string(),
      operator: z.string(),
      value: z.any()
    })).default([]),
    dateRange: z.object({
      start: z.string().transform(str => new Date(str)),
      end: z.string().transform(str => new Date(str))
    }).optional(),
    groupBy: z.array(z.string()).optional(),
    sortBy: z.array(z.object({
      field: z.string(),
      direction: z.enum(['asc', 'desc'])
    })).optional(),
    limit: z.number().optional(),
    includeSummary: z.boolean().optional(),
    includeCharts: z.boolean().optional()
  })
})

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only PROJECT_MANAGER and ADMIN can generate reports
    if (session.user.role !== 'PROJECT_MANAGER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = generateReportSchema.parse(body)

    // Check if we can use cached data
    const cachedData = await reportService.getCachedReportData(
      validatedData.type,
      validatedData.config
    )

    if (cachedData) {
      // Return cached report (still create a new report record)
      const report = await reportService.generateReport(
        validatedData.name,
        validatedData.type,
        validatedData.config,
        session.user.id
      )

      return NextResponse.json({
        success: true,
        report,
        cached: true,
        message: 'Report generated from cache'
      })
    }

    // Generate new report
    const report = await reportService.generateReport(
      validatedData.name,
      validatedData.type,
      validatedData.config,
      session.user.id
    )

    // Cache the result for future use
    const reportData = await reportService.generateReportData(
      validatedData.type,
      validatedData.config
    )
    
    await reportService.cacheReportData(
      validatedData.type,
      validatedData.config,
      reportData,
      30 // Cache for 30 minutes
    )

    return NextResponse.json({
      success: true,
      report,
      cached: false,
      message: 'Report generated successfully'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error generating report:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate report',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
