"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { SubtleBackground } from "@/components/subtle-background"
import {
  CheckCircle,
  Award,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Clock,
  Users,
  Star,
  FileText,
  Download,
  Search,
  Eye,
  BarChart3,
  Target,
  Lightbulb,
  ThumbsUp,
  Briefcase,
  FolderOpen,
  Timer,
  Archive,
  Loader2,
  AlertCircle
} from "lucide-react"

export default function SuperAdminCompletedProjectsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [satisfactionFilter, setSatisfactionFilter] = useState("all")
  const [sortBy, setSortBy] = useState("completion-date")
  const [dateRange, setDateRange] = useState("all")
  
  // Data fetching states
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [completedProjects, setCompletedProjects] = useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [projectStats, setProjectStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch data from API
  useEffect(() => {
    async function fetchCompletedProjects() {
      try {
        setIsLoading(true)
        const response = await fetch('/api/super-admin/projects/completed')
        
        if (!response.ok) {
          throw new Error('Failed to fetch completed projects')
        }
        
        const data = await response.json()
        setCompletedProjects(data.projects || [])
        setProjectStats(data.stats || null)
        setError(null)
      } catch (err) {
        console.error('Error fetching completed projects:', err)
        setError('Failed to load completed projects. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCompletedProjects()
  }, [])
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
        <SubtleBackground />
        <div className="container mx-auto p-6 flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600" />
            <p className="text-lg text-slate-600">Loading completed projects...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
        <SubtleBackground />
        <div className="container mx-auto p-6">
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <CardTitle className="text-red-900">Error Loading Projects</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-red-700 mb-4">{error}</p>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Overall Statistics (now from API stats)
  const overallStats = projectStats ? [
    {
      title: "Total Completed",
      value: projectStats.totalCompleted?.toString() || "0",
      change: "+12 this quarter",
      trend: "up",
      icon: CheckCircle,
      color: "green"
    },
    {
      title: "Excellent Projects",
      value: projectStats.excellentProjects?.toString() || "0",
      change: "High satisfaction",
      trend: "up",
      icon: Star,
      color: "yellow"
    },
    {
      title: "Over Budget",
      value: projectStats.overBudget?.toString() || "0",
      change: "Budget tracking",
      trend: "neutral",
      icon: DollarSign,
      color: "purple"
    },
    {
      title: "Avg Budget Used",
      value: `${projectStats.avgBudgetPercent?.toFixed(1) || "0"}%`,
      change: "Of total budget",
      trend: projectStats.avgBudgetPercent > 100 ? "down" : "up",
      icon: Target,
      color: "blue"
    }
  ] : []

  // Get satisfaction badge
  const getSatisfactionBadge = (rating: string) => {
    switch (rating) {
      case "excellent":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "very-good":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "good":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "fair":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30"
      case "poor":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "success-with-issues":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "failed":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  // Render star rating
  const renderStars = (score: number) => {
    const fullStars = Math.floor(score)
    const hasHalfStar = score % 1 >= 0.5
    
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < fullStars
                ? "fill-yellow-400 text-yellow-400"
                : i === fullStars && hasHalfStar
                ? "fill-yellow-400/50 text-yellow-400"
                : "text-gray-600"
            }`}
          />
        ))}
      </div>
    )
  }

  // Filter and sort projects
  const filteredProjects = completedProjects
    .filter((project) => {
      const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          project.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          project.id.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesSatisfaction = satisfactionFilter === "all" || project.satisfaction.rating === satisfactionFilter
      return matchesSearch && matchesSatisfaction
    })
    .sort((a, b) => {
      if (sortBy === "completion-date") return new Date(b.completionDate).getTime() - new Date(a.completionDate).getTime()
      if (sortBy === "satisfaction") return b.satisfaction.score - a.satisfaction.score
      if (sortBy === "budget") return a.budget - b.budget
      return 0
    })

  // Export functionality
  const handleExport = (format: string) => {
    console.log(`Exporting completed projects as ${format}`)
    // TODO: Implement actual export logic
  }

  return (
    <div className="min-h-screen zyphex-gradient-bg relative">
      <SubtleBackground />
      
      <div className="relative z-10 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold zyphex-heading mb-2">Completed Projects</h1>
              <p className="text-lg zyphex-subheading">
                Archive of finished projects with performance analysis
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[180px] zyphex-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="zyphex-dropdown">
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                className="zyphex-button-secondary"
                onClick={() => handleExport("csv")}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button 
                variant="outline" 
                className="zyphex-button-secondary"
                onClick={() => handleExport("pdf")}
              >
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>

          {/* Overall Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {overallStats.map((stat: any, index: number) => (
              <Card key={index} className="zyphex-card hover-zyphex-lift transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg bg-gradient-to-br from-${stat.color}-500/20 to-${stat.color}-600/20 border border-${stat.color}-500/30`}>
                      <stat.icon className={`h-6 w-6 text-${stat.color}-400`} />
                    </div>
                    <Badge variant="outline" className={`${
                      stat.trend === "up" 
                        ? "bg-green-500/20 text-green-400 border-green-500/30" 
                        : "bg-red-500/20 text-red-400 border-red-500/30"
                    }`}>
                      {stat.trend === "up" ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                      {stat.change}
                    </Badge>
                  </div>
                  <h3 className="text-sm zyphex-subheading mb-1">{stat.title}</h3>
                  <p className="text-3xl font-bold zyphex-heading">{stat.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filters and Search */}
          <Card className="zyphex-card">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="search" className="text-sm zyphex-subheading mb-2 block">
                    Search Projects
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Search by name, client, or ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 zyphex-input"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="satisfaction" className="text-sm zyphex-subheading mb-2 block">
                    Satisfaction Rating
                  </Label>
                  <Select value={satisfactionFilter} onValueChange={setSatisfactionFilter}>
                    <SelectTrigger id="satisfaction" className="zyphex-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="zyphex-dropdown">
                      <SelectItem value="all">All Ratings</SelectItem>
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="very-good">Very Good</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="sort" className="text-sm zyphex-subheading mb-2 block">
                    Sort By
                  </Label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger id="sort" className="zyphex-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="zyphex-dropdown">
                      <SelectItem value="completion-date">Completion Date</SelectItem>
                      <SelectItem value="satisfaction">Satisfaction</SelectItem>
                      <SelectItem value="budget">Budget</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Completed Projects List */}
          <div className="space-y-6">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="zyphex-card hover-zyphex-lift transition-all duration-300">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                          {project.id}
                        </Badge>
                        <Badge variant="outline" className={getStatusBadge(project.finalStatus)}>
                          {project.finalStatus.replace("-", " ")}
                        </Badge>
                        {project.onTime && (
                          <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            On Time
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="zyphex-heading text-2xl mb-2">{project.name}</CardTitle>
                      <CardDescription className="zyphex-subheading flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        {project.client}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-2">
                        {renderStars(project.satisfaction.score)}
                        <span className="text-lg font-bold zyphex-heading">{project.satisfaction.score}</span>
                      </div>
                      <Badge variant="outline" className={getSatisfactionBadge(project.satisfaction.rating)}>
                        {project.satisfaction.rating.replace("-", " ")}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Timeline & Duration */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-green-400" />
                      <div>
                        <p className="text-xs zyphex-subheading">Start Date</p>
                        <p className="text-sm font-medium zyphex-heading">{project.startDate}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-400" />
                      <div>
                        <p className="text-xs zyphex-subheading">Completion Date</p>
                        <p className="text-sm font-medium zyphex-heading">{project.completionDate}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Timer className="h-4 w-4 text-purple-400" />
                      <div>
                        <p className="text-xs zyphex-subheading">Duration</p>
                        <p className="text-sm font-medium zyphex-heading">{project.duration}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-400" />
                      <div>
                        <p className="text-xs zyphex-subheading">Schedule Variance</p>
                        <p className={`text-sm font-medium ${
                          project.scheduleVariance > 0 ? "text-red-400" : "text-green-400"
                        }`}>
                          {project.scheduleVariance > 0 ? "+" : ""}{project.scheduleVariance.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-gray-800/50" />

                  {/* Budget Performance */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold zyphex-heading flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-yellow-400" />
                        Budget Performance
                      </h4>
                      <Badge variant="outline" className={
                        project.budgetVariance <= 0 
                          ? "bg-green-500/20 text-green-400 border-green-500/30"
                          : project.budgetVariance <= 5
                          ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                          : "bg-red-500/20 text-red-400 border-red-500/30"
                      }>
                        {project.budgetVariance > 0 ? "+" : ""}{project.budgetVariance.toFixed(2)}% variance
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="zyphex-subheading">Budget:</span>
                        <span className="ml-2 zyphex-heading font-medium">${project.budget.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="zyphex-subheading">Actual Cost:</span>
                        <span className="ml-2 zyphex-heading font-medium">${project.actualCost.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="zyphex-subheading">Difference:</span>
                        <span className={`ml-2 font-medium ${
                          project.actualCost <= project.budget ? "text-green-400" : "text-red-400"
                        }`}>
                          ${Math.abs(project.budget - project.actualCost).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Deliverables */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold zyphex-heading flex items-center gap-2">
                        <Target className="h-4 w-4 text-cyan-400" />
                        Deliverables ({project.deliverables.delivered}/{project.deliverables.total})
                      </h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                          {project.deliverables.onTime} on time
                        </Badge>
                        {project.deliverables.delayed > 0 && (
                          <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30">
                            {project.deliverables.delayed} delayed
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Progress 
                      value={(project.deliverables.delivered / project.deliverables.total) * 100} 
                      className="h-2"
                    />
                  </div>

                  {/* Project Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg bg-gray-800/30">
                    <div className="text-center">
                      <p className="text-xs zyphex-subheading mb-1">Tasks Completed</p>
                      <p className="text-lg font-bold zyphex-heading">{project.metrics.tasksCompleted}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs zyphex-subheading mb-1">Hours Logged</p>
                      <p className="text-lg font-bold zyphex-heading">{project.metrics.hoursLogged.toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs zyphex-subheading mb-1">Code Commits</p>
                      <p className="text-lg font-bold zyphex-heading">{project.metrics.codeCommits.toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs zyphex-subheading mb-1">Bugs Fixed</p>
                      <p className="text-lg font-bold zyphex-heading">{project.metrics.bugsFixed}</p>
                    </div>
                  </div>

                  {/* Team */}
                  <div>
                    <h4 className="text-sm font-semibold zyphex-heading flex items-center gap-2 mb-3">
                      <Users className="h-4 w-4 text-purple-400" />
                      Team Members ({project.team.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {project.team.map((member: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-gray-800/30">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white">
                            {member.avatar}
                          </div>
                          <div>
                            <p className="text-sm font-medium zyphex-heading">{member.name}</p>
                            <p className="text-xs text-blue-400">{member.role}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Client Satisfaction */}
                  <div className="p-4 rounded-lg border-l-4 border-green-500 bg-green-500/5">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-sm font-semibold zyphex-heading flex items-center gap-2">
                        <ThumbsUp className="h-4 w-4 text-green-400" />
                        Client Feedback
                      </h4>
                      {renderStars(project.satisfaction.score)}
                    </div>
                    <p className="text-sm zyphex-subheading italic">&quot;{project.satisfaction.feedback}&quot;</p>
                  </div>

                  {/* Lessons Learned */}
                  <div>
                    <h4 className="text-sm font-semibold zyphex-heading flex items-center gap-2 mb-3">
                      <Lightbulb className="h-4 w-4 text-yellow-400" />
                      Lessons Learned
                    </h4>
                    <ul className="space-y-2">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {project.lessonsLearned.map((lesson: any, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-sm zyphex-subheading">
                          <span className="text-blue-400 mt-0.5">•</span>
                          <span>{lesson}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Separator className="bg-gray-800/50" />

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs zyphex-subheading">
                      <Archive className="h-3 w-3" />
                      Archived on {project.completionDate}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" className="zyphex-button-secondary">
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                      <Button size="sm" variant="outline" className="zyphex-button-secondary">
                        <FileText className="h-4 w-4 mr-1" />
                        Report
                      </Button>
                      <Button size="sm" variant="outline" className="zyphex-button-secondary">
                        <BarChart3 className="h-4 w-4 mr-1" />
                        Analytics
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {filteredProjects.length === 0 && (
            <Card className="zyphex-card">
              <CardContent className="p-12 text-center">
                <FolderOpen className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold zyphex-heading mb-2">No completed projects found</h3>
                <p className="zyphex-subheading mb-6">
                  Try adjusting your search or filter criteria
                </p>
                <Button 
                  variant="outline" 
                  className="zyphex-button-secondary"
                  onClick={() => {
                    setSearchQuery("")
                    setSatisfactionFilter("all")
                  }}
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Performance Summary */}
          <Card className="zyphex-card">
            <CardHeader>
              <CardTitle className="zyphex-heading">Historical Performance Summary</CardTitle>
              <CardDescription className="zyphex-subheading">
                Key insights from completed projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="h-5 w-5 text-green-400" />
                    <h5 className="font-semibold zyphex-heading">Success Rate</h5>
                  </div>
                  <p className="text-3xl font-bold text-green-400 mb-1">89.4%</p>
                  <p className="text-xs zyphex-subheading">42 of 47 projects successful</p>
                </div>
                
                <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-blue-400" />
                    <h5 className="font-semibold zyphex-heading">Avg Duration</h5>
                  </div>
                  <p className="text-3xl font-bold text-blue-400 mb-1">8.2 months</p>
                  <p className="text-xs zyphex-subheading">Average project timeline</p>
                </div>
                
                <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-purple-400" />
                    <h5 className="font-semibold zyphex-heading">Budget Efficiency</h5>
                  </div>
                  <p className="text-3xl font-bold text-purple-400 mb-1">96.8%</p>
                  <p className="text-xs zyphex-subheading">Average budget utilization</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
