import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/blog - Public API to fetch published blog posts with enhanced filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tag = searchParams.get('tag')
    const category = searchParams.get('category')
    const search = searchParams.get('search') || searchParams.get('q')
    const featured = searchParams.get('featured')
    const limit = searchParams.get('limit')
    const page = searchParams.get('page') || '1'
    
    const currentPage = parseInt(page)
    const itemsPerPage = limit ? parseInt(limit) : 12

    // Build filter conditions
    const where: {
      status: string
      contentType: { name: string }
      publishedAt?: { lte: Date }
      tags?: { contains: string }
      categories?: { contains: string }
      featured?: boolean
      OR?: Array<{
        title?: { contains: string }
        data?: { contains: string }
      }>
    } = {
      status: 'PUBLISHED',
      contentType: { name: 'blog' },
      publishedAt: {
        lte: new Date()
      }
    }

    // Filter by tag
    if (tag) {
      where.tags = { contains: tag }
    }

    // Filter by category
    if (category) {
      where.categories = { contains: category }
    }

    // Filter by featured
    if (featured === 'true') {
      where.featured = true
    }

    // Search functionality
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { data: { contains: search } }
      ]
    }

    // Get total count for pagination
    const totalPosts = await prisma.dynamicContentItem.count({ where })
    const totalPages = Math.ceil(totalPosts / itemsPerPage)

    // Query options
    const queryOptions = {
      where,
      include: {
        contentType: true
      },
      orderBy: [
        { featured: 'desc' as const },
        { publishedAt: 'desc' as const },
        { createdAt: 'desc' as const }
      ],
      take: itemsPerPage,
      skip: (currentPage - 1) * itemsPerPage
    }

    // Fetch blog posts from DynamicContentItem
    const blogPosts = await prisma.dynamicContentItem.findMany(queryOptions)

    // Transform the data for frontend consumption
    const transformedPosts = blogPosts.map(post => {
      const postData = post.data ? JSON.parse(post.data) : {}
      return {
        id: post.id,
        slug: post.slug,
        title: post.title,
        excerpt: postData.excerpt || '',
        content: postData.content || '',
        image: postData.image || '',
        readTime: postData.readTime || '5 min read',
        author: post.author || postData.author || 'Zyphex Tech',
        featured: post.featured,
        publishedAt: post.publishedAt,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        categories: post.categories ? JSON.parse(post.categories) : [],
        tags: post.tags ? JSON.parse(post.tags) : []
      }
    })

    // Get unique categories and tags for filtering
    const allPosts = await prisma.dynamicContentItem.findMany({
      where: {
        status: 'PUBLISHED',
        contentType: { name: 'blog' }
      },
      select: {
        categories: true,
        tags: true
      }
    })

    const categories = new Set<string>()
    const tags = new Set<string>()

    allPosts.forEach(post => {
      const postCategories = post.categories ? JSON.parse(post.categories) : []
      const postTags = post.tags ? JSON.parse(post.tags) : []

      postCategories.forEach(cat => categories.add(cat))
      postTags.forEach(tag => tags.add(tag))
    })

    return NextResponse.json({
      success: true,
      data: transformedPosts,
      pagination: {
        currentPage,
        totalPages,
        totalPosts,
        itemsPerPage,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1
      },
      filters: {
        categories: Array.from(categories),
        tags: Array.from(tags)
      }
    })

  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch blog posts',
        data: []
      },
      { status: 500 }
    )
  }
}