"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Trash2, Settings, ChevronDown, ChevronUp, GripVertical } from "lucide-react"
import { ACTION_TYPES } from "@/lib/workflow/workflow-types"
import type { WorkflowAction } from "@/lib/workflow/workflow-types"

interface ActionBuilderProps {
  actions: WorkflowAction[]
  onChange: (actions: WorkflowAction[]) => void
}

export function ActionBuilder({ actions, onChange }: ActionBuilderProps) {
  const addAction = () => {
    const maxOrder = actions.length > 0 ? Math.max(...actions.map((a) => a.order)) : 0
    onChange([...actions, { type: "SEND_EMAIL", config: {}, order: maxOrder + 1 }])
  }

  const removeAction = (index: number) => {
    const filtered = actions.filter((_, i) => i !== index)
    // Reorder remaining actions
    const reordered = filtered.map((action, i) => ({ ...action, order: i + 1 }))
    onChange(reordered)
  }

  const updateAction = (index: number, updates: Partial<WorkflowAction>) => {
    const updated = [...actions]
    updated[index] = { ...updated[index], ...updates }
    onChange(updated)
  }

  const moveAction = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === actions.length - 1)
    ) {
      return
    }

    const newIndex = direction === "up" ? index - 1 : index + 1
    const updated = [...actions]
    const temp = updated[index]
    updated[index] = updated[newIndex]
    updated[newIndex] = temp

    // Update order values
    updated[index].order = index + 1
    updated[newIndex].order = newIndex + 1

    onChange(updated)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Actions
            </CardTitle>
            <CardDescription>Steps to execute when workflow runs</CardDescription>
          </div>
          <Button onClick={addAction} size="sm" variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Action
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {actions.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground mb-4">No actions configured</p>
            <Button onClick={addAction} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Your First Action
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {actions.map((action, index) => (
              <ActionCard
                key={index}
                action={action}
                index={index}
                total={actions.length}
                onUpdate={(updates) => updateAction(index, updates)}
                onRemove={() => removeAction(index)}
                onMoveUp={() => moveAction(index, "up")}
                onMoveDown={() => moveAction(index, "down")}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ActionCard({
  action,
  index,
  total,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  action: WorkflowAction
  index: number
  total: number
  onUpdate: (updates: Partial<WorkflowAction>) => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}) {
  const [expanded, setExpanded] = useState(true)
  const selectedAction = ACTION_TYPES.find((a) => a.value === action.type)

  const updateConfig = (key: string, value: unknown) => {
    onUpdate({ config: { ...action.config, [key]: value } })
  }

  return (
    <div className="border rounded-lg">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 bg-muted/50">
        <div className="flex flex-col gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onMoveUp}
            disabled={index === 0}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onMoveDown}
            disabled={index === total - 1}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
          {action.order}
        </div>

        <div className="flex-1">
          <Select value={action.type} onValueChange={(value) => onUpdate({ type: value, config: {} })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACTION_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div>
                    <div className="font-medium">{type.label}</div>
                    <div className="text-xs text-muted-foreground">{type.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setExpanded(!expanded)}
          className="h-8 w-8"
        >
          <GripVertical className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="h-8 w-8 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Configuration */}
      {expanded && (
        <div className="p-4 space-y-4">
          <p className="text-sm text-muted-foreground">{selectedAction?.description}</p>

          {/* Action-specific configuration */}
          {action.type === "SEND_EMAIL" && (
            <EmailActionConfig config={action.config} onChange={updateConfig} />
          )}
          {action.type === "SEND_SMS" && (
            <SmsActionConfig config={action.config} onChange={updateConfig} />
          )}
          {action.type === "SEND_SLACK_MESSAGE" && (
            <SlackActionConfig config={action.config} onChange={updateConfig} />
          )}
          {action.type === "SEND_TEAMS_MESSAGE" && (
            <TeamsActionConfig config={action.config} onChange={updateConfig} />
          )}
          {action.type === "WEBHOOK" && (
            <WebhookActionConfig config={action.config} onChange={updateConfig} />
          )}
          {action.type === "WAIT" && (
            <WaitActionConfig config={action.config} onChange={updateConfig} />
          )}
          {action.type === "CREATE_NOTIFICATION" && (
            <NotificationActionConfig config={action.config} onChange={updateConfig} />
          )}
        </div>
      )}
    </div>
  )
}

function EmailActionConfig({
  config,
  onChange,
}: {
  config: Record<string, unknown>
  onChange: (key: string, value: unknown) => void
}) {
  return (
    <div className="space-y-3">
      <div>
        <Label>To</Label>
        <Input
          placeholder="recipient@example.com or {{entity.data.email}}"
          value={(config.to as string) || ""}
          onChange={(e) => onChange("to", e.target.value)}
        />
      </div>
      <div>
        <Label>Subject</Label>
        <Input
          placeholder="Email subject (supports templates)"
          value={(config.subject as string) || ""}
          onChange={(e) => onChange("subject", e.target.value)}
        />
      </div>
      <div>
        <Label>Body</Label>
        <Textarea
          placeholder="Email body (supports templates like {{entity.data.name}})"
          value={(config.body as string) || ""}
          onChange={(e) => onChange("body", e.target.value)}
          rows={4}
        />
      </div>
    </div>
  )
}

function SmsActionConfig({
  config,
  onChange,
}: {
  config: Record<string, unknown>
  onChange: (key: string, value: unknown) => void
}) {
  return (
    <div className="space-y-3">
      <div>
        <Label>To (Phone Number)</Label>
        <Input
          placeholder="+1234567890 or {{entity.data.phone}}"
          value={(config.to as string) || ""}
          onChange={(e) => onChange("to", e.target.value)}
        />
      </div>
      <div>
        <Label>Message</Label>
        <Textarea
          placeholder="SMS message (supports templates)"
          value={(config.body as string) || ""}
          onChange={(e) => onChange("body", e.target.value)}
          rows={3}
        />
      </div>
    </div>
  )
}

function SlackActionConfig({
  config,
  onChange,
}: {
  config: Record<string, unknown>
  onChange: (key: string, value: unknown) => void
}) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Channel</Label>
        <Input
          placeholder="#general or user-id"
          value={(config.channel as string) || ""}
          onChange={(e) => onChange("channel", e.target.value)}
        />
      </div>
      <div>
        <Label>Message</Label>
        <Textarea
          placeholder="Slack message (supports Markdown and templates)"
          value={(config.text as string) || ""}
          onChange={(e) => onChange("text", e.target.value)}
          rows={3}
        />
      </div>
    </div>
  )
}

function TeamsActionConfig({
  config,
  onChange,
}: {
  config: Record<string, unknown>
  onChange: (key: string, value: unknown) => void
}) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Webhook URL</Label>
        <Input
          placeholder="https://outlook.office.com/webhook/..."
          value={(config.webhookUrl as string) || ""}
          onChange={(e) => onChange("webhookUrl", e.target.value)}
        />
      </div>
      <div>
        <Label>Title</Label>
        <Input
          placeholder="Message title"
          value={(config.title as string) || ""}
          onChange={(e) => onChange("title", e.target.value)}
        />
      </div>
      <div>
        <Label>Message</Label>
        <Textarea
          placeholder="Teams message (supports Markdown and templates)"
          value={(config.text as string) || ""}
          onChange={(e) => onChange("text", e.target.value)}
          rows={3}
        />
      </div>
    </div>
  )
}

