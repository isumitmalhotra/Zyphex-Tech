import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createStorageAdapter } from '@/lib/storage'

// Update media asset validation schema
const updateMediaSchema = z.object({
  alt: z.string().optional(),
  category: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const { id } = params

    // Get media asset by ID
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mediaAsset = await (prisma as any).mediaAsset.findUnique({
      where: { id },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })

    if (!mediaAsset) {
      return NextResponse.json(
        { error: 'Media asset not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: mediaAsset
    })

  } catch (error) {
    console.error('Media GET by ID error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch media asset' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const { id } = params
    const body = await request.json()

    // Validate request body
    const validatedData = updateMediaSchema.parse(body)

    // Check if media asset exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingAsset = await (prisma as any).mediaAsset.findUnique({
      where: { id }
    })

    if (!existingAsset) {
      return NextResponse.json(
        { error: 'Media asset not found' },
        { status: 404 }
      )
    }

    // Update media asset
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatedAsset = await (prisma as any).mediaAsset.update({
      where: { id },
      data: validatedData,
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedAsset,
      message: 'Media asset updated successfully'
    })

  } catch (error) {
    console.error('Media PUT error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update media asset' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const { id } = params

    // Check if media asset exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingAsset = await (prisma as any).mediaAsset.findUnique({
      where: { id }
    })

    if (!existingAsset) {
      return NextResponse.json(
        { error: 'Media asset not found' },
        { status: 404 }
      )
    }

    // Delete from storage
    try {
      const storageAdapter = createStorageAdapter()
      await storageAdapter.delete(existingAsset.filename)
    } catch (storageError) {
      console.error('Failed to delete file from storage:', storageError)
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).mediaAsset.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Media asset deleted successfully'
    })

  } catch (error) {
    console.error('Media DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete media asset' },
      { status: 500 }
    )
  }
}
