import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { ContentField } from '@/types/content'
import { 
  getCachedContentTypes, 
  cacheContentTypes, 
  invalidateContentTypeCache 
} from '@/lib/cache'
import { revalidateOnContentChange } from '@/lib/revalidation'

// GET /api/admin/content/content-types - Get all content types
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    // Try to get from cache first
    const cached = await getCachedContentTypes()
    if (cached && Array.isArray(cached)) {
      const filtered = includeInactive 
        ? cached 
        : cached.filter((ct) => (ct as { isActive: boolean }).isActive === true)
      return NextResponse.json(filtered)
    }

    const contentTypes = await prisma.contentType.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        _count: {
          select: {
            contentItems: true,
            contentSections: true
          }
        }
      },
      orderBy: [
        { isSystem: 'desc' },
        { createdAt: 'asc' }
      ]
    })

    // Parse JSON fields and cache the results
    const formattedContentTypes = contentTypes.map((ct) => ({
      ...ct,
      fields: JSON.parse(ct.fields || '[]'),
      settings: JSON.parse(ct.settings || '{}')
    }))

    // Cache the results
    await cacheContentTypes(formattedContentTypes)

    return NextResponse.json(formattedContentTypes)
  } catch (error) {
    console.error('Error fetching content types:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/content/content-types - Create new content type
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, label, description, icon, fields, settings } = body

    // Validate required fields
    if (!name || !label || !fields) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if content type already exists
    const existing = await prisma.contentType.findUnique({
      where: { name }
    })

    if (existing) {
      return NextResponse.json({ error: 'Content type already exists' }, { status: 409 })
    }

    // Validate and clean fields
    const validatedFields = fields.map((field: Partial<ContentField>, index: number) => ({
      id: field.id || `field_${index}`,
      name: field.name || '',
      label: field.label || '',
      type: field.type || 'text',
      required: field.required || false,
      placeholder: field.placeholder || '',
      defaultValue: field.defaultValue || null,
      validation: field.validation || {},
      description: field.description || '',
      order: field.order || index
    }))

    // Create content type
    const contentType = await prisma.contentType.create({
      data: {
        name,
        label,
        description: description || '',
        icon: icon || '',
        fields: JSON.stringify(validatedFields),
        settings: JSON.stringify(settings || {}),
        isSystem: false,
        isActive: true
      }
    })

    const formatted = {
      ...contentType,
      fields: validatedFields,
      settings: settings || {}
    }

    // Invalidate content types cache
    await invalidateContentTypeCache()

    // Revalidate Next.js cache
    await revalidateOnContentChange('content-type', {})

    return NextResponse.json(formatted, { status: 201 })
  } catch (error) {
    console.error('Error creating content type:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}