'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Save, ArrowLeft, Eye, Trash2, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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

interface ContentItem {
  id: string
  title: string
  slug: string
  contentTypeId: string
  status: 'draft' | 'published'
  featured: boolean
  data: string
  tags: string
  author: string | null
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  contentType: {
    id: string
    name: string
    label: string
  }
}

export default function EditContentPage() {
  const router = useRouter()
  const params = useParams()
  const contentId = params.id as string
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [content, setContent] = useState<ContentItem | null>(null)
  // const [contentTypes, setContentTypes] = useState<ContentType[]>([])

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    contentTypeId: '',
    status: 'draft' as 'draft' | 'published',
    featured: false,
    content: '',
    excerpt: '',
    metaTitle: '',
    metaDescription: '',
    tags: '',
  })

  // Fetch content item and content types
  useEffect(() => {
    if (contentId) {
      fetchContent()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentId])

  const fetchContent = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/super-admin/content/manage/${contentId}`)
      
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('Content not found')
        }
        throw new Error('Failed to load content')
      }
      
      const data = await res.json()
      setContent(data)
      
      // Parse data field
      let parsedData: Record<string, unknown> = {}
      try {
        parsedData = data.data ? JSON.parse(data.data) : {}
      } catch {
        parsedData = {}
      }

      // Parse tags
      let parsedTags: string[] = []
      try {
        parsedTags = data.tags ? JSON.parse(data.tags) : []
      } catch {
        parsedTags = []
      }

      // Set form data
      setFormData({
        title: data.title,
        slug: data.slug,
        contentTypeId: data.contentTypeId,
        status: data.status,
        featured: data.featured,
        content: parsedData.content as string || '',
        excerpt: parsedData.excerpt as string || '',
        metaTitle: parsedData.metaTitle as string || '',
        metaDescription: parsedData.metaDescription as string || '',
        tags: parsedTags.join(', '),
      })
    } catch (err) {
      console.error('Error fetching content:', err)
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to load content',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string | boolean) => {
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

  const handleSave = async () => {
    try {
      setSaving(true)

      // Validation
      if (!formData.title.trim()) {
        toast({
          title: 'Validation Error',
          description: 'Title is required',
          variant: 'destructive',
        })
        return
      }

      if (!formData.slug.trim()) {
        toast({
          title: 'Validation Error',
          description: 'Slug is required',
          variant: 'destructive',
        })
        return
      }

      // Parse tags
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)

      // Prepare data - stringify objects for database
      const contentData = {
        title: formData.title,
        slug: formData.slug,
        contentTypeId: formData.contentTypeId,
        status: formData.status,
        featured: formData.featured,
        data: JSON.stringify({
          content: formData.content,
          excerpt: formData.excerpt,
          metaTitle: formData.metaTitle || formData.title,
          metaDescription: formData.metaDescription,
        }),
        tags: JSON.stringify(tagsArray),
      }

      console.log('Updating content with data:', contentData)

      const res = await fetch(`/api/super-admin/content/manage/${contentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contentData),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Failed to update content')
      }

      toast({
        title: 'Success',
        description: 'Content updated successfully',
      })

      // Refresh data
      fetchContent()
    } catch (err) {
      console.error('Error updating content:', err)
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update content',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      setDeleting(true)

      const res = await fetch(`/api/super-admin/content/manage/${contentId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Failed to delete content')
      }

      toast({
        title: 'Success',
        description: 'Content deleted successfully',
      })

      // Navigate back to content management
      router.push('/super-admin/content')
    } catch (err) {
      console.error('Error deleting content:', err)
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete content',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
          </div>
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (!content) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Content not found or failed to load.
          </AlertDescription>
        </Alert>
        <Button
          onClick={() => router.push('/super-admin/content')}
          className="mt-4"
        >
          Back to Content Management
        </Button>
      </div>
    )
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
          <h1 className="text-3xl font-bold">Edit Content</h1>
          <p className="text-muted-foreground">
            Update your content entry
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Status Alert */}
        {formData.status === 'draft' && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Draft Mode</AlertTitle>
            <AlertDescription>
              This content is currently in draft mode and not visible on the website.
              Toggle &quot;Published&quot; to make it live.
            </AlertDescription>
          </Alert>
        )}

        {/* Content Type */}
        <Card>
          <CardHeader>
            <CardTitle>Content Type</CardTitle>
            <CardDescription>
              Type: {content.contentType.label}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Badge>{content.contentType.name}</Badge>
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Essential details about your content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Enter content title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <div className="flex gap-2">
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => handleChange('slug', e.target.value)}
                  placeholder="content-slug"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const slug = generateSlug(formData.title)
                    handleChange('slug', slug)
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
              <Label htmlFor="excerpt">Excerpt / Short Description</Label>
              <Textarea
                id="excerpt"
                value={formData.excerpt}
                onChange={(e) => handleChange('excerpt', e.target.value)}
                placeholder="Brief summary or excerpt"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => handleChange('content', e.target.value)}
                placeholder="Main content (supports HTML/Markdown)"
                rows={10}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => handleChange('tags', e.target.value)}
                placeholder="tag1, tag2, tag3"
              />
            </div>
          </CardContent>
        </Card>

        {/* SEO Settings */}
        <Card>
          <CardHeader>
            <CardTitle>SEO Settings</CardTitle>
            <CardDescription>
              Optimize for search engines
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="metaTitle">Meta Title</Label>
              <Input
                id="metaTitle"
                value={formData.metaTitle}
                onChange={(e) => handleChange('metaTitle', e.target.value)}
                placeholder="SEO title"
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
                placeholder="SEO description"
                rows={3}
                maxLength={160}
              />
              <p className="text-xs text-muted-foreground">
                {formData.metaDescription.length}/160 characters
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Publishing Options */}
        <Card>
          <CardHeader>
            <CardTitle>Publishing Options</CardTitle>
            <CardDescription>
              Control visibility and featured status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Publish Status</Label>
                <p className="text-sm text-muted-foreground">
                  {formData.status === 'published'
                    ? 'Content is visible on the website'
                    : 'Content is saved as draft'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Draft</span>
                <Switch
                  checked={formData.status === 'published'}
                  onCheckedChange={(checked) =>
                    handleChange('status', checked ? 'published' : 'draft')
                  }
                />
                <span className="text-sm font-medium">Published</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Featured Content</Label>
                <p className="text-sm text-muted-foreground">
                  Featured items may be highlighted on the website
                </p>
              </div>
              <Switch
                checked={formData.featured}
                onCheckedChange={(checked) => handleChange('featured', checked)}
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
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>

          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>

          {formData.status === 'published' && (
            <Button
              variant="outline"
              onClick={() => window.open(`/content/${formData.slug}`, '_blank')}
            >
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
          )}

          <div className="flex-1" />

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={deleting}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Content
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the content
                  &quot;{content.title}&quot; and remove it from the database.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created:</span>
              <span>{new Date(content.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Updated:</span>
              <span>{new Date(content.updatedAt).toLocaleString()}</span>
            </div>
            {content.author && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Author:</span>
                <span>{content.author}</span>
              </div>
            )}
            {content.publishedAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Published:</span>
                <span>{new Date(content.publishedAt).toLocaleString()}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
