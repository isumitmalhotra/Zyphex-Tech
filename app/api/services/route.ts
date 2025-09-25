import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/services - Public API to fetch all active services
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const featured = searchParams.get('featured')
    const limit = searchParams.get('limit')

    // Build filter conditions
    const where: {
      isActive: boolean
      featured?: boolean
    } = {
      isActive: true
    }

    if (featured === 'true') {
      where.featured = true
    }

    // Query options
    const queryOptions = {
      where,
      orderBy: [
        { order: 'asc' as const },
        { createdAt: 'desc' as const }
      ],
      select: {
        id: true,
        title: true,
        description: true,
        icon: true,
        imageUrl: true,
        features: true,
        isActive: true,
        order: true,
        createdAt: true,
        updatedAt: true
      },
      take: undefined as number | undefined
    }

    // Add limit if specified
    if (limit) {
      const limitNum = parseInt(limit)
      if (!isNaN(limitNum) && limitNum > 0) {
        queryOptions.take = limitNum
      }
    }

    // Fetch services
    const services = await prisma.service.findMany(queryOptions)

    // Transform the data for frontend consumption
    const transformedServices = services.map(service => ({
      id: service.id,
      title: service.title,
      description: service.description,
      icon: service.icon,
      imageUrl: service.imageUrl,
      features: service.features ? JSON.parse(service.features) : [],
      order: service.order,
      createdAt: service.createdAt,
      updatedAt: service.updatedAt
    }))

    return NextResponse.json({
      success: true,
      data: transformedServices,
      total: transformedServices.length
    })

  } catch (error) {
    console.error('Services API error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch services',
        data: []
      },
      { status: 500 }
    )
  }
}