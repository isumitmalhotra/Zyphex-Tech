'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Plus, Edit, Trash2, GripVertical } from 'lucide-react'
import { ContentType, ContentField } from '@/types/content'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { contentTypeTemplates, ContentTypeTemplate } from '@/lib/content-type-templates'

interface ContentTypeWithCounts extends ContentType {
  _count: {
    contentItems: number
    contentSections: number
  }
}

interface ContentTypeFormData {
  name: string
  label: string
  description: string
  icon: string
  fields: ContentField[]
  settings: {
    hasSlug?: boolean
    hasStatus?: boolean
    hasPublishing?: boolean
    hasOrdering?: boolean
    hasFeatured?: boolean
    hasCategories?: boolean
    hasTags?: boolean
    hasAuthor?: boolean
    hasMetadata?: boolean
  }
}

export default function ContentTypesPage() {
  const [contentTypes, setContentTypes] = useState<ContentTypeWithCounts[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState<ContentTypeWithCounts | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<ContentTypeTemplate | null>(null)

  useEffect(() => {
    fetchContentTypes()
  }, [])

  const fetchContentTypes = async () => {
    try {
      const response = await fetch('/api/admin/content/content-types')
      if (response.ok) {
        const data = await response.json()
        setContentTypes(data)
      }
    } catch (error) {
      console.error('Failed to fetch content types:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteContentType = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/content/content-types/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setContentTypes(prev => prev.filter(ct => ct.id !== id))
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete content type')
      }
    } catch (error) {
      console.error('Failed to delete content type:', error)
      alert('Failed to delete content type')
    }
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/content/content-types/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      })

      if (response.ok) {
        const updated = await response.json()
        setContentTypes(prev => prev.map(ct => ct.id === id ? { ...ct, isActive: updated.isActive } : ct))
      }
    } catch (error) {
      console.error('Failed to toggle content type status:', error)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg">Loading content types...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Types</h1>
          <p className="text-muted-foreground">
            Manage dynamic content types and their field configurations
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Content Type
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            {showTemplates ? (
              <TemplateSelector
                onSelectTemplate={(template: ContentTypeTemplate) => {
                  setSelectedTemplate(template)
                  setShowTemplates(false)
                }}
                onCancel={() => {
                  setShowTemplates(false)
                  setIsCreateDialogOpen(false)
                }}
                onCreateBlank={() => {
                  setSelectedTemplate(null)
                  setShowTemplates(false)
                }}
              />
            ) : (
              <ContentTypeForm
                selectedTemplate={selectedTemplate || undefined}
                onSubmit={async (data) => {
                  const response = await fetch('/api/admin/content/content-types', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                  })

                  if (response.ok) {
                    const newType = await response.json()
                    setContentTypes(prev => [...prev, { ...newType, _count: { contentItems: 0, contentSections: 0 } }])
                    setIsCreateDialogOpen(false)
                    setShowTemplates(false)
                  } else {
                    const error = await response.json()
                    alert(error.error || 'Failed to create content type')
                  }
                }}
                onCancel={() => {
                  setIsCreateDialogOpen(false)
                  setShowTemplates(false)
                  setSelectedTemplate(null)
                }}
                onShowTemplates={() => setShowTemplates(true)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contentTypes.map((contentType) => (
          <Card key={contentType.id} className={!contentType.isActive ? 'opacity-60' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {contentType.icon && <span className="text-lg">{contentType.icon}</span>}
                  {contentType.label}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {contentType.isSystem && (
                    <Badge variant="secondary">System</Badge>
                  )}
                  <Switch
                    checked={contentType.isActive}
                    onCheckedChange={(checked) => handleToggleActive(contentType.id, checked)}
                  />
                </div>
              </div>
              <CardDescription>
                {contentType.description || 'No description'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fields:</span>
                  <span>{contentType.fields.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Content Items:</span>
                  <span>{contentType._count.contentItems}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sections:</span>
                  <span>{contentType._count.contentSections}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <div className="flex gap-2 w-full">
                <Dialog open={isEditDialogOpen && selectedType?.id === contentType.id} 
                       onOpenChange={(open) => {
                         setIsEditDialogOpen(open)
                         if (!open) setSelectedType(null)
                       }}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => setSelectedType(contentType)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    {selectedType && (
                      <ContentTypeForm
                        initialData={selectedType}
                        onSubmit={async (data) => {
                          const response = await fetch(`/api/admin/content/content-types/${selectedType.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(data)
                          })

                          if (response.ok) {
                            const updated = await response.json()
                            setContentTypes(prev => prev.map(ct => 
                              ct.id === selectedType.id ? { ...updated, _count: ct._count } : ct
                            ))
                            setIsEditDialogOpen(false)
                            setSelectedType(null)
                          } else {
                            const error = await response.json()
                            alert(error.error || 'Failed to update content type')
                          }
                        }}
                        onCancel={() => {
                          setIsEditDialogOpen(false)
                          setSelectedType(null)
                        }}
                      />
                    )}
                  </DialogContent>
                </Dialog>

                {!contentType.isSystem && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Content Type</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete &quot;{contentType.label}&quot;? This action cannot be undone.
                          {(contentType._count.contentItems > 0 || contentType._count.contentSections > 0) && (
                            <p className="mt-2 text-destructive">
                              This content type has existing content items or sections and cannot be deleted.
                            </p>
                          )}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteContentType(contentType.id)}
                          disabled={contentType._count.contentItems > 0 || contentType._count.contentSections > 0}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {contentTypes.length === 0 && (
        <div className="text-center py-12">
          <div className="text-lg font-medium mb-2">No content types found</div>
          <p className="text-muted-foreground mb-4">
            Create your first content type to get started with dynamic content management.
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Content Type
          </Button>
        </div>
      )}
    </div>
  )
}

interface ContentTypeFormProps {
  initialData?: ContentTypeWithCounts
  selectedTemplate?: ContentTypeTemplate
  onSubmit: (data: ContentTypeFormData) => Promise<void>
  onCancel: () => void
  onShowTemplates?: () => void
}

interface TemplateSelectorProps {
  onSelectTemplate: (template: ContentTypeTemplate) => void
  onCancel: () => void
  onCreateBlank: () => void
}

function TemplateSelector({ onSelectTemplate, onCancel, onCreateBlank }: TemplateSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const categories = [
    { value: 'all', label: 'All Templates' },
    { value: 'layout', label: 'Layout' },
    { value: 'content', label: 'Content' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'media', label: 'Media' }
  ]

  const filteredTemplates = selectedCategory === 'all' 
    ? contentTypeTemplates 
    : contentTypeTemplates.filter(t => t.category === selectedCategory)

  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle>Choose a Template</DialogTitle>
        <DialogDescription>
          Start with a pre-built template or create your own from scratch.
        </DialogDescription>
      </DialogHeader>

      <div className="flex items-center gap-4">
        <Label>Category:</Label>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map(category => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto">
        <Card 
          className="cursor-pointer hover:bg-accent transition-colors border-dashed"
          onClick={onCreateBlank}
        >
          <CardContent className="p-6 text-center">
            <div className="text-4xl mb-4">➕</div>
            <div className="font-medium">Blank Content Type</div>
            <div className="text-sm text-muted-foreground mt-2">
              Start from scratch
            </div>
          </CardContent>
        </Card>

        {filteredTemplates.map((template) => (
          <Card 
            key={template.name}
            className="cursor-pointer hover:bg-accent transition-colors"
            onClick={() => onSelectTemplate(template)}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{template.icon}</span>
                <div>
                  <div className="font-medium">{template.label}</div>
                  <Badge variant="secondary" className="text-xs">
                    {template.category}
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {template.description}
              </p>
              <div className="text-xs text-muted-foreground">
                {template.fields.length} fields
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

function ContentTypeForm({ initialData, selectedTemplate, onSubmit, onCancel, onShowTemplates }: ContentTypeFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || selectedTemplate?.name || '',
    label: initialData?.label || selectedTemplate?.label || '',
    description: initialData?.description || selectedTemplate?.description || '',
    icon: initialData?.icon || selectedTemplate?.icon || '',
    fields: initialData?.fields || selectedTemplate?.fields || [],
    settings: initialData?.settings || selectedTemplate?.settings || {
      hasSlug: false,
      hasStatus: true,
      hasPublishing: true,
      hasOrdering: true,
      hasFeatured: false,
      hasCategories: false,
      hasTags: false,
      hasAuthor: false,
      hasMetadata: true
    }
  })

  const [activeTab, setActiveTab] = useState('basic')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  const addField = () => {
    const newField: ContentField = {
      id: `field_${Date.now()}`,
      name: '',
      label: '',
      type: 'text',
      required: false,
      placeholder: '',
      defaultValue: null,
      validation: {},
      description: '',
      order: formData.fields.length
    }

    setFormData(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }))
  }

  const updateField = (index: number, field: Partial<ContentField>) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.map((f, i) => i === index ? { ...f, ...field } : f)
    }))
  }

  const removeField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index)
    }))
  }

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const items = Array.from(formData.fields)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update order values
    const reorderedFields = items.map((field, index) => ({
      ...field,
      order: index
    }))

    setFormData(prev => ({
      ...prev,
      fields: reorderedFields
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <DialogHeader>
        <DialogTitle className="flex items-center justify-between">
          {initialData ? 'Edit Content Type' : 'Create Content Type'}
          {!initialData && onShowTemplates && (
            <Button variant="outline" size="sm" onClick={onShowTemplates}>
              Browse Templates
            </Button>
          )}
        </DialogTitle>
        <DialogDescription>
          {selectedTemplate ? (
            <>Using template: <strong>{selectedTemplate.label}</strong> - {selectedTemplate.description}</>
          ) : (
            'Configure the content type with its fields and settings.'
          )}
        </DialogDescription>
      </DialogHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="fields">Fields</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name (ID)</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., hero, feature, testimonial"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="label">Display Label</Label>
              <Input
                id="label"
                value={formData.label}
                onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                placeholder="e.g., Hero Section, Feature Block"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of this content type"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="icon">Icon (Emoji)</Label>
            <Input
              id="icon"
              value={formData.icon}
              onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
              placeholder="🎯"
              maxLength={4}
            />
          </div>
        </TabsContent>

        <TabsContent value="fields" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Content Fields</h3>
            <Button type="button" onClick={addField} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Field
            </Button>
          </div>

          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="fields">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                  {formData.fields.map((field, index) => (
                    <Draggable key={field.id} draggableId={field.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="p-4 border rounded-lg space-y-4"
                        >
                          <div className="flex items-center justify-between">
                            <div {...provided.dragHandleProps} className="cursor-move">
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeField(index)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Field Name</Label>
                              <Input
                                value={field.name}
                                onChange={(e) => updateField(index, { name: e.target.value })}
                                placeholder="fieldName"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Display Label</Label>
                              <Input
                                value={field.label}
                                onChange={(e) => updateField(index, { label: e.target.value })}
                                placeholder="Field Label"
                                required
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Field Type</Label>
                              <Select
                                value={field.type}
                                onValueChange={(value) => updateField(index, { type: value as ContentField['type'] })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="text">Text</SelectItem>
                                  <SelectItem value="textarea">Textarea</SelectItem>
                                  <SelectItem value="richtext">Rich Text</SelectItem>
                                  <SelectItem value="image">Image</SelectItem>
                                  <SelectItem value="url">URL</SelectItem>
                                  <SelectItem value="number">Number</SelectItem>
                                  <SelectItem value="boolean">Boolean</SelectItem>
                                  <SelectItem value="select">Select</SelectItem>
                                  <SelectItem value="multiselect">Multi-select</SelectItem>
                                  <SelectItem value="date">Date</SelectItem>
                                  <SelectItem value="json">JSON</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Placeholder</Label>
                              <Input
                                value={field.placeholder || ''}
                                onChange={(e) => updateField(index, { placeholder: e.target.value })}
                                placeholder="Enter placeholder text"
                              />
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={field.required}
                              onCheckedChange={(checked) => updateField(index, { required: checked })}
                            />
                            <Label>Required field</Label>
                          </div>

                          <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                              value={field.description || ''}
                              onChange={(e) => updateField(index, { description: e.target.value })}
                              placeholder="Help text for this field"
                            />
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {formData.fields.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No fields added yet. Click &quot;Add Field&quot; to create your first field.
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <h3 className="text-lg font-medium">Content Type Settings</h3>

          <div className="grid grid-cols-2 gap-4">
            {Object.entries(formData.settings).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-3 border rounded">
                <Label htmlFor={key} className="capitalize">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^has /, '')}
                </Label>
                <Switch
                  id={key}
                  checked={value}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({
                      ...prev,
                      settings: { ...prev.settings, [key]: checked }
                    }))
                  }
                />
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {initialData ? 'Update' : 'Create'} Content Type
        </Button>
      </div>
    </form>
  )
}