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
} from "lucide-react"
import { useState } from "react"

export default function UserDownloads() {
  const [searchQuery, setSearchQuery] = useState("")

  // Mock data for downloadable resources
  const downloads = [
    {
      id: 1,
      title: "Zyphex Tech Brand Guidelines",
      description: "Complete brand identity package including logos, colors, and typography",
      category: "Branding",
      fileType: "ZIP",
      size: "45.2 MB",
      downloads: 1247,
      rating: 4.8,
      lastUpdated: "2025-08-15",
      featured: true,
    },
    {
      id: 2,
      title: "React Component Library",
      description: "Pre-built React components for rapid development",
      category: "Development",
      fileType: "ZIP",
      size: "12.8 MB",
      downloads: 2156,
      rating: 4.9,
      lastUpdated: "2025-09-01",
      featured: true,
    },
    {
      id: 3,
      title: "UI Design Templates",
      description: "Figma templates for web and mobile interfaces",
      category: "Design",
      fileType: "FIG",
      size: "89.4 MB",
      downloads: 3421,
      rating: 4.7,
      lastUpdated: "2025-08-20",
      featured: false,
    },
    {
      id: 4,
      title: "API Documentation",
      description: "Complete API reference and integration guides",
      category: "Documentation",
      fileType: "PDF",
      size: "5.2 MB",
      downloads: 987,
      rating: 4.6,
      lastUpdated: "2025-08-25",
      featured: false,
    },
    {
      id: 5,
      title: "Project Management Templates",
      description: "Excel and Google Sheets templates for project tracking",
      category: "Tools",
      fileType: "ZIP",
      size: "2.1 MB",
      downloads: 756,
      rating: 4.5,
      lastUpdated: "2025-08-10",
      featured: false,
    },
    {
      id: 6,
      title: "Video Tutorials Collection",
      description: "Step-by-step video guides for our platform features",
      category: "Education",
      fileType: "MP4",
      size: "1.2 GB",
      downloads: 1893,
      rating: 4.9,
      lastUpdated: "2025-09-05",
      featured: true,
    },
  ]

  const categories = [
    { name: "All", count: downloads.length, icon: Package },
    { name: "Branding", count: downloads.filter(d => d.category === "Branding").length, icon: Image },
    { name: "Development", count: downloads.filter(d => d.category === "Development").length, icon: Code },
    { name: "Design", count: downloads.filter(d => d.category === "Design").length, icon: Image },
    { name: "Documentation", count: downloads.filter(d => d.category === "Documentation").length, icon: FileText },
    { name: "Tools", count: downloads.filter(d => d.category === "Tools").length, icon: Package },
    { name: "Education", count: downloads.filter(d => d.category === "Education").length, icon: Book },
  ]

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
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

  const filteredDownloads = downloads.filter(download =>
    download.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    download.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    download.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold zyphex-heading">Downloads</h1>
          <p className="text-lg zyphex-subheading">Access resources, templates, and tools</p>
        </div>
        <Button className="zyphex-button-primary hover-zyphex-lift">
          <Download className="mr-2 h-4 w-4" />
          Download All
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="zyphex-card hover-zyphex-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium zyphex-subheading">Total Downloads</CardTitle>
            <Download className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold zyphex-heading">{downloads.length}</div>
            <p className="text-xs zyphex-subheading">Resources available</p>
          </CardContent>
        </Card>

        <Card className="zyphex-card hover-zyphex-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium zyphex-subheading">Your Downloads</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold zyphex-heading">8</div>
            <p className="text-xs zyphex-subheading">Files downloaded</p>
          </CardContent>
        </Card>

        <Card className="zyphex-card hover-zyphex-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium zyphex-subheading">Storage Saved</CardTitle>
            <Archive className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold zyphex-heading">2.4 GB</div>
            <p className="text-xs zyphex-subheading">Total file size</p>
          </CardContent>
        </Card>

        <Card className="zyphex-card hover-zyphex-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium zyphex-subheading">Featured</CardTitle>
            <Star className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold zyphex-heading">
              {downloads.filter(d => d.featured).length}
            </div>
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
                className="flex flex-col items-center p-4 rounded-lg border border-gray-800/50 hover-zyphex-glow cursor-pointer transition-all duration-200"
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
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3 zyphex-glass-effect border-gray-800/50">
              <TabsTrigger value="all" className="zyphex-button-secondary">
                All ({filteredDownloads.length})
              </TabsTrigger>
              <TabsTrigger value="featured" className="zyphex-button-secondary">
                Featured ({filteredDownloads.filter(d => d.featured).length})
              </TabsTrigger>
              <TabsTrigger value="recent" className="zyphex-button-secondary">
                Recent ({filteredDownloads.filter(d => new Date(d.lastUpdated) > new Date('2025-08-20')).length})
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
                              <span>{download.size}</span>
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-yellow-400 fill-current" />
                                <span>{download.rating}</span>
                              </div>
                              <span>{download.downloads} downloads</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="text-xs zyphex-subheading">
                            Updated: {new Date(download.lastUpdated).toLocaleDateString()}
                          </div>
                          <Button className="zyphex-button-primary hover-zyphex-lift">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
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
                              <span>{download.size}</span>
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-yellow-400 fill-current" />
                                <span>{download.rating}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <Button className="zyphex-button-primary hover-zyphex-lift">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="recent" className="space-y-4">
              <div className="grid gap-4">
                {filteredDownloads
                  .filter(d => new Date(d.lastUpdated) > new Date('2025-08-20'))
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
                                <span>{download.size}</span>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>Recently updated</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <Button className="zyphex-button-primary hover-zyphex-lift">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
