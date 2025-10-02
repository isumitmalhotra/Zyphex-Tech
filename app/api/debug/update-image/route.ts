import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Update current user with a test Google profile image
    const testImageUrl = 'https://lh3.googleusercontent.com/a/ACg8ocKxVxvqQ8q8q8q8q8q8q8q8q8q8q8q8q8q8q8q8q8q8q8=s96-c'
    
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { image: testImageUrl },
      select: { id: true, email: true, name: true, image: true }
    })

    return NextResponse.json({
      message: 'User image updated successfully',
      user: updatedUser
    })
    
  } catch (error) {
    console.error('Error updating user image:', error)
    return NextResponse.json(
      { error: 'Failed to update user image' }, 
      { status: 500 }
    )
  }
}