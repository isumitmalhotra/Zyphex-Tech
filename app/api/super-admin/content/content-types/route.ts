import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/super-admin/content/content-types - Fetch all content types with entry counts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    // Fetch content types
    const contentTypes = await prisma.contentType.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: [
        { isSystem: 'desc' },
        { name: 'asc' }
      ]
    })

    console.log(`Found ${contentTypes.length} content types`)

    // Get entry counts for each content type
    const contentTypesWithCounts = await Promise.all(
      contentTypes.map(async (type) => {
        const entryCount = await prisma.dynamicContentItem.count({
          where: { contentTypeId: type.id }
        })

        return {
          id: type.id,
          name: type.name,
          label: type.label || type.name,
          slug: type.name.toLowerCase().replace(/\s+/g, '-'), // Generate slug from name if not present
          description: type.description,
          icon: type.icon,
          category: type.category,
          isSystem: type.isSystem,
          isActive: type.isActive,
          entryCount,
          createdAt: type.createdAt,
          updatedAt: type.updatedAt
        }
      })
    )

    console.log('Content types with counts:', contentTypesWithCounts.map(ct => ({ name: ct.name, count: ct.entryCount })))

    return NextResponse.json({
      success: true,
      contentTypes: contentTypesWithCounts,
      total: contentTypesWithCounts.length
    })

  } catch (error) {
    console.error('Error fetching content types:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch content types',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
