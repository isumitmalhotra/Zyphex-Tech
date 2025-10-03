import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { withPermissions } from '@/lib/auth/middleware'
import { Prisma } from '@prisma/client'

// Validation schemas
const CreateNurturingSequenceSchema = z.object({
  leadId: z.string().min(1, 'Lead ID is required'),
  sequenceId: z.string().min(1, 'Sequence ID is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  totalSteps: z.number().min(1, 'Must have at least 1 step'),
})

const NurturingStepSchema = z.object({
  stepNumber: z.number().min(1),
  type: z.enum(['EMAIL', 'TASK', 'CALL', 'MEETING', 'FOLLOW_UP', 'CONTENT_DELIVERY', 'SURVEY', 'DELAY']),
  title: z.string().min(1, 'Title is required'),
  content: z.string().optional(),
  delay: z.number().min(0, 'Delay must be non-negative'), // Hours
})

const ExecuteStepSchema = z.object({
  sequenceId: z.string(),
  stepNumber: z.number(),
  outcome: z.string().optional(),
})

// GET /api/crm/nurturing/sequences - Get all nurturing sequences
export async function GET(request: NextRequest) {
  return withPermissions(['VIEW_CLIENTS'], async () => {
    try {
      const { searchParams } = new URL(request.url)
      const leadId = searchParams.get('leadId')
      const status = searchParams.get('status')

      const where: Record<string, unknown> = {}
      if (leadId) where.leadId = leadId
      if (status) where.status = status

      const sequences = await prisma.leadNurturingSequence.findMany({
        where,
        include: {
          lead: {
            select: { id: true, companyName: true, contactName: true, email: true }
          },
          steps: {
            orderBy: { stepNumber: 'asc' },
            where: { status: { not: 'COMPLETED' } }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      return NextResponse.json({ sequences })
    } catch (error) {
      console.error('Error fetching nurturing sequences:', error)
      return NextResponse.json(
        { error: 'Failed to fetch sequences' },
        { status: 500 }
      )
    }
  })(request)
}

// POST /api/crm/nurturing/sequences - Create nurturing sequence
export async function POST(request: NextRequest) {
  return withPermissions(['MANAGE_CLIENTS'], async (req: NextRequest) => {
    try {
      const body = await req.json()
      const data = CreateNurturingSequenceSchema.parse(body)
      const steps = z.array(NurturingStepSchema).parse(body.steps || [])

      const sequence = await prisma.leadNurturingSequence.create({
        data: {
          ...data,
          status: 'ACTIVE'
        }
      })

      // Create steps
      if (steps.length > 0) {
        await prisma.leadNurturingStep.createMany({
          data: steps.map(step => ({
            ...step,
            sequenceId: sequence.id,
            status: step.stepNumber === 1 ? 'PENDING' : 'PENDING',
            scheduledAt: step.stepNumber === 1 
              ? new Date(Date.now() + step.delay * 60 * 60 * 1000) // Convert hours to milliseconds
              : null
          }))
        })
      }

      const createdSequence = await prisma.leadNurturingSequence.findUnique({
        where: { id: sequence.id },
        include: {
          lead: {
            select: { id: true, companyName: true, contactName: true, email: true }
          },
          steps: {
            orderBy: { stepNumber: 'asc' }
          }
        }
      })

      return NextResponse.json(createdSequence, { status: 201 })
    } catch (error) {
      console.error('Error creating nurturing sequence:', error)
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation failed', details: error.errors },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to create sequence' },
        { status: 500 }
      )
    }
  })(request)
}

// PUT /api/crm/nurturing/sequences/execute - Execute next step in sequence
export async function PUT(request: NextRequest) {
  return withPermissions(['MANAGE_CLIENTS'], async (req: NextRequest) => {
    try {
      const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
      const body = await req.json()
      const data = ExecuteStepSchema.parse(body)

      // Find the current step
      const currentStep = await prisma.leadNurturingStep.findFirst({
        where: {
          sequenceId: data.sequenceId,
          stepNumber: data.stepNumber,
          status: 'PENDING'
        }
      })

      if (!currentStep) {
        return NextResponse.json(
          { error: 'Step not found or already executed' },
          { status: 404 }
        )
      }

      // Mark current step as completed
      await prisma.leadNurturingStep.update({
        where: { id: currentStep.id },
        data: {
          status: 'COMPLETED',
          executedAt: new Date()
        }
      })

      // Find and schedule next step
      const nextStep = await prisma.leadNurturingStep.findFirst({
        where: {
          sequenceId: data.sequenceId,
          stepNumber: data.stepNumber + 1,
          status: 'PENDING'
        }
      })

      if (nextStep) {
        await prisma.leadNurturingStep.update({
          where: { id: nextStep.id },
          data: {
            status: 'SCHEDULED',
            scheduledAt: new Date(Date.now() + nextStep.delay * 60 * 60 * 1000)
          }
        })
      } else {
        // No more steps, mark sequence as completed
        await prisma.leadNurturingSequence.update({
          where: { id: data.sequenceId },
          data: {
            status: 'COMPLETED',
            completedAt: new Date()
          }
        })
      }

      // Log activity
      const sequence = await prisma.leadNurturingSequence.findUnique({
        where: { id: data.sequenceId },
        select: { leadId: true, name: true }
      })

      if (sequence) {
        await prisma.leadActivity.create({
          data: {
            leadId: sequence.leadId,
            userId: token?.sub || '',
            type: 'OTHER',
            title: `Nurturing Step Completed`,
            description: `Step ${data.stepNumber} of "${sequence.name}" sequence executed`,
            outcome: data.outcome,
            completedAt: new Date()
          }
        })
      }

      return NextResponse.json({ 
        message: 'Step executed successfully',
        nextStepScheduled: !!nextStep 
      })
    } catch (error) {
      console.error('Error executing nurturing step:', error)
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation failed', details: error.errors },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to execute step' },
        { status: 500 }
      )
    }
  })(request)
}