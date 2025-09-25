import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface Task {
  id: string
  title: string
  description: string
  status: 'todo' | 'in-progress' | 'completed' | 'blocked'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  projectId: string
  assignedTo?: string
  dueDate?: string
  estimatedHours?: number
  actualHours?: number
  tags: string[]
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    // Mock tasks data
    const allTasks: Task[] = [
      {
        id: '1',
        title: 'Design System Setup',
        description: 'Create a comprehensive design system with components and tokens',
        status: 'completed',
        priority: 'high',
        projectId: '1',
        assignedTo: 'Jane Smith',
        dueDate: '2024-01-20',
        estimatedHours: 16,
        actualHours: 14,
        tags: ['design', 'foundation'],
        createdAt: '2024-01-10T09:00:00Z',
        updatedAt: '2024-01-18T15:30:00Z',
        completedAt: '2024-01-18T15:30:00Z'
      },
      {
        id: '2',
        title: 'User Authentication System',
        description: 'Implement secure user authentication with OAuth providers',
        status: 'in-progress',
        priority: 'high',
        projectId: '1',
        assignedTo: 'John Doe',
        dueDate: '2024-01-25',
        estimatedHours: 20,
        actualHours: 12,
        tags: ['backend', 'security'],
        createdAt: '2024-01-10T09:15:00Z',
        updatedAt: '2024-01-20T11:45:00Z'
      },
      {
        id: '3',
        title: 'Product Catalog API',
        description: 'Build RESTful API for product management and catalog browsing',
        status: 'todo',
        priority: 'medium',
        projectId: '1',
        assignedTo: 'Mike Johnson',
        dueDate: '2024-02-01',
        estimatedHours: 24,
        tags: ['backend', 'api'],
        createdAt: '2024-01-10T09:30:00Z',
        updatedAt: '2024-01-10T09:30:00Z'
      },
      {
        id: '4',
        title: 'Mobile UI Wireframes',
        description: 'Create detailed wireframes for mobile application screens',
        status: 'completed',
        priority: 'medium',
        projectId: '2',
        assignedTo: 'Sarah Wilson',
        dueDate: '2024-02-05',
        estimatedHours: 12,
        actualHours: 10,
        tags: ['design', 'mobile'],
        createdAt: '2024-01-25T10:00:00Z',
        updatedAt: '2024-02-03T14:20:00Z',
        completedAt: '2024-02-03T14:20:00Z'
      },
      {
        id: '5',
        title: 'Native App Development Setup',
        description: 'Initialize React Native project with necessary dependencies',
        status: 'in-progress',
        priority: 'high',
        projectId: '2',
        assignedTo: 'Tom Brown',
        dueDate: '2024-02-10',
        estimatedHours: 8,
        actualHours: 6,
        tags: ['mobile', 'setup'],
        createdAt: '2024-01-25T10:15:00Z',
        updatedAt: '2024-02-01T16:30:00Z'
      }
    ]

    // Filter tasks by project if specified
    const tasks = projectId 
      ? allTasks.filter(task => task.projectId === projectId)
      : allTasks

    // Calculate task statistics
    const stats = {
      total: tasks.length,
      todo: tasks.filter(t => t.status === 'todo').length,
      inProgress: tasks.filter(t => t.status === 'in-progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      blocked: tasks.filter(t => t.status === 'blocked').length,
      overdue: tasks.filter(t => 
        t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed'
      ).length,
      estimatedHours: tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0),
      actualHours: tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0)
    }

    return NextResponse.json({
      success: true,
      tasks,
      stats,
      projectId
    })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      title, 
      description, 
      projectId, 
      priority = 'medium', 
      dueDate,
      estimatedHours,
      assignedTo,
      tags = []
    } = body

    if (!title || !description || !projectId) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, projectId' },
        { status: 400 }
      )
    }

    // Create new task (mock implementation)
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      description,
      projectId,
      priority,
      status: 'todo',
      dueDate,
      estimatedHours: estimatedHours ? parseInt(estimatedHours) : undefined,
      assignedTo,
      tags: Array.isArray(tags) ? tags : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      message: 'Task created successfully',
      task: newTask
    })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { taskId, ...updates } = body

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      )
    }

    // Update task (mock implementation)
    const updatedTask = {
      id: taskId,
      ...updates,
      updatedAt: new Date().toISOString(),
      ...(updates.status === 'completed' && { completedAt: new Date().toISOString() })
    }

    return NextResponse.json({
      success: true,
      message: 'Task updated successfully',
      task: updatedTask
    })
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    )
  }
}