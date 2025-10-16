import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { MilestoneStatus } from "@prisma/client"

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; milestoneId: string } }
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

    // Verify project and milestone access
    const milestone = await prisma.projectMilestone.findFirst({
      where: {
        id: params.milestoneId,
        projectId: params.id,
        project: {
          OR: [
            { managerId: user.id },
            { users: { some: { id: user.id } } }
          ]
        }
      }
    })

    if (!milestone) {
      return NextResponse.json({ error: "Milestone not found" }, { status: 404 })
    }

    const body = await request.json()
    const {
      title,
      description,
      status,
      targetDate,
      deliverables
    } = body

    // Update milestone
    const updatedMilestone = await prisma.projectMilestone.update({
      where: { id: params.milestoneId },
      data: {
        title: title?.trim() || milestone.title,
        description: description?.trim() || milestone.description,
        status: status as MilestoneStatus || milestone.status,
        targetDate: targetDate ? new Date(targetDate) : milestone.targetDate,
        ...(deliverables !== undefined && { 
          deliverables: deliverables ? JSON.stringify(deliverables.split('\n').filter(Boolean)) : undefined 
        }),
        actualDate: status === MilestoneStatus.COMPLETED && milestone.status !== MilestoneStatus.COMPLETED 
          ? new Date() 
          : milestone.actualDate,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ 
      message: "Milestone updated successfully",
      milestone: updatedMilestone 
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
  { params }: { params: { id: string; milestoneId: string } }
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

    // Verify project and milestone access
    const milestone = await prisma.projectMilestone.findFirst({
      where: {
        id: params.milestoneId,
        projectId: params.id,
        project: {
          OR: [
            { managerId: user.id },
            { users: { some: { id: user.id } } }
          ]
        }
      }
    })

    if (!milestone) {
      return NextResponse.json({ error: "Milestone not found" }, { status: 404 })
    }

    // Delete milestone
    await prisma.projectMilestone.delete({
      where: { id: params.milestoneId }
    })

    return NextResponse.json({ 
      message: "Milestone deleted successfully" 
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}