import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/super-admin/content/manage/[id] - Get single content item
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

    const contentItem = await prisma.dynamicContentItem.findUnique({
      where: { id: params.id },
      include: {
        contentType: {
          select: {
            id: true,
            name: true,
            label: true,
          }
        }
      }
    })

    if (!contentItem) {
      return NextResponse.json(
        { error: 'Content item not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(contentItem)
  } catch (error) {
    console.error('Error fetching content item:', error)
    return NextResponse.json(
      { error: 'Failed to fetch content item', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// PATCH /api/super-admin/content/manage/[id] - Update content item
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

    // Check if content item exists
    const existingItem = await prisma.dynamicContentItem.findUnique({
      where: { id: params.id },
    })

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Content item not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      ...body,
      updatedAt: new Date(),
    }

    // Handle publishedAt based on status change
    if (body.status === 'published' && existingItem.status !== 'published') {
      // Being published for the first time or republished
      updateData.publishedAt = new Date()
    } else if (body.status !== 'published' && existingItem.status === 'published') {
      // Being unpublished - keep the original publishedAt date
      // Don't modify publishedAt
    }

    console.log('Updating content item:', params.id, 'with data:', updateData)

    // Update content item
    const updatedItem = await prisma.dynamicContentItem.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(updatedItem)
  } catch (error) {
    console.error('Error updating content item:', error)
    return NextResponse.json(
      { error: 'Failed to update content item', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// DELETE /api/super-admin/content/manage/[id] - Delete content item
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

    // Check if content item exists
    const existingItem = await prisma.dynamicContentItem.findUnique({
      where: { id: params.id },
    })

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Content item not found' },
        { status: 404 }
      )
    }

    // Delete content item
    await prisma.dynamicContentItem.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Content item deleted successfully' 
    })
  } catch (error) {
    console.error('Error deleting content item:', error)
    return NextResponse.json(
      { error: 'Failed to delete content item', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
