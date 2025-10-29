/**
 * CMS Pages Management Page
 * List all CMS pages with management features
 */

import { Metadata } from 'next';
import { CmsPagesList } from '@/components/cms/pages-list';

export const metadata: Metadata = {
  title: 'CMS Pages | Zyphex Tech',
  description: 'Manage your website pages and content',
};

export default function CmsPagesPage() {
  return (
    <div className="container mx-auto py-8">
      <CmsPagesList />
    </div>
  );
}
