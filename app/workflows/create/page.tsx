"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Save, AlertCircle, Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { TriggerBuilder } from "@/components/workflow/trigger-builder"
import { ConditionBuilder } from "@/components/workflow/condition-builder"
import { ActionBuilder } from "@/components/workflow/action-builder"
import { WORKFLOW_CATEGORIES } from "@/lib/workflow/workflow-types"
import type { WorkflowFormData } from "@/lib/workflow/workflow-types"
import type { WorkflowTemplate } from "@/lib/workflow/workflow-templates"

export default function CreateWorkflowPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [fromTemplate, setFromTemplate] = useState(false)
  const [templateName, setTemplateName] = useState("")

  const [formData, setFormData] = useState<WorkflowFormData>({
    name: "",
    description: "",
    enabled: false,
    triggers: [{ type: "PROJECT_CREATED", config: {} }],
    conditions: null,
    actions: [{ type: "SEND_EMAIL", config: {}, order: 1 }],
    priority: 5,
    maxRetries: 3,
    retryDelay: 60,
    timeout: 300,
    category: "automation",
    tags: [],
  })

  const [tagInput, setTagInput] = useState("")

  // Load template if coming from templates page
  useEffect(() => {
    const isFromTemplate = searchParams.get("from_template") === "true"
    if (isFromTemplate) {
      const templateData = sessionStorage.getItem("workflow_template")
      if (templateData) {
        try {
          const template: WorkflowTemplate = JSON.parse(templateData)
          setFromTemplate(true)
          setTemplateName(template.name)
          setFormData({
            name: template.name,
            description: template.description,
            enabled: false, // Start disabled for review
            triggers: template.triggers,
            conditions: template.conditions,
            actions: template.actions,
            priority: template.priority,
            maxRetries: template.maxRetries,
            retryDelay: template.retryDelay,
            timeout: template.timeout,
            category: template.category,
            tags: template.tags,
          })
          toast.success(`Template "${template.name}" loaded. Customize and save.`)
          // Clear from session storage
          sessionStorage.removeItem("workflow_template")
        } catch (_error) {
          toast.error("Failed to load template")
        }
      }
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    const validationErrors: string[] = []
    if (!formData.name.trim()) {
      validationErrors.push("Workflow name is required")
    }
    if (formData.triggers.length === 0) {
      validationErrors.push("At least one trigger is required")
    }
    if (formData.actions.length === 0) {
      validationErrors.push("At least one action is required")
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    try {
      setSaving(true)
      setErrors([])

      const response = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to create workflow")
      }

      const data = await response.json()
      toast.success("Workflow created successfully!")
      router.push(`/workflows/${data.workflow.id}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create workflow"
      toast.error(message)
      setErrors([message])
    } finally {
      setSaving(false)
    }
  }

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] })
      setTagInput("")
    }
  }

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter((t) => t !== tag) })
  }

  if (status === "loading") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (status === "unauthenticated") {
    router.push("/login")
    return null
  }

  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN"
  if (!isAdmin) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don&apos;t have permission to create workflows.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <Link href="/workflows">
          <Button variant="ghost" size="sm" className="gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Workflows
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Create Workflow</h1>
        <p className="text-muted-foreground mt-2">
          Design a new automated workflow for your business processes
        </p>
      </div>

      {/* Template Banner */}
      {fromTemplate && templateName && (
        <Alert>
          <Sparkles className="h-4 w-4" />
          <AlertDescription>
            Creating workflow from template: <strong>{templateName}</strong>. Customize the details below before saving.
          </AlertDescription>
        </Alert>
      )}

      {/* Validation Errors */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Name and describe your workflow</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Workflow Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Send Project Email Notification"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what this workflow does"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WORKFLOW_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="enabled"
                  checked={formData.enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                />
                <Label htmlFor="enabled">Enable immediately after creation</Label>
              </div>
            </div>

            <div>
              <Label htmlFor="tags">Tags</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  placeholder="Add tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addTag()
                    }
                  }}
                />
                <Button type="button" onClick={addTag} variant="outline">
                  Add
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag) => (
                    <div
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-secondary rounded-md text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Triggers */}
        <TriggerBuilder
          triggers={formData.triggers}
          onChange={(triggers) => setFormData({ ...formData, triggers })}
        />

        {/* Conditions */}
        <ConditionBuilder
          conditions={formData.conditions}
          onChange={(conditions) => setFormData({ ...formData, conditions })}
        />

        {/* Actions */}
        <ActionBuilder
          actions={formData.actions}
          onChange={(actions) => setFormData({ ...formData, actions })}
        />

        {/* Advanced Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Advanced Settings</CardTitle>
            <CardDescription>Configure execution behavior</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">Priority (1-10)</Label>
                <Input
                  id="priority"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: parseInt(e.target.value) })
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Higher priority workflows execute first
                </p>
              </div>

              <div>
                <Label htmlFor="maxRetries">Max Retries</Label>
                <Input
                  id="maxRetries"
                  type="number"
                  min="0"
                  max="10"
                  value={formData.maxRetries}
                  onChange={(e) =>
                    setFormData({ ...formData, maxRetries: parseInt(e.target.value) })
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Number of retry attempts on failure
                </p>
              </div>

              <div>
                <Label htmlFor="retryDelay">Retry Delay (seconds)</Label>
                <Input
                  id="retryDelay"
                  type="number"
                  min="0"
                  value={formData.retryDelay}
                  onChange={(e) =>
                    setFormData({ ...formData, retryDelay: parseInt(e.target.value) })
                  }
                />
              </div>

              <div>
                <Label htmlFor="timeout">Timeout (seconds)</Label>
                <Input
                  id="timeout"
                  type="number"
                  min="0"
                  value={formData.timeout}
                  onChange={(e) =>
                    setFormData({ ...formData, timeout: parseInt(e.target.value) })
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Maximum execution time
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Link href="/workflows">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={saving} className="gap-2">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Create Workflow
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
