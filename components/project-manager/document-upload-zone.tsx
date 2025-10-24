"use client"

import React, { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { 
  Upload, 
  X, 
  Loader2, 
  FileText,
  AlertCircle,
  CheckCircle
} from "lucide-react"

interface DocumentUploadZoneProps {
  projectId?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onUploadSuccess?: (document: any) => void
  onUploadError?: (error: string) => void
  className?: string
  maxSize?: number // in MB
  accept?: string
}

interface UploadingFile {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

const DOCUMENT_CATEGORIES = [
  { value: 'contract', label: 'Contract' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'deliverable', label: 'Deliverable' },
  { value: 'specification', label: 'Specification' },
  { value: 'report', label: 'Report' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'general', label: 'General' },
  { value: 'other', label: 'Other' }
]

export function DocumentUploadZone({
  projectId,
  onUploadSuccess,
  onUploadError,
  className = "",
  maxSize = 50, // 50MB default
  accept = "*/*"
}: DocumentUploadZoneProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [category, setCategory] = useState("general")
  const [description, setDescription] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    // Check file size
    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > maxSize) {
      return { valid: false, error: `File size must be less than ${maxSize}MB` }
    }

    // Check if file name is valid
    if (!file.name || file.name.length > 255) {
      return { valid: false, error: "Invalid file name" }
    }

    return { valid: true }
  }, [maxSize])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const uploadFile = useCallback(async (file: File): Promise<any> => {
    const validation = validateFile(file)
    if (!validation.valid) {
      throw new Error(validation.error)
    }

    const formData = new FormData()
    formData.append('file', file)
    if (projectId) formData.append('projectId', projectId)
    if (category) formData.append('category', category)
    if (description) formData.append('description', description)

    const response = await fetch('/api/project-manager/documents', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Upload failed')
    }

    const result = await response.json()
    return result.data
  }, [projectId, category, description, validateFile])

  const handleFileSelect = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    
    // Add files to uploading state
    const newUploadingFiles: UploadingFile[] = fileArray.map(file => ({
      file,
      progress: 0,
      status: 'pending'
    }))
    
    setUploadingFiles(prev => [...prev, ...newUploadingFiles])

    // Upload each file
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i]
      const fileIndex = uploadingFiles.length + i

      try {
        // Update status to uploading
        setUploadingFiles(prev => 
          prev.map((f, idx) => 
            idx === fileIndex ? { ...f, status: 'uploading', progress: 50 } : f
          )
        )

        // Upload file
        const document = await uploadFile(file)

        // Update status to success
        setUploadingFiles(prev => 
          prev.map((f, idx) => 
            idx === fileIndex ? { ...f, status: 'success', progress: 100 } : f
          )
        )

        toast({
          title: "Upload Successful",
          description: `${file.name} uploaded successfully`
        })

        if (onUploadSuccess) {
          onUploadSuccess(document)
        }

        // Remove from list after 2 seconds
        setTimeout(() => {
          setUploadingFiles(prev => prev.filter((_, idx) => idx !== fileIndex))
        }, 2000)

      } catch (error) {
        // Update status to error
        setUploadingFiles(prev => 
          prev.map((f, idx) => 
            idx === fileIndex 
              ? { 
                  ...f, 
                  status: 'error', 
                  error: error instanceof Error ? error.message : 'Upload failed' 
                } 
              : f
          )
        )

        toast({
          title: "Upload Failed",
          description: error instanceof Error ? error.message : "Failed to upload file",
          variant: "destructive"
        })

        if (onUploadError) {
          onUploadError(error instanceof Error ? error.message : 'Upload failed')
        }
      }
    }

    // Clear description after upload
    setDescription("")
  }, [uploadFile, uploadingFiles.length, onUploadSuccess, onUploadError])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFileSelect(files)
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

  const removeUploadingFile = (index: number) => {
    setUploadingFiles(prev => prev.filter((_, idx) => idx !== index))
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Document Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger id="category">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {DOCUMENT_CATEGORIES.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            placeholder="Add a description for uploaded documents"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="resize-none"
            rows={1}
          />
        </div>
      </div>

      {/* Upload Zone */}
      <Card 
        className={`border-2 border-dashed transition-all cursor-pointer ${
          dragOver 
            ? 'border-primary bg-primary/5 scale-[1.02]' 
            : 'border-muted-foreground/25 hover:border-primary/50'
        }`}
        onClick={triggerFileInput}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <CardContent className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="p-4 bg-primary/10 rounded-full mb-4">
              <Upload className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Upload Documents</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md">
              Drag & drop files here, or click to browse
            </p>
            <div className="flex flex-col gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>Supports: PDF, DOCX, XLSX, images, and more</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>Max size: {maxSize}MB per file</span>
              </div>
            </div>
            <Button type="button" className="mt-6" onClick={triggerFileInput}>
              <Upload className="mr-2 h-4 w-4" />
              Select Files
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Hidden file input */}
      <Input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Uploading Files List */}
      {uploadingFiles.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold mb-3">Uploading Files</h4>
            <div className="space-y-2">
              {uploadingFiles.map((uploadingFile, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {uploadingFile.status === 'uploading' && (
                      <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                    )}
                    {uploadingFile.status === 'success' && (
                      <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                    )}
                    {uploadingFile.status === 'error' && (
                      <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {uploadingFile.file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(uploadingFile.file.size / 1024 / 1024).toFixed(2)} MB
                        {uploadingFile.status === 'error' && uploadingFile.error && (
                          <span className="text-destructive ml-2">- {uploadingFile.error}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  {uploadingFile.status !== 'success' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeUploadingFile(index)
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
