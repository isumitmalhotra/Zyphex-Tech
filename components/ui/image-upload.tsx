"use client"

import React, { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import { 
  Upload, 
  X, 
  Loader2, 
  Image as ImageIcon,
  AlertCircle
} from "lucide-react"
import Image from "next/image"

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  onRemove: () => void
  disabled?: boolean
  accept?: string
  maxSize?: number // in MB
  className?: string
}

interface UploadedMedia {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  alt: string
  category: string
  uploadedBy: string
  createdAt: string
  updatedAt: string
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  disabled = false,
  accept = "image/*",
  maxSize = 10, // 10MB default
  className = ""
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file",
        variant: "destructive"
      })
      return
    }

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > maxSize) {
      toast({
        title: "File Too Large",
        description: `File size must be less than ${maxSize}MB`,
        variant: "destructive"
      })
      return
    }

    try {
      setIsUploading(true)

      // Create FormData for upload
      const formData = new FormData()
      formData.append('file', file)
      
      // Add metadata
      const metadata = {
        alt: file.name.split('.')[0], // Use filename without extension as alt
        category: 'content',
        tags: ['content-section']
      }
      formData.append('metadata', JSON.stringify(metadata))

      // Upload to media API
      const response = await fetch('/api/admin/cms/media', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const result = await response.json()
      
      if (result.success && result.data) {
        const uploadedMedia: UploadedMedia = result.data
        onChange(uploadedMedia.url)
        toast({
          title: "Success",
          description: "Image uploaded successfully"
        })
      } else {
        throw new Error(result.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    onRemove()
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Label>Section Image</Label>
      
      {value ? (
        // Display uploaded image
        <Card className="relative group">
          <CardContent className="p-4">
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
              <Image
                src={value}
                alt="Section image"
                fill
                className="object-cover"
                onError={() => {
                  toast({
                    title: "Image Load Error",
                    description: "Failed to load image",
                    variant: "destructive"
                  })
                }}
              />
              
              {/* Remove button overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleRemove}
                  disabled={disabled || isUploading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Remove Image
                </Button>
              </div>
            </div>
            
            <div className="mt-2 text-sm text-muted-foreground">
              Click to change image or drag & drop a new one
            </div>
          </CardContent>
        </Card>
      ) : (
        // Upload area
        <Card 
          className={`border-2 border-dashed transition-colors cursor-pointer ${
            dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={!disabled && !isUploading ? triggerFileInput : undefined}
          onDrop={!disabled ? handleDrop : undefined}
          onDragOver={!disabled ? handleDragOver : undefined}
          onDragLeave={!disabled ? handleDragLeave : undefined}
        >
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center text-center">
              {isUploading ? (
                <>
                  <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                  <p className="text-sm text-muted-foreground">Uploading image...</p>
                </>
              ) : (
                <>
                  <div className="p-4 bg-primary/10 rounded-full mb-4">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Upload Section Image</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Drag & drop an image here, or click to select
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ImageIcon className="h-4 w-4" />
                    <span>Supports: JPG, PNG, GIF, WebP</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <AlertCircle className="h-4 w-4" />
                    <span>Max size: {maxSize}MB</span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hidden file input */}
      <Input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        disabled={disabled || isUploading}
        className="hidden"
      />
      
      {/* Direct URL input as fallback */}
      <div className="pt-4 border-t">
        <Label className="text-xs text-muted-foreground">Or enter image URL directly</Label>
        <Input
          type="url"
          placeholder="https://example.com/image.jpg"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || isUploading}
          className="mt-1"
        />
      </div>
    </div>
  )
}