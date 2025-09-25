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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { toast } from "@/hooks/use-toast"
import { ImageUpload } from "@/components/ui/image-upload"
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Loader2,
  AlertCircle
} from "lucide-react"
import Link from "next/link"

// Validation schema for section form
const sectionFormSchema = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(), 
  description: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
})

type SectionFormData = z.infer<typeof sectionFormSchema>

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
  isActive: boolean
  order: number
  createdAt: string
  updatedAt: string
  contentType: {
    id: string
    name: string
    label: string
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

  const pageInfo = pageMap[pageSlug]

  const loadPageSections = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch sections by page slug - we'll construct sectionKeys based on the page
      // For now, we'll create mock data matching the expected structure
      const mockSections: DynamicContentSection[] = [
        {
          id: "1",
          sectionKey: `${pageSlug}-hero`,
          title: "Hero Section",
          subtitle: "Main hero section content",
          description: "This is the primary hero section that appears at the top of the page.",
          imageUrl: "/placeholder.jpg",
          layoutSettings: JSON.stringify({ layout: "hero", columns: 1 }),
          isActive: true,
          order: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          contentType: {
            id: "hero-type",
            name: "hero",
            label: "Hero Section"
          }
        },
        {
          id: "2", 
          sectionKey: `${pageSlug}-features`,
          title: "Features Section",
          subtitle: "Key features and benefits",
          description: "Showcase the main features and benefits of your services.",
          imageUrl: undefined,
          layoutSettings: JSON.stringify({ layout: "grid", columns: 3 }),
          isActive: true,
          order: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          contentType: {
            id: "features-type",
            name: "features",
            label: "Features Section"
          }
        },
        {
          id: "3",
          sectionKey: `${pageSlug}-cta`,
          title: "Call to Action",
          subtitle: "Encourage user engagement",
          description: "A compelling call-to-action to convert visitors into customers.",
          imageUrl: "/placeholder-logo.png",
          layoutSettings: JSON.stringify({ layout: "centered", columns: 1 }),
          isActive: false,
          order: 2,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          contentType: {
            id: "cta-type", 
            name: "cta",
            label: "Call to Action"
          }
        }
      ]

      setSections(mockSections.sort((a, b) => a.order - b.order))
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
                            onSave={(data) => handleSectionUpdate(section.sectionKey, data)}
                            isSaving={savingStates[section.sectionKey] || false}
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

// Section Form Component
function SectionForm({ 
  section, 
  onSave, 
  isSaving 
}: { 
  section: DynamicContentSection
  onSave: (data: SectionFormData) => void
  isSaving: boolean
}) {
  const form = useForm<SectionFormData>({
    resolver: zodResolver(sectionFormSchema),
    defaultValues: {
      title: section.title || "",
      subtitle: section.subtitle || "",
      description: section.description || "",
      imageUrl: section.imageUrl || ""
    }
  })

  const onSubmit = async (data: SectionFormData) => {
    onSave(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Section Title</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter section title"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  The main title for this section
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
                <FormLabel>Subtitle</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter subtitle (optional)"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  A secondary title or tagline
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter section description"
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Detailed description or content for this section
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <ImageUpload
                  value={field.value}
                  onChange={field.onChange}
                  onRemove={() => field.onChange('')}
                  disabled={isSaving}
                />
              </FormControl>
              <FormDescription>
                Upload an image for this section or enter an image URL
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button 
            type="button" 
            variant="outline"
            onClick={() => form.reset()}
            disabled={isSaving}
          >
            Reset
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
    </Form>
  )
}