'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Calendar, 
  Clock, 
  Users, 
  AlertTriangle, 
  BarChart3, 
  FileText,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Circle,
  PlayCircle
} from 'lucide-react'
import { format } from 'date-fns'
// @ts-expect-error - frappe-gantt types not available
import Gantt from 'frappe-gantt'

interface Task {
  id: string
  title: string
  description?: string
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  startDate?: Date
  dueDate?: Date
  estimatedHours?: number
  actualHours?: number
  progress: number
  assignee?: {
    id: string
    name: string
    image?: string
  }
  dependencies?: string[]
}

interface Milestone {
  id: string
  title: string
  description?: string
  targetDate: Date
  actualDate?: Date
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED'
  isKey: boolean
}

interface Risk {
  id: string
  title: string
  description?: string
  category: string
  impactScore: number
  probabilityScore: number
  riskScore: number
  status: 'OPEN' | 'MITIGATED' | 'CLOSED'
  mitigationPlan?: string
}

interface ProjectData {
  id: string
  name: string
  description?: string
  status: string
  methodology: string
  budget: number
  budgetUsed: number
  hourlyRate: number
  startDate?: Date
  endDate?: Date
  completionRate: number
  tasks: Task[]
  milestones: Milestone[]
  risks: Risk[]
  client: {
    id: string
    name: string
  }
}

interface ProjectGanttChartProps {
  project: ProjectData
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void
  onTaskCreate?: (task: Omit<Task, 'id'>) => void
  onTaskDelete?: (taskId: string) => void
}

