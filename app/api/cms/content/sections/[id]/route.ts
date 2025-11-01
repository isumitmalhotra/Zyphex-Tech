/**
 * Content Section API Routes
 * 
 * PUT    /api/cms/content/sections/[id] - Update section content and visibility
 * DELETE /api/cms/content/sections/[id] - Delete a section
 * 
 * Uses PageContentSection model
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * PUT /api/cms/content/sections/[id]
 * Update section content, visibility, order, or other properties
 * 
 * Body: {
 *   sectionKey?: string
 *   sectionType?: string
 *   title?: string
 *   contentData?: object
 *   order?: number
 *   isVisible?: boolean
 * }
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'super-admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Super Admin access required' },
        { status: 403 }
      )
    }

    const { id } = params

    // Check if section exists
    const existingSection = await prisma.pageContentSection.findUnique({
      where: { id },
      include: {
        page: {
          select: {
            pageKey: true,
            name: true
          }
        }
      }
    })

    if (!existingSection) {
      return NextResponse.json(
        { error: `Section with id '${id}' not found` },
        { status: 404 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { 
      sectionKey, 
      sectionType, 
      title, 
      contentData, 
      order, 
      isVisible 
    } = body

    // Build update data (only include provided fields)
    const updateData: {
      sectionKey?: string
      sectionType?: string
      title?: string | null
      contentData?: Record<string, unknown>
      order?: number
      isVisible?: boolean
      updatedAt?: Date
    } = {}

    if (sectionKey !== undefined) updateData.sectionKey = sectionKey
    if (sectionType !== undefined) updateData.sectionType = sectionType
    if (title !== undefined) updateData.title = title
    if (contentData !== undefined) updateData.contentData = contentData
    if (order !== undefined) updateData.order = order
    if (isVisible !== undefined) updateData.isVisible = isVisible
    
    // Always update the timestamp
    updateData.updatedAt = new Date()

    // Update section
    const updatedSection = await prisma.pageContentSection.update({
      where: { id },
      data: updateData,
      include: {
        page: {
          select: {
            pageKey: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json(
      {
        success: true,
        data: updatedSection,
        message: `Section '${updatedSection.sectionKey}' updated successfully`
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error updating section:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update section',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/cms/content/sections/[id]
 * Delete a section
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
        { error: 'Unauthorized - Super Admin access required' },
        { status: 403 }
      )
    }

    const { id } = params

    // Check if section exists
    const existingSection = await prisma.pageContentSection.findUnique({
      where: { id },
      include: {
        page: {
          select: {
            pageKey: true,
            name: true
          }
        }
      }
    })

    if (!existingSection) {
      return NextResponse.json(
        { error: `Section with id '${id}' not found` },
        { status: 404 }
      )
    }

    // Delete section
    await prisma.pageContentSection.delete({
      where: { id }
    })

    return NextResponse.json(
      {
        success: true,
        message: `Section '${existingSection.sectionKey}' from page '${existingSection.page.name}' deleted successfully`
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error deleting section:', error)
    return NextResponse.json(
      { 
        error: 'Failed to delete section',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/cms/content/sections/[id]
 * Fetch a single section by id
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params

    // Fetch section with page info
    const section = await prisma.pageContentSection.findUnique({
      where: { id },
      include: {
        page: {
          select: {
            pageKey: true,
            name: true,
            slug: true
          }
        }
      }
    })

    if (!section) {
      return NextResponse.json(
        { error: `Section with id '${id}' not found` },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: section
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error fetching section:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch section',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
