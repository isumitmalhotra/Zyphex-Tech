// Advanced CMS Components and Hooks
'use client'

import { useState, useEffect, useCallback } from 'react'
import { APIResponse, PaginatedResponse, ContentItem, ContentType, BulkOperationResult } from '@/types/cms'

interface MediaAsset {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  alt?: string
  caption?: string
  category?: string
  tags?: string[]
  createdAt: Date
  updatedAt: Date
}

interface ContentFieldValidation {
  min?: number
  max?: number
  pattern?: string
  options?: Array<{ label: string; value: string }>
}

interface ContentFieldForValidation {
  name: string
  label: string
  type: string
  required?: boolean
  validation?: ContentFieldValidation
}

// Custom hook for CMS API operations
export function useCMSApi() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const apiCall = useCallback(async <T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/cms${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      })

      const data: APIResponse<T> = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }

      if (!data.success) {
        throw new Error(data.error || 'API call failed')
      }

      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Content operations
  const getContent = useCallback(async (params: {
    page?: number
    pageSize?: number
    query?: string
    contentType?: string
    status?: string[]
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  } = {}) => {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          searchParams.set(key, value.join(','))
        } else {
          searchParams.set(key, value.toString())
        }
      }
    })

    return apiCall<PaginatedResponse<ContentItem>>(`/content?${searchParams}`)
  }, [apiCall])

  const createContent = useCallback(async (data: {
    contentTypeId: string
    title: string
    data: Record<string, unknown>
    slug?: string
    status?: string
    metadata?: Record<string, unknown>
  }) => {
    return apiCall<ContentItem>('/content', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }, [apiCall])

  const updateContent = useCallback(async (id: string, data: Partial<ContentItem>) => {
    return apiCall<ContentItem>(`/content?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }, [apiCall])

  const deleteContent = useCallback(async (id: string) => {
    return apiCall<null>(`/content?id=${id}`, {
      method: 'DELETE',
    })
  }, [apiCall])

  const bulkOperation = useCallback(async (operation: {
    action: string
    itemIds: string[]
    data?: Record<string, unknown>
  }) => {
    return apiCall<BulkOperationResult>('/content/bulk', {
      method: 'POST',
      body: JSON.stringify(operation),
    })
  }, [apiCall])

  // Content Types operations
  const getContentTypes = useCallback(async (params: {
    page?: number
    pageSize?: number
    search?: string
    category?: string
  } = {}) => {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.set(key, value.toString())
      }
    })

    return apiCall<PaginatedResponse<ContentType>>(`/content-types?${searchParams}`)
  }, [apiCall])

  const createContentType = useCallback(async (data: Omit<ContentType, 'id' | 'createdAt' | 'updatedAt' | 'isSystem'>) => {
    return apiCall<ContentType>('/content-types', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }, [apiCall])

  const updateContentType = useCallback(async (id: string, data: Partial<ContentType>) => {
    return apiCall<ContentType>(`/content-types?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }, [apiCall])

  const deleteContentType = useCallback(async (id: string) => {
    return apiCall<null>(`/content-types?id=${id}`, {
      method: 'DELETE',
    })
  }, [apiCall])

  // Media operations
  const getMedia = useCallback(async (params: {
    page?: number
    pageSize?: number
    search?: string
    category?: string
    mimeType?: string
  } = {}) => {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.set(key, value.toString())
      }
    })

    return apiCall<PaginatedResponse<MediaAsset>>(`/media?${searchParams}`)
  }, [apiCall])

  const uploadMedia = useCallback(async (file: File, metadata?: {
    alt?: string
    caption?: string
    category?: string
    tags?: string[]
  }) => {
    const formData = new FormData()
    formData.append('file', file)
    
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata))
    }

    return apiCall<MediaAsset>('/media', {
      method: 'POST',
      body: formData,
      headers: {} // Remove Content-Type to let browser set it for FormData
    })
  }, [apiCall])

  const updateMedia = useCallback(async (id: string, metadata: {
    alt?: string
    caption?: string
    category?: string
    tags?: string[]
  }) => {
    return apiCall<MediaAsset>(`/media?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(metadata),
    })
  }, [apiCall])

  const deleteMedia = useCallback(async (id: string) => {
    return apiCall<null>(`/media?id=${id}`, {
      method: 'DELETE',
    })
  }, [apiCall])

  return {
    loading,
    error,
    // Content operations
    getContent,
    createContent,
    updateContent,
    deleteContent,
    bulkOperation,
    // Content Types operations
    getContentTypes,
    createContentType,
    updateContentType,
    deleteContentType,
    // Media operations
    getMedia,
    uploadMedia,
    updateMedia,
    deleteMedia,
  }
}

// Custom hook for content management state
export function useContentState(contentTypeId?: string) {
  const [items, setItems] = useState<ContentItem[]>([])
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [filters, setFilters] = useState<Record<string, unknown>>({})
  const [selectedItems, setSelectedItems] = useState<string[]>([])


  const api = useCMSApi()

  const fetchItems = useCallback(async () => {
    if (!contentTypeId) return

    try {
      const searchParams = new URLSearchParams()
      searchParams.set('page', currentPage.toString())
      searchParams.set('pageSize', pageSize.toString())
      searchParams.set('contentType', contentTypeId)
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            searchParams.set(key, value.join(','))
          } else {
            searchParams.set(key, value.toString())
          }
        }
      })

      const response = await fetch(`/api/admin/cms/content?${searchParams}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data: APIResponse<PaginatedResponse<ContentItem>> = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }

      if (!data.success) {
        throw new Error(data.error || 'API call failed')
      }

      if (data.data) {
        setItems(data.data.data)
        setTotal(data.data.total)
      }
    } catch (error) {
      console.error('Failed to fetch content items:', error)
    }
  }, [contentTypeId, currentPage, pageSize, filters])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const refresh = useCallback(() => {
    fetchItems()
  }, [fetchItems])

  const updateFilters = useCallback((newFilters: Record<string, unknown>) => {
    setFilters(newFilters)
    setCurrentPage(1) // Reset to first page when filters change
  }, [])

  const selectItem = useCallback((id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    )
  }, [])

  const selectAll = useCallback(() => {
    setSelectedItems(items.map(item => item.id))
  }, [items])

  const clearSelection = useCallback(() => {
    setSelectedItems([])
  }, [])

  const performBulkAction = useCallback(async (action: string, data?: Record<string, unknown>) => {
    if (selectedItems.length === 0) return

    try {
      await api.bulkOperation({
        action,
        itemIds: selectedItems,
        data,
      })

      clearSelection()
      refresh()
    } catch (error) {
      throw error
    }
  }, [api, selectedItems, clearSelection, refresh])

  return {
    // State
    items,
    total,
    currentPage,
    pageSize,
    filters,
    selectedItems,
    loading: api.loading,
    error: api.error,
    
    // Actions
    setCurrentPage,
    setPageSize,
    updateFilters,
    refresh,
    selectItem,
    selectAll,
    clearSelection,
    performBulkAction,
    
    // Computed
    totalPages: Math.ceil(total / pageSize),
    hasSelection: selectedItems.length > 0,
    allSelected: selectedItems.length === items.length && items.length > 0,
  }
}

