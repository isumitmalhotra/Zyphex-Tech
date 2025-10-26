import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch deals in PROPOSAL stage (these are active proposals)
    const proposals = await prisma.deal.findMany({
      where: {
        stage: {
          in: ['PROPOSAL', 'QUALIFIED', 'NEGOTIATION'] // Include related stages
        }
      },
      include: {
        lead: {
          select: {
            id: true,
            contactName: true,
            companyName: true,
            email: true,
            phone: true,
            source: true,
            status: true
          }
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Format proposals for the UI
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedProposals = proposals.map((deal: any) => {
      // Determine status based on deal stage
      let status = 'pending'
      if (deal.stage === 'CLOSED_WON' || deal.wonAt) status = 'approved'
      else if (deal.stage === 'CLOSED_LOST' || deal.lostAt) status = 'rejected'
      else if (deal.stage === 'NEGOTIATION') status = 'under-review'
      else if (deal.stage === 'PROPOSAL') status = 'pending'

      // Determine priority based on probability and value
      let priority = 'medium'
      if (deal.probability >= 80 || deal.value >= 100000) priority = 'high'
      else if (deal.probability < 40 || deal.value < 30000) priority = 'low'

      return {
        id: deal.id,
        proposalId: `PROP-${deal.id.substring(0, 8).toUpperCase()}`,
        title: deal.title,
        client: deal.lead?.companyName || deal.client?.company || deal.client?.name || 'Unknown Client',
        clientContact: deal.lead?.contactName || deal.client?.name || 'Unknown',
        clientEmail: deal.lead?.email || deal.client?.email || '',
        status,
        submittedDate: deal.createdAt,
        value: deal.value,
        probability: deal.probability,
        closeDate: deal.closeDate,
        dueDate: deal.closeDate, // Use closeDate as dueDate
        description: deal.description || 'No description provided',
        stage: deal.stage,
        priority,
        wonAt: deal.wonAt,
        lostAt: deal.lostAt,
        lostReason: deal.lostReason,
        assignedTo: deal.assignedTo,
        updatedAt: deal.updatedAt
      }
    })

    // Calculate statistics
    const stats = {
      totalProposals: formattedProposals.length,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pending: formattedProposals.filter((p: any) => p.status === 'pending').length,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      approved: formattedProposals.filter((p: any) => p.status === 'approved').length,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rejected: formattedProposals.filter((p: any) => p.status === 'rejected').length,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      underReview: formattedProposals.filter((p: any) => p.status === 'under-review').length,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      totalValue: formattedProposals.reduce((sum: number, p: any) => sum + (p.value || 0), 0),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      avgProbability: Math.round(formattedProposals.reduce((sum: number, p: any) => sum + p.probability, 0) / formattedProposals.length) || 0,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      highPriority: formattedProposals.filter((p: any) => p.priority === 'high').length
    }

    return NextResponse.json({
      proposals: formattedProposals,
      stats
    })

  } catch (error) {
    console.error('Error fetching proposals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch proposals' },
      { status: 500 }
    )
  }
}
