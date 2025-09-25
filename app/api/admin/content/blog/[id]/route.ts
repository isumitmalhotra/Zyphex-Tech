import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Update blog post validation schema
const updateBlogSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens').optional(),
  excerpt: z.string().min(1, 'Excerpt is required').optional(),
  content: z.string().min(1, 'Content is required').optional(),
  coverImage: z.string().url('Valid cover image URL is required').optional(),
  category: z.string().min(1, 'Category is required').optional(),
  tags: z.array(z.string()).optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  featured: z.boolean().optional(),
  published: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const { id } = params

    // Get blog post by ID
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const blogPost = await (prisma as any).blogPost.findUnique({
      where: { id },
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

    if (!blogPost) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: blogPost
    })

  } catch (error) {
    console.error('Blog GET by ID error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch blog post' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const { id } = params
    const body = await request.json()

    // Validate request body
    const validatedData = updateBlogSchema.parse(body)

    // Check if blog post exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingPost = await (prisma as any).blogPost.findUnique({
      where: { id }
    })

    if (!existingPost) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      )
    }

    // If slug is being updated, check for conflicts
    if (validatedData.slug && validatedData.slug !== existingPost.slug) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const conflictingPost = await (prisma as any).blogPost.findUnique({
        where: { slug: validatedData.slug }
      })
      
      if (conflictingPost) {
        return NextResponse.json(
          { error: 'A blog post with this slug already exists' },
          { status: 409 }
        )
      }
    }

    // Prepare update data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = { ...validatedData }
    if (validatedData.tags) {
      updateData.tags = JSON.stringify(validatedData.tags)
    }
    
    // Update published date if publishing for the first time
    if (validatedData.published && !existingPost.published) {
      updateData.publishedAt = new Date()
    } else if (validatedData.published === false) {
      updateData.publishedAt = null
    }

    // Update blog post
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatedPost = await (prisma as any).blogPost.update({
      where: { id },
      data: updateData,
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
      data: updatedPost,
      message: 'Blog post updated successfully'
    })

  } catch (error) {
    console.error('Blog PUT error:', error)
    
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
      { error: 'Failed to update blog post' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const { id } = params

    // Check if blog post exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingPost = await (prisma as any).blogPost.findUnique({
      where: { id }
    })

    if (!existingPost) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      )
    }

    // Delete blog post
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).blogPost.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Blog post deleted successfully'
    })

  } catch (error) {
    console.error('Blog DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete blog post' },
      { status: 500 }
    )
  }
}
