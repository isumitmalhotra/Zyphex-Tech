// GET/POST/PUT/DELETE /api/reports/schedule - Manage report schedules

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { reportScheduler } from '@/lib/services/report-scheduler'
import { z } from 'zod'

const createScheduleSchema = z.object({
  name: z.string().min(1, 'Schedule name is required'),
  description: z.string().optional(),
  templateId: z.string().min(1, 'Template ID is required'),
  frequency: z.enum(['ONCE', 'DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']),
  cronExpression: z.string().optional(),
  timezone: z.string().default('UTC'),
  format: z.enum(['PDF', 'EXCEL', 'CSV', 'JSON']),
  recipients: z.array(z.string().email()).min(1, 'At least one recipient is required'),
  emailSubject: z.string().optional(),
  emailBody: z.string().optional(),
  config: z.object({
    filters: z.array(z.object({
      field: z.string(),
      operator: z.string(),
      value: z.any()
    })).default([]),
    dateRange: z.object({
      start: z.string(),
      end: z.string()
    }).optional(),
    groupBy: z.array(z.string()).optional(),
    sortBy: z.array(z.object({
      field: z.string(),
      direction: z.enum(['asc', 'desc'])
    })).optional()
  })
})

const updateScheduleSchema = createScheduleSchema.partial().omit({ templateId: true })

// GET - List all schedules
// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'PROJECT_MANAGER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('isActive')
    const frequency = searchParams.get('frequency')

    const where: any = {}
    
    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }
    
    if (frequency) {
      where.frequency = frequency
    }

    const [schedules, total, activeCount, inactiveCount] = await Promise.all([
      prisma.reportSchedule.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          template: true,
          _count: {
            select: {
              reports: true
            }
          }
        }
      }),
      prisma.reportSchedule.count({ where }),
      prisma.reportSchedule.count({ where: { isActive: true } }),
      prisma.reportSchedule.count({ where: { isActive: false } })
    ])

    return NextResponse.json({
      schedules,
      total,
      active: activeCount,
      inactive: inactiveCount
    })
  } catch (error) {
    console.error('Error fetching schedules:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new schedule
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'PROJECT_MANAGER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createScheduleSchema.parse(body)

    // Verify template exists
    const template = await prisma.reportTemplate.findUnique({
      where: { id: validatedData.templateId }
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    const schedule = await reportScheduler.createSchedule({
      ...validatedData,
      createdBy: session.user.id
    })

    return NextResponse.json({
      success: true,
      schedule,
      message: 'Schedule created successfully'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating schedule:', error)
    return NextResponse.json(
      {
        error: 'Failed to create schedule',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// PUT - Update schedule
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'PROJECT_MANAGER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const scheduleId = searchParams.get('id')

    if (!scheduleId) {
      return NextResponse.json(
        { error: 'Schedule ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = updateScheduleSchema.parse(body)

    const schedule = await reportScheduler.updateSchedule(scheduleId, validatedData)

    return NextResponse.json({
      success: true,
      schedule,
      message: 'Schedule updated successfully'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating schedule:', error)
    return NextResponse.json(
      {
        error: 'Failed to update schedule',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// DELETE - Delete schedule
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'PROJECT_MANAGER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const scheduleId = searchParams.get('id')

    if (!scheduleId) {
      return NextResponse.json(
        { error: 'Schedule ID is required' },
        { status: 400 }
      )
    }

    await reportScheduler.deleteSchedule(scheduleId)

    return NextResponse.json({
      success: true,
      message: 'Schedule deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting schedule:', error)
    return NextResponse.json(
      {
        error: 'Failed to delete schedule',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
