/**
 * CMS Analytics Page
 * Display comprehensive analytics dashboard
 */

import { Metadata } from 'next';
import { AnalyticsDashboard } from '@/components/cms/analytics-dashboard';

export const metadata: Metadata = {
  title: 'Analytics | CMS',
  description: 'View page analytics and engagement metrics',
};

export default function AnalyticsPage() {
  return (
    <div className="container mx-auto py-8">
      <AnalyticsDashboard />
    </div>
  );
}
