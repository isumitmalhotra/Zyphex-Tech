import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { hashPassword } from '@/lib/auth/password'
import { z } from 'zod'
import crypto from 'crypto'
import { generateVerificationEmail, generateWelcomeEmail } from '@/lib/email/templates'
import { sendEmail } from '@/lib/email'
import { secureApiRoute } from '@/lib/auth/security-middleware'

const prisma = new PrismaClient()

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['USER', 'ADMIN']).optional(),
})

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

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

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

    // Create verification token in the database
    await prisma.verificationToken.create({
      data: {
        identifier: newUser.email,
        token: verificationToken,
        expires
      }
    })

    // Generate verification URL
    const appUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || 'http://localhost:3000'
    const verificationUrl = `${appUrl}/auth/verify-email?token=${verificationToken}&email=${encodeURIComponent(newUser.email)}`

    // Send verification email
    try {
      const verificationEmailTemplate = generateVerificationEmail({
        recipientName: newUser.name || 'there',
        verificationUrl,
        expiryHours: 24,
        appName: process.env.APP_NAME || 'Zyphex Tech',
        appUrl,
        supportEmail: process.env.SUPPORT_EMAIL || 'support@zyphextech.com'
      })

      await sendEmail({
        to: newUser.email,
        subject: verificationEmailTemplate.subject,
        html: verificationEmailTemplate.html,
        text: verificationEmailTemplate.text
      })

      console.log(`✅ Verification email sent to ${newUser.email}`)
    } catch (emailError) {
      console.error('❌ Failed to send verification email:', emailError)
      // Don't fail registration if email fails, user can request resend
    }

    return security.createResponse({
      success: true,
      message: 'Account created successfully. Please check your email to verify your account.',
      user: newUser,
      requiresEmailVerification: true
    }, 201)

  } catch (error) {
    console.error('Registration error:', error)
    
    // Provide more specific error messages
    let errorMessage = 'Failed to create account. Please try again.'
    
    if (error instanceof Error) {
      // Log the full error for debugging
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
      
      // Check for specific database errors
      if (error.message.includes('Unique constraint')) {
        errorMessage = 'An account with this email already exists.'
      } else if (error.message.includes('connection')) {
        errorMessage = 'Database connection error. Please try again in a moment.'
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timeout. Please try again.'
      }
    }
    
    return security.createErrorResponse(errorMessage, 500)
  } finally {
    await prisma.$disconnect()
  }
}