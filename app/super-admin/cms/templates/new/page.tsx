/**
 * CMS Create Template Page
 * Create a new page template
 * 
 * @route /admin/cms/templates/new
 */

'use client';

import { TemplateForm } from '@/components/cms/template-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

export default function NewTemplatePage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push('/admin/cms/templates');
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Create Template</CardTitle>
          <CardDescription>
            Create a new page template with reusable sections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TemplateForm 
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </CardContent>
      </Card>
    </div>
  );
}
