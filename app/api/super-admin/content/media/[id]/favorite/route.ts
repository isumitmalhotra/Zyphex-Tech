import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/super-admin/content/media/[id]/favorite - Toggle favorite status
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

    // Fetch the media file
    const media = await prisma.mediaAsset.findUnique({
      where: { id: params.id },
    })

    if (!media) {
      return NextResponse.json(
        { error: 'Media file not found' },
        { status: 404 }
      )
    }

    // Toggle favorite status
    const updatedMedia = await prisma.mediaAsset.update({
      where: { id: params.id },
      data: {
        isFavorite: !media.isFavorite,
      },
    })

    return NextResponse.json(updatedMedia)
  } catch (error) {
    console.error('Error toggling favorite:', error)
    return NextResponse.json(
      { error: 'Failed to toggle favorite', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
