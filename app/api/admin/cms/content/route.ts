// Product} from '@/types/cms'

interface ActivityLogModel {
  create: (data: { data: Record<string, unknown> }) => Promise<Record<string, unknown>>
}

// Validation schemas-ready CMS API Routes
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'
import { 
  PaginatedResponse, 
  APIResponse,
  ActivityLog
} from '@/types/cms'

// Validation Schemas
const contentItemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  data: z.record(z.unknown()),
  status: z.enum(['draft', 'published', 'archived', 'scheduled']).optional(),
  featured: z.boolean().optional(),
  publishedAt: z.string().datetime().optional(),
  scheduledAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.object({
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    socialTitle: z.string().optional(),
    socialDescription: z.string().optional(),
    socialImage: z.string().url().optional(),
    customFields: z.record(z.unknown()).optional()
  }).optional(),
  order: z.number().int().min(0).optional()
})

const searchFiltersSchema = z.object({
  query: z.string().optional(),
  contentType: z.string().optional(),
  status: z.array(z.enum(['draft', 'published', 'archived', 'scheduled'])).optional(),
  author: z.string().optional(),
  category: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'publishedAt', 'title', 'order']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
})

// Utility Functions
async function checkPermissions() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return { authorized: false, user: null }
  }

  // Check if user has required role
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, role: true }
  })

  if (!user || user.role !== 'ADMIN') {
    return { authorized: false, user: null }
  }

  return { authorized: true, user }
}

async function logActivity(
  action: ActivityLog['action'],
  entityType: ActivityLog['entityType'],
  entityId: string,
  entityTitle: string,
  userId: string,
  changes?: ActivityLog['changes'],
  req?: NextRequest
) {
  try {
    // Activity logging - only if the table exists
    const activityLog = (prisma as unknown as { activityLog?: ActivityLogModel }).activityLog;
    if (activityLog) {
      await activityLog.create({
        data: {
          action,
          entityType,
          entityId,
          entityTitle,
          userId,
          changes: changes ? JSON.stringify(changes) : undefined,
          ipAddress: req?.headers.get('x-forwarded-for') || req?.headers.get('x-real-ip'),
          userAgent: req?.headers.get('user-agent'),
          metadata: JSON.stringify({
            timestamp: new Date().toISOString()
          })
        }
      }).catch(() => {
        // Ignore errors for activity logging
        console.warn('Failed to log activity');
      });
    }
  } catch {
    // Silently fail activity logging
  }
}

function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / pageSize)
  
  return {
    data,
    total,
    page,
    pageSize,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  }
}

function createAPIResponse<T>(
  success: boolean,
  data?: T,
  error?: string,
  message?: string
): APIResponse<T> {
  return {
    success,
    data,
    error,
    message,
    timestamp: new Date().toISOString()
  }
}

// GET /api/admin/cms/content - List content items with advanced filtering
export async function GET(request: NextRequest) {
  try {
    const { authorized } = await checkPermissions()
    if (!authorized) {
      return NextResponse.json(
        createAPIResponse(false, null, 'Unauthorized'),
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '20'), 100)
    const skip = (page - 1) * pageSize
    
    // Parse and validate filters
    const filters = searchFiltersSchema.parse({
      query: searchParams.get('query') || undefined,
      contentType: searchParams.get('contentType') || undefined,
      status: searchParams.get('status')?.split(',') || undefined,
      author: searchParams.get('author') || undefined,
      category: searchParams.get('category')?.split(',') || undefined,
      tags: searchParams.get('tags')?.split(',') || undefined,
      featured: searchParams.get('featured') === 'true' ? true : undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      sortBy: (searchParams.get('sortBy') as 'createdAt' | 'updatedAt' | 'publishedAt' | 'title' | 'order') || undefined,
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || undefined
    })

    // Build where clause
    const where: Record<string, unknown> = {}
    
    if (filters.query) {
      where.OR = [
        { title: { contains: filters.query, mode: 'insensitive' } },
        { data: { contains: filters.query, mode: 'insensitive' } }
      ]
    }

    if (filters.contentType) {
      where.contentTypeId = filters.contentType
    }

    if (filters.status && filters.status.length > 0) {
      where.status = { in: filters.status }
    }

    if (filters.author) {
      where.authorId = filters.author
    }

    if (filters.featured !== undefined) {
      where.featured = filters.featured
    }

    if (filters.dateFrom || filters.dateTo) {
      const createdAt: Record<string, Date> = {}
      if (filters.dateFrom) {
        createdAt.gte = new Date(filters.dateFrom)
      }
      if (filters.dateTo) {
        createdAt.lte = new Date(filters.dateTo)
      }
      where.createdAt = createdAt
    }

    // Build order clause
    const orderBy: Record<string, 'asc' | 'desc'> = {}
    if (filters.sortBy) {
      orderBy[filters.sortBy] = filters.sortOrder || 'desc'
    } else {
      orderBy.updatedAt = 'desc'
    }

    // Fetch data
    const [items, total] = await Promise.all([
      prisma.dynamicContentItem.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          contentType: {
            select: {
              id: true,
              name: true,
              label: true,
              icon: true
            }
          }
        }
      }),
      prisma.dynamicContentItem.count({ where })
    ])

    const paginatedResponse = createPaginatedResponse(items, total, page, pageSize)
    
    return NextResponse.json(createAPIResponse(true, paginatedResponse))
  } catch (error) {
    console.error('Error fetching content items:', error)
    return NextResponse.json(
      createAPIResponse(false, null, 'Failed to fetch content items'),
      { status: 500 }
    )
  }
}

