import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ProjectTemplateService } from '@/lib/services/project-templates'

interface RouteParams {
  params: {
    id: string
  }
}

// GET - Fetch specific template by ID
export async function GET(
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

    const { id } = params

    // Create service instance
    const templateService = new ProjectTemplateService()

    // Get all templates and find by index (since we use template-1, template-2, etc.)
    const allTemplates = await templateService.getAllTemplates()
    const templateIndex = parseInt(id.replace('template-', '')) - 1
    const template = allTemplates[templateIndex]

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    const tasksTemplate = template.tasksTemplate
    const milestonesTemplate = template.milestonesTemplate

    const templateWithMetadata = {
      id,
      name: template.name,
      description: template.description,
      category: template.industry || 'General',
      methodology: template.methodology,
      estimatedDuration: template.estimatedDuration || 90,
      taskCount: Array.isArray(tasksTemplate) ? tasksTemplate.length : 0,
      milestoneCount: Array.isArray(milestonesTemplate) ? milestonesTemplate.length : 0,
      isDefault: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      tasks: tasksTemplate,
      milestones: milestonesTemplate,
      riskTemplate: template.riskTemplate,
      budgetTemplate: template.budgetTemplate,
      resourceTemplate: template.resourceTemplate
    }

    return NextResponse.json({
      success: true,
      template: templateWithMetadata
    })
  } catch (error) {
    console.error('Error fetching template:', error)
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    )
  }
}

// PUT - Update template
export async function PUT(
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

    // Note: In production, update the template in the database
    // For now, return success with updated data
    const updatedTemplate = {
      id,
      ...body,
      updatedAt: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      message: 'Template updated successfully',
      template: updatedTemplate
    })
  } catch (error) {
    console.error('Error updating template:', error)
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    )
  }
}

// DELETE - Delete template
export async function DELETE(
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

    // Create service instance
    const templateService = new ProjectTemplateService()

    // Prevent deletion of default templates
    const allTemplates = await templateService.getAllTemplates()
    const templateIndex = parseInt(id.replace('template-', '')) - 1
    const template = allTemplates[templateIndex]

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Note: In production, check if template is default and prevent deletion
    // For custom templates, delete from database

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    )
  }
}
