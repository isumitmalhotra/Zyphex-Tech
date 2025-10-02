import { NextResponse } from 'next/server'
import { ProjectManagementService } from '@/lib/services/project-management'

const projectManagementService = new ProjectManagementService()

export async function GET() {
  try {
    console.log('🔍 Testing advanced project management models...')
    
    const modelsAvailable = await projectManagementService.testNewModels()
    
    return NextResponse.json({
      success: true,
      modelsAvailable,
      message: modelsAvailable ? 
        'Advanced project management models are available!' : 
        'Models not yet available, using basic functionality'
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error testing models:', errorMessage)
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}