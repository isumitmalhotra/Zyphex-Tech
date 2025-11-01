/**
 * Single Page Content API Routes
 * 
 * GET /api/cms/content/pages/[pageKey] - Fetch a single page by pageKey
 * PUT /api/cms/content/pages/[pageKey] - Update page metadata
 * 
 * Uses PageContent and PageContentSection models
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface RouteParams {
  params: {
    pageKey: string
  }
}

/**
 * GET /api/cms/content/pages/[pageKey]
 * Fetch a single page with all its sections
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { pageKey } = params

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const includeHidden = searchParams.get('includeHidden') === 'true'

    // Fetch page with sections
    const page = await prisma.pageContent.findUnique({
      where: { pageKey },
      include: {
        sections: {
          where: includeHidden ? {} : { isVisible: true },
          orderBy: { order: 'asc' }
        }
      }
    })

    if (!page) {
      return NextResponse.json(
        { error: `Page with pageKey '${pageKey}' not found` },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: page
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error fetching page:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch page',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/cms/content/pages/[pageKey]
 * Update page metadata (name, slug, title, description, status)
 * 
 * Body: {
 *   name?: string
 *   slug?: string
 *   title?: string
 *   description?: string
 *   status?: 'draft' | 'published'
 * }
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Check super-admin authentication
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'super-admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Super Admin access required' },
        { status: 403 }
      )
    }

    const { pageKey } = params

    // Check if page exists
    const existingPage = await prisma.pageContent.findUnique({
      where: { pageKey }
    })

    if (!existingPage) {
      return NextResponse.json(
        { error: `Page with pageKey '${pageKey}' not found` },
        { status: 404 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { name, slug, title, description, status } = body

    // Build update data (only include provided fields)
    const updateData: {
      name?: string
      slug?: string
      title?: string
      description?: string | null
      status?: string
      updatedAt?: Date
    } = {}

    if (name !== undefined) updateData.name = name
    if (slug !== undefined) updateData.slug = slug
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (status !== undefined) updateData.status = status
    
    // Always update the timestamp
    updateData.updatedAt = new Date()

    // Update page
    const updatedPage = await prisma.pageContent.update({
      where: { pageKey },
      data: updateData,
      include: {
        sections: {
          orderBy: { order: 'asc' }
        }
      }
    })

    return NextResponse.json(
      {
        success: true,
        data: updatedPage,
        message: `Page '${pageKey}' updated successfully`
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error updating page:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update page',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/cms/content/pages/[pageKey]
 * Delete a page and all its sections (CASCADE)
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'super-admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Super admin access required' },
        { status: 403 }
      )
    }

    const { pageKey } = params

    // Check if page exists
    const existingPage = await prisma.pageContent.findUnique({
      where: { pageKey },
      include: {
        sections: true
      }
    })

    if (!existingPage) {
      return NextResponse.json(
        { error: `Page with pageKey '${pageKey}' not found` },
        { status: 404 }
      )
    }

    // Delete page (sections will be deleted automatically due to CASCADE)
    await prisma.pageContent.delete({
      where: { pageKey }
    })

    return NextResponse.json(
      {
        success: true,
        message: `Page '${pageKey}' and ${existingPage.sections.length} sections deleted successfully`
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error deleting page:', error)
    return NextResponse.json(
      { 
        error: 'Failed to delete page',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
