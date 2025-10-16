import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/portfolio - Public API to fetch published portfolio items
// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

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
      status: string
      contentType: { name: string }
      categories?: { contains: string }
      featured?: boolean
      tags?: { contains: string }
    } = {
      status: 'PUBLISHED',
      contentType: { name: 'portfolio' }
    }

    if (category && category !== 'all') {
      where.categories = { contains: category }
    }

    if (featured === 'true') {
      where.featured = true
    }

    if (technology) {
      where.tags = { contains: technology }
    }

    // Get total count for pagination
    const totalItems = await prisma.dynamicContentItem.count({ where })
    const totalPages = Math.ceil(totalItems / itemsPerPage)

    // Query options
    const queryOptions = {
      where,
      include: {
        contentType: true
      },
      orderBy: [
        { featured: 'desc' as const },
        { order: 'asc' as const },
        { publishedAt: 'desc' as const }
      ],
      take: itemsPerPage,
      skip: (currentPage - 1) * itemsPerPage
    }

    // Fetch portfolio items from DynamicContentItem
    const portfolioItems = await prisma.dynamicContentItem.findMany(queryOptions)

    // Transform the data for frontend consumption
    const transformedItems = portfolioItems.map(item => {
      const itemData = item.data ? JSON.parse(item.data) : {}
      return {
        id: item.id,
        title: item.title,
        slug: item.slug,
        description: itemData.description || '',
        category: itemData.category || 'Development',
        technologies: itemData.technologies || [],
        featuredImage: itemData.image || itemData.featuredImage || '/placeholder.svg?height=300&width=400&text=Project',
        imageUrl: itemData.image || itemData.imageUrl || '/placeholder.svg?height=300&width=400&text=Project',
        projectUrl: itemData.liveUrl || itemData.projectUrl,
        liveUrl: itemData.liveUrl,
        githubUrl: itemData.githubUrl,
        featured: item.featured,
        published: item.status === 'PUBLISHED',
        isActive: true,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }
    })

    // Get unique categories and technologies for filtering
    const allItems = await prisma.dynamicContentItem.findMany({
      where: {
        status: 'PUBLISHED',
        contentType: { name: 'portfolio' }
      },
      select: {
        data: true,
        categories: true,
        tags: true
      }
    })

    const categories = new Set<string>()
    const technologies = new Set<string>()

    allItems.forEach(item => {
      const itemData = item.data ? JSON.parse(item.data) : {}
      const itemCategories: string[] = item.categories ? JSON.parse(item.categories) : []
      const itemTags: string[] = item.tags ? JSON.parse(item.tags) : []

      if (itemData.category) categories.add(itemData.category)
      itemCategories.forEach(cat => categories.add(cat))
      itemTags.forEach(tech => technologies.add(tech))
      if (itemData.technologies && Array.isArray(itemData.technologies)) {
        itemData.technologies.forEach((tech: string) => technologies.add(tech))
      }
    })

    return NextResponse.json({
      items: transformedItems,
      pagination: {
        currentPage,
        totalPages,
        totalItems,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1
      },
      filters: {
        categories: Array.from(categories),
        technologies: Array.from(technologies)
      }
    })

  } catch (error) {
    return NextResponse.json(
      { 
        items: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalItems: 0,
          hasNext: false,
          hasPrev: false
        },
        filters: {
          categories: [],
          technologies: []
        }
      },
      { status: 500 }
    )
  }
}