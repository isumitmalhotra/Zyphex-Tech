"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "@/hooks/use-toast"
import { 
  Home, 
  Info, 
  Briefcase, 
  Mail, 
  FileText, 
  Settings,
  Edit3,
  Eye,
  Plus,
  Globe,
  Loader2,
  Trash2
} from "lucide-react"

interface Page {
  id: string
  slug: string
  title: string
  description?: string
  path: string
  isActive: boolean
  isSystem: boolean
  order: number
  createdAt: string
  updatedAt: string
}

// Icon mapping for different page types
const getPageIcon = (slug: string) => {
  switch (slug) {
    case 'home': return Home
    case 'about': return Info
    case 'services': return Briefcase
    case 'portfolio': return FileText
    case 'contact': return Mail
    case 'blog': return FileText
    default: return Globe
  }
}

export default function ContentManagePage() {
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)

  // Load pages from database
  const loadPages = async () => {
    try {
      const response = await fetch('/api/admin/pages')
      if (response.ok) {
        const pagesData = await response.json()
        // Sort by order and then by title
        const sortedPages = pagesData.sort((a: Page, b: Page) => {
          if (a.order !== b.order) return a.order - b.order
          return a.title.localeCompare(b.title)
        })
        setPages(sortedPages)
      } else {
        toast({
          title: "Error",
          description: "Failed to load pages",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error loading pages:', error)
      toast({
        title: "Error",
        description: "Failed to load pages",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPages()
  }, [])

  // Delete page function
  const deletePage = async (pageId: string, pageTitle: string, isSystem: boolean) => {
    if (isSystem) {
      toast({
        title: "Cannot Delete",
        description: "System pages cannot be deleted",
        variant: "destructive"
      })
      return
    }

    if (!confirm(`Are you sure you want to delete "${pageTitle}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/pages/${pageId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setPages(prev => prev.filter(page => page.id !== pageId))
        toast({
          title: "Success",
          description: "Page deleted successfully",
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete page')
      }
    } catch (error) {
      console.error('Error deleting page:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete page",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading pages...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Content Management</h1>
          <p className="text-muted-foreground">
            Manage content for all pages on your website. Click on any page to edit its sections and content.
          </p>
        </div>
        
        <Button asChild>
          <Link href="/admin/content/pages">
            <Settings className="h-4 w-4 mr-2" />
            Manage Pages
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Website Pages</CardTitle>
          <CardDescription>
            {pages.filter(page => page.isActive).length} active pages • {pages.length} total pages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pages.map((page) => {
                const IconComponent = getPageIcon(page.slug)
                
                return (
                  <TableRow key={page.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="p-1.5 bg-primary/10 rounded-md">
                          <IconComponent className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{page.title}</div>
                          <div className="text-sm text-muted-foreground">{page.path}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {page.slug}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={page.isActive ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {page.isActive ? "Active" : "Inactive"}
                        </Badge>
                        {page.isSystem && (
                          <Badge variant="outline" className="text-xs">
                            System
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(page.updatedAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(page.updatedAt).toLocaleTimeString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button 
                          asChild 
                          size="sm"
                        >
                          <Link href={`/admin/content/manage/${page.slug}`}>
                            <Edit3 className="h-4 w-4 mr-2" />
                            Edit Content
                          </Link>
                        </Button>
                        
                        {!page.isSystem && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => deletePage(page.id, page.title, page.isSystem)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        )}
                        
                        <Button 
                          asChild 
                          variant="outline" 
                          size="sm"
                        >
                          <Link href={page.path} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {pages.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No pages found</p>
              <p className="text-sm text-muted-foreground">
                Click &quot;Manage Pages&quot; to add your first page
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions & Stats Section */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Stats Cards */}
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {pages.filter(p => p.isActive).length}
              </div>
              <div className="text-sm text-muted-foreground">Active Pages</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {pages.filter(p => p.isSystem).length}
              </div>
              <div className="text-sm text-muted-foreground">System Pages</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {pages.filter(p => !p.isActive).length}
              </div>
              <div className="text-sm text-muted-foreground">Inactive Pages</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {pages.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Pages</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Plus className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium">Add New Page</h3>
                  <p className="text-sm text-muted-foreground">
                    Create a new page for your website
                  </p>
                </div>
              </div>
              <Button asChild className="w-full mt-4" variant="outline">
                <Link href="/admin/content/pages">
                  <Plus className="h-4 w-4 mr-2" />
                  Manage Pages
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium">Content Types</h3>
                  <p className="text-sm text-muted-foreground">
                    Define and manage content structures
                  </p>
                </div>
              </div>
              <Button asChild className="w-full mt-4" variant="outline">
                <Link href="/admin/content/content-types">
                  <Settings className="h-4 w-4 mr-2" />
                  Content Types
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Globe className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium">Global Settings</h3>
                  <p className="text-sm text-muted-foreground">
                    Configure site-wide content settings
                  </p>
                </div>
              </div>
              <Button asChild className="w-full mt-4" variant="outline">
                <Link href="/admin/content/settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Global Settings
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground py-8">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No recent content changes</p>
              <p className="text-sm">
                Start managing your content to see activity here
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}