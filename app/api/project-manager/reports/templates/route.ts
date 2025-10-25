import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: Fetch all report templates
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const templates = await prisma.reportTemplate.findMany({
      where: {
        OR: [
          { isPublic: true },
          { createdById: session.user.id },
        ],
      },
      orderBy: { createdAt: 'desc' },
    })

    // Pre-built templates
    const prebuiltTemplates = [
      {
        id: 'weekly-status',
        name: 'Weekly Status Report',
        type: 'PROJECT_STATUS',
        description: 'Weekly project status update with progress and blockers',
        sections: ['overview', 'milestones', 'tasks', 'blockers', 'nextSteps'],
        isPublic: true,
        isPrebuilt: true,
      },
      {
        id: 'monthly-performance',
        name: 'Monthly Performance Report',
        type: 'TEAM_PERFORMANCE',
        description: 'Monthly team performance metrics and productivity analysis',
        sections: ['teamMetrics', 'productivity', 'hoursLogged', 'completionRates'],
        isPublic: true,
        isPrebuilt: true,
      },
      {
        id: 'quarterly-financial',
        name: 'Quarterly Financial Report',
        type: 'FINANCIAL',
        description: 'Quarterly financial summary with budget and revenue',
        sections: ['budgetOverview', 'revenue', 'expenses', 'profitMargin'],
        isPublic: true,
        isPrebuilt: true,
      },
      {
        id: 'time-tracking-summary',
        name: 'Time Tracking Summary',
        type: 'TIME',
        description: 'Detailed time tracking report with billable hours',
        sections: ['hoursBreakdown', 'billableHours', 'projectTime', 'teamTime'],
        isPublic: true,
        isPrebuilt: true,
      },
      {
        id: 'client-progress',
        name: 'Client Progress Report',
        type: 'CLIENT',
        description: 'Client-facing progress report with deliverables',
        sections: ['progress', 'deliverables', 'milestones', 'upcomingTasks'],
        isPublic: true,
        isPrebuilt: true,
      },
    ]

    return NextResponse.json({
      templates: [...prebuiltTemplates, ...templates],
    })
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}

// POST: Create new custom template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, type, description, sections, branding, isPublic } = body

    const template = await prisma.reportTemplate.create({
      data: {
        name,
        type,
        description,
        sections: JSON.stringify(sections),
        branding: JSON.stringify(branding || {}),
        isPublic: isPublic || false,
        createdById: session.user.id,
      },
    })

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Error creating template:', error)
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    )
  }
}