function WebhookActionConfig({
  config,
  onChange,
}: {
  config: Record<string, unknown>
  onChange: (key: string, value: unknown) => void
}) {
  return (
    <div className="space-y-3">
      <div>
        <Label>URL</Label>
        <Input
          placeholder="https://api.example.com/endpoint"
          value={(config.url as string) || ""}
          onChange={(e) => onChange("url", e.target.value)}
        />
      </div>
      <div>
        <Label>Method</Label>
        <Select
          value={(config.method as string) || "POST"}
          onValueChange={(value) => onChange("method", value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="GET">GET</SelectItem>
            <SelectItem value="POST">POST</SelectItem>
            <SelectItem value="PUT">PUT</SelectItem>
            <SelectItem value="PATCH">PATCH</SelectItem>
            <SelectItem value="DELETE">DELETE</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Body (JSON)</Label>
        <Textarea
          placeholder='{"key": "{{entity.data.value}}"}'
          value={(config.body as string) || ""}
          onChange={(e) => onChange("body", e.target.value)}
          rows={4}
          className="font-mono text-sm"
        />
      </div>
    </div>
  )
}

function WaitActionConfig({
  config,
  onChange,
}: {
  config: Record<string, unknown>
  onChange: (key: string, value: unknown) => void
}) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Duration (seconds)</Label>
        <Input
          type="number"
          placeholder="60"
          value={(config.duration as number) || ""}
          onChange={(e) => onChange("duration", parseInt(e.target.value))}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Time to wait before next action
        </p>
      </div>
    </div>
  )
}

function NotificationActionConfig({
  config,
  onChange,
}: {
  config: Record<string, unknown>
  onChange: (key: string, value: unknown) => void
}) {
  return (
    <div className="space-y-3">
      <div>
        <Label>User ID</Label>
        <Input
          placeholder="user-id or {{user.id}}"
          value={(config.userId as string) || ""}
          onChange={(e) => onChange("userId", e.target.value)}
        />
      </div>
      <div>
        <Label>Title</Label>
        <Input
          placeholder="Notification title"
          value={(config.title as string) || ""}
          onChange={(e) => onChange("title", e.target.value)}
        />
      </div>
      <div>
        <Label>Message</Label>
        <Textarea
          placeholder="Notification message (supports templates)"
          value={(config.message as string) || ""}
          onChange={(e) => onChange("message", e.target.value)}
          rows={3}
        />
      </div>
    </div>
  )
}
