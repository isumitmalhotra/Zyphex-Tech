import { revalidateTag, revalidatePath } from 'next/cache'

// Revalidation tags for different content types
export const REVALIDATION_TAGS = {
  CONTENT_TYPES: 'content-types',
  DYNAMIC_CONTENT: 'dynamic-content',
  CONTENT_BY_TYPE: (typeId: string) => `content-type-${typeId}`,
  CONTENT_ITEM: (itemId: string) => `content-item-${itemId}`,
  ALL_CONTENT: 'all-content',
  ADMIN_CONTENT: 'admin-content',
  PUBLIC_CONTENT: 'public-content'
} as const

// Revalidation functions
export async function revalidateContentTypes(): Promise<void> {
  try {
    revalidateTag(REVALIDATION_TAGS.CONTENT_TYPES)
    revalidateTag(REVALIDATION_TAGS.ADMIN_CONTENT)
  } catch (error) {
    // Error revalidating content types
  }
}

export async function revalidateDynamicContent(
  contentTypeId?: string,
  itemId?: string
): Promise<void> {
  try {
    revalidateTag(REVALIDATION_TAGS.DYNAMIC_CONTENT)
    revalidateTag(REVALIDATION_TAGS.ALL_CONTENT)
    revalidateTag(REVALIDATION_TAGS.PUBLIC_CONTENT)
    
    if (contentTypeId) {
      revalidateTag(REVALIDATION_TAGS.CONTENT_BY_TYPE(contentTypeId))
    }
    
    if (itemId) {
      revalidateTag(REVALIDATION_TAGS.CONTENT_ITEM(itemId))
    }
    
  } catch (error) {
    // Error revalidating dynamic content
  }
}

export async function revalidateAllContent(): Promise<void> {
  try {
    revalidateTag(REVALIDATION_TAGS.ALL_CONTENT)
    revalidateTag(REVALIDATION_TAGS.CONTENT_TYPES)
    revalidateTag(REVALIDATION_TAGS.DYNAMIC_CONTENT)
    revalidateTag(REVALIDATION_TAGS.ADMIN_CONTENT)
    revalidateTag(REVALIDATION_TAGS.PUBLIC_CONTENT)
  } catch (error) {
    // Error revalidating all content
  }
}

// Path-based revalidation
export async function revalidateContentPages(): Promise<void> {
  try {
    // Revalidate common content pages
    revalidatePath('/')
    revalidatePath('/portfolio')
    revalidatePath('/services')
    revalidatePath('/blog')
    revalidatePath('/admin/content')
    
  } catch (error) {
    // Error revalidating content pages
  }
}

export async function revalidateContentPage(slug: string): Promise<void> {
  try {
    revalidatePath(`/${slug}`)
    revalidatePath(`/blog/${slug}`)
    revalidatePath(`/portfolio/${slug}`)
  } catch (error) {
    // Error revalidating content page
  }
}

// Helper to revalidate on content mutations
export async function revalidateOnContentChange(
  type: 'content-type' | 'dynamic-content',
  payload: {
    contentTypeId?: string
    itemId?: string
    slug?: string
  }
): Promise<void> {
  switch (type) {
    case 'content-type':
      await revalidateContentTypes()
      await revalidateContentPages()
      break
      
    case 'dynamic-content':
      await revalidateDynamicContent(payload.contentTypeId, payload.itemId)
      if (payload.slug) {
        await revalidateContentPage(payload.slug)
      }
      break
  }
}

// Fetch with revalidation tags for Next.js app router
export async function fetchWithTags<T>(
  url: string, 
  tags: string[], 
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    next: {
      tags,
      revalidate: 3600 // 1 hour default revalidation
    }
  })

  if (!response.ok) {
    throw new Error(`Fetch failed: ${response.statusText}`)
  }

  return response.json()
}

// Cached fetch functions for content
export async function fetchContentTypes(includeInactive = false) {
  const url = `/api/admin/content/content-types${includeInactive ? '?includeInactive=true' : ''}`
  return fetchWithTags(url, [
    REVALIDATION_TAGS.CONTENT_TYPES,
    REVALIDATION_TAGS.ADMIN_CONTENT
  ])
}

export async function fetchDynamicContent(contentTypeId: string) {
  const url = `/api/admin/content/dynamic-items?contentTypeId=${contentTypeId}`
  return fetchWithTags(url, [
    REVALIDATION_TAGS.DYNAMIC_CONTENT,
    REVALIDATION_TAGS.CONTENT_BY_TYPE(contentTypeId),
    REVALIDATION_TAGS.PUBLIC_CONTENT
  ])
}

export async function fetchDynamicContentItem(itemId: string) {
  const url = `/api/admin/content/dynamic-items/${itemId}`
  return fetchWithTags(url, [
    REVALIDATION_TAGS.CONTENT_ITEM(itemId),
    REVALIDATION_TAGS.DYNAMIC_CONTENT
  ])
}