import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/content - Public API to fetch active content sections
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sectionKey = searchParams.get('section')
    const keys = searchParams.get('keys')

    // Build filter conditions
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

    // Query options
    const queryOptions = {
      where,
      orderBy: [
        { order: 'asc' as const },
        { createdAt: 'asc' as const }
      ],
      select: {
        id: true,
        sectionKey: true,
        title: true,
        subtitle: true,
        content: true,
        imageUrl: true,
        isActive: true,
        order: true,
        createdAt: true,
        updatedAt: true
      }
    }

    // Fetch content sections
    const contentSections = await prisma.contentSection.findMany(queryOptions)

    // Transform the data for frontend consumption
    const transformedSections = contentSections.map(section => ({
      id: section.id,
      sectionKey: section.sectionKey,
      title: section.title,
      subtitle: section.subtitle,
      content: (() => {
        try {
          return section.content ? JSON.parse(section.content) : null
        } catch {
          return section.content
        }
      })(),
      imageUrl: section.imageUrl,
      order: section.order,
      createdAt: section.createdAt,
      updatedAt: section.updatedAt
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
      sections: transformedSections // Also provide as array
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