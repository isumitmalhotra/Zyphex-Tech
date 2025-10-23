/**
 * Workflow Toggle API
 * 
 * PATCH /api/workflows/[id]/toggle - Enable/disable workflow
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * PATCH /api/workflows/[id]/toggle
 * Quick toggle workflow enabled status
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

    // Parse body for explicit enabled value, or toggle
    const body = await request.json().catch(() => ({}))
    const enabled = body.enabled !== undefined 
      ? body.enabled 
      : !existingWorkflow.enabled

    // Update workflow
    // @ts-expect-error - workflow model added via Prisma extension
    const workflow = await prisma.workflow.update({
      where: { id: params.id },
      data: { enabled },
    })

    return NextResponse.json({
      message: `Workflow ${enabled ? 'enabled' : 'disabled'} successfully`,
      workflow: {
        id: workflow.id,
        name: workflow.name,
        enabled: workflow.enabled,
      },
    })
  } catch (error) {
    console.error('Workflow toggle error:', error)
    return NextResponse.json(
      { error: 'Failed to toggle workflow' },
      { status: 500 }
    )
  }
}
