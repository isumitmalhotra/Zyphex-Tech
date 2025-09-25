// Content Types Management API
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'
import { APIResponse, PaginatedResponse } from '@/types/cms'

const contentTypeSchema = z.object({
  name: z.string().min(1, 'Name is required').regex(/^[a-z0-9_]+$/, 'Name must contain only lowercase letters, numbers, and underscores'),
  label: z.string().min(1, 'Label is required'),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  fields: z.array(z.object({
    id: z.string(),
    name: z.string(),
    label: z.string(),
    type: z.enum(['text', 'textarea', 'richtext', 'image', 'gallery', 'url', 'email', 'number', 'boolean', 'select', 'multiselect', 'date', 'datetime', 'color', 'json', 'code']),
    required: z.boolean().optional(),
    placeholder: z.string().optional(),
    defaultValue: z.unknown().optional(),
    validation: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
      pattern: z.string().optional(),
      options: z.array(z.object({
        label: z.string(),
        value: z.string()
      })).optional(),
      accept: z.string().optional()
    }).optional(),
    description: z.string().optional(),
    helpText: z.string().optional(),
    order: z.number().int().min(0),
    group: z.string().optional(),
    conditional: z.object({
      field: z.string(),
      value: z.unknown(),
      operator: z.enum(['equals', 'not_equals', 'contains', 'greater_than', 'less_than'])
    }).optional()
  })),
  settings: z.object({
    hasSlug: z.boolean().optional(),
    hasStatus: z.boolean().optional(),
    hasPublishing: z.boolean().optional(),
    hasScheduling: z.boolean().optional(),
    hasOrdering: z.boolean().optional(),
    hasFeatured: z.boolean().optional(),
    hasCategories: z.boolean().optional(),
    hasTags: z.boolean().optional(),
    hasAuthor: z.boolean().optional(),
    hasComments: z.boolean().optional(),
    hasVersioning: z.boolean().optional(),
    hasMetadata: z.boolean().optional(),
    hasPermissions: z.boolean().optional(),
    singleInstance: z.boolean().optional(),
    maxInstances: z.number().int().positive().optional(),
    defaultStatus: z.enum(['draft', 'published', 'archived', 'scheduled']).optional(),
    publishWorkflow: z.boolean().optional(),
    requireApproval: z.boolean().optional()
  }),
  category: z.enum(['page', 'collection', 'component', 'template']),
  permissions: z.object({
    create: z.array(z.enum(['admin', 'editor', 'author', 'viewer'])).optional(),
    read: z.array(z.enum(['admin', 'editor', 'author', 'viewer'])).optional(),
    update: z.array(z.enum(['admin', 'editor', 'author', 'viewer'])).optional(),
    delete: z.array(z.enum(['admin', 'editor', 'author', 'viewer'])).optional()
  }).optional()
})

async function checkPermissions() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return { authorized: false, user: null }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, role: true }
  })

  if (!user || user.role !== 'ADMIN') {
    return { authorized: false, user: null }
  }

  return { authorized: true, user }
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

// GET /api/admin/cms/content-types - List content types
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
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category')
    const isActive = searchParams.get('isActive')

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { label: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (category) {
      where.category = category
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    const [contentTypes, total] = await Promise.all([
      prisma.contentType.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { updatedAt: 'desc' },
        include: {
          _count: {
            select: {
              contentItems: true,
              contentSections: true
            }
          }
        }
      }),
      prisma.contentType.count({ where })
    ])

    const paginatedResponse = createPaginatedResponse(contentTypes, total, page, pageSize)
    
    return NextResponse.json(createAPIResponse(true, paginatedResponse))
  } catch (error) {
    console.error('Error fetching content types:', error)
    return NextResponse.json(
      createAPIResponse(false, null, 'Failed to fetch content types'),
      { status: 500 }
    )
  }
}

