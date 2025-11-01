/**
 * Content Pages API Routes
 * 
 * GET  /api/cms/content/pages - List all pages with their sections
 * POST /api/cms/content/pages - Create a new page with sections
 * 
 * Uses PageContent and PageContentSection models (NOT CmsPage)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Type for section creation
interface SectionInput {
  sectionKey: string
  sectionType: string
  title?: string
  contentData: Record<string, unknown>
  order: number
  isVisible?: boolean
}

/**
 * GET /api/cms/content/pages
 * List all pages with their sections
 */
export async function GET(request: NextRequest) {
  try {
    // Optional: Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      )
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const includeHidden = searchParams.get('includeHidden') === 'true'
    const status = searchParams.get('status') || 'published'

    // Fetch pages with their sections
    const pages = await prisma.pageContent.findMany({
      where: {
        status: status,
      },
      include: {
        sections: {
          where: includeHidden ? {} : { isVisible: true },
          orderBy: { order: 'asc' }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform response to include metadata
    const response = {
      success: true,
      data: pages,
      metadata: {
        total: pages.length,
        totalSections: pages.reduce((sum, page) => sum + page.sections.length, 0),
        timestamp: new Date().toISOString()
      }
    }

    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('Error fetching pages:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch pages',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/cms/content/pages
 * Create a new page with sections
 * 
 * Body: {
 *   pageKey: string
 *   name: string
 *   slug: string
 *   title: string
 *   description?: string
 *   status?: 'draft' | 'published'
 *   sections?: Array<{
 *     sectionKey: string
 *     sectionType: string
 *     title?: string
 *     contentData: object
 *     order: number
 *     isVisible?: boolean
 *   }>
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Check super-admin permissions only
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'super-admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Super Admin access required' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { 
      pageKey, 
      name, 
      slug, 
      title, 
      description, 
      status = 'draft',
      sections = []
    } = body

    // Validate required fields
    if (!pageKey || !name || !slug || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: pageKey, name, slug, title' },
        { status: 400 }
      )
    }

    // Check if pageKey already exists
    const existing = await prisma.pageContent.findUnique({
      where: { pageKey }
    })

    if (existing) {
      return NextResponse.json(
        { error: `Page with pageKey '${pageKey}' already exists` },
        { status: 409 }
      )
    }

    // Create page with sections
    const newPage = await prisma.pageContent.create({
      data: {
        pageKey,
        name,
        slug,
        title,
        description: description || null,
        status,
        sections: {
          create: sections.map((section: SectionInput) => ({
            sectionKey: section.sectionKey,
            sectionType: section.sectionType,
            title: section.title || null,
            contentData: section.contentData,
            order: section.order,
            isVisible: section.isVisible !== false
          }))
        }
      },
      include: {
        sections: {
          orderBy: { order: 'asc' }
        }
      }
    })

    return NextResponse.json(
      {
        success: true,
        data: newPage,
        message: `Page '${name}' created successfully with ${newPage.sections.length} sections`
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Error creating page:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create page',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
