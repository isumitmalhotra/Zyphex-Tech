"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DocumentUploadZone } from "@/components/project-manager/document-upload-zone"
import { toast } from "@/hooks/use-toast"
import {
  FileText,
  Upload,
  Search,
  Grid3x3,
  List,
  Download,
  Eye,
  Trash2,
  FileSpreadsheet,
  FileImage,
  File,
  Loader2,
  BarChart3,
  Filter,
  Calendar
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Document {
  id: string
  filename: string
  originalName: string
  filePath: string
  fileSize: number
  mimeType: string
  category: string | null
  description: string | null
  projectId: string | null
  userId: string
  version: number
  downloadCount: number
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
  project: {
    id: string
    name: string
    status: string
  } | null
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
  byProject: Record<string, number>
  largestFile: number
}

export default function DocumentManagementPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [stats, setStats] = useState<DocumentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [mimeTypeFilter, setMimeTypeFilter] = useState<string>('all')
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (categoryFilter !== 'all') params.append('category', categoryFilter)
      if (mimeTypeFilter !== 'all') params.append('mimeType', mimeTypeFilter)

      const response = await fetch(`/api/project-manager/documents?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch documents')
      }

      const data = await response.json()
      setDocuments(data.documents)
      setStats(data.stats)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load documents",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, categoryFilter, mimeTypeFilter])

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return
    }

    try {
      const response = await fetch(`/api/project-manager/documents/${documentId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete document')
      }

      toast({
        title: "Success",
        description: "Document deleted successfully"
      })

      fetchDocuments()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete document",
        variant: "destructive"
      })
    }
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <FileImage className="h-5 w-5" />
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return <FileSpreadsheet className="h-5 w-5" />
    if (mimeType.includes('pdf')) return <FileText className="h-5 w-5" />
    return <File className="h-5 w-5" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 zyphex-gradient-bg relative min-h-screen">
      <div className="relative z-10 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold zyphex-heading">Document Management</h1>
            <p className="text-muted-foreground mt-1">
              Centralized storage, organization, and sharing of project documents
            </p>
          </div>
          <Button 
            onClick={() => setShowUploadDialog(true)}
            className="zyphex-button-primary"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Documents
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="zyphex-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.recent} uploaded this month
                </p>
              </CardContent>
            </Card>

            <Card className="zyphex-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatFileSize(stats.totalSize)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Avg: {formatFileSize(stats.avgFileSize)}
                </p>
              </CardContent>
            </Card>

            <Card className="zyphex-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">My Uploads</CardTitle>
                <Upload className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.uploaded}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.shared} shared with you
                </p>
              </CardContent>
            </Card>

            <Card className="zyphex-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Categories</CardTitle>
                <Filter className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Object.keys(stats.byCategory).length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Across {Object.keys(stats.byProject).length} projects
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and Search */}
        <Card className="zyphex-card">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="proposal">Proposal</SelectItem>
                  <SelectItem value="deliverable">Deliverable</SelectItem>
                  <SelectItem value="specification">Specification</SelectItem>
                  <SelectItem value="report">Report</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>

              <Select value={mimeTypeFilter} onValueChange={setMimeTypeFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="image">Images</SelectItem>
                  <SelectItem value="application">Documents</SelectItem>
                  <SelectItem value="text">Text Files</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents Display */}
        {loading ? (
          <Card className="zyphex-card">
            <CardContent className="p-12">
              <div className="flex flex-col items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Loading documents...</p>
              </div>
            </CardContent>
          </Card>
        ) : documents.length === 0 ? (
          <Card className="zyphex-card">
            <CardContent className="p-12">
              <div className="flex flex-col items-center justify-center text-center">
                <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No documents found</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  {searchQuery || categoryFilter !== 'all' || mimeTypeFilter !== 'all'
                    ? "Try adjusting your filters to find what you're looking for"
                    : "Get started by uploading your first document"
                  }
                </p>
                {!searchQuery && categoryFilter === 'all' && mimeTypeFilter === 'all' && (
                  <Button onClick={() => setShowUploadDialog(true)}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Document
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
              : 'space-y-2'
          }>
            {documents.map((document) => (
              <Card key={document.id} className="zyphex-card hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className={viewMode === 'grid' ? 'space-y-3' : 'flex items-center gap-4'}>
                    {/* Icon */}
                    <div className={`${viewMode === 'grid' ? 'w-full flex justify-center' : ''}`}>
                      <div className="p-4 bg-primary/10 rounded-lg inline-flex">
                        {getFileIcon(document.mimeType)}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate mb-1">{document.originalName}</h3>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {document.category && (
                          <Badge variant="secondary" className="text-xs">
                            {document.category}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {formatFileSize(document.fileSize)}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        {document.project && (
                          <div className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            <span>{document.project.name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(document.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Download className="h-3 w-3" />
                          <span>{document.downloadCount} downloads</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className={`flex ${viewMode === 'grid' ? 'justify-end' : 'gap-2'}`}>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedDocument(document)}
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(document.filePath, '_blank')}
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteDocument(document.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Documents</DialogTitle>
            <DialogDescription>
              Upload one or multiple files to your document library
            </DialogDescription>
          </DialogHeader>
          <DocumentUploadZone
            onUploadSuccess={() => {
              fetchDocuments()
              toast({
                title: "Success",
                description: "Document uploaded successfully"
              })
            }}
            onUploadError={(error) => {
              toast({
                title: "Upload Failed",
                description: error,
                variant: "destructive"
              })
            }}
          />
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Document Details Dialog */}
      <Dialog open={!!selectedDocument} onOpenChange={() => setSelectedDocument(null)}>
        <DialogContent className="max-w-2xl">
          {selectedDocument && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedDocument.originalName}</DialogTitle>
                <DialogDescription>Document Details</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">File Size</Label>
                    <p className="text-sm text-muted-foreground">{formatFileSize(selectedDocument.fileSize)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Type</Label>
                    <p className="text-sm text-muted-foreground">{selectedDocument.mimeType}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Category</Label>
                    <p className="text-sm text-muted-foreground">{selectedDocument.category || 'Uncategorized'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Version</Label>
                    <p className="text-sm text-muted-foreground">v{selectedDocument.version}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Uploaded By</Label>
                    <p className="text-sm text-muted-foreground">{selectedDocument.user.name || selectedDocument.user.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Upload Date</Label>
                    <p className="text-sm text-muted-foreground">{formatDate(selectedDocument.createdAt)}</p>
                  </div>
                  {selectedDocument.project && (
                    <div className="col-span-2">
                      <Label className="text-sm font-medium">Project</Label>
                      <p className="text-sm text-muted-foreground">{selectedDocument.project.name}</p>
                    </div>
                  )}
                  {selectedDocument.description && (
                    <div className="col-span-2">
                      <Label className="text-sm font-medium">Description</Label>
                      <p className="text-sm text-muted-foreground">{selectedDocument.description}</p>
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setSelectedDocument(null)}>
                    Close
                  </Button>
                  <Button onClick={() => window.open(selectedDocument.filePath, '_blank')}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>
}
