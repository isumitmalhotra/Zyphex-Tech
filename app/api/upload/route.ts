import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { 
  validateFile, 
  scanFileForMalware,
  generateSecureFileUrl 
} from '@/lib/storage/file-security'
import { secureApiRoute } from '@/lib/auth/security-middleware'
import { prisma } from '@/lib/prisma'
import fs from 'fs/promises'
import path from 'path'
const UPLOAD_DIR = path.join(process.cwd(), 'uploads')

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Apply security middleware with rate limiting
    const { error } = await secureApiRoute(request, 'file-upload')
    if (error) {
      return error
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const category = (formData.get('category') as string) || 'document'
    const projectId = formData.get('projectId') as string | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file
    const validation = await validateFile(
      file,
      file.name,
      file.type,
      category as 'image' | 'document' | 'video' | 'default'
    )

    if (!validation.valid) {
      return NextResponse.json(
        { 
          error: 'File validation failed',
          details: validation.errors
        },
        { status: 400 }
      )
    }

    // Ensure upload directory exists
    await fs.mkdir(UPLOAD_DIR, { recursive: true })

    // Save file with sanitized name
    const sanitizedFilename = validation.sanitizedFilename!
    const filePath = path.join(UPLOAD_DIR, sanitizedFilename)
    
    const buffer = Buffer.from(await file.arrayBuffer())
    await fs.writeFile(filePath, buffer)

    // Scan for malware
    const scanResult = await scanFileForMalware(filePath)
    if (!scanResult.safe) {
      // Delete the file
      await fs.unlink(filePath)
      
      return NextResponse.json(
        { 
          error: 'File failed security scan',
          details: scanResult.threat
        },
        { status: 400 }
      )
    }

    // Generate secure URL
    const { url, expiresAt } = generateSecureFileUrl(sanitizedFilename)

    // Save file record to database
    const fileRecord = await prisma.file.create({
      data: {
        filename: sanitizedFilename,
        originalFilename: file.name,
        mimeType: file.type,
        size: file.size,
        category,
        userId: session.user.id,
        projectId: projectId || undefined,
        path: filePath,
        url,
      }
    })

    return NextResponse.json({
      success: true,
      file: {
        id: fileRecord.id,
        filename: sanitizedFilename,
        originalFilename: file.name,
        url,
        expiresAt,
        size: file.size,
        mimeType: file.type,
      }
    })

  } catch (error) {
    console.error('File upload error:', error)
    return NextResponse.json(
      { error: 'File upload failed' },
      { status: 500 }
    )
  }
}
