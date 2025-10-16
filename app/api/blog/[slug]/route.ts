import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/blog/[slug] - Public API to fetch a single blog post by slug
// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug parameter is required' },
        { status: 400 }
      )
    }

    // Fetch the blog post
    const blogPost = await prisma.blogPost.findUnique({
      where: { 
        slug,
        published: true,
        publishedAt: { lte: new Date() }
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        author: true,
        imageUrl: true,
        tags: true,
        published: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!blogPost) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      )
    }

    // Transform the data for frontend consumption
    const transformedBlogPost = {
      id: blogPost.id,
      title: blogPost.title,
      slug: blogPost.slug,
      excerpt: blogPost.excerpt,
      content: blogPost.content,
      author: blogPost.author,
      imageUrl: blogPost.imageUrl,
      tags: (() => {
        try {
          return blogPost.tags ? JSON.parse(blogPost.tags) : []
        } catch {
          return blogPost.tags ? blogPost.tags.split(',').map((t: string) => t.trim()) : []
        }
      })(),
      publishedAt: blogPost.publishedAt,
      createdAt: blogPost.createdAt,
      updatedAt: blogPost.updatedAt
    }

    // Get related posts (same tags, exclude current post)
    const relatedPosts = await prisma.blogPost.findMany({
      where: {
        published: true,
        publishedAt: { lte: new Date() },
        id: { not: blogPost.id },
        OR: transformedBlogPost.tags.map((tag: string) => ({
          tags: { contains: tag }
        }))
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        imageUrl: true,
        publishedAt: true
      },
      take: 3,
      orderBy: { publishedAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: transformedBlogPost,
      relatedPosts
    })

  } catch (error) {
    console.error('Blog post API error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch blog post',
        data: null
      },
      { status: 500 }
    )
  }
}