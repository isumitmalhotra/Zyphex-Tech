import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { createResponseFormatter } from '@/lib/api/response-formatter'

// GET /api/users/me - Get current user profile
export async function GET(request: Request) {
  const formatter = createResponseFormatter(request)
  
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return formatter.unauthorized('Authentication required')
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        createdAt: true,
        emailVerified: true,
      }
    })

    if (!user) {
      return formatter.notFound('User', 'current user')
    }

    return formatter.success(user)
  } catch (error) {
    console.error('Error fetching current user:', error)
    return formatter.internalError(error)
  }
}

// PATCH /api/users/me - Update current user profile
export async function PATCH(request: Request) {
  const formatter = createResponseFormatter(request)
  
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return formatter.unauthorized('Authentication required')
    }

    const body = await request.json()
    const { name, image } = body

    // Validate input
    if (name !== undefined && name.length < 2) {
      return formatter.validationError([
        {
          field: 'name',
          message: 'Name must be at least 2 characters',
          code: 'VAL_004'
        }
      ])
    }

    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        ...(name !== undefined && { name }),
        ...(image !== undefined && { image }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        createdAt: true,
        emailVerified: true,
      }
    })

    return formatter.success(user)
  } catch (error) {
    console.error('Error updating current user:', error)
    
    // Handle Prisma errors
    if (error.code === 'P2025') {
      return formatter.notFound('User', 'current user')
    }
    
    return formatter.internalError(error)
  }
}
