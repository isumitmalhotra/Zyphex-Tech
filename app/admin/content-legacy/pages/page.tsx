"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'
import { 
  Plus, 
  Trash2, 
  ExternalLink,
  Settings,
  Lock
} from 'lucide-react'

interface Page {
  id: string
  slug: string
  title: string
  description?: string
  path: string
  isActive: boolean
  isSystem: boolean
  order: number
  metaTitle?: string
  metaDescription?: string
  createdAt: string
  updatedAt: string
}

export default function PagesManagement() {
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newPage, setNewPage] = useState({
    slug: '',
    title: '',
    description: '',
    path: '',
    metaTitle: '',
    metaDescription: '',
    order: 0
  })

  // Load pages
  const loadPages = async () => {
    try {
      const response = await fetch('/api/admin/pages')
      if (response.ok) {
        const pagesData = await response.json()
        setPages(pagesData)
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

  // Toggle page status
  const togglePageStatus = async (pageId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/pages/${pageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      })

      if (response.ok) {
        setPages(prev => prev.map(page => 
          page.id === pageId ? { ...page, isActive } : page
        ))
        toast({
          title: "Success",
          description: `Page ${isActive ? 'activated' : 'deactivated'} successfully`,
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update page')
      }
    } catch (error) {
      console.error('Error updating page:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update page",
        variant: "destructive"
      })
    }
  }

  // Create new page
  const createPage = async () => {
    try {
      const response = await fetch('/api/admin/pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newPage,
          isActive: true
        }),
      })

      if (response.ok) {
        const createdPage = await response.json()
        setPages(prev => [...prev, createdPage])
        setIsCreateDialogOpen(false)
        setNewPage({
          slug: '',
          title: '',
          description: '',
          path: '',
          metaTitle: '',
          metaDescription: '',
          order: 0
        })
        toast({
          title: "Success",
          description: "Page created successfully",
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create page')
      }
    } catch (error) {
      console.error('Error creating page:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create page",
        variant: "destructive"
      })
    }
  }

  // Delete page
  const deletePage = async (pageId: string, pageTitle: string) => {
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
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
          <h1 className="text-3xl font-bold">Pages Management</h1>
          <p className="text-muted-foreground">
            Manage website pages and their content sections
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Page
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Page</DialogTitle>
              <DialogDescription>
                Add a new page to your website. The slug will be used in the URL.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Page Title</Label>
                  <Input
                    id="title"
                    value={newPage.title}
                    onChange={(e) => setNewPage(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., About Us"
                  />
                </div>
                <div>
                  <Label htmlFor="slug">URL Slug</Label>
                  <Input
                    id="slug"
                    value={newPage.slug}
                    onChange={(e) => setNewPage(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))}
                    placeholder="e.g., about-us"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="path">Full Path</Label>
                <Input
                  id="path"
                  value={newPage.path}
                  onChange={(e) => setNewPage(prev => ({ ...prev, path: e.target.value }))}
                  placeholder="e.g., /about-us"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newPage.description}
                  onChange={(e) => setNewPage(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description for admin purposes"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="metaTitle">Meta Title (SEO)</Label>
                  <Input
                    id="metaTitle"
                    value={newPage.metaTitle}
                    onChange={(e) => setNewPage(prev => ({ ...prev, metaTitle: e.target.value }))}
                    placeholder="SEO title"
                  />
                </div>
                <div>
                  <Label htmlFor="order">Display Order</Label>
                  <Input
                    id="order"
                    type="number"
                    value={newPage.order}
                    onChange={(e) => setNewPage(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="metaDescription">Meta Description (SEO)</Label>
                <Input
                  id="metaDescription"
                  value={newPage.metaDescription}
                  onChange={(e) => setNewPage(prev => ({ ...prev, metaDescription: e.target.value }))}
                  placeholder="SEO description"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createPage}>
                Create Page
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Pages</CardTitle>
          <CardDescription>
            {pages.length} pages total • {pages.filter(p => p.isActive).length} active
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Page</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pages.map((page) => (
                <TableRow key={page.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {page.title}
                          {page.isSystem && (
                            <Lock className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                        {page.description && (
                          <div className="text-sm text-muted-foreground">
                            {page.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {page.path}
                    </code>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={page.isActive}
                        onCheckedChange={(checked) => togglePageStatus(page.id, checked)}
                        disabled={page.isSystem && !page.isActive} // Prevent disabling system pages
                      />
                      <Badge variant={page.isActive ? "default" : "secondary"}>
                        {page.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>{page.order}</TableCell>
                  <TableCell>
                    {new Date(page.updatedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <Button asChild variant="outline" size="sm">
                        <Link href={page.path} target="_blank">
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/content/manage/${page.slug}`}>
                          <Settings className="h-4 w-4" />
                        </Link>
                      </Button>
                      {!page.isSystem && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deletePage(page.id, page.title)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}