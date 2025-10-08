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
      status: string
      featured?: boolean
      contentType: { name: string }
    } = {
      status: 'PUBLISHED',
      contentType: { name: 'services' }
    }

    if (featured === 'true') {
      where.featured = true
    }

    // Query options
    const queryOptions = {
      where,
      include: {
        contentType: true
      },
      orderBy: [
        { featured: 'desc' as const },
        { order: 'asc' as const },
        { createdAt: 'desc' as const }
      ],
      take: undefined as number | undefined
    }

    // Add limit if specified
    if (limit) {
      const limitNum = parseInt(limit)
      if (!isNaN(limitNum) && limitNum > 0) {
        queryOptions.take = limitNum
      }
    }

    // Fetch services from DynamicContentItem
    const services = await prisma.dynamicContentItem.findMany(queryOptions)

    // Transform the data for frontend consumption
    const transformedServices = services.map(service => {
      const serviceData = service.data ? JSON.parse(service.data) : {}
      return {
        id: service.id,
        slug: service.slug,
        title: service.title,
        description: serviceData.description || '',
        icon: serviceData.icon || '',
        imageUrl: serviceData.imageUrl || '',
        features: serviceData.features || [],
        price: serviceData.price || '',
        ctaText: serviceData.ctaText || '',
        ctaLink: serviceData.ctaLink || '',
        featured: service.featured,
        order: service.order,
        createdAt: service.createdAt,
        updatedAt: service.updatedAt,
        publishedAt: service.publishedAt,
        categories: service.categories ? JSON.parse(service.categories) : [],
        tags: service.tags ? JSON.parse(service.tags) : []
      }
    })

    return NextResponse.json({
      success: true,
      data: transformedServices,
      total: transformedServices.length
    })

  } catch (error) {
    
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