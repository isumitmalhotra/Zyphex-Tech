/**
 * Workflow Webhook API
 * 
 * POST /api/workflows/[id]/webhook
 * 
 * Trigger a workflow via webhook. This allows external systems to trigger
 * workflows programmatically.
 * 
 * Authentication: Requires valid API key or session
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { triggerWebhookWorkflows } from '@/lib/workflow'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    
    if (!session) {
      // Check for API key in headers
      const apiKey = request.headers.get('x-api-key')
      
      if (!apiKey) {
        return NextResponse.json(
          { error: 'Unauthorized - API key or session required' },
          { status: 401 }
        )
      }
      
      // TODO: Validate API key against database
      // For now, accept any API key (implement proper validation later)
    }

    const workflowId = params.id

    // Verify workflow exists and is enabled
    // @ts-expect-error - workflow model added via Prisma extension
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      select: {
        id: true,
        name: true,
        enabled: true,
      },
    })

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    if (!workflow.enabled) {
      return NextResponse.json(
        { error: 'Workflow is disabled' },
        { status: 403 }
      )
    }

    // Get webhook payload
    const body = await request.json()
    const webhookData = body.data || body

    // Get source information
    const source = request.headers.get('x-webhook-source') || 'WEBHOOK_API'

    // Trigger workflow
    const result = await triggerWebhookWorkflows(
      workflowId,
      webhookData,
      source
    )

    return NextResponse.json({
      success: true,
      message: 'Workflow triggered successfully',
      execution: {
        id: result.executionId,
        status: result.status,
        startedAt: result.startedAt,
      },
    })
  } catch (error) {
    console.error('Webhook trigger error:', error)
    
    return NextResponse.json(
      {
        error: 'Failed to trigger workflow',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// GET /api/workflows/[id]/webhook - Get webhook information
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workflowId = params.id

    // Verify workflow exists
    // @ts-expect-error - workflow model added via Prisma extension
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      select: {
        id: true,
        name: true,
        enabled: true,
      },
    })

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    // Get base URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const webhookUrl = `${baseUrl}/api/workflows/${workflowId}/webhook`

    return NextResponse.json({
      workflowId: workflow.id,
      workflowName: workflow.name,
      webhookUrl,
      enabled: workflow.enabled,
      authentication: {
        method: 'API Key or Session',
        header: 'x-api-key',
      },
      usage: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'your-api-key',
          'x-webhook-source': 'optional-source-name',
        },
        body: {
          data: {
            // Your webhook payload
          },
        },
      },
      example: {
        curl: `curl -X POST ${webhookUrl} \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: your-api-key" \\
  -d '{"data": {"key": "value"}}'`,
      },
    })
  } catch (_error) {
    return NextResponse.json(
      { error: 'Failed to get webhook information' },
      { status: 500 }
    )
  }
}
