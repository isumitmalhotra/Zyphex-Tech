import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Type assertion for Prisma client with contentSection model
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prismaWithContentSection = prisma as any

// Validation schema for updates
const updateContentSectionSchema = z.object({
  sectionKey: z.string().min(1, 'Section key is required').optional(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  content: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')).optional(),
  isActive: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
})

// GET /api/admin/content/sections/[id] - Get content section by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const { id } = params

    const section = await prismaWithContentSection.contentSection.findUnique({
      where: { id },
    })

    if (!section) {
      return NextResponse.json(
        { error: 'Content section not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(section)
  } catch (error) {
    console.error('Error fetching content section:', error)
    return NextResponse.json(
      { error: 'Failed to fetch content section' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/content/sections/[id] - Update content section
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const { id } = params
    const body = await request.json()

    // Validate input
    const validationResult = updateContentSectionSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const updateData = validationResult.data

    // Check if content section exists
    const existingSection = await prismaWithContentSection.contentSection.findUnique({
      where: { id },
    })

    if (!existingSection) {
      return NextResponse.json(
        { error: 'Content section not found' },
        { status: 404 }
      )
    }

    // If updating sectionKey, check if it already exists
    if (updateData.sectionKey && updateData.sectionKey !== existingSection.sectionKey) {
      const sectionWithSameKey = await prismaWithContentSection.contentSection.findUnique({
        where: { sectionKey: updateData.sectionKey },
      })

      if (sectionWithSameKey) {
        return NextResponse.json(
          { error: 'Content section with this key already exists' },
          { status: 409 }
        )
      }
    }

    // Update content section
    const updatedSection = await prismaWithContentSection.contentSection.update({
      where: { id },
      data: {
        ...updateData,
        imageUrl: updateData.imageUrl === '' ? null : updateData.imageUrl,
      },
    })

    return NextResponse.json(updatedSection)
  } catch (error) {
    console.error('Error updating content section:', error)
    return NextResponse.json(
      { error: 'Failed to update content section' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/content/sections/[id] - Delete content section
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admin can delete content sections
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = params

    // Check if content section exists
    const existingSection = await prismaWithContentSection.contentSection.findUnique({
      where: { id },
    })

    if (!existingSection) {
      return NextResponse.json(
        { error: 'Content section not found' },
        { status: 404 }
      )
    }

    // Delete content section
    await prismaWithContentSection.contentSection.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Content section deleted successfully' })
  } catch (error) {
    console.error('Error deleting content section:', error)
    return NextResponse.json(
      { error: 'Failed to delete content section' },
      { status: 500 }
    )
  }
}
