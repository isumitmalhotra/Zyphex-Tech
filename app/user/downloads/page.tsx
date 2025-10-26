"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Download,
  Search,
  Filter,
  Package,
  FileText,
  Image,
  Video,
  Archive,
  Code,
  Book,
  Star,
  Clock,
  CheckCircle,
  Loader2,
} from "lucide-react"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"

interface DownloadableResource {
  id: string
  title: string
  description: string
  category: string
  fileType: string
  fileName: string
  filePath: string
  fileSize: number
  downloads: number
  rating: number | null
  ratingCount: number
  featured: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface Stats {
  total: number
  featured: number
  totalDownloads: number
  totalSize: number
  avgRating: number
  byCategory: Record<string, number>
  byFileType: Record<string, number>
  recent: number
}

export default function UserDownloads() {
  const [searchQuery, setSearchQuery] = useState("")
  const [resources, setResources] = useState<DownloadableResource[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState("All")
  const { toast } = useToast()

  useEffect(() => {
    fetchDownloads()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, searchQuery])

  const fetchDownloads = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      
      if (selectedCategory && selectedCategory !== 'All') {
        params.append('category', selectedCategory)
      }
      
      if (searchQuery) {
        params.append('search', searchQuery)
      }

      const response = await fetch(`/api/user/downloads?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch downloads')
      }

      const data = await response.json()
      setResources(data.resources || [])
      setStats(data.stats || null)
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to load downloadable resources",
        variant: "destructive"
      })
      setResources([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = async (resource: DownloadableResource) => {
    try {
      // Track download
      await fetch('/api/user/downloads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: resource.id })
      })

      // Trigger actual download
      window.open(resource.filePath, '_blank')

      toast({
        title: "Download Started",
        description: `Downloading ${resource.title}...`
      })

      // Refresh data to update download count
      fetchDownloads()
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive"
      })
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
  }

  const categories = stats?.byCategory
    ? [
        { name: "All", count: stats.total, icon: Package },
        ...Object.entries(stats.byCategory).map(([name, count]) => ({
          name,
          count,
          icon: getCategoryIcon(name)
        }))
      ]
    : [{ name: "All", count: 0, icon: Package }]

  function getCategoryIcon(category: string) {
    switch (category.toLowerCase()) {
      case 'branding':
        return Image
      case 'development':
        return Code
      case 'design':
        return Image
      case 'documentation':
        return FileText
      case 'tools':
        return Package
      case 'education':
        return Book
      default:
        return Package
    }
  }

  const getFileIcon = (fileType: string) => {
    switch (fileType.toUpperCase()) {
      case "PDF":
        return <FileText className="h-5 w-5 text-red-400" />
      case "ZIP":
        return <Archive className="h-5 w-5 text-yellow-400" />
      case "FIG":
        return <FileText className="h-5 w-5 text-purple-400" />
      case "MP4":
        return <Video className="h-5 w-5 text-green-400" />
      default:
        return <FileText className="h-5 w-5 text-blue-400" />
    }
  }

  const filteredDownloads = resources

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold zyphex-heading">Downloads</h1>
          <p className="text-lg zyphex-subheading">Access resources, templates, and tools</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="zyphex-card hover-zyphex-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium zyphex-subheading">Total Downloads</CardTitle>
            <Download className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold zyphex-heading">{stats?.total || 0}</div>
            <p className="text-xs zyphex-subheading">Resources available</p>
          </CardContent>
        </Card>

        <Card className="zyphex-card hover-zyphex-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium zyphex-subheading">Total Downloads</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold zyphex-heading">{stats?.totalDownloads || 0}</div>
            <p className="text-xs zyphex-subheading">Times downloaded</p>
          </CardContent>
        </Card>

        <Card className="zyphex-card hover-zyphex-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium zyphex-subheading">Storage</CardTitle>
            <Archive className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold zyphex-heading">
              {stats?.totalSize ? formatFileSize(stats.totalSize) : '0 B'}
            </div>
            <p className="text-xs zyphex-subheading">Total file size</p>
          </CardContent>
        </Card>

        <Card className="zyphex-card hover-zyphex-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium zyphex-subheading">Featured</CardTitle>
            <Star className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold zyphex-heading">{stats?.featured || 0}</div>
            <p className="text-xs zyphex-subheading">Premium resources</p>
          </CardContent>
        </Card>
      </div>

      {/* Categories */}
      <Card className="zyphex-card">
        <CardHeader>
          <CardTitle className="zyphex-heading">Categories</CardTitle>
          <CardDescription className="zyphex-subheading">Browse resources by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {categories.map((category, index) => (
              <div
                key={index}
                onClick={() => setSelectedCategory(category.name)}
                className={`flex flex-col items-center p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                  selectedCategory === category.name
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-800/50 hover-zyphex-glow'
                }`}
              >
                <category.icon className="h-6 w-6 text-blue-400 mb-2" />
                <h3 className="font-medium zyphex-heading text-sm text-center">{category.name}</h3>
                <p className="text-xs zyphex-subheading">{category.count} items</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Downloads List */}
      <Card className="zyphex-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="zyphex-heading">Available Downloads</CardTitle>
              <CardDescription className="zyphex-subheading">Download resources and tools</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search downloads..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64 zyphex-input"
                />
              </div>
              <Button variant="outline" size="sm" className="zyphex-button-secondary">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            </div>
          ) : (
            <Tabs defaultValue="all" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3 zyphex-glass-effect border-gray-800/50">
                <TabsTrigger value="all" className="zyphex-button-secondary">
                  All ({filteredDownloads.length})
                </TabsTrigger>
                <TabsTrigger value="featured" className="zyphex-button-secondary">
                  Featured ({filteredDownloads.filter(d => d.featured).length})
                </TabsTrigger>
                <TabsTrigger value="recent" className="zyphex-button-secondary">
                  Recent ({stats?.recent || 0})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                <div className="grid gap-4">
                  {filteredDownloads.map((download) => (
                    <Card key={download.id} className="zyphex-card hover-zyphex-lift">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="p-3 rounded-lg bg-blue-500/20">
                              {getFileIcon(download.fileType)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold zyphex-heading">{download.title}</h3>
                                {download.featured && (
                                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                                    <Star className="h-3 w-3 mr-1" />
                                    Featured
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm zyphex-subheading mb-3">{download.description}</p>
                              <div className="flex items-center gap-4 text-sm zyphex-subheading">
                                <Badge variant="outline" className="text-xs">
                                  {download.category}
                                </Badge>
                                <span>{download.fileType}</span>
                                <span>{formatFileSize(download.fileSize)}</span>
                                {download.rating && download.rating > 0 && (
                                  <div className="flex items-center gap-1">
                                    <Star className="h-3 w-3 text-yellow-400 fill-current" />
                                    <span>{download.rating.toFixed(1)}</span>
                                  </div>
                                )}
                                <span>{download.downloads} downloads</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="text-xs zyphex-subheading">
                              Updated: {new Date(download.updatedAt).toLocaleDateString()}
                            </div>
                            <Button 
                              onClick={() => handleDownload(download)}
                              className="zyphex-button-primary hover-zyphex-lift"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {filteredDownloads.length === 0 && (
                    <div className="text-center py-12">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-lg zyphex-subheading">No resources found</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="featured" className="space-y-4">
                <div className="grid gap-4">
                  {filteredDownloads.filter(d => d.featured).map((download) => (
                    <Card key={download.id} className="zyphex-card hover-zyphex-lift border-yellow-500/30">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="p-3 rounded-lg bg-yellow-500/20">
                              {getFileIcon(download.fileType)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold zyphex-heading">{download.title}</h3>
                                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                                  <Star className="h-3 w-3 mr-1" />
                                  Featured
                                </Badge>
                              </div>
                              <p className="text-sm zyphex-subheading mb-3">{download.description}</p>
                              <div className="flex items-center gap-4 text-sm zyphex-subheading">
                                <span>{download.fileType}</span>
                                <span>{formatFileSize(download.fileSize)}</span>
                                {download.rating && download.rating > 0 && (
                                  <div className="flex items-center gap-1">
                                    <Star className="h-3 w-3 text-yellow-400 fill-current" />
                                    <span>{download.rating.toFixed(1)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button 
                            onClick={() => handleDownload(download)}
                            className="zyphex-button-primary hover-zyphex-lift"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {filteredDownloads.filter(d => d.featured).length === 0 && (
                    <div className="text-center py-12">
                      <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-lg zyphex-subheading">No featured resources</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="recent" className="space-y-4">
                <div className="grid gap-4">
                  {filteredDownloads
                    .filter(d => {
                      const weekAgo = new Date()
                      weekAgo.setDate(weekAgo.getDate() - 7)
                      return new Date(d.updatedAt) >= weekAgo
                    })
                    .map((download) => (
                      <Card key={download.id} className="zyphex-card hover-zyphex-lift">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4 flex-1">
                              <div className="p-3 rounded-lg bg-green-500/20">
                                {getFileIcon(download.fileType)}
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold zyphex-heading mb-2">{download.title}</h3>
                                <p className="text-sm zyphex-subheading mb-3">{download.description}</p>
                                <div className="flex items-center gap-4 text-sm zyphex-subheading">
                                  <span>{download.fileType}</span>
                                  <span>{formatFileSize(download.fileSize)}</span>
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    <span>Recently updated</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <Button 
                              onClick={() => handleDownload(download)}
                              className="zyphex-button-primary hover-zyphex-lift"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  {filteredDownloads.filter(d => {
                    const weekAgo = new Date()
                    weekAgo.setDate(weekAgo.getDate() - 7)
                    return new Date(d.updatedAt) >= weekAgo
                  }).length === 0 && (
                    <div className="text-center py-12">
                      <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-lg zyphex-subheading">No recent updates</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
