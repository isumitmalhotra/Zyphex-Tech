'use client'

import React, { useState, useEffect } from 'react'
import { ProjectCreationWizard } from '@/components/project/ProjectCreationWizard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle, Loader2 } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface Client {
  id: string
  name: string
  email: string
  company: string | null
}

interface CreatedProject {
  id: string
  name: string
  description?: string
  status: string
  priority: string
  budget?: number
}

interface ProjectCreationData {
  name: string
  description: string
  methodology: 'AGILE' | 'WATERFALL' | 'SCRUM' | 'KANBAN' | 'HYBRID'
  templateId?: string
  clientId?: string
  startDate: Date
  expectedEndDate?: Date
  budget?: number
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  customization: {
    includeTasks: boolean
    includeMilestones: boolean
    includeRisks: boolean
    includeBudgets: boolean
  }
}

export default function CreateProjectPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [createdProject, setCreatedProject] = useState<CreatedProject | null>(null)
  const [error, setError] = useState<string>('')
  const [availableClients, setAvailableClients] = useState<Client[]>([])
  const [isLoadingClients, setIsLoadingClients] = useState(true)
  const [clientsError, setClientsError] = useState<string>('')

  // Fetch available clients on component mount
  useEffect(() => {
    const fetchClients = async () => {
      setIsLoadingClients(true)
      setClientsError('')

      try {
        const response = await fetch('/api/clients/available')
        
        if (!response.ok) {
          throw new Error('Failed to fetch clients')
        }

        const data = await response.json()
        
        if (data.success && Array.isArray(data.clients)) {
          setAvailableClients(data.clients)
        } else {
          throw new Error('Invalid response format')
        }
      } catch (err) {
        setClientsError(err instanceof Error ? err.message : 'Failed to load clients')
      } finally {
        setIsLoadingClients(false)
      }
    }

    if (session) {
      fetchClients()
    }
  }, [session])

  const handleProjectCreate = async (projectData: ProjectCreationData) => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/projects/create-from-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create project')
      }

      const project = await response.json()
      setCreatedProject(project)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project')
    } finally {
      setIsLoading(false)
    }
  }

  if (!session) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-gray-600">Please sign in to create projects.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (createdProject) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              Project Created Successfully!
            </CardTitle>
            <CardDescription>
              Your project has been created and is ready for team collaboration.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">{createdProject.name}</h3>
              <p className="text-green-700 text-sm">{createdProject.description}</p>
              
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                  Status: {createdProject.status}
                </span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                  Priority: {createdProject.priority}
                </span>
                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                  Budget: ${createdProject.budget?.toLocaleString() || '0'}
                </span>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={() => router.push(`/dashboard/projects/${createdProject.id}`)}
                className="flex-1"
              >
                View Project Dashboard
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setCreatedProject(null)
                  setError('')
                }}
              >
                Create Another Project
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Project</h1>
          <p className="text-gray-600 mt-2">
            Set up a new project with advanced project management features including Gantt charts, 
            risk management, and milestone tracking.
          </p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Clients Loading Error Display */}
      {clientsError && (
        <Card className="mb-6 border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <p className="text-yellow-800">
              Warning: {clientsError}. Client selection may be limited.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoadingClients ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-4" />
            <p className="text-gray-600">Loading clients...</p>
          </CardContent>
        </Card>
      ) : (
        /* Project Creation Wizard */
        <ProjectCreationWizard
          onProjectCreate={handleProjectCreate}
          isLoading={isLoading}
          availableClients={availableClients as any}
        />
      )}
    </div>
  )
}