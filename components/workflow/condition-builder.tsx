"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Filter } from "lucide-react"
import { CONDITION_OPERATORS } from "@/lib/workflow/workflow-types"
import type { WorkflowCondition, WorkflowConditionGroup, WorkflowConditionLeaf } from "@/lib/workflow/workflow-types"

interface ConditionBuilderProps {
  conditions: WorkflowCondition | null
  onChange: (conditions: WorkflowCondition | null) => void
}

export function ConditionBuilder({ conditions, onChange }: ConditionBuilderProps) {
  const [enabled, setEnabled] = React.useState(!!conditions)

  React.useEffect(() => {
    if (enabled && !conditions) {
      // Create a group condition with one leaf condition
      const defaultGroup: WorkflowConditionGroup = {
        operator: "AND",
        conditions: [
          {
            field: "",
            operator: "EQUALS",
            value: "",
          } as WorkflowConditionLeaf,
        ],
      }
      onChange(defaultGroup)
    } else if (!enabled && conditions) {
      onChange(null)
    }
  }, [enabled, conditions, onChange])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Conditions (Optional)
            </CardTitle>
            <CardDescription>Add logic to control when workflow runs</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="enable-conditions">Enable Conditions</Label>
            <Switch
              id="enable-conditions"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>
        </div>
      </CardHeader>
      {enabled && conditions && (
        <CardContent>
          <SimpleConditionEditor conditions={conditions} onChange={onChange} />
        </CardContent>
      )}
    </Card>
  )
}

function SimpleConditionEditor({
  conditions,
  onChange,
}: {
  conditions: WorkflowCondition
  onChange: (conditions: WorkflowCondition) => void
}) {
  // Type guard to check if it's a group condition
  const isGroup = (cond: WorkflowCondition): cond is WorkflowConditionGroup => {
    return 'conditions' in cond && Array.isArray(cond.conditions)
  }

  const addCondition = () => {
    const newLeaf: WorkflowConditionLeaf = {
      field: "",
      operator: "EQUALS",
      value: "",
    }
    
    if (isGroup(conditions)) {
      onChange({
        ...conditions,
        conditions: [...conditions.conditions, newLeaf],
      })
    }
  }

  const removeCondition = (index: number) => {
    if (isGroup(conditions)) {
      const updated = conditions.conditions.filter((_: WorkflowCondition, i: number) => i !== index)
      onChange({ ...conditions, conditions: updated })
    }
  }

  const updateCondition = (index: number, updates: Partial<WorkflowConditionLeaf>) => {
    if (isGroup(conditions)) {
      const updated = [...conditions.conditions]
      updated[index] = { ...updated[index], ...updates } as WorkflowCondition
      onChange({ ...conditions, conditions: updated })
    }
  }

  if (!isGroup(conditions)) {
    return <div>Invalid condition structure</div>
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Group Operator</Label>
        <Select
          value={conditions.operator}
          onValueChange={(value: "AND" | "OR" | "NOT") => onChange({ ...conditions, operator: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AND">AND (All conditions must match)</SelectItem>
            <SelectItem value="OR">OR (Any condition must match)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {conditions.conditions?.map((condition: WorkflowCondition, index: number) => {
          const leafCondition = condition as WorkflowConditionLeaf
          return (
          <div key={index} className="p-3 border rounded-lg space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Field</Label>
                <Input
                  placeholder="entity.data.status"
                  value={leafCondition.field || ""}
                  onChange={(e) => updateCondition(index, { field: e.target.value })}
                />
              </div>
              <div>
                <Label>Operator</Label>
                <Select
                  value={leafCondition.operator || "EQUALS"}
                  onValueChange={(value) => updateCondition(index, { operator: value as WorkflowConditionLeaf['operator'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONDITION_OPERATORS.map((op) => (
                      <SelectItem key={op.value} value={op.value}>
                        {op.label} ({op.symbol})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Value</Label>
                <Input
                  placeholder="value"
                  value={String(leafCondition.value || "")}
                  onChange={(e) => updateCondition(index, { value: e.target.value })}
                />
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => removeCondition(index)}
              className="w-full text-destructive"
            >
              Remove Condition
            </Button>
          </div>
          )
        })}
      </div>

      <Button onClick={addCondition} variant="outline" className="w-full">
        Add Condition
      </Button>
    </div>
  )
}