// POST /api/admin/cms/content-types - Create new content type
export async function POST(request: NextRequest) {
  try {
    const { authorized } = await checkPermissions()
    if (!authorized) {
      return NextResponse.json(
        createAPIResponse(false, null, 'Unauthorized'),
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = contentTypeSchema.parse(body)

    // Check if name already exists
    const existingContentType = await prisma.contentType.findUnique({
      where: { name: validatedData.name }
    })

    if (existingContentType) {
      return NextResponse.json(
        createAPIResponse(false, null, 'Content type name already exists'),
        { status: 409 }
      )
    }

    // Create content type
    const newContentType = await prisma.contentType.create({
      data: {
        name: validatedData.name,
        label: validatedData.label,
        description: validatedData.description,
        icon: validatedData.icon,
        fields: JSON.stringify(validatedData.fields),
        settings: JSON.stringify(validatedData.settings),
        isSystem: false,
        isActive: true
      },
      include: {
        _count: {
          select: {
            contentItems: true,
            contentSections: true
          }
        }
      }
    })

    return NextResponse.json(
      createAPIResponse(true, newContentType, undefined, 'Content type created successfully'),
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating content type:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        createAPIResponse(false, null, 'Validation error: ' + error.errors.map(e => e.message).join(', ')),
        { status: 400 }
      )
    }
    return NextResponse.json(
      createAPIResponse(false, null, 'Failed to create content type'),
      { status: 500 }
    )
  }
}

// PUT /api/admin/cms/content-types?id= - Update content type
export async function PUT(request: NextRequest) {
  try {
    const { authorized } = await checkPermissions()
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
        createAPIResponse(false, null, 'Content type ID is required'),
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = contentTypeSchema.partial().parse(body)

    // Check if content type exists
    const existingContentType = await prisma.contentType.findUnique({
      where: { id }
    })

    if (!existingContentType) {
      return NextResponse.json(
        createAPIResponse(false, null, 'Content type not found'),
        { status: 404 }
      )
    }

    // Check if trying to update system content type
    if (existingContentType.isSystem && validatedData.name && validatedData.name !== existingContentType.name) {
      return NextResponse.json(
        createAPIResponse(false, null, 'Cannot modify system content type name'),
        { status: 403 }
      )
    }

    // Check for name uniqueness if updating name
    if (validatedData.name && validatedData.name !== existingContentType.name) {
      const duplicateName = await prisma.contentType.findUnique({
        where: { name: validatedData.name }
      })

      if (duplicateName) {
        return NextResponse.json(
          createAPIResponse(false, null, 'Content type name already exists'),
          { status: 409 }
        )
      }
    }

    // Update content type
    const updatedContentType = await prisma.contentType.update({
      where: { id },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.label && { label: validatedData.label }),
        ...(validatedData.description !== undefined && { description: validatedData.description }),
        ...(validatedData.icon !== undefined && { icon: validatedData.icon }),
        ...(validatedData.fields && { fields: JSON.stringify(validatedData.fields) }),
        ...(validatedData.settings && { settings: JSON.stringify(validatedData.settings) }),
        updatedAt: new Date()
      },
      include: {
        _count: {
          select: {
            contentItems: true,
            contentSections: true
          }
        }
      }
    })

    return NextResponse.json(
      createAPIResponse(true, updatedContentType, undefined, 'Content type updated successfully')
    )
  } catch (error) {
    console.error('Error updating content type:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        createAPIResponse(false, null, 'Validation error: ' + error.errors.map(e => e.message).join(', ')),
        { status: 400 }
      )
    }
    return NextResponse.json(
      createAPIResponse(false, null, 'Failed to update content type'),
      { status: 500 }
    )
  }
}

// DELETE /api/admin/cms/content-types?id= - Delete content type
export async function DELETE(request: NextRequest) {
  try {
    const { authorized } = await checkPermissions()
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
        createAPIResponse(false, null, 'Content type ID is required'),
        { status: 400 }
      )
    }

    // Check if content type exists
    const existingContentType = await prisma.contentType.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            contentItems: true,
            contentSections: true
          }
        }
      }
    })

    if (!existingContentType) {
      return NextResponse.json(
        createAPIResponse(false, null, 'Content type not found'),
        { status: 404 }
      )
    }

    // Prevent deletion of system content types
    if (existingContentType.isSystem) {
      return NextResponse.json(
        createAPIResponse(false, null, 'Cannot delete system content type'),
        { status: 403 }
      )
    }

    // Check if content type has associated content
    if (existingContentType._count.contentItems > 0 || existingContentType._count.contentSections > 0) {
      return NextResponse.json(
        createAPIResponse(false, null, 'Cannot delete content type with associated content items or sections'),
        { status: 409 }
      )
    }

    // Delete content type
    await prisma.contentType.delete({
      where: { id }
    })

    return NextResponse.json(
      createAPIResponse(true, null, undefined, 'Content type deleted successfully')
    )
  } catch (error) {
    console.error('Error deleting content type:', error)
    return NextResponse.json(
      createAPIResponse(false, null, 'Failed to delete content type'),
      { status: 500 }
    )
  }
}