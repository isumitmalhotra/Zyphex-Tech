import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { withPermissions } from '@/lib/auth/middleware'
import { Prisma } from '@prisma/client'

// Validation schemas
const CreateLeadSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  contactName: z.string().min(1, 'Contact name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  source: z.enum([
    'WEBSITE', 'REFERRAL', 'SOCIAL_MEDIA', 'EMAIL_CAMPAIGN', 'COLD_CALL',
    'TRADE_SHOW', 'PARTNER', 'CONTENT_MARKETING', 'WEBINAR', 'DEMO_REQUEST',
    'PRICING_PAGE', 'ORGANIC_SEARCH', 'PAID_SEARCH', 'LINKEDIN', 'FACEBOOK',
    'TWITTER', 'INSTAGRAM', 'YOUTUBE', 'OTHER'
  ]).default('WEBSITE'),
  status: z.enum([
    'NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 
    'WON', 'LOST', 'NURTURING', 'UNQUALIFIED', 'RE_ENGAGED'
  ]).default('NEW'),
  value: z.number().min(0),
  notes: z.string().optional(),
  assignedTo: z.string().optional(),
  companySize: z.enum(['STARTUP', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE']).optional(),
  budget: z.number().min(0).optional(),
  timeline: z.enum(['IMMEDIATE', '1_MONTH', '3_MONTHS', '6_MONTHS', '1_YEAR']).optional(),
  requirements: z.string().optional(),
  industry: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  campaignId: z.string().optional(),
  referralSource: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
})

const LeadQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
  status: z.string().optional(),
  source: z.string().optional(),
  assignedTo: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  temperature: z.string().optional(),
  companySize: z.string().optional(),
  industry: z.string().optional(),
  minScore: z.string().optional(),
  maxScore: z.string().optional(),
})

type CreateLeadData = z.infer<typeof CreateLeadSchema>

// GET /api/crm/leads - Get all leads with filtering and pagination
export async function GET(request: NextRequest) {
  return withPermissions(['VIEW_CLIENTS'], async (req: NextRequest) => {
    try {
      const { searchParams } = new URL(req.url)
      const query = LeadQuerySchema.parse(Object.fromEntries(searchParams))
      
      const page = parseInt(query.page)
      const limit = parseInt(query.limit)
      const offset = (page - 1) * limit

      // Build where clause
      const where: Prisma.LeadWhereInput = {}
      
      if (query.status) where.status = query.status as Prisma.EnumLeadStatusFilter
      if (query.source) where.source = query.source as Prisma.EnumLeadSourceFilter
      if (query.assignedTo) where.assignedTo = query.assignedTo
      if (query.temperature) where.temperature = query.temperature
      if (query.companySize) where.companySize = query.companySize
      if (query.industry) where.industry = query.industry
      
      if (query.minScore || query.maxScore) {
        where.leadScore = {}
        if (query.minScore) where.leadScore.gte = parseInt(query.minScore)
        if (query.maxScore) where.leadScore.lte = parseInt(query.maxScore)
      }

      if (query.search) {
        where.OR = [
          { companyName: { contains: query.search, mode: 'insensitive' } },
          { contactName: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
          { requirements: { contains: query.search, mode: 'insensitive' } },
        ]
      }

      // Build order by
      const orderBy: Prisma.LeadOrderByWithRelationInput = {}
      orderBy[query.sortBy as keyof Prisma.LeadOrderByWithRelationInput] = query.sortOrder

      const [leads, total] = await Promise.all([
        prisma.lead.findMany({
          where,
          include: {
            deals: {
              include: {
                _count: true
              }
            },
            activities: {
              orderBy: { createdAt: 'desc' },
              take: 3,
              include: {
                user: {
                  select: { name: true, email: true }
                }
              }
            },
            scoring: true,
            nurturingSequences: {
              where: { status: 'ACTIVE' },
              include: {
                steps: {
                  where: { status: 'PENDING' },
                  orderBy: { stepNumber: 'asc' },
                  take: 1
                }
              }
            },
            conversionPath: true
          },
          orderBy,
          skip: offset,
          take: limit,
        }),
        prisma.lead.count({ where })
      ])

      return NextResponse.json({
        leads,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      })
    } catch (error) {
      console.error('Error fetching leads:', error)
      return NextResponse.json(
        { error: 'Failed to fetch leads' },
        { status: 500 }
      )
    }
  })(request)
}

// POST /api/crm/leads - Create a new lead
export async function POST(request: NextRequest) {
  return withPermissions(['CREATE_CLIENT'], async (req: NextRequest) => {
    try {
      const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
      const body = await req.json()
      const data = CreateLeadSchema.parse(body)

      // Calculate initial lead score
      const leadScore = await calculateLeadScore(data)

      const lead = await prisma.lead.create({
        data: {
          ...data,
          leadScore,
          temperature: determineTempture(leadScore),
          conversionStage: 'LEAD'
        },
        include: {
          deals: true,
          activities: true,
          scoring: true,
        }
      })

      // Create initial lead scoring record
      await prisma.leadScoring.create({
        data: {
          leadId: lead.id,
          totalScore: leadScore,
          demographic: calculateDemographicScore(data),
          qualification: calculateQualificationScore(data),
        }
      })

      // Create conversion path tracking
      await prisma.leadConversionPath.create({
        data: {
          leadId: lead.id,
          touchpoints: JSON.stringify([{
            source: data.source,
            timestamp: new Date(),
            channel: data.utmMedium || 'direct',
            campaign: data.utmCampaign || null
          }]),
          totalTouches: 1,
          firstTouch: new Date(),
          lastTouch: new Date()
        }
      })

      // Log lead creation activity
      await prisma.leadActivity.create({
        data: {
          leadId: lead.id,
          userId: token?.sub || '',
          type: 'OTHER',
          title: 'Lead Created',
          description: `Lead created from ${data.source}`,
          completedAt: new Date()
        }
      })

      return NextResponse.json(lead, { status: 201 })
    } catch (error) {
      console.error('Error creating lead:', error)
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation failed', details: error.errors },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to create lead' },
        { status: 500 }
      )
    }
  })(request)
}

