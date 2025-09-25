import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/content/types - Fetch all content types
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const includeInactive = url.searchParams.get('includeInactive') === 'true'
    const isSystem = url.searchParams.get('system')

    const where: Record<string, boolean | string> = {}
    
    if (!includeInactive) {
      where.isActive = true
    }
    
    if (isSystem !== null) {
      where.isSystem = isSystem === 'true'
    }

    const contentTypes = await prisma.contentType.findMany({
      where,
      orderBy: [
        { isSystem: 'desc' }, // System types first
        { name: 'asc' }
      ]
    })

    const transformedTypes = contentTypes.map((type) => ({
      id: type.id,
      name: type.name,
      label: type.label,
      description: type.description,
      icon: type.icon,
      fields: JSON.parse(type.fields),
      settings: JSON.parse(type.settings),
      isSystem: type.isSystem,
      isActive: type.isActive,
      createdAt: type.createdAt,
      updatedAt: type.updatedAt
    }))

    return NextResponse.json({
      success: true,
      data: transformedTypes,
      total: transformedTypes.length
    })

  } catch (error) {
    console.error('Content types API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch content types' },
      { status: 500 }
    )
  }
}

// POST /api/content/types - Create new content type
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, label, description, icon, fields, settings } = body

    // Validate required fields
    if (!name || !label || !fields || !settings) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if content type name already exists
    const existingType = await prisma.contentType.findUnique({
      where: { name }
    })

    if (existingType) {
      return NextResponse.json(
        { success: false, error: 'Content type with this name already exists' },
        { status: 409 }
      )
    }

    const contentType = await prisma.contentType.create({
      data: {
        name,
        label,
        description,
        icon,
        fields: JSON.stringify(fields),
        settings: JSON.stringify(settings),
        isSystem: false
      }
    })

    const transformedType = {
      id: contentType.id,
      name: contentType.name,
      label: contentType.label,
      description: contentType.description,
      icon: contentType.icon,
      fields: JSON.parse(contentType.fields),
      settings: JSON.parse(contentType.settings),
      isSystem: contentType.isSystem,
      isActive: contentType.isActive,
      createdAt: contentType.createdAt,
      updatedAt: contentType.updatedAt
    }

    return NextResponse.json({
      success: true,
      data: transformedType
    }, { status: 201 })

  } catch (error) {
    console.error('Create content type API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create content type' },
      { status: 500 }
    )
  }
}