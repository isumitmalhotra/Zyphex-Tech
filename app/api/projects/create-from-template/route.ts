import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { ProjectTemplateService } from '@/lib/services/project-templates'

const prisma = new PrismaClient()
const templateService = new ProjectTemplateService()

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const projectData = await request.json()
    
    // Validate required fields
    if (!projectData.name || !projectData.startDate) {
      return NextResponse.json(
        { error: 'Missing required fields: name, startDate' }, 
        { status: 400 }
      )
    }

    // Create project using template service if template is specified
    if (projectData.templateName) {
      const createdProject = await templateService.createProjectFromTemplate(
        projectData.templateName,
        {
          projectName: projectData.name,
          description: projectData.description,
          clientId: projectData.clientId || session.user.id,
          startDate: new Date(projectData.startDate),
          expectedEndDate: projectData.expectedEndDate ? new Date(projectData.expectedEndDate) : undefined,
          budget: projectData.budget,
          priority: projectData.priority,
          createdBy: session.user.id
        }
      )
      
      return NextResponse.json(createdProject, { status: 201 })
    }

    // Create basic project without template
    const createdProject = await prisma.project.create({
      data: {
        name: projectData.name,
        description: projectData.description || '',
        status: 'PLANNING',
        priority: projectData.priority || 'MEDIUM',
        budget: projectData.budget || 0,
        hourlyRate: 100, // Default hourly rate
        startDate: new Date(projectData.startDate),
        endDate: projectData.expectedEndDate ? new Date(projectData.expectedEndDate) : undefined,
        clientId: projectData.clientId || session.user.id
      },
      include: {
        client: true,
        tasks: true
      }
    })

    return NextResponse.json(createdProject, { status: 201 })
    
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to create project',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const clientId = searchParams.get('clientId')

    // Build basic filter
    const whereClause: Record<string, unknown> = {}
    
    // Role-based filtering
    if (session.user.role === 'CLIENT') {
      whereClause.clientId = session.user.id
    }

    // Additional filters
    if (status) {
      whereClause.status = status.toUpperCase()
    }
    if (clientId) {
      whereClause.clientId = clientId
    }

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        client: true,
        tasks: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            tasks: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(projects)
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch projects' }, 
      { status: 500 }
    )
  }
}