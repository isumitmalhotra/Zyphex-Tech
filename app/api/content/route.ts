import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/content - Public API to fetch active content sections and items
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page')
    const sectionKey = searchParams.get('section')
    const contentType = searchParams.get('type')
    const keys = searchParams.get('keys')

    // If requesting page content, get sections for that page
    if (page) {
      const pageSections = await prisma.dynamicContentSection.findMany({
        where: {
          isActive: true,
          OR: [
            { sectionKey: { contains: page } },
            { sectionKey: { startsWith: `${page}-` } }
          ]
        },
        include: {
          contentType: true
        },
        orderBy: [
          { order: 'asc' },
          { createdAt: 'asc' }
        ]
      })

      // Also get content items for the page if any
      const pageItems = await prisma.dynamicContentItem.findMany({
        where: {
          status: 'PUBLISHED',
          categories: { contains: page }
        },
        include: {
          contentType: true
        },
        orderBy: [
          { featured: 'desc' },
          { order: 'asc' },
          { publishedAt: 'desc' }
        ]
      })

      return NextResponse.json({
        success: true,
        page,
        sections: pageSections.map(section => ({
          id: section.id,
          sectionKey: section.sectionKey,
          title: section.title,
          subtitle: section.subtitle,
          description: section.description,
          imageUrl: section.imageUrl,
          layoutSettings: section.layoutSettings ? JSON.parse(section.layoutSettings) : {},
          contentData: section.contentData ? JSON.parse(section.contentData) : {},
          isActive: section.isActive,
          order: section.order,
          createdAt: section.createdAt,
          updatedAt: section.updatedAt,
          contentType: section.contentType
        })),
        items: pageItems.map(item => ({
          id: item.id,
          slug: item.slug,
          title: item.title,
          data: item.data ? JSON.parse(item.data) : {},
          status: item.status,
          featured: item.featured,
          publishedAt: item.publishedAt,
          order: item.order,
          categories: item.categories ? JSON.parse(item.categories) : [],
          tags: item.tags ? JSON.parse(item.tags) : [],
          author: item.author,
          contentType: item.contentType
        }))
      })
    }

    // Build filter conditions for sections
    const where: {
      isActive: boolean
      sectionKey?: string | { in: string[] }
    } = {
      isActive: true
    }

    // Filter by specific section key
    if (sectionKey) {
      where.sectionKey = sectionKey
    } 
    // Filter by multiple keys (comma-separated)
    else if (keys) {
      const keyArray = keys.split(',').map(k => k.trim()).filter(Boolean)
      if (keyArray.length > 0) {
        where.sectionKey = { in: keyArray }
      }
    }

    // Query content sections
    const contentSections = await prisma.dynamicContentSection.findMany({
      where,
      include: {
        contentType: true
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'asc' }
      ]
    })

    // Query content items if content type is specified
    let contentItems: any[] = []
    if (contentType) {
      contentItems = await prisma.dynamicContentItem.findMany({
        where: {
          status: 'PUBLISHED',
          contentType: {
            name: contentType
          }
        },
        include: {
          contentType: true
        },
        orderBy: [
          { featured: 'desc' },
          { order: 'asc' },
          { publishedAt: 'desc' }
        ]
      })
    }

    // Transform the data for frontend consumption
    const transformedSections = contentSections.map(section => ({
      id: section.id,
      sectionKey: section.sectionKey,
      title: section.title,
      subtitle: section.subtitle,
      description: section.description,
      imageUrl: section.imageUrl,
      layoutSettings: section.layoutSettings ? JSON.parse(section.layoutSettings) : {},
      contentData: section.contentData ? JSON.parse(section.contentData) : {},
      isActive: section.isActive,
      order: section.order,
      createdAt: section.createdAt,
      updatedAt: section.updatedAt,
      contentType: section.contentType
    }))

    const transformedItems = contentItems.map(item => ({
      id: item.id,
      slug: item.slug,
      title: item.title,
      data: item.data ? JSON.parse(item.data) : {},
      status: item.status,
      featured: item.featured,
      publishedAt: item.publishedAt,
      order: item.order,
      categories: item.categories ? JSON.parse(item.categories) : [],
      tags: item.tags ? JSON.parse(item.tags) : [],
      author: item.author,
      contentType: item.contentType
    }))

    // If requesting a single section, return just that section
    if (sectionKey && transformedSections.length === 1) {
      return NextResponse.json({
        success: true,
        data: transformedSections[0]
      })
    }

    // Return all sections as an object indexed by sectionKey for easy access
    const sectionsObject = transformedSections.reduce((acc, section) => {
      acc[section.sectionKey] = section
      return acc
    }, {} as Record<string, typeof transformedSections[0]>)

    return NextResponse.json({
      success: true,
      data: sectionsObject,
      sections: transformedSections,
      items: transformedItems
    })

  } catch (error) {
    console.error('Content API error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch content sections',
        data: {}
      },
      { status: 500 }
    )
  }
}