// Helper functions for lead scoring
async function calculateLeadScore(leadData: CreateLeadData): Promise<number> {
  let score = 0

  // Company size scoring
  const companySizeScores = {
    'STARTUP': 15,
    'SMALL': 25,
    'MEDIUM': 35,
    'LARGE': 45,
    'ENTERPRISE': 55
  }
  if (leadData.companySize) {
    score += companySizeScores[leadData.companySize] || 0
  }

  // Budget scoring
  if (leadData.budget) {
    if (leadData.budget >= 100000) score += 30
    else if (leadData.budget >= 50000) score += 25
    else if (leadData.budget >= 25000) score += 20
    else if (leadData.budget >= 10000) score += 15
    else score += 10
  }

  // Timeline scoring
  const timelineScores = {
    'IMMEDIATE': 25,
    '1_MONTH': 20,
    '3_MONTHS': 15,
    '6_MONTHS': 10,
    '1_YEAR': 5
  }
  if (leadData.timeline) {
    score += timelineScores[leadData.timeline] || 0
  }

  // Source scoring
  const sourceScores = {
    'REFERRAL': 20,
    'DEMO_REQUEST': 18,
    'PRICING_PAGE': 16,
    'WEBSITE': 12,
    'CONTENT_MARKETING': 10,
    'ORGANIC_SEARCH': 8,
    'SOCIAL_MEDIA': 6,
    'COLD_CALL': 4
  }
  score += sourceScores[leadData.source as keyof typeof sourceScores] || 2

  return Math.min(score, 100) // Cap at 100
}

function calculateDemographicScore(leadData: CreateLeadData): number {
  let score = 0
  if (leadData.companySize === 'ENTERPRISE') score += 20
  else if (leadData.companySize === 'LARGE') score += 15
  else if (leadData.companySize === 'MEDIUM') score += 10
  
  if (leadData.industry) score += 5
  if (leadData.website) score += 5
  
  return score
}

function calculateQualificationScore(leadData: CreateLeadData): number {
  let score = 0
  if (leadData.budget && leadData.budget >= 25000) score += 15
  if (leadData.timeline && ['IMMEDIATE', '1_MONTH'].includes(leadData.timeline)) score += 10
  if (leadData.requirements && leadData.requirements.length > 50) score += 10
  
  return score
}

function determineTempture(score: number): string {
  if (score >= 70) return 'HOT'
  if (score >= 40) return 'WARM'
  return 'COLD'
}