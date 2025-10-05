import { prisma } from '@/lib/prisma'
import { cache } from 'react'
import type { 
  DynamicContentSection, 
  DynamicContentItem, 
  ContentType,
  Prisma 
} from '@prisma/client'

// Extended types with relations
type SectionWithContentType = DynamicContentSection & {
  contentType: ContentType
  imageUrl?: string | null // Adding imageUrl field that might not be in generated types yet
}

type ItemWithContentType = DynamicContentItem & {
  contentType: ContentType
}

// Types for the content service
export interface ContentSection {
  id: string
  sectionKey: string
  title?: string
  subtitle?: string
  description?: string
  imageUrl?: string
  layoutSettings: Record<string, unknown>
  contentData?: Record<string, unknown> // Add contentData field
  isActive: boolean
  order: number
  createdAt: Date
  updatedAt: Date
  contentType: {
    id: string
    name: string
    label: string
    description?: string
    icon?: string
    fields: ContentField[]
    settings: Record<string, unknown>
  }
}

export interface ContentItem {
  id: string
  slug?: string
  title: string
  data: Record<string, unknown>
  status: 'draft' | 'published' | 'archived' | 'scheduled'
  featured: boolean
  publishedAt?: Date
  order: number
  categories: string[]
  tags: string[]
  author?: string
  metadata: {
    seoTitle?: string
    seoDescription?: string
    socialTitle?: string
    socialDescription?: string
    socialImage?: string
    customFields?: Record<string, unknown>
  }
  createdAt: Date
  updatedAt: Date
  contentType: {
    id: string
    name: string
    label: string
    description?: string
    icon?: string
    fields: ContentField[]
    settings: Record<string, unknown>
  }
}

export interface ContentField {
  id: string
  name: string
  label: string
  type: string
  required?: boolean
  placeholder?: string
  helpText?: string
  validation?: Record<string, unknown>
}

export interface PageContent {
  pageSlug: string
  sections: ContentSection[]
  items: ContentItem[]
  metadata: {
    totalSections: number
    activeSections: number
    totalItems: number
    publishedItems: number
    lastUpdated: Date
  }
}

// Helper function to parse JSON fields safely
function parseJsonField<T>(jsonString: string | null, fallback: T): T {
  if (!jsonString) return fallback
  try {
    return JSON.parse(jsonString) as T
  } catch {
    return fallback
  }
}

// Helper function to transform database section to our format
function transformSection(dbSection: SectionWithContentType): ContentSection {
  return {
    id: dbSection.id,
    sectionKey: dbSection.sectionKey,
    title: dbSection.title || undefined,
    subtitle: dbSection.subtitle || undefined,
    description: dbSection.description || undefined,
    imageUrl: dbSection.imageUrl || undefined,
    layoutSettings: parseJsonField(dbSection.layoutSettings, {}),
    contentData: parseJsonField((dbSection as any).contentData, {}), // Add contentData parsing
    isActive: dbSection.isActive,
    order: dbSection.order,
    createdAt: dbSection.createdAt,
    updatedAt: dbSection.updatedAt,
    contentType: {
      id: dbSection.contentType.id,
      name: dbSection.contentType.name,
      label: dbSection.contentType.label,
      description: dbSection.contentType.description || undefined,
      icon: dbSection.contentType.icon || undefined,
      fields: parseJsonField(dbSection.contentType.fields, []),
      settings: parseJsonField(dbSection.contentType.settings, {})
    }
  }
}

// Helper function to transform database item to our format
function transformItem(dbItem: ItemWithContentType): ContentItem {
  return {
    id: dbItem.id,
    slug: dbItem.slug || undefined,
    title: dbItem.title,
    data: parseJsonField(dbItem.data, {}),
    status: dbItem.status as ContentItem['status'],
    featured: dbItem.featured,
    publishedAt: dbItem.publishedAt || undefined,
    order: dbItem.order,
    categories: parseJsonField(dbItem.categories, []),
    tags: parseJsonField(dbItem.tags, []),
    author: dbItem.author || undefined,
    metadata: parseJsonField(dbItem.metadata, {}),
    createdAt: dbItem.createdAt,
    updatedAt: dbItem.updatedAt,
    contentType: {
      id: dbItem.contentType.id,
      name: dbItem.contentType.name,
      label: dbItem.contentType.label,
      description: dbItem.contentType.description || undefined,
      icon: dbItem.contentType.icon || undefined,
      fields: parseJsonField(dbItem.contentType.fields, []),
      settings: parseJsonField(dbItem.contentType.settings, {})
    }
  }
}

