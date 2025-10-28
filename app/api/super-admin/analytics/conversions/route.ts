import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/* eslint-disable @typescript-eslint/no-explicit-any */

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build date filter
    const dateFilter: any = {}
    if (startDate) {
      dateFilter.gte = new Date(startDate)
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate)
    }

    // Fetch leads data for conversion funnel
    const leads = await prisma.lead.findMany({
      where: {
        ...(Object.keys(dateFilter).length > 0 && {
          createdAt: dateFilter,
        }),
      },
      select: {
        id: true,
        status: true,
        source: true,
        value: true,
        qualificationScore: true,
        createdAt: true,
        convertedToClient: true,
        convertedAt: true,
      },
    })

    // Fetch deals for conversion tracking
    const deals = await prisma.deal.findMany({
      where: {
        ...(Object.keys(dateFilter).length > 0 && {
          createdAt: dateFilter,
        }),
      },
      select: {
        id: true,
        stage: true,
        value: true,
        probability: true,
        closeDate: true,
        createdAt: true,
      },
    })

    // Calculate conversion funnel
    const funnelStages = {
      leads: leads.length,
      contacted: leads.filter(l => 
        ['CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON'].includes(l.status)
      ).length,
      qualified: leads.filter(l => 
        ['QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON'].includes(l.status)
      ).length,
      proposal: leads.filter(l => 
        ['PROPOSAL', 'NEGOTIATION', 'WON'].includes(l.status)
      ).length,
      negotiation: leads.filter(l => 
        ['NEGOTIATION', 'WON'].includes(l.status)
      ).length,
      won: leads.filter(l => l.status === 'WON' || l.convertedToClient).length,
    }

    // Calculate conversion rates
    const conversionRates = {
      leadToContacted: funnelStages.leads > 0 
        ? Math.round((funnelStages.contacted / funnelStages.leads) * 100) 
        : 0,
      contactedToQualified: funnelStages.contacted > 0 
        ? Math.round((funnelStages.qualified / funnelStages.contacted) * 100) 
        : 0,
      qualifiedToProposal: funnelStages.qualified > 0 
        ? Math.round((funnelStages.proposal / funnelStages.qualified) * 100) 
        : 0,
      proposalToNegotiation: funnelStages.proposal > 0 
        ? Math.round((funnelStages.negotiation / funnelStages.proposal) * 100) 
        : 0,
      negotiationToWon: funnelStages.negotiation > 0 
        ? Math.round((funnelStages.won / funnelStages.negotiation) * 100) 
        : 0,
      overallConversion: funnelStages.leads > 0 
        ? Math.round((funnelStages.won / funnelStages.leads) * 100) 
        : 0,
    }

    // Lead sources analysis
    const sourceGroups: any = {}
    leads.forEach(lead => {
      const source = lead.source || 'OTHER'
      if (!sourceGroups[source]) {
        sourceGroups[source] = {
          source,
          totalLeads: 0,
          converted: 0,
          totalValue: 0,
          avgScore: 0,
          scores: [],
        }
      }
      sourceGroups[source].totalLeads++
      sourceGroups[source].totalValue += lead.value || 0
      sourceGroups[source].scores.push(lead.qualificationScore || 0)
      if (lead.convertedToClient || lead.status === 'WON') {
        sourceGroups[source].converted++
      }
    })

    const leadSources = Object.values(sourceGroups).map((group: any) => ({
      source: group.source,
      leads: group.totalLeads,
      converted: group.converted,
      conversionRate: group.totalLeads > 0 
        ? Math.round((group.converted / group.totalLeads) * 100) 
        : 0,
      totalValue: group.totalValue,
      avgQualityScore: group.scores.length > 0 
        ? Math.round(group.scores.reduce((a: number, b: number) => a + b, 0) / group.scores.length) 
        : 0,
    })).sort((a: any, b: any) => b.leads - a.leads)

    // Deal pipeline analysis
    const pipelineStages = {
      qualified: deals.filter(d => d.stage === 'QUALIFIED').length,
      proposal: deals.filter(d => d.stage === 'PROPOSAL').length,
      negotiation: deals.filter(d => d.stage === 'NEGOTIATION').length,
      closed: deals.filter(d => d.stage === 'CLOSED_WON').length,
      lost: deals.filter(d => d.stage === 'CLOSED_LOST').length,
    }

    const pipelineValue = {
      qualified: deals
        .filter(d => d.stage === 'QUALIFIED')
        .reduce((sum, d) => sum + (d.value || 0), 0),
      proposal: deals
        .filter(d => d.stage === 'PROPOSAL')
        .reduce((sum, d) => sum + (d.value || 0), 0),
      negotiation: deals
        .filter(d => d.stage === 'NEGOTIATION')
        .reduce((sum, d) => sum + (d.value || 0), 0),
      closed: deals
        .filter(d => d.stage === 'CLOSED_WON')
        .reduce((sum, d) => sum + (d.value || 0), 0),
      lost: deals
        .filter(d => d.stage === 'CLOSED_LOST')
        .reduce((sum, d) => sum + (d.value || 0), 0),
    }

    // Time to conversion analysis
    const convertedLeads = leads.filter(l => l.convertedToClient && l.convertedAt)
    const avgTimeToConversion = convertedLeads.length > 0
      ? convertedLeads.reduce((sum, lead) => {
          const days = Math.floor(
            (new Date(lead.convertedAt!).getTime() - new Date(lead.createdAt).getTime()) 
            / (1000 * 60 * 60 * 24)
          )
          return sum + days
        }, 0) / convertedLeads.length
      : 0

    // Monthly trend
    const monthlyData = calculateMonthlyTrend(leads, deals)

    // Top performing metrics
    const topMetrics = {
      bestSource: leadSources.length > 0 ? leadSources[0].source : 'N/A',
      bestSourceConversionRate: leadSources.length > 0 ? leadSources[0].conversionRate : 0,
      totalPipelineValue: Object.values(pipelineValue).reduce((sum: any, val) => sum + val, 0),
      totalClosedValue: pipelineValue.closed,
      avgDealSize: deals.length > 0 
        ? Math.round(deals.reduce((sum, d) => sum + (d.value || 0), 0) / deals.length) 
        : 0,
      winRate: (pipelineStages.closed + pipelineStages.lost) > 0
        ? Math.round((pipelineStages.closed / (pipelineStages.closed + pipelineStages.lost)) * 100)
        : 0,
    }

    return NextResponse.json({
      success: true,
      source: 'database',
      funnel: funnelStages,
      conversionRates,
      leadSources,
      pipeline: {
        stages: pipelineStages,
        value: pipelineValue,
      },
      metrics: {
        totalLeads: leads.length,
        totalDeals: deals.length,
        avgTimeToConversion: Math.round(avgTimeToConversion),
        ...topMetrics,
      },
      monthlyTrend: monthlyData,
    })
  } catch (error) {
    console.error('Error fetching conversion analytics:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch conversion analytics',
      },
      { status: 500 }
    )
  }
}

/**
 * Calculate monthly trend data
 */
function calculateMonthlyTrend(leads: any[], deals: any[]) {
  const months: any = {}
  const now = new Date()

  // Initialize last 12 months
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    months[key] = {
      month: key,
      leads: 0,
      converted: 0,
      deals: 0,
      closed: 0,
      value: 0,
    }
  }

  // Count leads
  leads.forEach(lead => {
    const date = new Date(lead.createdAt)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    if (months[key]) {
      months[key].leads++
      if (lead.convertedToClient || lead.status === 'WON') {
        months[key].converted++
      }
    }
  })

  // Count deals
  deals.forEach(deal => {
    const date = new Date(deal.createdAt)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    if (months[key]) {
      months[key].deals++
      if (deal.stage === 'CLOSED_WON') {
        months[key].closed++
        months[key].value += deal.value || 0
      }
    }
  })

  return Object.values(months)
}
