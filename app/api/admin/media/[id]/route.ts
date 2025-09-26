import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { unlink } from 'fs/promises'
import { join } from 'path'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const assetId = params.id

    // Find the asset in database
    const asset = await prisma.mediaAsset.findUnique({
      where: { id: assetId }
    })

    if (!asset) {
      return NextResponse.json(
        { success: false, error: 'Asset not found' },
        { status: 404 }
      )
    }

    // Delete file from disk
    const filePath = join(process.cwd(), 'public', 'uploads', asset.filename)
    try {
      await unlink(filePath)
    } catch {
      // File might not exist on disk
      console.warn(`File not found on disk: ${asset.filename}`)
    }

    // Delete from database
    await prisma.mediaAsset.delete({
      where: { id: assetId }
    })

    return NextResponse.json({
      success: true,
      message: 'Asset deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting asset:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete asset' 
      },
      { status: 500 }
    )
  }
}