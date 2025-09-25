import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Blog post validation schema
const createBlogSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  excerpt: z.string().min(1, 'Excerpt is required'),
  content: z.string().min(1, 'Content is required'),
  coverImage: z.string().url('Valid cover image URL is required').optional(),
  category: z.string().min(1, 'Category is required'),
  tags: z.array(z.string()).default([]),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  featured: z.boolean().default(false),
  published: z.boolean().default(false),
})

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const published = searchParams.get('published')
    const featured = searchParams.get('featured')

    // Build filter object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}
    if (category) where.category = category
    if (published !== null) where.published = published === 'true'
    if (featured !== null) where.featured = featured === 'true'

    // Get blog posts with filters
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const blogPosts = await (prisma as any).blogPost.findMany({
      where,
      orderBy: [
        { featured: 'desc' },
        { createdAt: 'desc' }
      ],
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: blogPosts,
      total: blogPosts.length
    })

  } catch (error) {
    console.error('Blog GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch blog posts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Validate request body
    const validatedData = createBlogSchema.parse(body)

    // Check if slug already exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingPost = await (prisma as any).blogPost.findUnique({
      where: { slug: validatedData.slug }
    })

    if (existingPost) {
      return NextResponse.json(
        { error: 'A blog post with this slug already exists' },
        { status: 409 }
      )
    }

    // Create blog post
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const blogPost = await (prisma as any).blogPost.create({
      data: {
        ...validatedData,
        tags: JSON.stringify(validatedData.tags),
        authorId: session.user.id,
        publishedAt: validatedData.published ? new Date() : null,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: blogPost,
      message: 'Blog post created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Blog POST error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create blog post' },
      { status: 500 }
    )
  }
}
