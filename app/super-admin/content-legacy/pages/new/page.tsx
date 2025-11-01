'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Save, ArrowLeft, Info } from 'lucide-react'

export default function NewPagePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    path: '',
    description: '',
    metaTitle: '',
    metaDescription: '',
    isActive: false,
    order: 0,
  })

  const handleChange = (field: string, value: string | boolean | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const handleTitleChange = (title: string) => {
    handleChange('title', title)
    
    // Auto-generate slug and path if they're empty
    if (!formData.slug && !formData.path) {
      const slug = generateSlug(title)
      handleChange('slug', slug)
      handleChange('path', `/${slug}`)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      // Validation
      if (!formData.title.trim()) {
        toast({
          title: 'Validation Error',
          description: 'Page title is required',
          variant: 'destructive',
        })
        return
      }

      if (!formData.slug.trim()) {
        toast({
          title: 'Validation Error',
          description: 'Page slug is required',
          variant: 'destructive',
        })
        return
      }

      if (!formData.path.trim()) {
        toast({
          title: 'Validation Error',
          description: 'Page path is required',
          variant: 'destructive',
        })
        return
      }

      const res = await fetch('/api/super-admin/content/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Failed to create page')
      }

      const newPage = await res.json()

      toast({
        title: 'Success',
        description: formData.isActive 
          ? `Page created and published! View it at ${formData.path}` 
          : 'Page created as draft. Toggle publish status to make it live.',
      })

      // Navigate to the edit page of the newly created page
      router.push(`/super-admin/content/pages/${newPage.id}`)
    } catch (err) {
      console.error('Error creating page:', err)
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to create page',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create New Page</h1>
          <p className="text-muted-foreground">
            Add a new page to your website
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Publishing Info Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>How Page Publishing Works</AlertTitle>
          <AlertDescription>
            <div className="space-y-2 mt-2">
              <p>
                Pages you create will be accessible on your website at the path you specify. 
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong>Published pages:</strong> Visible to everyone at <code className="bg-muted px-1 py-0.5 rounded">yoursite.com/your-path</code></li>
                <li><strong>Draft pages:</strong> Only visible in admin panel, return 404 on website</li>
                <li><strong>Path examples:</strong> <code className="bg-muted px-1 py-0.5 rounded">/about</code>, <code className="bg-muted px-1 py-0.5 rounded">/services/web-development</code></li>
              </ul>
              <p className="text-sm mt-2">
                Toggle &quot;Publish Status&quot; to control visibility. You can always edit or unpublish later.
              </p>
            </div>
          </AlertDescription>
        </Alert>

        {/* Page Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Page Information</CardTitle>
            <CardDescription>
              Basic information about the new page
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Enter page title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <div className="flex gap-2">
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => handleChange('slug', e.target.value)}
                  placeholder="page-slug"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const slug = generateSlug(formData.title)
                    handleChange('slug', slug)
                    handleChange('path', `/${slug}`)
                  }}
                >
                  Generate
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                URL-friendly version of the title
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="path">Path *</Label>
              <Input
                id="path"
                value={formData.path}
                onChange={(e) => handleChange('path', e.target.value)}
                placeholder="/page-path"
              />
              <p className="text-xs text-muted-foreground">
                Full URL path (e.g., /about, /services/web-development)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Brief description of the page"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="order">Display Order</Label>
              <Input
                id="order"
                type="number"
                value={formData.order}
                onChange={(e) => handleChange('order', parseInt(e.target.value) || 0)}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Lower numbers appear first in navigation
              </p>
            </div>
          </CardContent>
        </Card>

        {/* SEO Card */}
        <Card>
          <CardHeader>
            <CardTitle>SEO Settings</CardTitle>
            <CardDescription>
              Optimize page for search engines
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="metaTitle">Meta Title</Label>
              <Input
                id="metaTitle"
                value={formData.metaTitle}
                onChange={(e) => handleChange('metaTitle', e.target.value)}
                placeholder="Enter meta title"
                maxLength={60}
              />
              <p className="text-xs text-muted-foreground">
                {formData.metaTitle.length}/60 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="metaDescription">Meta Description</Label>
              <Textarea
                id="metaDescription"
                value={formData.metaDescription}
                onChange={(e) => handleChange('metaDescription', e.target.value)}
                placeholder="Enter meta description"
                rows={3}
                maxLength={160}
              />
              <p className="text-xs text-muted-foreground">
                {formData.metaDescription.length}/160 characters
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle>Page Settings</CardTitle>
            <CardDescription>
              Configure page visibility and behavior
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Publish Status</Label>
                <p className="text-sm text-muted-foreground">
                  {formData.isActive ? 'Page will be live and visible to visitors' : 'Page will be saved as draft'}
                </p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => handleChange('isActive', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Create Page
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