export default function ProjectGanttChart({ 
  project, 
  onTaskUpdate, 
  onTaskCreate, 
  onTaskDelete 
}: ProjectGanttChartProps) {
  const ganttRef = useRef<HTMLDivElement>(null)
  const ganttInstance = useRef<typeof Gantt | null>(null)
  const [activeTab, setActiveTab] = useState('gantt')

  // Convert tasks to Gantt format
  const convertTasksToGanttData = useCallback((tasks: Task[]) => {
    return tasks.map(task => ({
      id: task.id,
      name: task.title,
      start: task.startDate ? format(task.startDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      end: task.dueDate ? format(task.dueDate, 'yyyy-MM-dd') : format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      progress: task.progress,
      custom_class: getTaskStatusClass(task.status),
      dependencies: task.dependencies?.join(',') || ''
    }))
  }, [])

  const getTaskStatusClass = (status: string) => {
    switch (status) {
      case 'TODO': return 'task-todo'
      case 'IN_PROGRESS': return 'task-in-progress'
      case 'DONE': return 'task-done'
      case 'BLOCKED': return 'task-blocked'
      default: return 'task-todo'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'TODO': return <Circle className="h-4 w-4" />
      case 'IN_PROGRESS': return <PlayCircle className="h-4 w-4 text-blue-500" />
      case 'DONE': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'BLOCKED': return <AlertTriangle className="h-4 w-4 text-red-500" />
      default: return <Circle className="h-4 w-4" />
    }
  }

  const getRiskLevel = (score: number) => {
    if (score >= 20) return { level: 'Critical', color: 'bg-red-500' }
    if (score >= 15) return { level: 'High', color: 'bg-orange-500' }
    if (score >= 10) return { level: 'Medium', color: 'bg-yellow-500' }
    return { level: 'Low', color: 'bg-green-500' }
  }

  // Initialize Gantt chart
  useEffect(() => {
    if (ganttRef.current && project.tasks.length > 0) {
      try {
        const ganttData = convertTasksToGanttData(project.tasks)
        
        ganttInstance.current = new Gantt(ganttRef.current, ganttData, {
          header_height: 50,
          column_width: 30,
          step: 24,
          view_modes: ['Day', 'Week', 'Month'],
          bar_height: 20,
          bar_corner_radius: 3,
          arrow_curve: 5,
          padding: 18,
          view_mode: 'Week',
          date_format: 'YYYY-MM-DD',
          custom_popup_html: (task: { id: string; name: string; progress: number; start: string; end: string }) => {
            const taskData = project.tasks.find(t => t.id === task.id)
            return `
              <div class="details-container bg-white p-4 rounded-lg shadow-lg border max-w-sm">
                <h5 class="font-semibold text-gray-900">${task.name}</h5>
                <p class="text-sm text-gray-600 mt-1">${taskData?.description || 'No description'}</p>
                <p class="text-sm mt-2"><strong>Status:</strong> ${taskData?.status || 'Unknown'}</p>
                <p class="text-sm"><strong>Priority:</strong> ${taskData?.priority || 'Medium'}</p>
                <p class="text-sm"><strong>Progress:</strong> ${task.progress}%</p>
                <p class="text-sm"><strong>Duration:</strong> ${task.start} to ${task.end}</p>
                ${taskData?.assignee ? `<p class="text-sm"><strong>Assignee:</strong> ${taskData.assignee.name}</p>` : ''}
                ${taskData?.estimatedHours ? `<p class="text-sm"><strong>Estimated:</strong> ${taskData.estimatedHours}h</p>` : ''}
              </div>
            `
          },
          on_click: (task: { id: string }) => {
            const taskData = project.tasks.find(t => t.id === task.id)
            if (taskData) {
              console.log('Selected task:', taskData)
            }
          },
          on_date_change: (task: { id: string }, start: Date, end: Date) => {
            if (onTaskUpdate) {
              onTaskUpdate(task.id, {
                startDate: start,
                dueDate: end
              })
            }
          },
          on_progress_change: (task: { id: string }, progress: number) => {
            if (onTaskUpdate) {
              onTaskUpdate(task.id, { progress })
            }
          }
        })

        // Add custom CSS for task status colors
        const style = document.createElement('style')
        style.textContent = `
          .task-todo .bar { fill: #e5e7eb !important; }
          .task-in-progress .bar { fill: #3b82f6 !important; }
          .task-done .bar { fill: #10b981 !important; }
          .task-blocked .bar { fill: #ef4444 !important; }
          .gantt .grid-row:nth-child(even) { fill: #f9fafb; }
          .gantt .grid-row:nth-child(odd) { fill: #ffffff; }
        `
        document.head.appendChild(style)

      } catch (error) {
        console.error('Error initializing Gantt chart:', error)
      }
    }

    return () => {
      if (ganttInstance.current) {
        // Cleanup if needed
      }
    }
  }, [project.tasks, convertTasksToGanttData, onTaskUpdate])

  const handleViewModeChange = (mode: string) => {
    if (ganttInstance.current) {
      ganttInstance.current.change_view_mode(mode)
    }
  }

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-lg">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
            <p className="text-blue-100 mb-4">{project.description}</p>
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>{project.client.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>{project.startDate ? format(project.startDate, 'MMM dd, yyyy') : 'Not set'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span>{project.completionRate}% Complete</span>
              </div>
            </div>
          </div>
          <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
            {project.methodology}
          </Badge>
        </div>
      </div>

      {/* Project Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total Tasks</p>
                <p className="text-2xl font-bold">{project.tasks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold">
                  {project.tasks.filter(t => t.status === 'DONE').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">Active Risks</p>
                <p className="text-2xl font-bold">
                  {project.risks.filter(r => r.status === 'OPEN').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Budget Used</p>
                <p className="text-2xl font-bold">
                  {Math.round((project.budgetUsed / project.budget) * 100)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="gantt">Gantt Chart</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="risks">Risks</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>

        {/* Gantt Chart Tab */}
        <TabsContent value="gantt" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Project Timeline</CardTitle>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleViewModeChange('Day')}
                  >
                    Day
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleViewModeChange('Week')}
                  >
                    Week
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleViewModeChange('Month')}
                  >
                    Month
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div 
                ref={ganttRef} 
                className="gantt-container"
                style={{ height: '400px', overflow: 'auto' }}
              />
              {project.tasks.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No tasks available. Create some tasks to see the Gantt chart.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Project Tasks</CardTitle>
                <Button onClick={() => onTaskCreate?.({
                  title: 'New Task',
                  status: 'TODO',
                  priority: 'MEDIUM',
                  progress: 0
                })}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {project.tasks.map(task => (
                  <div 
                    key={task.id} 
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(task.status)}
                      <div>
                        <h4 className="font-medium">{task.title}</h4>
                        <p className="text-sm text-gray-600">{task.description}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge 
                            variant="outline" 
                            className={getPriorityColor(task.priority)}
                          >
                            {task.priority}
                          </Badge>
                          {task.assignee && (
                            <span className="text-xs text-gray-500">
                              Assigned to {task.assignee.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <p className="text-sm font-medium">{task.progress}%</p>
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 transition-all duration-300"
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onTaskDelete?.(task.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {project.tasks.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No tasks yet. Create your first task to get started.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Milestones Tab */}
        <TabsContent value="milestones" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Project Milestones</CardTitle>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Milestone
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {project.milestones.map(milestone => (
                  <div 
                    key={milestone.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{milestone.title}</h4>
                        {milestone.isKey && (
                          <Badge variant="secondary">Key Milestone</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Target: {format(milestone.targetDate, 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <Badge 
                      variant={
                        milestone.status === 'COMPLETED' ? 'default' :
                        milestone.status === 'DELAYED' ? 'destructive' : 'secondary'
                      }
                    >
                      {milestone.status}
                    </Badge>
                  </div>
                ))}
                {project.milestones.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No milestones defined. Add milestones to track key project deliverables.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risks Tab */}
        <TabsContent value="risks" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Risk Register</CardTitle>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Risk
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {project.risks.map(risk => {
                  const riskLevel = getRiskLevel(risk.riskScore)
                  return (
                    <div 
                      key={risk.id}
                      className="p-4 border rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium">{risk.title}</h4>
                            <div className={`w-3 h-3 rounded-full ${riskLevel.color}`} />
                            <span className="text-sm text-gray-600">{riskLevel.level}</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{risk.description}</p>
                          <div className="flex items-center space-x-4 text-sm">
                            <span>Impact: {risk.impactScore}/5</span>
                            <span>Probability: {risk.probabilityScore}/5</span>
                            <span>Score: {risk.riskScore}</span>
                          </div>
                          {risk.mitigationPlan && (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                              <strong>Mitigation:</strong> {risk.mitigationPlan}
                            </div>
                          )}
                        </div>
                        <Badge 
                          variant={
                            risk.status === 'CLOSED' ? 'default' :
                            risk.status === 'MITIGATED' ? 'secondary' : 'destructive'
                          }
                        >
                          {risk.status}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
                {project.risks.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No risks identified. Consider adding potential project risks.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Overall Completion</span>
                      <span className="text-sm">{project.completionRate}%</span>
                    </div>
                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-500"
                        style={{ width: `${project.completionRate}%` }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Budget Utilization</span>
                      <span className="text-sm">
                        ${project.budgetUsed.toLocaleString()} / ${project.budget.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 transition-all duration-500"
                        style={{ width: `${(project.budgetUsed / project.budget) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Task Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED'].map(status => {
                    const count = project.tasks.filter(t => t.status === status).length
                    const percentage = project.tasks.length > 0 ? (count / project.tasks.length) * 100 : 0
                    return (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(status)}
                          <span className="text-sm">{status.replace('_', ' ')}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm w-8 text-right">{count}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}