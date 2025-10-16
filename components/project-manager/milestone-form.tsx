'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface MilestoneFormData {
  title: string
  description: string
  status: string
  targetDate: string
  amount: string
}

interface MilestoneFormProps {
  formData: MilestoneFormData
  onInputChange: (field: string, value: string) => void
  onSubmit: (e: React.FormEvent) => void
  submitText: string
  isSubmitting?: boolean
}

export function MilestoneForm({ 
  formData, 
  onInputChange, 
  onSubmit, 
  submitText,
  isSubmitting = false 
}: MilestoneFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Milestone Title *</Label>
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
            onChange={(e) => onInputChange('targetDate', e.target.value)}
            className="zyphex-input"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Amount ($)</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          value={formData.amount}
          onChange={(e) => onInputChange('amount', e.target.value)}
          className="zyphex-input"
        />
      </div>

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
