import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Portfolio item validation schema
const createPortfolioSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  client: z.string().optional(),
  technologies: z.array(z.string()).min(1, 'At least one technology is required'),
  imageUrl: z.string().url('Valid image URL is required'),
  projectUrl: z.string().url('Valid project URL is required').optional(),
  githubUrl: z.string().url('Valid GitHub URL is required').optional(),
  featured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  order: z.number().int().min(0).default(0),
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
    const featured = searchParams.get('featured')

    // Build filter object
    const where: {
      category?: string
      featured?: boolean
    } = {}
    if (category) where.category = category
    if (featured !== null) where.featured = featured === 'true'

    // Get portfolio items with filters
    const portfolioItems = await prisma.portfolioItem.findMany({
      where,
      orderBy: [
        { featured: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({
      success: true,
      data: portfolioItems,
      total: portfolioItems.length
    })

  } catch (error) {
    console.error('Portfolio GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch portfolio items' },
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
    const validatedData = createPortfolioSchema.parse(body)

    // Create portfolio item
    const portfolioItem = await prisma.portfolioItem.create({
      data: {
        ...validatedData,
        technologies: JSON.stringify(validatedData.technologies),
      }
    })

    return NextResponse.json({
      success: true,
      data: portfolioItem,
      message: 'Portfolio item created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Portfolio POST error:', error)
    
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
      { error: 'Failed to create portfolio item' },
      { status: 500 }
    )
  }
}
