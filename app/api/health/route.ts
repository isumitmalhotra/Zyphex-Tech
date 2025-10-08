import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getRedisClient } from '@/lib/cache/redis'

const prisma = new PrismaClient()

export async function GET() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    checks: {
      database: { status: 'unknown' as 'healthy' | 'unhealthy', latency: 0 },
      cache: { status: 'unknown' as 'healthy' | 'unhealthy', latency: 0 },
      memory: { status: 'healthy' as 'healthy' | 'unhealthy', usage: 0, percentage: 0 }
    }
  }

  try {
    // Test database connection
    const startTime = Date.now()
    
    // Simple connection test
    await prisma.$queryRaw`SELECT 1`
    
    const connectionTime = Date.now() - startTime
    
    health.checks.database = {
      status: 'healthy',
      latency: connectionTime
    }
    
    // Test Redis cache
    try {
      const redis = getRedisClient()
      if (redis) {
        const cacheStart = Date.now()
        await redis.ping()
        health.checks.cache = {
          status: 'healthy',
          latency: Date.now() - cacheStart
        }
      }
    } catch {
      health.checks.cache.status = 'unhealthy'
    }
    
    // Check memory
    const memUsage = process.memoryUsage()
    const memoryPercentage = (memUsage.heapUsed / memUsage.heapTotal) * 100
    health.checks.memory = {
      status: memoryPercentage > 90 ? 'unhealthy' : 'healthy',
      usage: Math.round(memUsage.heapUsed / 1024 / 1024),
      percentage: Math.round(memoryPercentage)
    }
    
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
      ...health,
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
    
    return NextResponse.json(healthData, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    })
    
  } catch (error) {
    health.status = 'unhealthy'
    health.checks.database.status = 'unhealthy'
    
    const errorData = {
      success: false,
      ...health,
      message: 'Database connection failed',
      database: {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown database error'
      },
      environment: process.env.NODE_ENV || 'development'
    }
    
    return NextResponse.json(errorData, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    })
    
  } finally {
    await prisma.$disconnect()
  }
}