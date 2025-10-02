"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar as CalendarIcon, Clock, Target, Plus, Loader2, CheckCircle, Edit } from "lucide-react"
import { format } from "date-fns"
import { SubtleBackground } from "@/components/subtle-background"

interface ProjectPlan {
  id: string
  name: string
  description: string
  status: "DRAFT" | "ACTIVE" | "COMPLETED" | "ARCHIVED"
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  targetStartDate: string
  targetEndDate: string
  estimatedBudget: number
  estimatedHours: number
  methodology: string
  phases: ProjectPhase[]
  createdAt: string
  updatedAt: string
}

interface ProjectPhase {
  id: string
  name: string
  description: string
  estimatedHours: number
  startDate: string
  endDate: string
  dependencies: string[]
  deliverables: string[]
}

export default function ProjectPlanningPage() {
  const [plans, setPlans] = useState<ProjectPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newPlan, setNewPlan] = useState({
    name: "",
    description: "",
    priority: "MEDIUM",
    methodology: "AGILE",
    estimatedBudget: "",
    estimatedHours: "",
    targetStartDate: "",
    targetEndDate: "",
  })

  useEffect(() => {
    // For now, use mock data since we don't have a backend endpoint yet
    const mockPlans: ProjectPlan[] = [
      {
        id: "1",
        name: "E-commerce Platform Redesign",
        description: "Complete overhaul of the existing e-commerce platform with modern UI/UX and improved performance.",
        status: "DRAFT",
        priority: "HIGH",
        targetStartDate: "2025-10-15",
        targetEndDate: "2025-12-31",
        estimatedBudget: 50000,
        estimatedHours: 400,
        methodology: "AGILE",
        phases: [
          {
            id: "p1",
            name: "Discovery & Planning",
            description: "Requirements gathering and technical planning",
            estimatedHours: 80,
            startDate: "2025-10-15",
            endDate: "2025-10-30",
            dependencies: [],
            deliverables: ["Requirements Document", "Technical Specification", "Project Timeline"]
          },
          {
            id: "p2", 
            name: "UI/UX Design",
            description: "Design system and user interface mockups",
            estimatedHours: 120,
            startDate: "2025-11-01",
            endDate: "2025-11-20",
            dependencies: ["p1"],
            deliverables: ["Design System", "UI Mockups", "Prototype"]
          }
        ],
        createdAt: "2025-10-01",
        updatedAt: "2025-10-02"
      },
      {
        id: "2",
        name: "Mobile App Development",
        description: "Native mobile application for iOS and Android platforms.",
        status: "ACTIVE",
        priority: "CRITICAL",
        targetStartDate: "2025-10-01",
        targetEndDate: "2025-11-30",
        estimatedBudget: 75000,
        estimatedHours: 600,
        methodology: "SCRUM",
        phases: [],
        createdAt: "2025-09-25",
        updatedAt: "2025-10-01"
      }
    ]
    
    setTimeout(() => {
      setPlans(mockPlans)
      setLoading(false)
    }, 1000)
  }, [])

  const handleCreatePlan = () => {
    const plan: ProjectPlan = {
      id: Date.now().toString(),
      ...newPlan,
      priority: newPlan.priority as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      methodology: newPlan.methodology as string,
      estimatedBudget: parseFloat(newPlan.estimatedBudget) || 0,
      estimatedHours: parseFloat(newPlan.estimatedHours) || 0,
      status: "DRAFT",
      phases: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    setPlans([...plans, plan])
    setNewPlan({
      name: "",
      description: "",
      priority: "MEDIUM",
      methodology: "AGILE",
      estimatedBudget: "",
      estimatedHours: "",
      targetStartDate: "",
      targetEndDate: "",
    })
    setShowCreateForm(false)
  }

  const statusColors = {
    DRAFT: "bg-gray-100 text-gray-800",
    ACTIVE: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-green-100 text-green-800",
    ARCHIVED: "bg-orange-100 text-orange-800",
  }

  const priorityColors = {
    LOW: "bg-gray-100 text-gray-800",
    MEDIUM: "bg-blue-100 text-blue-800",
    HIGH: "bg-orange-100 text-orange-800",
    CRITICAL: "bg-red-100 text-red-800",
  }

  const stats = {
    total: plans.length,
    draft: plans.filter(p => p.status === 'DRAFT').length,
    active: plans.filter(p => p.status === 'ACTIVE').length,
    completed: plans.filter(p => p.status === 'COMPLETED').length,
    totalBudget: plans.reduce((sum, p) => sum + p.estimatedBudget, 0),
    totalHours: plans.reduce((sum, p) => sum + p.estimatedHours, 0),
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
        <SubtleBackground />
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin zyphex-heading" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
      <SubtleBackground />
      <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold zyphex-heading">Project Planning</h1>
            <p className="zyphex-subheading">Plan and organize upcoming projects</p>
          </div>
          <Button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="zyphex-button-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Project Plan
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="zyphex-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Total Plans</CardTitle>
              <Target className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">{stats.total}</div>
              <p className="text-xs zyphex-subheading">Project plans</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Draft Plans</CardTitle>
              <Edit className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">{stats.draft}</div>
              <p className="text-xs zyphex-subheading">In planning</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Active Plans</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">{stats.active}</div>
              <p className="text-xs zyphex-subheading">Being executed</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Total Budget</CardTitle>
              <CalendarIcon className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">${stats.totalBudget.toLocaleString()}</div>
              <p className="text-xs zyphex-subheading">Estimated budget</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Total Hours</CardTitle>
              <Clock className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">{stats.totalHours}</div>
              <p className="text-xs zyphex-subheading">Estimated hours</p>
            </CardContent>
          </Card>
        </div>

        {/* Create New Plan Form */}
        {showCreateForm && (
          <Card className="zyphex-card">
            <CardHeader>
              <CardTitle className="zyphex-heading">Create New Project Plan</CardTitle>
              <CardDescription className="zyphex-subheading">
                Define the scope and timeline for a new project
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Project Name</label>
                  <Input
                    value={newPlan.name}
                    onChange={(e) => setNewPlan({...newPlan, name: e.target.value})}
                    placeholder="Enter project name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Methodology</label>
                  <Select value={newPlan.methodology} onValueChange={(value) => setNewPlan({...newPlan, methodology: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AGILE">Agile</SelectItem>
                      <SelectItem value="SCRUM">Scrum</SelectItem>
                      <SelectItem value="WATERFALL">Waterfall</SelectItem>
                      <SelectItem value="KANBAN">Kanban</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <Select value={newPlan.priority} onValueChange={(value) => setNewPlan({...newPlan, priority: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="CRITICAL">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Estimated Budget ($)</label>
                  <Input
                    type="number"
                    value={newPlan.estimatedBudget}
                    onChange={(e) => setNewPlan({...newPlan, estimatedBudget: e.target.value})}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Target Start Date</label>
                  <Input
                    type="date"
                    value={newPlan.targetStartDate}
                    onChange={(e) => setNewPlan({...newPlan, targetStartDate: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Target End Date</label>
                  <Input
                    type="date"
                    value={newPlan.targetEndDate}
                    onChange={(e) => setNewPlan({...newPlan, targetEndDate: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={newPlan.description}
                  onChange={(e) => setNewPlan({...newPlan, description: e.target.value})}
                  placeholder="Describe the project scope and objectives"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreatePlan} className="zyphex-button-primary">
                  Create Plan
                </Button>
                <Button onClick={() => setShowCreateForm(false)} variant="outline">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Project Plans List */}
        <Card className="zyphex-card">
          <CardHeader>
            <CardTitle className="zyphex-heading">Project Plans</CardTitle>
            <CardDescription className="zyphex-subheading">
              Manage and track project planning activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {plans.map((plan) => (
                <Card key={plan.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold zyphex-heading">{plan.name}</h3>
                        <Badge className={statusColors[plan.status]}>
                          {plan.status}
                        </Badge>
                        <Badge variant="outline" className={priorityColors[plan.priority]}>
                          {plan.priority}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-3">{plan.description}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-gray-500">Timeline</p>
                          <p>{format(new Date(plan.targetStartDate), 'MMM dd')} - {format(new Date(plan.targetEndDate), 'MMM dd, yyyy')}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-500">Budget</p>
                          <p>${plan.estimatedBudget.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-500">Hours</p>
                          <p>{plan.estimatedHours} hours</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-500">Methodology</p>
                          <p>{plan.methodology}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      {plan.status === 'DRAFT' && (
                        <Button size="sm" className="zyphex-button-primary">
                          Start Project
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {plans.length === 0 && (
              <div className="text-center py-12">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium zyphex-heading mb-2">No project plans yet</h3>
                <p className="zyphex-subheading mb-4">
                  Create your first project plan to get started with project planning.
                </p>
                <Button onClick={() => setShowCreateForm(true)} className="zyphex-button-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Project Plan
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}