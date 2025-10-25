"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  FileText,
  Plus,
  Search,
  Filter,
  Copy,
  Edit,
  Trash2,
  Archive,
  Clock,
  Users,
  Layers,
  ChevronDown,
  Download,
  Upload,
  CheckCircle2,
  MoreVertical,
  Eye,
  TrendingUp,
  Calendar,
  DollarSign,
  Target
} from "lucide-react"
import { SubtleBackground } from "@/components/subtle-background"
import { useScrollAnimation } from "@/components/scroll-animations"
import { useToast } from "@/hooks/use-toast"

// Template Interface
interface ProjectTemplate {
  id: string
  name: string
  description: string
  category: string
  methodology: "AGILE" | "WATERFALL" | "SCRUM" | "KANBAN" | "HYBRID"
  estimatedDuration: number // in days
  taskCount: number
  milestoneCount: number
  usageCount: number
  isDefault: boolean
  createdAt: string
  updatedAt: string
  thumbnail?: string
  tags: string[]
  budget?: {
    min: number
    max: number
  }
  teamSize?: {
    min: number
    max: number
  }
  tasks?: {
    title: string
    description: string
    estimatedHours: number
    skillsRequired: string[]
  }[]
  milestones?: {
    title: string
    description: string
    daysFromStart: number
  }[]
}

// Mock Templates Data
const mockTemplates: ProjectTemplate[] = [
  {
    id: "1",
    name: "Web Application Development (Agile)",
    description: "Complete web application development using Agile methodology with sprints and continuous delivery",
    category: "Web Development",
    methodology: "AGILE",
    estimatedDuration: 90,
    taskCount: 45,
    milestoneCount: 6,
    usageCount: 28,
    isDefault: true,
    createdAt: "2024-01-15",
    updatedAt: "2024-10-20",
    tags: ["Web", "Agile", "Full-Stack", "React", "Node.js"],
    budget: { min: 50000, max: 150000 },
    teamSize: { min: 4, max: 8 },
    tasks: [
      {
        title: "Project Setup & Planning",
        description: "Initial project setup and sprint planning",
        estimatedHours: 16,
        skillsRequired: ["Project Management", "Requirements Analysis"]
      }
    ],
    milestones: [
      {
        title: "Project Kickoff",
        description: "Project initialization and team setup",
        daysFromStart: 0
      }
    ]
  },
  {
    id: "2",
    name: "Mobile App Development (iOS & Android)",
    description: "Cross-platform mobile application development with React Native or Flutter",
    category: "Mobile Development",
    methodology: "SCRUM",
    estimatedDuration: 120,
    taskCount: 52,
    milestoneCount: 8,
    usageCount: 19,
    isDefault: true,
    createdAt: "2024-02-10",
    updatedAt: "2024-10-18",
    tags: ["Mobile", "iOS", "Android", "React Native", "Flutter"],
    budget: { min: 60000, max: 180000 },
    teamSize: { min: 5, max: 10 }
  },
  {
    id: "3",
    name: "Marketing Campaign Launch",
    description: "Comprehensive digital marketing campaign from planning to execution and analysis",
    category: "Marketing",
    methodology: "HYBRID",
    estimatedDuration: 60,
    taskCount: 30,
    milestoneCount: 5,
    usageCount: 42,
    isDefault: true,
    createdAt: "2024-01-20",
    updatedAt: "2024-10-22",
    tags: ["Marketing", "Digital", "SEO", "Social Media", "Content"],
    budget: { min: 20000, max: 80000 },
    teamSize: { min: 3, max: 6 }
  },
  {
    id: "4",
    name: "Brand Identity & Design",
    description: "Complete brand identity design including logo, style guide, and marketing materials",
    category: "Design",
    methodology: "WATERFALL",
    estimatedDuration: 45,
    taskCount: 25,
    milestoneCount: 4,
    usageCount: 35,
    isDefault: true,
    createdAt: "2024-02-05",
    updatedAt: "2024-10-15",
    tags: ["Design", "Branding", "Visual Identity", "Logo"],
    budget: { min: 15000, max: 50000 },
    teamSize: { min: 2, max: 4 }
  },
  {
    id: "5",
    name: "E-commerce Platform Setup",
    description: "Full e-commerce platform development with payment integration and inventory management",
    category: "E-commerce",
    methodology: "AGILE",
    estimatedDuration: 75,
    taskCount: 40,
    milestoneCount: 7,
    usageCount: 22,
    isDefault: true,
    createdAt: "2024-03-01",
    updatedAt: "2024-10-19",
    tags: ["E-commerce", "Shopify", "WooCommerce", "Payment", "Inventory"],
    budget: { min: 40000, max: 120000 },
    teamSize: { min: 4, max: 7 }
  },
  {
    id: "6",
    name: "API Development & Integration",
    description: "RESTful API development with documentation and third-party integrations",
    category: "Backend Development",
    methodology: "SCRUM",
    estimatedDuration: 50,
    taskCount: 28,
    milestoneCount: 5,
    usageCount: 31,
    isDefault: false,
    createdAt: "2024-03-15",
    updatedAt: "2024-10-21",
    tags: ["API", "Backend", "REST", "Integration", "Documentation"],
    budget: { min: 25000, max: 75000 },
    teamSize: { min: 3, max: 5 }
  }
]

