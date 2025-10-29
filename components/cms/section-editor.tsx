/**
 * Section Editor Component
 * Dynamic form for editing section content based on type
 */

'use client';

import { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Section } from './section-list';

const sectionEditorSchema = z.object({
  sectionKey: z
    .string()
    .min(1, 'Section key is required')
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens allowed'),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  content: z.string().optional(),
  
  // Visibility
  isVisible: z.boolean().default(true),
  showOnDesktop: z.boolean().default(true),
  showOnTablet: z.boolean().default(true),
  showOnMobile: z.boolean().default(true),
  
  // Styling
  cssClasses: z.string().optional(),
});

type SectionEditorValues = z.infer<typeof sectionEditorSchema>;

interface SectionEditorProps {
  pageId: string;
  section: Section;
  onCancel: () => void;
  onSave: () => void;
}

export function SectionEditor({
  pageId,
  section,
  onCancel,
  onSave,
}: SectionEditorProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const form = useForm<SectionEditorValues>({
    resolver: zodResolver(sectionEditorSchema),
    defaultValues: {
      sectionKey: section.sectionKey,
      title: section.title || '',
      subtitle: section.subtitle || '',
      content: JSON.stringify(section.content, null, 2),
      isVisible: section.isVisible,
      showOnDesktop: section.showOnDesktop,
      showOnTablet: section.showOnTablet,
      showOnMobile: section.showOnMobile,
      cssClasses: section.cssClasses || '',
    },
  });

  const onSubmit = async (values: SectionEditorValues) => {
    setSaving(true);
    try {
      // Parse content JSON
      let contentObj = {};
      if (values.content) {
        try {
          contentObj = JSON.parse(values.content);
        } catch (_error) {
          throw new Error('Invalid JSON in content field');
        }
      }

      const response = await fetch(`/api/cms/pages/${pageId}/sections/${section.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionKey: values.sectionKey,
          title: values.title || null,
          subtitle: values.subtitle || null,
          content: contentObj,
          isVisible: values.isVisible,
          showOnDesktop: values.showOnDesktop,
          showOnTablet: values.showOnTablet,
          showOnMobile: values.showOnMobile,
          cssClasses: values.cssClasses || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Section updated successfully',
        });
        onSave();
      } else {
        throw new Error(data.error || 'Failed to update section');
      }
    } catch (error) {
      console.error('Error updating section:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update section',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Edit Section</h3>
            <p className="text-sm text-muted-foreground">
              Update section content and settings
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={saving}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>

        <Tabs defaultValue="content" className="w-full">
          <TabsList>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="visibility">Visibility</TabsTrigger>
            <TabsTrigger value="styling">Styling</TabsTrigger>
          </TabsList>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Section Content</CardTitle>
                <CardDescription>
                  Configure the content for this section
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="sectionKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Section Key</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="hero-section" />
                      </FormControl>
                      <FormDescription>
                        Unique identifier for this section (lowercase, hyphens only)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Section Title" />
                      </FormControl>
                      <FormDescription>
                        Main heading for this section
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subtitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subtitle (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Section Subtitle" />
                      </FormControl>
                      <FormDescription>
                        Supporting text below the title
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content (JSON)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder='{"key": "value"}'
                          rows={10}
                          className="font-mono text-sm"
                        />
                      </FormControl>
                      <FormDescription>
                        Section content as JSON. Will be validated on save.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Visibility Tab */}
          <TabsContent value="visibility" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Visibility Settings</CardTitle>
                <CardDescription>
                  Control where and when this section is visible
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="isVisible"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Visible</FormLabel>
                        <FormDescription>
                          Show this section on the page
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

                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Device Visibility</h4>
                  
                  <FormField
                    control={form.control}
                    name="showOnDesktop"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Show on Desktop</FormLabel>
                          <FormDescription>
                            Display on desktop screens (≥1024px)
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
                    name="showOnTablet"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Show on Tablet</FormLabel>
                          <FormDescription>
                            Display on tablet screens (768px - 1023px)
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
                    name="showOnMobile"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Show on Mobile</FormLabel>
                          <FormDescription>
                            Display on mobile screens (&lt;768px)
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
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Styling Tab */}
          <TabsContent value="styling" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Custom Styling</CardTitle>
                <CardDescription>
                  Add custom CSS classes and styles
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="cssClasses"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CSS Classes</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="bg-primary text-white p-8" />
                      </FormControl>
                      <FormDescription>
                        Space-separated CSS classes (Tailwind or custom)
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
