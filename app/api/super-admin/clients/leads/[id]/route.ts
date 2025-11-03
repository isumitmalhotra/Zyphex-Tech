import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET single lead
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params

    // Check if it's a contact form lead
    if (id.startsWith('contact-')) {
      const contactId = id.replace('contact-', '')
      const contact = await prisma.contactSubmission.findUnique({
        where: { id: contactId }
      })

      if (!contact) {
        return NextResponse.json(
          { error: 'Contact submission not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({ lead: contact })
    }

    // Regular lead
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        activities: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        deals: true
      }
    })

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ lead })

  } catch (error) {
    console.error('Error fetching lead:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lead' },
      { status: 500 }
    )
  }
}

// UPDATE lead
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params
    const body = await request.json()

    // Check if it's a contact form lead
    if (id.startsWith('contact-')) {
      const contactId = id.replace('contact-', '')
      
      // Map lead status to contact submission status
      let contactStatus = body.status || 'new'
      if (body.stage) {
        if (body.stage === 'contacted') contactStatus = 'contacted'
        else if (body.stage === 'disqualified') contactStatus = 'closed'
        else if (body.stage === 'qualified' || body.stage === 'proposal' || body.stage === 'negotiation') contactStatus = 'contacted'
      }

      const updatedContact = await prisma.contactSubmission.update({
        where: { id: contactId },
        data: {
          status: contactStatus,
          notes: body.notes || undefined,
          updatedAt: new Date()
        }
      })

      return NextResponse.json({ 
        success: true,
        lead: updatedContact,
        message: 'Contact submission updated successfully' 
      })
    }

    // Update regular lead
    const updateData: Record<string, unknown> = {}
    
    if (body.stage) {
      // Map UI stage to database status
      if (body.stage === 'new') updateData.status = 'NEW'
      else if (body.stage === 'contacted') updateData.status = 'CONTACTED'
      else if (body.stage === 'qualified') updateData.status = 'QUALIFIED'
      else if (body.stage === 'proposal') updateData.status = 'PROPOSAL'
      else if (body.stage === 'negotiation') updateData.status = 'NEGOTIATION'
      else if (body.stage === 'disqualified') updateData.status = 'LOST'
      else if (body.stage === 'converted') updateData.status = 'WON'
    }

    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.qualificationScore !== undefined) updateData.qualificationScore = body.qualificationScore
    if (body.assignedTo !== undefined) updateData.assignedTo = body.assignedTo
    if (body.nextFollowUp !== undefined) updateData.nextFollowUp = body.nextFollowUp
    if (body.value !== undefined) updateData.value = body.value
    if (body.budget !== undefined) updateData.budget = body.budget
    if (body.timeline !== undefined) updateData.timeline = body.timeline

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: updateData,
      include: {
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        deals: true
      }
    })

    return NextResponse.json({ 
      success: true,
      lead: updatedLead,
      message: 'Lead updated successfully' 
    })

  } catch (error) {
    console.error('Error updating lead:', error)
    return NextResponse.json(
      { error: 'Failed to update lead' },
      { status: 500 }
    )
  }
}

// DELETE lead
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params

    // Check if it's a contact form lead
    if (id.startsWith('contact-')) {
      const contactId = id.replace('contact-', '')
      
      await prisma.contactSubmission.delete({
        where: { id: contactId }
      })

      return NextResponse.json({ 
        success: true,
        message: 'Contact submission deleted successfully' 
      })
    }

    // Delete regular lead
    await prisma.lead.delete({
      where: { id }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Lead deleted successfully' 
    })

  } catch (error) {
    console.error('Error deleting lead:', error)
    return NextResponse.json(
      { error: 'Failed to delete lead' },
      { status: 500 }
    )
  }
}
