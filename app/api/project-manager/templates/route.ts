import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ProjectTemplateService, type ProjectTemplateData } from '@/lib/services/project-templates'

// GET - Fetch all templates with optional filters
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = req.nextUrl.searchParams
    const methodology = searchParams.get('methodology')
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    // Create service instance
    const templateService = new ProjectTemplateService()

    // Get all templates
    const allTemplates = await templateService.getAllTemplates()

    // Apply filters
    let filteredTemplates = allTemplates

    if (methodology && methodology !== 'all') {
      filteredTemplates = await templateService.getTemplatesByMethodology(
        methodology as 'AGILE' | 'WATERFALL' | 'SCRUM' | 'KANBAN' | 'HYBRID'
      )
    }

    if (category && category !== 'all') {
      filteredTemplates = filteredTemplates.filter((t: ProjectTemplateData) => 
        t.industry?.toLowerCase().includes(category.toLowerCase())
      )
    }

    if (search) {
      const searchLower = search.toLowerCase()
      filteredTemplates = filteredTemplates.filter((t: ProjectTemplateData) =>
        t.name.toLowerCase().includes(searchLower) ||
        t.description?.toLowerCase().includes(searchLower)
      )
    }

    // Map to response format with additional metadata
    const templatesWithMetadata = filteredTemplates.map((template: ProjectTemplateData, _index: number) => {
      const tasksTemplate = template.tasksTemplate
      const milestonesTemplate = template.milestonesTemplate
      
      return {
        id: `template-${_index + 1}`,
        name: template.name,
        description: template.description,
        category: template.industry || 'General',
        methodology: template.methodology,
        estimatedDuration: template.estimatedDuration || 90,
        taskCount: Array.isArray(tasksTemplate) ? tasksTemplate.length : 0,
        milestoneCount: Array.isArray(milestonesTemplate) ? milestonesTemplate.length : 0,
        isDefault: true, // All existing templates are default
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
        tasks: tasksTemplate,
        milestones: milestonesTemplate,
        riskTemplate: template.riskTemplate,
        budgetTemplate: template.budgetTemplate,
        resourceTemplate: template.resourceTemplate
      }
    })

    return NextResponse.json({
      success: true,
      templates: templatesWithMetadata,
      total: templatesWithMetadata.length
    })
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}

// POST - Create new template
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user has PROJECT_MANAGER role
    const userRole = session.user.role
    if (userRole !== 'PROJECT_MANAGER' && userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await req.json()
    
    // Validate required fields
    const { name, description, methodology, estimatedDuration, category } = body
    
    if (!name || !description || !methodology) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, methodology' },
        { status: 400 }
      )
    }

    // Note: In production, you'd create the template in the database
    // For now, we'll return a success response with the template data
    const newTemplate = {
      id: `custom-${Date.now()}`,
      name,
      description,
      category: category || 'Custom',
      methodology,
      estimatedDuration: estimatedDuration || 90,
      taskCount: body.tasks?.length || 0,
      milestoneCount: body.milestones?.length || 0,
      usageCount: 0,
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: body.tags || [],
      budget: body.budget,
      teamSize: body.teamSize,
      tasks: body.tasks || [],
      milestones: body.milestones || [],
      isActive: true
    }

    return NextResponse.json({
      success: true,
      message: 'Template created successfully',
      template: newTemplate
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating template:', error)
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    )
  }
}
