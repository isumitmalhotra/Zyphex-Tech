import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: Fetch report analytics
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const reports = await prisma.report.findMany({
      where: { generatedById: session.user.id },
      select: {
        id: true,
        type: true,
        views: true,
        downloads: true,
        generatedAt: true,
      },
    })

    // Calculate analytics
    const totalReports = reports.length
    const totalViews = reports.reduce((sum, r) => sum + (r.views || 0), 0)
    const totalDownloads = reports.reduce((sum, r) => sum + (r.downloads || 0), 0)

    // Report types breakdown
    const reportTypeBreakdown = reports.reduce((acc, report) => {
      acc[report.type] = (acc[report.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Most requested report types
    const mostRequestedTypes = Object.entries(reportTypeBreakdown)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({ type, count }))

    // Report generation trends (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentReports = reports.filter(
      (r) => new Date(r.generatedAt) >= thirtyDaysAgo
    )

    // Group by week
    const weeklyTrends = recentReports.reduce((acc, report) => {
      const week = new Date(report.generatedAt).toISOString().split('T')[0]
      acc[week] = (acc[week] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      analytics: {
        totalReports,
        totalViews,
        totalDownloads,
        averageViewsPerReport: totalReports > 0 ? totalViews / totalReports : 0,
        averageDownloadsPerReport:
          totalReports > 0 ? totalDownloads / totalReports : 0,
        reportTypeBreakdown,
        mostRequestedTypes,
        weeklyTrends: Object.entries(weeklyTrends).map(([week, count]) => ({
          week,
          count,
        })),
        reportsGeneratedLast30Days: recentReports.length,
      },
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}

// POST: Track report engagement (views, downloads)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { reportId, action } = body

    if (!reportId || !action) {
      return NextResponse.json(
        { error: 'Report ID and action required' },
        { status: 400 }
      )
    }

    const updateData =
      action === 'view'
        ? { views: { increment: 1 } }
        : action === 'download'
        ? { downloads: { increment: 1 } }
        : null

    if (!updateData) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    await prisma.report.update({
      where: { id: reportId },
      data: updateData,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error tracking engagement:', error)
    return NextResponse.json(
      { error: 'Failed to track engagement' },
      { status: 500 }
    )
  }
}
