// GET /api/reports/data/[type] - Get raw data for report types

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  generateProjectStatusReport,
  generateTaskCompletionReport,
  generateResourceAllocationReport,
  generateRevenueReport,
  generateProfitabilityReport,
  generateTeamProductivityReport,
  generateInvoiceStatusReport,
  generateClientSatisfactionReport
} from '@/lib/services/report-data'

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'PROJECT_MANAGER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const reportType = params.type

    // Parse filters
    const filters = []
    const filterParams = searchParams.get('filters')
    if (filterParams) {
      try {
        filters.push(...JSON.parse(filterParams))
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid filters format' },
          { status: 400 }
        )
      }
    }

    // Parse date range
    let dateRange
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    if (startDate && endDate) {
      dateRange = {
        start: new Date(startDate),
        end: new Date(endDate)
      }
    }

    let data

    switch (reportType) {
      case 'project-status':
        data = await generateProjectStatusReport(filters, dateRange)
        break

      case 'task-completion':
        data = await generateTaskCompletionReport(filters, dateRange)
        break

      case 'resource-allocation':
        const userId = searchParams.get('userId') || undefined
        data = await generateResourceAllocationReport(userId)
        break

      case 'revenue':
        data = await generateRevenueReport(dateRange)
        break

      case 'profitability':
        data = await generateProfitabilityReport(filters)
        break

      case 'team-productivity':
        const teamId = searchParams.get('teamId') || undefined
        data = await generateTeamProductivityReport(teamId, dateRange)
        break

      case 'invoice-status':
        data = await generateInvoiceStatusReport(dateRange)
        break

      case 'client-satisfaction':
        const clientId = searchParams.get('clientId') || undefined
        data = await generateClientSatisfactionReport(clientId)
        break

      default:
        return NextResponse.json(
          { error: 'Invalid report type' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      data,
      metadata: {
        type: reportType,
        generatedAt: new Date(),
        recordCount: Array.isArray(data) ? data.length : 1
      }
    })
  } catch (error) {
    console.error('Error fetching report data:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch report data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
