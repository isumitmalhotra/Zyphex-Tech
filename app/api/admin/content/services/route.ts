import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Type assertion for Prisma client with service model
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prismaWithService = prisma as any

// Validation schemas
const createServiceSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  icon: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  features: z.string().optional(), // JSON string
  isActive: z.boolean().optional().default(true),
  order: z.number().int().min(0).optional().default(0),
})

// GET /api/admin/content/services - Get all services
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admin can access content management
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('isActive')

    // Build filter conditions
    const where: Record<string, unknown> = {}
    if (isActive !== null) where.isActive = isActive === 'true'

    const services = await prismaWithService.service.findMany({
      where,
      orderBy: { order: 'asc' },
    })

    return NextResponse.json(services)
  } catch (error) {
    console.error('Error fetching services:', error)
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    )
  }
}

// POST /api/admin/content/services - Create a new service
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admin can create services
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    // Validate input
    const validationResult = createServiceSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { title, description, icon, imageUrl, features, isActive, order } = validationResult.data

    // Create new service
    const newService = await prismaWithService.service.create({
      data: {
        title,
        description,
        icon,
        imageUrl: imageUrl || null,
        features,
        isActive: isActive ?? true,
        order: order ?? 0,
      },
    })

    return NextResponse.json(newService, { status: 201 })
  } catch (error) {
    console.error('Error creating service:', error)
    return NextResponse.json(
      { error: 'Failed to create service' },
      { status: 500 }
    )
  }
}
