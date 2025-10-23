"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, Zap } from "lucide-react"
import { TRIGGER_TYPES } from "@/lib/workflow/workflow-types"
import type { WorkflowTrigger } from "@/lib/workflow/workflow-types"

interface TriggerBuilderProps {
  triggers: WorkflowTrigger[]
  onChange: (triggers: WorkflowTrigger[]) => void
}

export function TriggerBuilder({ triggers, onChange }: TriggerBuilderProps) {
  const addTrigger = () => {
    onChange([...triggers, { type: "PROJECT_CREATED", config: {} }])
  }

  const removeTrigger = (index: number) => {
    onChange(triggers.filter((_, i) => i !== index))
  }

  const updateTrigger = (index: number, updates: Partial<WorkflowTrigger>) => {
    const updated = [...triggers]
    updated[index] = { ...updated[index], ...updates }
    onChange(updated)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Triggers
            </CardTitle>
            <CardDescription>Events that start this workflow</CardDescription>
          </div>
          <Button onClick={addTrigger} size="sm" variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Trigger
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {triggers.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground mb-4">No triggers configured</p>
            <Button onClick={addTrigger} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Your First Trigger
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {triggers.map((trigger, index) => (
              <TriggerCard
                key={index}
                trigger={trigger}
                onUpdate={(updates) => updateTrigger(index, updates)}
                onRemove={() => removeTrigger(index)}
                canRemove={triggers.length > 1}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function TriggerCard({
  trigger,
  onUpdate,
  onRemove,
  canRemove,
}: {
  trigger: WorkflowTrigger
  onUpdate: (updates: Partial<WorkflowTrigger>) => void
  onRemove: () => void
  canRemove: boolean
}) {
  const [showConfig, setShowConfig] = useState(false)
  const selectedTrigger = TRIGGER_TYPES.find((t) => t.value === trigger.type)

  return (
    <div className="p-4 border rounded-lg space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Select
            value={trigger.type}
            onValueChange={(value) => onUpdate({ type: value, config: {} })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TRIGGER_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div>
                    <div className="font-medium">{type.label}</div>
                    <div className="text-xs text-muted-foreground">{type.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedTrigger && (
            <p className="text-sm text-muted-foreground mt-1">{selectedTrigger.description}</p>
          )}
        </div>
        {canRemove && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="h-8 w-8 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Configuration */}
      {(trigger.type === "SCHEDULE" || trigger.type === "WEBHOOK") && (
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowConfig(!showConfig)}
            className="w-full"
          >
            {showConfig ? "Hide" : "Show"} Configuration
          </Button>
          {showConfig && (
            <div className="space-y-2">
              {trigger.type === "SCHEDULE" && (
                <div>
                  <label className="text-sm font-medium">Cron Expression</label>
                  <Textarea
                    placeholder="0 0 * * * (daily at midnight)"
                    value={(trigger.config.schedule as string) || ""}
                    onChange={(e) =>
                      onUpdate({ config: { ...trigger.config, schedule: e.target.value } })
                    }
                    rows={2}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Format: minute hour day month weekday
                  </p>
                </div>
              )}
              {trigger.type === "WEBHOOK" && (
                <div>
                  <label className="text-sm font-medium">Webhook Path</label>
                  <Textarea
                    placeholder="/api/webhooks/my-workflow"
                    value={(trigger.config.path as string) || ""}
                    onChange={(e) =>
                      onUpdate({ config: { ...trigger.config, path: e.target.value } })
                    }
                    rows={2}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    This webhook will be available at this path
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {Object.keys(trigger.config).length > 0 && !showConfig && (
        <Badge variant="secondary" className="text-xs">
          Configuration: {Object.keys(trigger.config).length} field(s)
        </Badge>
      )}
    </div>
  )
}