// Custom hook for content types management
export function useContentTypes() {
  const [contentTypes, setContentTypes] = useState<ContentType[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchContentTypes = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/cms/content-types?pageSize=100', {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data: APIResponse<PaginatedResponse<ContentType>> = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }

      if (!data.success) {
        throw new Error(data.error || 'API call failed')
      }

      if (data.data) {
        setContentTypes(data.data.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch content types')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchContentTypes()
  }, [fetchContentTypes])

  const refresh = useCallback(() => {
    fetchContentTypes()
  }, [fetchContentTypes])

  return {
    contentTypes,
    loading,
    error,
    refresh,
  }
}

// Validation helpers
export function validateContentData(data: Record<string, unknown>, fields: ContentFieldForValidation[]): { 
  isValid: boolean
  errors: Array<{ field: string; message: string }>
} {
  const errors: Array<{ field: string; message: string }> = []

  fields.forEach(field => {
    const value = data[field.name]
    
    // Required field validation
    if (field.required && (value === undefined || value === null || value === '')) {
      errors.push({
        field: field.name,
        message: `${field.label} is required`
      })
      return
    }

    // Skip further validation if field is empty and not required
    if (!value && !field.required) return

    // Type-specific validation
    switch (field.type) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (typeof value === 'string' && !emailRegex.test(value)) {
          errors.push({
            field: field.name,
            message: `${field.label} must be a valid email address`
          })
        }
        break

      case 'url':
        try {
          new URL(value as string)
        } catch {
          errors.push({
            field: field.name,
            message: `${field.label} must be a valid URL`
          })
        }
        break

      case 'number':
        if (isNaN(Number(value))) {
          errors.push({
            field: field.name,
            message: `${field.label} must be a valid number`
          })
        }
        break
    }

    // Validation rules
    if (field.validation) {
      if (field.validation.min && typeof value === 'string' && value.length < field.validation.min) {
        errors.push({
          field: field.name,
          message: `${field.label} must be at least ${field.validation.min} characters`
        })
      }

      if (field.validation.max && typeof value === 'string' && value.length > field.validation.max) {
        errors.push({
          field: field.name,
          message: `${field.label} must be no more than ${field.validation.max} characters`
        })
      }

      if (field.validation.pattern && typeof value === 'string') {
        const regex = new RegExp(field.validation.pattern)
        if (!regex.test(value)) {
          errors.push({
            field: field.name,
            message: `${field.label} format is invalid`
          })
        }
      }
    }
  })

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Utility functions
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '🖼️'
  if (mimeType.startsWith('video/')) return '🎥'
  if (mimeType.startsWith('audio/')) return '🎵'
  if (mimeType === 'application/pdf') return '📄'
  if (mimeType.includes('word')) return '📝'
  if (mimeType.includes('sheet')) return '📊'
  return '📎'
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}