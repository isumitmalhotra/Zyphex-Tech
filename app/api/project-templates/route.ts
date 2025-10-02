import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ProjectTemplateService } from '@/lib/services/project-templates'

const templateService = new ProjectTemplateService()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const methodology = searchParams.get('methodology')

    let templates
    if (methodology) {
      templates = await templateService.getTemplatesByMethodology(
        methodology.toUpperCase() as 'AGILE' | 'WATERFALL' | 'SCRUM' | 'KANBAN' | 'HYBRID'
      )
    } else {
      templates = await templateService.getAllTemplates()
    }

    return NextResponse.json(templates)
    
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates' }, 
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can create templates
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const templateData = await request.json()
    
    const template = await templateService.createTemplate(templateData)

    return NextResponse.json(template, { status: 201 })
    
  } catch (error) {
    console.error('Error creating template:', error)
    return NextResponse.json(
      { error: 'Failed to create template' }, 
      { status: 500 }
    )
  }
}