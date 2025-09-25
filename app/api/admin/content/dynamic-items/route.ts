import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'
import { 
  getCachedDynamicContent, 
  invalidateDynamicContentCache 
} from '@/lib/cache'
import { revalidateOnContentChange } from '@/lib/revalidation'

// Validation schemas
const createDynamicContentItemSchema = z.object({
  contentTypeId: z.string().min(1, 'Content type ID is required'),
  title: z.string().min(1, 'Title is required'),
  slug: z.string().optional(),
  data: z.record(z.unknown()).optional(),
  status: z.enum(['draft', 'published', 'archived', 'scheduled']).optional().default('draft'),
  featured: z.boolean().optional().default(false),
  categories: z.array(z.string()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
  author: z.string().optional(),
  metadata: z.record(z.unknown()).optional().default({}),
  publishedAt: z.string().datetime().optional(),
  order: z.number().int().min(0).optional().default(0)
})

const queryFiltersSchema = z.object({
  contentTypeId: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived', 'scheduled']).optional(),
  featured: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional()
})

// GET /api/admin/content/dynamic-items - Get all dynamic content items
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admin can access dynamic content management
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    
    // Validate query parameters
    const queryValidation = queryFiltersSchema.safeParse({
      contentTypeId: searchParams.get('contentTypeId'),
      status: searchParams.get('status'),
      featured: searchParams.get('featured'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit')
    })

    if (!queryValidation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryValidation.error.errors },
        { status: 400 }
      )
    }

    const { contentTypeId, status, featured, page: pageStr, limit: limitStr } = queryValidation.data
    const page = parseInt(pageStr || '1')
    const limit = parseInt(limitStr || '10')

    const where: Record<string, unknown> = {}
    if (contentTypeId) where.contentTypeId = contentTypeId
    if (status) where.status = status
    if (featured === 'true') where.featured = true

    // Try to get from cache first (only for simple queries without complex filters)
    if (contentTypeId && !status && !featured && page === 1) {
      const cached = await getCachedDynamicContent(contentTypeId)
      if (cached && Array.isArray(cached)) {
        const startIndex = (page - 1) * limit
        const endIndex = startIndex + limit
        const paginatedItems = cached.slice(startIndex, endIndex)
        
        return NextResponse.json({
          items: paginatedItems,
          pagination: {
            page,
            limit,
            total: cached.length,
            pages: Math.ceil(cached.length / limit)
          }
        })
      }
    }

    const [items, total] = await Promise.all([
      prisma.dynamicContentItem.findMany({
        where,
        include: {
          contentType: {
            select: {
              name: true,
              label: true,
              icon: true
            }
          }
        },
        orderBy: [
          { featured: 'desc' },
          { order: 'asc' },
          { createdAt: 'desc' }
        ],
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.dynamicContentItem.count({ where })
    ])

    // Parse JSON data fields
    const formattedItems = items.map(item => ({
      ...item,
      data: JSON.parse(item.data || '{}'),
      categories: item.categories ? JSON.parse(item.categories) : [],
      tags: item.tags ? JSON.parse(item.tags) : [],
      metadata: item.metadata ? JSON.parse(item.metadata) : {}
    }))

    return NextResponse.json({
      items: formattedItems,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching dynamic content items:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/content/dynamic-items - Create new dynamic content item
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admin can create dynamic content items
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    // Validate input using Zod
    const validationResult = createDynamicContentItemSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validationResult.error.errors 
        },
        { status: 400 }
      )
    }

    const {
      contentTypeId,
      title,
      slug,
      data,
      status,
      featured,
      categories,
      tags,
      author,
      metadata,
      publishedAt,
      order
    } = validationResult.data

    // Check if content type exists
    const contentType = await prisma.contentType.findUnique({
      where: { id: contentTypeId }
    })

    if (!contentType) {
      return NextResponse.json({ error: 'Content type not found' }, { status: 404 })
    }

    // Check slug uniqueness if provided
    if (slug) {
      const existingItem = await prisma.dynamicContentItem.findUnique({
        where: {
          contentTypeId_slug: {
            contentTypeId,
            slug
          }
        }
      })

      if (existingItem) {
        return NextResponse.json({ error: 'Slug already exists for this content type' }, { status: 409 })
      }
    }

    // Create content item
    const item = await prisma.dynamicContentItem.create({
      data: {
        contentTypeId,
        title,
        slug,
        data: JSON.stringify(data || {}),
        status,
        featured,
        categories: JSON.stringify(categories),
        tags: JSON.stringify(tags),
        author: author || session.user?.name,
        metadata: JSON.stringify(metadata),
        publishedAt: status === 'published' && !publishedAt ? new Date() : publishedAt ? new Date(publishedAt) : null,
        order
      },
      include: {
        contentType: {
          select: {
            name: true,
            label: true,
            icon: true
          }
        }
      }
    })

    const formatted = {
      ...item,
      data: JSON.parse(item.data || '{}'),
      categories: JSON.parse(item.categories || '[]'),
      tags: JSON.parse(item.tags || '[]'),
      metadata: JSON.parse(item.metadata || '{}')
    }

    // Invalidate cache for this content type
    await invalidateDynamicContentCache(contentTypeId, item.id)

    // Revalidate Next.js cache
    await revalidateOnContentChange('dynamic-content', {
      contentTypeId,
      itemId: item.id,
      slug: item.slug || undefined
    })

    return NextResponse.json(formatted, { status: 201 })
  } catch (error) {
    console.error('Error creating dynamic content item:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}