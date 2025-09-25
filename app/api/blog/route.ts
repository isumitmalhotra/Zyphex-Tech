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
      published: boolean
      publishedAt?: {
        lte: Date
      }
      tags?: {
        contains: string
      }
      OR?: Array<{
        title?: { contains: string }
        excerpt?: { contains: string }
        content?: { contains: string }
      }>
    } = {
      published: true,
      publishedAt: {
        lte: new Date()
      }
    }

    // Filter by tag
    if (tag) {
      where.tags = {
        contains: tag
      }
    }

    // Filter by category (using tags field for now)
    if (category) {
      where.tags = {
        contains: category
      }
    }

    // Search functionality
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { excerpt: { contains: search } },
        { content: { contains: search } }
      ]
    }

    // Get total count for pagination
    const totalItems = await prisma.blogPost.count({ where })
    const totalPages = Math.ceil(totalItems / itemsPerPage)

    // Build query options
    const queryOptions = {
      where,
      orderBy: [
        ...(featured === 'true' ? [] : []),
        { publishedAt: 'desc' as const },
        { createdAt: 'desc' as const }
      ],
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: false, // Don't include full content in list view
        author: true,
        imageUrl: true,
        tags: true,
        published: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true
      },
      skip: (currentPage - 1) * itemsPerPage,
      take: itemsPerPage
    }

    // Fetch blog posts
    const blogPosts = await prisma.blogPost.findMany(queryOptions)

    // Transform the data for frontend consumption
    const transformedBlogPosts = blogPosts.map(post => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      author: post.author,
      imageUrl: post.imageUrl,
      tags: (() => {
        try {
          return post.tags ? JSON.parse(post.tags) : []
        } catch {
          return post.tags ? post.tags.split(',').map((t: string) => t.trim()) : []
        }
      })(),
      publishedAt: post.publishedAt,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt
    }))

    // Get all unique tags for filtering
    const tagResults = await prisma.blogPost.findMany({
      where: { 
        published: true,
        publishedAt: { lte: new Date() }
      },
      select: { tags: true }
    })

    const allTags = Array.from(
      new Set(
        tagResults
          .flatMap(post => {
            try {
              return post.tags ? JSON.parse(post.tags) : []
            } catch {
              return post.tags ? post.tags.split(',').map((t: string) => t.trim()) : []
            }
          })
          .filter(Boolean)
      )
    ).sort()

    // Convert tags to categories for frontend compatibility
    const categories = allTags.map(tag => ({
      name: tag,
      count: tagResults.filter(post => {
        try {
          const postTags = post.tags ? JSON.parse(post.tags) : []
          return postTags.includes(tag)
        } catch {
          const postTags = post.tags ? post.tags.split(',').map((t: string) => t.trim()) : []
          return postTags.includes(tag)
        }
      }).length
    }))

    return NextResponse.json({
      success: true,
      data: transformedBlogPosts,
      pagination: {
        currentPage,
        totalPages,
        totalItems,
        itemsPerPage,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1
      },
      filters: {
        tags: allTags,
        categories
      }
    })

  } catch (error) {
    console.error('Blog API error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch blog posts',
        data: [],
        pagination: null,
        filters: null
      },
      { status: 500 }
    )
  }
}