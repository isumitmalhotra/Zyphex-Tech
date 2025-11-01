/**
 * Content Fetcher Utility
 * 
 * Server-side utility for fetching PageContent data from the database.
 * Provides type-safe methods for retrieving pages and sections for rendering.
 */

import { prisma } from '@/lib/prisma'
import { PageContent, PageContentSection } from '@prisma/client'

// Type definitions for fetched content
export interface PageWithSections extends PageContent {
  sections: PageContentSection[]
}

export interface ContentSection extends PageContentSection {
  page?: {
    id: string
    pageKey: string
    name: string
  }
}

export interface FetchOptions {
  includeHidden?: boolean
  status?: 'draft' | 'published' | 'archived'
}

/**
 * Fetch a page by its pageKey with all sections
 * @param pageKey - The unique key for the page (e.g., 'home', 'about')
 * @param options - Optional filtering options
 * @returns Page with sections or null if not found
 */
export async function fetchPageContent(
  pageKey: string,
  options: FetchOptions = {}
): Promise<PageWithSections | null> {
  try {
    const { includeHidden = false, status = 'published' } = options

    const page = await prisma.pageContent.findUnique({
      where: {
        pageKey,
        status: status
      },
      include: {
        sections: {
          where: includeHidden ? {} : { isVisible: true },
          orderBy: { order: 'asc' }
        }
      }
    })

    return page
  } catch (error) {
    console.error(`Error fetching page content for "${pageKey}":`, error)
    return null
  }
}

/**
 * Fetch all pages with optional filtering
 * @param options - Optional filtering options
 * @returns Array of pages with sections
 */
export async function fetchAllPages(
  options: FetchOptions = {}
): Promise<PageWithSections[]> {
  try {
    const { includeHidden = false, status = 'published' } = options

    const pages = await prisma.pageContent.findMany({
      where: { status },
      include: {
        sections: {
          where: includeHidden ? {} : { isVisible: true },
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return pages
  } catch (error) {
    console.error('Error fetching all pages:', error)
    return []
  }
}

/**
 * Fetch a specific section by ID
 * @param sectionId - The unique ID of the section
 * @returns Section data or null if not found
 */
export async function fetchSection(
  sectionId: string
): Promise<ContentSection | null> {
  try {
    const section = await prisma.pageContentSection.findUnique({
      where: { id: sectionId },
      include: {
        page: {
          select: {
            id: true,
            pageKey: true,
            name: true
          }
        }
      }
    })

    return section
  } catch (error) {
    console.error(`Error fetching section "${sectionId}":`, error)
    return null
  }
}

/**
 * Fetch sections for a specific page by pageKey
 * @param pageKey - The unique key for the page
 * @param options - Optional filtering options
 * @returns Array of sections
 */
export async function fetchPageSections(
  pageKey: string,
  options: FetchOptions = {}
): Promise<PageContentSection[]> {
  try {
    const { includeHidden = false } = options

    const sections = await prisma.pageContentSection.findMany({
      where: {
        page: {
          pageKey,
          status: options.status || 'published'
        },
        ...(includeHidden ? {} : { isVisible: true })
      },
      orderBy: { order: 'asc' }
    })

    return sections
  } catch (error) {
    console.error(`Error fetching sections for page "${pageKey}":`, error)
    return []
  }
}

/**
 * Fetch a specific section by pageKey and sectionKey
 * @param pageKey - The unique key for the page
 * @param sectionKey - The unique key for the section (e.g., 'hero', 'about')
 * @returns Section data or null if not found
 */
export async function fetchSectionByKey(
  pageKey: string,
  sectionKey: string
): Promise<PageContentSection | null> {
  try {
    const section = await prisma.pageContentSection.findFirst({
      where: {
        page: {
          pageKey,
          status: 'published'
        },
        sectionKey,
        isVisible: true
      }
    })

    return section
  } catch (error) {
    console.error(
      `Error fetching section "${sectionKey}" from page "${pageKey}":`,
      error
    )
    return null
  }
}

/**
 * Get page metadata (without sections) by pageKey
 * @param pageKey - The unique key for the page
 * @returns Page metadata or null if not found
 */
export async function fetchPageMetadata(
  pageKey: string
): Promise<PageContent | null> {
  try {
    const page = await prisma.pageContent.findUnique({
      where: {
        pageKey,
        status: 'published'
      }
    })

    return page
  } catch (error) {
    console.error(`Error fetching page metadata for "${pageKey}":`, error)
    return null
  }
}

/**
 * Helper function to safely parse JSON content data
 * @param contentData - The JSON content data from a section
 * @returns Parsed object or empty object if parsing fails
 */
export function parseContentData<T = Record<string, unknown>>(
  contentData: unknown
): T {
  try {
    if (typeof contentData === 'string') {
      return JSON.parse(contentData) as T
    }
    return contentData as T
  } catch (error) {
    console.error('Error parsing content data:', error)
    return {} as T
  }
}

/**
 * Check if a page exists and is published
 * @param pageKey - The unique key for the page
 * @returns Boolean indicating if page exists
 */
export async function pageExists(pageKey: string): Promise<boolean> {
  try {
    const count = await prisma.pageContent.count({
      where: {
        pageKey,
        status: 'published'
      }
    })

    return count > 0
  } catch (error) {
    console.error(`Error checking if page "${pageKey}" exists:`, error)
    return false
  }
}

/**
 * Get the total count of published pages
 * @returns Number of published pages
 */
export async function getPublishedPageCount(): Promise<number> {
  try {
    return await prisma.pageContent.count({
      where: { status: 'published' }
    })
  } catch (error) {
    console.error('Error getting published page count:', error)
    return 0
  }
}

// Re-export types for convenience
export type { PageContent, PageContentSection }
