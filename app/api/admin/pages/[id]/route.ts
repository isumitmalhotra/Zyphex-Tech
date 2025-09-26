import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema for page updates
const updatePageSchema = z.object({
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens').optional(),
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
  path: z.string().min(1, 'Path is required').optional(),
  isActive: z.boolean().optional(),
  order: z.number().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
})

// GET /api/admin/pages/[id] - Fetch a specific page
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const page = await prisma.page.findUnique({
      where: { id: params.id }
    })

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    return NextResponse.json(page)
  } catch (error) {
    console.error('Error fetching page:', error)
    return NextResponse.json(
      { error: 'Failed to fetch page' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/pages/[id] - Update a specific page
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if page exists
    const existingPage = await prisma.page.findUnique({
      where: { id: params.id }
    })

    if (!existingPage) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    // Check if this is a system page and prevent deletion/deactivation of critical fields
    if (existingPage.isSystem) {
      return NextResponse.json(
        { error: 'System pages cannot be fully modified' },
        { status: 400 }
      )
    }

    const json = await request.json()
    const data = updatePageSchema.parse(json)

    // If updating slug, check for conflicts
    if (data.slug && data.slug !== existingPage.slug) {
      const conflictingPage = await prisma.page.findUnique({
        where: { slug: data.slug }
      })

      if (conflictingPage) {
        return NextResponse.json(
          { error: 'A page with this slug already exists' },
          { status: 400 }
        )
      }
    }

    const updatedPage = await prisma.page.update({
      where: { id: params.id },
      data
    })

    return NextResponse.json(updatedPage)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating page:', error)
    return NextResponse.json(
      { error: 'Failed to update page' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/pages/[id] - Delete a specific page
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if page exists
    const existingPage = await prisma.page.findUnique({
      where: { id: params.id }
    })

    if (!existingPage) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    // Prevent deletion of system pages
    if (existingPage.isSystem) {
      return NextResponse.json(
        { error: 'System pages cannot be deleted' },
        { status: 400 }
      )
    }

    await prisma.page.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Page deleted successfully' })
  } catch (error) {
    console.error('Error deleting page:', error)
    return NextResponse.json(
      { error: 'Failed to delete page' },
      { status: 500 }
    )
  }
}