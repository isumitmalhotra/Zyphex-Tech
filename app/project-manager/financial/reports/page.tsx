"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { Permission } from "@/lib/auth/permissions"
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Download,
  Calendar,
  Users,
  PieChart,
  Activity
} from "lucide-react"
import { useState, useEffect } from "react"

interface ReportData {
  monthlyRevenue: Array<{
    month: string
    revenue: number
    expenses: number
    profit: number
  }>
  yearlyComparison: {
    currentYear: number
    previousYear: number
    growth: number
  }
  clientAnalysis: Array<{
    clientName: string
    totalRevenue: number
    invoiceCount: number
    averageValue: number
  }>
  profitabilityMetrics: {
    grossProfit: number
    netProfit: number
    profitMargin: number
    operatingMargin: number
  }
}

export default function ProjectManagerReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState('12months')
  const [reportType, setReportType] = useState('revenue')

  useEffect(() => {
    const loadReportData = async () => {
      try {
        setLoading(true)
        // Mock report data
        const mockReportData: ReportData = {
          monthlyRevenue: [
            { month: "Jan 2024", revenue: 45600, expenses: 12300, profit: 33300 },
            { month: "Feb 2024", revenue: 52100, expenses: 14200, profit: 37900 },
            { month: "Mar 2024", revenue: 48900, expenses: 13100, profit: 35800 },
            { month: "Apr 2024", revenue: 54200, expenses: 15400, profit: 38800 },
            { month: "May 2024", revenue: 49800, expenses: 12900, profit: 36900 },
            { month: "Jun 2024", revenue: 58300, expenses: 16100, profit: 42200 },
            { month: "Jul 2024", revenue: 51700, expenses: 14800, profit: 36900 },
            { month: "Aug 2024", revenue: 55900, expenses: 15600, profit: 40300 },
            { month: "Sep 2024", revenue: 52800, expenses: 14300, profit: 38500 },
            { month: "Oct 2024", revenue: 59200, expenses: 16800, profit: 42400 }
          ],
          yearlyComparison: {
            currentYear: 528600,
            previousYear: 487300,
            growth: 8.5
          },
          clientAnalysis: [
            { clientName: "TechCorp Solutions", totalRevenue: 125400, invoiceCount: 8, averageValue: 15675 },
            { clientName: "StartupXYZ", totalRevenue: 98600, invoiceCount: 12, averageValue: 8217 },
            { clientName: "Enterprise Ltd", totalRevenue: 87900, invoiceCount: 6, averageValue: 14650 },
            { clientName: "Global Industries", totalRevenue: 76300, invoiceCount: 9, averageValue: 8478 },
            { clientName: "DataTech Solutions", totalRevenue: 65200, invoiceCount: 7, averageValue: 9314 }
          ],
          profitabilityMetrics: {
            grossProfit: 387450,
            netProfit: 285750,
            profitMargin: 54.1,
            operatingMargin: 48.2
          }
        }
        
        setReportData(mockReportData)
        setError(null)
      } catch (err) {
        setError('Failed to load report data')
        console.error('Reports fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    loadReportData()
  }, [selectedPeriod, reportType])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <PermissionGuard permission={Permission.VIEW_FINANCIALS}>
          <div className="container mx-auto px-6 py-8">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <Activity className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-400" />
                <p className="text-slate-300">Loading financial reports...</p>
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
              <h1 className="text-3xl font-bold text-white mb-2">Financial Reports</h1>
              <p className="text-slate-400">Comprehensive financial analysis and insights</p>
            </div>
            <div className="flex gap-3">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="3months">Last 3 Months</option>
                <option value="6months">Last 6 Months</option>
                <option value="12months">Last 12 Months</option>
                <option value="ytd">Year to Date</option>
              </select>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>

          {/* Report Type Tabs */}
          <div className="flex gap-2 mb-8">
            {[
              { id: 'revenue', label: 'Revenue Analysis', icon: DollarSign },
              { id: 'profitability', label: 'Profitability', icon: TrendingUp },
              { id: 'clients', label: 'Client Analysis', icon: Users },
              { id: 'trends', label: 'Trends', icon: BarChart3 }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setReportType(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  reportType === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Total Revenue</p>
                    <p className="text-2xl font-bold text-white">
                      {formatCurrency(reportData?.yearlyComparison.currentYear || 0)}
                    </p>
                    <p className={`text-sm ${reportData?.yearlyComparison.growth && reportData.yearlyComparison.growth > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatPercentage(reportData?.yearlyComparison.growth || 0)} vs last year
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Net Profit</p>
                    <p className="text-2xl font-bold text-white">
                      {formatCurrency(reportData?.profitabilityMetrics.netProfit || 0)}
                    </p>
                    <p className="text-sm text-green-400">
                      {reportData?.profitabilityMetrics.profitMargin.toFixed(1)}% margin
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
                    <p className="text-slate-400 text-sm">Active Clients</p>
                    <p className="text-2xl font-bold text-white">
                      {reportData?.clientAnalysis.length || 0}
                    </p>
                    <p className="text-sm text-slate-400">
                      Avg: {formatCurrency(
                        (reportData?.clientAnalysis.reduce((sum, client) => sum + client.averageValue, 0) || 0) / 
                        (reportData?.clientAnalysis.length || 1)
                      )}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Avg Monthly</p>
                    <p className="text-2xl font-bold text-white">
                      {formatCurrency(
                        (reportData?.monthlyRevenue.reduce((sum, month) => sum + month.revenue, 0) || 0) / 
                        (reportData?.monthlyRevenue.length || 1)
                      )}
                    </p>
                    <p className="text-sm text-blue-400">per month</p>
                  </div>
                  <Calendar className="w-8 h-8 text-yellow-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Report Content Based on Selected Type */}
          {reportType === 'revenue' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Revenue Chart Placeholder */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Monthly Revenue Trend
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {reportData?.monthlyRevenue.slice(-6).map((month, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-slate-300">{month.month}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-white font-medium">{formatCurrency(month.revenue)}</span>
                          <div className="w-24 bg-slate-700 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ 
                                width: `${(month.revenue / Math.max(...(reportData?.monthlyRevenue.map(m => m.revenue) || [1]))) * 100}%` 
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Revenue vs Expenses */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <PieChart className="w-5 h-5" />
                    Revenue vs Expenses
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {reportData?.monthlyRevenue.slice(-6).map((month, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-300 text-sm">{month.month}</span>
                          <span className="text-white font-medium">{formatCurrency(month.profit)}</span>
                        </div>
                        <div className="flex gap-1">
                          <div 
                            className="bg-green-500 h-2 rounded-l"
                            style={{ 
                              width: `${(month.revenue / (month.revenue + month.expenses)) * 100}%` 
                            }}
                          />
                          <div 
                            className="bg-red-500 h-2 rounded-r"
                            style={{ 
                              width: `${(month.expenses / (month.revenue + month.expenses)) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-6 mt-6 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full" />
                      <span className="text-slate-300">Revenue</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full" />
                      <span className="text-slate-300">Expenses</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {reportType === 'clients' && (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Top Clients by Revenue
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {reportData?.clientAnalysis.map((client, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                      <div>
                        <h3 className="text-white font-medium">{client.clientName}</h3>
                        <p className="text-slate-400 text-sm">
                          {client.invoiceCount} invoices • Avg: {formatCurrency(client.averageValue)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold">{formatCurrency(client.totalRevenue)}</p>
                        <p className="text-slate-400 text-sm">
                          {((client.totalRevenue / (reportData?.yearlyComparison.currentYear || 1)) * 100).toFixed(1)}% of total
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {reportType === 'profitability' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Profitability Metrics</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-300">Gross Profit</span>
                        <span className="text-white font-bold">
                          {formatCurrency(reportData?.profitabilityMetrics.grossProfit || 0)}
                        </span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '75%' }} />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-300">Net Profit</span>
                        <span className="text-white font-bold">
                          {formatCurrency(reportData?.profitabilityMetrics.netProfit || 0)}
                        </span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '60%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-300">Profit Margin</span>
                        <span className="text-white font-bold">
                          {reportData?.profitabilityMetrics.profitMargin.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div className="bg-purple-500 h-2 rounded-full" style={{ width: '54%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-300">Operating Margin</span>
                        <span className="text-white font-bold">
                          {reportData?.profitabilityMetrics.operatingMargin.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '48%' }} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Monthly Profit Trend</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {reportData?.monthlyRevenue.slice(-6).map((month, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-slate-300">{month.month}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-white font-medium">{formatCurrency(month.profit)}</span>
                          <div className="flex items-center">
                            {month.profit > (reportData?.monthlyRevenue[index - 1]?.profit || 0) ? (
                              <TrendingUp className="w-4 h-4 text-green-400" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-red-400" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {reportType === 'trends' && (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Financial Trends Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <Alert className="border-blue-600 bg-blue-900/20 mb-6">
                  <AlertDescription className="text-blue-300">
                    📈 Your revenue shows a consistent upward trend with {formatPercentage(reportData?.yearlyComparison.growth || 0)} growth compared to last year.
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-slate-700/30 border-slate-600">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">Growth Indicators</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3 text-slate-300">
                        <li className="flex items-center gap-3">
                          <TrendingUp className="w-4 h-4 text-green-400" />
                          Revenue growth: {formatPercentage(reportData?.yearlyComparison.growth || 0)}
                        </li>
                        <li className="flex items-center gap-3">
                          <TrendingUp className="w-4 h-4 text-blue-400" />
                          Profit margin: {reportData?.profitabilityMetrics.profitMargin.toFixed(1)}%
                        </li>
                        <li className="flex items-center gap-3">
                          <Users className="w-4 h-4 text-purple-400" />
                          Active clients: {reportData?.clientAnalysis.length}
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-700/30 border-slate-600">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">Key Insights</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3 text-slate-300">
                        <li>• Highest revenue month: {reportData?.monthlyRevenue.reduce((max, month) => month.revenue > max.revenue ? month : max, reportData.monthlyRevenue[0])?.month}</li>
                        <li>• Top client: {reportData?.clientAnalysis[0]?.clientName}</li>
                        <li>• Average invoice value: {formatCurrency(
                          (reportData?.clientAnalysis.reduce((sum, client) => sum + client.averageValue, 0) || 0) / 
                          (reportData?.clientAnalysis.length || 1)
                        )}</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </PermissionGuard>
    </div>
  )
}