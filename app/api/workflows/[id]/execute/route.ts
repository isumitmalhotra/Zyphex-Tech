/**
 * Workflow Execution API Routes
 * 
 * POST   /api/workflows/[id]/execute     - Manually trigger workflow
 * GET    /api/workflows/[id]/executions  - Get execution history
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { WorkflowEngine } from '@/lib/workflow/workflow-engine'
import { ExecutionContext } from '@/types/workflow'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * POST /api/workflows/[id]/execute
 * Manually trigger workflow execution
 */
export async function POST(
  request: Request,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get workflow
    // @ts-expect-error - workflow model added via Prisma extension
    const workflow = await prisma.workflow.findUnique({
      where: { id: params.id },
    })

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    // Check permissions
    if (
      session.user.role !== 'ADMIN' &&
      session.user.role !== 'SUPER_ADMIN' &&
      workflow.createdBy !== session.user.id
    ) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Parse request body for custom context
    const body = await request.json().catch(() => ({}))

    // Get user context
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    })

    // Build execution context
    const context: ExecutionContext = {
      triggeredBy: 'MANUAL',
      triggerSource: session.user.id,
      entity: body.entity || undefined,
      user: user ? {
        id: user.id,
        email: user.email,
        name: user.name || undefined,
        role: user.role,
      } : undefined,
      timestamp: new Date(),
      metadata: {
        manual: true,
        triggeredByName: session.user.name,
        ...body.metadata,
      },
    }

    // Initialize and execute workflow
    const engine = await WorkflowEngine.getInstance(prisma)
    const result = await engine.executeWorkflow(workflow, context)

    return NextResponse.json({
      message: 'Workflow executed successfully',
      execution: {
        id: result.executionId,
        status: result.status,
        startedAt: result.startedAt,
        completedAt: result.completedAt,
        duration: result.duration,
        actionsExecuted: result.actionsExecuted,
        actionsSuccess: result.actionsSuccess,
        actionsFailed: result.actionsFailed,
      },
      result,
    })
  } catch (error) {
    console.error('Workflow execution error:', error)
    return NextResponse.json(
      { error: 'Failed to execute workflow', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/workflows/[id]/executions
 * Get workflow execution history
 */
export async function GET(
  request: Request,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get workflow
    // @ts-expect-error - workflow model added via Prisma extension
    const workflow = await prisma.workflow.findUnique({
      where: { id: params.id },
    })

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    // Check permissions
    if (
      session.user.role !== 'ADMIN' &&
      session.user.role !== 'SUPER_ADMIN' &&
      workflow.createdBy !== session.user.id
    ) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Filtering
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {
      workflowId: params.id,
    }

    if (status) {
      where.status = status
    }

    // Get executions
    const [executions, total] = await Promise.all([
      // @ts-expect-error - workflowExecution model added via Prisma extension
      prisma.workflowExecution.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          triggeredBy: true,
          triggerSource: true,
          startedAt: true,
          completedAt: true,
          duration: true,
          actionsExecuted: true,
          actionsSuccess: true,
          actionsFailed: true,
          retryCount: true,
          createdAt: true,
        },
      }),
      // @ts-expect-error - workflowExecution model added via Prisma extension
      prisma.workflowExecution.count({ where }),
    ])

    return NextResponse.json({
      executions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Execution history fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch execution history' },
      { status: 500 }
    )
  }
}
