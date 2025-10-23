"use client"

import { WorkflowTemplate } from "@/lib/workflow/workflow-templates"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Briefcase, AlertCircle, Clock, UserCheck, CheckCircle, AlertTriangle,
  FileText, DollarSign, Bell, UserPlus, Award, Users, Trophy, Code,
  Zap, Sparkles
} from "lucide-react"

interface TemplateCardProps {
  template: WorkflowTemplate
  onUseTemplate: (template: WorkflowTemplate) => void
}

/**
 * Get icon component by name
 */
function getIconComponent(iconName: string) {
  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    Briefcase,
    AlertCircle,
    Clock,
    UserCheck,
    CheckCircle,
    AlertTriangle,
    FileText,
    DollarSign,
    Bell,
    UserPlus,
    Award,
    Users,
    Trophy,
    Code,
    Zap,
    Sparkles
  }
  
  const IconComponent = icons[iconName] || Zap
  return <IconComponent className="h-6 w-6" />
}

/**
 * Get difficulty color
 */
function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case "beginner":
      return "bg-green-100 text-green-800 border-green-200"
    case "intermediate":
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
    case "advanced":
      return "bg-red-100 text-red-800 border-red-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

/**
 * Template Card Component
 * Displays a workflow template preview with icon, description, and use button
 */
export function TemplateCard({ template, onUseTemplate }: TemplateCardProps) {
  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              {getIconComponent(template.icon)}
            </div>
            <div>
              <CardTitle className="text-lg">{template.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={getDifficultyColor(template.difficulty)}>
                  {template.difficulty}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {template.estimatedSetupTime}
                </span>
              </div>
            </div>
          </div>
        </div>
        <CardDescription className="mt-3">
          {template.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        {/* Use Cases */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Use Cases:</h4>
          <ul className="space-y-1">
            {template.useCases.slice(0, 3).map((useCase, index) => (
              <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>{useCase}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-4">
          {template.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Prerequisites (if any) */}
        {template.prerequisites && template.prerequisites.length > 0 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-xs font-semibold text-yellow-800 mb-1">Prerequisites:</p>
            <ul className="space-y-1">
              {template.prerequisites.map((prereq, index) => (
                <li key={index} className="text-xs text-yellow-700">
                  • {prereq}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Template Stats */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Triggers</div>
            <div className="text-sm font-semibold">{template.triggers.length}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Actions</div>
            <div className="text-sm font-semibold">{template.actions.length}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Priority</div>
            <div className="text-sm font-semibold">{template.priority}/10</div>
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Button 
          onClick={() => onUseTemplate(template)} 
          className="w-full"
        >
          Use Template
        </Button>
      </CardFooter>
    </Card>
  )
}
