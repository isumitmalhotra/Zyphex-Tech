/**
 * CMS Pages Management Page
 * List all CMS pages with management features
 */

import { Metadata } from 'next';
import { CmsPagesList } from '@/components/cms/pages-list';
import { UsageInfo } from '@/components/cms/usage-info';

export const metadata: Metadata = {
  title: 'CMS Pages | Zyphex Tech',
  description: 'Manage your website pages and content',
};

export default function CmsPagesPage() {
  return (
    <div className="container mx-auto py-8">
      <UsageInfo
        title="📄 CMS Pages Management"
        description="This page allows you to manage all pages on your website. You can create new pages, edit existing ones, manage page templates, and control page visibility and publishing status."
        features={[
          "Create new pages with rich content editor",
          "Edit existing pages with live preview",
          "Manage page metadata (title, description, SEO)",
          "Control page visibility (published/draft)",
          "Schedule page publishing",
          "Duplicate pages for quick creation",
          "Apply templates to pages"
        ]}
        tips={[
          "Use templates to maintain consistent page layouts",
          "Draft pages are not visible to public users",
          "Schedule publishing for time-sensitive content",
          "Always preview pages before publishing"
        ]}
      />
      <CmsPagesList />
    </div>
  );
}
