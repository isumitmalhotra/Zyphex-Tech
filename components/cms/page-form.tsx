/**
 * CMS Page Form Component
 * Form for creating and editing CMS pages
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const pageFormSchema = z.object({
  pageKey: z
    .string()
    .min(1, 'Page key is required')
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens allowed'),
  pageTitle: z.string().min(1, 'Page title is required').max(255),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(255)
    .regex(/^[a-z0-9-\/]+$/, 'Only lowercase letters, numbers, hyphens, and slashes allowed'),
  pageType: z.enum(['standard', 'landing', 'blog', 'custom']),
  
  // SEO
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
  metaKeywords: z.string().max(255).optional(),
  
  // Open Graph
  ogTitle: z.string().max(60).optional(),
  ogDescription: z.string().max(160).optional(),
  ogImage: z.string().url().optional().or(z.literal('')),
  
  // Settings
  isPublic: z.boolean().default(true),
  requiresAuth: z.boolean().default(false),
  allowComments: z.boolean().default(false),
  layout: z.string().optional(),
});

type PageFormValues = z.infer<typeof pageFormSchema>;

interface CmsPageFormProps {
  pageId?: string;
  initialData?: Partial<PageFormValues>;
  mode?: 'create' | 'edit';
}

export function CmsPageForm({ pageId, initialData, mode = 'create' }: CmsPageFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const form = useForm<PageFormValues>({
    resolver: zodResolver(pageFormSchema),
    defaultValues: initialData || {
      pageType: 'standard',
      isPublic: true,
      requiresAuth: false,
      allowComments: false,
    },
  });

  // Auto-generate slug from page title
  const watchPageTitle = form.watch('pageTitle');
  useEffect(() => {
    if (mode === 'create' && watchPageTitle && !form.getValues('slug')) {
      const slug = watchPageTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      form.setValue('slug', slug);
    }
  }, [watchPageTitle, mode, form]);

  // Auto-generate page key from slug
  const watchSlug = form.watch('slug');
  useEffect(() => {
    if (mode === 'create' && watchSlug && !form.getValues('pageKey')) {
      const pageKey = watchSlug.replace(/\//g, '-');
      form.setValue('pageKey', pageKey);
    }
  }, [watchSlug, mode, form]);

  // Auto-fill meta title from page title
  const watchMetaTitle = form.watch('metaTitle');
  useEffect(() => {
    if (!watchMetaTitle && watchPageTitle) {
      form.setValue('metaTitle', watchPageTitle);
    }
  }, [watchPageTitle, watchMetaTitle, form]);

  const onSubmit = async (values: PageFormValues) => {
    setSaving(true);
    try {
      const url = mode === 'edit' ? `/api/cms/pages/${pageId}` : '/api/cms/pages';
      const method = mode === 'edit' ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: `Page ${mode === 'edit' ? 'updated' : 'created'} successfully`,
        });
        router.push(`/admin/cms/pages/${data.data.id}/edit`);
      } else {
        throw new Error(data.error || `Failed to ${mode} page`);
      }
    } catch (error) {
      console.error(`Error ${mode}ing page:`, error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : `Failed to ${mode} page`,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              {mode === 'edit' ? 'Edit Page' : 'Create New Page'}
            </h2>
            <p className="text-muted-foreground">
              {mode === 'edit' 
                ? 'Update page details and settings' 
                : 'Set up your new page details and settings'
              }
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/cms/pages')}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Save className="w-4 h-4 mr-2" />
              {mode === 'edit' ? 'Update' : 'Create'} Page
            </Button>
          </div>
        </div>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Page Details</CardTitle>
                <CardDescription>
                  Basic information about your page
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="pageTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Page Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="About Us" {...field} />
                      </FormControl>
                      <FormDescription>
                        The main title of your page
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL Slug *</FormLabel>
                      <FormControl>
                        <div className="flex items-center">
                          <span className="text-muted-foreground mr-2">/</span>
                          <Input placeholder="about-us" {...field} />
                        </div>
                      </FormControl>
                      <FormDescription>
                        The URL path for this page
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pageKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Page Key *</FormLabel>
                      <FormControl>
                        <Input placeholder="about-us" {...field} />
                      </FormControl>
                      <FormDescription>
                        Unique identifier for this page (auto-generated)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pageType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Page Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select page type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="landing">Landing Page</SelectItem>
                          <SelectItem value="blog">Blog Post</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The type of page you&apos;re creating
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* SEO Tab */}
          <TabsContent value="seo" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Search Engine Optimization</CardTitle>
                <CardDescription>
                  Optimize your page for search engines
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="metaTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta Title</FormLabel>
                      <FormControl>
                        <Input placeholder="About Us - Company Name" {...field} />
                      </FormControl>
                      <FormDescription>
                        Title for search engines (max 60 characters)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="metaDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief description of your page..."
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Description for search results (max 160 characters)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="metaKeywords"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta Keywords</FormLabel>
                      <FormControl>
                        <Input placeholder="about, company, team" {...field} />
                      </FormControl>
                      <FormDescription>
                        Comma-separated keywords
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Open Graph (Social Media)</CardTitle>
                <CardDescription>
                  How your page appears when shared on social media
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="ogTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>OG Title</FormLabel>
                      <FormControl>
                        <Input placeholder="About Us" {...field} />
                      </FormControl>
                      <FormDescription>
                        Title for social media shares
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ogDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>OG Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Description..." {...field} />
                      </FormControl>
                      <FormDescription>
                        Description for social media shares
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ogImage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>OG Image URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/image.jpg" {...field} />
                      </FormControl>
                      <FormDescription>
                        Image for social media shares (1200x630px recommended)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Page Settings</CardTitle>
                <CardDescription>
                  Configure page access and features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="isPublic"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Public Page</FormLabel>
                        <FormDescription>
                          Make this page visible to everyone
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requiresAuth"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Requires Authentication</FormLabel>
                        <FormDescription>
                          Users must be logged in to view this page
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="allowComments"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Allow Comments</FormLabel>
                        <FormDescription>
                          Enable comments on this page
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="layout"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Page Layout</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select layout" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="default">Default</SelectItem>
                          <SelectItem value="fullwidth">Full Width</SelectItem>
                          <SelectItem value="sidebar-left">Sidebar Left</SelectItem>
                          <SelectItem value="sidebar-right">Sidebar Right</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose a layout for this page
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </Form>
  );
}
