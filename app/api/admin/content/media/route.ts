import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createStorageAdapter, getStorageConfig } from '@/lib/storage'
import sharp from 'sharp'

// Helper function to process file buffer from FormData
async function processFormData(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File
  const alt = formData.get('alt') as string
  const category = formData.get('category') as string

  if (!file) {
    throw new Error('No file provided')
  }

  // Convert File to Buffer
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  return {
    file: {
      buffer,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
    },
    metadata: {
      alt: alt || undefined,
      category: category || undefined,
    }
  }
}

// Helper function to optimize images
async function optimizeImage(buffer: Buffer, mimeType: string): Promise<Buffer> {
  if (!mimeType.startsWith('image/')) {
    return buffer
  }

  try {
    return await sharp(buffer)
      .resize(2000, 2000, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .jpeg({ quality: 85 })
      .toBuffer()
  } catch (error) {
    console.error('Image optimization failed:', error)
    return buffer
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const mimeType = searchParams.get('mimeType')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build filter object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}
    if (category) where.category = category
    if (mimeType) where.mimeType = { contains: mimeType }

    // Get media assets with filters
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [mediaAssets, totalCount] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prisma as any).mediaAsset.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          uploadedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        }
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prisma as any).mediaAsset.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: mediaAssets,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    })

  } catch (error) {
    console.error('Media GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch media assets' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    // Process form data
    const { file, metadata } = await processFormData(request)

    // Validate file size and type
    const config = getStorageConfig()
    
    if (file.size > config.maxFileSize) {
      return NextResponse.json(
        { error: `File size exceeds limit of ${config.maxFileSize / (1024 * 1024)}MB` },
        { status: 413 }
      )
    }

    if (!config.allowedTypes.includes(file.mimeType)) {
      return NextResponse.json(
        { error: `File type ${file.mimeType} is not allowed` },
        { status: 415 }
      )
    }

    // Optimize image if applicable
    const optimizedBuffer = await optimizeImage(file.buffer, file.mimeType)

    // Upload to storage
    const storageAdapter = createStorageAdapter()
    const uploadResult = await storageAdapter.upload(optimizedBuffer, {
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: optimizedBuffer.length,
    })

    // Save to database
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mediaAsset = await (prisma as any).mediaAsset.create({
      data: {
        filename: uploadResult.filename,
        originalName: uploadResult.originalName,
        mimeType: uploadResult.mimeType,
        size: uploadResult.size,
        url: uploadResult.url,
        alt: metadata.alt,
        category: metadata.category,
        uploadedBy: session.user.id,
      },
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
      data: mediaAsset,
      message: 'Media asset uploaded successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Media POST error:', error)
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload media asset' },
      { status: 500 }
    )
  }
}
