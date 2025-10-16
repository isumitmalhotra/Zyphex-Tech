import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

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
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      )
    }

    // Check if user exists and is not a client
    const targetUser = await prisma.user.findFirst({
      where: {
        id: userId,
        role: { not: 'CLIENT' }
      }
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found or invalid role" },
        { status: 404 }
      )
    }

    // Check if user is already in the project
    const existingAssignment = await prisma.project.findFirst({
      where: {
        id: params.id,
        users: { some: { id: userId } }
      }
    })

    if (existingAssignment) {
      return NextResponse.json(
        { error: "User is already assigned to this project" },
        { status: 400 }
      )
    }

    // Add user to project
    const updatedProject = await prisma.project.update({
      where: { id: params.id },
      data: {
        users: {
          connect: { id: userId }
        }
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    })

    return NextResponse.json({ 
      message: "Team member added successfully",
      project: updatedProject 
    })
  } catch (error) {
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
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      )
    }

    // Cannot remove project manager
    if (userId === project.managerId) {
      return NextResponse.json(
        { error: "Cannot remove project manager from project" },
        { status: 400 }
      )
    }

    // Remove user from project
    const updatedProject = await prisma.project.update({
      where: { id: params.id },
      data: {
        users: {
          disconnect: { id: userId }
        }
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    })

    // Also unassign any tasks assigned to this user
    await prisma.task.updateMany({
      where: {
        projectId: params.id,
        assigneeId: userId
      },
      data: {
        assigneeId: null
      }
    })

    return NextResponse.json({ 
      message: "Team member removed successfully",
      project: updatedProject 
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}