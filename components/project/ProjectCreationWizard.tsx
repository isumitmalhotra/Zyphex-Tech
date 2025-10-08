'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, CheckCircle, AlertTriangle, Target, Clock, DollarSign } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { User } from '@prisma/client'

// Define ProjectMethodology enum locally since it's not exported from Prisma
type ProjectMethodology = 'AGILE' | 'WATERFALL' | 'SCRUM' | 'KANBAN' | 'HYBRID'

interface ProjectTemplateData {
  id?: string
  name: string
  description?: string
  methodology: ProjectMethodology
  industry?: string
  estimatedDuration?: number
  tasksTemplate?: TaskTemplate[]
  milestonesTemplate?: MilestoneTemplate[]
  riskTemplate?: RiskTemplate[]
  budgetTemplate?: BudgetTemplate[]
}

interface TaskTemplate {
  title: string
  description: string
  estimatedHours: number
  skillsRequired: string[]
}

interface MilestoneTemplate {
  title: string
  description: string
  daysFromStart: number
}

interface RiskTemplate {
  title: string
  category: string
  impactScore: number
  probabilityScore: number
  description: string
}

interface BudgetTemplate {
  category: string
  name: string
  budgetPercentage: number
}

interface ProjectCreationData {
  name: string
  description: string
  methodology: ProjectMethodology
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

interface ProjectCreationWizardProps {
  availableClients?: User[]
  onProjectCreate: (projectData: ProjectCreationData) => void
  isLoading?: boolean
}

const WIZARD_STEPS = [
  { id: 1, title: 'Project Basics', description: 'Name, description, and methodology' },
  { id: 2, title: 'Template Selection', description: 'Choose a project template' },
  { id: 3, title: 'Timeline & Budget', description: 'Set dates and budget' },
  { id: 4, title: 'Customization', description: 'Configure included components' },
  { id: 5, title: 'Review', description: 'Final review and create' }
]

const PROJECT_METHODOLOGIES: Array<{ value: ProjectMethodology; label: string; description: string }> = [
  { value: 'AGILE', label: 'Agile', description: 'Iterative development with flexible planning' },
  { value: 'WATERFALL', label: 'Waterfall', description: 'Sequential development phases' },
  { value: 'SCRUM', label: 'Scrum', description: 'Sprint-based agile framework' },
  { value: 'KANBAN', label: 'Kanban', description: 'Continuous flow with work visualization' },
  { value: 'HYBRID', label: 'Hybrid', description: 'Combined approach for complex projects' }
]

export function ProjectCreationWizard({ 
  availableClients = [], 
  onProjectCreate, 
  isLoading = false 
}: ProjectCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [templates, setTemplates] = useState<ProjectTemplateData[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplateData | null>(null)
  const [formData, setFormData] = useState<ProjectCreationData>({
    name: '',
    description: '',
    methodology: 'AGILE',
    startDate: new Date(),
    priority: 'MEDIUM',
    customization: {
      includeTasks: true,
      includeMilestones: true,
      includeRisks: true,
      includeBudgets: false
    }
  })

  // Load templates based on methodology
  useEffect(() => {
    fetchTemplates(formData.methodology)
  }, [formData.methodology])

  const fetchTemplates = async (methodology: ProjectMethodology) => {
    try {
      const response = await fetch(`/api/project-templates?methodology=${methodology}`)
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
      }
    } catch (error) {
      // Error fetching templates
    }
  }

  const nextStep = () => {
    if (currentStep < WIZARD_STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = () => {
    const projectData: ProjectCreationData = {
      ...formData,
      templateId: selectedTemplate?.id
    }
    onProjectCreate(projectData)
  }

  const updateFormData = (updates: Partial<ProjectCreationData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const progress = (currentStep / WIZARD_STEPS.length) * 100

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-6 w-6" />
            Create New Project
          </CardTitle>
          <CardDescription>
            Step {currentStep} of {WIZARD_STEPS.length}: {WIZARD_STEPS[currentStep - 1].description}
          </CardDescription>
          <Progress value={progress} className="w-full" />
        </CardHeader>
      </Card>

      {/* Step Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            {WIZARD_STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div 
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium",
                    currentStep >= step.id 
                      ? "bg-blue-600 border-blue-600 text-white" 
                      : "border-gray-300 text-gray-400"
                  )}
                >
                  {currentStep > step.id ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    step.id
                  )}
                </div>
                <span className={cn(
                  "ml-2 text-sm",
                  currentStep >= step.id ? "text-blue-600" : "text-gray-400"
                )}>
                  {step.title}
                </span>
                {index < WIZARD_STEPS.length - 1 && (
                  <div className="w-16 h-px bg-gray-300 mx-4" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          {/* Step 1: Project Basics */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name *</Label>
                <Input
                  id="projectName"
                  placeholder="Enter project name"
                  value={formData.name}
                  onChange={(e) => updateFormData({ name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="projectDescription">Project Description</Label>
                <Textarea
                  id="projectDescription"
                  placeholder="Describe your project objectives and scope"
                  value={formData.description}
                  onChange={(e) => updateFormData({ description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Project Methodology *</Label>
                <Select 
                  value={formData.methodology} 
                  onValueChange={(value) => updateFormData({ methodology: value as ProjectMethodology })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select methodology" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_METHODOLOGIES.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        <div>
                          <div className="font-medium">{method.label}</div>
                          <div className="text-sm text-gray-500">{method.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {availableClients.length > 0 && (
                <div className="space-y-2">
                  <Label>Client (Optional)</Label>
                  <Select 
                    value={formData.clientId || ''} 
                    onValueChange={(value) => updateFormData({ clientId: value || undefined })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No client</SelectItem>
                      {availableClients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} ({client.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Template Selection */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">
                  Choose a Template for {PROJECT_METHODOLOGIES.find(m => m.value === formData.methodology)?.label}
                </h3>
                
                <div className="grid gap-4">
                  <Card 
                    className={cn(
                      "cursor-pointer transition-all",
                      !selectedTemplate && "ring-2 ring-blue-500"
                    )}
                    onClick={() => setSelectedTemplate(null)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Start from Scratch</h4>
                          <p className="text-sm text-gray-500">Create an empty project with basic structure</p>
                        </div>
                        <Badge variant="outline">Custom</Badge>
                      </div>
                    </CardContent>
                  </Card>

                  {templates.map((template) => (
                    <Card 
                      key={template.id || template.name}
                      className={cn(
                        "cursor-pointer transition-all",
                        selectedTemplate?.name === template.name && "ring-2 ring-blue-500"
                      )}
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{template.name}</h4>
                            <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                            
                            <div className="flex gap-4 mt-3 text-sm text-gray-600">
                              {template.tasksTemplate && (
                                <div className="flex items-center gap-1">
                                  <CheckCircle className="h-4 w-4" />
                                  {template.tasksTemplate.length} tasks
                                </div>
                              )}
                              {template.milestonesTemplate && (
                                <div className="flex items-center gap-1">
                                  <Target className="h-4 w-4" />
                                  {template.milestonesTemplate.length} milestones
                                </div>
                              )}
                              {template.estimatedDuration && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {template.estimatedDuration} days
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="ml-4">
                            <Badge variant="secondary">{template.methodology}</Badge>
                            {template.industry && (
                              <Badge variant="outline" className="ml-2">{template.industry}</Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Timeline & Budget */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.startDate ? format(formData.startDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.startDate}
                        onSelect={(date) => date && updateFormData({ startDate: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Expected End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.expectedEndDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.expectedEndDate ? format(formData.expectedEndDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.expectedEndDate}
                        onSelect={(date) => updateFormData({ expectedEndDate: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="budget">Budget (Optional)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="budget"
                      type="number"
                      placeholder="0.00"
                      className="pl-10"
                      value={formData.budget || ''}
                      onChange={(e) => updateFormData({ budget: e.target.value ? parseFloat(e.target.value) : undefined })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Priority Level</Label>
                  <Select 
                    value={formData.priority} 
                    onValueChange={(value) => updateFormData({ priority: value as typeof formData.priority })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low Priority</SelectItem>
                      <SelectItem value="MEDIUM">Medium Priority</SelectItem>
                      <SelectItem value="HIGH">High Priority</SelectItem>
                      <SelectItem value="CRITICAL">Critical Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedTemplate?.estimatedDuration && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-700">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">Template Suggestion</span>
                  </div>
                  <p className="text-sm text-blue-600 mt-1">
                    Based on the selected template, this project typically takes {selectedTemplate.estimatedDuration} days to complete.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Customization */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Customize Project Components</h3>
                <p className="text-gray-600 mb-6">
                  Choose which template components to include in your project.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Include Tasks</div>
                    <div className="text-sm text-gray-500">
                      Add predefined tasks from the template
                      {selectedTemplate?.tasksTemplate && ` (${selectedTemplate.tasksTemplate.length} tasks)`}
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.customization.includeTasks}
                    onChange={(e) => updateFormData({
                      customization: { ...formData.customization, includeTasks: e.target.checked }
                    })}
                    className="h-5 w-5 text-blue-600"
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Include Milestones</div>
                    <div className="text-sm text-gray-500">
                      Add predefined milestones from the template
                      {selectedTemplate?.milestonesTemplate && ` (${selectedTemplate.milestonesTemplate.length} milestones)`}
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.customization.includeMilestones}
                    onChange={(e) => updateFormData({
                      customization: { ...formData.customization, includeMilestones: e.target.checked }
                    })}
                    className="h-5 w-5 text-blue-600"
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Include Risk Management</div>
                    <div className="text-sm text-gray-500">
                      Add predefined risks and mitigation strategies
                      {selectedTemplate?.riskTemplate && ` (${selectedTemplate.riskTemplate.length} risks)`}
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.customization.includeRisks}
                    onChange={(e) => updateFormData({
                      customization: { ...formData.customization, includeRisks: e.target.checked }
                    })}
                    className="h-5 w-5 text-blue-600"
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Include Budget Breakdown</div>
                    <div className="text-sm text-gray-500">
                      Add predefined budget categories and allocations
                      {selectedTemplate?.budgetTemplate && ` (${selectedTemplate.budgetTemplate.length} categories)`}
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.customization.includeBudgets}
                    onChange={(e) => updateFormData({
                      customization: { ...formData.customization, includeBudgets: e.target.checked }
                    })}
                    className="h-5 w-5 text-blue-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Review Project Configuration</h3>
                <p className="text-gray-600 mb-6">
                  Please review your project settings before creating.
                </p>
              </div>

              <div className="grid gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Project Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{formData.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Methodology:</span>
                      <Badge>{formData.methodology}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Priority:</span>
                      <Badge variant={formData.priority === 'CRITICAL' ? 'destructive' : 'secondary'}>
                        {formData.priority}
                      </Badge>
                    </div>
                    {formData.description && (
                      <div className="pt-2">
                        <span className="text-gray-600">Description:</span>
                        <p className="text-sm mt-1">{formData.description}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Timeline & Budget</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Start Date:</span>
                      <span>{format(formData.startDate, "PPP")}</span>
                    </div>
                    {formData.expectedEndDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Expected End:</span>
                        <span>{format(formData.expectedEndDate, "PPP")}</span>
                      </div>
                    )}
                    {formData.budget && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Budget:</span>
                        <span>${formData.budget.toLocaleString()}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {selectedTemplate && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Template Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Template:</span>
                        <span className="font-medium">{selectedTemplate.name}</span>
                      </div>
                      <div className="pt-2">
                        <span className="text-gray-600">Included Components:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {formData.customization.includeTasks && <Badge variant="outline">Tasks</Badge>}
                          {formData.customization.includeMilestones && <Badge variant="outline">Milestones</Badge>}
                          {formData.customization.includeRisks && <Badge variant="outline">Risks</Badge>}
                          {formData.customization.includeBudgets && <Badge variant="outline">Budgets</Badge>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              Previous
            </Button>
            
            <div className="flex gap-2">
              {currentStep < WIZARD_STEPS.length ? (
                <Button 
                  onClick={nextStep}
                  disabled={
                    (currentStep === 1 && !formData.name) ||
                    (currentStep === 3 && !formData.startDate)
                  }
                >
                  Next
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit}
                  disabled={isLoading || !formData.name}
                  className="min-w-32"
                >
                  {isLoading ? 'Creating...' : 'Create Project'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}