"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Briefcase,
  DollarSign,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"

interface Project {
  id: string
  name: string
  status: string
  budget: number
  amountBilled: number
  amountPaid: number
  createdAt: string
  completedAt?: string
  billingStatus: string
}

interface Invoice {
  id: string
  projectName: string
  amount: number
  issuedDate: string
  dueDate: string
  paidDate?: string
  status: string
}

export default function UserBilling() {
  const [billingData, setBillingData] = useState<{
    projects: Project[]
    invoices: Invoice[]
    totalBilled: number
    totalPaid: number
    pendingAmount: number
    loading: boolean
  }>({
    projects: [],
    invoices: [],
    totalBilled: 0,
    totalPaid: 0,
    pendingAmount: 0,
    loading: true
  })

  useEffect(() => {
    fetchBillingData()
  }, [])

  const fetchBillingData = async () => {
    try {
      // Mock data representing project-based billing managed by admin
      const mockData = {
        projects: [
          {
            id: "1",
            name: "E-commerce Website Redesign",
            status: "COMPLETED",
            budget: 5000,
            amountBilled: 5000,
            amountPaid: 5000,
            createdAt: "2025-08-15",
            completedAt: "2025-09-10",
            billingStatus: "PAID"
          },
          {
            id: "2", 
            name: "Mobile App Development",
            status: "IN_PROGRESS",
            budget: 12000,
            amountBilled: 6000,
            amountPaid: 4000,
            createdAt: "2025-09-01",
            billingStatus: "PARTIAL"
          },
          {
            id: "3",
            name: "SEO Optimization Package", 
            status: "PENDING",
            budget: 2500,
            amountBilled: 0,
            amountPaid: 0,
            createdAt: "2025-09-20",
            billingStatus: "PENDING"
          }
        ],
        invoices: [
          {
            id: "INV-2025-001",
            projectName: "E-commerce Website Redesign",
            amount: 5000,
            issuedDate: "2025-09-10",
            dueDate: "2025-09-25",  
            paidDate: "2025-09-15",
            status: "PAID"
          },
          {
            id: "INV-2025-002",
            projectName: "Mobile App Development - Phase 1", 
            amount: 4000,
            issuedDate: "2025-09-05",
            dueDate: "2025-09-20",
            paidDate: "2025-09-12",
            status: "PAID"
          }
        ],
        totalBilled: 11000,
        totalPaid: 9000,
        pendingAmount: 2000,
        loading: false
      }
      
      setBillingData(mockData)
    } catch (error) {
      toast.error("Failed to load billing information")
    }
  }

  const getBillingStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-green-500/20 text-green-400"
      case "PENDING":
        return "bg-yellow-500/20 text-yellow-400"
      case "PARTIAL":
        return "bg-blue-500/20 text-blue-400"
      default:
        return "bg-gray-500/20 text-gray-400"
    }
  }

  if (billingData.loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold zyphex-heading">Billing & Invoices</h1>
          <p className="text-muted-foreground mt-2">
            Track your project billing and payment history
          </p>
        </div>
      </div>

      {/* Billing Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="zyphex-card">
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Billed</p>
                <p className="text-2xl font-bold">${billingData.totalBilled.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="zyphex-card">
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Paid</p>
                <p className="text-2xl font-bold">${billingData.totalPaid.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="zyphex-card">
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">${billingData.pendingAmount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="zyphex-card">
          <CardContent className="p-6">
            <div className="flex items-center">
              <Briefcase className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
                <p className="text-2xl font-bold">
                  {billingData.projects.filter(p => p.status !== "COMPLETED").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Note about project-based billing */}
      <Card className="zyphex-card mb-8">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <h4 className="font-semibold mb-2">Project-Based Billing</h4>
              <p className="text-sm text-muted-foreground">
                All billing is managed per project by our admin team. Invoices are generated based on project milestones 
                and completion. Payment terms and amounts are set by admin for each project individually.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Billing List */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold zyphex-heading">Project Billing</h2>
        
        {billingData.projects.map((project) => (
          <Card key={project.id} className="zyphex-card hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl zyphex-heading">{project.name}</CardTitle>
                  <CardDescription>
                    Created: {new Date(project.createdAt).toLocaleDateString()}
                    {project.completedAt && (
                      <>  Completed: {new Date(project.completedAt).toLocaleDateString()}</>
                    )}
                  </CardDescription>
                </div>
                <Badge className={getBillingStatusColor(project.billingStatus)}>
                  {project.billingStatus}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Project Budget</p>
                  <p className="font-semibold text-lg">${project.budget.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Amount Billed</p>
                  <p className="font-semibold text-lg">${project.amountBilled.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Amount Paid</p>
                  <p className="font-semibold text-lg text-green-600">${project.amountPaid.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Outstanding</p>
                  <p className="font-semibold text-lg text-yellow-600">
                    ${(project.amountBilled - project.amountPaid).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <Badge variant="outline">{project.status.replace("_", " ")}</Badge>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                  {project.billingStatus === "PAID" && (
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download Invoice
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
