"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion"

import { toast } from "@/hooks/use-toast"
import { DynamicForm } from "@/components/admin/dynamic-form"
import { ContentField } from "@/types/content"
import { ImageUpload } from "@/components/ui/image-upload"
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Loader2,
  AlertCircle,
  FileText,
  Edit
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

// Create dynamic validation schema based on content type fields
const createSectionFormSchema = (fields: ContentField[]) => {
  const schemaObject: Record<string, z.ZodTypeAny> = {}
  
  fields.forEach(field => {
    let fieldSchema: z.ZodTypeAny
    
    switch (field.type) {
      case 'text':
      case 'textarea':
      case 'email':
      case 'url':
      case 'tel':
      case 'slug':
        fieldSchema = z.string()
        if (field.validation?.maxLength) {
          fieldSchema = (fieldSchema as z.ZodString).max(field.validation.maxLength)
        }
        if (field.validation?.minLength) {
          fieldSchema = (fieldSchema as z.ZodString).min(field.validation.minLength)
        }
        if (field.validation?.pattern) {
          fieldSchema = (fieldSchema as z.ZodString).regex(new RegExp(field.validation.pattern))
        }
        break
        
      case 'richtext':
        fieldSchema = z.string()
        break
        
      case 'number':
      case 'integer':
      case 'float':
        fieldSchema = z.number()
        if (field.validation?.min !== undefined) {
          fieldSchema = (fieldSchema as z.ZodNumber).min(field.validation.min)
        }
        if (field.validation?.max !== undefined) {
          fieldSchema = (fieldSchema as z.ZodNumber).max(field.validation.max)
        }
        break
        
      case 'boolean':
        fieldSchema = z.boolean()
        break
        
      case 'date':
      case 'datetime':
      case 'time':
        fieldSchema = z.string().or(z.date())
        break
        
      case 'image':
      case 'file':
        fieldSchema = z.string().url().or(z.literal(''))
        break
        
      case 'images':
      case 'files':
        fieldSchema = z.array(z.string().url())
        break
        
      case 'select':
        fieldSchema = z.string()
        break
        
      case 'multiselect':
      case 'tags':
        fieldSchema = z.array(z.string())
        break
        
      case 'color':
        fieldSchema = z.string().regex(/^#[0-9A-F]{6}$/i)
        break
        
      case 'json':
        fieldSchema = z.any()
        break
        
      default:
        fieldSchema = z.string()
    }
    
    // Make field optional if not required
    if (!field.validation?.required) {
      fieldSchema = fieldSchema.optional()
    }
    
    schemaObject[field.name] = fieldSchema
  })
  
  return z.object(schemaObject)
}

// Default schema for backward compatibility
const defaultSectionSchema = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(), 
  description: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
})

type SectionFormData = Record<string, unknown>

// Page slug to title mapping
const pageMap: Record<string, { title: string; path: string }> = {
  home: { title: "Home", path: "/" },
  about: { title: "About", path: "/about" },
  services: { title: "Services", path: "/services" },
  portfolio: { title: "Portfolio", path: "/portfolio" },
  contact: { title: "Contact", path: "/contact" },
  blog: { title: "Blog", path: "/blog" }
}

interface DynamicContentSection {
  id: string
  sectionKey: string
  title?: string
  subtitle?: string
  description?: string
  imageUrl?: string
  layoutSettings: string
  contentData?: string
  isActive: boolean
  order: number
  createdAt: string
  updatedAt: string
  contentType: {
    id: string
    name: string
    label: string
    fields: string // JSON string of ContentField[]
    settings?: string // JSON string of settings
  }
}