/**
 * Fetches all content (sections and items) for a specific page
 * Uses React cache() for automatic request deduplication and caching
 * 
 * @param pageSlug - The page identifier (e.g., 'home', 'about', 'services')
 * @param includeInactive - Whether to include inactive sections (default: false)
 * @param includeDrafts - Whether to include draft items (default: false)
 * @returns Promise<PageContent> - All content for the page
 */
export const getPageContent = cache(async (
  pageSlug: string,
  includeInactive: boolean = false,
  includeDrafts: boolean = false
): Promise<PageContent> => {
  try {
    // Build section filter - sections are identified by sectionKey pattern: {pageSlug}-{sectionType}
    const sectionFilter: Prisma.DynamicContentSectionWhereInput = {
      sectionKey: {
        startsWith: `${pageSlug}-`
      }
    }
    
    if (!includeInactive) {
      sectionFilter.isActive = true
    }

    // Build item filter - items can be associated with page via categories or tags
    const itemFilter: Prisma.DynamicContentItemWhereInput = {
      OR: [
        {
          categories: {
            contains: pageSlug
          }
        },
        {
          tags: {
            contains: pageSlug
          }
        }
      ]
    }

    if (!includeDrafts) {
      itemFilter.status = 'published'
    }

    // Fetch sections and items in parallel
    const [dbSections, dbItems] = await Promise.all([
      prisma.dynamicContentSection.findMany({
        where: sectionFilter,
        include: {
          contentType: true
        },
        orderBy: [
          { order: 'asc' },
          { createdAt: 'asc' }
        ]
      }),
      prisma.dynamicContentItem.findMany({
        where: itemFilter,
        include: {
          contentType: true
        },
        orderBy: [
          { featured: 'desc' },
          { order: 'asc' },
          { publishedAt: 'desc' },
          { createdAt: 'desc' }
        ]
      })
    ])

    // Transform the data
    const sections = dbSections.map(transformSection)
    const items = dbItems.map(transformItem)

    // Calculate metadata
    const metadata = {
      totalSections: sections.length,
      activeSections: sections.filter(s => s.isActive).length,
      totalItems: items.length,
      publishedItems: items.filter(i => i.status === 'published').length,
      lastUpdated: new Date(Math.max(
        ...sections.map(s => s.updatedAt.getTime()),
        ...items.map(i => i.updatedAt.getTime()),
        0
      ))
    }

    return {
      pageSlug,
      sections,
      items,
      metadata
    }
  } catch (error) {
    console.error(`Error fetching content for page "${pageSlug}":`, error)
    throw new Error(`Failed to fetch page content: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
})

/**
 * Fetches only sections for a specific page
 * Useful when you only need section data
 * 
 * @param pageSlug - The page identifier
 * @param includeInactive - Whether to include inactive sections
 * @returns Promise<ContentSection[]>
 */
export const getPageSections = cache(async (
  pageSlug: string,
  includeInactive: boolean = false
): Promise<ContentSection[]> => {
  try {
    const filter: Prisma.DynamicContentSectionWhereInput = {
      sectionKey: {
        startsWith: `${pageSlug}-`
      }
    }
    
    if (!includeInactive) {
      filter.isActive = true
    }

    const dbSections = await prisma.dynamicContentSection.findMany({
      where: filter,
      include: {
        contentType: true
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'asc' }
      ]
    })

    return dbSections.map(transformSection)
  } catch (error) {
    console.error(`Error fetching sections for page "${pageSlug}":`, error)
    throw new Error(`Failed to fetch page sections: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
})

/**
 * Fetches a specific section by its sectionKey
 * 
 * @param sectionKey - The unique section identifier (e.g., 'home-hero')
 * @param includeInactive - Whether to return inactive sections
 * @returns Promise<ContentSection | null>
 */
export const getSection = cache(async (
  sectionKey: string,
  includeInactive: boolean = false
): Promise<ContentSection | null> => {
  try {
    const filter: Prisma.DynamicContentSectionWhereInput = { sectionKey }
    
    if (!includeInactive) {
      filter.isActive = true
    }

    const dbSection = await prisma.dynamicContentSection.findFirst({
      where: filter,
      include: {
        contentType: true
      }
    })

    return dbSection ? transformSection(dbSection) : null
  } catch (error) {
    console.error(`Error fetching section "${sectionKey}":`, error)
    throw new Error(`Failed to fetch section: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
})

/**
 * Fetches content items by content type
 * 
 * @param contentTypeName - The content type name (e.g., 'blog', 'portfolio')
 * @param options - Query options
 * @returns Promise<ContentItem[]>
 */
export const getItemsByContentType = cache(async (
  contentTypeName: string,
  options: {
    includeDrafts?: boolean
    featured?: boolean
    limit?: number
    offset?: number
    categories?: string[]
    tags?: string[]
  } = {}
): Promise<ContentItem[]> => {
  try {
    const {
      includeDrafts = false,
      featured,
      limit,
      offset = 0,
      categories = [],
      tags = []
    } = options

    // Build filter
    const filter: Prisma.DynamicContentItemWhereInput = {
      contentType: {
        name: contentTypeName
      }
    }

    if (!includeDrafts) {
      filter.status = 'published'
    }

    if (featured !== undefined) {
      filter.featured = featured
    }

    if (categories.length > 0 || tags.length > 0) {
      const orConditions: Prisma.DynamicContentItemWhereInput[] = []
      
      categories.forEach(category => {
        orConditions.push({
          categories: {
            contains: category
          }
        })
      })
      
      tags.forEach(tag => {
        orConditions.push({
          tags: {
            contains: tag
          }
        })
      })
      
      if (orConditions.length > 0) {
        filter.OR = orConditions
      }
    }

    const dbItems = await prisma.dynamicContentItem.findMany({
      where: filter,
      include: {
        contentType: true
      },
      orderBy: [
        { featured: 'desc' },
        { order: 'asc' },
        { publishedAt: 'desc' },
        { createdAt: 'desc' }
      ],
      skip: offset,
      take: limit
    })

    return dbItems.map(transformItem)
  } catch (error) {
    console.error(`Error fetching items for content type "${contentTypeName}":`, error)
    throw new Error(`Failed to fetch content items: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
})

/**
 * Fetches a single content item by slug and content type
 * 
 * @param contentTypeName - The content type name
 * @param slug - The item slug
 * @param includeDrafts - Whether to include draft items
 * @returns Promise<ContentItem | null>
 */
export const getItemBySlug = cache(async (
  contentTypeName: string,
  slug: string,
  includeDrafts: boolean = false
): Promise<ContentItem | null> => {
  try {
    const filter: Prisma.DynamicContentItemWhereInput = {
      slug,
      contentType: {
        name: contentTypeName
      }
    }

    if (!includeDrafts) {
      filter.status = 'published'
    }

    const dbItem = await prisma.dynamicContentItem.findFirst({
      where: filter,
      include: {
        contentType: true
      }
    })

    return dbItem ? transformItem(dbItem) : null
  } catch (error) {
    console.error(`Error fetching item "${slug}" for content type "${contentTypeName}":`, error)
    throw new Error(`Failed to fetch content item: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
})

/**
 * Gets all available content types
 * 
 * @param activeOnly - Whether to return only active content types
 * @returns Promise<ContentType[]>
 */
export const getContentTypes = cache(async (activeOnly: boolean = true) => {
  try {
    const filter = activeOnly ? { isActive: true } : {}

    const contentTypes = await prisma.contentType.findMany({
      where: filter,
      orderBy: {
        name: 'asc'
      }
    })

    return contentTypes.map(ct => ({
      id: ct.id,
      name: ct.name,
      label: ct.label,
      description: ct.description,
      icon: ct.icon,
      fields: parseJsonField(ct.fields, []),
      settings: parseJsonField(ct.settings, {}),
      isSystem: ct.isSystem,
      isActive: ct.isActive,
      createdAt: ct.createdAt,
      updatedAt: ct.updatedAt
    }))
  } catch (error) {
    console.error('Error fetching content types:', error)
    throw new Error(`Failed to fetch content types: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
})

// Export default function for easy import
const contentService = {
  getPageContent,
  getPageSections,
  getSection,
  getItemsByContentType,
  getItemBySlug,
  getContentTypes
}

export default contentService