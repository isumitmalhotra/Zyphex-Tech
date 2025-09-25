import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/portfolio - Public API to fetch published portfolio items
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const technology = searchParams.get('technology')
    const featured = searchParams.get('featured')
    const limit = searchParams.get('limit')
    const page = searchParams.get('page') || '1'
    
    const currentPage = parseInt(page)
    const itemsPerPage = limit ? parseInt(limit) : 12

    // Build filter conditions
    const where: {
      isActive: boolean
      category?: string
      featured?: boolean
      technologies?: {
        contains: string
      }
    } = {
      isActive: true
    }

    if (category && category !== 'all') {
      where.category = category
    }

    if (featured === 'true') {
      where.featured = true
    }

    if (technology) {
      where.technologies = {
        contains: technology
      }
    }

    // Get total count for pagination
    const totalItems = await prisma.portfolioItem.count({ where })
    const totalPages = Math.ceil(totalItems / itemsPerPage)

    // Query options
    const queryOptions = {
      where,
      orderBy: [
        { featured: 'desc' as const },
        { order: 'asc' as const },
        { createdAt: 'desc' as const }
      ],
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        category: true,
        client: true,
        technologies: true,
        imageUrl: true,
        featuredImage: true,
        projectUrl: true,
        liveUrl: true,
        githubUrl: true,
        featured: true,
        order: true,
        createdAt: true,
        updatedAt: true
      },
      skip: (currentPage - 1) * itemsPerPage,
      take: itemsPerPage
    }

    // Fetch portfolio items
    const portfolioItems = await prisma.portfolioItem.findMany(queryOptions)

    // Transform the data for frontend consumption
    const transformedPortfolioItems = portfolioItems.map(item => ({
      id: item.id,
      title: item.title,
      slug: item.slug || item.id,
      description: item.description,
      category: item.category,
      client: item.client,
      technologies: (() => {
        try {
          return item.technologies ? JSON.parse(item.technologies) : []
        } catch {
          return item.technologies ? item.technologies.split(',').map((t: string) => t.trim()) : []
        }
      })(),
      featuredImage: item.featuredImage || item.imageUrl,
      liveUrl: item.liveUrl || item.projectUrl,
      githubUrl: item.githubUrl,
      featured: item.featured,
      order: item.order,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }))

    // Get unique categories for filtering
    const categoriesResult = await prisma.portfolioItem.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ['category']
    })

    const categories = categoriesResult
      .map(item => item.category)
      .filter(Boolean)
      .sort()

    // Get unique technologies for filtering
    const techResults = await prisma.portfolioItem.findMany({
      where: { isActive: true },
      select: { technologies: true }
    })

    const technologies = Array.from(
      new Set(
        techResults
          .flatMap(item => {
            try {
              return item.technologies ? JSON.parse(item.technologies) : []
            } catch {
              return item.technologies ? item.technologies.split(',').map((t: string) => t.trim()) : []
            }
          })
          .filter(Boolean)
      )
    ).sort()

    return NextResponse.json({
      success: true,
      data: transformedPortfolioItems,
      pagination: {
        currentPage,
        totalPages,
        totalItems,
        itemsPerPage,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1
      },
      filters: {
        categories,
        technologies
      }
    })

  } catch (error) {
    console.error('Portfolio API error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch portfolio items',
        data: [],
        pagination: null,
        filters: null
      },
      { status: 500 }
    )
  }
}