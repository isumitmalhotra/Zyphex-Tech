/**
 * CMS Template View Page
 * View template details and sections
 * 
 * @route /admin/cms/templates/[id]
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, ArrowLeft, Copy, Trash2 } from 'lucide-react';
import { useCMSPermissions } from '@/hooks/use-cms-permissions';
import Image from 'next/image';

interface TemplateSection {
  id: string;
  sectionKey: string;
  sectionType: string;
  title?: string;
  order: number;
}

interface Template {
  id: string;
  name: string;
  description?: string;
  category: string;
  thumbnail?: string;
  isPublic: boolean;
  sections: TemplateSection[];
  _count: {
    pages: number;
  };
  createdAt: string;
  updatedAt: string;
}

export default function TemplateViewPage({ params }: { params: { id: string } }) {
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { hasPermission } = useCMSPermissions();

  const canEdit = hasPermission('cms.templates.edit');
  const canDelete = hasPermission('cms.templates.delete');

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

  const handleEdit = () => {
    router.push(`/admin/cms/templates/${params.id}/edit`);
  };

  const handleDuplicate = async () => {
    try {
      const response = await fetch(`/api/cms/templates/${params.id}/duplicate`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/admin/cms/templates/${data.data.id}/edit`);
      }
    } catch (error) {
      console.error('Failed to duplicate template:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      const response = await fetch(`/api/cms/templates/${params.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/admin/cms/templates');
      }
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
              <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="container mx-auto py-6">
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
    <div className="container mx-auto py-6 space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="flex gap-2">
          {canEdit && (
            <>
              <Button onClick={handleDuplicate}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </Button>
              <Button onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </>
          )}
          {canDelete && (
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Template Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-3xl">{template.name}</CardTitle>
              {template.description && (
                <CardDescription className="text-base">
                  {template.description}
                </CardDescription>
              )}
            </div>
            {template.thumbnail && (
              <div className="relative w-48 h-32 rounded-lg overflow-hidden border">
                <Image 
                  src={template.thumbnail} 
                  alt={template.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-4">
            <Badge variant="secondary">{template.category}</Badge>
            {template.isPublic && (
              <Badge variant="outline">Public</Badge>
            )}
            <Badge variant="outline">
              Used in {template._count.pages} {template._count.pages === 1 ? 'page' : 'pages'}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Sections List */}
      <Card>
        <CardHeader>
          <CardTitle>Template Sections ({template.sections.length})</CardTitle>
          <CardDescription>
            Sections that will be created when this template is applied
          </CardDescription>
        </CardHeader>
        <CardContent>
          {template.sections.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>This template has no sections yet.</p>
              {canEdit && (
                <Button 
                  variant="outline" 
                  onClick={handleEdit}
                  className="mt-4"
                >
                  Edit Template
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {template.sections.map((section, index) => (
                <div
                  key={section.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="font-mono">
                      {index + 1}
                    </Badge>
                    <div>
                      <p className="font-medium">{section.title || 'Untitled Section'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {section.sectionType}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {section.sectionKey}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Metadata</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Created</dt>
              <dd className="font-medium">
                {new Date(template.createdAt).toLocaleDateString()}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Last Updated</dt>
              <dd className="font-medium">
                {new Date(template.updatedAt).toLocaleDateString()}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Template ID</dt>
              <dd className="font-mono text-xs">{template.id}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Sections Count</dt>
              <dd className="font-medium">{template.sections.length}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