// POST /api/admin/cms/content - Create new content item
export async function POST(request: NextRequest) {
  try {
    const { authorized, user } = await checkPermissions()
    if (!authorized) {
      return NextResponse.json(
        createAPIResponse(false, null, 'Unauthorized'),
        { status: 401 }
      )
    }

    const body = await request.json()
    const { contentTypeId, slug, ...itemData } = body

    // Validate required fields
    if (!contentTypeId) {
      return NextResponse.json(
        createAPIResponse(false, null, 'Content type ID is required'),
        { status: 400 }
      )
    }

    // Validate content item data
    const validatedData = contentItemSchema.parse(itemData)

    // Check if content type exists
    const contentType = await prisma.contentType.findUnique({
      where: { id: contentTypeId }
    })

    if (!contentType) {
      return NextResponse.json(
        createAPIResponse(false, null, 'Content type not found'),
        { status: 404 }
      )
    }

    // Generate slug if required
    let finalSlug = slug
    if (!finalSlug && JSON.parse(contentType.settings).hasSlug) {
      finalSlug = validatedData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
    }

    // Check for slug uniqueness
    if (finalSlug) {
      const existingItem = await prisma.dynamicContentItem.findFirst({
        where: {
          contentTypeId,
          slug: finalSlug
        }
      })

      if (existingItem) {
        return NextResponse.json(
          createAPIResponse(false, null, 'Slug already exists for this content type'),
          { status: 409 }
        )
      }
    }

    // Create content item
    const newItem = await prisma.dynamicContentItem.create({
      data: {
        contentTypeId,
        slug: finalSlug,
        title: validatedData.title,
        data: JSON.stringify(validatedData.data),
        status: validatedData.status || 'draft',
        publishedAt: validatedData.publishedAt ? new Date(validatedData.publishedAt) : null,
        author: user?.id || 'system'
      },
      include: {
        contentType: {
          select: {
            id: true,
            name: true,
            label: true,
            icon: true
          }
        }
      }
    })

    // Log activity
    await logActivity('create', 'content', newItem.id, newItem.title, user!.id, undefined, request)

    return NextResponse.json(
      createAPIResponse(true, newItem, undefined, 'Content item created successfully'),
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating content item:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        createAPIResponse(false, null, 'Validation error: ' + error.errors.map(e => e.message).join(', ')),
        { status: 400 }
      )
    }
    return NextResponse.json(
      createAPIResponse(false, null, 'Failed to create content item'),
      { status: 500 }
    )
  }
}

