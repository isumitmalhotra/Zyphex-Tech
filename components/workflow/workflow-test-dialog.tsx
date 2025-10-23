"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { CheckCircle, XCircle, AlertCircle, Loader2, Beaker, Info } from "lucide-react"
import { toast } from "sonner"

interface WorkflowTestDialogProps {
  workflowId: string
  trigger?: React.ReactNode
}

interface TestResult {
  success: boolean
  executionId?: string
  duration?: number
  testResult?: {
    wouldExecute: boolean
    triggerMatched: boolean
    conditionsPassed: boolean
  }
  evaluation?: {
    triggers?: Array<{ type: string; matched: boolean; reason?: string }>
    conditions?: { result: boolean; config: unknown }
    actions?: Array<{ type: string; config: unknown }>
  }
  notes?: string[]
  result?: unknown
  error?: string
}

export function WorkflowTestDialog({ workflowId, trigger }: WorkflowTestDialogProps) {
  const [open, setOpen] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [mockData, setMockData] = useState(`{
  "entity": {
    "type": "project",
    "id": "test-123",
    "data": {
      "name": "Test Project",
      "status": "PLANNING",
      "clientEmail": "client@example.com",
      "priority": "HIGH"
    }
  },
  "metadata": {
    "testMode": true,
    "note": "This is a test execution"
  }
}`)

  const handleTest = async () => {
    try {
      setTesting(true)
      setTestResult(null)

      // Validate JSON
      let parsedData
      try {
        parsedData = JSON.parse(mockData)
      } catch (_e) {
        throw new Error("Invalid JSON format")
      }

      const response = await fetch(`/api/workflows/${workflowId}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to test workflow")
      }

      const result = await response.json()
      setTestResult(result)
      
      if (result.testResult.wouldExecute) {
        toast.success("Test successful - Workflow would execute")
      } else {
        toast.warning("Test complete - Workflow would not execute")
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to test workflow"
      toast.error(message)
      setTestResult({ success: false, error: message })
    } finally {
      setTesting(false)
    }
  }

  const loadTemplate = (template: string) => {
    const templates = {
      project: `{
  "entity": {
    "type": "project",
    "id": "proj-123",
    "data": {
      "name": "Sample Project",
      "status": "PLANNING",
      "clientEmail": "client@example.com",
      "priority": "HIGH",
      "budget": 50000
    }
  }
}`,
      task: `{
  "entity": {
    "type": "task",
    "id": "task-456",
    "data": {
      "title": "Complete Feature",
      "status": "COMPLETED",
      "priority": "HIGH",
      "assigneeEmail": "team@example.com"
    }
  }
}`,
      invoice: `{
  "entity": {
    "type": "invoice",
    "id": "inv-789",
    "data": {
      "number": "INV-2024-001",
      "amount": 5000,
      "status": "PAID",
      "clientEmail": "client@example.com",
      "dueDate": "2024-12-31"
    }
  }
}`,
      user: `{
  "entity": {
    "type": "user",
    "id": "user-123",
    "data": {
      "name": "John Doe",
      "email": "john@example.com",
      "role": "CLIENT",
      "phone": "+1234567890"
    }
  }
}`,
    }
    setMockData(templates[template as keyof typeof templates] || templates.project)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Beaker className="h-4 w-4" />
            Test Workflow
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Beaker className="h-5 w-5" />
            Test Workflow
          </DialogTitle>
          <DialogDescription>
            Test your workflow with mock data without executing actual actions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              This is a dry run. No actual actions (emails, SMS, etc.) will be executed.
              The test will evaluate triggers and conditions to show if the workflow would run.
            </AlertDescription>
          </Alert>

          {/* Template Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Templates</CardTitle>
              <CardDescription>Load sample data for common entity types</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadTemplate("project")}
                >
                  Project
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadTemplate("task")}
                >
                  Task
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadTemplate("invoice")}
                >
                  Invoice
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadTemplate("user")}
                >
                  User
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Mock Data Editor */}
          <div>
            <Label htmlFor="mockData">Mock Data (JSON)</Label>
            <Textarea
              id="mockData"
              value={mockData}
              onChange={(e) => setMockData(e.target.value)}
              rows={12}
              className="font-mono text-sm mt-2"
              placeholder='{"entity": {"type": "project", "data": {...}}}'
            />
            <p className="text-xs text-muted-foreground mt-1">
              Provide entity data to test against workflow triggers and conditions
            </p>
          </div>

          {/* Test Button */}
          <Button onClick={handleTest} disabled={testing} className="w-full gap-2">
            {testing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Beaker className="h-4 w-4" />
                Run Test
              </>
            )}
          </Button>

          {/* Test Results */}
          {testResult && !testResult.error && testResult.testResult && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  Test Results
                  {testResult.testResult.wouldExecute ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-yellow-500" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    {testResult.testResult.wouldExecute ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-yellow-500" />
                    )}
                    <div>
                      <div className="text-xs text-muted-foreground">Would Execute</div>
                      <div className="font-medium">
                        {testResult.testResult.wouldExecute ? "Yes" : "No"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {testResult.testResult.triggerMatched ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <div className="text-xs text-muted-foreground">Trigger Matched</div>
                      <div className="font-medium">
                        {testResult.testResult.triggerMatched ? "Yes" : "No"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {testResult.testResult.conditionsPassed ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <div className="text-xs text-muted-foreground">Conditions Passed</div>
                      <div className="font-medium">
                        {testResult.testResult.conditionsPassed ? "Yes" : "No"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trigger Evaluation */}
                {testResult.evaluation?.triggers && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Trigger Evaluation</h4>
                    <div className="space-y-2">
                      {testResult.evaluation.triggers.map((trigger: { matched: boolean; trigger?: string; type: string; reason?: string }, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-muted rounded text-sm">
                          {trigger.matched ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span>{trigger.trigger || trigger.type}</span>
                          <Badge variant={trigger.matched ? "default" : "secondary"}>
                            {trigger.matched ? "Matched" : "Not Matched"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Condition Evaluation */}
                {testResult.evaluation?.conditions && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Condition Evaluation</h4>
                    <div className="p-2 bg-muted rounded">
                      <div className="flex items-center gap-2 text-sm mb-2">
                        {testResult.evaluation.conditions.result ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="font-medium">
                          Result: {testResult.evaluation.conditions.result ? "Passed" : "Failed"}
                        </span>
                      </div>
                      <pre className="text-xs overflow-auto max-h-32">
                        {JSON.stringify(testResult.evaluation.conditions.config, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Actions Preview */}
                {testResult.evaluation?.actions && testResult.evaluation.actions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Actions to Execute</h4>
                    <div className="space-y-2">
                      {testResult.evaluation.actions.map((action: { type: string; config: unknown; order?: number; willExecute?: boolean }, idx: number) => (
                        <div key={idx} className="p-3 border rounded">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                              {action.order ?? idx + 1}
                            </div>
                            <span className="font-medium">{action.type.replace(/_/g, " ")}</span>
                            <Badge variant={action.willExecute ? "default" : "secondary"}>
                              {action.willExecute ? "Will Execute" : "Will Skip"}
                            </Badge>
                          </div>
                          {action.config ? (
                            <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-24">
                              {JSON.stringify(action.config as Record<string, unknown>, null, 2)}
                            </pre>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {testResult.notes && testResult.notes.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Notes</h4>
                    <ul className="space-y-1">
                      {testResult.notes.map((note: string, idx: number) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>{note}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Error Display */}
          {testResult?.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{testResult.error}</AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
