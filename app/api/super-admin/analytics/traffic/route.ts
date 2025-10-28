import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  getTrafficMetrics,
  getTrafficSources,
  getGeographicData,
  getDeviceData,
  getTopPages,
  getActiveUsers,
  getTrafficTrend,
  isGA4Configured,
} from '@/lib/google-analytics'

/* eslint-disable @typescript-eslint/no-explicit-any */

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate') || '30daysAgo'
    const endDate = searchParams.get('endDate') || 'today'
    const useMock = searchParams.get('useMock') === 'true'

    // If GA4 is not configured OR user explicitly wants mock data
    if (!isGA4Configured() || useMock) {
      return NextResponse.json({
        success: true,
        source: 'mock',
        message: 'Using mock data. Configure GA4 credentials for real data.',
        ...getMockTrafficData(),
      })
    }

    // Fetch real data from Google Analytics 4
    try {
      const [
        metrics,
        sources,
        geographic,
        devices,
        topPages,
        activeUsers,
        trend,
      ] = await Promise.all([
        getTrafficMetrics(startDate, endDate),
        getTrafficSources(startDate, endDate, 10),
        getGeographicData(startDate, endDate, 10),
        getDeviceData(startDate, endDate),
        getTopPages(startDate, endDate, 10),
        getActiveUsers(),
        getTrafficTrend(startDate, endDate),
      ])

      return NextResponse.json({
        success: true,
        source: 'ga4',
        metrics,
        sources,
        geographic,
        devices,
        topPages,
        activeUsers,
        trend,
        dateRange: { startDate, endDate },
      })
    } catch (gaError) {
      console.error('GA4 API Error:', gaError)
      return NextResponse.json({
        success: true,
        source: 'mock',
        message: 'GA4 API error, using mock data as fallback',
        error: gaError instanceof Error ? gaError.message : 'Unknown error',
        ...getMockTrafficData(),
      })
    }
  } catch (error) {
    console.error('Error fetching traffic analytics:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch traffic analytics',
      },
      { status: 500 }
    )
  }
}

/**
 * Mock data fallback (used when GA4 not configured or API fails)
 */
function getMockTrafficData() {
  return {
    metrics: {
      totalUsers: 45678,
      totalSessions: 67234,
      totalPageViews: 189432,
      bounceRate: 42,
      avgSessionDuration: '3m 24s',
      newUsersRate: 68,
    },
    sources: [
      {
        source: 'google',
        medium: 'organic',
        users: 18234,
        sessions: 25432,
        pageViews: 78945,
        percentage: 40,
      },
      {
        source: '(direct)',
        medium: '(none)',
        users: 12345,
        sessions: 18765,
        pageViews: 45678,
        percentage: 27,
      },
      {
        source: 'linkedin',
        medium: 'social',
        users: 8234,
        sessions: 12456,
        pageViews: 34567,
        percentage: 18,
      },
      {
        source: 'github',
        medium: 'referral',
        users: 4567,
        sessions: 6789,
        pageViews: 18234,
        percentage: 10,
      },
      {
        source: 'newsletter',
        medium: 'email',
        users: 2298,
        sessions: 3812,
        pageViews: 12028,
        percentage: 5,
      },
    ],
    geographic: [
      { country: 'United States', users: 15678, sessions: 23456, percentage: 34 },
      { country: 'United Kingdom', users: 8234, sessions: 12345, percentage: 18 },
      { country: 'Canada', users: 6789, sessions: 9876, percentage: 15 },
      { country: 'India', users: 5432, sessions: 8765, percentage: 12 },
      { country: 'Germany', users: 4567, sessions: 6789, percentage: 10 },
      { country: 'Australia', users: 2345, sessions: 3456, percentage: 5 },
      { country: 'France', users: 1234, sessions: 2345, percentage: 3 },
      { country: 'Netherlands', users: 987, sessions: 1456, percentage: 2 },
      { country: 'Singapore', users: 412, sessions: 678, percentage: 1 },
    ],
    devices: [
      { category: 'desktop', users: 25678, sessions: 38234, percentage: 56 },
      { category: 'mobile', users: 16234, sessions: 24567, percentage: 36 },
      { category: 'tablet', users: 3766, sessions: 4433, percentage: 8 },
    ],
    topPages: [
      {
        page: '/',
        pageViews: 45678,
        uniquePageViews: 32456,
        avgTimeOnPage: '2m 34s',
        bounceRate: 38,
      },
      {
        page: '/services',
        pageViews: 34567,
        uniquePageViews: 24567,
        avgTimeOnPage: '3m 12s',
        bounceRate: 35,
      },
      {
        page: '/portfolio',
        pageViews: 28934,
        uniquePageViews: 19876,
        avgTimeOnPage: '4m 23s',
        bounceRate: 28,
      },
      {
        page: '/about',
        pageViews: 23456,
        uniquePageViews: 16789,
        avgTimeOnPage: '2m 45s',
        bounceRate: 42,
      },
      {
        page: '/contact',
        pageViews: 18765,
        uniquePageViews: 13456,
        avgTimeOnPage: '1m 56s',
        bounceRate: 48,
      },
      {
        page: '/blog',
        pageViews: 15678,
        uniquePageViews: 11234,
        avgTimeOnPage: '3m 34s',
        bounceRate: 32,
      },
      {
        page: '/careers',
        pageViews: 12345,
        uniquePageViews: 8976,
        avgTimeOnPage: '2m 18s',
        bounceRate: 45,
      },
      {
        page: '/pricing',
        pageViews: 9876,
        uniquePageViews: 7234,
        avgTimeOnPage: '2m 56s',
        bounceRate: 40,
      },
    ],
    activeUsers: 234,
    trend: generateMockTrend(30),
    dateRange: { startDate: '30daysAgo', endDate: 'today' },
  }
}

/**
 * Generate mock trend data for the last N days
 */
function generateMockTrend(days: number) {
  const trend = []
  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '')

    // Generate realistic-looking data with some variance
    const baseUsers = 1200 + Math.random() * 400
    const baseSessions = baseUsers * (1.3 + Math.random() * 0.4)
    const basePageViews = baseSessions * (2.5 + Math.random() * 1)

    // Add weekend dip
    const dayOfWeek = date.getDay()
    const weekendFactor = dayOfWeek === 0 || dayOfWeek === 6 ? 0.7 : 1

    trend.push({
      date: dateStr,
      users: Math.round(baseUsers * weekendFactor),
      sessions: Math.round(baseSessions * weekendFactor),
      pageViews: Math.round(basePageViews * weekendFactor),
    })
  }

  return trend
}
