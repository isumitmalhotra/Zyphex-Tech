import { NextRequest, NextResponse } from 'next/server'
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

    // Fetch contact form submissions
    const contactSubmissions = await prisma.contactSubmission.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Fetch users with CLIENT role who aren't already leads or clients
    const existingLeadEmails = leads.map(l => l.email)
    const existingContactEmails = contactSubmissions.map(c => c.email)
    
    const clientUsers = await prisma.user.findMany({
      where: {
        role: 'CLIENT',
        deletedAt: null,
        email: {
          notIn: [...existingLeadEmails, ...existingContactEmails]
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        projects: {
          where: {
            deletedAt: null
          },
          select: {
            budget: true
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
        industry: lead.industry || 'Unknown',
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
        recentActivities: lead.activities.slice(0, 5).map((a: { type?: string; description: string; createdAt: Date }) => ({
          type: a.type?.toLowerCase() || 'note',
          description: a.description,
          date: new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        })),
        createdAt: lead.createdAt,
        createdDate: new Date(lead.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        updatedAt: lead.updatedAt,
        probability: 50,
        tags: [lead.source, lead.status],
        type: 'lead' // Mark as regular lead
      }
    })

    // Format contact form submissions as leads
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const contactFormLeads = contactSubmissions.map((contact: any) => {
      const createdDate = new Date(contact.createdAt)
      const now = new Date()
      const daysInPipeline = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
      
      // Map contact status to lead stage
      let stage = 'new'
      if (contact.status === 'contacted') stage = 'contacted'
      else if (contact.status === 'closed') stage = 'disqualified'

      // Calculate score based on form completeness and service type
      let score = 50 // Base score
      if (contact.phone) score += 10
      if (contact.company) score += 10
      if (contact.budget) score += 15
      if (contact.message && contact.message.length > 100) score += 15
      
      // Estimate value based on service and budget
      let estimatedValue = 5000 // Default
      if (contact.budget === '$10,000 - $25,000') estimatedValue = 17500
      else if (contact.budget === '$25,000 - $50,000') estimatedValue = 37500
      else if (contact.budget === '$50,000 - $100,000') estimatedValue = 75000
      else if (contact.budget === '$100,000+') estimatedValue = 150000

      return {
        id: `contact-${contact.id}`,
        leadId: `CONTACT-${contact.id.substring(0, 8).toUpperCase()}`,
        name: contact.company || `${contact.firstName} ${contact.lastName}`,
        contactPerson: `${contact.firstName} ${contact.lastName}`,
        email: contact.email,
        phone: contact.phone || 'Not provided',
        company: contact.company || `${contact.firstName} ${contact.lastName}`,
        industry: contact.service || 'Web Development',
        stage,
        status: contact.status.toUpperCase(),
        score,
        source: 'website',
        estimatedValue,
        budget: contact.budget || 'Not specified',
        timeline: 'TBD',
        companySize: 'Unknown',
        lastContact: contact.createdAt,
        nextFollowUp: contact.status === 'new' ? 'Follow up within 24 hours' : null,
        daysInPipeline,
        converted: false,
        convertedAt: null,
        assignedTo: 'Unassigned',
        notes: `Service requested: ${contact.service}\n\nMessage: ${contact.message}\n\nNewsletter: ${contact.newsletter ? 'Yes' : 'No'}\n\nEmail sent: ${contact.emailSent ? 'Yes' : 'No'}${contact.emailError ? `\nEmail error: ${contact.emailError}` : ''}`,
        website: '',
        activities: 1,
        deals: [],
        recentActivities: [
          {
            type: 'form-submission',
            description: `Contact form submitted requesting ${contact.service}`,
            date: new Date(contact.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          }
        ],
        createdAt: contact.createdAt,
        createdDate: new Date(contact.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        updatedAt: contact.updatedAt,
        probability: score > 70 ? 60 : score > 50 ? 40 : 20,
        tags: [contact.service, 'Website Contact', contact.status],
        type: 'contact-form', // Mark as contact form submission
        contactSubmissionId: contact.id // Store original ID for updates/deletes
      }
    })

    // Format client users as leads
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userLeads = clientUsers.map((user: any) => {
      const createdDate = new Date(user.createdAt)
      const now = new Date()
      const daysInPipeline = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
      
      // Calculate estimated value from projects
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const estimatedValue = user.projects.reduce((sum: number, p: any) => sum + (p.budget || 0), 0)
      
      // Calculate score based on projects
      let score = 60 // Base score for registered users
      if (user.projects.length > 0) score += 20
      if (estimatedValue > 10000) score += 10
      if (estimatedValue > 50000) score += 10

      return {
        id: `user-${user.id}`,
        leadId: `USER-${user.id.substring(0, 8).toUpperCase()}`,
        name: user.name || user.email,
        contactPerson: user.name || user.email,
        email: user.email,
        phone: 'Not provided',
        company: user.name || user.email,
        industry: 'Technology',
        stage: user.projects.length > 0 ? 'qualified' : 'contacted',
        status: user.projects.length > 0 ? 'QUALIFIED' : 'CONTACTED',
        score,
        source: 'user-registration',
        estimatedValue: estimatedValue || 5000,
        budget: estimatedValue > 0 ? `$${estimatedValue.toLocaleString()}` : 'TBD',
        timeline: 'TBD',
        companySize: 'Unknown',
        lastContact: user.updatedAt,
        nextFollowUp: user.projects.length === 0 ? 'Follow up to discuss projects' : null,
        daysInPipeline,
        converted: user.projects.length > 0, // Has projects = converted
        convertedAt: user.projects.length > 0 ? user.updatedAt : null,
        assignedTo: 'Unassigned',
        notes: `Registered user account${user.projects.length > 0 ? `\n\nHas ${user.projects.length} project(s)` : ''}`,
        website: '',
        activities: user.projects.length,
        deals: [],
        recentActivities: user.projects.length > 0 ? [
          {
            type: 'project',
            description: `Has ${user.projects.length} project(s)`,
            date: new Date(user.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          }
        ] : [
          {
            type: 'registration',
            description: 'User account created',
            date: new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          }
        ],
        createdAt: user.createdAt,
        createdDate: new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        updatedAt: user.updatedAt,
        probability: score > 80 ? 70 : score > 60 ? 50 : 30,
        tags: ['Client User', 'Registered', user.projects.length > 0 ? 'Has Projects' : 'No Projects'],
        type: 'user-account', // Mark as user account
        userId: user.id // Store original user ID
      }
    })

    // Combine all types of leads
    const allLeads = [...formattedLeads, ...contactFormLeads, ...userLeads]

    // Calculate statistics
    const stats = {
      totalLeads: allLeads.length,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      newLeads: allLeads.filter((l: any) => l.stage === 'new').length,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      contacted: allLeads.filter((l: any) => l.stage === 'contacted').length,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      qualified: allLeads.filter((l: any) => l.stage === 'qualified').length,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      proposal: allLeads.filter((l: any) => l.stage === 'proposal').length,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      negotiation: allLeads.filter((l: any) => l.stage === 'negotiation').length,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      converted: allLeads.filter((l: any) => l.stage === 'converted').length,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      lost: allLeads.filter((l: any) => l.stage === 'lost').length,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      disqualified: allLeads.filter((l: any) => l.stage === 'disqualified').length,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      totalValue: allLeads.reduce((sum: number, l: any) => sum + (l.estimatedValue || 0), 0),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      avgScore: Math.round(allLeads.reduce((sum: number, l: any) => sum + l.score, 0) / allLeads.length) || 0,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      hotLeads: allLeads.filter((l: any) => l.score >= 80).length,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      conversionRate: allLeads.length > 0 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? Math.round((allLeads.filter((l: any) => l.converted).length / allLeads.length) * 100) 
        : 0,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      contactFormLeads: contactFormLeads.length,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      regularLeads: formattedLeads.length,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      userLeads: userLeads.length
    }

    return NextResponse.json({
      leads: allLeads,
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

// CREATE new lead
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Check if it's bulk upload (array of leads)
    if (Array.isArray(body.leads)) {
      const createdLeads = []
      const errors = []

      for (const leadData of body.leads) {
        try {
          // Validate required fields
          if (!leadData.companyName || !leadData.contactName || !leadData.email) {
            errors.push({
              data: leadData,
              error: 'Missing required fields: companyName, contactName, email'
            })
            continue
          }

          // Map UI stage to database status
          let status = 'NEW'
          if (leadData.stage === 'contacted') status = 'CONTACTED'
          else if (leadData.stage === 'qualified') status = 'QUALIFIED'
          else if (leadData.stage === 'proposal') status = 'PROPOSAL'
          else if (leadData.stage === 'negotiation') status = 'NEGOTIATION'

          const lead = await prisma.lead.create({
            data: {
              companyName: leadData.companyName,
              contactName: leadData.contactName,
              email: leadData.email,
              phone: leadData.phone || null,
              website: leadData.website || null,
              companySize: leadData.companySize || null,
              status: status as 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'WON' | 'LOST',
              source: leadData.source?.toUpperCase().replace('-', '_') || 'WEBSITE',
              qualificationScore: leadData.score || 50,
              value: leadData.estimatedValue || leadData.value || 0,
              budget: leadData.budget || null,
              timeline: leadData.timeline || null,
              assignedTo: leadData.assignedTo || 'Unassigned',
              notes: leadData.notes || null,
              lastContact: leadData.lastContact ? new Date(leadData.lastContact) : null,
              nextFollowUp: leadData.nextFollowUp ? new Date(leadData.nextFollowUp) : null,
            }
          })

          createdLeads.push(lead)
        } catch (error) {
          console.error('Error creating lead:', error)
          errors.push({
            data: leadData,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }

      return NextResponse.json({
        success: true,
        message: `Successfully created ${createdLeads.length} leads`,
        created: createdLeads.length,
        failed: errors.length,
        leads: createdLeads,
        errors: errors.length > 0 ? errors : undefined
      })
    }

    // Single lead creation
    if (!body.companyName || !body.contactName || !body.email) {
      return NextResponse.json(
        { error: 'Missing required fields: companyName, contactName, email' },
        { status: 400 }
      )
    }

    // Map UI stage to database status
    let status = 'NEW'
    if (body.stage === 'contacted') status = 'CONTACTED'
    else if (body.stage === 'qualified') status = 'QUALIFIED'
    else if (body.stage === 'proposal') status = 'PROPOSAL'
    else if (body.stage === 'negotiation') status = 'NEGOTIATION'

    const lead = await prisma.lead.create({
      data: {
        companyName: body.companyName,
        contactName: body.contactName,
        email: body.email,
        phone: body.phone || null,
        website: body.website || null,
        companySize: body.companySize || null,
        status: status as 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'WON' | 'LOST',
        source: body.source?.toUpperCase().replace('-', '_') || 'WEBSITE',
        qualificationScore: body.score || 50,
        value: body.estimatedValue || body.value || 0,
        budget: body.budget || null,
        timeline: body.timeline || null,
        assignedTo: body.assignedTo || 'Unassigned',
        notes: body.notes || null,
        lastContact: body.lastContact ? new Date(body.lastContact) : null,
        nextFollowUp: body.nextFollowUp ? new Date(body.nextFollowUp) : null,
      },
      include: {
        activities: true,
        deals: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Lead created successfully',
      lead
    })

  } catch (error) {
    console.error('Error creating lead:', error)
    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    )
  }
}
