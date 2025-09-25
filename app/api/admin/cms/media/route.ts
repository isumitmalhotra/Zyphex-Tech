// Media Management API
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'
import { APIResponse, PaginatedResponse } from '@/types/cms'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const mediaUploadSchema = z.object({
  alt: z.string().optional(),
  caption: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional()
})

async function checkPermissions() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return { authorized: false, user: null }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, role: true }
  })

  if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
    return { authorized: false, user: null }
  }

  return { authorized: true, user }
}

function createAPIResponse<T>(
  success: boolean,
  data?: T,
  error?: string,
  message?: string
): APIResponse<T> {
  return {
    success,
    data,
    error,
    message,
    timestamp: new Date().toISOString()
  }
}

function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / pageSize)
  
  return {
    data,
    total,
    page,
    pageSize,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  }
}

function generateFileName(originalName: string): string {
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(2, 8)
  const extension = originalName.split('.').pop()
  const cleanName = originalName
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9]/g, '-')
    .toLowerCase()
  
  return `${timestamp}-${randomStr}-${cleanName}.${extension}`
}



// GET /api/admin/cms/media - List media assets
export async function GET(request: NextRequest) {
  try {
    const { authorized } = await checkPermissions()
    if (!authorized) {
      return NextResponse.json(
        createAPIResponse(false, null, 'Unauthorized'),
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '20'), 100)
    const skip = (page - 1) * pageSize
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category')
    const mimeType = searchParams.get('mimeType')

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { originalName: { contains: search, mode: 'insensitive' } },
        { alt: { contains: search, mode: 'insensitive' } },
        { caption: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (category) {
      where.category = category
    }

    if (mimeType) {
      if (mimeType === 'image') {
        where.mimeType = { startsWith: 'image/' }
      } else if (mimeType === 'video') {
        where.mimeType = { startsWith: 'video/' }
      } else if (mimeType === 'document') {
        where.mimeType = { 
          in: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        }
      }
    }

    const [mediaAssets, total] = await Promise.all([
      prisma.mediaAsset.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.mediaAsset.count({ where })
    ])

    const paginatedResponse = createPaginatedResponse(mediaAssets, total, page, pageSize)
    
    return NextResponse.json(createAPIResponse(true, paginatedResponse))
  } catch (error) {
    console.error('Error fetching media assets:', error)
    return NextResponse.json(
      createAPIResponse(false, null, 'Failed to fetch media assets'),
      { status: 500 }
    )
  }
}

// POST /api/admin/cms/media - Upload media file
export async function POST(request: NextRequest) {
  try {
    const { authorized, user } = await checkPermissions()
    if (!authorized) {
      return NextResponse.json(
        createAPIResponse(false, null, 'Unauthorized'),
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const metadata = formData.get('metadata') as string

    if (!file) {
      return NextResponse.json(
        createAPIResponse(false, null, 'No file provided'),
        { status: 400 }
      )
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        createAPIResponse(false, null, 'File size exceeds 10MB limit'),
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'video/mp4', 'video/webm', 'video/ogg',
      'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        createAPIResponse(false, null, 'File type not allowed'),
        { status: 400 }
      )
    }

    // Parse metadata
    let parsedMetadata: { alt?: string; caption?: string; category?: string; tags?: string[] } = {}
    if (metadata) {
      try {
        parsedMetadata = mediaUploadSchema.parse(JSON.parse(metadata))
      } catch {
        return NextResponse.json(
          createAPIResponse(false, null, 'Invalid metadata format'),
          { status: 400 }
        )
      }
    }

    // Generate unique filename
    const fileName = generateFileName(file.name)
    const uploadDir = join(process.cwd(), 'public', 'uploads')
    
    // Ensure upload directory exists
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Save file
    const filePath = join(uploadDir, fileName)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Create database record
    const mediaAsset = await prisma.mediaAsset.create({
      data: {
        filename: fileName,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        url: `/uploads/${fileName}`,
        alt: parsedMetadata.alt || '',
        category: parsedMetadata.category || 'general',
        uploadedBy: user?.id
      }
    })

    return NextResponse.json(
      createAPIResponse(true, mediaAsset, undefined, 'File uploaded successfully'),
      { status: 201 }
    )
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      createAPIResponse(false, null, 'Failed to upload file'),
      { status: 500 }
    )
  }
}

// PUT /api/admin/cms/media?id= - Update media metadata
export async function PUT(request: NextRequest) {
  try {
    const { authorized } = await checkPermissions()
    if (!authorized) {
      return NextResponse.json(
        createAPIResponse(false, null, 'Unauthorized'),
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        createAPIResponse(false, null, 'Media asset ID is required'),
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = mediaUploadSchema.parse(body)

    // Check if media asset exists
    const existingAsset = await prisma.mediaAsset.findUnique({
      where: { id }
    })

    if (!existingAsset) {
      return NextResponse.json(
        createAPIResponse(false, null, 'Media asset not found'),
        { status: 404 }
      )
    }

    // Update media asset
    const updatedAsset = await prisma.mediaAsset.update({
      where: { id },
      data: {
        alt: validatedData.alt || existingAsset.alt,
        category: validatedData.category || existingAsset.category,
        updatedAt: new Date()
      }
    })

    return NextResponse.json(
      createAPIResponse(true, updatedAsset, undefined, 'Media asset updated successfully')
    )
  } catch (error) {
    console.error('Error updating media asset:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        createAPIResponse(false, null, 'Validation error: ' + error.errors.map(e => e.message).join(', ')),
        { status: 400 }
      )
    }
    return NextResponse.json(
      createAPIResponse(false, null, 'Failed to update media asset'),
      { status: 500 }
    )
  }
}

// DELETE /api/admin/cms/media?id= - Delete media asset
export async function DELETE(request: NextRequest) {
  try {
    const { authorized } = await checkPermissions()
    if (!authorized) {
      return NextResponse.json(
        createAPIResponse(false, null, 'Unauthorized'),
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        createAPIResponse(false, null, 'Media asset ID is required'),
        { status: 400 }
      )
    }

    // Check if media asset exists
    const existingAsset = await prisma.mediaAsset.findUnique({
      where: { id }
    })

    if (!existingAsset) {
      return NextResponse.json(
        createAPIResponse(false, null, 'Media asset not found'),
        { status: 404 }
      )
    }

    // Delete file from filesystem (optional - you might want to keep files for backup)
    // const filePath = join(process.cwd(), 'public', 'uploads', existingAsset.filename)
    // if (existsSync(filePath)) {
    //   await unlink(filePath)
    // }

    // Delete from database
    await prisma.mediaAsset.delete({
      where: { id }
    })

    return NextResponse.json(
      createAPIResponse(true, null, undefined, 'Media asset deleted successfully')
    )
  } catch (error) {
    console.error('Error deleting media asset:', error)
    return NextResponse.json(
      createAPIResponse(false, null, 'Failed to delete media asset'),
      { status: 500 }
    )
  }
}