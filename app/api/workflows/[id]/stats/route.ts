/**
 * Workflow Statistics API
 * 
 * GET /api/workflows/[id]/stats - Get workflow performance statistics
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * GET /api/workflows/[id]/stats
 * Get comprehensive workflow statistics
 */
export async function GET(
  request: Request,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get workflow
    // @ts-expect-error - workflow model added via Prisma extension
    const workflow = await prisma.workflow.findUnique({
      where: { id: params.id },
    })

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    // Check permissions
    if (
      session.user.role !== 'ADMIN' &&
      session.user.role !== 'SUPER_ADMIN' &&
      workflow.createdBy !== session.user.id
    ) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Get time range from query params
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get execution statistics
    const [
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      recentExecutions,
      statusBreakdown,
    ] = await Promise.all([
      // Total executions
      // @ts-expect-error - workflowExecution model added via Prisma extension
      prisma.workflowExecution.count({
        where: {
          workflowId: params.id,
          createdAt: { gte: startDate },
        },
      }),

      // Successful executions
      // @ts-expect-error - workflowExecution model added via Prisma extension
      prisma.workflowExecution.count({
        where: {
          workflowId: params.id,
          status: 'SUCCESS',
          createdAt: { gte: startDate },
        },
      }),

      // Failed executions
      // @ts-expect-error - workflowExecution model added via Prisma extension
      prisma.workflowExecution.count({
        where: {
          workflowId: params.id,
          status: 'FAILED',
          createdAt: { gte: startDate },
        },
      }),

      // Recent executions for trend
      // @ts-expect-error - workflowExecution model added via Prisma extension
      prisma.workflowExecution.findMany({
        where: {
          workflowId: params.id,
          createdAt: { gte: startDate },
        },
        select: {
          status: true,
          duration: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      }),

      // Status breakdown
      // @ts-expect-error - workflowExecution model added via Prisma extension
      prisma.workflowExecution.groupBy({
        by: ['status'],
        where: {
          workflowId: params.id,
          createdAt: { gte: startDate },
        },
        _count: true,
      }),
    ])

    // Calculate success rate
    const successRate = totalExecutions > 0
      ? (successfulExecutions / totalExecutions) * 100
      : 0

    // Calculate average duration
    const executionsWithDuration = recentExecutions.filter((e: { duration: number | null }) => e.duration !== null)
    const avgDuration = executionsWithDuration.length > 0
      ? executionsWithDuration.reduce((sum: number, e: { duration: number | null }) => sum + (e.duration || 0), 0) / executionsWithDuration.length
      : 0

    // Calculate execution trend (by day)
    const executionsByDay = new Map<string, { success: number; failed: number; total: number }>()
    recentExecutions.forEach((execution: { createdAt: Date; status: string }) => {
      const day = execution.createdAt.toISOString().split('T')[0]
      const current = executionsByDay.get(day) || { success: 0, failed: 0, total: 0 }
      
      current.total++
      if (execution.status === 'SUCCESS') current.success++
      if (execution.status === 'FAILED') current.failed++
      
      executionsByDay.set(day, current)
    })

    const trend = Array.from(executionsByDay.entries()).map(([date, stats]) => ({
      date,
      ...stats,
      successRate: stats.total > 0 ? (stats.success / stats.total) * 100 : 0,
    }))

    // Format status breakdown
    const statusStats = statusBreakdown.reduce((acc: Record<string, number>, item: { status: string; _count: number }) => {
      acc[item.status] = item._count
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      overview: {
        totalExecutions,
        successfulExecutions,
        failedExecutions,
        successRate: Math.round(successRate * 100) / 100,
        avgDurationMs: Math.round(avgDuration),
        avgDurationSeconds: Math.round(avgDuration / 1000),
      },
      statusBreakdown: statusStats,
      trend,
      workflow: {
        id: workflow.id,
        name: workflow.name,
        enabled: workflow.enabled,
        lastExecutionAt: workflow.lastExecutionAt,
        totalExecutions: workflow.executionCount,
        totalSuccess: workflow.successCount,
        totalFailure: workflow.failureCount,
      },
      timeRange: {
        days,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Workflow stats fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workflow statistics' },
      { status: 500 }
    )
  }
}
