'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Save, ArrowLeft, Info, Eye, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface ContentType {
  id: string
  name: string
  slug: string
  label?: string
  icon?: string | null
  description: string | null
  entryCount: number
}

export default function NewContentPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [contentTypes, setContentTypes] = useState<ContentType[]>([])

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

  // Fetch content types on mount
  useEffect(() => {
    fetchContentTypes()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchContentTypes = async () => {
    try {
      setLoading(true)
      console.log('Fetching content types...')
      const res = await fetch('/api/super-admin/content/content-types')
      console.log('Response status:', res.status)
      
      if (!res.ok) {
        const errorText = await res.text()
        console.error('Error response:', errorText)
        throw new Error('Failed to fetch content types')
      }
      
      const data = await res.json()
      console.log('Content types data:', data)
      setContentTypes(data.contentTypes || [])
      
      if (!data.contentTypes || data.contentTypes.length === 0) {
        console.warn('No content types found in response')
      }
    } catch (error) {
      console.error('Error fetching content types:', error)
      toast({
        title: 'Error',
        description: 'Failed to load content types',
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

  const handleTitleChange = (title: string) => {
    handleChange('title', title)
    
    // Auto-generate slug if it's empty
    if (!formData.slug) {
      const slug = generateSlug(title)
      handleChange('slug', slug)
    }
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

      if (!formData.contentTypeId) {
        toast({
          title: 'Validation Error',
          description: 'Please select a content type',
          variant: 'destructive',
        })
        return
      }

      // Parse tags
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)

      // Prepare data
      const contentData = {
        title: formData.title,
        slug: formData.slug,
        contentTypeId: formData.contentTypeId,
        status: formData.status,
        featured: formData.featured,
        data: {
          content: formData.content,
          excerpt: formData.excerpt,
          metaTitle: formData.metaTitle || formData.title,
          metaDescription: formData.metaDescription,
        },
        tags: tagsArray,
      }

      const res = await fetch('/api/super-admin/content/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contentData),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Failed to create content')
      }

      await res.json() // Consume the response

      toast({
        title: 'Success',
        description: formData.status === 'published'
          ? 'Content created and published successfully!'
          : 'Content created as draft. You can publish it later.',
      })

      // Navigate to content management
      router.push('/super-admin/content')
    } catch (err) {
      console.error('Error creating content:', err)
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to create content',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
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
          <h1 className="text-3xl font-bold">Create New Content</h1>
          <p className="text-muted-foreground">
            Add a new dynamic content entry to your website
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Info Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>What is Dynamic Content?</AlertTitle>
          <AlertDescription>
            <div className="space-y-2 mt-2">
              <p>
                Dynamic content entries are reusable pieces of content that can be displayed across your website.
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong>Services:</strong> Display on services page and homepage</li>
                <li><strong>Portfolio Projects:</strong> Show in portfolio gallery</li>
                <li><strong>Blog Posts:</strong> List on blog page</li>
                <li><strong>Testimonials:</strong> Show on various pages</li>
              </ul>
              <p className="text-sm mt-2">
                Choose a content type, fill in the details, and publish when ready!
              </p>
            </div>
          </AlertDescription>
        </Alert>

        {/* Content Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Content Type</CardTitle>
            <CardDescription>
              Select the type of content you want to create
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contentType">Content Type *</Label>
              {loading ? (
                <div className="text-sm text-muted-foreground">Loading content types...</div>
              ) : (
                <>
                  <Select
                    value={formData.contentTypeId}
                    onValueChange={(value) => handleChange('contentTypeId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select content type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {contentTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          <div className="flex items-center gap-2">
                            {type.icon && <span>{type.icon}</span>}
                            <span>{type.label || type.name}</span>
                            <Badge variant="secondary" className="ml-auto">
                              {type.entryCount} entries
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {contentTypes.length === 0 && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>No Content Types Found</AlertTitle>
                      <AlertDescription>
                        No active content types available. Please create one first in the Content Types tab,
                        or check the browser console for errors.
                      </AlertDescription>
                    </Alert>
                  )}
                  {contentTypes.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {contentTypes.length} content type{contentTypes.length !== 1 ? 's' : ''} available
                    </p>
                  )}
                </>
              )}
            </div>
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
                onChange={(e) => handleTitleChange(e.target.value)}
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
                URL-friendly version of the title (used in URLs)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt / Short Description</Label>
              <Textarea
                id="excerpt"
                value={formData.excerpt}
                onChange={(e) => handleChange('excerpt', e.target.value)}
                placeholder="Brief summary or excerpt (shown in listings)"
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
              <p className="text-xs text-muted-foreground">
                You can use HTML or Markdown formatting here
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => handleChange('tags', e.target.value)}
                placeholder="tag1, tag2, tag3"
              />
              <p className="text-xs text-muted-foreground">
                Separate tags with commas
              </p>
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
                placeholder="SEO title (defaults to content title)"
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
                placeholder="SEO description (shown in search results)"
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
                    ? 'Content will be visible on the website'
                    : 'Content will be saved as draft'}
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
          <Button onClick={handleSave} disabled={saving || contentTypes.length === 0}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Create Content
              </>
            )}
          </Button>

          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>

          {formData.status === 'published' && formData.slug && (
            <Button
              variant="outline"
              onClick={() => window.open(`/content/${formData.slug}`, '_blank')}
            >
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
