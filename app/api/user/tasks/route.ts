import { NextResponse, NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schema for task updates
const updateTaskSchema = z.object({
  taskId: z.string().uuid("Invalid task ID"),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  progress: z.number().min(0).max(100).optional(),
  dueDate: z.string().datetime().optional().nullable()
})

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const projectId = searchParams.get('projectId')
    const search = searchParams.get('search')

    // Build where conditions
    const whereConditions: any = {
      OR: [
        { assigneeId: session.user.id },
        { createdBy: session.user.id },
        { project: { users: { some: { id: session.user.id } } } }
      ]
    }

    if (status) {
      whereConditions.status = status.toUpperCase()
    }

    if (priority) {
      whereConditions.priority = priority.toUpperCase()
    }

    if (projectId) {
      whereConditions.projectId = projectId
    }

    if (search) {
      whereConditions.AND = [
        { OR: whereConditions.OR },
        {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } }
          ]
        }
      ]
      delete whereConditions.OR
    }

    const tasks = await prisma.task.findMany({
      where: whereConditions,
      include: {
        project: { 
          include: { 
            client: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        assignee: { select: { id: true, name: true, email: true, role: true } },
        creator: { select: { id: true, name: true, email: true, role: true } },
        timeEntries: {
          select: {
            id: true,
            hours: true,
            date: true,
            description: true
          },
          orderBy: { date: 'desc' },
          take: 5
        },
        _count: {
          select: {
            timeEntries: true
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    // Calculate additional statistics
    const tasksWithStats = tasks.map(task => {
      const totalHours = task.timeEntries.reduce((sum, entry) => 
        sum + parseFloat(entry.hours?.toString() || '0'), 0
      )
      
      return {
        ...task,
        stats: {
          totalTimeEntries: task._count.timeEntries,
          totalHours: Math.round(totalHours * 100) / 100,
          estimatedProgress: task.estimatedHours && totalHours 
            ? Math.min(Math.round((totalHours / task.estimatedHours) * 100), 100)
            : null,
          isOverdue: task.dueDate && task.status !== 'DONE' 
            ? new Date(task.dueDate) < new Date()
            : false
        }
      }
    })

    // Calculate summary statistics
    const summary = {
      total: tasksWithStats.length,
      todo: tasksWithStats.filter(t => t.status === 'TODO').length,
      inProgress: tasksWithStats.filter(t => t.status === 'IN_PROGRESS').length,
      review: tasksWithStats.filter(t => t.status === 'REVIEW').length,
      done: tasksWithStats.filter(t => t.status === 'DONE').length,
      overdue: tasksWithStats.filter(t => t.stats.isOverdue).length,
      completionRate: tasksWithStats.length > 0 
        ? Math.round((tasksWithStats.filter(t => t.status === 'DONE').length / tasksWithStats.length) * 100)
        : 0
    }

    return NextResponse.json({ 
      tasks: tasksWithStats,
      summary
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const rawBody = await request.json()
    const validationResult = updateTaskSchema.safeParse(rawBody)
    
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: "Validation failed", 
        details: validationResult.error.format() 
      }, { status: 400 })
    }

    const { taskId, status, priority, progress, dueDate } = validationResult.data

    // Check if user has permission to update this task
    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        OR: [
          { assigneeId: session.user.id },
          { createdBy: session.user.id },
          { project: { users: { some: { id: session.user.id } } } }
        ]
      }
    })

    if (!existingTask) {
      return NextResponse.json({ 
        error: 'Task not found or access denied' 
      }, { status: 404 })
    }

    // Update task
    const updateData: any = {}
    if (status !== undefined) updateData.status = status
    if (priority !== undefined) updateData.priority = priority
    if (progress !== undefined) updateData.progress = progress
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null
    
    // Set completion date if task is marked as done
    if (status === 'DONE' && existingTask.status !== 'DONE') {
      updateData.completedAt = new Date()
    } else if (status !== 'DONE' && existingTask.status === 'DONE') {
      updateData.completedAt = null
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        project: { 
          include: { 
            client: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        assignee: { select: { id: true, name: true, email: true, role: true } },
        creator: { select: { id: true, name: true, email: true, role: true } }
      }
    })

    // Log the task update activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        entityType: 'TASK',
        entityId: taskId,
        changes: JSON.stringify({ 
          updated: updateData,
          taskTitle: updatedTask.title
        })
      }
    })

    return NextResponse.json({ 
      message: 'Task updated successfully',
      task: updatedTask
    })
  } catch (error: any) {
    
    // Handle Prisma-specific errors
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