export default function PageContentEditor() {
  const params = useParams()
  const router = useRouter()
  const pageSlug = params.page as string
  
  const [sections, setSections] = useState<DynamicContentSection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({})
  const [editingStates, setEditingStates] = useState<Record<string, boolean>>({})

  const pageInfo = pageMap[pageSlug]

  const loadPageSections = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Define possible section keys for this page
      const possibleSectionKeys = [
        `${pageSlug}-hero`,
        `${pageSlug}-features`, 
        `${pageSlug}-services`,
        `${pageSlug}-about`,
        `${pageSlug}-testimonials`,
        `${pageSlug}-cta`,
        `${pageSlug}-gallery`,
        `${pageSlug}-contact`,
        `${pageSlug}-team`
      ]
      
      // Fetch data for each possible section
      const sectionPromises = possibleSectionKeys.map(async (sectionKey) => {
        try {
          const response = await fetch(`/api/admin/content/dynamic-sections/${sectionKey}`)
          if (response.ok) {
            return await response.json()
          }
          return null
        } catch (error) {
          console.warn(`Failed to fetch section ${sectionKey}:`, error)
          return null
        }
      })
      
      const sectionResults = await Promise.all(sectionPromises)
      const existingSections = sectionResults.filter(Boolean) as DynamicContentSection[]
      
      setSections(existingSections.sort((a, b) => a.order - b.order))
    } catch (err) {
      console.error('Error loading sections:', err)
      setError('Failed to load page sections. Please try again.')
      toast({
        title: "Error",
        description: "Failed to load page sections",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [pageSlug])

  useEffect(() => {
    if (!pageInfo) {
      router.push('/admin/content/manage')
      return
    }
    loadPageSections()
  }, [pageSlug, pageInfo, router, loadPageSections])

  const handleSectionUpdate = async (sectionKey: string, data: SectionFormData) => {
    try {
      setSavingStates(prev => ({ ...prev, [sectionKey]: true }))

      // Call the API endpoint we created in Step 1.1
      const response = await fetch(`/api/admin/content/dynamic-sections/${sectionKey}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update section')
      }

      // Update local state
      setSections(prev => prev.map(section => 
        section.sectionKey === sectionKey 
          ? { ...section, ...data, updatedAt: new Date().toISOString() }
          : section
      ))

      toast({
        title: "Success",
        description: "Section updated successfully",
      })
    } catch (err) {
      console.error('Error updating section:', err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update section",
        variant: "destructive"
      })
    } finally {
      setSavingStates(prev => ({ ...prev, [sectionKey]: false }))
    }
  }

  const toggleSectionActive = async (sectionKey: string, isActive: boolean) => {
    try {
      // For now, just update local state
      // In real implementation, this would call the API
      setSections(prev => prev.map(section => 
        section.sectionKey === sectionKey 
          ? { ...section, isActive, updatedAt: new Date().toISOString() }
          : section
      ))

      toast({
        title: "Success",
        description: `Section ${isActive ? 'activated' : 'deactivated'} successfully`,
      })
    } catch (err) {
      console.error('Error toggling section:', err)
      toast({
        title: "Error",
        description: "Failed to update section status",
        variant: "destructive"
      })
    }
  }

  const handleEditToggle = (sectionKey: string, isEditing: boolean) => {
    setEditingStates(prev => ({ ...prev, [sectionKey]: isEditing }))
  }

  const handleSectionSave = async (sectionKey: string, data: SectionFormData) => {
    await handleSectionUpdate(sectionKey, data)
    // Exit edit mode after successful save
    setEditingStates(prev => ({ ...prev, [sectionKey]: false }))
  }

  const handleCancelEdit = (sectionKey: string) => {
    setEditingStates(prev => ({ ...prev, [sectionKey]: false }))
  }

  if (!pageInfo) {
    return null
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading page sections...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={loadPageSections}>Try Again</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/content/manage">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Content Management
            </Link>
          </Button>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{pageInfo.title} Page Content</h1>
            <p className="text-muted-foreground">
              Manage content sections for {pageInfo.path}
            </p>
          </div>
          
          <div className="flex space-x-2">
            <Button asChild variant="outline">
              <Link href={pageInfo.path} target="_blank" rel="noopener noreferrer">
                <Eye className="h-4 w-4 mr-2" />
                Preview Page
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Content Sections</CardTitle>
              <CardDescription>
                Edit the content sections for this page. Changes are saved individually.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sections.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No content sections found for this page.</p>
                </div>
              ) : (
                <Accordion type="multiple" className="w-full">
                  {sections.map((section) => (
                    <AccordionItem key={section.id} value={section.sectionKey}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center justify-between w-full mr-4">
                          <div className="flex items-center space-x-3">
                            <span className="font-medium">
                              {section.title || section.sectionKey}
                            </span>
                            <Badge variant={section.isActive ? "default" : "secondary"}>
                              {section.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={section.isActive}
                              onCheckedChange={(checked) => 
                                toggleSectionActive(section.sectionKey, checked)
                              }
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="pt-4">
                          <SectionForm
                            section={section}
                            onSave={(data) => handleSectionSave(section.sectionKey, data)}
                            isSaving={savingStates[section.sectionKey] || false}
                            isEditing={editingStates[section.sectionKey] || false}
                            onEditToggle={(editing) => handleEditToggle(section.sectionKey, editing)}
                            onCancel={() => handleCancelEdit(section.sectionKey)}
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Page Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Page</Label>
                <p className="text-sm text-muted-foreground">{pageInfo.title}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Path</Label>
                <p className="text-sm text-muted-foreground">{pageInfo.path}</p>
              </div>
              
              <Separator />
              
              <div>
                <Label className="text-sm font-medium">Sections</Label>
                <p className="text-sm text-muted-foreground">
                  {sections.filter(s => s.isActive).length} active, {sections.length} total
                </p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Last Updated</Label>
                <p className="text-sm text-muted-foreground">
                  {new Date(Math.max(...sections.map(s => new Date(s.updatedAt).getTime()))).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Section View/Edit Component
function SectionForm({ 
  section, 
  onSave, 
  isSaving,
  isEditing,
  onEditToggle,
  onCancel
}: { 
  section: DynamicContentSection
  onSave: (data: SectionFormData) => void
  isSaving: boolean
  isEditing: boolean
  onEditToggle: (editing: boolean) => void
  onCancel: () => void
}) {
  // Parse content type fields
  const contentTypeFields: ContentField[] = React.useMemo(() => {
    try {
      return JSON.parse(section.contentType.fields || '[]') as ContentField[]
    } catch (error) {
      console.error('Error parsing content type fields:', error)
      return []
    }
  }, [section.contentType.fields])

  // Create dynamic schema based on fields
  const dynamicSchema = React.useMemo(() => {
    if (contentTypeFields.length > 0) {
      return createSectionFormSchema(contentTypeFields)
    }
    return defaultSectionSchema
  }, [contentTypeFields])

  // Create default values from section data and field definitions
  const defaultValues = React.useMemo(() => {
    const values: Record<string, unknown> = {}
    
    // Parse stored content data
    let storedData: Record<string, unknown> = {}
    if (section.contentData) {
      try {
        storedData = JSON.parse(section.contentData)
      } catch (error) {
        console.error('Error parsing stored content data:', error)
      }
    }
    
    if (contentTypeFields.length > 0) {
      // Use dynamic fields
      contentTypeFields.forEach(field => {
        // Priority: storedData > section basic fields > field default value > type default
        if (storedData[field.name] !== undefined) {
          // Use stored dynamic content data
          values[field.name] = storedData[field.name]
        } else if (field.name === 'title') {
          values[field.name] = section.title || field.defaultValue || ''
        } else if (field.name === 'subtitle') { 
          values[field.name] = section.subtitle || field.defaultValue || ''
        } else if (field.name === 'description') {
          values[field.name] = section.description || field.defaultValue || ''
        } else if (field.name === 'imageUrl') {
          values[field.name] = section.imageUrl || field.defaultValue || ''
        } else {
          // Set default value for custom fields
          values[field.name] = field.defaultValue || (
            field.type === 'boolean' ? false :
            field.type === 'number' || field.type === 'integer' || field.type === 'float' ? 0 :
            field.type === 'multiselect' || field.type === 'tags' || field.type === 'images' || field.type === 'files' ? [] :
            ''
          )
        }
      })
    } else {
      // Fallback to basic fields
      values.title = section.title || ''
      values.subtitle = section.subtitle || ''
      values.description = section.description || ''
      values.imageUrl = section.imageUrl || ''
    }
    
    return values
  }, [section, contentTypeFields])

  const form = useForm<Record<string, unknown>>({
    resolver: zodResolver(dynamicSchema),
    defaultValues
  })

  // Update form when section data changes
  useEffect(() => {
    form.reset(defaultValues)
  }, [defaultValues, form])

  const onSubmit = async (data: Record<string, unknown>) => {
    // Separate basic fields from dynamic content
    const { title, subtitle, description, imageUrl, ...dynamicFields } = data
    
    // Prepare the payload
    const payload: Record<string, unknown> = {}
    
    // Include basic fields if they exist
    if (title !== undefined) payload.title = title
    if (subtitle !== undefined) payload.subtitle = subtitle
    if (description !== undefined) payload.description = description
    if (imageUrl !== undefined) payload.imageUrl = imageUrl
    
    // Store all dynamic fields as JSON
    if (Object.keys(dynamicFields).length > 0) {
      payload.contentData = JSON.stringify(dynamicFields)
    }
    
    onSave(payload)
  }

  if (isEditing) {
    // Edit Mode: Show form
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Edit Content
          </CardTitle>
          <CardDescription>
            Make changes to this section&apos;s content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Dynamic Form Fields */}
            {contentTypeFields.length > 0 ? (
              <DynamicForm 
                fields={contentTypeFields}
                form={form}
                disabled={isSaving}
              />
            ) : (
              // Fallback to basic fields if no content type fields defined
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Section Title</Label>
                    <Input
                      id="title"
                      placeholder="Enter section title"
                      {...form.register('title')}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subtitle">Subtitle</Label>
                    <Input
                      id="subtitle"
                      placeholder="Enter subtitle (optional)"
                      {...form.register('subtitle')}
                      disabled={isSaving}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter section description"
                    rows={4}
                    {...form.register('description')}
                    disabled={isSaving}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Section Image</Label>
                  <ImageUpload
                    value={form.watch('imageUrl') as string}
                    onChange={(url) => form.setValue('imageUrl', url)}
                    onRemove={() => form.setValue('imageUrl', '')}
                    disabled={isSaving}
                  />
                </div>
              </div>
            )}

            <Separator />

            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline"
                onClick={onCancel}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    )
  }

  // View Mode: Show content with Edit button
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Section Content
          </div>
          <Button
            onClick={() => onEditToggle(true)}
            size="sm"
            variant="outline"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Dynamic Content Display */}
        {(() => {
          const hasContent = contentTypeFields.length > 0 ? 
            contentTypeFields.some(field => {
              const value = field.name === 'title' ? section.title :
                          field.name === 'subtitle' ? section.subtitle :
                          field.name === 'description' ? section.description :
                          field.name === 'imageUrl' ? section.imageUrl :
                          null
              return value && value !== ''
            }) :
            section.title || section.subtitle || section.description || section.imageUrl

          if (!hasContent) {
            return (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No content has been set for this section yet.</p>
                <p className="text-sm">Click &quot;Edit&quot; to add content.</p>
              </div>
            )
          }

          return (
            <div className="space-y-4">
              {contentTypeFields.length > 0 ? (
                // Render fields based on content type definition
                contentTypeFields.map(field => {
                  let value: unknown = null
                  
                  // Map field names to section properties
                  if (field.name === 'title') {
                    value = section.title
                  } else if (field.name === 'subtitle') {
                    value = section.subtitle  
                  } else if (field.name === 'description') {
                    value = section.description
                  } else if (field.name === 'imageUrl') {
                    value = section.imageUrl
                  }

                  // Skip fields with no content
                  if (!value || value === '') return null

                  return (
                    <div key={field.id}>
                      <Label className="text-sm font-medium text-muted-foreground">
                        {field.label}
                      </Label>
                      
                      {/* Render different field types */}
                      {field.type === 'image' && typeof value === 'string' && (
                        <div className="mt-2 relative h-48 w-full rounded-lg border overflow-hidden">
                          <Image
                            src={value}
                            alt={field.label}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                        </div>
                      )}
                      
                      {field.type === 'richtext' && typeof value === 'string' && (
                        <div className="mt-2 prose prose-sm max-w-none">
                          <div dangerouslySetInnerHTML={{ __html: value }} />
                        </div>
                      )}
                      
                      {(field.type === 'textarea' || field.type === 'text') && typeof value === 'string' && (
                        <div className={`mt-2 ${field.type === 'text' ? 'text-lg font-semibold' : 'prose prose-sm max-w-none'}`}>
                          <p className="whitespace-pre-wrap">{value}</p>
                        </div>
                      )}
                      
                      {field.type === 'boolean' && typeof value === 'boolean' && (
                        <div className="mt-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {value ? 'Yes' : 'No'}
                          </span>
                        </div>
                      )}
                      
                      {(field.type === 'url' || field.type === 'email') && typeof value === 'string' && (
                        <div className="mt-2">
                          <a 
                            href={field.type === 'email' ? `mailto:${value}` : value}
                            className="text-blue-600 hover:text-blue-800 underline"
                            target={field.type === 'url' ? '_blank' : undefined}
                            rel={field.type === 'url' ? 'noopener noreferrer' : undefined}
                          >
                            {value}
                          </a>
                        </div>
                      )}
                      
                      {/* Default text display for other field types */}
                      {!['image', 'richtext', 'textarea', 'text', 'boolean', 'url', 'email'].includes(field.type) && (
                        <div className="mt-2">
                          <p>{String(value)}</p>
                        </div>
                      )}
                    </div>
                  )
                }).filter(Boolean)
              ) : (
                // Fallback to basic fields
                <>
                  {section.title && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Title</Label>
                      <p className="text-lg font-semibold">{section.title}</p>
                    </div>
                  )}
                  
                  {section.subtitle && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Subtitle</Label>
                      <p className="text-base text-muted-foreground">{section.subtitle}</p>
                    </div>
                  )}
                  
                  {section.description && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                      <div className="prose prose-sm max-w-none">
                        <p className="whitespace-pre-wrap">{section.description}</p>
                      </div>
                    </div>
                  )}
                  
                  {section.imageUrl && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Image</Label>
                      <div className="mt-2 relative h-48 w-full rounded-lg border overflow-hidden">
                        <Image
                          src={section.imageUrl}
                          alt={section.title || "Section image"}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })()}
        
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Last updated: {new Date(section.updatedAt).toLocaleString()}
          </div>
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${section.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span className="text-sm text-muted-foreground">
              {section.isActive ? 'Published' : 'Draft'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}