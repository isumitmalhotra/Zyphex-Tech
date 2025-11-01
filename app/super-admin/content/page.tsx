"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  FileText, 
  Search, 
  Plus,
  Settings,
  Layout,
  RefreshCw,
  Edit,
  Trash2,
  Eye
} from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/confirm-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical } from "lucide-react"
import Link from "next/link"

interface Page {
  id: string
  title: string
  slug: string
  status: string
  path: string
  lastModified: string
}

interface ContentItem {
  id: string
  title: string
  slug: string
  status: string
  contentType: {
    id: string
    name: string
    label: string
  }
  categories: string
  featured: boolean
  updatedAt: string
}

interface MediaFile {
  id: string
  name: string
  type: string
  size: number
  url: string
  uploadedDate: string
  mimeType: string
}

export default function ContentPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [pages, setPages] = useState<Page[]>([])
  const [contentItems, setContentItems] = useState<ContentItem[]>([])
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [stats, setStats] = useState({ 
    pages: { total: 0, published: 0, draft: 0 },
    content: { total: 0 },
    media: { total: 0, totalSize: 0 }
  })
  
  const [deletePageDialog, setDeletePageDialog] = useState<{
    open: boolean
    id: string
    title: string
  }>({ open: false, id: "", title: "" })
  
  const [deleteContentDialog, setDeleteContentDialog] = useState<{
    open: boolean
    id: string
    title: string
  }>({ open: false, id: "", title: "" })
  
  const [deleteMediaDialog, setDeleteMediaDialog] = useState<{
    open: boolean
    id: string
    name: string
  }>({ open: false, id: "", name: "" })

  // Fetch all content data
  const fetchContentData = async () => {
    try {
      setLoading(true)
      
      const [pagesRes, contentRes, mediaRes] = await Promise.all([
        fetch('/api/super-admin/content/pages'),
        fetch('/api/super-admin/content/manage'),
        fetch('/api/super-admin/content/media')
      ])

      if (pagesRes.ok) {
        const pagesData = await pagesRes.json()
        setPages(pagesData.pages || [])
        setStats(prev => ({ ...prev, pages: pagesData.stats || { total: 0, published: 0, draft: 0 } }))
      }

      if (contentRes.ok) {
        const contentData = await contentRes.json()
        setContentItems(contentData.contentItems || [])
        setStats(prev => ({ ...prev, content: { total: contentData.contentItems?.length || 0 } }))
      }

      if (mediaRes.ok) {
        const mediaData = await mediaRes.json()
        setMediaFiles(mediaData.mediaFiles || [])
        setStats(prev => ({ ...prev, media: mediaData.stats || { total: 0, totalSize: 0 } }))
      }
      
      toast.success('Content data loaded successfully')
    } catch (error) {
      console.error('Error fetching content data:', error)
      toast.error('Failed to load content data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContentData()
  }, [])

  // Filter functions
  const filteredPages = pages.filter(page =>
    page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.slug.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredContentItems = contentItems.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredMediaFiles = mediaFiles.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleDeletePage = async (id: string, title: string) => {
    setDeletePageDialog({ open: true, id, title })
  }
  
  const confirmDeletePage = async () => {
    try {
      const response = await fetch(`/api/super-admin/content/pages/${deletePageDialog.id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete page')
      
      toast.success(`Page "${deletePageDialog.title}" deleted successfully`)
      setDeletePageDialog({ open: false, id: "", title: "" })
      fetchContentData()
    } catch (error) {
      console.error('Error deleting page:', error)
      toast.error('Failed to delete page. Please try again.')
    }
  }

  const handleDeleteContent = async (id: string, title: string) => {
    setDeleteContentDialog({ open: true, id, title })
  }
  
  const confirmDeleteContent = async () => {
    try {
      const response = await fetch(`/api/super-admin/content/manage/${deleteContentDialog.id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete content')
      
      toast.success(`Content "${deleteContentDialog.title}" deleted successfully`)
      setDeleteContentDialog({ open: false, id: "", title: "" })
      fetchContentData()
    } catch (error) {
      console.error('Error deleting content:', error)
      toast.error('Failed to delete content. Please try again.')
    }
  }

  const handleDeleteMedia = async (id: string, name: string) => {
    setDeleteMediaDialog({ open: true, id, name })
  }
  
  const confirmDeleteMedia = async () => {
    try {
      const response = await fetch(`/api/super-admin/content/media/${deleteMediaDialog.id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete media')
      
      toast.success(`Media "${deleteMediaDialog.name}" deleted successfully`)
      setDeleteMediaDialog({ open: false, id: "", name: "" })
      fetchContentData()
    } catch (error) {
      console.error('Error deleting media:', error)
      toast.error('Failed to delete media. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="space-y-4 animate-pulse">
          <div className="h-8 w-64 bg-muted rounded"></div>
          <div className="grid gap-4 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Content Management</h2>
          <p className="text-muted-foreground">
            Manage your website content, pages, and media ({stats.pages.total} pages, {stats.content.total} items, {stats.media.total} files)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchContentData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Link href="/super-admin/content/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Content
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="pages" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pages">Pages ({stats.pages.total})</TabsTrigger>
          <TabsTrigger value="content">Dynamic Content ({stats.content.total})</TabsTrigger>
          <TabsTrigger value="media">Media Library ({stats.media.total})</TabsTrigger>
          <TabsTrigger value="types">Content Types</TabsTrigger>
        </TabsList>

        <TabsContent value="pages" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Website Pages</CardTitle>
                  <CardDescription>
                    Manage all pages on your website ({filteredPages.length} results)
                  </CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search pages..."
                    className="pl-8 w-[300px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredPages.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {searchQuery ? 'No pages found matching your search.' : 'No pages found.'}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPages.map((page) => (
                    <div key={page.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Layout className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">{page.title}</p>
                          <p className="text-sm text-muted-foreground">{page.path}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <Badge variant={page.status === 'published' ? 'default' : 'secondary'}>
                            {page.status}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            Modified {formatDate(page.lastModified)}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => window.open(page.path, '_blank')}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Page
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => router.push(`/super-admin/content/pages/${page.id}`)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Page
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeletePage(page.id, page.title)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Dynamic Content Sections</CardTitle>
                  <CardDescription>
                    Manage reusable content blocks ({filteredContentItems.length} results)
                  </CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search content..."
                    className="pl-8 w-[300px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredContentItems.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {searchQuery ? 'No content found matching your search.' : 'No content items found.'}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredContentItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">{item.title}</p>
                          <p className="text-sm text-muted-foreground">
                            Type: {item.contentType.label}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <Badge variant={item.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                            {item.status}
                          </Badge>
                          {item.featured && (
                            <Badge variant="outline" className="ml-2">Featured</Badge>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => window.open(`/content/${item.slug}`, '_blank')}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Preview
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => router.push(`/super-admin/content/edit/${item.id}`)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Content
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteContent(item.id, item.title)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="media" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Media Library</CardTitle>
                  <CardDescription>
                    Upload and manage images, videos, and documents ({filteredMediaFiles.length} files, {formatFileSize(stats.media.totalSize)} total)
                  </CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search media..."
                    className="pl-8 w-[300px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredMediaFiles.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {searchQuery ? 'No media files found matching your search.' : 'No media files found.'}
                  <div className="mt-4">
                    <Button variant="outline">
                      <Plus className="mr-2 h-4 w-4" />
                      Upload Media
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {filteredMediaFiles.map((file) => (
                      <div key={file.id} className="group relative aspect-square border rounded-lg bg-muted overflow-hidden">
                        {file.type === 'image' ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={file.url}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FileText className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button size="icon" variant="ghost" className="text-white hover:text-white">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="text-white hover:text-white"
                            onClick={() => handleDeleteMedia(file.id, file.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-2">
                          <p className="text-xs text-white truncate">{file.name}</p>
                          <p className="text-xs text-white/60">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex justify-center">
                    <Button variant="outline">
                      <Plus className="mr-2 h-4 w-4" />
                      Upload More Media
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="types" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Types</CardTitle>
              <CardDescription>Define custom content structures and fields</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-12 text-muted-foreground">
                  <Settings className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>Content type management available</p>
                  <p className="text-xs mt-1">Define custom structures for your content</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <ConfirmDialog
        open={deletePageDialog.open}
        onOpenChange={(open) => setDeletePageDialog({ ...deletePageDialog, open })}
        title="Delete Page?"
        description={`Are you sure you want to delete "${deletePageDialog.title}"? This will permanently remove the page. This action cannot be undone.`}
        onConfirm={confirmDeletePage}
        variant="destructive"
      />
      
      <ConfirmDialog
        open={deleteContentDialog.open}
        onOpenChange={(open) => setDeleteContentDialog({ ...deleteContentDialog, open })}
        title="Delete Content?"
        description={`Are you sure you want to delete "${deleteContentDialog.title}"? This will permanently remove the content item. This action cannot be undone.`}
        onConfirm={confirmDeleteContent}
        variant="destructive"
      />
      
      <ConfirmDialog
        open={deleteMediaDialog.open}
        onOpenChange={(open) => setDeleteMediaDialog({ ...deleteMediaDialog, open })}
        title="Delete Media?"
        description={`Are you sure you want to delete "${deleteMediaDialog.name}"? This will permanently remove the media file. This action cannot be undone.`}
        onConfirm={confirmDeleteMedia}
        variant="destructive"
      />
    </div>
  )
}
