import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admin can upload images
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const data = await request.formData()
    const file: File | null = data.get('file') as unknown as File
    const category: string = data.get('category') as string || 'general'

    if (!file) {
      return NextResponse.json({ error: 'No file received.' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create unique filename
    const timestamp = Date.now()
    const fileExtension = path.extname(file.name)
    const fileName = `${timestamp}-${Math.random().toString(36).substring(2)}${fileExtension}`
    
    // Create upload directory structure
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', category)
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Write the file
    const filePath = path.join(uploadDir, fileName)
    await writeFile(filePath, buffer)

    // Return the public URL
    const publicUrl = `/uploads/${category}/${fileName}`

    return NextResponse.json({
      message: 'File uploaded successfully',
      url: publicUrl,
      fileName,
      category,
      size: file.size,
      type: file.type
    })

  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}

// GET /api/admin/upload - List uploaded files (optional)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admin can view uploads
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || 'general'

    // This is a basic implementation - in production you might want to store file metadata in the database
    return NextResponse.json({
      message: 'Upload endpoint ready',
      category,
      supportedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      maxSize: '5MB'
    })

  } catch (error) {
    console.error('Error fetching upload info:', error)
    return NextResponse.json(
      { error: 'Failed to fetch upload info' },
      { status: 500 }
    )
  }
}
