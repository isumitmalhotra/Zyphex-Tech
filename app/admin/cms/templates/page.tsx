/**
 * CMS Templates List Page
 * Browse and manage page templates
 * 
 * @route /admin/cms/templates
 */

'use client';

import { TemplateList } from '@/components/cms/template-list';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TemplatesPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Page Templates</CardTitle>
          <CardDescription>
            Create and manage reusable page templates with predefined sections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TemplateList />
        </CardContent>
      </Card>
    </div>
  );
}
