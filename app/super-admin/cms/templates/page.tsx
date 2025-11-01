/**
 * CMS Templates List Page
 * Browse and manage page templates
 * 
 * @route /super-admin/cms/templates
 */

'use client';

import { TemplateList } from '@/components/cms/template-list';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UsageInfo } from '@/components/cms/usage-info';

export default function TemplatesPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <UsageInfo
        title="📑 Page Templates Management"
        description="Page templates allow you to create reusable layouts with predefined sections. Use templates to maintain consistent designs across multiple pages and speed up page creation."
        features={[
          "Create custom page templates with sections",
          "Reuse templates across multiple pages",
          "Edit template structure and default content",
          "Preview templates before applying",
          "Duplicate templates for variations",
          "Manage template sections and components"
        ]}
        tips={[
          "Create templates for common page types (landing, blog, product)",
          "Templates save time when creating similar pages",
          "Update a template to affect all pages using it",
          "Test templates thoroughly before applying to live pages"
        ]}
      />
      
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
