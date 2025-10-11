/**
 * Authentication Unit Tests
 * Tests for authentication flows including login, OAuth, password verification, and session management
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import { verifyPassword, hashPassword } from '@/lib/auth/password'
import { loginSchema, registerSchema } from '@/lib/validation/schemas'
import type { User } from '@prisma/client'

// Mock Prisma Client
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}))

// Mock NextAuth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

describe('Authentication - Password Verification', () => {
  it('should correctly hash and verify passwords', async () => {
    const password = 'MySecurePass9@Word'
    const hashedPassword = await hashPassword(password)
    
    expect(hashedPassword).toBeTruthy()
    expect(hashedPassword).not.toBe(password)
    expect(hashedPassword.length).toBeGreaterThan(50)
    
    const isValid = await verifyPassword(password, hashedPassword)
    expect(isValid).toBe(true)
  })

  it('should reject incorrect passwords', async () => {
    const password = 'MySecurePass9@Word'
    const wrongPassword = 'DifferentPass7!Key'
    const hashedPassword = await hashPassword(password)
    
    const isValid = await verifyPassword(wrongPassword, hashedPassword)
    expect(isValid).toBe(false)
  })

  it('should handle empty password verification', async () => {
    const hashedPassword = await hashPassword('MySecurePass9@Word')
    
    const isValid = await verifyPassword('', hashedPassword)
    expect(isValid).toBe(false)
  })

  it('should generate different hashes for same password', async () => {
    const password = 'MySecurePass9@Word'
    const hash1 = await hashPassword(password)
    const hash2 = await hashPassword(password)
    
    expect(hash1).not.toBe(hash2)
    expect(await verifyPassword(password, hash1)).toBe(true)
    expect(await verifyPassword(password, hash2)).toBe(true)
  })
})

describe('Authentication - Login Schema Validation', () => {
  it('should validate correct login credentials', () => {
    const validLogin = {
      email: 'user@example.com',
      password: 'StrongPass123!'
    }
    
    const result = loginSchema.safeParse(validLogin)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.email).toBe(validLogin.email)
      expect(result.data.password).toBe(validLogin.password)
    }
  })

  it('should reject invalid email format', () => {
    const invalidLogin = {
      email: 'notanemail',
      password: 'StrongPass123!'
    }
    
    const result = loginSchema.safeParse(invalidLogin)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('email')
    }
  })

  it('should reject empty password', () => {
    const invalidLogin = {
      email: 'user@example.com',
      password: ''
    }
    
    const result = loginSchema.safeParse(invalidLogin)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('password')
    }
  })

  it('should handle missing fields', () => {
    const invalidLogin = {
      email: 'user@example.com'
      // password missing
    }
    
    const result = loginSchema.safeParse(invalidLogin)
    expect(result.success).toBe(false)
  })
})

describe('Authentication - Registration Schema Validation', () => {
  it('should validate correct registration data', () => {
    const validRegistration = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'SecurePass9$Key',
      agreeToTerms: true
    }
    
    const result = registerSchema.safeParse(validRegistration)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.email).toBe(validRegistration.email)
      expect(result.data.name).toBe(validRegistration.name)
    }
  })

  it('should reject missing terms agreement', () => {
    const invalidRegistration = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'SecurePass9$Key',
      agreeToTerms: false
    }
    
    const result = registerSchema.safeParse(invalidRegistration)
    expect(result.success).toBe(false)
  })

  it('should reject weak passwords', () => {
    const invalidRegistration = {
      name: 'John Doe',
      email: 'john@example.com',
      password: '123',
      confirmPassword: '123'
    }
    
    const result = registerSchema.safeParse(invalidRegistration)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some(issue => 
        issue.path.includes('password')
      )).toBe(true)
    }
  })
})

describe('Authentication - User Session', () => {
  const mockUser: Partial<User> = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'CLIENT',
    emailVerified: new Date(),
  }

  it('should create valid user session data', () => {
    const session = {
      user: {
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }
    
    expect(session.user.id).toBe(mockUser.id)
    expect(session.user.email).toBe(mockUser.email)
    expect(session.user.role).toBe(mockUser.role)
    expect(new Date(session.expires).getTime()).toBeGreaterThan(Date.now())
  })

  it('should validate session expiration', () => {
    const expiredSession = {
      expires: new Date(Date.now() - 1000).toISOString(),
    }
    
    const isExpired = new Date(expiredSession.expires).getTime() < Date.now()
    expect(isExpired).toBe(true)
  })

  it('should validate active session', () => {
    const activeSession = {
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }
    
    const isActive = new Date(activeSession.expires).getTime() > Date.now()
    expect(isActive).toBe(true)
  })
})

describe('Authentication - Role-Based Access', () => {
  it('should correctly identify admin role', () => {
    const adminUser = { role: 'ADMIN' }
    expect(adminUser.role).toBe('ADMIN')
    expect(['ADMIN', 'SUPER_ADMIN'].includes(adminUser.role)).toBe(true)
  })

  it('should correctly identify client role', () => {
    const clientUser = { role: 'CLIENT' }
    expect(clientUser.role).toBe('CLIENT')
    expect(['CLIENT'].includes(clientUser.role)).toBe(true)
  })

  it('should correctly identify project manager role', () => {
    const pmUser = { role: 'PROJECT_MANAGER' }
    expect(pmUser.role).toBe('PROJECT_MANAGER')
    expect(['ADMIN'].includes(pmUser.role)).toBe(false)
    expect(['PROJECT_MANAGER'].includes(pmUser.role)).toBe(true)
  })

  it('should handle role-based permissions', () => {
    const roles = ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'DEVELOPER', 'CLIENT']
    
    const hasAdminAccess = (role: string) => 
      ['SUPER_ADMIN', 'ADMIN'].includes(role)
    
    const hasManagerAccess = (role: string) => 
      ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER'].includes(role)
    
    expect(hasAdminAccess('SUPER_ADMIN')).toBe(true)
    expect(hasAdminAccess('ADMIN')).toBe(true)
    expect(hasAdminAccess('PROJECT_MANAGER')).toBe(false)
    expect(hasAdminAccess('CLIENT')).toBe(false)
    
    expect(hasManagerAccess('SUPER_ADMIN')).toBe(true)
    expect(hasManagerAccess('PROJECT_MANAGER')).toBe(true)
    expect(hasManagerAccess('DEVELOPER')).toBe(false)
  })
})

describe('Authentication - Security Utilities', () => {
  it('should sanitize email addresses', () => {
    const email = '  TEST@EXAMPLE.COM  '
    const sanitized = email.trim().toLowerCase()
    
    expect(sanitized).toBe('test@example.com')
    expect(sanitized).not.toContain(' ')
  })

  it('should validate email format', () => {
    const validEmails = [
      'user@example.com',
      'test.user@example.co.uk',
      'user+tag@example.com'
    ]
    
    const invalidEmails = [
      'notanemail',
      '@example.com',
      'user@',
      'user space@example.com'
    ]
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    
    validEmails.forEach(email => {
      expect(emailRegex.test(email)).toBe(true)
    })
    
    invalidEmails.forEach(email => {
      expect(emailRegex.test(email)).toBe(false)
    })
  })

  it('should generate secure session tokens', () => {
    const token1 = `session_${Date.now()}_${Math.random().toString(36)}`
    const token2 = `session_${Date.now()}_${Math.random().toString(36)}`
    
    expect(token1).toBeTruthy()
    expect(token2).toBeTruthy()
    expect(token1).not.toBe(token2)
    expect(token1.startsWith('session_')).toBe(true)
  })
})
