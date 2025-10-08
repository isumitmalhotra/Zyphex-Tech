'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  CreditCard, 
  DollarSign, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Send,
  FileText,
  TrendingUp,
  Calendar,
  RefreshCw
} from 'lucide-react';

interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: string;
  processedAt?: Date;
  createdAt: Date;
  paymentReference?: string;
  invoice: {
    invoiceNumber: string;
    client: {
      name: string;
    };
  };
}

interface _PaymentSummary {
  totalAmount: number;
  paidAmount: number;
  remainingBalance: number;
  paymentCount: number;
  lastPaymentDate?: Date;
  status: string;
}

interface PaymentAnalytics {
  totalRevenue: number;
  paymentCount: number;
  averagePayment: number;
  paymentMethods: Record<string, number>;
  monthlyTrends: Record<string, number>;
  clientBreakdown: Record<string, { amount: number; count: number }>;
}

export default function PaymentProcessingDashboard() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pendingPayments, setPendingPayments] = useState<Payment[]>([]);
  const [analytics, setAnalytics] = useState<PaymentAnalytics | null>(null);
  const [_selectedInvoice, _setSelectedInvoice] = useState<string>('');
  const [loading, setLoading] = useState(false);
  
  // Payment creation form state
  const [paymentForm, setPaymentForm] = useState({
    invoiceId: '',
    paymentMethod: 'STRIPE',
    amount: '',
    customAmount: false
  });

  // Reminder form state
  const [reminderForm, setReminderForm] = useState({
    invoiceId: '',
    type: 'overdue',
    customMessage: ''
  });

  // Manual payment form state
  const [_manualPaymentForm, _setManualPaymentForm] = useState({
    invoiceId: '',
    paymentMethod: 'BANK_TRANSFER',
    amount: '',
    reference: '',
    notes: ''
  });

  useEffect(() => {
    loadPaymentData();
    loadPendingPayments();
    loadAnalytics();
  }, []);

  const loadPaymentData = async () => {
    try {
      // Mock data - replace with actual API calls
      const mockPayments: Payment[] = [
        {
          id: '1',
          invoiceId: 'inv-001',
          amount: 2500.00,
          currency: 'USD',
          paymentMethod: 'STRIPE',
          status: 'COMPLETED',
          processedAt: new Date('2024-01-15'),
          createdAt: new Date('2024-01-15'),
          paymentReference: 'pi_1234567890',
          invoice: {
            invoiceNumber: 'INV-001',
            client: { name: 'Acme Corp' }
          }
        },
        {
          id: '2',
          invoiceId: 'inv-002',
          amount: 1750.00,
          currency: 'USD',
          paymentMethod: 'PAYPAL',
          status: 'COMPLETED',
          processedAt: new Date('2024-01-14'),
          createdAt: new Date('2024-01-14'),
          paymentReference: 'PAYPAL-123456',
          invoice: {
            invoiceNumber: 'INV-002',
            client: { name: 'Tech Solutions Inc' }
          }
        }
      ];
      setPayments(mockPayments);
    } catch (error) {
      // Failed to load payment data
    }
  };

  const loadPendingPayments = async () => {
    try {
      // Mock data - replace with actual API calls
      const mockPendingPayments: Payment[] = [
        {
          id: '3',
          invoiceId: 'inv-003',
          amount: 3200.00,
          currency: 'USD',
          paymentMethod: 'BANK_TRANSFER',
          status: 'PENDING',
          createdAt: new Date('2024-01-16'),
          paymentReference: 'TXN-789012',
          invoice: {
            invoiceNumber: 'INV-003',
            client: { name: 'Global Enterprises' }
          }
        }
      ];
      setPendingPayments(mockPendingPayments);
    } catch (error) {
      // Failed to load pending payments
    }
  };

  const loadAnalytics = async () => {
    try {
      // Mock data - replace with actual API calls
      const mockAnalytics: PaymentAnalytics = {
        totalRevenue: 15750.00,
        paymentCount: 8,
        averagePayment: 1968.75,
        paymentMethods: {
          'STRIPE': 8500.00,
          'PAYPAL': 4250.00,
          'BANK_TRANSFER': 3000.00
        },
        monthlyTrends: {
          '2024-01': 15750.00,
          '2023-12': 12300.00,
          '2023-11': 9800.00
        },
        clientBreakdown: {
          'Acme Corp': { amount: 7500.00, count: 3 },
          'Tech Solutions Inc': { amount: 4250.00, count: 2 },
          'Global Enterprises': { amount: 4000.00, count: 3 }
        }
      };
      setAnalytics(mockAnalytics);
    } catch (error) {
      // Failed to load analytics
    }
  };

  const handleCreatePayment = async () => {
    try {
      setLoading(true);
      
      // Mock API call - replace with actual implementation
      
      // Reset form
      setPaymentForm({
        invoiceId: '',
        paymentMethod: 'STRIPE',
        amount: '',
        customAmount: false
      });
      
      await loadPaymentData();
    } catch (error) {
      console.error('Failed to create payment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminder = async () => {
    try {
      setLoading(true);
      
      // Mock API call - replace with actual implementation
      
      // Reset form
      setReminderForm({
        invoiceId: '',
        type: 'overdue',
        customMessage: ''
      });
    } catch (error) {
      // Failed to send reminder
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePayment = async (paymentId: string) => {
    try {
      setLoading(true);
      
      // Mock API call - replace with actual implementation
      
      await loadPendingPayments();
      await loadPaymentData();
    } catch (error) {
      // Failed to approve payment
    } finally {
      setLoading(false);
    }
  };

  const handleRejectPayment = async (paymentId: string) => {
    try {
      setLoading(true);
      
      // Mock API call - replace with actual implementation
      
      await loadPendingPayments();
    } catch (error) {
      // Failed to reject payment
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'FAILED':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      case 'REFUNDED':
        return <Badge className="bg-gray-100 text-gray-800"><RefreshCw className="w-3 h-3 mr-1" />Refunded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'STRIPE':
      case 'CREDIT_CARD':
        return <CreditCard className="w-4 h-4" />;
      case 'PAYPAL':
        return <DollarSign className="w-4 h-4" />;
      case 'BANK_TRANSFER':
      case 'WIRE_TRANSFER':
        return <FileText className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Payment Processing</h1>
          <p className="text-gray-600">Manage payments, reminders, and financial processing</p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <CreditCard className="w-4 h-4 mr-2" />
                Create Payment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Payment</DialogTitle>
                <DialogDescription>
                  Generate a payment link or process a payment for an invoice
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="invoice-select">Invoice</Label>
                  <Select value={paymentForm.invoiceId} onValueChange={(value) => setPaymentForm(prev => ({ ...prev, invoiceId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select invoice" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inv-001">INV-001 - Acme Corp ($2,500)</SelectItem>
                      <SelectItem value="inv-002">INV-002 - Tech Solutions ($1,750)</SelectItem>
                      <SelectItem value="inv-003">INV-003 - Global Enterprises ($3,200)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="payment-method">Payment Method</Label>
                  <Select value={paymentForm.paymentMethod} onValueChange={(value) => setPaymentForm(prev => ({ ...prev, paymentMethod: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STRIPE">Stripe (Credit Card)</SelectItem>
                      <SelectItem value="PAYPAL">PayPal</SelectItem>
                      <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                      <SelectItem value="CHECK">Check</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {paymentForm.customAmount && (
                  <div>
                    <Label htmlFor="amount">Custom Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="custom-amount"
                    checked={paymentForm.customAmount}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, customAmount: e.target.checked }))}
                  />
                  <Label htmlFor="custom-amount">Custom amount (partial payment)</Label>
                </div>

                <Button onClick={handleCreatePayment} disabled={loading} className="w-full">
                  {loading ? 'Creating...' : 'Create Payment'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Send className="w-4 h-4 mr-2" />
                Send Reminder
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Send Payment Reminder</DialogTitle>
                <DialogDescription>
                  Send automated payment reminder to client
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="reminder-invoice">Invoice</Label>
                  <Select value={reminderForm.invoiceId} onValueChange={(value) => setReminderForm(prev => ({ ...prev, invoiceId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select invoice" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inv-001">INV-001 - Acme Corp (Due)</SelectItem>
                      <SelectItem value="inv-002">INV-002 - Tech Solutions (Overdue)</SelectItem>
                      <SelectItem value="inv-003">INV-003 - Global Enterprises (Pending)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="reminder-type">Reminder Type</Label>
                  <Select value={reminderForm.type} onValueChange={(value) => setReminderForm(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="before_due">Before Due Date</SelectItem>
                      <SelectItem value="overdue">Overdue Notice</SelectItem>
                      <SelectItem value="final">Final Notice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="custom-message">Custom Message (Optional)</Label>
                  <Textarea
                    id="custom-message"
                    placeholder="Add custom message to reminder..."
                    value={reminderForm.customMessage}
                    onChange={(e) => setReminderForm(prev => ({ ...prev, customMessage: e.target.value }))}
                  />
                </div>

                <Button onClick={handleSendReminder} disabled={loading} className="w-full">
                  {loading ? 'Sending...' : 'Send Reminder'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${analytics.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.paymentCount} payments processed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Payment</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${analytics.averagePayment.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Per transaction
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingPayments.length}</div>
              <p className="text-xs text-muted-foreground">
                Manual payments to review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${Object.values(analytics.monthlyTrends)[0]?.toLocaleString() || '0'}
              </div>
              <p className="text-xs text-muted-foreground">
                Current month revenue
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="payments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="payments">Recent Payments</TabsTrigger>
          <TabsTrigger value="pending">Pending Review</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reminders">Payment Reminders</TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Payments</CardTitle>
              <CardDescription>
                All processed payments and transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        {getPaymentMethodIcon(payment.paymentMethod)}
                      </div>
                      <div>
                        <div className="font-medium">{payment.invoice.invoiceNumber} - {payment.invoice.client.name}</div>
                        <div className="text-sm text-gray-600">
                          {payment.paymentMethod} • {payment.paymentReference}
                        </div>
                        <div className="text-xs text-gray-500">
                          {payment.processedAt?.toLocaleDateString() || payment.createdAt.toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="font-medium">${payment.amount.toLocaleString()}</div>
                        <div className="text-sm text-gray-600">{payment.currency}</div>
                      </div>
                      {getStatusBadge(payment.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-yellow-600" />
                Pending Manual Payments
              </CardTitle>
              <CardDescription>
                Payments requiring manual verification and approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        {getPaymentMethodIcon(payment.paymentMethod)}
                      </div>
                      <div>
                        <div className="font-medium">{payment.invoice.invoiceNumber} - {payment.invoice.client.name}</div>
                        <div className="text-sm text-gray-600">
                          {payment.paymentMethod} • {payment.paymentReference}
                        </div>
                        <div className="text-xs text-gray-500">
                          Received: {payment.createdAt.toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="font-medium">${payment.amount.toLocaleString()}</div>
                        <div className="text-sm text-gray-600">{payment.currency}</div>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleApprovePayment(payment.id)}
                          disabled={loading}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleRejectPayment(payment.id)}
                          disabled={loading}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {pendingPayments.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No pending payments to review
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {analytics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Methods</CardTitle>
                  <CardDescription>Revenue breakdown by payment method</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(analytics.paymentMethods).map(([method, amount]) => (
                      <div key={method} className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          {getPaymentMethodIcon(method)}
                          <span className="font-medium">{method}</span>
                        </div>
                        <span className="font-medium">${amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Clients</CardTitle>
                  <CardDescription>Highest paying clients by revenue</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(analytics.clientBreakdown)
                      .sort(([,a], [,b]) => b.amount - a.amount)
                      .slice(0, 5)
                      .map(([client, data]) => (
                      <div key={client} className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{client}</div>
                          <div className="text-sm text-gray-600">{data.count} payments</div>
                        </div>
                        <span className="font-medium">${data.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="reminders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Reminder System</CardTitle>
              <CardDescription>
                Automated payment reminders and late fee management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Reminder Schedule</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div>• 3 days before due date</div>
                        <div>• On due date</div>
                        <div>• 7 days after due date</div>
                        <div>• 14 days after due date</div>
                        <div>• Final notice (21 days)</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Late Fees</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div>• 5% per month overdue</div>
                        <div>• 7-day grace period</div>
                        <div>• Auto-application</div>
                        <div>• Manual waiver option</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Notifications</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div>• Email reminders</div>
                        <div>• SMS notifications</div>
                        <div>• Custom templates</div>
                        <div>• Multi-language support</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Button className="w-full md:w-auto">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Process Automated Reminders
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}