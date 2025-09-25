'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/hooks/use-toast'

// Query keys for content
export const CONTENT_QUERY_KEYS = {
  contentTypes: ['content-types'] as const,
  contentType: (id: string) => ['content-types', id] as const,
  dynamicContent: (typeId: string) => ['dynamic-content', typeId] as const,
  dynamicContentItem: (id: string) => ['dynamic-content-item', id] as const,
  allDynamicContent: ['dynamic-content'] as const,
} as const

// API client functions
async function fetchContentTypes(includeInactive = false) {
  const response = await fetch(`/api/admin/content/content-types${includeInactive ? '?includeInactive=true' : ''}`)
  if (!response.ok) {
    throw new Error('Failed to fetch content types')
  }
  return response.json()
}

async function fetchDynamicContent(contentTypeId: string, params?: {
  status?: string
  featured?: boolean
  page?: number
  limit?: number
}) {
  const searchParams = new URLSearchParams()
  searchParams.set('contentTypeId', contentTypeId)
  
  if (params?.status) searchParams.set('status', params.status)
  if (params?.featured !== undefined) searchParams.set('featured', params.featured.toString())
  if (params?.page) searchParams.set('page', params.page.toString())
  if (params?.limit) searchParams.set('limit', params.limit.toString())

  const response = await fetch(`/api/admin/content/dynamic-items?${searchParams}`)
  if (!response.ok) {
    throw new Error('Failed to fetch dynamic content')
  }
  return response.json()
}

async function fetchDynamicContentItem(id: string) {
  const response = await fetch(`/api/admin/content/dynamic-items/${id}`)
  if (!response.ok) {
    throw new Error('Failed to fetch dynamic content item')
  }
  return response.json()
}

async function createContentType(data: unknown) {
  const response = await fetch('/api/admin/content/content-types', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create content type')
  }
  return response.json()
}

async function createDynamicContentItem(data: unknown) {
  const response = await fetch('/api/admin/content/dynamic-items', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create content item')
  }
  return response.json()
}

async function updateDynamicContentItem(id: string, data: unknown) {
  const response = await fetch(`/api/admin/content/dynamic-items/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update content item')
  }
  return response.json()
}

async function deleteDynamicContentItem(id: string) {
  const response = await fetch(`/api/admin/content/dynamic-items/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete content item')
  }
  return response.json()
}

// Hooks for content types
export function useContentTypes(includeInactive = false) {
  return useQuery({
    queryKey: [...CONTENT_QUERY_KEYS.contentTypes, { includeInactive }],
    queryFn: () => fetchContentTypes(includeInactive),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useCreateContentType() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createContentType,
    onSuccess: () => {
      // Invalidate content types queries
      queryClient.invalidateQueries({ queryKey: CONTENT_QUERY_KEYS.contentTypes })
      toast({
        title: 'Success',
        description: 'Content type created successfully',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

// Hooks for dynamic content
export function useDynamicContent(
  contentTypeId: string,
  params?: {
    status?: string
    featured?: boolean
    page?: number
    limit?: number
  }
) {
  return useQuery({
    queryKey: [...CONTENT_QUERY_KEYS.dynamicContent(contentTypeId), params],
    queryFn: () => fetchDynamicContent(contentTypeId, params),
    enabled: !!contentTypeId,
    staleTime: 2 * 60 * 1000, // 2 minutes (shorter for dynamic content)
  })
}

export function useDynamicContentItem(id: string) {
  return useQuery({
    queryKey: CONTENT_QUERY_KEYS.dynamicContentItem(id),
    queryFn: () => fetchDynamicContentItem(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useCreateDynamicContentItem() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createDynamicContentItem,
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: CONTENT_QUERY_KEYS.allDynamicContent })
      if (data.contentTypeId) {
        queryClient.invalidateQueries({ 
          queryKey: CONTENT_QUERY_KEYS.dynamicContent(data.contentTypeId) 
        })
      }
      toast({
        title: 'Success',
        description: 'Content item created successfully',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

export function useUpdateDynamicContentItem() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => 
      updateDynamicContentItem(id, data),
    onSuccess: (data, variables) => {
      // Update the specific item in cache
      queryClient.setQueryData(
        CONTENT_QUERY_KEYS.dynamicContentItem(variables.id),
        data
      )
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: CONTENT_QUERY_KEYS.allDynamicContent })
      if (data.contentTypeId) {
        queryClient.invalidateQueries({ 
          queryKey: CONTENT_QUERY_KEYS.dynamicContent(data.contentTypeId) 
        })
      }
      toast({
        title: 'Success',
        description: 'Content item updated successfully',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

export function useDeleteDynamicContentItem() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: deleteDynamicContentItem,
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: CONTENT_QUERY_KEYS.dynamicContentItem(id) })
      
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: CONTENT_QUERY_KEYS.allDynamicContent })
      
      toast({
        title: 'Success',
        description: 'Content item deleted successfully',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

// Optimistic update hooks
export function useOptimisticUpdate() {
  const queryClient = useQueryClient()
  
  const optimisticUpdateItem = async (id: string, updateData: unknown) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ 
      queryKey: CONTENT_QUERY_KEYS.dynamicContentItem(id) 
    })
    
    // Snapshot the previous value
    const previousData = queryClient.getQueryData(
      CONTENT_QUERY_KEYS.dynamicContentItem(id)
    )
    
    // Optimistically update
    queryClient.setQueryData(
      CONTENT_QUERY_KEYS.dynamicContentItem(id),
      (old: unknown) => {
        if (old && typeof old === 'object' && updateData && typeof updateData === 'object') {
          return { ...old, ...updateData }
        }
        return old
      }
    )
    
    // Return a context with previous and new data
    return { previousData }
  }
  
  const revertOptimisticUpdate = (id: string, context: { previousData: unknown }) => {
    queryClient.setQueryData(
      CONTENT_QUERY_KEYS.dynamicContentItem(id),
      context.previousData
    )
  }
  
  return { optimisticUpdateItem, revertOptimisticUpdate }
}

// Prefetch functions for better UX
export function usePrefetchContentItem() {
  const queryClient = useQueryClient()
  
  const prefetchContentItem = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: CONTENT_QUERY_KEYS.dynamicContentItem(id),
      queryFn: () => fetchDynamicContentItem(id),
      staleTime: 2 * 60 * 1000, // 2 minutes
    })
  }
  
  return { prefetchContentItem }
}