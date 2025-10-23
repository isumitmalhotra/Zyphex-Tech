/**
 * Workflow Test API
 * 
 * POST /api/workflows/[id]/test - Test workflow with mock data
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { WorkflowEngine } from '@/lib/workflow/workflow-engine'
import { TriggerEvaluator } from '@/lib/workflow/trigger-evaluator'
import { ConditionEvaluator } from '@/lib/workflow/condition-evaluator'
import { ExecutionContext, TriggerConfig, ConditionTree } from '@/types/workflow'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * POST /api/workflows/[id]/test
 * Test workflow execution with mock data (dry run)
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

    // Parse test context
    const body = await request.json()

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

    // Build test execution context
    const context: ExecutionContext = {
      triggeredBy: 'TEST',
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
        test: true,
        testMode: true,
        ...body.metadata,
      },
    }

    // Initialize evaluators
    const _engine = await WorkflowEngine.getInstance(prisma)
    const triggerEvaluator = new TriggerEvaluator(prisma)
    const conditionEvaluator = new ConditionEvaluator()

    // Test trigger evaluation
    const triggerResults = []
    const triggers = workflow.triggers as TriggerConfig[]
    
    for (const trigger of triggers) {
      const triggerResult = await triggerEvaluator.evaluate([trigger], context)
      triggerResults.push({
        trigger: trigger.type,
        matched: triggerResult,
      })
    }

    const anyTriggerMatched = triggerResults.some(r => r.matched)

    // Test condition evaluation
    let conditionResult = null
    let conditionsPassed = true

    if (workflow.conditions) {
      conditionResult = await conditionEvaluator.evaluate(
        workflow.conditions as ConditionTree,
        context
      )
      conditionsPassed = conditionResult
    }

    // Simulate action execution (without actually executing)
    const actions = workflow.actions as Array<Record<string, unknown>>
    const actionSimulations = actions.map((action: Record<string, unknown>) => ({
      type: action.type,
      order: action.order || 0,
      config: action.config,
      willExecute: anyTriggerMatched && conditionsPassed,
    }))

    // Determine if workflow would execute
    const wouldExecute = anyTriggerMatched && conditionsPassed

    return NextResponse.json({
      testResult: {
        wouldExecute,
        triggerMatched: anyTriggerMatched,
        conditionsPassed,
      },
      evaluation: {
        triggers: triggerResults,
        conditions: conditionResult !== null ? {
          result: conditionResult,
          config: workflow.conditions,
        } : null,
        actions: actionSimulations,
      },
      context: {
        triggeredBy: context.triggeredBy,
        entity: context.entity,
        user: context.user ? {
          id: context.user.id,
          name: context.user.name,
          email: context.user.email,
        } : null,
      },
      workflow: {
        id: workflow.id,
        name: workflow.name,
        enabled: workflow.enabled,
        version: workflow.version,
      },
      notes: [
        'This is a test execution - no actions were actually performed',
        wouldExecute
          ? 'Workflow would execute with this context'
          : 'Workflow would NOT execute with this context',
        !anyTriggerMatched && 'No triggers matched',
        !conditionsPassed && 'Conditions not met',
      ].filter(Boolean),
    })
  } catch (error) {
    console.error('Workflow test error:', error)
    return NextResponse.json(
      { error: 'Failed to test workflow', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
