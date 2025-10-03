"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { Permission } from "@/lib/auth/permissions"
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Calendar,
  Tag,
  DollarSign,
  TrendingUp,
  Eye,
  Edit,
  Trash2
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"

interface Expense {
  id: string
  amount: number
  category: string
  description: string
  date: string
  createdAt: string
  project?: {
    id: string
    name: string
  }
  receipt?: string
  tags: string[]
}

interface ExpensesData {
  expenses: Expense[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  summary: {
    totalExpenses: number
    monthlyAverage: number
    topCategory: string
    projectExpenses: number
  }
}

export default function ProjectManagerExpensesPage() {
  const [expensesData, setExpensesData] = useState<ExpensesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [currentPage, _setCurrentPage] = useState(1)

  useEffect(() => {
    const loadExpenses = async () => {
      try {
        setLoading(true)
        // Mock expenses data
        const mockExpenses: ExpensesData = {
          expenses: [
            {
              id: "exp-001",
              amount: 1200.00,
              category: "OFFICE_SUPPLIES",
              description: "Office furniture and equipment",
              date: "2024-01-15",
              createdAt: "2024-01-15",
              project: {
                id: "proj-001",
                name: "E-commerce Platform"
              },
              tags: ["furniture", "equipment"]
            },
            {
              id: "exp-002",
              amount: 850.00,
              category: "MARKETING",
              description: "Digital marketing campaign",
              date: "2024-01-12",
              createdAt: "2024-01-12",
              tags: ["advertising", "digital"]
            },
            {
              id: "exp-003",
              amount: 2400.00,
              category: "TRAVEL",
              description: "Client meeting travel expenses",
              date: "2024-01-18",
              createdAt: "2024-01-18",
              project: {
                id: "proj-002",
                name: "Mobile App Development"
              },
              tags: ["travel", "client"]
            },
            {
              id: "exp-004",
              amount: 450.00,
              category: "SOFTWARE_LICENSES",
              description: "Development tools subscription",
              date: "2024-01-10",
              createdAt: "2024-01-10",
              tags: ["software", "subscription"]
            },
            {
              id: "exp-005",
              amount: 320.00,
              category: "UTILITIES",
              description: "Office utilities - January",
              date: "2024-01-05",
              createdAt: "2024-01-05",
              tags: ["utilities", "office"]
            }
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 5,
            pages: 1
          },
          summary: {
            totalExpenses: 5220.00,
            monthlyAverage: 1044.00,
            topCategory: "TRAVEL",
            projectExpenses: 3600.00
          }
        }
        
        setExpensesData(mockExpenses)
        setError(null)
      } catch (err) {
        setError('Failed to load expenses')
        console.error('Expenses fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    loadExpenses()
  }, [currentPage, categoryFilter, searchTerm])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'OFFICE_SUPPLIES':
        return 'text-blue-600 bg-blue-100'
      case 'MARKETING':
        return 'text-purple-600 bg-purple-100'
      case 'TRAVEL':
        return 'text-green-600 bg-green-100'
      case 'SOFTWARE_LICENSES':
        return 'text-orange-600 bg-orange-100'
      case 'UTILITIES':
        return 'text-gray-600 bg-gray-100'
      case 'PROFESSIONAL_SERVICES':
        return 'text-indigo-600 bg-indigo-100'
      default:
        return 'text-slate-600 bg-slate-100'
    }
  }

  const formatCategoryName = (category: string) => {
    return category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  const filteredExpenses = expensesData?.expenses.filter(expense =>
    expense?.description?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
    expense?.category?.toLowerCase()?.includes(searchTerm.toLowerCase())
  ) || []

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <PermissionGuard permission={Permission.VIEW_FINANCIALS}>
          <div className="container mx-auto px-6 py-8">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <Receipt className="w-8 h-8 animate-pulse mx-auto mb-4 text-blue-400" />
                <p className="text-slate-300">Loading expenses...</p>
              </div>
            </div>
          </div>
        </PermissionGuard>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <PermissionGuard permission={Permission.VIEW_FINANCIALS}>
          <div className="container mx-auto px-6 py-8">
            <Alert className="border-red-600 bg-red-900/20">
              <AlertDescription className="text-red-300">{error}</AlertDescription>
            </Alert>
          </div>
        </PermissionGuard>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <PermissionGuard permission={Permission.VIEW_FINANCIALS}>
        <div className="container mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Expense Management</h1>
              <p className="text-slate-400">Track and manage business expenses</p>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Total Expenses</p>
                    <p className="text-2xl font-bold text-white">
                      {formatCurrency(expensesData?.summary.totalExpenses || 0)}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-red-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Monthly Average</p>
                    <p className="text-2xl font-bold text-white">
                      {formatCurrency(expensesData?.summary.monthlyAverage || 0)}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Top Category</p>
                    <p className="text-2xl font-bold text-white">
                      {formatCategoryName(expensesData?.summary.topCategory || '')}
                    </p>
                  </div>
                  <Tag className="w-8 h-8 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Project Expenses</p>
                    <p className="text-2xl font-bold text-white">
                      {formatCurrency(expensesData?.summary.projectExpenses || 0)}
                    </p>
                  </div>
                  <Receipt className="w-8 h-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card className="bg-slate-800/50 border-slate-700 mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search expenses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  <option value="OFFICE_SUPPLIES">Office Supplies</option>
                  <option value="MARKETING">Marketing</option>
                  <option value="TRAVEL">Travel</option>
                  <option value="SOFTWARE_LICENSES">Software Licenses</option>
                  <option value="UTILITIES">Utilities</option>
                  <option value="PROFESSIONAL_SERVICES">Professional Services</option>
                </select>

                <Button variant="outline" className="border-slate-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  Date Range
                </Button>

                <Button variant="outline" className="border-slate-600">
                  <Filter className="w-4 h-4 mr-2" />
                  More Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Expenses List */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Recent Expenses</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-4 p-6">
                {filteredExpenses.length === 0 ? (
                  <div className="text-center py-12">
                    <Receipt className="w-12 h-12 mx-auto mb-4 text-slate-500" />
                    <h3 className="text-lg font-medium text-slate-300 mb-2">No expenses found</h3>
                    <p className="text-slate-500">No expenses match your current filters.</p>
                  </div>
                ) : (
                  filteredExpenses.map((expense) => (
                    <div key={expense.id} className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-lg font-semibold text-white">
                              {formatCurrency(expense.amount)}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(expense.category)}`}>
                              {formatCategoryName(expense.category)}
                            </span>
                            {expense.project && (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-600">
                                {expense.project.name}
                              </span>
                            )}
                          </div>
                          <p className="text-slate-300 mb-2">{expense.description}</p>
                          <div className="flex items-center gap-4 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {expense?.date ? new Date(expense.date).toLocaleDateString() : 'N/A'}
                            </span>
                            {expense.tags.length > 0 && (
                              <div className="flex items-center gap-1">
                                <Tag className="w-3 h-3" />
                                {expense.tags.slice(0, 2).map((tag, index) => (
                                  <span key={index} className="bg-slate-600 px-2 py-1 rounded text-xs">
                                    {tag}
                                  </span>
                                ))}
                                {expense.tags.length > 2 && (
                                  <span className="text-xs text-slate-400">+{expense.tags.length - 2}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/project-manager/financial/expenses/${expense.id}`}>
                              <Eye className="w-4 h-4" />
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-400 hover:text-red-300">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </PermissionGuard>
    </div>
  )
}