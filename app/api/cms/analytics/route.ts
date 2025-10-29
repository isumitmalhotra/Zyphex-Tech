/**
 * CMS Analytics API Route
 * Fetch analytics data for pages
 * 
 * @route GET /api/cms/analytics
 * @access Protected - Requires CMS permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const pageId = searchParams.get('pageId');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Start date and end date are required' },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Calculate previous period for comparison
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const prevStart = new Date(start);
    prevStart.setDate(prevStart.getDate() - daysDiff);
    const prevEnd = new Date(start);
    prevEnd.setDate(prevEnd.getDate() - 1);

    // Build where clause
    const whereClause = pageId
      ? { pageId, createdAt: { gte: start, lte: end } }
      : { createdAt: { gte: start, lte: end } };

    const prevWhereClause = pageId
      ? { pageId, createdAt: { gte: prevStart, lte: prevEnd } }
      : { createdAt: { gte: prevStart, lte: prevEnd } };

    // Fetch current period analytics (mock data for now - you'll need to implement real tracking)
    // This is a placeholder structure. In a real implementation, you would:
    // 1. Create a PageView model to track actual page views
    // 2. Store visitor data with session tracking
    // 3. Record engagement metrics
    
    // For now, we'll return sample data based on activity logs as a proxy
    const currentPeriodLogs = await prisma.cmsActivityLog.count({
      where: whereClause,
    });

    const previousPeriodLogs = await prisma.cmsActivityLog.count({
      where: prevWhereClause,
    });

    // Calculate mock metrics (replace with real data in production)
    const totalViews = currentPeriodLogs * 10; // Mock multiplier
    const uniqueVisitors = Math.floor(currentPeriodLogs * 6.5);
    const avgTimeOnPage = 145; // seconds
    const engagementRate = 68;

    const prevTotalViews = previousPeriodLogs * 10;
    const prevUniqueVisitors = Math.floor(previousPeriodLogs * 6.5);

    const viewsChange = prevTotalViews > 0 
      ? Math.round(((totalViews - prevTotalViews) / prevTotalViews) * 100)
      : 0;
    
    const visitorsChange = prevUniqueVisitors > 0
      ? Math.round(((uniqueVisitors - prevUniqueVisitors) / prevUniqueVisitors) * 100)
      : 0;

    // Generate chart data (daily breakdown)
    const chartData = [];
    const currentDate = new Date(start);
    while (currentDate <= end) {
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      const dayLogs = await prisma.cmsActivityLog.count({
        where: {
          entityType: 'page',
          ...(pageId ? { entityId: pageId } : {}),
          createdAt: { gte: dayStart, lte: dayEnd },
        },
      });

      chartData.push({
        date: currentDate.toISOString().split('T')[0],
        views: dayLogs * 10,
        visitors: Math.floor(dayLogs * 6.5),
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Get top pages (if not filtering by specific page)
    const topPages: Array<{
      pageId: string;
      pageTitle: string;
      slug: string;
      views: number;
      uniqueVisitors: number;
      avgTimeOnPage: number;
      bounceRate: number;
    }> = [];
    
    if (!pageId) {
      // Get activity counts per page
      const pageActivities = await prisma.cmsActivityLog.groupBy({
        by: ['entityId'],
        where: {
          entityType: 'page',
          createdAt: { gte: start, lte: end },
        },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: 10,
      });

      // Fetch page details
      const pageIds = pageActivities.map(p => p.entityId);
      const pages = await prisma.cmsPage.findMany({
        where: {
          id: { in: pageIds },
          deletedAt: null,
        },
        select: {
          id: true,
          pageTitle: true,
          slug: true,
        },
      });

      // Combine data
      const pageMap = new Map(pages.map(p => [p.id, p]));
      
      pageActivities.forEach((activity) => {
        const page = pageMap.get(activity.entityId);
        if (page) {
          topPages.push({
            pageId: page.id,
            pageTitle: page.pageTitle,
            slug: page.slug,
            views: activity._count.id * 10,
            uniqueVisitors: Math.floor(activity._count.id * 6.5),
            avgTimeOnPage: Math.floor(Math.random() * 200) + 60, // Mock data
            bounceRate: Math.floor(Math.random() * 40) + 20, // Mock data
          });
        }
      });
    }

    // Mock traffic sources
    const trafficSources = [
      { source: 'direct', visitors: Math.floor(uniqueVisitors * 0.35), percentage: 35 },
      { source: 'organic search', visitors: Math.floor(uniqueVisitors * 0.30), percentage: 30 },
      { source: 'social media', visitors: Math.floor(uniqueVisitors * 0.20), percentage: 20 },
      { source: 'referral', visitors: Math.floor(uniqueVisitors * 0.10), percentage: 10 },
      { source: 'email', visitors: Math.floor(uniqueVisitors * 0.05), percentage: 5 },
    ];

    return NextResponse.json({
      success: true,
      data: {
        metrics: {
          totalViews,
          uniqueVisitors,
          avgTimeOnPage,
          engagementRate,
          viewsChange,
          visitorsChange,
          timeChange: 5, // Mock
          engagementChange: 12, // Mock
        },
        chartData,
        topPages,
        trafficSources,
      },
    });

  } catch (error) {
    console.error('CMS Analytics GET Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'Failed to fetch analytics',
      },
      { status: 500 }
    );
  }
}
