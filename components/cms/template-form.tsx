/**
 * CMS Template Form Component
 * Create and edit page templates
 */

'use client';

import { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const templateFormSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(255),
  description: z.string().max(500).optional(),
  category: z.enum(['landing', 'blog', 'marketing', 'ecommerce', 'portfolio', 'corporate', 'other']),
  thumbnailUrl: z.string().url().optional().or(z.literal('')),
  templateStructure: z.any().optional(), // JSON structure
  defaultContent: z.any().optional(), // JSON default content
});

type TemplateFormValues = z.infer<typeof templateFormSchema>;

interface TemplateFormProps {
  templateId?: string;
  initialData?: Partial<TemplateFormValues>;
  mode?: 'create' | 'edit';
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function TemplateForm({ templateId, initialData, mode = 'create', onSuccess, onCancel }: TemplateFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: initialData || {
      category: 'other',
      templateStructure: { sections: [] },
    },
  });

  const onSubmit = async (values: TemplateFormValues) => {
    setSaving(true);
    try {
      const url = mode === 'edit' ? `/api/cms/templates/${templateId}` : '/api/cms/templates';
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
          description: `Template ${mode === 'edit' ? 'updated' : 'created'} successfully`,
        });
        if (onSuccess) {
          onSuccess();
        } else {
          router.push('/admin/cms/templates');
        }
      } else {
        throw new Error(data.error || `Failed to ${mode} template`);
      }
    } catch (error) {
      console.error(`Error ${mode}ing template:`, error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : `Failed to ${mode} template`,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.push('/admin/cms/templates');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              {mode === 'edit' ? 'Edit Template' : 'Create New Template'}
            </h2>
            <p className="text-muted-foreground">
              {mode === 'edit' 
                ? 'Update template details and settings' 
                : 'Create a reusable template for pages'
              }
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Save className="w-4 h-4 mr-2" />
              {mode === 'edit' ? 'Update' : 'Create'} Template
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Template Details</CardTitle>
            <CardDescription>
              Configure the basic information for this template
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Landing Page Template" />
                  </FormControl>
                  <FormDescription>
                    A descriptive name for this template
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="A brief description of what this template is for..."
                      rows={3}
                    />
                  </FormControl>
                  <FormDescription>
                    Help others understand when to use this template
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="landing">Landing Pages</SelectItem>
                      <SelectItem value="blog">Blog</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="ecommerce">E-commerce</SelectItem>
                      <SelectItem value="portfolio">Portfolio</SelectItem>
                      <SelectItem value="corporate">Corporate</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Organize templates by category
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="thumbnailUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Thumbnail URL (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://example.com/template-preview.jpg" />
                  </FormControl>
                  <FormDescription>
                    A preview image for this template
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}
