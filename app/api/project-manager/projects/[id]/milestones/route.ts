import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { MilestoneStatus } from "@prisma/client"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user with role
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    })

    if (!user || user.role !== "PROJECT_MANAGER") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Verify project access
    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        OR: [
          { managerId: user.id },
          { users: { some: { id: user.id } } }
        ]
      }
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Fetch all milestones for the project
    const milestones = await prisma.projectMilestone.findMany({
      where: { projectId: params.id },
      orderBy: { targetDate: 'asc' }
    })

    return NextResponse.json({ milestones })
  } catch (error) {
    console.error("Error fetching milestones:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user with role
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    })

    if (!user || user.role !== "PROJECT_MANAGER") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Verify project access
    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        OR: [
          { managerId: user.id },
          { users: { some: { id: user.id } } }
        ]
      }
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const body = await request.json()
    const {
      title,
      description,
      status,
      targetDate,
      deliverables
    } = body

    // Validate required fields
    if (!title?.trim()) {
      return NextResponse.json(
        { error: "Milestone title is required" },
        { status: 400 }
      )
    }

    // Create new milestone
    const newMilestone = await prisma.projectMilestone.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        status: status as MilestoneStatus || MilestoneStatus.PENDING,
        targetDate: targetDate ? new Date(targetDate) : new Date(),
        deliverables: deliverables ? JSON.stringify(deliverables.split('\n').filter(Boolean)) : undefined,
        projectId: params.id
      }
    })

    return NextResponse.json({ 
      message: "Milestone created successfully",
      milestone: newMilestone 
    })
  } catch (error) {
    console.error("Error creating milestone:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}