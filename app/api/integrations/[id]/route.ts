import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateIntegrationSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  isEnabled: z.boolean().optional(),
  configuration: z.any().optional(),
  apiKey: z.string().optional(),
  webhookUrl: z.string().url().optional().or(z.literal('')),
  syncFrequency: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ERROR', 'SYNCING', 'PENDING']).optional(),
})

// GET /api/integrations/[id] - Get integration by ID
// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'PROJECT_MANAGER' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const integration = await prisma.integration.findUnique({
      where: { id: params.id },
      include: {
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    })

    if (!integration) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      )
    }

    // Sanitize sensitive data
    const sanitized = {
      ...integration,
      apiKey: integration.apiKey ? '***' + integration.apiKey.slice(-4) : null,
      configuration: integration.configuration ? 
        { ...integration.configuration, apiKey: undefined, apiSecret: undefined } : null
    }

    return NextResponse.json(sanitized)
  } catch (error: any) {
    console.error('Error fetching integration:', error)
    return NextResponse.json(
      { error: 'Failed to fetch integration' },
      { status: 500 }
    )
  }
}

// PUT /api/integrations/[id] - Update integration
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'PROJECT_MANAGER' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const validatedData = updateIntegrationSchema.parse(body)

    const existing = await prisma.integration.findUnique({
      where: { id: params.id }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    
    if (validatedData.name !== undefined) updateData.name = validatedData.name
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.isEnabled !== undefined) {
      updateData.isEnabled = validatedData.isEnabled
      updateData.status = validatedData.isEnabled ? 'ACTIVE' : 'INACTIVE'
    }
    if (validatedData.configuration !== undefined) updateData.configuration = validatedData.configuration
    if (validatedData.apiKey !== undefined) updateData.apiKey = validatedData.apiKey
    if (validatedData.webhookUrl !== undefined) updateData.webhookUrl = validatedData.webhookUrl || null
    if (validatedData.syncFrequency !== undefined) updateData.syncFrequency = validatedData.syncFrequency
    if (validatedData.status !== undefined) updateData.status = validatedData.status

    const integration = await prisma.integration.update({
      where: { id: params.id },
      data: updateData
    })

    // Log the update
    await prisma.integrationLog.create({
      data: {
        integrationId: integration.id,
        action: 'update',
        status: 'success',
        message: `Integration ${integration.name} updated`,
        metadata: { changes: Object.keys(updateData) }
      }
    })

    return NextResponse.json(integration)
  } catch (error: any) {
    console.error('Error updating integration:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update integration' },
      { status: 500 }
    )
  }
}

// DELETE /api/integrations/[id] - Delete integration
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'PROJECT_MANAGER' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const integration = await prisma.integration.findUnique({
      where: { id: params.id }
    })

    if (!integration) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      )
    }

    await prisma.integration.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting integration:', error)
    return NextResponse.json(
      { error: 'Failed to delete integration' },
      { status: 500 }
    )
  }
}
