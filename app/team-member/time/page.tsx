"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Clock,
  Play,
  Pause,
  Square,
  Calendar,
  BarChart3,
  Plus,
  Edit,
  Trash2,
  Loader2,
  CheckCircle,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface TimeEntry {
  id: string
  date: Date
  hours: number
  description: string | null
  billable: boolean
  status: string
  project: {
    id: string
    name: string
  } | null
  task: {
    id: string
    title: string
  } | null
}

interface TimeStats {
  totalHours: number
  billableHours: number
  nonBillableHours: number
  totalRevenue: number
  statusBreakdown: {
    draft: number
    submitted: number
    approved: number
    rejected: number
  }
}

interface Project {
  id: string
  name: string
}

interface Task {
  id: string
  title: string
}

const statusColors = {
  DRAFT: "bg-gray-500",
  SUBMITTED: "bg-blue-500",
  APPROVED: "bg-green-500",
  REJECTED: "bg-red-500",
}

export default function TimeTrackingPage() {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [stats, setStats] = useState<TimeStats | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isTracking, setIsTracking] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null)
  
  // Form state
  const [selectedProject, setSelectedProject] = useState("")
  const [selectedTask, setSelectedTask] = useState("")
  const [hours, setHours] = useState("")
  const [description, setDescription] = useState("")
  const [billable, setBillable] = useState(true)
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0])
  
  const { toast } = useToast()

  const fetchTimeEntries = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/team-member/time')
      
      if (!response.ok) {
        throw new Error('Failed to fetch time entries')
      }

      const data = await response.json()
      setTimeEntries(data.timeEntries || [])
      setStats(data.stats || null)
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to load time entries",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  const fetchProjects = useCallback(async () => {
    try {
      const response = await fetch('/api/team-member/projects')
      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects || [])
      }
    } catch (_error) {
      // Silent fail for projects
    }
  }, [])

  const fetchTasks = useCallback(async (projectId: string) => {
    try {
      const response = await fetch(`/api/team-member/tasks?projectId=${projectId}`)
      if (response.ok) {
        const data = await response.json()
        setTasks(data.tasks || [])
      }
    } catch (_error) {
      // Silent fail for tasks
    }
  }, [])

  useEffect(() => {
    fetchTimeEntries()
    fetchProjects()
  }, [fetchTimeEntries, fetchProjects])

  useEffect(() => {
    if (selectedProject) {
      fetchTasks(selectedProject)
    } else {
      setTasks([])
      setSelectedTask("")
    }
  }, [selectedProject, fetchTasks])

  // Timer logic
  useEffect(() => {
    if (isTracking) {
      const interval = setInterval(() => {
        setCurrentTime(prev => prev + 1)
      }, 1000)
      setTimerInterval(interval)
      return () => clearInterval(interval)
    } else if (timerInterval) {
      clearInterval(timerInterval)
      setTimerInterval(null)
    }
  }, [isTracking, timerInterval])

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const toggleTimer = () => {
    if (!isTracking) {
      if (!selectedProject || !selectedTask) {
        toast({
          title: "Error",
          description: "Please select a project and task first",
          variant: "destructive"
        })
        return
      }
    }
    setIsTracking(!isTracking)
  }

  const stopAndSave = async () => {
    if (!selectedProject || !selectedTask) {
      toast({
        title: "Error",
        description: "Please select a project and task",
        variant: "destructive"
      })
      return
    }

    const calculatedHours = Number((currentTime / 3600).toFixed(2))
    
    try {
      const response = await fetch('/api/team-member/time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProject,
          taskId: selectedTask,
          hours: calculatedHours,
          description,
          billable,
          date: new Date().toISOString()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save time entry')
      }

      toast({
        title: "Success",
        description: "Time entry saved successfully"
      })

      // Reset
      setIsTracking(false)
      setCurrentTime(0)
      setDescription("")
      fetchTimeEntries()
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to save time entry",
        variant: "destructive"
      })
    }
  }

  const handleAddEntry = async () => {
    if (!selectedProject || !hours) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch('/api/team-member/time', {
        method: editingEntry ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(editingEntry && { id: editingEntry.id }),
          projectId: selectedProject,
          taskId: selectedTask || undefined,
          hours: Number(hours),
          description,
          billable,
          date: new Date(entryDate).toISOString()
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to ${editingEntry ? 'update' : 'create'} time entry`)
      }

      toast({
        title: "Success",
        description: `Time entry ${editingEntry ? 'updated' : 'created'} successfully`
      })

      setShowAddDialog(false)
      resetForm()
      fetchTimeEntries()
    } catch (_error) {
      toast({
        title: "Error",
        description: `Failed to ${editingEntry ? 'update' : 'create'} time entry`,
        variant: "destructive"
      })
    }
  }

  const handleDeleteEntry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this time entry?')) return

    try {
      const response = await fetch('/api/team-member/time', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })

      if (!response.ok) {
        throw new Error('Failed to delete time entry')
      }

      toast({
        title: "Success",
        description: "Time entry deleted successfully"
      })

      fetchTimeEntries()
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to delete time entry",
        variant: "destructive"
      })
    }
  }

  const handleSubmitForApproval = async (id: string) => {
    try {
      const response = await fetch('/api/team-member/time', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'SUBMITTED' })
      })

      if (!response.ok) {
        throw new Error('Failed to submit time entry')
      }

      toast({
        title: "Success",
        description: "Time entry submitted for approval"
      })

      fetchTimeEntries()
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to submit time entry",
        variant: "destructive"
      })
    }
  }

  const openEditDialog = (entry: TimeEntry) => {
    setEditingEntry(entry)
    setSelectedProject(entry.project?.id || "")
    setSelectedTask(entry.task?.id || "")
    setHours(entry.hours.toString())
    setDescription(entry.description || "")
    setBillable(entry.billable)
    setEntryDate(new Date(entry.date).toISOString().split('T')[0])
    setShowAddDialog(true)
  }

  const resetForm = () => {
    setEditingEntry(null)
    setSelectedProject("")
    setSelectedTask("")
    setHours("")
    setDescription("")
    setBillable(true)
    setEntryDate(new Date().toISOString().split('T')[0])
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500 mb-4" />
          <p className="text-muted-foreground">Loading time entries...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Time Tracking</h1>
          <p className="text-muted-foreground">
            Track your work hours and manage time entries
          </p>
        </div>
        <Button onClick={() => { resetForm(); setShowAddDialog(true); }} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Entry
        </Button>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gray-900/50 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-blue-400" />
                <div>
                  <div className="text-2xl font-bold text-white">{stats.totalHours.toFixed(1)}h</div>
                  <p className="text-xs text-muted-foreground">Total Hours</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-green-400" />
                <div>
                  <div className="text-2xl font-bold text-white">{stats.billableHours.toFixed(1)}h</div>
                  <p className="text-xs text-muted-foreground">Billable Hours</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-purple-400" />
                <div>
                  <div className="text-2xl font-bold text-white">{stats.statusBreakdown.approved}</div>
                  <p className="text-xs text-muted-foreground">Approved Entries</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-yellow-400" />
                <div>
                  <div className="text-2xl font-bold text-white">{stats.statusBreakdown.submitted}</div>
                  <p className="text-xs text-muted-foreground">Pending Approval</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Timer Card */}
      <Card className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border-blue-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Time Tracker
          </CardTitle>
          <CardDescription>Track time for your current task</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-6xl font-bold text-white mb-4">{formatTime(currentTime)}</div>
            <div className="flex justify-center gap-2">
              <Button
                onClick={toggleTimer}
                className={isTracking ? "bg-yellow-600 hover:bg-yellow-700" : "bg-green-600 hover:bg-green-700"}
              >
                {isTracking ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                {isTracking ? 'Pause' : 'Start'}
              </Button>
              {isTracking && (
                <Button onClick={stopAndSave} className="bg-red-600 hover:bg-red-700">
                  <Square className="h-4 w-4 mr-2" />
                  Stop & Save
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Project *</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject} disabled={isTracking}>
                <SelectTrigger className="bg-gray-800 border-gray-600">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Task</Label>
              <Select value={selectedTask} onValueChange={setSelectedTask} disabled={isTracking || !selectedProject}>
                <SelectTrigger className="bg-gray-800 border-gray-600">
                  <SelectValue placeholder="Select task" />
                </SelectTrigger>
                <SelectContent>
                  {tasks.map(task => (
                    <SelectItem key={task.id} value={task.id}>{task.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What are you working on?"
              className="bg-gray-800 border-gray-600"
              disabled={isTracking}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="billable-timer"
              checked={billable}
              onChange={(e) => setBillable(e.target.checked)}
              disabled={isTracking}
              className="rounded"
            />
            <Label htmlFor="billable-timer">Billable</Label>
          </div>
        </CardContent>
      </Card>

      {/* Time Entries Table */}
      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Time Entries</CardTitle>
          <CardDescription>
            {timeEntries.length} time {timeEntries.length !== 1 ? 'entries' : 'entry'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {timeEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No time entries found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300">Date</TableHead>
                  <TableHead className="text-gray-300">Project</TableHead>
                  <TableHead className="text-gray-300">Task</TableHead>
                  <TableHead className="text-gray-300">Hours</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timeEntries.map((entry) => (
                  <TableRow key={entry.id} className="border-gray-700">
                    <TableCell className="text-white">
                      {new Date(entry.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <span className="text-blue-400">{entry.project?.name || 'N/A'}</span>
                    </TableCell>
                    <TableCell className="text-white">
                      {entry.task?.title || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-white font-medium">{entry.hours.toFixed(2)}h</div>
                        {entry.billable && (
                          <Badge variant="outline" className="text-xs text-green-400 border-green-400">
                            Billable
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`${statusColors[entry.status as keyof typeof statusColors]} text-white`}
                      >
                        {entry.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {entry.status === 'DRAFT' && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openEditDialog(entry)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSubmitForApproval(entry.id)}
                              className="text-green-400 hover:text-green-300"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteEntry(entry.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {entry.status !== 'APPROVED' && entry.status !== 'DRAFT' && (
                          <span className="text-sm text-muted-foreground">Pending...</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingEntry ? 'Edit Time Entry' : 'Add Time Entry'}
            </DialogTitle>
            <DialogDescription>
              {editingEntry ? 'Update your time entry details' : 'Manually add a time entry'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="bg-gray-800 border-gray-600"
              />
            </div>

            <div className="space-y-2">
              <Label>Project *</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="bg-gray-800 border-gray-600">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Task</Label>
              <Select value={selectedTask} onValueChange={setSelectedTask} disabled={!selectedProject}>
                <SelectTrigger className="bg-gray-800 border-gray-600">
                  <SelectValue placeholder="Select task" />
                </SelectTrigger>
                <SelectContent>
                  {tasks.map(task => (
                    <SelectItem key={task.id} value={task.id}>{task.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Hours *</Label>
              <Input
                type="number"
                step="0.5"
                min="0"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="Enter hours"
                className="bg-gray-800 border-gray-600"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What did you work on?"
                className="bg-gray-800 border-gray-600"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="billable-manual"
                checked={billable}
                onChange={(e) => setBillable(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="billable-manual">Billable</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddDialog(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleAddEntry} className="bg-blue-600 hover:bg-blue-700">
              {editingEntry ? 'Update' : 'Add'} Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
