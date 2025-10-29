/**
 * CMS New Page Creation Page
 */

import { Metadata } from 'next';
import { CmsPageForm } from '@/components/cms/page-form';

export const metadata: Metadata = {
  title: 'Create New Page | CMS | Zyphex Tech',
  description: 'Create a new CMS page',
};

export default function NewCmsPage() {
  return (
    <div className="container mx-auto py-8">
      <CmsPageForm mode="create" />
    </div>
  );
}
