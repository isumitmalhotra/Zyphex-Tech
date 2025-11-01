/**
 * CMS Analytics Page
 * Display comprehensive analytics dashboard
 */

import { Metadata } from 'next';
import { AnalyticsDashboard } from '@/components/cms/analytics-dashboard';
import { UsageInfo } from '@/components/cms/usage-info';

export const metadata: Metadata = {
  title: 'Analytics | CMS',
  description: 'View page analytics and engagement metrics',
};

export default function AnalyticsPage() {
  return (
    <div className="container mx-auto py-8 space-y-6">
      <UsageInfo
        title="📊 CMS Analytics Dashboard"
        description="Track and analyze how your website content is performing. View detailed metrics about page views, user engagement, popular content, and content effectiveness."
        features={[
          "View page view statistics and trends",
          "Track user engagement metrics",
          "Identify most popular pages and content",
          "Monitor content performance over time",
          "Analyze traffic sources and user behavior",
          "Export analytics data for reporting",
          "Compare performance across different time periods"
        ]}
        tips={[
          "Check analytics regularly to understand user preferences",
          "Use insights to optimize underperforming content",
          "Monitor trends to plan future content strategy",
          "Compare metrics before and after content updates"
        ]}
      />
      <AnalyticsDashboard />
    </div>
  );
}
