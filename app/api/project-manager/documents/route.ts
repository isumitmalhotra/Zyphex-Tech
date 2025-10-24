import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Validation schema for document upload/creation
const createDocumentSchema = z.object({
  filename: z.string().min(1, "Filename is required").max(255, "Filename too long"),
  originalName: z.string().min(1, "Original name is required").max(255, "Original name too long"),
  filePath: z.string().min(1, "File path is required"),
  fileSize: z.number().positive("File size must be positive").max(50 * 1024 * 1024, "File too large"),
  mimeType: z.string().min(1, "MIME type is required"),
  projectId: z.string().uuid("Invalid project ID").optional(),
  category: z.string().max(100, "Category too long").optional(),
  description: z.string().max(1000, "Description too long").optional(),
  folderId: z.string().uuid("Invalid folder ID").optional(),
  tags: z.array(z.string()).optional(),
  isStarred: z.boolean().optional(),
})

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Verify user is a project manager
    if (user.role !== 'PROJECT_MANAGER' && user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const mimeType = searchParams.get('mimeType')
    const _folderId = searchParams.get('folderId') // Future use for folder structure
    const _tags = searchParams.get('tags') // Future use for tag filtering
    const starred = searchParams.get('starred')

    // Build where conditions - project managers see all project documents they manage
    const managedProjects = await prisma.project.findMany({
      where: {
        OR: [
          { managerId: user.id },
          { users: { some: { id: user.id } } }
        ]
      },
      select: { id: true }
    })

    const managedProjectIds = managedProjects.map(p => p.id)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereConditions: any = {
      OR: [
        { userId: user.id },
        { projectId: { in: managedProjectIds } }
      ]
    }

    if (projectId) {
      whereConditions.projectId = projectId
    }

    if (category) {
      whereConditions.category = category
    }

    if (mimeType) {
      whereConditions.mimeType = { contains: mimeType, mode: 'insensitive' }
    }

    if (starred === 'true') {
      // Note: This requires a schema update to add isStarred field
      // For now, we'll skip this filter
    }

    if (search) {
      whereConditions.AND = [
        { OR: whereConditions.OR },
        {
          OR: [
            { filename: { contains: search, mode: 'insensitive' } },
            { originalName: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } }
          ]
        }
      ]
      delete whereConditions.OR
    }

    // Get documents from database
    const documents = await prisma.document.findMany({
      where: whereConditions,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true
          }
        },
        project: {
          select: {
            id: true,
            name: true,
            status: true,
            client: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculate document statistics
    const userUploaded = documents.filter(d => d.userId === user.id)
    const sharedWithUser = documents.filter(d => d.userId !== user.id)
    
    const byCategory = documents.reduce((acc, doc) => {
      const cat = doc.category || 'uncategorized'
      acc[cat] = (acc[cat] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const byMimeType = documents.reduce((acc, doc) => {
      const type = doc.mimeType.split('/')[0] || 'unknown'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const byProject = documents.reduce((acc, doc) => {
      if (doc.project) {
        acc[doc.project.name] = (acc[doc.project.name] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    // Calculate total file size
    const totalSize = documents.reduce((sum, doc) => sum + doc.fileSize, 0)
    const avgFileSize = documents.length > 0 ? Math.round(totalSize / documents.length) : 0

    // Get recent documents (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const recentCount = documents.filter(d => d.createdAt >= thirtyDaysAgo).length

    return NextResponse.json({
      documents,
      stats: {
        total: documents.length,
        uploaded: userUploaded.length,
        shared: sharedWithUser.length,
        recent: recentCount,
        totalSize,
        avgFileSize,
        byCategory,
        byMimeType,
        byProject,
        largestFile: documents.length > 0 
          ? Math.max(...documents.map(d => d.fileSize))
          : 0
      }
    })

  } catch (_error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Verify user is a project manager
    if (user.role !== 'PROJECT_MANAGER' && user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const projectId = formData.get('projectId') as string
    const category = formData.get('category') as string
    const description = formData.get('description') as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ 
        error: "File too large. Maximum size is 50MB" 
      }, { status: 400 })
    }

    // Validate project access if project specified
    if (projectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          OR: [
            { managerId: user.id },
            { users: { some: { id: user.id } } }
          ]
        }
      })
      
      if (!project) {
        return NextResponse.json({ 
          error: "Project not found or access denied" 
        }, { status: 403 })
      }
    }

    // Convert file to buffer for storage (in production, upload to cloud storage)
    const bytes = await file.arrayBuffer()
    const _buffer = Buffer.from(bytes) // Reserved for future cloud storage upload
    
    // For now, we'll store the file path as a placeholder
    // In production, you'd upload to AWS S3, Google Cloud Storage, etc.
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filePath = `/uploads/${timestamp}-${sanitizedName}`
    
    // Check if document with same name already exists for user in same project
    const existingDocument = await prisma.document.findFirst({
      where: {
        originalName: file.name,
        userId: user.id,
        projectId: projectId || null
      }
    })

    if (existingDocument) {
      return NextResponse.json({
        error: "Document with this name already exists in this context. Consider versioning."
      }, { status: 409 })
    }

    // Validate the document data
    const documentData = {
      filename: sanitizedName,
      originalName: file.name,
      filePath: filePath,
      fileSize: file.size,
      mimeType: file.type,
      projectId: projectId || null,
      category: category || 'general',
      description: description || `Uploaded by ${user.name || user.email}`
    }

    const validationResult = createDocumentSchema.safeParse(documentData)
    
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: "Validation failed", 
        details: validationResult.error.format() 
      }, { status: 400 })
    }

    // Create document record in database
    const newDocument = await prisma.document.create({
      data: {
        ...validationResult.data,
        userId: user.id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true
          }
        },
        project: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      }
    })

    // Log the document upload activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        entityType: 'DOCUMENT',
        entityId: newDocument.id,
        changes: JSON.stringify({ 
          filename: newDocument.filename,
          fileSize: newDocument.fileSize,
          mimeType: newDocument.mimeType,
          category: newDocument.category,
          projectId: projectId
        })
      }
    })

    return NextResponse.json({
      message: "Document uploaded successfully",
      data: newDocument
    }, { status: 201 })

  } catch (error: unknown) {
    // Handle Prisma-specific errors
    const prismaError = error as { code?: string }
    if (prismaError.code === 'P2002') {
      return NextResponse.json(
        { error: "Document with this name already exists" },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('id')

    if (!documentId) {
      return NextResponse.json({ error: "Document ID required" }, { status: 400 })
    }

    // Find document and verify permissions
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        project: {
          select: {
            managerId: true
          }
        }
      }
    })

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Check if user has permission to delete
    const canDelete = 
      document.userId === user.id || 
      document.project?.managerId === user.id ||
      user.role === 'SUPER_ADMIN' ||
      user.role === 'ADMIN'

    if (!canDelete) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    // Delete the document
    await prisma.document.delete({
      where: { id: documentId }
    })

    // Log the activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'DELETE',
        entityType: 'DOCUMENT',
        entityId: documentId,
        changes: JSON.stringify({ 
          filename: document.filename,
          projectId: document.projectId
        })
      }
    })

    return NextResponse.json({
      message: "Document deleted successfully"
    })

  } catch (_error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
