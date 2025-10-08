/**
 * Email Service Health Check API
 * 
 * GET /api/health/email
 * 
 * Returns the health status of the email service
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { emailService } from '@/lib/email/service'
import { validateEmailConfig } from '@/lib/email/config'

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          message: 'Admin access required' 
        },
        { status: 401 }
      )
    }

    // Validate configuration
    const validation = validateEmailConfig()
    
    if (!validation.valid) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Email configuration is invalid',
          errors: validation.errors.map(err => ({
            field: err.field,
            message: err.message,
            suggestion: err.suggestion
          })),
          warnings: validation.warnings,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }

    // Test connection
    const connectionTest = await emailService.testConnection()
    
    if (!connectionTest.success) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Email service connection failed',
          provider: connectionTest.provider,
          error: connectionTest.message,
          warnings: validation.warnings,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }

    // Get queue status
    const queueStatus = emailService.getQueueStatus()

    // All checks passed
    return NextResponse.json(
      {
        status: 'healthy',
        message: 'Email service is operational',
        provider: connectionTest.provider,
        configuration: {
          from: validation.config?.from,
          features: validation.config?.features,
          retry: validation.config?.retry
        },
        connection: {
          verified: true,
          details: connectionTest.details
        },
        queue: {
          size: queueStatus.size,
          pendingEmails: queueStatus.size
        },
        warnings: validation.warnings,
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Email health check error:', error)
    
    return NextResponse.json(
      {
        status: 'error',
        message: 'Health check failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * Send a test email (admin only)
 * 
 * POST /api/health/email
 * Body: { to: string, template?: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          message: 'Admin access required' 
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { to, template } = body

    if (!to) {
      return NextResponse.json(
        {
          error: 'Validation error',
          message: 'Email address is required'
        },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        {
          error: 'Validation error',
          message: 'Invalid email address format'
        },
        { status: 400 }
      )
    }

    // Send test email
    const result = await emailService.sendTestEmail(to)

    if (result.success) {
      return NextResponse.json(
        {
          success: true,
          message: 'Test email sent successfully',
          messageId: result.messageId,
          provider: result.provider,
          attempts: result.attempts,
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      )
    } else {
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to send test email',
          error: result.error,
          provider: result.provider,
          attempts: result.attempts,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Test email error:', error)
    
    return NextResponse.json(
      {
        success: false,
        message: 'Test email failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
