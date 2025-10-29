/**
 * CMS Page Editor
 * Edit page with section management
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CmsPageForm } from '@/components/cms/page-form';
import { SectionList } from '@/components/cms/section-list';
import { VersionHistory } from '@/components/cms/version-history';
import { ScheduleManager } from '@/components/cms/schedule-manager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, ArrowLeft, Eye, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCMSPermissions } from '@/hooks/use-cms-permissions';

interface PageEditorProps {
  pageId: string;
}

interface PageData {
  id: string;
  pageKey: string;
  pageTitle: string;
  slug: string;
  status: string;
  pageType: 'standard' | 'landing' | 'blog' | 'custom';
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  isPublic: boolean;
  requiresAuth: boolean;
  allowComments: boolean;
  layout?: string;
  _count?: {
    sections: number;
    versions: number;
  };
}

export function PageEditor({ pageId }: PageEditorProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { hasPermission, isLoading: permissionsLoading } = useCMSPermissions();
  const [loading, setLoading] = useState(true);
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  
  // Save as Template Dialog State
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateData, setTemplateData] = useState({
    name: '',
    description: '',
    category: 'landing' as const,
    thumbnail: '',
    isPublic: true,
  });

  const canEdit = hasPermission('cms.pages.edit');
  const canManageSections = hasPermission('cms.sections.edit');
  const canCreateTemplates = hasPermission('cms.templates.create');

  const fetchPageData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/cms/pages/${pageId}`);
      const data = await response.json();

      if (data.success) {
        setPageData(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch page');
      }
    } catch (error) {
      console.error('Error fetching page:', error);
      toast({
        title: 'Error',
        description: 'Failed to load page. Please try again.',
        variant: 'destructive',
      });
      router.push('/admin/cms/pages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!permissionsLoading) {
      fetchPageData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId, permissionsLoading]);

  const handleSaveAsTemplate = async () => {
    if (!templateData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a template name',
        variant: 'destructive',
      });
      return;
    }

    setSavingTemplate(true);
    try {
      const response = await fetch(`/api/cms/pages/${pageId}/save-as-template`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Page saved as template successfully',
        });
        setShowTemplateDialog(false);
        setTemplateData({
          name: '',
          description: '',
          category: 'landing',
          thumbnail: '',
          isPublic: true,
        });
        // Optionally navigate to the template
        // router.push(`/admin/cms/templates/${data.data.id}`);
      } else {
        throw new Error(data.message || 'Failed to save template');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save template',
        variant: 'destructive',
      });
    } finally {
      setSavingTemplate(false);
    }
  };

  if (permissionsLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
        <p className="text-muted-foreground mb-6">
          You don&apos;t have permission to edit pages.
        </p>
        <Button onClick={() => router.push('/admin/cms/pages')}>
          Back to Pages
        </Button>
      </div>
    );
  }

  if (!pageData) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Page Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Button onClick={() => router.push('/admin/cms/pages')}>
          Back to Pages
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/admin/cms/pages')}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{pageData.pageTitle}</h1>
            <p className="text-muted-foreground">Edit page content and settings</p>
          </div>
        </div>
        <div className="flex gap-2">
          {canCreateTemplates && pageData._count?.sections && pageData._count.sections > 0 && (
            <Button
              variant="outline"
              onClick={() => {
                setTemplateData({
                  ...templateData,
                  name: `${pageData.pageTitle} Template`,
                  description: pageData.metaDescription || '',
                });
                setShowTemplateDialog(true);
              }}
            >
              <Save className="w-4 h-4 mr-2" />
              Save as Template
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => window.open(`/${pageData.slug}`, '_blank')}
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details">Page Details</TabsTrigger>
          <TabsTrigger value="sections" disabled={!canManageSections}>
            Sections ({pageData._count?.sections || 0})
          </TabsTrigger>
          <TabsTrigger value="versions">
            Version History ({pageData._count?.versions || 0})
          </TabsTrigger>
          <TabsTrigger value="schedules">
            Schedules
          </TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <CmsPageForm
            pageId={pageId}
            initialData={pageData}
            mode="edit"
          />
        </TabsContent>

        <TabsContent value="sections">
          <SectionList pageId={pageId} />
        </TabsContent>

        <TabsContent value="versions">
          <VersionHistory pageId={pageId} />
        </TabsContent>

        <TabsContent value="schedules">
          <ScheduleManager pageId={pageId} />
        </TabsContent>

        <TabsContent value="seo">
          <div className="text-center py-12 border rounded-lg">
            <h3 className="text-xl font-semibold mb-2">SEO Settings</h3>
            <p className="text-muted-foreground">
              SEO fields are available in the Page Details tab
            </p>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <div className="text-center py-12 border rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Page Settings</h3>
            <p className="text-muted-foreground">
              Page settings are available in the Page Details tab
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Save as Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
            <DialogDescription>
              Create a reusable template from this page with {pageData._count?.sections || 0} sections
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name *</Label>
              <Input
                id="template-name"
                value={templateData.name}
                onChange={(e) => setTemplateData({ ...templateData, name: e.target.value })}
                placeholder="Enter template name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-description">Description</Label>
              <Textarea
                id="template-description"
                value={templateData.description}
                onChange={(e) => setTemplateData({ ...templateData, description: e.target.value })}
                placeholder="Describe what this template is for"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-category">Category *</Label>
              <Select
                value={templateData.category}
                onValueChange={(value) => 
                  setTemplateData({ 
                    ...templateData, 
                    category: value as typeof templateData.category 
                  })
                }
              >
                <SelectTrigger id="template-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="landing">Landing Page</SelectItem>
                  <SelectItem value="blog">Blog</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="ecommerce">E-commerce</SelectItem>
                  <SelectItem value="portfolio">Portfolio</SelectItem>
                  <SelectItem value="corporate">Corporate</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-thumbnail">Thumbnail URL</Label>
              <Input
                id="template-thumbnail"
                type="url"
                value={templateData.thumbnail}
                onChange={(e) => setTemplateData({ ...templateData, thumbnail: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="template-public"
                checked={templateData.isPublic}
                onCheckedChange={(checked) => 
                  setTemplateData({ ...templateData, isPublic: checked })
                }
              />
              <Label htmlFor="template-public">
                Make template public (visible to all users)
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowTemplateDialog(false)}
              disabled={savingTemplate}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveAsTemplate} disabled={savingTemplate}>
              {savingTemplate && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
