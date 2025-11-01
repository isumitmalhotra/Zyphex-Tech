import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/super-admin/content/pages/[id]/duplicate - Duplicate page
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch the original page
    const originalPage = await prisma.page.findUnique({
      where: { id: params.id },
    })

    if (!originalPage) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      )
    }

    // Generate unique slug for the duplicate
    let newSlug = `${originalPage.slug}-copy`
    let counter = 1
    
    // Check if slug exists and increment counter
    while (await prisma.page.findUnique({ where: { slug: newSlug } })) {
      newSlug = `${originalPage.slug}-copy-${counter}`
      counter++
    }

    // Create duplicate page
    const duplicatedPage = await prisma.page.create({
      data: {
        title: `${originalPage.title} (Copy)`,
        slug: newSlug,
        path: `${originalPage.path}-copy`,
        description: originalPage.description,
        metaTitle: originalPage.metaTitle,
        metaDescription: originalPage.metaDescription,
        isActive: false, // Start as draft
        isSystem: false, // Duplicates are never system pages
        order: originalPage.order,
      },
    })

    return NextResponse.json(duplicatedPage)
  } catch (error) {
    console.error('Error duplicating page:', error)
    return NextResponse.json(
      { error: 'Failed to duplicate page', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
