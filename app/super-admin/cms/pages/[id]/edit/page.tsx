/**
 * CMS Page Edit Page
 */

import { Metadata } from 'next';
import { PageEditor } from '@/components/cms/page-editor';

export const metadata: Metadata = {
  title: 'Edit Page | CMS | Zyphex Tech',
  description: 'Edit CMS page',
};

interface EditPageProps {
  params: {
    id: string;
  };
}

export default function EditCmsPage({ params }: EditPageProps) {
  return (
    <div className="container mx-auto py-8">
      <PageEditor pageId={params.id} />
    </div>
  );
}
