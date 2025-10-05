import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { TaskStatus } from "@prisma/client"

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

    // Fetch project with all related data
    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        OR: [
          { managerId: user.id },
          { users: { some: { id: user.id } } }
        ]
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
            phone: true
          }
        },
        manager: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        tasks: {
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            tasks: true
          }
        }
      }
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Calculate project statistics
    const totalTasks = project.tasks.length
    const completedTasks = project.tasks.filter(task => task.status === TaskStatus.DONE).length
    const inProgressTasks = project.tasks.filter(task => task.status === TaskStatus.IN_PROGRESS).length
    const todoTasks = project.tasks.filter(task => task.status === TaskStatus.TODO).length
    const overdueTasks = project.tasks.filter(task => 
      task.dueDate && new Date(task.dueDate) < new Date() && task.status !== TaskStatus.DONE
    ).length

    const projectWithStats = {
      ...project,
      stats: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        todoTasks,
        overdueTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      }
    }

    return NextResponse.json({ project: projectWithStats })
  } catch (error) {
    console.error("Error fetching project:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
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
    const existingProject = await prisma.project.findFirst({
      where: {
        id: params.id,
        OR: [
          { managerId: user.id },
          { users: { some: { id: user.id } } }
        ]
      }
    })

    if (!existingProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const body = await request.json()
    const {
      name,
      description,
      status,
      priority,
      budget,
      hourlyRate,
      startDate,
      endDate,
      clientId,
      managedById,
      assignedUserIds
    } = body

    // Build update data conditionally
    const updateData: any = {
      updatedAt: new Date()
    }

    if (name) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (status) updateData.status = status
    if (priority) updateData.priority = priority
    if (budget) updateData.budget = parseFloat(budget)
    if (hourlyRate) updateData.hourlyRate = parseFloat(hourlyRate)
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null
    if (clientId) updateData.clientId = clientId
    if (managedById !== undefined) updateData.managerId = managedById || null
    if (assignedUserIds && assignedUserIds.length > 0) {
      updateData.users = { set: assignedUserIds.map((id: string) => ({ id })) }
    }

    // Update project
    const updatedProject = await prisma.project.update({
      where: { id: params.id },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true
          }
        },
        manager: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
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
      message: "Project updated successfully",
      project: updatedProject 
    })
  } catch (error) {
    console.error("Error updating project:", error)
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

    // Verify project access (only project manager can delete)
    const existingProject = await prisma.project.findFirst({
      where: {
        id: params.id,
        managerId: user.id // Only the project manager can delete
      }
    })

    if (!existingProject) {
      return NextResponse.json({ 
        error: "Project not found or access denied" 
      }, { status: 404 })
    }

    // Delete project (this will cascade delete tasks due to onDelete: Cascade)
    await prisma.project.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ 
      message: "Project deleted successfully" 
    })
  } catch (error) {
    console.error("Error deleting project:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}