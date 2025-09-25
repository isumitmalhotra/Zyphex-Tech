import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Update portfolio item validation schema
const updatePortfolioSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().min(1, 'Description is required').optional(),
  category: z.string().min(1, 'Category is required').optional(),
  client: z.string().optional(),
  technologies: z.array(z.string()).min(1, 'At least one technology is required').optional(),
  imageUrl: z.string().url('Valid image URL is required').optional(),
  projectUrl: z.string().url('Valid project URL is required').optional(),
  githubUrl: z.string().url('Valid GitHub URL is required').optional(),
  featured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
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

    // Get portfolio item by ID
    const portfolioItem = await prisma.portfolioItem.findUnique({
      where: { id }
    })

    if (!portfolioItem) {
      return NextResponse.json(
        { error: 'Portfolio item not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: portfolioItem
    })

  } catch (error) {
    console.error('Portfolio GET by ID error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch portfolio item' },
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
    const validatedData = updatePortfolioSchema.parse(body)

    // Check if portfolio item exists
    const existingPortfolioItem = await prisma.portfolioItem.findUnique({
      where: { id }
    })

    if (!existingPortfolioItem) {
      return NextResponse.json(
        { error: 'Portfolio item not found' },
        { status: 404 }
      )
    }

    // Update portfolio item
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = { ...validatedData }
    if (validatedData.technologies) {
      updateData.technologies = JSON.stringify(validatedData.technologies)
    }
    
    const updatedPortfolioItem = await prisma.portfolioItem.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      data: updatedPortfolioItem,
      message: 'Portfolio item updated successfully'
    })

  } catch (error) {
    console.error('Portfolio PUT error:', error)
    
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
      { error: 'Failed to update portfolio item' },
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

    // Check if portfolio item exists
    const existingPortfolioItem = await prisma.portfolioItem.findUnique({
      where: { id }
    })

    if (!existingPortfolioItem) {
      return NextResponse.json(
        { error: 'Portfolio item not found' },
        { status: 404 }
      )
    }

    // Delete portfolio item
    await prisma.portfolioItem.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Portfolio item deleted successfully'
    })

  } catch (error) {
    console.error('Portfolio DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete portfolio item' },
      { status: 500 }
    )
  }
}
