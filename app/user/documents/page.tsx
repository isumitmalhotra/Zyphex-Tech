"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  FileText,
  Upload,
  Download,
  Search,
  Filter,
  MoreVertical,
  File,
  Video,
  Archive,
  Eye,
  Share,
  Trash2,
  Folder,
  Plus,
} from "lucide-react"
import { useState, useEffect } from "react"

interface Document {
  id: string
  name?: string
  filename?: string
  type: string
  size?: string
  fileSize?: number
  uploadedDate?: string
  createdAt?: string
  category: string
  status?: string
  isPublic?: boolean
  shared?: boolean
  url?: string
  projectId?: string
}

interface DocumentStats {
  total: number
  uploaded: number
  shared: number
  recent: number
  totalSize: number
  avgFileSize: number
  byCategory: Record<string, number>
  byMimeType: Record<string, number>
  largestFile: number
}

export default function UserDocuments() {
  const [searchQuery, setSearchQuery] = useState("")
  const [documents, setDocuments] = useState<Document[]>([])
  const [stats, setStats] = useState<DocumentStats | null>(null)

  // Fetch documents on component mount
  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/user/documents')
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.documents || [])
        setStats(data.stats || null)
      }
    } catch (_error) {
      // Error fetching documents - handle silently
    }
  }

  // Generate folders from document categories
  const folders = stats?.byCategory
    ? Object.entries(stats.byCategory).map(([name, count]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1).toLowerCase(),
        count,
        color: getFolderColor(name)
      }))
    : []

  function getFolderColor(category: string): string {
    const colors: Record<string, string> = {
      projects: "bg-blue-500/20 text-blue-400",
      design: "bg-purple-500/20 text-purple-400",
      meetings: "bg-green-500/20 text-green-400",
      technical: "bg-orange-500/20 text-orange-400",
      legal: "bg-red-500/20 text-red-400",
      general: "bg-gray-500/20 text-gray-400",
      contracts: "bg-yellow-500/20 text-yellow-400",
      proposals: "bg-pink-500/20 text-pink-400",
      deliverables: "bg-cyan-500/20 text-cyan-400"
    }
    return colors[category.toLowerCase()] || "bg-blue-500/20 text-blue-400"
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case "PDF":
        return <FileText className="h-5 w-5 text-red-400" />
      case "Document":
        return <File className="h-5 w-5 text-blue-400" />
      case "Design":
        return <File className="h-5 w-5 text-purple-400" />
      case "Video":
        return <Video className="h-5 w-5 text-green-400" />
      case "Archive":
        return <Archive className="h-5 w-5 text-yellow-400" />
      default:
        return <File className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "Archived":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
      default:
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
    }
  }

  const filteredDocuments = documents.filter(doc => {
    const docName = doc.name || doc.filename || ''
    return (
      docName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.category.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold zyphex-heading">Documents</h1>
          <p className="text-lg zyphex-subheading">Manage your files and documents</p>
        </div>
        <Button className="zyphex-button-primary hover-zyphex-lift">
          <Upload className="mr-2 h-4 w-4" />
          Upload Files
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="zyphex-card hover-zyphex-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium zyphex-subheading">Total Files</CardTitle>
            <FileText className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold zyphex-heading">{documents.length}</div>
            <p className="text-xs zyphex-subheading">Documents uploaded</p>
          </CardContent>
        </Card>

        <Card className="zyphex-card hover-zyphex-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium zyphex-subheading">Storage Used</CardTitle>
            <Archive className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold zyphex-heading">24.2 MB</div>
            <p className="text-xs zyphex-subheading">Of 5 GB available</p>
          </CardContent>
        </Card>

        <Card className="zyphex-card hover-zyphex-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium zyphex-subheading">Shared Files</CardTitle>
            <Share className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold zyphex-heading">
              {documents.filter(doc => doc.shared).length}
            </div>
            <p className="text-xs zyphex-subheading">Files shared with team</p>
          </CardContent>
        </Card>

        <Card className="zyphex-card hover-zyphex-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium zyphex-subheading">Recent Uploads</CardTitle>
            <Upload className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold zyphex-heading">3</div>
            <p className="text-xs zyphex-subheading">This week</p>
          </CardContent>
        </Card>
      </div>

      {/* Folders */}
      <Card className="zyphex-card">
        <CardHeader>
          <CardTitle className="zyphex-heading">Folders</CardTitle>
          <CardDescription className="zyphex-subheading">Organize your documents by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {folders.map((folder, index) => (
              <div
                key={index}
                className="flex flex-col items-center p-4 rounded-lg border border-gray-800/50 hover-zyphex-glow cursor-pointer transition-all duration-200"
              >
                <Folder className="h-8 w-8 text-blue-400 mb-2" />
                <h3 className="font-medium zyphex-heading text-sm">{folder.name}</h3>
                <p className="text-xs zyphex-subheading">{folder.count} files</p>
              </div>
            ))}
            <div className="flex flex-col items-center p-4 rounded-lg border-2 border-dashed border-gray-600 hover:border-blue-400 cursor-pointer transition-all duration-200">
              <Plus className="h-8 w-8 text-gray-400 mb-2" />
              <h3 className="font-medium zyphex-heading text-sm">New Folder</h3>
              <p className="text-xs zyphex-subheading">Create folder</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card className="zyphex-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="zyphex-heading">All Documents</CardTitle>
              <CardDescription className="zyphex-subheading">Manage and organize your files</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search documents..."
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
                All ({filteredDocuments.length})
              </TabsTrigger>
              <TabsTrigger value="shared" className="zyphex-button-secondary">
                Shared ({filteredDocuments.filter(doc => doc.shared).length})
              </TabsTrigger>
              <TabsTrigger value="archived" className="zyphex-button-secondary">
                Archived ({filteredDocuments.filter(doc => doc.status === "Archived").length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-2">
              {filteredDocuments.map((doc) => {
                const docName = doc.name || doc.filename || 'Unnamed'
                const docSize = doc.size || (doc.fileSize ? formatFileSize(doc.fileSize) : 'Unknown size')
                const docDate = doc.uploadedDate || doc.createdAt || new Date().toISOString()
                const docStatus = doc.status || (doc.isPublic ? 'Active' : 'Private')
                const isShared = doc.shared !== undefined ? doc.shared : doc.isPublic || false
                
                return (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-gray-800/50 hover-zyphex-glow transition-all duration-200"
                  >
                    <div className="flex items-center gap-4">
                      {getFileIcon(doc.type)}
                      <div>
                        <h3 className="font-medium zyphex-heading truncate max-w-md">{docName}</h3>
                        <div className="flex items-center gap-4 text-sm zyphex-subheading">
                          <span>{docSize}</span>
                          <span>{new Date(docDate).toLocaleDateString()}</span>
                          <Badge variant="outline" className="text-xs">
                            {doc.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${getStatusColor(docStatus)} border text-xs`}>
                        {docStatus}
                      </Badge>
                      {isShared && (
                        <Badge variant="outline" className="text-xs bg-purple-500/20 text-purple-400">
                          Shared
                        </Badge>
                      )}
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="zyphex-button-secondary">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="zyphex-button-secondary">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="zyphex-button-secondary">
                          <Share className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="zyphex-button-secondary">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </TabsContent>

            <TabsContent value="shared" className="space-y-2">
              {filteredDocuments.filter(doc => doc.shared || doc.isPublic).map((doc) => {
                const docName = doc.name || doc.filename || 'Unnamed'
                const docSize = doc.size || (doc.fileSize ? formatFileSize(doc.fileSize) : 'Unknown size')
                const docDate = doc.uploadedDate || doc.createdAt || new Date().toISOString()
                
                return (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-gray-800/50 hover-zyphex-glow transition-all duration-200"
                  >
                    <div className="flex items-center gap-4">
                      {getFileIcon(doc.type)}
                      <div>
                        <h3 className="font-medium zyphex-heading truncate max-w-md">{docName}</h3>
                        <div className="flex items-center gap-4 text-sm zyphex-subheading">
                          <span>{docSize}</span>
                          <span>{new Date(docDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="zyphex-button-secondary hover-zyphex-glow">
                        <Share className="h-4 w-4 mr-2" />
                        Manage Access
                      </Button>
                      <Button variant="ghost" size="sm" className="zyphex-button-secondary">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </TabsContent>

            <TabsContent value="archived" className="space-y-2">
              {filteredDocuments.filter(doc => doc.status === "Archived").map((doc) => {
                const docName = doc.name || doc.filename || 'Unnamed'
                const docSize = doc.size || (doc.fileSize ? formatFileSize(doc.fileSize) : 'Unknown size')
                const docDate = doc.uploadedDate || doc.createdAt || new Date().toISOString()
                
                return (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-gray-800/50 opacity-60"
                  >
                    <div className="flex items-center gap-4">
                      {getFileIcon(doc.type)}
                      <div>
                        <h3 className="font-medium zyphex-heading truncate max-w-md">{docName}</h3>
                        <div className="flex items-center gap-4 text-sm zyphex-subheading">
                          <span>{docSize}</span>
                          <span>{new Date(docDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="zyphex-button-secondary hover-zyphex-glow">
                        Restore
                      </Button>
                      <Button variant="ghost" size="sm" className="zyphex-button-secondary text-red-400">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
