import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * Authentication helpers for testing
 */

/**
 * Mock authenticated session for testing
 */
export const mockAuthenticatedSession = (role: string = 'USER') => {
  const session = {
    user: {
      id: `test-${role.toLowerCase()}-id`,
      email: `test-${role.toLowerCase()}@example.com`,
      name: `Test ${role}`,
      role,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }

  jest.spyOn(require('next-auth'), 'getServerSession').mockResolvedValue(session)
  
  return session
}

/**
 * Mock unauthenticated session
 */
export const mockUnauthenticatedSession = () => {
  jest.spyOn(require('next-auth'), 'getServerSession').mockResolvedValue(null)
}

/**
 * Create test JWT token
 */
export const createTestToken = (userId: string, role: string = 'USER') => {
  const jwt = require('jsonwebtoken')
  return jwt.sign(
    {
      id: userId,
      role,
    },
    process.env.NEXTAUTH_SECRET || 'test-secret',
    { expiresIn: '24h' }
  )
}

/**
 * Verify test requires authentication
 */
export const requiresAuthentication = async (
  handler: any,
  expectedStatus = 401
) => {
  mockUnauthenticatedSession()
  
  const response = await handler()
  
  expect(response.status).toBe(expectedStatus)
}

/**
 * Verify test requires specific role
 */
export const requiresRole = async (
  handler: any,
  requiredRole: string,
  userRole: string = 'USER',
  expectedStatus = 403
) => {
  mockAuthenticatedSession(userRole)
  
  const response = await handler()
  
  if (userRole !== requiredRole) {
    expect(response.status).toBe(expectedStatus)
  } else {
    expect(response.status).not.toBe(expectedStatus)
  }
}

/**
 * Login test user
 */
export const loginTestUser = async (email: string, password: string) => {
  const { signIn } = require('next-auth/react')
  
  const result = await signIn('credentials', {
    email,
    password,
    redirect: false,
  })
  
  return result
}

/**
 * Create authenticated headers for API requests
 */
export const createAuthHeaders = (token: string) => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`,
})
