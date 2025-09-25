import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { ContentField } from '@/types/content'

interface RouteParams {
  id: string
}

// GET /api/admin/content/content-types/[id] - Get specific content type
export async function GET(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const session = await getServerSession()
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contentType = await prisma.contentType.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            contentItems: true,
            contentSections: true
          }
        }
      }
    })

    if (!contentType) {
      return NextResponse.json({ error: 'Content type not found' }, { status: 404 })
    }

    // Parse JSON fields
    const formatted = {
      ...contentType,
      fields: JSON.parse(contentType.fields || '[]'),
      settings: JSON.parse(contentType.settings || '{}')
    }

    return NextResponse.json(formatted)
  } catch (error) {
    console.error('Error fetching content type:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/admin/content/content-types/[id] - Update content type
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
    const { name, label, description, icon, fields, settings, isActive } = body

    // Check if content type exists
    const existing = await prisma.contentType.findUnique({
      where: { id: params.id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Content type not found' }, { status: 404 })
    }

    // Check if name is being changed and conflicts with another content type
    if (name && name !== existing.name) {
      const nameConflict = await prisma.contentType.findUnique({
        where: { name }
      })

      if (nameConflict) {
        return NextResponse.json({ error: 'Content type name already exists' }, { status: 409 })
      }
    }

    // Validate and clean fields if provided
    let validatedFields
    if (fields) {
      validatedFields = fields.map((field: Partial<ContentField>, index: number) => ({
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
    }

    // Update content type
    const contentType = await prisma.contentType.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(label && { label }),
        ...(description !== undefined && { description }),
        ...(icon !== undefined && { icon }),
        ...(validatedFields && { fields: JSON.stringify(validatedFields) }),
        ...(settings && { settings: JSON.stringify(settings) }),
        ...(isActive !== undefined && { isActive })
      }
    })

    const formatted = {
      ...contentType,
      fields: JSON.parse(contentType.fields || '[]'),
      settings: JSON.parse(contentType.settings || '{}')
    }

    return NextResponse.json(formatted)
  } catch (error) {
    console.error('Error updating content type:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/content/content-types/[id] - Delete content type
export async function DELETE(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const session = await getServerSession()
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if content type exists
    const existing = await prisma.contentType.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            contentItems: true,
            contentSections: true
          }
        }
      }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Content type not found' }, { status: 404 })
    }

    // Check if it's a system content type
    if (existing.isSystem) {
      return NextResponse.json({ error: 'Cannot delete system content type' }, { status: 400 })
    }

    // Check if it has content items or sections
    if (existing._count.contentItems > 0 || existing._count.contentSections > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete content type with existing content items or sections' 
      }, { status: 400 })
    }

    // Delete content type
    await prisma.contentType.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Content type deleted successfully' })
  } catch (error) {
    console.error('Error deleting content type:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}