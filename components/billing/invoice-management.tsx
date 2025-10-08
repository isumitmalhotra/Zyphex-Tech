'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  FileText, 
  Clock, 
  Send, 
  Download, 
  Calendar,
  DollarSign,
  Eye,
  Edit,
  Plus,
  Settings,
  RefreshCw
} from 'lucide-react'
import type { InvoiceTemplate } from '@/lib/billing/simple-invoice-generator'

// Mock data for invoices
const mockInvoices = [
  {
    id: '1',
    invoiceNumber: 'INV-2024-001',
    clientName: 'Acme Corp',
    projectName: 'Website Redesign',
    amount: 4500,
    total: 4950,
    currency: 'USD',
    status: 'SENT',
    dueDate: new Date('2024-02-15'),
    createdAt: new Date('2024-01-15'),
    billingType: 'HOURLY'
  },
  {
    id: '2',
    invoiceNumber: 'INV-2024-002',
    clientName: 'TechStart Inc',
    projectName: 'Mobile App',
    amount: 8000,
    total: 8800,
    currency: 'USD',
    status: 'DRAFT',
    dueDate: new Date('2024-02-20'),
    createdAt: new Date('2024-01-20'),
    billingType: 'MILESTONE_BASED'
  },
  {
    id: '3',
    invoiceNumber: 'INV-2024-003',
    clientName: 'Enterprise Ltd',
    projectName: 'Retainer Services',
    amount: 5000,
    total: 5500,
    currency: 'USD',
    status: 'PAID',
    dueDate: new Date('2024-01-31'),
    createdAt: new Date('2024-01-01'),
    billingType: 'RETAINER'
  }
]

const mockProjects = [
  { id: '1', name: 'Website Redesign', client: 'Acme Corp' },
  { id: '2', name: 'Mobile App Development', client: 'TechStart Inc' },
  { id: '3', name: 'Database Migration', client: 'Enterprise Ltd' }
]

const mockClients = [
  { id: '1', name: 'Acme Corp', email: 'billing@acme.com' },
  { id: '2', name: 'TechStart Inc', email: 'finance@techstart.com' },
  { id: '3', name: 'Enterprise Ltd', email: 'accounts@enterprise.com' }
]

const exchangeRates = {
  'USD-EUR': 0.85,
  'USD-GBP': 0.73,
  'USD-CAD': 1.25
}

