'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Save, Trash2, ExternalLink, Copy } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface Page {
  id: string
  title: string
  slug: string
  path: string
  description?: string
  metaTitle?: string
  metaDescription?: string
  isActive: boolean
  isSystem: boolean
  order: number
  createdAt: string
  updatedAt: string
}

interface PageEditorProps {
  page: Page
  onSaveSuccess?: () => void
}

export function PageEditor({ page, onSaveSuccess }: PageEditorProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [duplicating, setDuplicating] = useState(false)

  const [formData, setFormData] = useState({
    title: page.title,
    slug: page.slug,
    path: page.path,
    description: page.description || '',
    metaTitle: page.metaTitle || '',
    metaDescription: page.metaDescription || '',
    isActive: page.isActive,
    order: page.order,
  })

  const handleChange = (field: string, value: string | boolean | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
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

      const res = await fetch(`/api/super-admin/content/pages/${page.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Failed to save page')
      }

      toast({
        title: 'Success',
        description: 'Page updated successfully',
      })

      onSaveSuccess?.()
    } catch (err) {
      console.error('Error saving page:', err)
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to save page',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      setDeleting(true)

      const res = await fetch(`/api/super-admin/content/pages/${page.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Failed to delete page')
      }

      toast({
        title: 'Success',
        description: 'Page deleted successfully',
      })

      router.push('/super-admin/content/pages')
    } catch (err) {
      console.error('Error deleting page:', err)
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete page',
        variant: 'destructive',
      })
      setDeleting(false)
    }
  }

  const handleDuplicate = async () => {
    try {
      setDuplicating(true)

      const res = await fetch(`/api/super-admin/content/pages/${page.id}/duplicate`, {
        method: 'POST',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Failed to duplicate page')
      }

      const newPage = await res.json()

      toast({
        title: 'Success',
        description: 'Page duplicated successfully',
      })

      // Navigate to the new page
      router.push(`/super-admin/content/pages/${newPage.id}`)
    } catch (err) {
      console.error('Error duplicating page:', err)
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to duplicate page',
        variant: 'destructive',
      })
      setDuplicating(false)
    }
  }

  const handlePreview = () => {
    // Use the path field instead of slug for proper routing
    const previewPath = formData.path || `/${formData.slug}`
    window.open(previewPath, '_blank')
  }

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  return (
    <div className="space-y-6">
      {/* Page Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Page Information</CardTitle>
          <CardDescription>
            Basic information about this page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Enter page title"
              disabled={page.isSystem}
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
                disabled={page.isSystem}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => handleChange('slug', generateSlug(formData.title))}
                disabled={page.isSystem}
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
              disabled={page.isSystem}
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
              <Label>Page Status</Label>
              <p className="text-sm text-muted-foreground">
                {formData.isActive ? 'Page is live and visible to visitors' : 'Page is hidden from visitors'}
              </p>
            </div>
            <Switch
              checked={formData.isActive}
              onCheckedChange={(checked) => handleChange('isActive', checked)}
              disabled={page.isSystem}
            />
          </div>

          {page.isSystem && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
              <p className="text-sm text-amber-600 dark:text-amber-500">
                ⚠️ This is a system page. Some fields cannot be modified.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={handleSave} disabled={saving || page.isSystem}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>

        <Button
          variant="outline"
          onClick={handlePreview}
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          Preview
        </Button>

        <Button
          variant="outline"
          onClick={handleDuplicate}
          disabled={duplicating}
        >
          {duplicating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Duplicating...
            </>
          ) : (
            <>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </>
          )}
        </Button>

        {!page.isSystem && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={deleting}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Page
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the page
                  &quot;{page.title}&quot; and remove it from the database.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                  {deleting ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        <Button
          variant="ghost"
          onClick={() => router.push('/super-admin/content/pages')}
        >
          Cancel
        </Button>
      </div>

      {/* Page Info */}
      <Card>
        <CardHeader>
          <CardTitle>Page Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Page ID:</span>
            <span className="font-mono">{page.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Created:</span>
            <span>{new Date(page.createdAt).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Last Modified:</span>
            <span>{new Date(page.updatedAt).toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
