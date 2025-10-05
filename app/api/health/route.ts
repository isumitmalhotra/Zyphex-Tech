import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Test database connection
    const startTime = Date.now()
    
    // Simple connection test
    await prisma.$queryRaw`SELECT 1`
    
    const connectionTime = Date.now() - startTime
    
    // Get basic statistics
    const [
      userCount,
      clientCount,
      projectCount,
      taskCount
    ] = await Promise.all([
      prisma.user.count(),
      prisma.client.count(),
      prisma.project.count(),
      prisma.task.count()
    ])
    
    const healthData = {
      success: true,
      status: 'healthy',
      message: 'Dashboard system is properly configured',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        connectionTime: `${connectionTime}ms`,
        status: 'operational'
      },
      statistics: {
        users: userCount,
        clients: clientCount,
        projects: projectCount,
        tasks: taskCount
      },
      availableRoles: [
        'SUPER_ADMIN',
        'ADMIN', 
        'PROJECT_MANAGER',
        'TEAM_MEMBER',
        'CLIENT',
        'USER'
      ],
      environment: process.env.NODE_ENV || 'development'
    }
    
    return NextResponse.json(healthData, { status: 200 })
    
  } catch (error) {
    console.error('Health check failed:', error)
    
    const errorData = {
      success: false,
      status: 'unhealthy',
      message: 'Database connection failed',
      timestamp: new Date().toISOString(),
      database: {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown database error'
      },
      environment: process.env.NODE_ENV || 'development'
    }
    
    return NextResponse.json(errorData, { status: 503 })
    
  } finally {
    await prisma.$disconnect()
  }
}