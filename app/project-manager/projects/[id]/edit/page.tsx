"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  ArrowLeft,
  Save,
  AlertCircle,
  Loader2,
  Calendar,
  DollarSign,
  User,
  Briefcase,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { SubtleBackground } from "@/components/subtle-background"
import { toast } from "@/hooks/use-toast"

interface Project {
  id: string
  name: string
  description: string
  status: string
  priority: string
  methodology: string
  budget: number
  hourlyRate: number
  startDate: string
  endDate: string
  estimatedHours: number
  clientId: string
  managerId: string
  client: {
    id: string
    name: string
    email: string
  }
  manager: {
    id: string
    name: string
    email: string
  }
}

interface Client {
  id: string
  name: string
  email: string
}

interface Manager {
  id: string
  name: string
  email: string
}

export default function EditProjectPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<Project | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [managers, setManagers] = useState<Manager[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: '',
    priority: '',
    methodology: '',
    budget: '',
    hourlyRate: '',
    startDate: '',
    endDate: '',
    estimatedHours: '',
    clientId: '',
    managerId: '',
  })

  useEffect(() => {
    fetchProject()
    fetchClients()
    fetchManagers()
  }, [params.id])

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/project-manager/projects/${params.id}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch project')
      }
      
      const data = await response.json()
      setProject(data.project)
      
      // Populate form with project data
      setFormData({
        name: data.project.name || '',
        description: data.project.description || '',
        status: data.project.status || '',
        priority: data.project.priority || '',
        methodology: data.project.methodology || '',
        budget: data.project.budget?.toString() || '',
        hourlyRate: data.project.hourlyRate?.toString() || '',
        startDate: data.project.startDate ? data.project.startDate.split('T')[0] : '',
        endDate: data.project.endDate ? data.project.endDate.split('T')[0] : '',
        estimatedHours: data.project.estimatedHours?.toString() || '',
        clientId: data.project.clientId || '',
        managerId: data.project.managerId || '',
      })
    } catch (error) {
      console.error('Error fetching project:', error)
      setError('Failed to load project details')
    } finally {
      setLoading(false)
    }
  }

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients')
      if (response.ok) {
        const data = await response.json()
        setClients(data.clients || [])
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }

  const fetchManagers = async () => {
    try {
      const response = await fetch('/api/users?role=PROJECT_MANAGER')
      if (response.ok) {
        const data = await response.json()
        setManagers(data.users || [])
      }
    } catch (error) {
      console.error('Error fetching managers:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/project-manager/projects/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          budget: formData.budget ? parseFloat(formData.budget) : null,
          hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : null,
          estimatedHours: formData.estimatedHours ? parseInt(formData.estimatedHours) : null,
          startDate: formData.startDate || null,
          endDate: formData.endDate || null,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update project')
      }

      toast({
        title: "Success",
        description: "Project updated successfully",
      })

      router.push(`/project-manager/projects/${params.id}`)
    } catch (error) {
      console.error('Error updating project:', error)
      toast({
        title: "Error",
        description: "Failed to update project. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6 zyphex-gradient-bg relative min-h-screen">
        <SubtleBackground />
        <div className="relative z-10">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto zyphex-accent-text" />
              <p className="mt-2 zyphex-subheading">Loading project...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6 zyphex-gradient-bg relative min-h-screen">
        <SubtleBackground />
        <div className="relative z-10">
          <Alert className="border-red-800/50 bg-red-900/20">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || "Project not found"}
            </AlertDescription>
          </Alert>
          <Button
            variant="outline"
            onClick={() => router.push('/project-manager/projects')}
            className="mt-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6 zyphex-gradient-bg relative min-h-screen">
      <SubtleBackground />
      <div className="relative z-10 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/project-manager/projects/${params.id}`)}
              className="zyphex-button"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Project
            </Button>
            <div>
              <h1 className="text-2xl font-bold zyphex-heading">Edit Project</h1>
              <p className="zyphex-subheading">Update project details and settings</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card className="zyphex-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 zyphex-heading">
                <Briefcase className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                    className="zyphex-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="methodology">Methodology</Label>
                  <Select
                    value={formData.methodology}
                    onValueChange={(value) => handleInputChange('methodology', value)}
                  >
                    <SelectTrigger className="zyphex-input">
                      <SelectValue placeholder="Select methodology" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AGILE">Agile</SelectItem>
                      <SelectItem value="WATERFALL">Waterfall</SelectItem>
                      <SelectItem value="SCRUM">Scrum</SelectItem>
                      <SelectItem value="KANBAN">Kanban</SelectItem>
                      <SelectItem value="HYBRID">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="zyphex-input"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleInputChange('status', value)}
                  >
                    <SelectTrigger className="zyphex-input">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PLANNING">Planning</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="REVIEW">Review</SelectItem>
                      <SelectItem value="ON_HOLD">On Hold</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => handleInputChange('priority', value)}
                  >
                    <SelectTrigger className="zyphex-input">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card className="zyphex-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 zyphex-heading">
                <DollarSign className="h-5 w-5" />
                Financial Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budget">Budget ($)</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={formData.budget}
                    onChange={(e) => handleInputChange('budget', e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    className="zyphex-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    value={formData.hourlyRate}
                    onChange={(e) => handleInputChange('hourlyRate', e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    className="zyphex-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimatedHours">Estimated Hours</Label>
                  <Input
                    id="estimatedHours"
                    type="number"
                    value={formData.estimatedHours}
                    onChange={(e) => handleInputChange('estimatedHours', e.target.value)}
                    placeholder="0"
                    className="zyphex-input"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="zyphex-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 zyphex-heading">
                <Calendar className="h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    className="zyphex-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    className="zyphex-input"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assignments */}
          <Card className="zyphex-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 zyphex-heading">
                <User className="h-5 w-5" />
                Assignments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientId">Client *</Label>
                  <Select
                    value={formData.clientId}
                    onValueChange={(value) => handleInputChange('clientId', value)}
                  >
                    <SelectTrigger className="zyphex-input">
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} ({client.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="managerId">Project Manager</Label>
                  <Select
                    value={formData.managerId}
                    onValueChange={(value) => handleInputChange('managerId', value)}
                  >
                    <SelectTrigger className="zyphex-input">
                      <SelectValue placeholder="Select manager" />
                    </SelectTrigger>
                    <SelectContent>
                      {managers.map((manager) => (
                        <SelectItem key={manager.id} value={manager.id}>
                          {manager.name} ({manager.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/project-manager/projects/${params.id}`)}
              className="zyphex-button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="zyphex-button"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}