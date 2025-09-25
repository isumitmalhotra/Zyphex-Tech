import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Type assertion for Prisma client with contentSection model
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prismaWithContentSection = prisma as any

// Validation schemas
const createContentSectionSchema = z.object({
  sectionKey: z.string().min(1, 'Section key is required'),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  content: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  isActive: z.boolean().optional().default(true),
  order: z.number().int().min(0).optional().default(0),
})

// GET /api/admin/content/sections - Get all content sections
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admin can access content management
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const pageKey = searchParams.get('pageKey')
    const isActive = searchParams.get('isActive')

    // Build filter conditions
    const where: Record<string, unknown> = {}
    if (pageKey) where.pageKey = pageKey
    if (isActive !== null) where.isActive = isActive === 'true'

    const sections = await prismaWithContentSection.contentSection.findMany({
      where,
      orderBy: { order: 'asc' },
    })

    return NextResponse.json(sections)
  } catch (error) {
    console.error('Error fetching content sections:', error)
    return NextResponse.json(
      { error: 'Failed to fetch content sections' },
      { status: 500 }
    )
  }
}

// POST /api/admin/content/sections - Create a new content section
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admin can create content sections
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    // Validate input
    const validationResult = createContentSectionSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { sectionKey, title, subtitle, content, imageUrl, isActive, order } = validationResult.data

    // Check if sectionKey already exists
    const existingSection = await prismaWithContentSection.contentSection.findUnique({
      where: { sectionKey },
    })

    if (existingSection) {
      return NextResponse.json(
        { error: 'Content section with this key already exists' },
        { status: 409 }
      )
    }

    // Create new content section
    const newSection = await prismaWithContentSection.contentSection.create({
      data: {
        sectionKey,
        title,
        subtitle,
        content,
        imageUrl: imageUrl || null,
        isActive: isActive ?? true,
        order: order ?? 0,
      },
    })

    return NextResponse.json(newSection, { status: 201 })
  } catch (error) {
    console.error('Error creating content section:', error)
    return NextResponse.json(
      { error: 'Failed to create content section' },
      { status: 500 }
    )
  }
}
