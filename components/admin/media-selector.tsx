"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { 
  Image as ImageIcon, 
  FileText, 
  Video, 
  Music,
  File,
  Check,
  Search,
  Filter,
  Plus,
  Loader2,
  X
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

interface MediaSelectorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (asset: MediaAsset) => void
  acceptedTypes?: string[] // e.g., ['image/*', 'video/*']
  title?: string
  description?: string
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

export function MediaSelectorDialog({
  open,
  onOpenChange,
  onSelect,
  acceptedTypes = ['image/*'],
  title = "Select Media",
  description = "Choose an image or upload a new one"
}: MediaSelectorDialogProps) {
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showUpload, setShowUpload] = useState(false)

  // Load media assets
  const loadAssets = useCallback(async () => {
    if (!open) return
    
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
  }, [open])

  // Handle file upload
  const handleFileUpload = async (files: FileList) => {
    if (files.length === 0) return

    setUploading(true)

    try {
      const file = files[0] // Only handle single file for now
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
        // Add new asset to the list
        setAssets(prev => [result.asset!, ...prev])
        
        toast({
          title: "Success",
          description: "File uploaded successfully",
        })

        // Auto-select the newly uploaded asset
        setSelectedAsset(result.asset.id)
        setShowUpload(false)
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  // Filter assets based on search, category, and accepted types
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         asset.alt?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = categoryFilter === 'all' || 
                           asset.category === categoryFilter ||
                           (categoryFilter === 'image' && asset.mimeType.startsWith('image/')) ||
                           (categoryFilter === 'video' && asset.mimeType.startsWith('video/')) ||
                           (categoryFilter === 'audio' && asset.mimeType.startsWith('audio/'))
    
    const matchesType = acceptedTypes.some(type => {
      if (type === 'image/*') return asset.mimeType.startsWith('image/')
      if (type === 'video/*') return asset.mimeType.startsWith('video/')
      if (type === 'audio/*') return asset.mimeType.startsWith('audio/')
      return asset.mimeType === type
    })
    
    return matchesSearch && matchesCategory && matchesType
  })



  // Handle asset selection
  const handleAssetSelect = (asset: MediaAsset) => {
    onSelect(asset)
    onOpenChange(false)
  }

  useEffect(() => {
    loadAssets()
  }, [open, loadAssets])

  const getAcceptString = () => {
    return acceptedTypes.join(',')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
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
            
            <Button
              variant="outline"
              onClick={() => setShowUpload(!showUpload)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Upload New
            </Button>
          </div>

          {/* Upload Section */}
          {showUpload && (
            <div className="border rounded-lg p-4 mb-4 bg-muted/50">
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
                  <Label htmlFor="file">Select File</Label>
                  <Input
                    id="file"
                    type="file"
                    accept={getAcceptString()}
                    onChange={(e) => {
                      if (e.target.files) {
                        handleFileUpload(e.target.files)
                      }
                    }}
                    disabled={uploading}
                  />
                </div>
                
                {uploading && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Uploading file...</span>
                  </div>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowUpload(false)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Media Grid */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading media library...</p>
                </div>
              </div>
            ) : filteredAssets.length === 0 ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <ImageIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No media found</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {searchQuery || categoryFilter !== 'all' 
                      ? "No assets match your current filters." 
                      : "Upload your first media file to get started."
                    }
                  </p>
                  <Button onClick={() => setShowUpload(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Media
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-4">
                {filteredAssets.map((asset) => (
                  <MediaAssetCard
                    key={asset.id}
                    asset={asset}
                    isSelected={selectedAsset === asset.id}
                    onSelect={() => handleAssetSelect(asset)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Media Asset Card Component for the selector
interface MediaAssetCardProps {
  asset: MediaAsset
  isSelected: boolean
  onSelect: () => void
}

function MediaAssetCard({ asset, isSelected, onSelect }: MediaAssetCardProps) {
  const isImage = asset.mimeType.startsWith('image/')
  const FileIcon = getFileIcon(asset.mimeType)

  function getFileIcon(mimeType: string) {
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

  return (
    <div 
      className={`
        cursor-pointer rounded-lg border-2 overflow-hidden transition-all hover:shadow-md
        ${isSelected ? 'border-blue-500 shadow-md' : 'border-border hover:border-muted-foreground'}
      `}
      onClick={onSelect}
    >
      {/* Media Preview */}
      <div className="aspect-square relative">
        {isImage ? (
          <Image
            src={asset.url}
            alt={asset.alt || asset.originalName}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <FileIcon className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        
        {/* Selection Overlay */}
        {isSelected && (
          <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
            <div className="bg-blue-500 text-white rounded-full p-2">
              <Check className="h-4 w-4" />
            </div>
          </div>
        )}
      </div>
      
      {/* Asset Info */}
      <div className="p-2">
        <h3 className="font-medium text-xs truncate mb-1">{asset.originalName}</h3>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatFileSize(asset.size)}</span>
          {asset.category && (
            <Badge variant="outline" className="text-xs px-1 py-0">
              {asset.category}
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}

// Simple trigger component
interface MediaSelectorTriggerProps {
  value?: string | null
  onSelect: (asset: MediaAsset) => void
  placeholder?: string
  acceptedTypes?: string[]
  className?: string
}

export function MediaSelectorTrigger({
  value,
  onSelect,
  placeholder = "Select image...",
  acceptedTypes = ['image/*'],
  className = ""
}: MediaSelectorTriggerProps) {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <>
      <div className={`border rounded-md ${className}`}>
        {value ? (
          <div className="relative aspect-video overflow-hidden rounded-md">
            <Image
              src={value}
              alt="Selected media"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDialogOpen(true)}
              >
                Change Image
              </Button>
            </div>
          </div>
        ) : (
          <div 
            className="aspect-video border-2 border-dashed border-muted-foreground/25 rounded-md flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => setDialogOpen(true)}
          >
            <div className="text-center">
              <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">{placeholder}</p>
            </div>
          </div>
        )}
      </div>
      
      <MediaSelectorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSelect={onSelect}
        acceptedTypes={acceptedTypes}
      />
    </>
  )
}