import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ProjectTemplateService } from '@/lib/services/project-templates'

interface RouteParams {
  params: {
    id: string
  }
}

// POST - Create project from template
export async function POST(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check permissions
    const userRole = session.user.role
    if (userRole !== 'PROJECT_MANAGER' && userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      )
    }

    const { id } = params
    const body = await req.json()

    // Validate required fields
    const { projectName, projectDescription, clientId, startDate } = body
    
    if (!projectName) {
      return NextResponse.json(
        { error: 'Missing required field: projectName' },
        { status: 400 }
      )
    }

    // Create service instance
    const templateService = new ProjectTemplateService()

    // Get template by index
    const allTemplates = await templateService.getAllTemplates()
    const templateIndex = parseInt(id.replace('template-', '')) - 1
    const template = allTemplates[templateIndex]

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Use the service to create project from template
    try {
      const project = await templateService.createProjectFromTemplate(
        template.name,
        {
          projectName,
          description: projectDescription || template.description || '',
          clientId,
          startDate: new Date(startDate || Date.now()),
          createdBy: session.user.id
        }
      )

      return NextResponse.json({
        success: true,
        message: 'Project created successfully from template',
        project: {
          id: project.id,
          name: project.name,
          description: project.description,
          status: project.status,
          methodology: project.methodology,
          startDate: project.startDate,
          endDate: project.endDate,
          budget: project.budget,
          createdAt: project.createdAt
        }
      }, { status: 201 })
    } catch (error) {
      // If template not found in service, return informative error
      if (error instanceof Error && error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Template not available for project creation' },
          { status: 404 }
        )
      }
      throw error
    }
  } catch (error) {
    console.error('Error creating project from template:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create project from template',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
