/**
 * Workflow API Routes - Single Workflow Operations
 * 
 * GET    /api/workflows/[id]    - Get workflow by ID
 * PUT    /api/workflows/[id]    - Update workflow
 * DELETE /api/workflows/[id]    - Delete workflow
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TriggerType, ActionType } from '@/types/workflow'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * GET /api/workflows/[id]
 * Get single workflow with full details
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

    // @ts-expect-error - workflow model added via Prisma extension
    const workflow = await prisma.workflow.findUnique({
      where: { id: params.id },
      include: {
        executions: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            status: true,
            triggeredBy: true,
            startedAt: true,
            completedAt: true,
            duration: true,
            actionsExecuted: true,
            actionsSuccess: true,
            actionsFailed: true,
          },
        },
      },
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

    // Calculate success rate
    const successRate = workflow.executionCount > 0
      ? (workflow.successCount / workflow.executionCount) * 100
      : 0

    return NextResponse.json({
      ...workflow,
      successRate,
    })
  } catch (error) {
    console.error('Workflow fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workflow' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/workflows/[id]
 * Update workflow
 */
export async function PATCH(
  request: Request,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get existing workflow
    // @ts-expect-error - workflow model added via Prisma extension
    const existingWorkflow = await prisma.workflow.findUnique({
      where: { id: params.id },
    })

    if (!existingWorkflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    // Check permissions
    if (
      session.user.role !== 'ADMIN' &&
      session.user.role !== 'SUPER_ADMIN' &&
      existingWorkflow.createdBy !== session.user.id
    ) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Prepare update data
    const updateData: Record<string, unknown> = {}

    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.enabled !== undefined) updateData.enabled = body.enabled
    if (body.priority !== undefined) updateData.priority = body.priority
    if (body.maxRetries !== undefined) updateData.maxRetries = body.maxRetries
    if (body.retryDelay !== undefined) updateData.retryDelay = body.retryDelay
    if (body.timeout !== undefined) updateData.timeout = body.timeout
    if (body.category !== undefined) updateData.category = body.category
    if (body.tags !== undefined) updateData.tags = body.tags

    // Validate and update triggers if provided
    if (body.triggers !== undefined) {
      if (!Array.isArray(body.triggers) || body.triggers.length === 0) {
        return NextResponse.json(
          { error: 'At least one trigger is required' },
          { status: 400 }
        )
      }

      const validTriggerTypes = Object.values(TriggerType)
      for (const trigger of body.triggers) {
        if (!trigger.type || !validTriggerTypes.includes(trigger.type)) {
          return NextResponse.json(
            { error: `Invalid trigger type: ${trigger.type}` },
            { status: 400 }
          )
        }
      }

      updateData.triggers = body.triggers
      // Increment version if triggers changed
      updateData.version = existingWorkflow.version + 1
    }

    // Validate and update conditions if provided
    if (body.conditions !== undefined) {
      updateData.conditions = body.conditions
    }

    // Validate and update actions if provided
    if (body.actions !== undefined) {
      if (!Array.isArray(body.actions) || body.actions.length === 0) {
        return NextResponse.json(
          { error: 'At least one action is required' },
          { status: 400 }
        )
      }

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

      updateData.actions = body.actions
      // Increment version if actions changed
      updateData.version = existingWorkflow.version + 1
    }

    // Update workflow
    // @ts-expect-error - workflow model added via Prisma extension
    const workflow = await prisma.workflow.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json({
      message: 'Workflow updated successfully',
      workflow,
    })
  } catch (error) {
    console.error('Workflow update error:', error)
    return NextResponse.json(
      { error: 'Failed to update workflow' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/workflows/[id]
 * Delete workflow
 */
export async function DELETE(
  request: Request,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get existing workflow
    // @ts-expect-error - workflow model added via Prisma extension
    const existingWorkflow = await prisma.workflow.findUnique({
      where: { id: params.id },
    })

    if (!existingWorkflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    // Check permissions (only creator or admin can delete)
    if (
      session.user.role !== 'ADMIN' &&
      session.user.role !== 'SUPER_ADMIN' &&
      existingWorkflow.createdBy !== session.user.id
    ) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Delete workflow (cascade will delete executions and logs)
    // @ts-expect-error - workflow model added via Prisma extension
    await prisma.workflow.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      message: 'Workflow deleted successfully',
    })
  } catch (error) {
    console.error('Workflow deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete workflow' },
      { status: 500 }
    )
  }
}
