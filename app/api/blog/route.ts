import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/blog - Public API to fetch published blog posts with enhanced filtering
// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tag = searchParams.get('tag')
    const search = searchParams.get('search') || searchParams.get('q')
    const limit = searchParams.get('limit')
    const page = searchParams.get('page') || '1'
    
    const currentPage = parseInt(page)
    const itemsPerPage = limit ? parseInt(limit) : 12

    // Build filter conditions for BlogPost table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      published: true,
      publishedAt: {
        lte: new Date()
      }
    }

    // Filter by tag
    if (tag) {
      where.tags = { contains: tag }
    }

    // Search functionality
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get total count for pagination
    const totalPosts = await prisma.blogPost.count({ where })
    const totalPages = Math.ceil(totalPosts / itemsPerPage)

    // Fetch blog posts from BlogPost table
    const blogPosts = await prisma.blogPost.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      take: itemsPerPage,
      skip: (currentPage - 1) * itemsPerPage
    })

    // Transform the data for frontend consumption
    const transformedPosts = blogPosts.map(post => {
      // Parse tags if it's a JSON string
      let tags: string[] = []
      try {
        tags = post.tags ? JSON.parse(post.tags) : []
      } catch {
        tags = post.tags ? post.tags.split(',').map((t: string) => t.trim()) : []
      }

      // Calculate read time from content word count
      const wordCount = post.content.split(' ').length
      const readTime = Math.ceil(wordCount / 200)

      return {
        id: post.id,
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        imageUrl: post.imageUrl,
        readTime: `${readTime} min read`,
        author: post.author,
        publishedAt: post.publishedAt,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        tags
      }
    })

    // Get unique tags for filtering
    const allPosts = await prisma.blogPost.findMany({
      where: { published: true },
      select: { tags: true }
    })

    const tags = new Set<string>()
    allPosts.forEach(post => {
      try {
        const postTags = post.tags ? JSON.parse(post.tags) : []
        postTags.forEach((tag: string) => tags.add(tag))
      } catch {
        // Ignore parsing errors
      }
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
        tags: Array.from(tags)
      }
    })

  } catch (_error) {
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