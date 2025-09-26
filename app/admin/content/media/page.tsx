"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "@/hooks/use-toast"
import { 
  Image as ImageIcon, 
  FileText, 
  Video, 
  Music,
  File,
  Trash2,
  Copy,
  Check,
  Search,
  Filter,
  Grid3X3,
  List,
  Plus,
  X,
  HardDrive,
  Loader2
} from "lucide-react"
import Image from "next/image"

interface MediaAsset {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  alt?: string
  category?: string
  uploadedBy?: string
  createdAt: string
  updatedAt: string
}

interface MediaUploadResponse {
  success: boolean
  asset?: MediaAsset
  error?: string
}

const MEDIA_CATEGORIES = [
  { value: 'all', label: 'All Media' },
  { value: 'image', label: 'Images' },
  { value: 'video', label: 'Videos' },
  { value: 'audio', label: 'Audio' },
  { value: 'document', label: 'Documents' },
  { value: 'portfolio', label: 'Portfolio' },
  { value: 'blog', label: 'Blog' },
  { value: 'content', label: 'Content' },
  { value: 'other', label: 'Other' }
]

const VIEW_MODES = [
  { value: 'grid', label: 'Grid View', icon: Grid3X3 },
  { value: 'list', label: 'List View', icon: List }
]

export default function MediaLibraryPage() {
  const searchParams = useSearchParams()
  const selectMode = searchParams.get('select') === 'true'
  const callback = searchParams.get('callback')

  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)

  // Load media assets
  const loadAssets = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/media')
      
      if (!response.ok) {
        throw new Error('Failed to fetch media assets')
      }
      
      const data = await response.json()
      setAssets(data.assets || [])
    } catch (error) {
      console.error('Error loading media assets:', error)
      toast({
        title: "Error",
        description: "Failed to load media assets",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [])

  // Handle file upload
  const handleFileUpload = async (files: FileList) => {
    if (files.length === 0) return

    setUploading(true)
    const uploadedAssets: MediaAsset[] = []

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('category', categoryFilter !== 'all' ? categoryFilter : 'content')

        const response = await fetch('/api/admin/media/upload', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`)
        }

        const result: MediaUploadResponse = await response.json()
        if (result.success && result.asset) {
          uploadedAssets.push(result.asset)
        }
      }

      // Add new assets to the list
      setAssets(prev => [...uploadedAssets, ...prev])
      
      toast({
        title: "Success",
        description: `Uploaded ${uploadedAssets.length} file(s) successfully`,
      })

      setUploadDialogOpen(false)
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload files",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  // Handle asset deletion
  const handleDeleteAsset = async (assetId: string) => {
    try {
      const response = await fetch(`/api/admin/media/${assetId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete asset')
      }

      setAssets(prev => prev.filter(asset => asset.id !== assetId))
      setSelectedAssets(prev => {
        const newSet = new Set(prev)
        newSet.delete(assetId)
        return newSet
      })

      toast({
        title: "Success",
        description: "Asset deleted successfully",
      })
    } catch (error) {
      console.error('Delete error:', error)
      toast({
        title: "Error",
        description: "Failed to delete asset",
        variant: "destructive"
      })
    }
  }

  // Handle asset selection
  const handleAssetSelect = (assetId: string) => {
    if (selectMode) {
      // In select mode, only allow single selection
      setSelectedAssets(new Set([assetId]))
    } else {
      // In normal mode, allow multiple selection
      setSelectedAssets(prev => {
        const newSet = new Set(prev)
        if (newSet.has(assetId)) {
          newSet.delete(assetId)
        } else {
          newSet.add(assetId)
        }
        return newSet
      })
    }
  }

  // Handle inserting selected images
  const handleInsertImages = () => {
    if (selectMode && callback) {
      const selectedAsset = assets.find(asset => selectedAssets.has(asset.id))
      if (selectedAsset) {
        // Use postMessage to communicate with parent window
        window.parent.postMessage({
          type: 'media-selected',
          asset: selectedAsset,
          callback
        }, '*')
        
        // Close the window/dialog
        window.close()
      }
    } else {
      // Copy URLs to clipboard
      const selectedUrls = assets
        .filter(asset => selectedAssets.has(asset.id))
        .map(asset => asset.url)
        .join('\n')
      
      navigator.clipboard.writeText(selectedUrls)
      toast({
        title: "Success",
        description: `Copied ${selectedAssets.size} URL(s) to clipboard`,
      })
    }
  }

  // Copy asset URL to clipboard
  const copyAssetUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    setCopiedUrl(url)
    setTimeout(() => setCopiedUrl(null), 2000)
    toast({
      title: "Success",
      description: "URL copied to clipboard",
    })
  }

  // Filter assets based on search and category
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         asset.alt?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = categoryFilter === 'all' || 
                           asset.category === categoryFilter ||
                           (categoryFilter === 'image' && asset.mimeType.startsWith('image/')) ||
                           (categoryFilter === 'video' && asset.mimeType.startsWith('video/')) ||
                           (categoryFilter === 'audio' && asset.mimeType.startsWith('audio/'))
    
    return matchesSearch && matchesCategory
  })



  // Format file size
  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 B'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  useEffect(() => {
    loadAssets()
  }, [loadAssets])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading media library...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Media Library</h1>
            <p className="text-muted-foreground">
              Manage your images, videos, and other media assets
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            {selectMode && (
              <>
                <Button
                  onClick={handleInsertImages}
                  disabled={selectedAssets.size === 0}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Insert Selected ({selectedAssets.size})
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.close()}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </>
            )}
            
            {!selectMode && (
              <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Media
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Upload Media Files</DialogTitle>
                    <DialogDescription>
                      Select images, videos, or documents to upload to your media library.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {MEDIA_CATEGORIES.filter(cat => cat.value !== 'all').map(cat => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="files">Select Files</Label>
                      <Input
                        id="files"
                        type="file"
                        multiple
                        accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                        onChange={(e) => {
                          if (e.target.files) {
                            handleFileUpload(e.target.files)
                          }
                        }}
                        disabled={uploading}
                      />
                    </div>
                  </div>
                  
                  {uploading && (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span>Uploading files...</span>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <ImageIcon className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Assets</p>
                  <p className="text-2xl font-bold">{assets.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <HardDrive className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Size</p>
                  <p className="text-2xl font-bold">
                    {formatFileSize(assets.reduce((sum, asset) => sum + asset.size, 0))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <ImageIcon className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Images</p>
                  <p className="text-2xl font-bold">
                    {assets.filter(a => a.mimeType.startsWith('image/')).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <File className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Other Files</p>
                  <p className="text-2xl font-bold">
                    {assets.filter(a => !a.mimeType.startsWith('image/')).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search media..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEDIA_CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            {selectedAssets.size > 0 && (
              <Badge variant="secondary">
                {selectedAssets.size} selected
              </Badge>
            )}
            
            <div className="flex border rounded-md">
              {VIEW_MODES.map(mode => {
                const Icon = mode.icon
                return (
                  <Button
                    key={mode.value}
                    variant={viewMode === mode.value ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode(mode.value as 'grid' | 'list')}
                    className="rounded-none first:rounded-l-md last:rounded-r-md"
                  >
                    <Icon className="h-4 w-4" />
                  </Button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Media Grid/List */}
      {filteredAssets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ImageIcon className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No media found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchQuery || categoryFilter !== 'all' 
                ? "No assets match your current filters." 
                : "Upload your first media file to get started."
              }
            </p>
            {!selectMode && (
              <Button onClick={() => setUploadDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Upload Media
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
            : "space-y-2"
        }>
          {filteredAssets.map((asset) => (
            <MediaAssetCard
              key={asset.id}
              asset={asset}
              isSelected={selectedAssets.has(asset.id)}
              onSelect={() => handleAssetSelect(asset.id)}
              onDelete={() => handleDeleteAsset(asset.id)}
              onCopyUrl={() => copyAssetUrl(asset.url)}
              viewMode={viewMode}
              selectMode={selectMode}
              copiedUrl={copiedUrl}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Media Asset Card Component
interface MediaAssetCardProps {
  asset: MediaAsset
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
  onCopyUrl: () => void
  viewMode: 'grid' | 'list'
  selectMode: boolean
  copiedUrl: string | null
}

function MediaAssetCard({
  asset,
  isSelected,
  onSelect,
  onDelete,
  onCopyUrl,
  viewMode,
  selectMode,
  copiedUrl
}: MediaAssetCardProps) {
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return ImageIcon
    if (mimeType.startsWith('video/')) return Video
    if (mimeType.startsWith('audio/')) return Music
    if (mimeType.includes('pdf') || mimeType.includes('document')) return FileText
    return File
  }

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 B'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const FileIcon = getFileIcon(asset.mimeType)
  const isImage = asset.mimeType.startsWith('image/')
  const isCopied = copiedUrl === asset.url

  if (viewMode === 'list') {
    return (
      <Card className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              {isImage ? (
                <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                  <Image
                    src={asset.url}
                    alt={asset.alt || asset.originalName}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                  <FileIcon className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate">{asset.originalName}</h3>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                <span>{formatFileSize(asset.size)}</span>
                <span>{asset.category}</span>
                <span>{new Date(asset.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onCopyUrl()
                }}
              >
                {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
              
              {!selectMode && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Media Asset</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete &quot;{asset.originalName}&quot;? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              
              <Button
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={onSelect}
              >
                {isSelected ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Selected
                  </>
                ) : (
                  selectMode ? 'Select' : 'Use'
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
      <CardContent className="p-0">
        <div onClick={onSelect}>
          {/* Media Preview */}
          <div className="aspect-square relative">
            {isImage ? (
              <Image
                src={asset.url}
                alt={asset.alt || asset.originalName}
                fill
                className="object-cover rounded-t-lg"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="w-full h-full bg-muted rounded-t-lg flex items-center justify-center">
                <FileIcon className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
            
            {/* Selection Overlay */}
            {isSelected && (
              <div className="absolute inset-0 bg-blue-500/20 rounded-t-lg flex items-center justify-center">
                <div className="bg-blue-500 text-white rounded-full p-2">
                  <Check className="h-4 w-4" />
                </div>
              </div>
            )}
          </div>
          
          {/* Asset Info */}
          <div className="p-3">
            <h3 className="font-medium text-sm truncate mb-1">{asset.originalName}</h3>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{formatFileSize(asset.size)}</span>
              {asset.category && (
                <Badge variant="outline" className="text-xs">
                  {asset.category}
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="px-3 pb-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onCopyUrl()
            }}
          >
            {isCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          </Button>
          
          {!selectMode && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Media Asset</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete &quot;{asset.originalName}&quot;? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardContent>
    </Card>
  )
}