export default function Templates() {
  useScrollAnimation()
  const { toast } = useToast()

  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [methodologyFilter, setMethodologyFilter] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [templates, setTemplates] = useState<ProjectTemplate[]>(mockTemplates)
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // Get unique categories and methodologies
  const categories = useMemo(() => {
    const cats = Array.from(new Set(templates.map(t => t.category)))
    return ["all", ...cats]
  }, [templates])

  const methodologies = useMemo(() => {
    const methods = Array.from(new Set(templates.map(t => t.methodology)))
    return ["all", ...methods]
  }, [templates])

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      const matchesSearch = 
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      
      const matchesCategory = categoryFilter === "all" || template.category === categoryFilter
      const matchesMethodology = methodologyFilter === "all" || template.methodology === methodologyFilter

      return matchesSearch && matchesCategory && matchesMethodology
    })
  }, [templates, searchQuery, categoryFilter, methodologyFilter])

  // Calculate statistics
  const stats = useMemo(() => {
    return {
      total: templates.length,
      default: templates.filter(t => t.isDefault).length,
      custom: templates.filter(t => !t.isDefault).length,
      totalUsage: templates.reduce((sum, t) => sum + t.usageCount, 0)
    }
  }, [templates])

  const handleDuplicateTemplate = (template: ProjectTemplate) => {
    const duplicated: ProjectTemplate = {
      ...template,
      id: `${Date.now()}`,
      name: `${template.name} (Copy)`,
      isDefault: false,
      usageCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    }
    setTemplates([duplicated, ...templates])
    toast({
      title: "Template Duplicated",
      description: `"${template.name}" has been duplicated successfully.`
    })
  }

  const handleDeleteTemplate = () => {
    if (!selectedTemplate) return
    
    setTemplates(templates.filter(t => t.id !== selectedTemplate.id))
    toast({
      title: "Template Deleted",
      description: `"${selectedTemplate.name}" has been deleted.`
    })
    setIsDeleteDialogOpen(false)
    setSelectedTemplate(null)
  }

  const handleArchiveTemplate = (template: ProjectTemplate) => {
    toast({
      title: "Template Archived",
      description: `"${template.name}" has been archived.`
    })
  }

  const handleExportTemplate = (template: ProjectTemplate) => {
    const dataStr = JSON.stringify(template, null, 2)
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`
    const exportFileDefaultName = `template-${template.name.toLowerCase().replace(/\s+/g, '-')}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
    
    toast({
      title: "Template Exported",
      description: `"${template.name}" has been exported successfully.`
    })
  }

  const handleUseTemplate = (template: ProjectTemplate) => {
    toast({
      title: "Redirecting...",
      description: `Creating new project from "${template.name}" template.`
    })
    // In production: router.push(`/project-manager/projects/new?template=${template.id}`)
  }

  const getMethodologyColor = (methodology: string) => {
    const colors: Record<string, string> = {
      AGILE: "bg-blue-500/10 text-blue-400 border-blue-500/30",
      SCRUM: "bg-purple-500/10 text-purple-400 border-purple-500/30",
      KANBAN: "bg-green-500/10 text-green-400 border-green-500/30",
      WATERFALL: "bg-orange-500/10 text-orange-400 border-orange-500/30",
      HYBRID: "bg-pink-500/10 text-pink-400 border-pink-500/30"
    }
    return colors[methodology] || colors.AGILE
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
      <SubtleBackground />
      
      <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 scroll-reveal">
          <div>
            <h1 className="text-3xl font-bold zyphex-heading">Project Templates</h1>
            <p className="zyphex-subheading">Streamline project creation with reusable templates</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => document.getElementById('import-file')?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
            <input
              id="import-file"
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  toast({
                    title: "Template Imported",
                    description: `"${file.name}" has been imported successfully.`
                  })
                }
              }}
            />
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="zyphex-button-primary">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Template</DialogTitle>
                  <DialogDescription>
                    Build a reusable project template from scratch
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Template Name</Label>
                    <Input id="name" placeholder="e.g., Website Redesign" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe what this template is for..."
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="web">Web Development</SelectItem>
                          <SelectItem value="mobile">Mobile Development</SelectItem>
                          <SelectItem value="design">Design</SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="methodology">Methodology</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select methodology" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AGILE">Agile</SelectItem>
                          <SelectItem value="SCRUM">Scrum</SelectItem>
                          <SelectItem value="KANBAN">Kanban</SelectItem>
                          <SelectItem value="WATERFALL">Waterfall</SelectItem>
                          <SelectItem value="HYBRID">Hybrid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Estimated Duration (days)</Label>
                    <Input id="duration" type="number" placeholder="90" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input id="tags" placeholder="web, react, api" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    className="zyphex-button-primary"
                    onClick={() => {
                      toast({
                        title: "Template Created",
                        description: "Your template has been created successfully."
                      })
                      setIsCreateDialogOpen(false)
                    }}
                  >
                    Create Template
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 scroll-reveal">
          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Total Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold zyphex-accent-text">{stats.total}</div>
              <p className="text-xs zyphex-subheading mt-1">
                {stats.default} default, {stats.custom} custom
              </p>
            </CardContent>
          </Card>
          
          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Total Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold zyphex-accent-text">{stats.totalUsage}</div>
              <p className="text-xs zyphex-subheading mt-1">Times templates were used</p>
            </CardContent>
          </Card>
          
          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold zyphex-accent-text">{categories.length - 1}</div>
              <p className="text-xs zyphex-subheading mt-1">Different template types</p>
            </CardContent>
          </Card>
          
          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Avg Duration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold zyphex-accent-text">
                {Math.round(templates.reduce((sum, t) => sum + t.estimatedDuration, 0) / templates.length)}
              </div>
              <p className="text-xs zyphex-subheading mt-1">Days per template</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4 scroll-reveal">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates by name, description, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {cat === "all" ? "All Categories" : cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={methodologyFilter} onValueChange={setMethodologyFilter}>
              <SelectTrigger className="w-[180px]">
                <Layers className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Methodology" />
              </SelectTrigger>
              <SelectContent>
                {methodologies.map(method => (
                  <SelectItem key={method} value={method}>
                    {method === "all" ? "All Methodologies" : method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>View Mode</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setViewMode("grid")}>
                  Grid View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setViewMode("list")}>
                  List View
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between scroll-reveal">
          <p className="text-sm zyphex-subheading">
            Showing {filteredTemplates.length} of {templates.length} templates
          </p>
          {(searchQuery || categoryFilter !== "all" || methodologyFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("")
                setCategoryFilter("all")
                setMethodologyFilter("all")
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>

        {/* Templates Grid/List */}
        {filteredTemplates.length === 0 ? (
          <Card className="zyphex-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium zyphex-heading mb-2">No templates found</p>
              <p className="text-sm zyphex-subheading text-center max-w-md">
                Try adjusting your search or filters, or create a new template to get started.
              </p>
            </CardContent>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template, index) => (
              <Card 
                key={template.id} 
                className="zyphex-card hover-zyphex-lift scroll-reveal-scale group"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg zyphex-heading mb-2 line-clamp-2">
                        {template.name}
                      </CardTitle>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge variant="outline" className={getMethodologyColor(template.methodology)}>
                          {template.methodology}
                        </Badge>
                        {template.isDefault && (
                          <Badge variant="secondary">Default</Badge>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setSelectedTemplate(template)
                          setIsDetailDialogOpen(true)
                        }}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUseTemplate(template)}>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Use Template
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDuplicateTemplate(template)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        {!template.isDefault && (
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleExportTemplate(template)}>
                          <Download className="mr-2 h-4 w-4" />
                          Export
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleArchiveTemplate(template)}>
                          <Archive className="mr-2 h-4 w-4" />
                          Archive
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {!template.isDefault && (
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => {
                              setSelectedTemplate(template)
                              setIsDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {template.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 zyphex-subheading">
                      <Clock className="h-4 w-4" />
                      <span>{template.estimatedDuration} days</span>
                    </div>
                    <div className="flex items-center gap-2 zyphex-subheading">
                      <TrendingUp className="h-4 w-4" />
                      <span>{template.usageCount} uses</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 zyphex-subheading">
                      <FileText className="h-4 w-4" />
                      <span>{template.taskCount} tasks</span>
                    </div>
                    <div className="flex items-center gap-2 zyphex-subheading">
                      <Target className="h-4 w-4" />
                      <span>{template.milestoneCount} milestones</span>
                    </div>
                  </div>

                  {template.budget && (
                    <div className="flex items-center gap-2 text-sm zyphex-subheading">
                      <DollarSign className="h-4 w-4" />
                      <span>${(template.budget.min / 1000).toFixed(0)}k - ${(template.budget.max / 1000).toFixed(0)}k</span>
                    </div>
                  )}

                  {template.teamSize && (
                    <div className="flex items-center gap-2 text-sm zyphex-subheading">
                      <Users className="h-4 w-4" />
                      <span>{template.teamSize.min} - {template.teamSize.max} members</span>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1">
                    {template.tags.slice(0, 3).map((tag, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {template.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{template.tags.length - 3}
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      className="flex-1 zyphex-button-primary"
                      onClick={() => handleUseTemplate(template)}
                    >
                      Use Template
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setSelectedTemplate(template)
                        setIsDetailDialogOpen(true)
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTemplates.map((template, index) => (
              <Card 
                key={template.id} 
                className="zyphex-card hover-zyphex-lift scroll-reveal"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold zyphex-heading mb-2">
                            {template.name}
                          </h3>
                          <p className="text-sm zyphex-subheading line-clamp-2">
                            {template.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className={getMethodologyColor(template.methodology)}>
                          {template.methodology}
                        </Badge>
                        <Badge variant="outline">{template.category}</Badge>
                        {template.isDefault && (
                          <Badge variant="secondary">Default</Badge>
                        )}
                        {template.tags.slice(0, 2).map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm zyphex-subheading">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {template.estimatedDuration} days
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          {template.taskCount} tasks
                        </div>
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          {template.milestoneCount} milestones
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          {template.usageCount} uses
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="zyphex-button-primary"
                        onClick={() => handleUseTemplate(template)}
                      >
                        Use Template
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedTemplate(template)
                            setIsDetailDialogOpen(true)
                          }}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicateTemplate(template)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExportTemplate(template)}>
                            <Download className="mr-2 h-4 w-4" />
                            Export
                          </DropdownMenuItem>
                          {!template.isDefault && (
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => {
                                setSelectedTemplate(template)
                                setIsDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Template Details Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            {selectedTemplate && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl">{selectedTemplate.name}</DialogTitle>
                  <DialogDescription>{selectedTemplate.description}</DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className={getMethodologyColor(selectedTemplate.methodology)}>
                      {selectedTemplate.methodology}
                    </Badge>
                    <Badge variant="outline">{selectedTemplate.category}</Badge>
                    {selectedTemplate.isDefault && (
                      <Badge variant="secondary">Default Template</Badge>
                    )}
                  </div>

                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="zyphex-card">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Duration
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold zyphex-accent-text">
                          {selectedTemplate.estimatedDuration}
                        </p>
                        <p className="text-xs zyphex-subheading">days</p>
                      </CardContent>
                    </Card>

                    <Card className="zyphex-card">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Tasks
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold zyphex-accent-text">
                          {selectedTemplate.taskCount}
                        </p>
                        <p className="text-xs zyphex-subheading">pre-configured</p>
                      </CardContent>
                    </Card>

                    <Card className="zyphex-card">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Milestones
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold zyphex-accent-text">
                          {selectedTemplate.milestoneCount}
                        </p>
                        <p className="text-xs zyphex-subheading">key milestones</p>
                      </CardContent>
                    </Card>

                    <Card className="zyphex-card">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Usage
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold zyphex-accent-text">
                          {selectedTemplate.usageCount}
                        </p>
                        <p className="text-xs zyphex-subheading">times used</p>
                      </CardContent>
                    </Card>
                  </div>

                  {selectedTemplate.budget && (
                    <div>
                      <h4 className="font-semibold zyphex-heading mb-2 flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Budget Range
                      </h4>
                      <p className="text-sm zyphex-subheading">
                        ${selectedTemplate.budget.min.toLocaleString()} - ${selectedTemplate.budget.max.toLocaleString()}
                      </p>
                    </div>
                  )}

                  {selectedTemplate.teamSize && (
                    <div>
                      <h4 className="font-semibold zyphex-heading mb-2 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Team Size
                      </h4>
                      <p className="text-sm zyphex-subheading">
                        {selectedTemplate.teamSize.min} - {selectedTemplate.teamSize.max} team members
                      </p>
                    </div>
                  )}

                  <div>
                    <h4 className="font-semibold zyphex-heading mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedTemplate.tags.map((tag, idx) => (
                        <Badge key={idx} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  </div>

                  {selectedTemplate.tasks && selectedTemplate.tasks.length > 0 && (
                    <div>
                      <h4 className="font-semibold zyphex-heading mb-3">Sample Tasks</h4>
                      <div className="space-y-2">
                        {selectedTemplate.tasks.slice(0, 5).map((task, idx) => (
                          <Card key={idx} className="zyphex-card">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h5 className="font-medium zyphex-heading mb-1">{task.title}</h5>
                                  <p className="text-sm zyphex-subheading mb-2">{task.description}</p>
                                  <div className="flex items-center gap-4 text-xs zyphex-subheading">
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {task.estimatedHours}h
                                    </span>
                                    <span className="flex items-center gap-1">
                                      Skills: {task.skillsRequired.join(", ")}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedTemplate.milestones && selectedTemplate.milestones.length > 0 && (
                    <div>
                      <h4 className="font-semibold zyphex-heading mb-3">Milestones</h4>
                      <div className="space-y-2">
                        {selectedTemplate.milestones.map((milestone, idx) => (
                          <Card key={idx} className="zyphex-card">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h5 className="font-medium zyphex-heading mb-1">{milestone.title}</h5>
                                  <p className="text-sm zyphex-subheading mb-2">{milestone.description}</p>
                                  <p className="text-xs zyphex-subheading flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Day {milestone.daysFromStart} from project start
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                    Close
                  </Button>
                  <Button 
                    className="zyphex-button-primary"
                    onClick={() => {
                      handleUseTemplate(selectedTemplate)
                      setIsDetailDialogOpen(false)
                    }}
                  >
                    Use This Template
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Template?</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete &quot;{selectedTemplate?.name}&quot;? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteTemplate}>
                Delete Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}