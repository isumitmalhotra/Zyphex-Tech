import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

// Validation schema for updating a DynamicContentSection
const updateDynamicContentSectionSchema = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  layoutSettings: z.string().optional(), // JSON string for layout configuration
  contentData: z.string().optional(), // JSON string for dynamic field content
})

// GET /api/admin/content/dynamic-sections/[sectionKey] - Get a DynamicContentSection by sectionKey
export async function GET(
  request: NextRequest,
  { params }: { params: { sectionKey: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admin can access content management
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { sectionKey } = params

    // Validate sectionKey
    if (!sectionKey || typeof sectionKey !== 'string') {
      return NextResponse.json(
        { error: 'Valid sectionKey is required' },
        { status: 400 }
      )
    }

    // Fetch the DynamicContentSection by sectionKey
    const dynamicContentSection = await prisma.dynamicContentSection.findUnique({
      where: { sectionKey },
      include: {
        contentType: {
          select: {
            id: true,
            name: true,
            label: true,
            fields: true,
            settings: true,
          },
        },
      },
    })

    if (!dynamicContentSection) {
      return NextResponse.json(
        { error: 'Dynamic content section not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(dynamicContentSection)
  } catch (error) {
    console.error('Error fetching dynamic content section:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dynamic content section' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/content/dynamic-sections/[sectionKey] - Update a DynamicContentSection
export async function PUT(
  request: NextRequest,
  { params }: { params: { sectionKey: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admin can update content sections
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { sectionKey } = params

    // Validate sectionKey
    if (!sectionKey || typeof sectionKey !== 'string') {
      return NextResponse.json(
        { error: 'Valid sectionKey is required' },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Validate input using Zod
    const validationResult = updateDynamicContentSectionSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validationResult.error.errors 
        },
        { status: 400 }
      )
    }

    const { title, subtitle, description, imageUrl, layoutSettings, contentData } = validationResult.data

    // Check if the DynamicContentSection exists
    const existingSection = await prisma.dynamicContentSection.findUnique({
      where: { sectionKey },
    })

    if (!existingSection) {
      return NextResponse.json(
        { error: 'Dynamic content section not found' },
        { status: 404 }
      )
    }

    // Validate layoutSettings if provided (should be valid JSON)
    if (layoutSettings !== undefined) {
      try {
        JSON.parse(layoutSettings)
      } catch {
        return NextResponse.json(
          { error: 'layoutSettings must be a valid JSON string' },
          { status: 400 }
        )
      }
    }

    // Validate contentData if provided (should be valid JSON)
    if (contentData !== undefined) {
      try {
        JSON.parse(contentData)
      } catch {
        return NextResponse.json(
          { error: 'contentData must be a valid JSON string' },
          { status: 400 }
        )
      }
    }

    // Build update data object (only include fields that are provided)
    const updateData: {
      title?: string
      subtitle?: string
      description?: string
      imageUrl?: string | null
      layoutSettings?: string
      contentData?: string | null
      updatedAt: Date
    } = {
      updatedAt: new Date()
    }

    if (title !== undefined) updateData.title = title
    if (subtitle !== undefined) updateData.subtitle = subtitle
    if (description !== undefined) updateData.description = description
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl || null
    if (layoutSettings !== undefined) updateData.layoutSettings = layoutSettings
    if (contentData !== undefined) updateData.contentData = contentData || null

    // Update the DynamicContentSection
    const updatedSection = await prisma.dynamicContentSection.update({
      where: { sectionKey },
      data: updateData,
      include: {
        contentType: {
          select: {
            id: true,
            name: true,
            label: true,
          },
        },
      },
    })

    return NextResponse.json({
      message: 'Dynamic content section updated successfully',
      data: updatedSection
    })
  } catch (error) {
    console.error('Error updating dynamic content section:', error)
    return NextResponse.json(
      { error: 'Failed to update dynamic content section' },
      { status: 500 }
    )
  }
}