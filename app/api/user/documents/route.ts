import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
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

    // Mock documents data - in real app, you'd have a Document model
    const mockDocuments = [
      {
        id: "1",
        name: "Project Requirements.pdf",
        size: "2.4 MB",
        type: "pdf",
        category: "requirements",
        uploadedAt: "2025-09-15T10:30:00Z",
        projectId: "1",
        projectName: "E-commerce Website"
      },
      {
        id: "2",
        name: "Design Mockups.figma",
        size: "15.2 MB", 
        type: "design",
        category: "design",
        uploadedAt: "2025-09-18T14:20:00Z",
        projectId: "1",
        projectName: "E-commerce Website"
      },
      {
        id: "3",
        name: "Contract Agreement.pdf",
        size: "1.8 MB",
        type: "pdf", 
        category: "contracts",
        uploadedAt: "2025-09-10T09:15:00Z",
        projectId: "2",
        projectName: "Mobile App Development"
      },
      {
        id: "4",
        name: "API Documentation.md",
        size: "856 KB",
        type: "document",
        category: "documentation",
        uploadedAt: "2025-09-20T16:45:00Z",
        projectId: "2",
        projectName: "Mobile App Development"
      }
    ]

    return NextResponse.json({
      documents: mockDocuments,
      success: true
    })

  } catch (error) {
    console.error("Error fetching documents:", error)
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

    const formData = await request.formData()
    const file = formData.get('file') as File
    const projectId = formData.get('projectId') as string
    const category = formData.get('category') as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Mock file upload - in real app, you'd upload to cloud storage
    const newDocument = {
      id: Date.now().toString(),
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      type: file.type.includes('pdf') ? 'pdf' : 'document',
      category: category || 'general',
      uploadedAt: new Date().toISOString(),
      projectId: projectId || null,
      projectName: projectId ? "Associated Project" : null,
      userId: user.id
    }

    return NextResponse.json({
      document: newDocument,
      success: true
    }, { status: 201 })

  } catch (error) {
    console.error("Error uploading document:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}