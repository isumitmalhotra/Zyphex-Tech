"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Plus,
  Edit2,
  Trash2,
  Download,
  Search,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Target,
  Briefcase,
} from "lucide-react"
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart as RePieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  Legend,
  Tooltip
} from "recharts"

// Types
interface BudgetEntry {
  id: string
  projectId: string
  projectName: string
  category: string
  description: string
  plannedAmount: number
  actualAmount: number
  date: string
  status: "under" | "on-track" | "over" | "critical"
  createdAt: string
  updatedAt: string
}

interface Project {
  id: string
  name: string
  totalBudget: number
  spent: number
  remaining: number
  status: "green" | "yellow" | "red"
}

const BUDGET_CATEGORIES = [
  "Labor",
  "Materials",
  "Software",
  "Hardware",
  "Overhead",
  "Marketing",
  "Training",
  "Travel",
  "Consulting",
  "Other"
]

const PIE_COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4", "#6366f1", "#84cc16"]

export default function BudgetTrackingPage() {
  const [loading, setLoading] = useState(true)
  const [budgetEntries, setBudgetEntries] = useState<BudgetEntry[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string>("all")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [dateRange, setDateRange] = useState("month")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<BudgetEntry | null>(null)
  const [formData, setFormData] = useState({
    projectId: "",
    category: "",
    description: "",
    plannedAmount: "",
    actualAmount: "",
    date: new Date().toISOString().split('T')[0],
  })

  // Mock data - Replace with API calls
  useEffect(() => {
    const loadData = async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockProjects: Project[] = [
        {
          id: "1",
          name: "E-Commerce Platform",
          totalBudget: 150000,
          spent: 95000,
          remaining: 55000,
          status: "yellow",
        },
        {
          id: "2",
          name: "Mobile App Development",
          totalBudget: 80000,
          spent: 45000,
          remaining: 35000,
          status: "green",
        },
        {
          id: "3",
          name: "CRM System Integration",
          totalBudget: 120000,
          spent: 115000,
          remaining: 5000,
          status: "red",
        },
      ]

      const mockEntries: BudgetEntry[] = [
        {
          id: "1",
          projectId: "1",
          projectName: "E-Commerce Platform",
          category: "Labor",
          description: "Frontend Development",
          plannedAmount: 50000,
          actualAmount: 48000,
          date: "2024-10-15",
          status: "on-track",
          createdAt: "2024-10-01",
          updatedAt: "2024-10-15",
        },
        {
          id: "2",
          projectId: "1",
          projectName: "E-Commerce Platform",
          category: "Software",
          description: "Cloud Services",
          plannedAmount: 15000,
          actualAmount: 18000,
          date: "2024-10-20",
          status: "over",
          createdAt: "2024-10-01",
          updatedAt: "2024-10-20",
        },
        {
          id: "3",
          projectId: "2",
          projectName: "Mobile App Development",
          category: "Labor",
          description: "Mobile Development",
          plannedAmount: 40000,
          actualAmount: 35000,
          date: "2024-10-18",
          status: "under",
          createdAt: "2024-10-01",
          updatedAt: "2024-10-18",
        },
        {
          id: "4",
          projectId: "3",
          projectName: "CRM System Integration",
          category: "Software",
          description: "CRM Licenses",
          plannedAmount: 30000,
          actualAmount: 35000,
          date: "2024-10-22",
          status: "critical",
          createdAt: "2024-10-01",
          updatedAt: "2024-10-22",
        },
      ]

      setProjects(mockProjects)
      setBudgetEntries(mockEntries)
      setLoading(false)
    }

    loadData()
  }, [])

  // Calculations
  const totalBudget = projects.reduce((sum, p) => sum + p.totalBudget, 0)
  const totalSpent = projects.reduce((sum, p) => sum + p.spent, 0)
  const totalRemaining = totalBudget - totalSpent
  const utilizationPercentage = (totalSpent / totalBudget) * 100

  // Filter budget entries
  const filteredEntries = budgetEntries.filter(entry => {
    const matchesProject = selectedProject === "all" || entry.projectId === selectedProject
    const matchesCategory = selectedCategory === "all" || entry.category === selectedCategory
    const matchesSearch = entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          entry.projectName.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesProject && matchesCategory && matchesSearch
  })

  // Chart data
  const budgetVsActualData = projects.map(p => ({
    name: p.name,
    planned: p.totalBudget,
    actual: p.spent,
  }))

  const categoryBreakdown = BUDGET_CATEGORIES.map(cat => {
    const total = budgetEntries
      .filter(e => e.category === cat)
      .reduce((sum, e) => sum + e.actualAmount, 0)
    return { name: cat, value: total }
  }).filter(item => item.value > 0)

  const monthlyTrend = [
    { month: "Jun", planned: 45000, actual: 42000 },
    { month: "Jul", planned: 52000, actual: 55000 },
    { month: "Aug", planned: 48000, actual: 46000 },
    { month: "Sep", planned: 58000, actual: 62000 },
    { month: "Oct", planned: 65000, actual: 60000 },
    { month: "Nov", planned: 55000, actual: 0 },
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "under": return <Badge className="bg-green-500">Under Budget</Badge>
      case "on-track": return <Badge className="bg-blue-500">On Track</Badge>
      case "over": return <Badge className="bg-yellow-500">Over Budget</Badge>
      case "critical": return <Badge className="bg-red-500">Critical</Badge>
      default: return <Badge>Unknown</Badge>
    }
  }

  const handleAddEntry = () => {
    const newEntry: BudgetEntry = {
      id: Date.now().toString(),
      projectId: formData.projectId,
      projectName: projects.find(p => p.id === formData.projectId)?.name || "",
      category: formData.category,
      description: formData.description,
      plannedAmount: parseFloat(formData.plannedAmount),
      actualAmount: parseFloat(formData.actualAmount),
      date: formData.date,
      status: "on-track",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setBudgetEntries([...budgetEntries, newEntry])
    setShowAddDialog(false)
    resetForm()
  }

  const handleEditEntry = () => {
    if (!selectedEntry) return
    
    const updatedEntries = budgetEntries.map(entry => 
      entry.id === selectedEntry.id 
        ? {
            ...entry,
            projectId: formData.projectId,
            projectName: projects.find(p => p.id === formData.projectId)?.name || "",
            category: formData.category,
            description: formData.description,
            plannedAmount: parseFloat(formData.plannedAmount),
            actualAmount: parseFloat(formData.actualAmount),
            date: formData.date,
            updatedAt: new Date().toISOString(),
          }
        : entry
    )
    setBudgetEntries(updatedEntries)
    setShowEditDialog(false)
    setSelectedEntry(null)
    resetForm()
  }

  const handleDeleteEntry = () => {
    if (!selectedEntry) return
    setBudgetEntries(budgetEntries.filter(e => e.id !== selectedEntry.id))
    setShowDeleteDialog(false)
    setSelectedEntry(null)
  }

  const openEditDialog = (entry: BudgetEntry) => {
    setSelectedEntry(entry)
    setFormData({
      projectId: entry.projectId,
      category: entry.category,
      description: entry.description,
      plannedAmount: entry.plannedAmount.toString(),
      actualAmount: entry.actualAmount.toString(),
      date: entry.date,
    })
    setShowEditDialog(true)
  }

  const openDeleteDialog = (entry: BudgetEntry) => {
    setSelectedEntry(entry)
    setShowDeleteDialog(true)
  }

  const resetForm = () => {
    setFormData({
      projectId: "",
      category: "",
      description: "",
      plannedAmount: "",
      actualAmount: "",
      date: new Date().toISOString().split('T')[0],
    })
  }

  const exportToCSV = () => {
    const headers = ["Project", "Category", "Description", "Planned", "Actual", "Variance", "Date", "Status"]
    const rows = filteredEntries.map(entry => [
      entry.projectName,
      entry.category,
      entry.description,
      entry.plannedAmount,
      entry.actualAmount,
      entry.actualAmount - entry.plannedAmount,
      entry.date,
      entry.status,
    ])
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n")
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `budget-report-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-400">Loading budget data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
      <div className="flex flex-1 flex-col gap-6 p-4 relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold zyphex-heading">Budget Tracking</h1>
            <p className="zyphex-subheading mt-1">Monitor project budgets and expenses in real-time</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportToCSV} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4" />
                  Add Budget Entry
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] zyphex-glass-effect border-gray-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Add Budget Entry</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Create a new budget entry for tracking
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="project" className="text-gray-300">Project</Label>
                    <Select value={formData.projectId} onValueChange={(value) => setFormData({...formData, projectId: value})}>
                      <SelectTrigger className="zyphex-glass-effect border-gray-700">
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                      <SelectContent className="zyphex-glass-effect border-gray-700">
                        {projects.map(project => (
                          <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="category" className="text-gray-300">Category</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                      <SelectTrigger className="zyphex-glass-effect border-gray-700">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="zyphex-glass-effect border-gray-700">
                        {BUDGET_CATEGORIES.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description" className="text-gray-300">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="zyphex-glass-effect border-gray-700 text-gray-200"
                      placeholder="Enter description"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="planned" className="text-gray-300">Planned Amount</Label>
                      <Input
                        id="planned"
                        type="number"
                        value={formData.plannedAmount}
                        onChange={(e) => setFormData({...formData, plannedAmount: e.target.value})}
                        className="zyphex-glass-effect border-gray-700 text-gray-200"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="actual" className="text-gray-300">Actual Amount</Label>
                      <Input
                        id="actual"
                        type="number"
                        value={formData.actualAmount}
                        onChange={(e) => setFormData({...formData, actualAmount: e.target.value})}
                        className="zyphex-glass-effect border-gray-700 text-gray-200"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="date" className="text-gray-300">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      className="zyphex-glass-effect border-gray-700 text-gray-200"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                  <Button onClick={handleAddEntry} className="bg-blue-600 hover:bg-blue-700">Add Entry</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="zyphex-glass-effect border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Total Budget</CardTitle>
              <Target className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{formatCurrency(totalBudget)}</div>
              <p className="text-xs text-gray-400 mt-1">Across all projects</p>
            </CardContent>
          </Card>

          <Card className="zyphex-glass-effect border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Total Spent</CardTitle>
              <DollarSign className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{formatCurrency(totalSpent)}</div>
              <p className="text-xs text-gray-400 mt-1">
                {utilizationPercentage.toFixed(1)}% utilized
              </p>
            </CardContent>
          </Card>

          <Card className="zyphex-glass-effect border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Remaining</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{formatCurrency(totalRemaining)}</div>
              <Progress value={100 - utilizationPercentage} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="zyphex-glass-effect border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Projects</CardTitle>
              <Briefcase className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{projects.length}</div>
              <div className="flex gap-2 mt-2">
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  {projects.filter(p => p.status === "green").length} On Track
                </Badge>
                <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                  {projects.filter(p => p.status === "red").length} Over
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="zyphex-glass-effect border-gray-700">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="entries">Budget Entries</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Budget vs Actual Chart */}
              <Card className="zyphex-glass-effect border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Budget vs Actual</CardTitle>
                  <CardDescription className="text-gray-400">
                    Comparison across projects
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={budgetVsActualData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Legend />
                      <Bar dataKey="planned" fill="#3b82f6" name="Planned" />
                      <Bar dataKey="actual" fill="#8b5cf6" name="Actual" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Category Breakdown */}
              <Card className="zyphex-glass-effect border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Expense by Category</CardTitle>
                  <CardDescription className="text-gray-400">
                    Distribution of spending
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RePieChart>
                      <Pie
                        data={categoryBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(props) => {
                          const data = props as unknown as { name: string; percent: number }
                          return `${data.name} ${(data.percent * 100).toFixed(0)}%`
                        }}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                    </RePieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Monthly Trend */}
              <Card className="zyphex-glass-effect border-gray-700 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-white">Monthly Spending Trend</CardTitle>
                  <CardDescription className="text-gray-400">
                    Planned vs Actual over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                        labelStyle={{ color: '#fff' }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="planned" stroke="#3b82f6" strokeWidth={2} name="Planned" />
                      <Line type="monotone" dataKey="actual" stroke="#8b5cf6" strokeWidth={2} name="Actual" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-4">
            <div className="grid gap-4">
              {projects.map(project => {
                const utilization = (project.spent / project.totalBudget) * 100
                const variance = project.spent - project.totalBudget
                
                return (
                  <Card key={project.id} className="zyphex-glass-effect border-gray-700">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-white">{project.name}</CardTitle>
                          <CardDescription className="text-gray-400 mt-1">
                            Budget Utilization: {utilization.toFixed(1)}%
                          </CardDescription>
                        </div>
                        <Badge className={
                          project.status === "green" ? "bg-green-500" :
                          project.status === "yellow" ? "bg-yellow-500" :
                          "bg-red-500"
                        }>
                          {project.status === "green" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                          {project.status === "yellow" && <AlertCircle className="h-3 w-3 mr-1" />}
                          {project.status === "red" && <XCircle className="h-3 w-3 mr-1" />}
                          {project.status === "green" ? "Healthy" : project.status === "yellow" ? "Warning" : "Critical"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-400">Total Budget</p>
                            <p className="text-xl font-bold text-white">{formatCurrency(project.totalBudget)}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Spent</p>
                            <p className="text-xl font-bold text-yellow-400">{formatCurrency(project.spent)}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Remaining</p>
                            <p className={`text-xl font-bold ${project.remaining > 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {formatCurrency(project.remaining)}
                            </p>
                          </div>
                        </div>
                        <Progress value={utilization} className="h-2" />
                        {variance > 0 && (
                          <div className="flex items-center gap-2 text-sm text-red-400">
                            <AlertTriangle className="h-4 w-4" />
                            Over budget by {formatCurrency(Math.abs(variance))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          {/* Budget Entries Tab */}
          <TabsContent value="entries" className="space-y-4">
            {/* Filters */}
            <Card className="zyphex-glass-effect border-gray-700">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search entries..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 zyphex-glass-effect border-gray-700 text-gray-200"
                    />
                  </div>
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger className="zyphex-glass-effect border-gray-700">
                      <SelectValue placeholder="All Projects" />
                    </SelectTrigger>
                    <SelectContent className="zyphex-glass-effect border-gray-700">
                      <SelectItem value="all">All Projects</SelectItem>
                      {projects.map(project => (
                        <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="zyphex-glass-effect border-gray-700">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent className="zyphex-glass-effect border-gray-700">
                      <SelectItem value="all">All Categories</SelectItem>
                      {BUDGET_CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="zyphex-glass-effect border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="zyphex-glass-effect border-gray-700">
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="quarter">This Quarter</SelectItem>
                      <SelectItem value="year">This Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Entries Table */}
            <Card className="zyphex-glass-effect border-gray-700">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-gray-700">
                      <tr className="text-left text-gray-400 text-sm">
                        <th className="p-4">Project</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Description</th>
                        <th className="p-4">Planned</th>
                        <th className="p-4">Actual</th>
                        <th className="p-4">Variance</th>
                        <th className="p-4">Date</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEntries.map(entry => {
                        const variance = entry.actualAmount - entry.plannedAmount
                        const variancePercent = ((variance / entry.plannedAmount) * 100).toFixed(1)
                        
                        return (
                          <tr key={entry.id} className="border-b border-gray-700/50 hover:bg-gray-800/30 transition-colors">
                            <td className="p-4 text-white font-medium">{entry.projectName}</td>
                            <td className="p-4 text-gray-300">{entry.category}</td>
                            <td className="p-4 text-gray-300">{entry.description}</td>
                            <td className="p-4 text-gray-300">{formatCurrency(entry.plannedAmount)}</td>
                            <td className="p-4 text-gray-300">{formatCurrency(entry.actualAmount)}</td>
                            <td className={`p-4 font-medium ${variance > 0 ? 'text-red-400' : variance < 0 ? 'text-green-400' : 'text-gray-400'}`}>
                              {variance > 0 && <TrendingUp className="h-4 w-4 inline mr-1" />}
                              {variance < 0 && <TrendingDown className="h-4 w-4 inline mr-1" />}
                              {formatCurrency(Math.abs(variance))}
                              <span className="text-xs ml-1">({variancePercent}%)</span>
                            </td>
                            <td className="p-4 text-gray-300">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                {new Date(entry.date).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="p-4">{getStatusBadge(entry.status)}</td>
                            <td className="p-4">
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openEditDialog(entry)}
                                  className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openDeleteDialog(entry)}
                                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                {filteredEntries.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    No budget entries found. Add your first entry to get started.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="zyphex-glass-effect border-gray-700">
                <CardHeader>
                  <CardTitle className="text-sm text-gray-400">Average Variance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">+8.5%</div>
                  <p className="text-xs text-yellow-400 mt-1">Above planned budget</p>
                </CardContent>
              </Card>
              
              <Card className="zyphex-glass-effect border-gray-700">
                <CardHeader>
                  <CardTitle className="text-sm text-gray-400">Forecast Accuracy</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">87%</div>
                  <Progress value={87} className="mt-2" />
                </CardContent>
              </Card>
              
              <Card className="zyphex-glass-effect border-gray-700">
                <CardHeader>
                  <CardTitle className="text-sm text-gray-400">Cost Savings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-400">{formatCurrency(12500)}</div>
                  <p className="text-xs text-gray-400 mt-1">From optimizations</p>
                </CardContent>
              </Card>
            </div>

            <Card className="zyphex-glass-effect border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Budget Health Indicators</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-400" />
                      <div>
                        <p className="font-medium text-white">Projects On Track</p>
                        <p className="text-sm text-gray-400">1 project within budget</p>
                      </div>
                    </div>
                    <Badge className="bg-green-500">67%</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 text-yellow-400" />
                      <div>
                        <p className="font-medium text-white">Projects at Risk</p>
                        <p className="text-sm text-gray-400">1 project approaching limit</p>
                      </div>
                    </div>
                    <Badge className="bg-yellow-500">33%</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <XCircle className="h-5 w-5 text-red-400" />
                      <div>
                        <p className="font-medium text-white">Projects Over Budget</p>
                        <p className="text-sm text-gray-400">1 project exceeded budget</p>
                      </div>
                    </div>
                    <Badge className="bg-red-500">33%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px] zyphex-glass-effect border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Budget Entry</DialogTitle>
            <DialogDescription className="text-gray-400">
              Update the budget entry details
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-project" className="text-gray-300">Project</Label>
              <Select value={formData.projectId} onValueChange={(value) => setFormData({...formData, projectId: value})}>
                <SelectTrigger className="zyphex-glass-effect border-gray-700">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent className="zyphex-glass-effect border-gray-700">
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-category" className="text-gray-300">Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                <SelectTrigger className="zyphex-glass-effect border-gray-700">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="zyphex-glass-effect border-gray-700">
                  {BUDGET_CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description" className="text-gray-300">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="zyphex-glass-effect border-gray-700 text-gray-200"
                placeholder="Enter description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-planned" className="text-gray-300">Planned Amount</Label>
                <Input
                  id="edit-planned"
                  type="number"
                  value={formData.plannedAmount}
                  onChange={(e) => setFormData({...formData, plannedAmount: e.target.value})}
                  className="zyphex-glass-effect border-gray-700 text-gray-200"
                  placeholder="0.00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-actual" className="text-gray-300">Actual Amount</Label>
                <Input
                  id="edit-actual"
                  type="number"
                  value={formData.actualAmount}
                  onChange={(e) => setFormData({...formData, actualAmount: e.target.value})}
                  className="zyphex-glass-effect border-gray-700 text-gray-200"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-date" className="text-gray-300">Date</Label>
              <Input
                id="edit-date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="zyphex-glass-effect border-gray-700 text-gray-200"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleEditEntry} className="bg-blue-600 hover:bg-blue-700">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="zyphex-glass-effect border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This action cannot be undone. This will permanently delete the budget entry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-700">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEntry} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}