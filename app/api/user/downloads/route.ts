import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const featured = searchParams.get('featured')
    const fileType = searchParams.get('fileType')

    // Build where conditions
    const whereConditions: Record<string, unknown> = {
      isActive: true
    }

    if (category && category !== 'All') {
      whereConditions.category = category
    }

    if (fileType) {
      whereConditions.fileType = fileType
    }

    if (featured === 'true') {
      whereConditions.featured = true
    }

    if (search) {
      whereConditions.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get downloadable resources from database
    const resources = await prisma.downloadableResource.findMany({
      where: whereConditions,
      orderBy: [
        { featured: 'desc' },
        { downloads: 'desc' },
        { updatedAt: 'desc' }
      ]
    })

    // Calculate statistics
    const stats = {
      total: resources.length,
      featured: resources.filter(r => r.featured).length,
      totalDownloads: resources.reduce((sum, r) => sum + r.downloads, 0),
      totalSize: resources.reduce((sum, r) => sum + r.fileSize, 0),
      avgRating: resources.length > 0
        ? resources.reduce((sum, r) => sum + (r.rating || 0), 0) / resources.length
        : 0,
      byCategory: resources.reduce((acc, resource) => {
        acc[resource.category] = (acc[resource.category] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      byFileType: resources.reduce((acc, resource) => {
        acc[resource.fileType] = (acc[resource.fileType] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      recent: resources.filter(r => {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return r.updatedAt >= weekAgo
      }).length
    }

    return NextResponse.json({
      resources,
      stats,
      success: true
    })

  } catch (error) {
    console.error('Error fetching downloadable resources:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - Create new downloadable resource (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const {
      title,
      description,
      category,
      fileType,
      fileName,
      filePath,
      fileSize,
      featured
    } = await request.json()

    if (!title || !description || !category || !fileType || !fileName || !filePath || !fileSize) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const resource = await prisma.downloadableResource.create({
      data: {
        title,
        description,
        category,
        fileType,
        fileName,
        filePath,
        fileSize,
        featured: featured || false
      }
    })

    return NextResponse.json({
      success: true,
      resource
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating downloadable resource:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT - Update downloadable resource (admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id, ...updateData } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: "Resource ID is required" },
        { status: 400 }
      )
    }

    const resource = await prisma.downloadableResource.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      resource
    })

  } catch (error) {
    console.error('Error updating downloadable resource:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Track download (increment counter)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: "Resource ID is required" },
        { status: 400 }
      )
    }

    // Increment download counter
    const resource = await prisma.downloadableResource.update({
      where: { id },
      data: {
        downloads: {
          increment: 1
        }
      }
    })

    return NextResponse.json({
      success: true,
      downloads: resource.downloads
    })

  } catch (error) {
    console.error('Error tracking download:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