// PUT /api/admin/cms/content?id= - Update content item
export async function PUT(request: NextRequest) {
  try {
    const { authorized, user } = await checkPermissions()
    if (!authorized) {
      return NextResponse.json(
        createAPIResponse(false, null, 'Unauthorized'),
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        createAPIResponse(false, null, 'Content item ID is required'),
        { status: 400 }
      )
    }

    const body = await request.json()
    const { slug, ...itemData } = body

    // Validate content item data
    const validatedData = contentItemSchema.partial().parse(itemData)

    // Check if content item exists
    const existingItem = await prisma.dynamicContentItem.findUnique({
      where: { id },
      include: { contentType: true }
    })

    if (!existingItem) {
      return NextResponse.json(
        createAPIResponse(false, null, 'Content item not found'),
        { status: 404 }
      )
    }

    // Check for slug uniqueness if updating slug
    if (slug && slug !== existingItem.slug) {
      const duplicateSlug = await prisma.dynamicContentItem.findFirst({
        where: {
          contentTypeId: existingItem.contentTypeId,
          slug,
          id: { not: id }
        }
      })

      if (duplicateSlug) {
        return NextResponse.json(
          createAPIResponse(false, null, 'Slug already exists for this content type'),
          { status: 409 }
        )
      }
    }

    // Track changes for activity log
    const changes: Array<{ field: string; oldValue: unknown; newValue: unknown }> = []
    
    if (validatedData.title && validatedData.title !== existingItem.title) {
      changes.push({ field: 'title', oldValue: existingItem.title, newValue: validatedData.title })
    }
    
    if (validatedData.status && validatedData.status !== existingItem.status) {
      changes.push({ field: 'status', oldValue: existingItem.status, newValue: validatedData.status })
    }

    // Update content item
    const updatedItem = await prisma.dynamicContentItem.update({
      where: { id },
      data: {
        ...(slug !== undefined && { slug }),
        ...(validatedData.title && { title: validatedData.title }),
        ...(validatedData.data && { data: JSON.stringify(validatedData.data) }),
        ...(validatedData.status && { status: validatedData.status }),
        ...(validatedData.featured !== undefined && { featured: validatedData.featured }),
        ...(validatedData.publishedAt && { publishedAt: new Date(validatedData.publishedAt) }),
        ...(validatedData.scheduledAt && { scheduledAt: new Date(validatedData.scheduledAt) }),
        ...(validatedData.expiresAt && { expiresAt: new Date(validatedData.expiresAt) }),
        ...(validatedData.order !== undefined && { order: validatedData.order }),
        ...(validatedData.categories && { categories: JSON.stringify(validatedData.categories) }),
        ...(validatedData.tags && { tags: JSON.stringify(validatedData.tags) }),
        ...(validatedData.metadata && { metadata: JSON.stringify(validatedData.metadata) }),
        updatedAt: new Date()
      },
      include: {
        contentType: {
          select: {
            id: true,
            name: true,
            label: true,
            icon: true
          }
        }
      }
    })

    // Log activity
    if (changes.length > 0) {
      await logActivity('update', 'content', updatedItem.id, updatedItem.title, user!.id, changes, request)
    }

    return NextResponse.json(
      createAPIResponse(true, updatedItem, undefined, 'Content item updated successfully')
    )
  } catch (error) {
    console.error('Error updating content item:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        createAPIResponse(false, null, 'Validation error: ' + error.errors.map(e => e.message).join(', ')),
        { status: 400 }
      )
    }
    return NextResponse.json(
      createAPIResponse(false, null, 'Failed to update content item'),
      { status: 500 }
    )
  }
}

// DELETE /api/admin/cms/content?id= - Delete content item
export async function DELETE(request: NextRequest) {
  try {
    const { authorized, user } = await checkPermissions()
    if (!authorized) {
      return NextResponse.json(
        createAPIResponse(false, null, 'Unauthorized'),
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        createAPIResponse(false, null, 'Content item ID is required'),
        { status: 400 }
      )
    }

    // Check if content item exists
    const existingItem = await prisma.dynamicContentItem.findUnique({
      where: { id }
    })

    if (!existingItem) {
      return NextResponse.json(
        createAPIResponse(false, null, 'Content item not found'),
        { status: 404 }
      )
    }

    // Delete content item
    await prisma.dynamicContentItem.delete({
      where: { id }
    })

    // Log activity
    await logActivity('delete', 'content', id, existingItem.title, user!.id, undefined, request)

    return NextResponse.json(
      createAPIResponse(true, null, undefined, 'Content item deleted successfully')
    )
  } catch (error) {
    console.error('Error deleting content item:', error)
    return NextResponse.json(
      createAPIResponse(false, null, 'Failed to delete content item'),
      { status: 500 }
    )
  }
}