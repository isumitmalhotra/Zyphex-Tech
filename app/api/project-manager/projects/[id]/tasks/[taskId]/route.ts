import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { TaskStatus, Priority } from "@prisma/client"

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; taskId: string } }
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

    // Verify project and task access
    const task = await prisma.task.findFirst({
      where: {
        id: params.taskId,
        projectId: params.id,
        project: {
          OR: [
            { managerId: user.id },
            { users: { some: { id: user.id } } }
          ]
        }
      }
    })

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    const body = await request.json()
    const {
      title,
      description,
      status,
      priority,
      progress,
      startDate,
      dueDate,
      estimatedHours,
      assigneeId
    } = body

    // Update task
    const updatedTask = await prisma.task.update({
      where: { id: params.taskId },
      data: {
        title: title?.trim() || task.title,
        description: description?.trim() || task.description,
        status: status as TaskStatus || task.status,
        priority: priority as Priority || task.priority,
        progress: progress !== undefined ? Math.min(Math.max(progress, 0), 100) : task.progress,
        startDate: startDate ? new Date(startDate) : task.startDate,
        dueDate: dueDate ? new Date(dueDate) : task.dueDate,
        estimatedHours: estimatedHours !== undefined ? estimatedHours : task.estimatedHours,
        assigneeId: assigneeId !== undefined ? assigneeId : task.assigneeId,
        updatedAt: new Date()
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({ 
      message: "Task updated successfully",
      task: updatedTask 
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
  { params }: { params: { id: string; taskId: string } }
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

    // Verify project and task access
    const task = await prisma.task.findFirst({
      where: {
        id: params.taskId,
        projectId: params.id,
        project: {
          OR: [
            { managerId: user.id },
            { users: { some: { id: user.id } } }
          ]
        }
      }
    })

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Delete task
    await prisma.task.delete({
      where: { id: params.taskId }
    })

    return NextResponse.json({ 
      message: "Task deleted successfully" 
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}