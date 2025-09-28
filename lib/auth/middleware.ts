import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { ExtendedUser } from './permissions'

export async function authenticateRequest(request: NextRequest): Promise<{ user: ExtendedUser | null }> {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return { user: null }
    
    const user: ExtendedUser = {
      id: token.sub as string,
      email: token.email as string,
      name: token.name as string,
      role: (token.role as ExtendedUser['role']) || 'user',
      permissions: token.permissions as string[]
    }
    return { user }
  } catch (error: unknown) {
    console.error('Authentication error:', error)
    return { user: null }
  }
}

export function requireAuth() {
  return async function middleware(request: NextRequest) {
    const { user } = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return null
  }
}

export async function withAuth<T>(
  handler: (request: NextRequest, user: ExtendedUser) => Promise<T>
) {
  return async function(request: NextRequest) {
    const { user } = await authenticateRequest(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    return handler(request, user)
  }
}
