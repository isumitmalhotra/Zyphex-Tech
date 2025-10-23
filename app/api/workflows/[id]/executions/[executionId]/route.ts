/**
 * Workflow Execution Details API
 * 
 * GET /api/workflows/[id]/executions/[executionId] - Get execution details
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: {
    id: string
    executionId: string
  }
}

/**
 * GET /api/workflows/[id]/executions/[executionId]
 * Get detailed execution information including logs
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

    // Get execution with logs
    // @ts-expect-error - workflowExecution model added via Prisma extension
    const execution = await prisma.workflowExecution.findUnique({
      where: { id: params.executionId },
      include: {
        logs: {
          orderBy: { timestamp: 'asc' },
        },
      },
    })

    if (!execution) {
      return NextResponse.json(
        { error: 'Execution not found' },
        { status: 404 }
      )
    }

    // Verify execution belongs to workflow
    if (execution.workflowId !== params.id) {
      return NextResponse.json(
        { error: 'Execution does not belong to this workflow' },
        { status: 400 }
      )
    }

    return NextResponse.json({ execution })
  } catch (error) {
    console.error('Execution details fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch execution details' },
      { status: 500 }
    )
  }
}
