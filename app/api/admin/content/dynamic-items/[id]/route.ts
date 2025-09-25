import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { 
  getCachedDynamicContentItem, 
  cacheDynamicContentItem, 
  invalidateDynamicContentCache 
} from '@/lib/cache'
import { revalidateOnContentChange } from '@/lib/revalidation'

interface RouteParams {
  id: string
}

// GET /api/admin/content/dynamic-items/[id] - Get specific dynamic content item
export async function GET(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const session = await getServerSession()
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Try to get from cache first
    const cached = await getCachedDynamicContentItem(params.id)
    if (cached) {
      return NextResponse.json(cached)
    }

    const item = await prisma.dynamicContentItem.findUnique({
      where: { id: params.id },
      include: {
        contentType: true
      }
    })

    if (!item) {
      return NextResponse.json({ error: 'Content item not found' }, { status: 404 })
    }

    // Parse JSON fields
    const formatted = {
      ...item,
      data: JSON.parse(item.data || '{}'),
      categories: item.categories ? JSON.parse(item.categories) : [],
      tags: item.tags ? JSON.parse(item.tags) : [],
      metadata: item.metadata ? JSON.parse(item.metadata) : {},
      contentType: {
        ...item.contentType,
        fields: JSON.parse(item.contentType.fields || '[]'),
        settings: JSON.parse(item.contentType.settings || '{}')
      }
    }

    // Cache the result
    await cacheDynamicContentItem(formatted)

    return NextResponse.json(formatted)
  } catch (error) {
    console.error('Error fetching dynamic content item:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/admin/content/dynamic-items/[id] - Update dynamic content item
export async function PUT(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const session = await getServerSession()
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
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
    } = body

    // Check if item exists
    const existing = await prisma.dynamicContentItem.findUnique({
      where: { id: params.id },
      include: { contentType: true }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Content item not found' }, { status: 404 })
    }

    // Check slug uniqueness if changing slug
    if (slug && slug !== existing.slug) {
      const conflictingItem = await prisma.dynamicContentItem.findUnique({
        where: {
          contentTypeId_slug: {
            contentTypeId: existing.contentTypeId,
            slug
          }
        }
      })

      if (conflictingItem) {
        return NextResponse.json({ error: 'Slug already exists for this content type' }, { status: 409 })
      }
    }

    // Update item
    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (slug !== undefined) updateData.slug = slug
    if (data !== undefined) updateData.data = JSON.stringify(data)
    if (status !== undefined) {
      updateData.status = status
      // Auto-set publishedAt when publishing
      if (status === 'published' && !existing.publishedAt) {
        updateData.publishedAt = new Date()
      }
    }
    if (featured !== undefined) updateData.featured = featured
    if (categories !== undefined) updateData.categories = JSON.stringify(categories)
    if (tags !== undefined) updateData.tags = JSON.stringify(tags)
    if (author !== undefined) updateData.author = author
    if (metadata !== undefined) updateData.metadata = JSON.stringify(metadata)
    if (publishedAt !== undefined) updateData.publishedAt = publishedAt ? new Date(publishedAt) : null
    if (order !== undefined) updateData.order = order

    const item = await prisma.dynamicContentItem.update({
      where: { id: params.id },
      data: updateData,
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

    // Invalidate cache for this item and its content type
    await invalidateDynamicContentCache(item.contentTypeId, item.id)

    // Revalidate Next.js cache
    await revalidateOnContentChange('dynamic-content', {
      contentTypeId: item.contentTypeId,
      itemId: item.id,
      slug: item.slug || undefined
    })

    return NextResponse.json(formatted)
  } catch (error) {
    console.error('Error updating dynamic content item:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/content/dynamic-items/[id] - Delete dynamic content item
export async function DELETE(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const session = await getServerSession()
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if item exists
    const existing = await prisma.dynamicContentItem.findUnique({
      where: { id: params.id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Content item not found' }, { status: 404 })
    }

    // Delete item
    await prisma.dynamicContentItem.delete({
      where: { id: params.id }
    })

    // Invalidate cache for this item and its content type
    await invalidateDynamicContentCache(existing.contentTypeId, existing.id)

    // Revalidate Next.js cache
    await revalidateOnContentChange('dynamic-content', {
      contentTypeId: existing.contentTypeId,
      itemId: existing.id,
      slug: existing.slug || undefined
    })

    return NextResponse.json({ message: 'Content item deleted successfully' })
  } catch (error) {
    console.error('Error deleting dynamic content item:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}