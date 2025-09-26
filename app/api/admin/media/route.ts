import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const assets = await prisma.mediaAsset.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      assets
    })
  } catch (error) {
    console.error('Error fetching media assets:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch media assets' 
      },
      { status: 500 }
    )
  }
}