/**
 * Google Analytics 4 (GA4) Data API Integration
 * 
 * Setup Instructions:
 * 1. Enable Google Analytics Data API in Google Cloud Console
 * 2. Create a Service Account with Analytics Viewer role
 * 3. Download JSON key and add to .env:
 *    - GOOGLE_SERVICE_ACCOUNT_EMAIL
 *    - GOOGLE_PRIVATE_KEY
 *    - GA4_PROPERTY_ID (your GA4 property ID, e.g., "123456789")
 * 4. Add service account email to GA4 property with Viewer permissions
 * 
 * Documentation: https://developers.google.com/analytics/devguides/reporting/data/v1
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { BetaAnalyticsDataClient } from '@google-analytics/data'

// Initialize GA4 client
const analyticsDataClient = new BetaAnalyticsDataClient({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
})

const propertyId = process.env.GA4_PROPERTY_ID

export interface TrafficData {
  totalUsers: number
  totalSessions: number
  totalPageViews: number
  bounceRate: number
  avgSessionDuration: string
  newUsersRate: number
}

export interface TrafficSource {
  source: string
  medium: string
  users: number
  sessions: number
  pageViews: number
  percentage: number
}

export interface GeographicData {
  country: string
  users: number
  sessions: number
  percentage: number
}

export interface DeviceData {
  category: string
  users: number
  sessions: number
  percentage: number
}

export interface PageData {
  page: string
  pageViews: number
  uniquePageViews: number
  avgTimeOnPage: string
  bounceRate: number
}

/**
 * Get overall traffic metrics
 */
export async function getTrafficMetrics(
  startDate: string = '30daysAgo',
  endDate: string = 'today'
): Promise<TrafficData> {
  if (!propertyId) {
    throw new Error('GA4_PROPERTY_ID is not configured')
  }

  try {
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: 'totalUsers' },
        { name: 'sessions' },
        { name: 'screenPageViews' },
        { name: 'bounceRate' },
        { name: 'averageSessionDuration' },
        { name: 'newUsers' },
      ],
    })

    const row = response.rows?.[0]
    if (!row) {
      return {
        totalUsers: 0,
        totalSessions: 0,
        totalPageViews: 0,
        bounceRate: 0,
        avgSessionDuration: '0m 0s',
        newUsersRate: 0,
      }
    }

    const totalUsers = parseInt(row.metricValues?.[0]?.value || '0')
    const sessions = parseInt(row.metricValues?.[1]?.value || '0')
    const pageViews = parseInt(row.metricValues?.[2]?.value || '0')
    const bounceRate = parseFloat(row.metricValues?.[3]?.value || '0')
    const avgDuration = parseInt(row.metricValues?.[4]?.value || '0')
    const newUsers = parseInt(row.metricValues?.[5]?.value || '0')

    return {
      totalUsers,
      totalSessions: sessions,
      totalPageViews: pageViews,
      bounceRate: Math.round(bounceRate * 100),
      avgSessionDuration: formatDuration(avgDuration),
      newUsersRate: totalUsers > 0 ? Math.round((newUsers / totalUsers) * 100) : 0,
    }
  } catch (error) {
    console.error('Error fetching GA4 traffic metrics:', error)
    throw error
  }
}

/**
 * Get traffic by source/medium
 */
export async function getTrafficSources(
  startDate: string = '30daysAgo',
  endDate: string = 'today',
  limit: number = 10
): Promise<TrafficSource[]> {
  if (!propertyId) {
    throw new Error('GA4_PROPERTY_ID is not configured')
  }

  try {
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [
        { name: 'sessionSource' },
        { name: 'sessionMedium' },
      ],
      metrics: [
        { name: 'totalUsers' },
        { name: 'sessions' },
        { name: 'screenPageViews' },
      ],
      orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }],
      limit,
    })

    const totalUsers = response.rows?.reduce((sum, row) => {
      return sum + parseInt(row.metricValues?.[0]?.value || '0')
    }, 0) || 1

    return (response.rows || []).map(row => ({
      source: row.dimensionValues?.[0]?.value || 'Unknown',
      medium: row.dimensionValues?.[1]?.value || 'Unknown',
      users: parseInt(row.metricValues?.[0]?.value || '0'),
      sessions: parseInt(row.metricValues?.[1]?.value || '0'),
      pageViews: parseInt(row.metricValues?.[2]?.value || '0'),
      percentage: Math.round((parseInt(row.metricValues?.[0]?.value || '0') / totalUsers) * 100),
    }))
  } catch (error) {
    console.error('Error fetching GA4 traffic sources:', error)
    throw error
  }
}

/**
 * Get geographic data (countries)
 */