export default function InvoiceManagementDashboard() {
  const [activeTab, setActiveTab] = useState('invoices')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [_selectedInvoice, _setSelectedInvoice] = useState<string | null>(null)
  const [invoiceType, setInvoiceType] = useState<'TIME_BASED' | 'MILESTONE' | 'RETAINER'>('TIME_BASED')
  
  // Form state for invoice creation
  const [formData, setFormData] = useState({
    projectId: '',
    clientId: '',
    startDate: '',
    endDate: '',
    milestoneIds: [] as string[],
    amount: 0,
    frequency: 'MONTHLY',
    currency: 'USD',
    dueDate: '',
    notes: '',
    sendEmail: true,
    template: 'default'
  })

  // Template state
  const [template, setTemplate] = useState<InvoiceTemplate>({
    id: 'default',
    name: 'Default Template',
    companyName: 'Zyphex Technologies',
    companyAddress: '123 Business Street, City, State 12345',
    companyEmail: 'billing@zyphex.com',
    companyPhone: '+1 (555) 123-4567',
    headerColor: '#2563eb',
    accentColor: '#3b82f6',
    footerText: 'Thank you for your business!',
    termsAndConditions: 'Payment is due within 30 days of invoice date.'
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800'
      case 'SENT': return 'bg-blue-100 text-blue-800'
      case 'PAID': return 'bg-green-100 text-green-800'
      case 'OVERDUE': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const calculateTotalRevenue = () => {
    return mockInvoices
      .filter(inv => inv.status === 'PAID')
      .reduce((sum, inv) => sum + inv.total, 0)
  }

  const calculatePendingAmount = () => {
    return mockInvoices
      .filter(inv => inv.status === 'SENT')
      .reduce((sum, inv) => sum + inv.total, 0)
  }

  const handleCreateInvoice = async () => {
    try {
      // Here you would call the actual invoice generation service
      // const invoiceGenerator = new InvoiceGeneratorService(prisma)
      // let invoice;
      
      // switch (invoiceType) {
      //   case 'TIME_BASED':
      //     invoice = await invoiceGenerator.generateTimeBasedInvoice(
      //       formData.projectId,
      //       new Date(formData.startDate),
      //       new Date(formData.endDate),
      //       {
      //         currency: formData.currency,
      //         dueDate: new Date(formData.dueDate),
      //         sendEmail: formData.sendEmail,
      //         notes: formData.notes
      //       }
      //     )
      //     break;
      //   case 'MILESTONE':
      //     invoice = await invoiceGenerator.generateMilestoneInvoice(
      //       formData.projectId,
      //       formData.milestoneIds,
      //       { ... }
      //     )
      //     break;
      //   case 'RETAINER':
      //     invoice = await invoiceGenerator.generateRetainerInvoice(
      //       formData.clientId,
      //       formData.amount,
      //       formData.frequency,
      //       { ... }
      //     )
      //     break;
      // }

      setShowCreateDialog(false)
      // Refresh invoice list
      
    } catch (error) {
      // Error creating invoice - handle or show user notification
    }
  }

  const handleSendInvoice = async (invoiceId: string) => {
    try {
      // API call to send invoice - implementation needed
      const _id = invoiceId; // Use the invoice ID
    } catch (error) {
      // Error sending invoice - handle or show user notification
    }
  }

  const _convertCurrency = (amount: number, fromCurrency: string, toCurrency: string) => {
    if (fromCurrency === toCurrency) return amount
    const rateKey = `${fromCurrency}-${toCurrency}` as keyof typeof exchangeRates
    return amount * (exchangeRates[rateKey] || 1)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Invoice Management</h1>
          <p className="text-muted-foreground">
            Automated invoice generation and multi-currency support
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowTemplateDialog(true)}
            variant="outline"
          >
            <Settings className="h-4 w-4 mr-2" />
            Templates
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${calculateTotalRevenue().toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              From paid invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${calculatePendingAmount().toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting payment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockInvoices.filter(inv => inv.status === 'DRAFT').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Ready to send
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockInvoices.length}</div>
            <p className="text-xs text-muted-foreground">
              Invoices created
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="invoices">All Invoices</TabsTrigger>
          <TabsTrigger value="recurring">Recurring</TabsTrigger>
          <TabsTrigger value="currency">Multi-Currency</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice List</CardTitle>
              <CardDescription>Manage all your invoices in one place</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockInvoices.map((invoice) => (
                  <Card key={invoice.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{invoice.invoiceNumber}</h4>
                            <Badge className={getStatusColor(invoice.status)}>
                              {invoice.status}
                            </Badge>
                            <Badge variant="outline">
                              {invoice.billingType}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {invoice.clientName} - {invoice.projectName}
                          </p>
                          <p className="text-sm">
                            Due: {invoice.dueDate.toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="font-bold text-lg">
                            ${invoice.total.toLocaleString()} {invoice.currency}
                          </p>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Download className="h-4 w-4" />
                            </Button>
                            {invoice.status === 'DRAFT' && (
                              <Button 
                                size="sm"
                                onClick={() => handleSendInvoice(invoice.id)}
                              >
                                <Send className="h-4 w-4 mr-2" />
                                Send
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recurring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recurring Invoice Automation</CardTitle>
              <CardDescription>Set up automatic billing for retainer clients</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">Acme Corp - Monthly Retainer</h4>
                          <p className="text-sm text-muted-foreground">$5,000/month</p>
                          <p className="text-sm">Next: Feb 1, 2024</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                          <Button size="sm" variant="outline">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">TechStart - Quarterly Support</h4>
                          <p className="text-sm text-muted-foreground">$12,000/quarter</p>
                          <p className="text-sm">Next: Apr 1, 2024</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                          <Button size="sm" variant="outline">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Recurring Invoice
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="currency" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Multi-Currency Support</CardTitle>
              <CardDescription>Exchange rates and currency conversion</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <h4 className="font-semibold">USD to EUR</h4>
                      <p className="text-2xl font-bold">0.85</p>
                      <p className="text-sm text-muted-foreground">Updated 1 hour ago</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 text-center">
                      <h4 className="font-semibold">USD to GBP</h4>
                      <p className="text-2xl font-bold">0.73</p>
                      <p className="text-sm text-muted-foreground">Updated 1 hour ago</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 text-center">
                      <h4 className="font-semibold">USD to CAD</h4>
                      <p className="text-2xl font-bold">1.25</p>
                      <p className="text-sm text-muted-foreground">Updated 1 hour ago</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-4">Currency Conversion Calculator</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-2">
                      <Label>Amount</Label>
                      <Input type="number" placeholder="1000" />
                    </div>
                    <div className="space-y-2">
                      <Label>From</Label>
                      <Select defaultValue="USD">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                          <SelectItem value="CAD">CAD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>To</Label>
                      <Select defaultValue="EUR">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                          <SelectItem value="CAD">CAD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Convert
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Invoice Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Invoice</DialogTitle>
            <DialogDescription>
              Generate automated invoices from time entries, milestones, or retainer agreements
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Invoice Type</Label>
              <Select value={invoiceType} onValueChange={(value: 'TIME_BASED' | 'MILESTONE' | 'RETAINER') => setInvoiceType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TIME_BASED">Time-based (Hourly)</SelectItem>
                  <SelectItem value="MILESTONE">Milestone-based</SelectItem>
                  <SelectItem value="RETAINER">Retainer/Recurring</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {invoiceType === 'TIME_BASED' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Project</Label>
                  <Select value={formData.projectId} onValueChange={(value) => setFormData({...formData, projectId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockProjects.map(project => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name} - {project.client}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={formData.currency} onValueChange={(value) => setFormData({...formData, currency: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="CAD">CAD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input 
                    type="date" 
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input 
                    type="date" 
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  />
                </div>
              </div>
            )}

            {invoiceType === 'RETAINER' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Client</Label>
                  <Select value={formData.clientId} onValueChange={(value) => setFormData({...formData, clientId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockClients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input 
                    type="number" 
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select value={formData.frequency} onValueChange={(value) => setFormData({...formData, frequency: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                      <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={formData.currency} onValueChange={(value) => setFormData({...formData, currency: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="CAD">CAD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea 
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Additional notes for the invoice..."
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="sendEmail"
                checked={formData.sendEmail}
                onCheckedChange={(checked) => setFormData({...formData, sendEmail: checked as boolean})}
              />
              <Label htmlFor="sendEmail">Send email automatically</Label>
            </div>

            <div className="flex justify-end space-x-4">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateInvoice}>
                Create Invoice
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Invoice Template Customization</DialogTitle>
            <DialogDescription>
              Customize your company branding and invoice templates
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input 
                  value={template.companyName}
                  onChange={(e) => setTemplate({...template, companyName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Company Address</Label>
                <Textarea 
                  value={template.companyAddress}
                  onChange={(e) => setTemplate({...template, companyAddress: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input 
                  type="email"
                  value={template.companyEmail}
                  onChange={(e) => setTemplate({...template, companyEmail: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input 
                  value={template.companyPhone}
                  onChange={(e) => setTemplate({...template, companyPhone: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Header Color</Label>
                <Input 
                  type="color"
                  value={template.headerColor}
                  onChange={(e) => setTemplate({...template, headerColor: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Accent Color</Label>
                <Input 
                  type="color"
                  value={template.accentColor}
                  onChange={(e) => setTemplate({...template, accentColor: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Footer Text</Label>
                <Textarea 
                  value={template.footerText}
                  onChange={(e) => setTemplate({...template, footerText: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Terms & Conditions</Label>
                <Textarea 
                  value={template.termsAndConditions}
                  onChange={(e) => setTemplate({...template, termsAndConditions: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
              Cancel
            </Button>
            <Button>
              Save Template
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}