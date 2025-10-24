import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const document = await prisma.document.findUnique({
      where: { id: params.id },
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
            managerId: true
          }
        }
      }
    })

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Check if user has access
    const hasAccess = 
      document.userId === user.id ||
      document.project?.managerId === user.id ||
      user.role === 'SUPER_ADMIN' ||
      user.role === 'ADMIN'

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Increment download count
    await prisma.document.update({
      where: { id: params.id },
      data: { downloadCount: { increment: 1 } }
    })

    return NextResponse.json({ document })

  } catch (_error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const document = await prisma.document.findUnique({
      where: { id: params.id },
      include: {
        project: {
          select: { managerId: true }
        }
      }
    })

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Check if user has permission to update
    const canUpdate = 
      document.userId === user.id ||
      document.project?.managerId === user.id ||
      user.role === 'SUPER_ADMIN' ||
      user.role === 'ADMIN'

    if (!canUpdate) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await request.json()
    const { description, category, isPublic } = body

    // Update document
    const updatedDocument = await prisma.document.update({
      where: { id: params.id },
      data: {
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
        ...(isPublic !== undefined && { isPublic }),
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

    // Log the activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE',
        entityType: 'DOCUMENT',
        entityId: params.id,
        changes: JSON.stringify({ description, category, isPublic })
      }
    })

    return NextResponse.json({
      message: "Document updated successfully",
      data: updatedDocument
    })

  } catch (_error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const document = await prisma.document.findUnique({
      where: { id: params.id },
      include: {
        project: {
          select: { managerId: true }
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
      where: { id: params.id }
    })

    // Log the activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'DELETE',
        entityType: 'DOCUMENT',
        entityId: params.id,
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