export async function getGeographicData(
  startDate: string = '30daysAgo',
  endDate: string = 'today',
  limit: number = 10
): Promise<GeographicData[]> {
  if (!propertyId) {
    throw new Error('GA4_PROPERTY_ID is not configured')
  }

  try {
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'country' }],
      metrics: [
        { name: 'totalUsers' },
        { name: 'sessions' },
      ],
      orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }],
      limit,
    })

    const totalUsers = response.rows?.reduce((sum, row) => {
      return sum + parseInt(row.metricValues?.[0]?.value || '0')
    }, 0) || 1

    return (response.rows || []).map(row => ({
      country: row.dimensionValues?.[0]?.value || 'Unknown',
      users: parseInt(row.metricValues?.[0]?.value || '0'),
      sessions: parseInt(row.metricValues?.[1]?.value || '0'),
      percentage: Math.round((parseInt(row.metricValues?.[0]?.value || '0') / totalUsers) * 100),
    }))
  } catch (error) {
    console.error('Error fetching GA4 geographic data:', error)
    throw error
  }
}

/**
 * Get device category data (desktop, mobile, tablet)
 */
export async function getDeviceData(
  startDate: string = '30daysAgo',
  endDate: string = 'today'
): Promise<DeviceData[]> {
  if (!propertyId) {
    throw new Error('GA4_PROPERTY_ID is not configured')
  }

  try {
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'deviceCategory' }],
      metrics: [
        { name: 'totalUsers' },
        { name: 'sessions' },
      ],
      orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }],
    })

    const totalUsers = response.rows?.reduce((sum, row) => {
      return sum + parseInt(row.metricValues?.[0]?.value || '0')
    }, 0) || 1

    return (response.rows || []).map(row => ({
      category: row.dimensionValues?.[0]?.value || 'Unknown',
      users: parseInt(row.metricValues?.[0]?.value || '0'),
      sessions: parseInt(row.metricValues?.[1]?.value || '0'),
      percentage: Math.round((parseInt(row.metricValues?.[0]?.value || '0') / totalUsers) * 100),
    }))
  } catch (error) {
    console.error('Error fetching GA4 device data:', error)
    throw error
  }
}

/**
 * Get top pages
 */
export async function getTopPages(
  startDate: string = '30daysAgo',
  endDate: string = 'today',
  limit: number = 10
): Promise<PageData[]> {
  if (!propertyId) {
    throw new Error('GA4_PROPERTY_ID is not configured')
  }

  try {
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'totalUsers' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' },
      ],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit,
    })

    return (response.rows || []).map(row => ({
      page: row.dimensionValues?.[0]?.value || '/',
      pageViews: parseInt(row.metricValues?.[0]?.value || '0'),
      uniquePageViews: parseInt(row.metricValues?.[1]?.value || '0'),
      avgTimeOnPage: formatDuration(parseInt(row.metricValues?.[2]?.value || '0')),
      bounceRate: Math.round(parseFloat(row.metricValues?.[3]?.value || '0') * 100),
    }))
  } catch (error) {
    console.error('Error fetching GA4 top pages:', error)
    throw error
  }
}

/**
 * Get real-time active users
 */
export async function getActiveUsers(): Promise<number> {
  if (!propertyId) {
    throw new Error('GA4_PROPERTY_ID is not configured')
  }

  try {
    const [response] = await analyticsDataClient.runRealtimeReport({
      property: `properties/${propertyId}`,
      metrics: [{ name: 'activeUsers' }],
    })

    return parseInt(response.rows?.[0]?.metricValues?.[0]?.value || '0')
  } catch (error) {
    console.error('Error fetching GA4 active users:', error)
    return 0
  }
}

/**
 * Get traffic trend (daily data for charts)
 */
export async function getTrafficTrend(
  startDate: string = '30daysAgo',
  endDate: string = 'today'
) {
  if (!propertyId) {
    throw new Error('GA4_PROPERTY_ID is not configured')
  }

  try {
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'date' }],
      metrics: [
        { name: 'totalUsers' },
        { name: 'sessions' },
        { name: 'screenPageViews' },
      ],
      orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }],
    })

    return (response.rows || []).map(row => ({
      date: row.dimensionValues?.[0]?.value || '',
      users: parseInt(row.metricValues?.[0]?.value || '0'),
      sessions: parseInt(row.metricValues?.[1]?.value || '0'),
      pageViews: parseInt(row.metricValues?.[2]?.value || '0'),
    }))
  } catch (error) {
    console.error('Error fetching GA4 traffic trend:', error)
    throw error
  }
}

/**
 * Helper: Format duration in seconds to readable format
 */
function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes}m ${secs}s`
}

/**
 * Check if GA4 is configured
 */
export function isGA4Configured(): boolean {
  return !!(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_PRIVATE_KEY &&
    process.env.GA4_PROPERTY_ID
  )
}
