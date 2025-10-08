import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { hashPassword } from '@/lib/auth/password'
import { registerSchema } from '@/lib/validation/schemas'
import { secureApiRoute } from '@/lib/auth/security-middleware'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  // Apply security middleware with rate limiting and validation
  const { security, data, error } = await secureApiRoute(
    request,
    'registration',
    registerSchema
  )
  
  if (error) {
    return error
  }

  if (!data) {
    return security.createErrorResponse('Invalid request data', 400)
  }

  const { name, email, password, role } = data

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      return security.createErrorResponse('User already exists with this email', 409)
    }

    // Hash password with enhanced security
    const hashedPassword = await hashPassword(password)

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: role || 'USER',
        emailVerified: null, // Will be verified via email
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    })

    return security.createResponse({
      success: true,
      message: 'Account created successfully. Please verify your email.',
      user: newUser,
      requiresEmailVerification: true
    }, 201)

  } catch (error) {
    return security.createErrorResponse(
      'Failed to create account. Please try again.',
      500
    )
  } finally {
    await prisma.$disconnect()
  }
}