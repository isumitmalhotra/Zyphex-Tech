import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createIntegrationSchema = z.object({
  name: z.string().min(1),
  type: z.string(),
  category: z.string(),
  description: z.string().optional(),
  configuration: z.any().optional(),
  apiKey: z.string().optional(),
  webhookUrl: z.string().url().optional().or(z.literal('')),
  syncFrequency: z.string().optional(),
})

// GET /api/integrations - Get all integrations
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only allow project managers and admins
    if (session.user.role !== 'PROJECT_MANAGER' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const enabled = searchParams.get('enabled')

    const where: any = {}
    
    if (category && category !== 'ALL') {
      where.category = category
    }
    
    if (status) {
      where.status = status
    }
    
    if (enabled !== null && enabled !== undefined) {
      where.isEnabled = enabled === 'true'
    }

    const integrations = await prisma.integration.findMany({
      where,
      orderBy: [
        { isEnabled: 'desc' },
        { name: 'asc' }
      ],
      include: {
        _count: {
          select: { logs: true }
        }
      }
    })

    // Remove sensitive data before sending
    const sanitizedIntegrations = integrations.map(integration => ({
      ...integration,
      apiKey: integration.apiKey ? '***' + integration.apiKey.slice(-4) : null,
      configuration: integration.configuration ? { ...integration.configuration, apiKey: undefined, apiSecret: undefined } : null
    }))

    return NextResponse.json(sanitizedIntegrations)
  } catch (error: any) {
    console.error('Error fetching integrations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch integrations' },
      { status: 500 }
    )
  }
}

// POST /api/integrations - Create new integration
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only allow project managers and admins
    if (session.user.role !== 'PROJECT_MANAGER' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const validatedData = createIntegrationSchema.parse(body)

    // Check if integration of this type already exists
    const existing = await prisma.integration.findFirst({
      where: { type: validatedData.type as any }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Integration of this type already exists' },
        { status: 400 }
      )
    }

    const integration = await prisma.integration.create({
      data: {
        name: validatedData.name,
        type: validatedData.type as any,
        category: validatedData.category as any,
        description: validatedData.description,
        configuration: validatedData.configuration || {},
        apiKey: validatedData.apiKey,
        webhookUrl: validatedData.webhookUrl || null,
        syncFrequency: validatedData.syncFrequency,
        isEnabled: false,
        status: 'INACTIVE' as any,
      }
    })

    // Log the creation
    await prisma.integrationLog.create({
      data: {
        integrationId: integration.id,
        action: 'create',
        status: 'success',
        message: `Integration ${integration.name} created`,
      }
    })

    return NextResponse.json(integration, { status: 201 })
  } catch (error: any) {
    console.error('Error creating integration:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create integration' },
      { status: 500 }
    )
  }
}
