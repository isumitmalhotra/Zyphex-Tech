import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { verifySecureFileUrl } from '@/lib/storage/file-security'
import fs from 'fs/promises'
import path from 'path'
import { prisma } from '@/lib/prisma'
const UPLOAD_DIR = path.join(process.cwd(), 'uploads')

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')
    const expires = searchParams.get('expires')

    if (!token || !expires) {
      return NextResponse.json(
        { error: 'Invalid file access' },
        { status: 403 }
      )
    }

    // Verify secure URL
    const isValid = verifySecureFileUrl(params.filename, token, expires)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid or expired file access token' },
        { status: 403 }
      )
    }

    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get file record from database
    const fileRecord = await prisma.file.findFirst({
      where: { filename: params.filename }
    })

    if (!fileRecord) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    // Check file access permissions
    const hasAccess = 
      fileRecord.userId === session.user.id ||
      session.user.role === 'SUPER_ADMIN' ||
      session.user.role === 'ADMIN'

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Read and return file
    const filePath = path.join(UPLOAD_DIR, params.filename)
    
    // Check if file exists
    try {
      await fs.access(filePath)
    } catch {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    const fileBuffer = await fs.readFile(filePath)
    const stats = await fs.stat(filePath)

    // Detect MIME type from extension
    const ext = path.extname(params.filename).toLowerCase()
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    }
    const mimeType = mimeTypes[ext] || 'application/octet-stream'

    return new NextResponse(fileBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${params.filename}"`,
        'Content-Length': stats.size.toString(),
        'Cache-Control': 'private, max-age=3600',
      }
    })

  } catch (error) {
    console.error('File download error:', error)
    return NextResponse.json(
      { error: 'File download failed' },
      { status: 500 }
    )
  }
}
