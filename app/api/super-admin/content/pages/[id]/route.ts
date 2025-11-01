import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/super-admin/content/pages/[id] - Get single page
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const page = await prisma.page.findUnique({
      where: { id: params.id },
    })

    if (!page) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(page)
  } catch (error) {
    console.error('Error fetching page:', error)
    return NextResponse.json(
      { error: 'Failed to fetch page', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// PATCH /api/super-admin/content/pages/[id] - Update page
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      title,
      slug,
      path,
      description,
      metaTitle,
      metaDescription,
      isActive,
      order,
    } = body

    // Check if page exists
    const existingPage = await prisma.page.findUnique({
      where: { id: params.id },
    })

    if (!existingPage) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      )
    }

    // Prevent editing system pages (except isActive)
    if (existingPage.isSystem && Object.keys(body).some(key => key !== 'isActive')) {
      return NextResponse.json(
        { error: 'Cannot edit system page fields (except status)' },
        { status: 403 }
      )
    }

    // Validation
    if (title !== undefined && !title.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    if (slug !== undefined && !slug.trim()) {
      return NextResponse.json(
        { error: 'Slug is required' },
        { status: 400 }
      )
    }

    if (path !== undefined && !path.trim()) {
      return NextResponse.json(
        { error: 'Path is required' },
        { status: 400 }
      )
    }

    // Check for duplicate slug (if slug is being changed)
    if (slug && slug !== existingPage.slug) {
      const duplicateSlug = await prisma.page.findFirst({
        where: {
          slug,
          id: { not: params.id },
        },
      })

      if (duplicateSlug) {
        return NextResponse.json(
          { error: 'A page with this slug already exists' },
          { status: 400 }
        )
      }
    }

    // Update page
    const updatedPage = await prisma.page.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(slug !== undefined && { slug }),
        ...(path !== undefined && { path }),
        ...(description !== undefined && { description }),
        ...(metaTitle !== undefined && { metaTitle }),
        ...(metaDescription !== undefined && { metaDescription }),
        ...(isActive !== undefined && { isActive }),
        ...(order !== undefined && { order }),
        updatedAt: new Date(),
      },
    })

    return NextResponse.json(updatedPage)
  } catch (error) {
    console.error('Error updating page:', error)
    return NextResponse.json(
      { error: 'Failed to update page', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// DELETE /api/super-admin/content/pages/[id] - Delete page
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if page exists
    const existingPage = await prisma.page.findUnique({
      where: { id: params.id },
    })

    if (!existingPage) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      )
    }

    // Prevent deleting system pages
    if (existingPage.isSystem) {
      return NextResponse.json(
        { error: 'Cannot delete system pages' },
        { status: 403 }
      )
    }

    // Delete page
    await prisma.page.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true, message: 'Page deleted successfully' })
  } catch (error) {
    console.error('Error deleting page:', error)
    return NextResponse.json(
      { error: 'Failed to delete page', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
