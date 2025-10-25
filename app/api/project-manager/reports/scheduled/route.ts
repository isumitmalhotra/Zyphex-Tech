import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: Fetch all scheduled reports
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const scheduledReports = await prisma.scheduledReport.findMany({
      where: { createdById: session.user.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ scheduledReports })
  } catch (error) {
    console.error('Error fetching scheduled reports:', error)
    return NextResponse.json(
      { error: 'Failed to fetch scheduled reports' },
      { status: 500 }
    )
  }
}

// POST: Create new scheduled report
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      reportType,
      frequency,
      recipients,
      projectIds,
      teamMemberIds,
      includeSections,
      enabled,
    } = body

    const scheduledReport = await prisma.scheduledReport.create({
      data: {
        name,
        reportType,
        frequency,
        recipients: JSON.stringify(recipients || []),
        projectIds: JSON.stringify(projectIds || []),
        teamMemberIds: JSON.stringify(teamMemberIds || []),
        sections: JSON.stringify(includeSections || []),
        enabled: enabled !== false,
        createdById: session.user.id,
        nextRunAt: calculateNextRun(frequency),
      },
    })

    return NextResponse.json({ scheduledReport })
  } catch (error) {
    console.error('Error creating scheduled report:', error)
    return NextResponse.json(
      { error: 'Failed to create scheduled report' },
      { status: 500 }
    )
  }
}

// PATCH: Update scheduled report
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'Report ID required' }, { status: 400 })
    }

    const scheduledReport = await prisma.scheduledReport.update({
      where: {
        id,
        createdById: session.user.id,
      },
      data: {
        ...updateData,
        ...(updateData.recipients && {
          recipients: JSON.stringify(updateData.recipients),
        }),
        ...(updateData.projectIds && {
          projectIds: JSON.stringify(updateData.projectIds),
        }),
        ...(updateData.teamMemberIds && {
          teamMemberIds: JSON.stringify(updateData.teamMemberIds),
        }),
        ...(updateData.sections && {
          sections: JSON.stringify(updateData.sections),
        }),
        ...(updateData.frequency && {
          nextRunAt: calculateNextRun(updateData.frequency),
        }),
      },
    })

    return NextResponse.json({ scheduledReport })
  } catch (error) {
    console.error('Error updating scheduled report:', error)
    return NextResponse.json(
      { error: 'Failed to update scheduled report' },
      { status: 500 }
    )
  }
}

// DELETE: Delete scheduled report
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const reportId = searchParams.get('id')

    if (!reportId) {
      return NextResponse.json({ error: 'Report ID required' }, { status: 400 })
    }

    await prisma.scheduledReport.delete({
      where: {
        id: reportId,
        createdById: session.user.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting scheduled report:', error)
    return NextResponse.json(
      { error: 'Failed to delete scheduled report' },
      { status: 500 }
    )
  }
}

// Helper function to calculate next run time
function calculateNextRun(frequency: string): Date {
  const now = new Date()

  switch (frequency) {
    case 'DAILY':
      now.setDate(now.getDate() + 1)
      break
    case 'WEEKLY':
      now.setDate(now.getDate() + 7)
      break
    case 'MONTHLY':
      now.setMonth(now.getMonth() + 1)
      break
    case 'QUARTERLY':
      now.setMonth(now.getMonth() + 3)
      break
    default:
      now.setDate(now.getDate() + 1) // Default to daily
  }

  return now
}
