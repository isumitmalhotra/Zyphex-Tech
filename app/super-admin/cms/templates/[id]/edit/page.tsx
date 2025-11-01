/**
 * CMS Edit Template Page
 * Edit an existing page template
 * 
 * @route /admin/cms/templates/[id]/edit
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TemplateForm } from '@/components/cms/template-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description?: string;
  category: 'landing' | 'blog' | 'marketing' | 'ecommerce' | 'portfolio' | 'corporate' | 'other';
  thumbnailUrl?: string;
  templateStructure?: unknown;
  defaultContent?: unknown;
}

export default function EditTemplatePage({ params }: { params: { id: string } }) {
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const response = await fetch(`/api/cms/templates/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setTemplate(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch template:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [params.id]);

  const handleSuccess = () => {
    router.push(`/admin/cms/templates/${params.id}`);
  };

  const handleCancel = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 max-w-4xl">
        <Card>
          <CardHeader>
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-10 bg-muted animate-pulse rounded" />
              <div className="h-10 bg-muted animate-pulse rounded" />
              <div className="h-24 bg-muted animate-pulse rounded" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="container mx-auto py-6 max-w-4xl">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Template not found</p>
            <Button 
              variant="outline" 
              onClick={() => router.push('/admin/cms/templates')}
              className="mt-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Templates
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Edit Template</CardTitle>
          <CardDescription>
            Update template details and configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TemplateForm 
            templateId={template.id}
            initialData={template}
            mode="edit"
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </CardContent>
      </Card>
    </div>
  );
}
