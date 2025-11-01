import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { unlink } from 'fs/promises'
import { join } from 'path'

export const dynamic = 'force-dynamic'

// GET /api/media/list - List all media assets
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Build where clause
    const where: {
      category?: string
      OR?: Array<{
        filename?: { contains: string, mode: 'insensitive' }
        originalName?: { contains: string, mode: 'insensitive' }
        alt?: { contains: string, mode: 'insensitive' }
      }>
    } = {}

    if (category && category !== 'all') {
      where.category = category
    }

    if (search) {
      where.OR = [
        { filename: { contains: search, mode: 'insensitive' } },
        { originalName: { contains: search, mode: 'insensitive' } },
        { alt: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get total count
    const total = await prisma.mediaAsset.count({ where })

    // Get media assets
    const assets = await prisma.mediaAsset.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip
    })

    // Get categories with counts
    const allAssets = await prisma.mediaAsset.findMany({
      select: { category: true }
    })
    
    const categoryCounts: Record<string, number> = {}
    allAssets.forEach(asset => {
      const cat = asset.category || 'uncategorized'
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
    })

    const categories = Object.entries(categoryCounts).map(([name, count]) => ({
      name,
      count
    }))

    return NextResponse.json({
      success: true,
      data: assets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + assets.length < total
      },
      categories
    })

  } catch (error) {
    console.error('Error fetching media assets:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch media assets' },
      { status: 500 }
    )
  }
}

// DELETE /api/media/list - Delete media asset(s)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const ids = searchParams.get('ids')?.split(',') || []

    if (!id && ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No ID(s) provided' },
        { status: 400 }
      )
    }

    const deleteIds = id ? [id] : ids

    // Get assets to delete files
    const assets = await prisma.mediaAsset.findMany({
      where: { id: { in: deleteIds } }
    })

    // Delete physical files
    for (const asset of assets) {
      try {
        const filepath = join(process.cwd(), 'public', asset.url)
        await unlink(filepath)
      } catch (error) {
        console.error(`Failed to delete file ${asset.url}:`, error)
        // Continue even if file deletion fails
      }
    }

    // Delete from database
    const result = await prisma.mediaAsset.deleteMany({
      where: { id: { in: deleteIds } }
    })

    return NextResponse.json({
      success: true,
      message: `Deleted ${result.count} media asset(s)`,
      count: result.count
    })

  } catch (error) {
    console.error('Error deleting media assets:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete media assets' },
      { status: 500 }
    )
  }
}

// PATCH /api/media/list - Update media asset metadata
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'No ID provided' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { alt, category } = body

    const updatedAsset = await prisma.mediaAsset.update({
      where: { id },
      data: {
        ...(alt !== undefined && { alt }),
        ...(category !== undefined && { category })
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedAsset,
      message: 'Media asset updated successfully'
    })

  } catch (error) {
    console.error('Error updating media asset:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update media asset' },
      { status: 500 }
    )
  }
}
