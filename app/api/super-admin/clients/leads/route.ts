import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch all leads with their activities
    const leads = await prisma.lead.findMany({
      include: {
        activities: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 5,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        deals: {
          select: {
            id: true,
            title: true,
            value: true,
            stage: true,
            probability: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Format leads for the UI
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedLeads = leads.map((lead: any) => {
      // Map database status to UI stage
      let stage = 'new'
      if (lead.status === 'CONTACTED') stage = 'contacted'
      else if (lead.status === 'QUALIFIED') stage = 'qualified'
      else if (lead.status === 'PROPOSAL') stage = 'proposal'
      else if (lead.status === 'NEGOTIATION') stage = 'negotiation'
      else if (lead.status === 'WON') stage = 'converted'
      else if (lead.status === 'LOST') stage = 'lost'

      // Calculate days in pipeline
      const createdDate = new Date(lead.createdAt)
      const now = new Date()
      const daysInPipeline = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))

      return {
        id: lead.id,
        leadId: `LEAD-${lead.id.substring(0, 8).toUpperCase()}`,
        name: lead.companyName,
        contactPerson: lead.contactName,
        email: lead.email,
        phone: lead.phone,
        company: lead.companyName,
        stage,
        status: lead.status,
        score: lead.qualificationScore,
        source: lead.source.toLowerCase().replace('_', '-'),
        estimatedValue: lead.value,
        budget: lead.budget,
        timeline: lead.timeline,
        companySize: lead.companySize,
        lastContact: lead.lastContact,
        nextFollowUp: lead.nextFollowUp,
        daysInPipeline,
        converted: lead.convertedToClient,
        convertedAt: lead.convertedAt,
        assignedTo: lead.assignedTo,
        notes: lead.notes,
        website: lead.website,
        activities: lead.activities.length,
        deals: lead.deals,
        recentActivities: lead.activities.slice(0, 5),
        createdAt: lead.createdAt,
        updatedAt: lead.updatedAt
      }
    })

    // Calculate statistics
    const stats = {
      totalLeads: formattedLeads.length,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      newLeads: formattedLeads.filter((l: any) => l.stage === 'new').length,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      contacted: formattedLeads.filter((l: any) => l.stage === 'contacted').length,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      qualified: formattedLeads.filter((l: any) => l.stage === 'qualified').length,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      proposal: formattedLeads.filter((l: any) => l.stage === 'proposal').length,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      negotiation: formattedLeads.filter((l: any) => l.stage === 'negotiation').length,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      converted: formattedLeads.filter((l: any) => l.stage === 'converted').length,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      lost: formattedLeads.filter((l: any) => l.stage === 'lost').length,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      totalValue: formattedLeads.reduce((sum: number, l: any) => sum + (l.estimatedValue || 0), 0),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      avgScore: Math.round(formattedLeads.reduce((sum: number, l: any) => sum + l.score, 0) / formattedLeads.length) || 0,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      hotLeads: formattedLeads.filter((l: any) => l.score >= 80).length,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      conversionRate: formattedLeads.length > 0 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? Math.round((formattedLeads.filter((l: any) => l.converted).length / formattedLeads.length) * 100) 
        : 0
    }

    return NextResponse.json({
      leads: formattedLeads,
      stats
    })

  } catch (error) {
    console.error('Error fetching leads:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    )
  }
}
