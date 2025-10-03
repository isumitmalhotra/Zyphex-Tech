import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { withPermissions } from '@/lib/auth/middleware'

// Validation schemas
const CreateActivitySchema = z.object({
  leadId: z.string().min(1, 'Lead ID is required'),
  type: z.enum([
    'EMAIL', 'CALL', 'MEETING', 'DEMO', 'PROPOSAL_SENT', 'CONTRACT_SENT',
    'FOLLOW_UP', 'QUOTE_SENT', 'PRESENTATION', 'DISCOVERY_CALL',
    'TECHNICAL_REVIEW', 'NEGOTIATION', 'CLOSING_CALL', 'ONBOARDING', 'OTHER'
  ]),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  outcome: z.string().optional(),
  scheduled: z.boolean().default(false),
  scheduledAt: z.string().datetime().optional(),
})

// GET /api/crm/leads/[leadId]/activities - Get lead activities
export async function GET(
  request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  return withPermissions(['VIEW_CLIENTS'], async () => {
    try {
      const { leadId } = params
      const { searchParams } = new URL(request.url)
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '20')
      const offset = (page - 1) * limit

      const [activities, total] = await Promise.all([
        prisma.leadActivity.findMany({
          where: { leadId },
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit,
        }),
        prisma.leadActivity.count({ where: { leadId } })
      ])

      return NextResponse.json({
        activities,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      })
    } catch (error) {
      console.error('Error fetching lead activities:', error)
      return NextResponse.json(
        { error: 'Failed to fetch activities' },
        { status: 500 }
      )
    }
  })(request)
}

// POST /api/crm/leads/[leadId]/activities - Create new activity
export async function POST(
  request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  return withPermissions(['MANAGE_CLIENTS'], async (req: NextRequest) => {
    try {
      const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
      const { leadId } = params
      const body = await req.json()
      const data = CreateActivitySchema.parse({ ...body, leadId })

      const activity = await prisma.leadActivity.create({
        data: {
          ...data,
          userId: token?.sub || '',
          scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
          completedAt: data.scheduled ? null : new Date(),
        },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      })

      // Update lead's last contact if activity is completed
      if (!data.scheduled) {
        await prisma.lead.update({
          where: { id: leadId },
          data: { lastContact: new Date() }
        })
      }

      return NextResponse.json(activity, { status: 201 })
    } catch (error) {
      console.error('Error creating activity:', error)
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation failed', details: error.errors },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to create activity' },
        { status: 500 }
      )
    }
  })(request)
}