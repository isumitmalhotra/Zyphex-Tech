/**
 * Workflow API Routes - Main CRUD Operations
 * 
 * GET    /api/workflows         - List all workflows with filtering
 * POST   /api/workflows         - Create new workflow
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TriggerType, ActionType } from '@/types/workflow'

/**
 * GET /api/workflows
 * List workflows with filtering and pagination
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Filtering
    const enabled = searchParams.get('enabled')
    const category = searchParams.get('category')
    const _triggerType = searchParams.get('triggerType')
    const search = searchParams.get('search')

    // Build where clause
    const where: Record<string, unknown> = {}

    // Only show workflows created by user (unless admin/super-admin)
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      where.createdBy = session.user.id
    }

    if (enabled !== null) {
      where.enabled = enabled === 'true'
    }

    if (category) {
      where.category = category
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Get workflows
    const [workflows, total] = await Promise.all([
      // @ts-expect-error - workflow model added via Prisma extension
      prisma.workflow.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
        select: {
          id: true,
          name: true,
          description: true,
          enabled: true,
          version: true,
          triggers: true,
          priority: true,
          executionCount: true,
          successCount: true,
          failureCount: true,
          lastExecutionAt: true,
          avgExecutionMs: true,
          category: true,
          tags: true,
          createdBy: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      // @ts-expect-error - workflow model added via Prisma extension
      prisma.workflow.count({ where }),
    ])

    // Calculate success rate
    const workflowsWithStats = workflows.map((workflow: {
      executionCount: number;
      successCount: number;
      [key: string]: unknown;
    }) => ({
      ...workflow,
      successRate: workflow.executionCount > 0
        ? (workflow.successCount / workflow.executionCount) * 100
        : 0,
    }))

    return NextResponse.json({
      workflows: workflowsWithStats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Workflow list error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workflows' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/workflows
 * Create new workflow
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admin/super-admin can create workflows
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.triggers || !body.actions) {
      return NextResponse.json(
        { error: 'Missing required fields: name, triggers, actions' },
        { status: 400 }
      )
    }

    // Validate triggers
    if (!Array.isArray(body.triggers) || body.triggers.length === 0) {
      return NextResponse.json(
        { error: 'At least one trigger is required' },
        { status: 400 }
      )
    }

    // Validate trigger types
    const validTriggerTypes = Object.values(TriggerType)
    for (const trigger of body.triggers) {
      if (!trigger.type || !validTriggerTypes.includes(trigger.type)) {
        return NextResponse.json(
          { error: `Invalid trigger type: ${trigger.type}` },
          { status: 400 }
        )
      }
    }

    // Validate actions
    if (!Array.isArray(body.actions) || body.actions.length === 0) {
      return NextResponse.json(
        { error: 'At least one action is required' },
        { status: 400 }
      )
    }

    // Validate action types
    const validActionTypes = Object.values(ActionType)
    for (const action of body.actions) {
      if (!action.type || !validActionTypes.includes(action.type)) {
        return NextResponse.json(
          { error: `Invalid action type: ${action.type}` },
          { status: 400 }
        )
      }

      if (!action.config) {
        return NextResponse.json(
          { error: 'Action config is required' },
          { status: 400 }
        )
      }
    }

    // Create workflow
    // @ts-expect-error - workflow model added via Prisma extension
    const workflow = await prisma.workflow.create({
      data: {
        name: body.name,
        description: body.description || null,
        enabled: body.enabled !== undefined ? body.enabled : false,
        version: 1,
        triggers: body.triggers,
        conditions: body.conditions || null,
        actions: body.actions,
        priority: body.priority || 0,
        maxRetries: body.maxRetries || 3,
        retryDelay: body.retryDelay || 60,
        timeout: body.timeout || 300,
        category: body.category || null,
        tags: body.tags || [],
        createdBy: session.user.id,
      },
    })

    return NextResponse.json({
      message: 'Workflow created successfully',
      workflow,
    }, { status: 201 })
  } catch (error) {
    console.error('Workflow creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create workflow' },
      { status: 500 }
    )
  }
}
