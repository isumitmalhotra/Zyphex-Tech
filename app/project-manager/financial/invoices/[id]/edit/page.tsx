'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

interface Invoice {
  id: string
  invoiceNumber: string
  amount: number
  taxAmount: number
  total: number
  currency: string
  status: string
  billingType: string
  dueDate: string
  sentAt?: string
  paidAt?: string
  createdAt: string
  description?: string
  client: {
    id: string
    name: string
    email: string
    company?: string
  }
  project?: {
    id: string
    name: string
  }
}

export default function EditInvoicePage() {
  const params = useParams()
  const router = useRouter()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [amount, setAmount] = useState(0)
  const [taxRate, setTaxRate] = useState(10)
  const [status, setStatus] = useState('DRAFT')
  const [billingType, setBillingType] = useState('FIXED_FEE')
  const [dueDate, setDueDate] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/financial/mock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ page: 1, limit: 100 })
        })
        
        const result = await response.json()
        const foundInvoice = result.invoices?.find((inv: Invoice) => inv.id === params.id)
        
        if (foundInvoice) {
          setInvoice(foundInvoice)
          setAmount(foundInvoice.amount)
          setTaxRate((foundInvoice.taxAmount / foundInvoice.amount) * 100)
          setStatus(foundInvoice.status)
          setBillingType(foundInvoice.billingType)
          setDueDate(foundInvoice.dueDate)
          setDescription(foundInvoice.description || '')
          setError(null)
        } else {
          setError('Invoice not found')
        }
      } catch (err) {
        console.error('Error fetching invoice:', err)
        setError('Failed to load invoice')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchInvoice()
    }
  }, [params.id])

  const calculateTotal = () => {
    const taxAmount = (amount * taxRate) / 100
    return amount + taxAmount
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // In a real app, you'd call: await fetch(`/api/invoices/${params.id}`, { method: 'PUT', ... })
      
      // Show success message and redirect
      alert('Invoice updated successfully!')
      router.push(`/project-manager/financial/invoices/${params.id}`)
    } catch (err) {
      console.error('Error saving invoice:', err)
      alert('Failed to save invoice')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        <div className="container mx-auto max-w-4xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-700 rounded w-64"></div>
            <div className="h-96 bg-slate-800 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        <div className="container mx-auto max-w-4xl">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-12 text-center">
              <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Invoice Not Found</h2>
              <p className="text-slate-400 mb-6">{error || 'The invoice you are looking for does not exist.'}</p>
              <Button asChild>
                <Link href="/project-manager/financial/invoices">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Invoices
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="container mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.back()}
              className="border-slate-600 hover:bg-slate-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">Edit Invoice</h1>
              <p className="text-slate-400">{invoice.invoiceNumber}</p>
            </div>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        {/* Edit Form */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Invoice Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Client Info (Read-only) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Client</Label>
                <Input 
                  value={invoice.client.company || invoice.client.name}
                  disabled
                  className="bg-slate-900/50 border-slate-600 text-slate-400"
                />
              </div>
              <div>
                <Label className="text-slate-300">Project</Label>
                <Input 
                  value={invoice.project?.name || 'N/A'}
                  disabled
                  className="bg-slate-900/50 border-slate-600 text-slate-400"
                />
              </div>
            </div>

            {/* Status and Billing Type */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="SENT">Sent</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                    <SelectItem value="OVERDUE">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300">Billing Type</Label>
                <Select value={billingType} onValueChange={setBillingType}>
                  <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="FIXED_FEE">Fixed Fee</SelectItem>
                    <SelectItem value="HOURLY">Hourly</SelectItem>
                    <SelectItem value="MILESTONE">Milestone</SelectItem>
                    <SelectItem value="RETAINER">Retainer</SelectItem>
                    <SelectItem value="SUBSCRIPTION">Subscription</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Amount and Tax */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Amount ($)</Label>
                <Input 
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="bg-slate-900/50 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300">Tax Rate (%)</Label>
                <Input 
                  type="number"
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  className="bg-slate-900/50 border-slate-600 text-white"
                />
              </div>
            </div>

            {/* Due Date */}
            <div>
              <Label className="text-slate-300">Due Date</Label>
              <Input 
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="bg-slate-900/50 border-slate-600 text-white"
              />
            </div>

            {/* Description */}
            <div>
              <Label className="text-slate-300">Description</Label>
              <Textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="bg-slate-900/50 border-slate-600 text-white"
                placeholder="Enter invoice description..."
              />
            </div>

            {/* Total Preview */}
            <div className="border-t border-slate-700 pt-6">
              <div className="max-w-md ml-auto space-y-2">
                <div className="flex justify-between text-slate-300">
                  <span>Subtotal:</span>
                  <span>${amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Tax ({taxRate}%):</span>
                  <span>${((amount * taxRate) / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-white border-t border-slate-700 pt-2">
                  <span>Total:</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            className="border-slate-600"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}
