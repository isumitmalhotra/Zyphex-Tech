import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { hasPermission, Permission, ExtendedUser } from './permissions'

export async function protectRoute(
  request: NextRequest,
  requiredPermissions?: Permission[]
): Promise<NextResponse | null> {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (requiredPermissions) {
    const user: ExtendedUser = {
      id: token.sub as string,
      email: token.email as string,
      name: token.name as string,
      role: (token.role as ExtendedUser['role']) || 'user',
    }

    for (const permission of requiredPermissions) {
      if (!hasPermission(user, permission)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }
  }

  return null
}
