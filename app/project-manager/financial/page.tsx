"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  DollarSign,
  TrendingUp,
  FileText,
  Clock,
  CreditCard,
  AlertTriangle
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"

interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  totalInvoices: number;
  outstandingInvoices: number;
  overdueInvoices: number;
}

interface FinancialData {
  summary: FinancialSummary;
}

export default function ProjectManagerFinancialPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<FinancialData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/financial/mock?period=month')
        
        if (response.ok) {
          const result = await response.json()
          setData(result)
          setError(null)
        } else {
          setError(`Failed to load financial data (${response.status})`)
        }
      } catch (_error) {
        setError('Network error - unable to load financial data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        <div className="text-white text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading financial dashboard...</p>
        </div>
      </div>
    )
  }

  // Show error banner if there's an error but still show fallback data
  const showErrorBanner = error && !data

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0)
  }

  const summary = data?.summary || {
    totalRevenue: 285750.50,
    totalExpenses: 67890.25,
    netProfit: 217860.25,
    totalInvoices: 127,
    outstandingInvoices: 23,
    overdueInvoices: 5
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-6 py-8">
        {/* Error Banner */}
        {showErrorBanner && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
            <div className="flex items-center gap-3 text-red-400">
              <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="font-medium">{error}</p>
            </div>
          </div>
        )}
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Financial Dashboard</h1>
          <p className="text-slate-400">Overview of your financial performance and metrics {!data && '(Showing fallback data)'}</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Revenue</p>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(summary.totalRevenue)}
                  </p>
                  <p className="text-green-400 text-sm">+12.5% from last month</p>
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
                    {formatCurrency(summary.netProfit)}
                  </p>
                  <p className="text-blue-400 text-sm">
                    {((summary.netProfit / summary.totalRevenue) * 100).toFixed(1)}% margin
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
                  <p className="text-slate-400 text-sm">Total Invoices</p>
                  <p className="text-2xl font-bold text-white">{summary.totalInvoices}</p>
                  <p className="text-slate-400 text-sm">
                    {summary.outstandingInvoices} outstanding
                  </p>
                </div>
                <FileText className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
            <CardContent className="p-6">
              <div className="text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 text-blue-400" />
                <h3 className="text-white font-semibold mb-2">Invoices</h3>
                <p className="text-slate-400 text-sm mb-4">Manage all invoices</p>
                <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                  <Link href="/project-manager/financial/invoices">
                    View Invoices
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
            <CardContent className="p-6">
              <div className="text-center">
                <CreditCard className="w-12 h-12 mx-auto mb-4 text-green-400" />
                <h3 className="text-white font-semibold mb-2">Payments</h3>
                <p className="text-slate-400 text-sm mb-4">Track payments</p>
                <Button asChild className="w-full bg-green-600 hover:bg-green-700">
                  <Link href="/project-manager/financial/payments">
                    View Payments
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
            <CardContent className="p-6">
              <div className="text-center">
                <Clock className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
                <h3 className="text-white font-semibold mb-2">Expenses</h3>
                <p className="text-slate-400 text-sm mb-4">Monitor expenses</p>
                <Button asChild className="w-full bg-yellow-600 hover:bg-yellow-700">
                  <Link href="/project-manager/financial/expenses">
                    View Expenses
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
            <CardContent className="p-6">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 text-purple-400" />
                <h3 className="text-white font-semibold mb-2">Reports</h3>
                <p className="text-slate-400 text-sm mb-4">Financial analytics</p>
                <Button asChild className="w-full bg-purple-600 hover:bg-purple-700">
                  <Link href="/project-manager/financial/reports">
                    View Reports
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-white">Invoice INV-2024001 paid</span>
                  </div>
                  <span className="text-slate-400 text-sm">2 hours ago</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-white">New invoice created</span>
                  </div>
                  <span className="text-slate-400 text-sm">5 hours ago</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <span className="text-white">Payment reminder sent</span>
                  </div>
                  <span className="text-slate-400 text-sm">1 day ago</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Alerts & Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-red-900/20 border border-red-600/30 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
                  <div>
                    <p className="text-red-300 font-medium">Overdue Invoices</p>
                    <p className="text-red-400 text-sm">{summary.overdueInvoices} invoices are overdue</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-400 mt-0.5" />
                  <div>
                    <p className="text-yellow-300 font-medium">Pending Payments</p>
                    <p className="text-yellow-400 text-sm">{summary.outstandingInvoices} invoices awaiting payment</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-green-900/20 border border-green-600/30 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-400 mt-0.5" />
                  <div>
                    <p className="text-green-300 font-medium">Performance</p>
                    <p className="text-green-400 text-sm">Revenue up 12.5% this month</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}