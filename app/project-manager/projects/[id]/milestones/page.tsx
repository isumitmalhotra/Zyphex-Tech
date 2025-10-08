"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ArrowLeft,
  Plus,
  MoreHorizontal,
  Target,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Edit,
  Trash2,
  Flag,
  TrendingUp,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { SubtleBackground } from "@/components/subtle-background"
import { toast } from "@/hooks/use-toast"
import { format } from "date-fns"

interface Milestone {
  id: string
  title: string
  description: string | null
  status: string
  targetDate: string | null
  actualDate: string | null
  deliverables: string | null
  createdAt: string
  updatedAt: string
}

interface Project {
  id: string
  name: string
  description: string
}

interface MilestoneFormData {
  title: string
  description: string
  status: string
  targetDate: string
  deliverables: string
}

export default function ProjectMilestonesPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<Project | null>(null)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null)
  const router = useRouter()

  const [formData, setFormData] = useState<MilestoneFormData>({
    title: '',
    description: '',
    status: 'PENDING',
    targetDate: '',
    deliverables: '',
  })

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      status: 'PENDING',
      targetDate: '',
      deliverables: '',
    })
  }

  const handleInputChange = (field: keyof MilestoneFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const openEditDialog = (milestone: Milestone) => {
    setEditingMilestone(milestone)
    setFormData({
      title: milestone.title,
      description: milestone.description || '',
      status: milestone.status,
      targetDate: milestone.targetDate ? format(new Date(milestone.targetDate), 'yyyy-MM-dd') : '',
      deliverables: milestone.deliverables ? JSON.parse(milestone.deliverables).join('\n') : '',
    })
    setIsEditDialogOpen(true)
  }

  useEffect(() => {
    fetchProject()
    fetchMilestones()
  }, [params.id])

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/project-manager/projects/${params.id}`)
      if (!response.ok) throw new Error('Failed to fetch project')
      const data = await response.json()
      setProject(data.project)
    } catch (error) {
      setError('Failed to load project details')
    }
  }

  const fetchMilestones = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/project-manager/projects/${params.id}/milestones`)
      if (!response.ok) throw new Error('Failed to fetch milestones')
      const data = await response.json()
      setMilestones(data.milestones)
    } catch (error) {
      setError('Failed to load milestones')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Milestone title is required",
        variant: "destructive",
      })
      return
    }

    try {
      setSaving(true)
      const response = await fetch(`/api/project-manager/projects/${params.id}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          targetDate: formData.targetDate || null,
        }),
      })

      if (!response.ok) throw new Error('Failed to create milestone')

      const data = await response.json()
      setMilestones(prev => [data.milestone, ...prev])
      setIsCreateDialogOpen(false)
      resetForm()
      
      toast({
        title: "Success",
        description: "Milestone created successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create milestone",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateMilestone = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingMilestone) return

    try {
      setSaving(true)
      const response = await fetch(`/api/project-manager/projects/${params.id}/milestones/${editingMilestone.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          targetDate: formData.targetDate || null,
        }),
      })

      if (!response.ok) throw new Error('Failed to update milestone')

      const data = await response.json()
      setMilestones(prev => prev.map(milestone => 
        milestone.id === editingMilestone.id ? data.milestone : milestone
      ))
      setIsEditDialogOpen(false)
      setEditingMilestone(null)
      resetForm()
      
      toast({
        title: "Success",
        description: "Milestone updated successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update milestone",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteMilestone = async (milestoneId: string) => {
    if (!confirm('Are you sure you want to delete this milestone?')) return

    try {
      const response = await fetch(`/api/project-manager/projects/${params.id}/milestones/${milestoneId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete milestone')

      setMilestones(prev => prev.filter(milestone => milestone.id !== milestoneId))
      
      toast({
        title: "Success",
        description: "Milestone deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete milestone",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-500 text-white'
      case 'IN_PROGRESS': return 'bg-blue-500 text-white'
      case 'DELAYED': return 'bg-red-500 text-white'
      case 'CANCELLED': return 'bg-gray-500 text-white'
      case 'PENDING': return 'bg-yellow-500 text-black'
      default: return 'bg-gray-500 text-white'
    }
  }

  // Calculate project completion based on milestones
  const completedMilestones = milestones.filter(m => m.status === 'COMPLETED').length
  const totalMilestones = milestones.length
  const projectCompletion = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6 zyphex-gradient-bg relative min-h-screen">
        <SubtleBackground />
        <div className="relative z-10">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto zyphex-accent-text" />
              <p className="mt-2 zyphex-subheading">Loading milestones...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6 zyphex-gradient-bg relative min-h-screen">
        <SubtleBackground />
        <div className="relative z-10">
          <Alert className="border-red-800/50 bg-red-900/20">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button
            variant="outline"
            onClick={() => router.push(`/project-manager/projects/${params.id}`)}
            className="mt-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Project
          </Button>
        </div>
      </div>
    )
  }

  const MilestoneForm = ({ onSubmit, submitText }: { onSubmit: (e: React.FormEvent) => void, submitText: string }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Milestone Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          required
          className="zyphex-input"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          className="zyphex-input"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
            <SelectTrigger className="zyphex-input">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="DELAYED">Delayed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetDate">Target Date</Label>
          <Input
            id="targetDate"
            type="date"
            value={formData.targetDate}
            onChange={(e) => handleInputChange('targetDate', e.target.value)}
            className="zyphex-input"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="deliverables">Deliverables</Label>
        <Textarea
          id="deliverables"
          value={formData.deliverables}
          onChange={(e) => handleInputChange('deliverables', e.target.value)}
          className="zyphex-input"
          rows={3}
          placeholder="List the key deliverables for this milestone (one per line)..."
        />
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setIsCreateDialogOpen(false)
            setIsEditDialogOpen(false)
            setEditingMilestone(null)
            resetForm()
          }}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={saving} className="zyphex-button">
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitText}
        </Button>
      </DialogFooter>
    </form>
  )

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
              <h1 className="text-2xl font-bold zyphex-heading">Project Milestones</h1>
              <p className="zyphex-subheading">{project?.name}</p>
            </div>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="zyphex-button">
                <Plus className="mr-2 h-4 w-4" />
                Create Milestone
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-slate-900 border-slate-800">
              <DialogHeader>
                <DialogTitle className="zyphex-heading">Create New Milestone</DialogTitle>
                <DialogDescription className="zyphex-subheading">
                  Add a new milestone to track project progress
                </DialogDescription>
              </DialogHeader>
              <MilestoneForm onSubmit={handleCreateMilestone} submitText="Create Milestone" />
            </DialogContent>
          </Dialog>
        </div>

        {/* Project Progress Overview */}
        <Card className="zyphex-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 zyphex-heading">
              <TrendingUp className="h-5 w-5" />
              Project Progress Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm zyphex-subheading">Overall Completion</span>
                <span className="text-sm font-medium zyphex-text">{projectCompletion}%</span>
              </div>
              <Progress value={projectCompletion} className="h-3" />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold zyphex-text">{totalMilestones}</div>
                  <p className="text-xs zyphex-subheading">Total Milestones</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-400">{completedMilestones}</div>
                  <p className="text-xs zyphex-subheading">Completed</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-400">
                    {milestones.filter(m => m.status === 'IN_PROGRESS').length}
                  </div>
                  <p className="text-xs zyphex-subheading">In Progress</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-400">
                    {milestones.filter(m => m.status === 'DELAYED' || m.status === 'CANCELLED').length}
                  </div>
                  <p className="text-xs zyphex-subheading">Delayed/Cancelled</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Milestones List */}
        <Card className="zyphex-card">
          <CardHeader>
            <CardTitle className="zyphex-heading">
              Milestones ({milestones.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {milestones.length === 0 ? (
              <div className="text-center py-8">
                <Target className="h-12 w-12 mx-auto zyphex-subheading mb-4" />
                <p className="zyphex-subheading">No milestones created yet</p>
                <p className="text-sm zyphex-subheading mt-2">
                  Create your first milestone to start tracking project progress
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {milestones.map((milestone) => (
                  <div key={milestone.id} className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-medium zyphex-text">{milestone.title}</h4>
                          <Badge className={getStatusColor(milestone.status)}>
                            {milestone.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        
                        {milestone.description && (
                          <p className="text-sm zyphex-subheading mb-2">{milestone.description}</p>
                        )}
                        
                        <div className="flex items-center space-x-4 text-xs zyphex-subheading mb-3">
                          {milestone.targetDate && (
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>Due {format(new Date(milestone.targetDate), 'MMM d, yyyy')}</span>
                            </div>
                          )}
                          {milestone.actualDate && (
                            <div className="flex items-center space-x-1">
                              <CheckCircle className="h-3 w-3 text-green-400" />
                              <span>Completed {format(new Date(milestone.actualDate), 'MMM d, yyyy')}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          {milestone.deliverables && (
                            <div className="mt-2">
                              <p className="text-xs zyphex-subheading mb-1">Deliverables:</p>
                              <div className="text-xs text-slate-300">
                                {JSON.parse(milestone.deliverables).map((item: string, index: number) => (
                                  <div key={index}>• {item}</div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800">
                          <DropdownMenuItem onClick={() => openEditDialog(milestone)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Milestone
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteMilestone(milestone.id)}
                            className="text-red-400 focus:text-red-400"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Milestone
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Milestone Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px] bg-slate-900 border-slate-800">
            <DialogHeader>
              <DialogTitle className="zyphex-heading">Edit Milestone</DialogTitle>
              <DialogDescription className="zyphex-subheading">
                Update milestone details and progress
              </DialogDescription>
            </DialogHeader>
            <MilestoneForm onSubmit={handleUpdateMilestone} submitText="Update Milestone" />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}