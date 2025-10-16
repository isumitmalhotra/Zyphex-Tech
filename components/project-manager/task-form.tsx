'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface TaskFormData {
  title: string
  description: string
  status: string
  priority: string
  dueDate: string
  estimatedHours: string
  assignedToId: string
  milestoneId: string
}

interface TaskFormProps {
  formData: TaskFormData
  onInputChange: (field: string, value: string) => void
  onSubmit: (e: React.FormEvent) => void
  submitText: string
  isSubmitting?: boolean
  teamMembers?: Array<{ id: string; name: string }>
  milestones?: Array<{ id: string; title: string }>
}

export function TaskForm({ 
  formData, 
  onInputChange, 
  onSubmit, 
  submitText,
  isSubmitting = false,
  teamMembers = [],
  milestones = []
}: TaskFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Task Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => onInputChange('title', e.target.value)}
          required
          className="zyphex-input"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => onInputChange('description', e.target.value)}
          className="zyphex-input"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value) => onInputChange('status', value)}>
            <SelectTrigger className="zyphex-input">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODO">To Do</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="IN_REVIEW">In Review</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="BLOCKED">Blocked</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select value={formData.priority} onValueChange={(value) => onInputChange('priority', value)}>
            <SelectTrigger className="zyphex-input">
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
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dueDate">Due Date</Label>
          <Input
            id="dueDate"
            type="date"
            value={formData.dueDate}
            onChange={(e) => onInputChange('dueDate', e.target.value)}
            className="zyphex-input"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="estimatedHours">Estimated Hours</Label>
          <Input
            id="estimatedHours"
            type="number"
            step="0.5"
            value={formData.estimatedHours}
            onChange={(e) => onInputChange('estimatedHours', e.target.value)}
            className="zyphex-input"
          />
        </div>
      </div>

      {teamMembers.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="assignedToId">Assigned To</Label>
          <Select value={formData.assignedToId} onValueChange={(value) => onInputChange('assignedToId', value)}>
            <SelectTrigger className="zyphex-input">
              <SelectValue placeholder="Select team member" />
            </SelectTrigger>
            <SelectContent>
              {teamMembers.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {milestones.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="milestoneId">Milestone</Label>
          <Select value={formData.milestoneId} onValueChange={(value) => onInputChange('milestoneId', value)}>
            <SelectTrigger className="zyphex-input">
              <SelectValue placeholder="Select milestone" />
            </SelectTrigger>
            <SelectContent>
              {milestones.map((milestone) => (
                <SelectItem key={milestone.id} value={milestone.id}>
                  {milestone.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Button 
        type="submit" 
        className="w-full zyphex-button-primary"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Submitting...' : submitText}
      </Button>
    </form>
  )
}
